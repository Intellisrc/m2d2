import { utils } from "./utils";
import { config } from "./config";
import { error } from "./log";
import type { M2d2Node, UpdateDetail } from "./types";

/**
 * WeakMaps so linked refs can resolve dataset/style objects back to their
 * parent node. Replaces the parallel arrays in the original _stored
 * (m2d2.src.js:10-16) — these are GC-friendly (entries vanish with the node).
 */
const datasetToNode = new WeakMap<DOMStringMap, M2d2Node>();
const styleToNode = new WeakMap<CSSStyleDeclaration, M2d2Node>();

/** Register a node's dataset/style for linked-ref resolution. */
export function registerSource(node: M2d2Node): void {
    if (node.dataset) datasetToNode.set(node.dataset, node);
    if (node.style) styleToNode.set(node.style, node);
}

/** Find the parent node for a given dataset or style object. */
function findParentBySource(obj: object): M2d2Node | null {
    if (obj instanceof DOMStringMap) return datasetToNode.get(obj) ?? null;
    if (obj instanceof CSSStyleDeclaration) return styleToNode.get(obj) ?? null;
    return null;
}

/**
 * Dedupe store: keyed by target object identity (WeakMap), each holding a Set
 * of recent "property:value" strings with their own timeouts.
 *
 * The dedupe exists to suppress the double-trigger that happens when an element
 * is both proxied AND $-linked (the proxy set and the MutationObserver both fire
 * for the same change). It must key on the *actual target instance* — using only
 * constructor name (as an earlier version did) collapses genuinely distinct
 * nodes of the same type, breaking linked references across test cases / nodes.
 */
const recentPerTarget = new WeakMap<object, Map<string, ReturnType<typeof setTimeout>>>();

function isRecentlyDispatched(target: object, signature: string): boolean {
    const map = recentPerTarget.get(target);
    return !!map && map.has(signature);
}

function rememberDispatch(target: object, signature: string): void {
    let map = recentPerTarget.get(target);
    if (!map) {
        map = new Map();
        recentPerTarget.set(target, map);
    }
    const timer = setTimeout(() => {
        const m = recentPerTarget.get(target);
        if (m) {
            m.delete(signature);
            if (m.size === 0) recentPerTarget.delete(target);
        }
    }, config.storedEventsTimeout);
    map.set(signature, timer);
}

/**
 * Dispatch an "update" CustomEvent on target, with deduplication.
 * Replaces the duplicated dispatch logic in proxy.set and onObserve.
 */
export function dispatchUpdate(target: M2d2Node, detail: UpdateDetail): void {
    if (!config.updates) return;
    if (detail.newValue === detail.oldValue) return;
    // Only dispatch if there's something to receive it:
    //   - a real Element/Node always supports addEventListener natively
    //   - a plain object fragment only if it was given EventTarget capabilities (hasEventListeners)
    //   - or an onupdate handler assigned directly
    const isDomNode = utils.isNode(target) || utils.isElement(target);
    if (
        target.onupdate === undefined &&
        !(target as any).hasEventListeners &&
        !isDomNode
    ) {
        return;
    }

    // Signature is property+value only (target identity handled by the WeakMap key).
    // Use a safe stringify: primitives serialize directly; objects/nodes use a
    // type-based marker to avoid "circular structure" errors on DOM nodes (items
    // updates carry NodeLists whose elements have circular domNode refs).
    const v = detail.newValue;
    let valueKey: string;
    if (v === null || v === undefined) {
        valueKey = String(v);
    } else if (typeof v === "object") {
        valueKey = "[object " + (v.constructor?.name ?? "Object") + "]";
    } else {
        valueKey = String(v);
    }
    const signature = detail.property + "=" + valueKey;
    if (isRecentlyDispatched(target, signature)) return; // deduplicate within the timeout window
    rememberDispatch(target, signature);

    try {
        const event = new CustomEvent("update", { detail });
        target.dispatchEvent(event);
        // Also invoke an onupdate handler assigned directly (not via addEventListener).
        // The proxy's set handler routes onupdate through addEventListener, but raw
        // assignments (e.g. in tests or before proxying) should still fire.
        if (utils.isFunction(target.onupdate)) {
            target.onupdate(event as CustomEvent<UpdateDetail>);
        }
    } catch (e) {
        console.warn("[m2d2] Unable to dispatch update event on:", target, e);
    }
}

