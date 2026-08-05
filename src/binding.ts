import { utils } from "./utils";
import { extDom } from "./dom";
import { locate, wireLocator } from "./locator";
import { proxy, updateValue, isLinkedRef } from "./reactivity";
import { warn, warnMultiMatch, warnUnknownKey, error } from "./log";
import { config } from "./config";
import { doItems } from "./template";
import type { M2d2Node } from "./types";

// Wire the locator's extDom reference. This is safe at module init because
// wireLocator only stores the function reference (doesn't call extDom).
wireLocator(extDom);

/**
 * Coerce a plain value into an object spec, guessing the target property.
 * E.g. string on <input> → {value: str}; string on <span> → {text: str}.
 * Ported from m2d2.src.js:606-646.
 */
export function coerce(node: M2d2Node, value: unknown): unknown {
    if (utils.isPlainObject(value) || utils.isFunction(value) || utils.isElement(value)) {
        return value;
    }
    if (utils.isHtml(value)) {
        return { html: value };
    }
    if (isLinkedRef(value)) {
        // Linked ref: expand into per-key objects
        const obj = value[0] as Record<string, unknown>;
        const prop = value[1];
        const callback = (value.length === 3 ? value[2] : (v: unknown) => v) as (v: unknown) => unknown;
        const tmpVal = coerce(node, callback(obj[prop]));
        if (utils.isPlainObject(tmpVal)) {
            const newValue: Record<string, unknown> = {};
            Object.keys(tmpVal as object).forEach((k) => {
                newValue[k] = value;
            });
            return newValue;
        }
        return value;
    }
    if (utils.isArray(value)) {
        return { items: value };
    }
    if (utils.hasAttrOrProp(node, "value")) {
        if (node.tagName === "SELECT") {
            return { value: value, text: value };
        }
        if (node.tagName === "BUTTON") {
            return { text: value };
        }
        return { value: value };
    }
    if (utils.isString(value) && node.tagName === "IMG") {
        return { src: value };
    }
    if (utils.isString(value) && node.tagName === "A" && node.hasAttribute("href")) {
        return { href: value };
    }
    if (utils.isString(value) || utils.isNumeric(value)) {
        return { text: value };
    }
    return value;
}

/**
 * Check if a value matches the type of a node's property/attribute.
 * Replaces the switch(true) cascade in m2d2.src.js:380-395.
 */
function matchesType(node: M2d2Node, key: string, value: unknown): boolean {
    const existing = (node as any)[key];
    // Special case: value → valueAsDate for dates:
    if (key === "value" && utils.hasProp(node, "valueAsDate") && value instanceof Date) return true;
    // css is a special proxy property:
    if (key === "css") return true;
    // Same typeof (excluding undefined):
    if (typeof value === typeof existing && typeof value !== "undefined") return true;
    // Numeric value to string property:
    if (utils.isString(existing) && utils.isNumeric(value)) return true;
    // Function value to object property:
    if (utils.isFunction(value) && utils.isObject(existing)) return true;
    // Boolean value to string property:
    if (utils.isBool(value) && utils.isString(existing)) return true;
    // Object property on INPUT (like "list"):
    if (typeof existing === "object" && existing !== null && node.tagName === "INPUT") return true;
    return false;
}

/** Create a new element inside node and return it. */
function appendElement(node: M2d2Node, tagName: string): HTMLElement {
    const newElem = utils.newElement(tagName);
    node.append(newElem);
    return newElem;
}

/**
 * Link a child node to a parent via the key shortcut.
 * Handles conflict resolution: if key collides with existing prop, use $key.
 * Ported from m2d2.src.js:679-695.
 */
export function linkNode(node: M2d2Node, key: string, child: M2d2Node | M2d2Node[]): void {
    if (Array.isArray(child)) {
        // Multiple matches: just set the array link
        if (!utils.hasAttrOrProp(node, key)) {
            (node as any)[key] = child;
        } else {
            (node as any)["$" + key] = child;
            console.warn("[m2d2] Property [" + key + "] existed. Using $" + key + " instead.");
        }
        return;
    }
    if ((node as any)[key] === child) {
        const $proxy = proxy(child);
        try {
            (node as any)[key] = $proxy;
        } catch {
            // Some elements (forms) can't be reassigned; they're proxies already.
        }
        (node as any)["$" + key] = $proxy;
    } else if (utils.hasAttrOrProp(node, key)) {
        (node as any)["$" + key] = child;
        console.warn(
            "[m2d2] Property [" + key + "] existed in node: " + node.tagName +
            ". Using $" + key + " instead for node: " + child.tagName + "."
        );
    } else {
        (node as any)[key] = proxy(child);
    }
}

