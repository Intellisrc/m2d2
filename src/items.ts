import { utils } from "./utils";
import { extDom } from "./dom";
import { proxy, dispatchUpdate } from "./reactivity";
import { getItem } from "./template";
import { coerce } from "./binding";
import type { M2d2Node, ItemsCollection } from "./types";

/**
 * Fire a single "items" update for a collection mutation. Bypasses dedupe
 * (each call is a distinct logical change; the observer no longer emits these).
 */
function notifyItems(node: M2d2Node): void {
    dispatchUpdate(
        node,
        { type: "object", property: "items", newValue: node.items, oldValue: null },
        false
    );
}

/**
 * Extend node.items (HTMLCollection) with array-like and custom methods.
 * Ported from m2d2.src.js:1256-1476. splice/fill/copyWithin now implemented.
 */
export function extendItems(node: M2d2Node): void {
    const items = node.items as ItemsCollection;
    if (!items) return;

    // Helper: reattach items in array order (reverse/remove + re-append in new order):
    const reattach = (itemList: Element[]) => {
        itemList.forEach((itm) => {
            const parent = itm.parentNode!;
            const detached = parent.removeChild(itm);
            node.appendChild(detached);
        });
    };

    const nonStd = ["clear", "get", "remove", "selected", "unselect", "first", "last", "findAll"];

    Object.getOwnPropertyNames(Array.prototype)
        .concat(nonStd)
        .forEach((method) => {
            if ((items as any)[method] !== undefined) return;

            // Methods are bound dynamically to an HTMLCollection; signatures vary,
            // so we type loosely here (matching the original's untyped function() {}).
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let func: any = null;

            switch (method) {
                case "splice":
                    func = function (this: M2d2Node, start: number, deleteCount?: number, ...newItems: unknown[]) {
                        const count = deleteCount ?? 0;
                        const children = Array.from(node.children);
                        const removed: M2d2Node[] = [];
                        // Remove:
                        for (let i = 0; i < count && start + i < children.length; i++) {
                            const child = children[start + i] as M2d2Node;
                            removed.push(proxy(child));
                            child.remove();
                        }
                        // Insert new items before the element currently at (start + deleteCount):
                        const insertBefore = children[start + count] as Element | undefined;
                        newItems.forEach((obj, idx) => {
                            const coerced = coerce(node, obj);
                            if (utils.isPlainObject(coerced)) {
                                const child = getItem(node, start + idx, coerced);
                                if (child) {
                                    if (insertBefore) {
                                        insertBefore.before(child);
                                    } else {
                                        node.appendChild(child);
                                    }
                                }
                            }
                        });
                        notifyItems(node);
                        return removed;
                    };
                    break;

                case "fill":
                    func = function (this: M2d2Node, value: unknown, start = 0, end?: number) {
                        const children = Array.from(node.children) as M2d2Node[];
                        const stop = end ?? children.length;
                        for (let i = start; i < stop && i < children.length; i++) {
                            const child = children[i];
                            const coerced = coerce(node, value);
                            if (utils.isPlainObject(coerced)) {
                                const coercedRec = coerced as Record<string, unknown>;
                                Object.keys(coercedRec).forEach((k) => {
                                    (child as any)[k] = coercedRec[k];
                                });
                            }
                        }
                        notifyItems(node);
                    };
                    break;

                case "copyWithin":
                    func = function (this: M2d2Node, target: number, start: number, end?: number) {
                        const children = Array.from(node.children) as M2d2Node[];
                        const stop = end ?? children.length;
                        const toCopy = children.slice(start, stop);
                        for (let i = 0; i < toCopy.length && target + i < children.length; i++) {
                            const targetChild = children[target + i];
                            const clone = toCopy[i].cloneNode(true) as unknown as M2d2Node;
                            extDom(clone);
                            targetChild.replaceWith(clone);
                        }
                        notifyItems(node);
                    };
                    break;

                case "reverse":
                    func = function (this: M2d2Node) {
                        if (node.items!.length) {
                            const arr = Array.from(node.items!);
                            arr.reverse();
                            reattach(arr);
                            notifyItems(node);
                        }
                    };
                    break;

                case "clear":
                    func = function (this: M2d2Node) {
                        while (node.items![0]) (node.items![0] as M2d2Node).remove();
                        notifyItems(node);
                    };
                    break;

                case "get":
                    func = function (this: M2d2Node, id: string | number) {
                        let found: M2d2Node | null = null;
                        if (node.items!.length) {
                            Array.from(node.items!).some((item) => {
                                const itemNode = item as M2d2Node;
                                const sameId = utils.isNumeric(id)
                                    ? Number(itemNode.dataset.id) === Number(id)
                                    : itemNode.dataset.id === String(id);
                                if (itemNode.dataset && sameId) {
                                    found = itemNode;
                                    return true;
                                }
                                return false;
                            });
                        }
                        return found;
                    };
                    break;

                case "selected":
                    func = function (this: M2d2Node) {
                        const found = node.find(":scope > [selected]");
                        return found ? proxy(found) : null;
                    };
                    break;

                case "unselect":
                    func = function (this: M2d2Node) {
                        if (node.items!.length) {
                            const sel = (node.items as ItemsCollection).selected();
                            if (sel) (sel as M2d2Node).selected = false;
                        }
                    };
                    break;

                case "first":
                    func = function (this: M2d2Node) {
                        return proxy(node.items![0] as M2d2Node);
                    };
                    break;

                case "last":
                    func = function (this: M2d2Node) {
                        return proxy(node.items![node.items!.length - 1] as M2d2Node);
                    };
                    break;

                case "pop":
                    func = function (this: M2d2Node) {
                        if (node.items!.length) {
                            const removed = proxy(node.removeChild(node.items![node.items!.length - 1]) as M2d2Node);
                            notifyItems(node);
                            return removed;
                        }
                        return null;
                    };
                    break;

                case "push":
                    func = function (this: M2d2Node, obj: unknown) {
                        const coerced = coerce(node, obj);
                        if (utils.isElement(coerced)) {
                            node.appendChild(coerced as Element);
                        } else if (utils.isPlainObject(coerced)) {
                            const index = node.items!.length;
                            const child = getItem(node, index, coerced);
                            if (child) node.appendChild(child);
                        } else {
                            console.warn("[m2d2] Trying to push unknown value into list:", obj);
                        }
                        notifyItems(node);
                    };
                    break;

                case "remove":
                    func = function (this: M2d2Node, id: string | number) {
                        if (node.items!.length) {
                            const elem = (node.items as ItemsCollection).get(id);
                            if (elem) {
                                (elem as M2d2Node).remove();
                                notifyItems(node);
                            }
                        }
                    };
                    break;

                case "shift":
                    func = function (this: M2d2Node) {
                        if (node.items!.length) {
                            const removed = proxy(node.removeChild(node.items![0]) as M2d2Node);
                            notifyItems(node);
                            return removed;
                        }
                        return null;
                    };
                    break;

                case "sort":
                    func = function (this: M2d2Node, compareFn?: (a: M2d2Node, b: M2d2Node) => number) {
                        if (node.items!.length) {
                            const arr = Array.from(node.items!);
                            (arr as M2d2Node[]).sort(compareFn ?? ((a, b) => {
                                return (a as M2d2Node).text.localeCompare((b as M2d2Node).text);
                            }));
                            reattach(arr);
                            notifyItems(node);
                        }
                    };
                    break;

                case "unshift":
                    func = function (this: M2d2Node, obj: unknown) {
                        const coerced = coerce(node, obj);
                        if (utils.isElement(coerced)) {
                            node.prepend(coerced as Element);
                        } else if (utils.isPlainObject(coerced)) {
                            const index = node.items!.length;
                            const child = getItem(node, index, coerced);
                            if (child) node.prepend(child);
                        } else {
                            console.warn("[m2d2] Trying to unshift unknown value:", obj);
                        }
                        notifyItems(node);
                    };
                    break;

                case "concat":
                    func = function (this: M2d2Node, ...args: unknown[]) {
                        args.forEach((arr) => {
                            if (utils.isArray(arr)) {
                                arr.forEach((obj) => {
                                    let toAppend: Node | null = null;
                                    if (utils.isElement(obj)) {
                                        toAppend = obj as unknown as Node;
                                    } else {
                                        const coerced = coerce(node, obj);
                                        if (utils.isPlainObject(coerced)) {
                                            toAppend = getItem(node, node.items!.length, coerced);
                                        }
                                    }
                                    if (toAppend) node.appendChild(toAppend);
                                });
                            }
                        });
                        notifyItems(node);
                    };
                    break;

                case "findAll":
                    func = function (this: M2d2Node, ...args: unknown[]) {
                        if (args.length === 0) return node.findAll();
                        if (utils.isString(args[0])) return node.findAll(args[0] as string);
                        // Fall through to array filter:
                        const proxies = Array.from(node.items!).map((n) => proxy(n as M2d2Node));
                        return Array.from(proxies).filter(args[0] as (item: M2d2Node) => boolean);
                    };
                    break;

                default:
                    // Delegate to Array.prototype methods over proxied nodes:
                    if (utils.isFunction((Array.prototype as any)[method])) {
                        func = function (this: M2d2Node, ...args: unknown[]) {
                            const proxies = Array.from(node.items!).map((n) => proxy(n as M2d2Node));
                            // Special case for find: accept a string selector:
                            if (method === "find" && utils.isString(args[0])) {
                                return node.find(args[0] as string);
                            }
                            return (Array.prototype as any)[method].apply(proxies, args);
                        };
                    }
            }

            if (func) {
                utils.defineProp(items, method, func.bind(node));
            }
        });
}