/**
 * Guess which property to set on a child node (short assignment).
 * E.g. for an <input>, assigning "foo" sets .value; for <span>, sets .text.
 * Ported from m2d2.src.js:1019-1062.
 */
// These are wired lazily to avoid circular init (binding.ts ↔ reactivity.ts):
let _coerce: ((node: M2d2Node, value: unknown) => unknown) | null = null;
let _doItems: ((node: M2d2Node, values: unknown[], template?: unknown) => void) | null = null;

/** Called by factory.ts after all modules are loaded, to wire circular deps. */
export function wireReactivity(
    coerce: (node: M2d2Node, value: unknown) => unknown,
    doItems: (node: M2d2Node, values: unknown[], template?: unknown) => void
): void {
    _coerce = coerce;
    _doItems = doItems;
}

export function setShortValue(node: M2d2Node, key: string, value: unknown): void {
    const child = (node as any)[key];
    if (utils.isNode(child)) {
        if (config.short && _coerce) {
            const o = _coerce(child as M2d2Node, value);
            const k =
                utils.isPlainObject(o) && Object.keys(o as object).length >= 1
                    ? Object.keys(o as object)[0]
                    : null;
            if (k) {
                (child as any)[k] = value;
            }
        } else {
            console.warn("[m2d2] Short is disabled. Specify the property, e.g. node.text");
        }
    } else {
        (node as any)[key] = value;
    }
}

export function getShortValue(node: M2d2Node, key: string, sample?: unknown): unknown {
    const child = (node as any)[key];
    if (utils.isNode(child)) {
        if (config.short && _coerce) {
            const o = _coerce(child as M2d2Node, sample ?? "");
            const k =
                utils.isPlainObject(o) && Object.keys(o as object).length >= 1
                    ? Object.keys(o as object)[0]
                    : null;
            if (k) {
                return (child as any)[k];
            }
        }
        return null;
    }
    return child;
}

/** Check if a value is a linked ref array [source, "prop"] or [source, "prop", fn]. */
export function isLinkedRef(value: unknown): value is [object, string] | [object, string, Function] {
    if (!utils.isArray(value) || (value.length !== 2 && value.length !== 3)) return false;
    const acceptedType =
        utils.isNode(value[0]) ||
        value[0] instanceof DOMStringMap ||
        value[0] instanceof CSSStyleDeclaration ||
        utils.isObject(value[0]);
    const otherTypes =
        value.length === 2
            ? utils.isString(value[1])
            : utils.isString(value[1]) && utils.isFunction(value[2]);
    return acceptedType && otherTypes;
}

/**
 * Handle [source, "prop"] linked references.
 * Registers a listener on source that updates the target when prop changes.
 * Ported from m2d2.src.js:972-1011.
 */
export function updateValue(node: M2d2Node, key: string, value: unknown): unknown {
    if (!isLinkedRef(value)) return value;

    const source = value[0] as Record<string, unknown> & object;
    const prop = value[1];
    const callback = (value.length === 3 ? value[2] : (v: unknown) => v) as (v: unknown) => unknown;
    const currentValue = source[prop];

    if (source instanceof CSSStyleDeclaration) {
        const parent = findParentBySource(source);
        if (parent && config.updates) {
            parent.addEventListener("update", (ev: Event) => {
                const detail = (ev as CustomEvent<UpdateDetail>).detail;
                if (
                    detail &&
                    detail.property === "style" &&
                    String(detail.newValue).startsWith(prop + ":")
                ) {
                    setShortValue(node, key, callback.call(node, source[prop]));
                }
            });
        }
    } else if (source instanceof DOMStringMap) {
        const parent = findParentBySource(source);
        if (parent && config.updates) {
            parent.addEventListener("update", (ev: Event) => {
                const detail = (ev as CustomEvent<UpdateDetail>).detail;
                if (detail && detail.property === "data-" + prop) {
                    setShortValue(node, key, callback.call(node, detail.newValue));
                }
            });
        }
    } else {
        if (config.updates && utils.isObject(source)) {
            (source as any).addEventListener?.("update", (ev: Event) => {
                const detail = (ev as CustomEvent<UpdateDetail>).detail;
                if (detail && detail.property === prop) {
                    if (!utils.isObject((node as any)[key])) {
                        setShortValue(node, key, callback.call(node, detail.newValue));
                    }
                }
            });
        }
    }
    return currentValue;
}