/**
 * Render a value into a child node (recursive).
 */
export function render(node: M2d2Node, key: string, value: unknown): M2d2Node {
    const coerced = coerce(node, value);
    return doDom(node, coerced as Record<string, unknown>) as M2d2Node;
}

/** Render and link in one step. */
export function renderAndLink(root: M2d2Node, node: M2d2Node, key: string, value: unknown): void {
    const child = render(node, key, value);
    linkNode(root, key, child);
}

/**
 * Assign a value to a property or attribute.
 * Handles classList, style, dataset specially.
 */
function assignPropAttr(node: M2d2Node, key: string, value: unknown): void {
    let errorFlag = false;
    switch (key) {
        case "classList":
            if (utils.isArray(value)) {
                (value as unknown[]).forEach((v) => node.classList.add(v as string));
            } else if (utils.isString(value)) {
                node.classList.add(value);
            } else {
                errorFlag = true;
            }
            break;
        case "style":
        case "dataset": {
            if (utils.isPlainObject(value)) {
                const valObj = value as Record<string, unknown>;
                Object.keys(valObj).forEach((k) => {
                    (node as any)[key][k] = updateValue((node as any)[key] as M2d2Node, k, valObj[k]);
                });
            } else {
                errorFlag = true;
            }
            break;
        }
        default:
            if (utils.isBool(value) || utils.hasAttrOrProp(node, key)) {
                utils.setPropOrAttr(node, key, value);
            } else {
                (node as any)[key] = value;
            }
    }
    if (errorFlag) {
        error("Invalid value passed to '" + key + "':", value, "Into node:", node);
    }
}

/**
 * Handle the case where no child element matched: create nodes, items, or warn.
 * Ported from m2d2.src.js:498-561. Changed: unknown keys warn+skip (not assign).
 */
function handleNoMatch(node: M2d2Node, key: string, value: unknown, obj: Record<string, unknown>): void {
    // Make "items" optional when template is set:
    if (key === "template" && obj["items"] === undefined) {
        key = "items";
        value = [];
    }

    const isFunc = utils.isFunction(value);
    const valueObj = value as Record<string, unknown> | undefined;

    if (valueObj && valueObj.tagName !== undefined) {
        // Create child with explicit tagName:
        const newNode = appendElement(node, valueObj.tagName as string);
        renderAndLink(node, extDom(newNode)!, key, value);
    } else if (utils.isValidElement(key) && !isFunc) {
        // Create child by tag name:
        const newNode = appendElement(node, key);
        renderAndLink(node, extDom(newNode)!, key, value);
    } else if (key === "items") {
        // Items creation:
        const template = obj["template"];
        // Capture the optional reconciliation key (string field name or function):
        if ((node as any)._itemKey === undefined && obj["key"] !== undefined) {
            utils.defineProp(node, "_itemKey", obj["key"]);
        }
        if (utils.isPlainObject(value)) {
            // Convert plain object to value→text array (original: m2d2.src.js:514-531):
            const valTmp: unknown[] = [];
            Object.keys(value as object).forEach((o) => {
                let itemObj: Record<string, unknown>;
                if (node.tagName === "DL") {
                    itemObj = { dt: o, dd: (value as Record<string, unknown>)[o] };
                } else {
                    itemObj = { text: (value as Record<string, unknown>)[o] };
                    if (utils.hasAttrOrProp(node, "value")) {
                        itemObj.value = o;
                    } else {
                        itemObj.dataset = { id: o };
                    }
                }
                valTmp.push(itemObj);
            });
            value = valTmp;
        }
        if (utils.isArray(value)) {
            doItems(node, value, template);
        } else {
            console.warn("[m2d2] 'items' specified but value is not an array:", node, value);
        }
    } else if (isFunc) {
        // Event handler:
        if (config.updates && key === "onupdate") {
            node.addEventListener("update", value as EventListener, true);
        }
        (node as any)[key] = value;
    } else if (key !== "template" && !(key === "warn" && value === false)) {
        // FIX: unknown key → warn + SKIP (was: warn + assign node[key]=value)
        warnUnknownKey(node, key, obj);
    }
}

