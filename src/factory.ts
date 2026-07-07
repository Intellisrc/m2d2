import { utils } from "./utils";
import { config, extensions } from "./config";
import { doDom, coerce } from "./binding";
import { proxy, observe, registerSource, wireReactivity } from "./reactivity";
import { wireLocator } from "./locator";
import { extDom } from "./dom";
import { doItems } from "./template";
import type { M2d2Node } from "./types";

// Wire circular dependencies (safe at module init: only stores references):
wireReactivity(coerce, doItems);
wireLocator(extDom);

/** Type alias for the $ factory function (avoids recursive `typeof $` references). */
type Factory = (selector?: unknown, object?: unknown) => unknown;

/**
 * The core $ factory function.
 * Supports four shapes:
 *   $(selector, object)   → bind
 *   $(selector, htmlStr)  → set innerHTML
 *   $(selector)           → extend only
 *   $({ ... })            → detached observable fragment
 *
 * Ported from m2d2.src.js:38-76.
 */
export function $(selector?: unknown, object?: unknown): unknown {
    // Shape 4: plain object → fragment
    if (utils.isPlainObject(selector)) {
        const copy = JSON.parse(JSON.stringify(selector));
        addEventTargetCapabilities(copy);
        return proxy(copy, true);
    }

    // Shapes 1-3: selector path
    const node = getProxyNode(selector, object ?? {});
    if (!node) return null;

    // onready wiring (microtask, replaces setTimeout 10ms):
    if (node.onready && utils.isFunction(node.onready)) {
        const handler = node.onready as EventListener;
        node.addEventListener("ready", handler, { once: true });
        queueMicrotask(() => {
            node.dispatchEvent(new CustomEvent("ready"));
        });
    }

    // Register dataset/style for linked-ref resolution:
    registerSource(node);

    return node;
}

/** Add EventTarget capabilities to a plain object (for fragment reactivity). */
function addEventTargetCapabilities(target: object): void {
    const eventTarget = new EventTarget();
    Object.assign(target, {
        addEventListener: eventTarget.addEventListener.bind(eventTarget),
        removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
        dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
        hasEventListeners: true,
    });
}

/** Get proxy-wrapped node with observer attached. m2d2.src.js:1243-1249. */
function getProxyNode(selector: unknown, obj: unknown): M2d2Node | null {
    const node = doDom(selector, obj);
    if (node) {
        observe(node);
        return proxy(node) as M2d2Node;
    }
    return null;
}

/**
 * Run callback when DOM is ready.
 * Ported from m2d2.src.js:81-85.
 */
export function ready(callback: ($: Factory) => void): void {
    document.addEventListener("DOMContentLoaded", () => {
        callback($);
    });
}

/**
 * Load m2d2 immediately and optionally register extensions.
 * Ported from m2d2.src.js:92-129.
 */
export function load(callback?: ($: Factory) => Record<string, unknown> | void): Factory {
    if (callback !== undefined) {
        const ext = callback($);
        if (utils.isObject(ext) && !utils.isEmpty(ext)) {
            Object.keys(ext as object).forEach((k) => {
                const extObj = (ext as Record<string, Record<string, unknown>>)[k];
                if (utils.isValidElement(k)) {
                    if (extensions[k] === undefined) extensions[k] = {};
                    const $node = utils.newElement(k);
                    Object.keys(extObj).forEach((it) => {
                        if (utils.hasProp($node, it)) {
                            console.warn("[m2d2] Property [" + it + "] already exists in node: [" + k + "]");
                        }
                    });
                    Object.assign(extensions[k], extObj);
                } else {
                    if (extensions["*"] === undefined) extensions["*"] = {};
                    Object.assign(extensions["*"], extObj);
                }
            });
        }
    }
    return $;
}