/**
 * Create a Proxy wrapper around a node for short assignment.
 * Ported from m2d2.src.js:1073-1149 with fixes.
 */
export function proxy<T extends object>(obj: T, force?: boolean): T {
    if (!config.short || obj === null || ((obj as any).domNode !== undefined && force === undefined)) {
        return obj;
    }
    if (utils.isNode(obj)) {
        (obj as any).domNode = obj;
    }
    const handler: ProxyHandler<T> = {
        get(target: any, property: string | symbol): any {
            const t = target[property];
            if (t === null || t === undefined) return null;
            if (utils.isFunction(t)) return t.bind(target);
            if (t?.domNode && target["$" + String(property)] !== undefined) {
                return target["$" + String(property)];
            }
            if (t?.domNode === undefined && utils.isElement(t)) {
                return proxy(t);
            }
            return t;
        },
        set(target: any, property: string, value: any): boolean {
            const prop = String(property);
            let oldValue: unknown = "";

            if (utils.isElement(target[prop])) {
                oldValue = getShortValue(target, prop, value);
                setShortValue(target, prop, value);
            } else if (prop === "onupdate") {
                // FIX: register listener only, don't also set property (was double-firing).
                if (config.updates) {
                    if (utils.isFunction(value)) {
                        if (utils.isNode(target)) {
                            target.addEventListener("update", value, true);
                        }
                    } else {
                        error("Value passed to 'onupdate' is not a function, in node:", target);
                    }
                } else {
                    console.warn("[m2d2] Updates disabled (m2d2.updates=false):", target);
                }
            } else if (prop === "items") {
                // Reset items: clear then re-render.
                (target.items as any)?.clear?.();
                if (_doItems && utils.isArray(value)) {
                    _doItems(target, value);
                }
            } else {
                oldValue = target[prop];
                value = updateValue(target, prop, value);
                target[prop] = value;
            }

            dispatchUpdate(target, {
                type: typeof value,
                property: prop,
                newValue: value,
                oldValue,
            });
            return true;
        },
    };
    return new Proxy(obj, handler);
}

/**
 * MutationObserver callback: translates DOM mutations into "update" events.
 * Ported from m2d2.src.js:1157-1218 with empty-addedNodes guard.
 */
export function onObserve(mutationsList: MutationRecord[]): void {
    mutationsList.forEach((m) => {
        const target = m.target as M2d2Node;
        // Only dispatch if there's something to receive it (mirrors dispatchUpdate's guard):
        //   - a real Element/Node always supports addEventListener natively (linked-ref listeners)
        //   - a plain object fragment only if it was given EventTarget capabilities
        //   - or an onupdate handler assigned directly
        const isDomNode = utils.isNode(target) || utils.isElement(target);
        if (
            target.onupdate === undefined &&
            !(target as any).hasEventListeners &&
            !isDomNode
        ) {
            return;
        }

        if (m.type === "attributes") {
            const value = utils.getAttrOrProp(target as HTMLElement, m.attributeName!);
            if (value !== m.oldValue) {
                dispatchUpdate(target, {
                    type: typeof value,
                    property: m.attributeName!,
                    newValue: value,
                    oldValue: m.oldValue,
                });
            }
        } else if (m.type === "childList") {
            const addedNode = m.addedNodes[0];
            const removedNode = m.removedNodes[0];
            const $child = addedNode || removedNode;
            if ($child && $child.nodeName === "#text") {
                // FIX: guard against empty addedNodes (removal-only mutations).
                const value = addedNode ? addedNode.textContent : null;
                const oldValue = removedNode ? removedNode.textContent : null;
                if (value !== oldValue) {
                    dispatchUpdate(target, {
                        type: typeof value,
                        property: "text",
                        newValue: value,
                        oldValue,
                    });
                }
            } else if ((target as any).items !== undefined) {
                dispatchUpdate(target, {
                    type: "object",
                    property: "items",
                    newValue: m.addedNodes,
                    oldValue: m.removedNodes,
                });
            }
        }
    });
}

/**
 * Attach a MutationObserver to a node.
 * Ported from m2d2.src.js:1224-1235.
 */
export function observe(node: M2d2Node): void {
    if (!config.updates) return;
    const observer = new MutationObserver(onObserve);
    const toObserve = (node as any).domNode || node;
    observer.observe(toObserve, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeOldValue: true,
    });
}