/**
 * The core binding function. Iterates an object spec and assigns each key
 * to a property, attribute, or child element of the node.
 * Ported from m2d2.src.js:337-574 with fixes.
 */
export function doDom(selector: unknown, object?: unknown): M2d2Node | null {
    // Shape: $(plainObject) → fragment
    if (utils.isObject(selector) && object === undefined) {
        object = selector;
        selector = utils.newEmptyNode();
        if ((object as Record<string, unknown>).warn === undefined) {
            (object as Record<string, unknown>).warn = false;
        }
    }
    // Validate selector:
    if (!(utils.isString(selector) || utils.isElement(selector) || utils.isNode(selector))) {
        error("Selector is not a string or a Node:", selector);
        return null;
    }
    if (utils.isString(selector) && !document.querySelector(selector as string)) {
        console.warn("[m2d2] Selected element doesn't exist:", selector);
        return null;
    }

    const node = extDom(selector);
    if (!node) return null;

    // Shape: $(selector) → just extend (no object)
    if (object === undefined) {
        return node;
    }

    // Shape: $(selector, htmlString) → set innerHTML
    if (utils.isString(object) && utils.isHtml(object)) {
        node.innerHTML = object;
        return node;
    }

    const obj = coerce(node, object) as Record<string, unknown>;
    if (!utils.isPlainObject(obj)) {
        return node;
    }

    // Iterate keys (skip tagName). Also skip `key` in an items/template context,
    // where it declares the reconciliation key (captured in handleNoMatch):
    Object.keys(obj)
        .filter((key) => {
            if (key === "tagName") return false;
            if (key === "key" && (obj.items !== undefined || obj.template !== undefined)) return false;
            return true;
        })
        .forEach((key) => {
            let origValue = obj[key];
            if (origValue === undefined || origValue === null) {
                warn(obj, "Value was not set for key: [" + key + "]. Using empty string.");
                origValue = "";
            }

            // Resolve linked refs:
            let value = updateValue(node, key, origValue);

            const isProp = utils.hasProp(node, key);
            const isAttr = utils.hasAttr(node, key);

            // Check if it's a property/attribute match:
            let foundMatch = false;
            if (isAttr || isProp) {
                foundMatch = matchesType(node, key, value);
            }

            if (foundMatch) {
                assignPropAttr(node, key, value);
            } else {
                // Look for child elements:
                const { matched, ambiguous } = locate(node, key, value);

                if (matched.length > 1) {
                    const items: M2d2Node[] = [];
                    matched.forEach((item) => {
                        items.push(render(item, key, value));
                    });
                    linkNode(node, key, items);
                    if (utils.isPlainObject(value)) {
                        warnMultiMatch(node, key, value as Record<string, unknown>);
                    }
                } else if (matched.length === 1) {
                    const opt = matched[0];
                    if (utils.isElement(opt)) {
                        // Re-coerce for this specific child:
                        const childObj = coerce(opt, value);
                        const childKey =
                            utils.isPlainObject(childObj) && Object.keys(childObj as object).length >= 1
                                ? Object.keys(childObj as object)[0]
                                : null;
                        if (childKey) {
                            value = updateValue(opt, childKey, origValue);
                        }
                        if (utils.isArray(value)) {
                            doItems(opt, value, obj["template"]);
                            linkNode(node, key, opt);
                        } else {
                            renderAndLink(node, opt, key, value);
                        }
                    }
                } else {
                    // No match: creation path
                    handleNoMatch(node, key, value, obj);
                }
            }
        });

    // Dispatch onload for non-native-load tags:
    if ((node as any).onload) {
        const nativeTags = ["BODY", "FRAME", "IFRAME", "IMG", "LINK", "SCRIPT", "STYLE"];
        const isNative = nativeTags.indexOf(node.tagName) >= 0;
        const isInputImage = node.tagName === "INPUT" && (node as unknown as HTMLInputElement).type === "image";
        if (!(isNative || isInputImage)) {
            node.dispatchEvent(new CustomEvent("load"));
        }
    }

    return node;
}
