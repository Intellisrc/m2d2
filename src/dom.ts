import { utils } from "./utils";
import { extensions } from "./config";
import { error } from "./log";
import type { M2d2Node } from "./types";

let prototypesInstalled = false;

/**
 * Patch Element.prototype so that appending an m2d2 proxy node appends
 * its underlying DOM node. Original: m2d2.src.js:22-34. Issue #53.
 * Called once from index.ts.
 */
export function installPrototypes(): void {
    if (prototypesInstalled) return;
    prototypesInstalled = true;
    (["after", "before", "append", "prepend", "insertAdjacentElement", "replaceWith"] as const).forEach(
        (p) => {
            const proto = Element.prototype as any;
            proto["_" + p] = proto[p];
            proto[p] = function (this: Element, ...args: unknown[]) {
                const arrArgs = args.map((arg) => {
                    if (arg !== undefined && arg !== null && (arg as any).domNode !== undefined) {
                        return (arg as any).domNode;
                    }
                    return arg;
                });
                return proto["_" + p].apply(this, arrArgs);
            };
        }
    );
}

/**
 * Extend a DOM node with m2d2 properties and methods.
 * Idempotent: if node already has _m2d2 flag, returns as-is.
 * Ported from m2d2.src.js:137-329.
 */
export function extDom(selector: unknown, root?: ParentNode): M2d2Node | null {
    if (!selector) {
        error("Selector was empty");
        return null;
    }
    const $root = root ?? document;
    const $node = (
        utils.isNode(selector) ? selector : ($root as ParentNode).querySelector(selector as string)
    ) as M2d2Node | null;
    if (!$node) {
        if (utils.isString(selector)) {
            error("Selector: " + selector + " didn't match any element");
        } else {
            error("Node was null");
        }
        return null;
    }

    if ($node._m2d2) return $node;
    $node._m2d2 = true;

    // Warn if node already has m2d2 properties (collision detection):
    const m2d2Props = [
        "parent", "sibling", "posterior", "anterior", "find", "findAll",
        "onupdate", "onready", "show", "onshow", "inView", "css", "text", "html", "getData", "index",
    ];
    m2d2Props.forEach((f) => {
        if (Object.prototype.hasOwnProperty.call($node, f)) {
            console.warn("[m2d2] Node already had [" + f + "] property. It might cause unexpected behaviour.");
        }
    });

    // --- Properties via Object.defineProperty ---

    // text: m2d2.src.js:163-182
    // NOTE: uses innerText (rendering-aware) when child nodes exist, falling back to
    // textContent — jsdom does not implement innerText, so the fallback keeps tests
    // working without changing browser behavior (innerText wins when populated).
    Object.defineProperty($node, "text", {
        configurable: true,
        get(this: M2d2Node) {
            if (!this.childNodes.length) return this.textContent;
            return this.innerText || this.textContent;
        },
        set(this: M2d2Node, value: string) {
            if (this.childNodes.length) {
                let found = false;
                this.childNodes.forEach((n) => {
                    if (n.constructor.name === "Text") {
                        n.nodeValue = value;
                        found = true;
                    }
                });
                if (!found) {
                    this.prepend(document.createTextNode(value));
                }
            } else {
                this.textContent = value;
            }
        },
    });

    // html: m2d2.src.js:184-187
    Object.defineProperty($node, "html", {
        configurable: true,
        get(this: M2d2Node) {
            return this.innerHTML;
        },
        set(this: M2d2Node, value: string) {
            this.innerHTML = value;
        },
    });

    // css: m2d2.src.js:189-210
    Object.defineProperty($node, "css", {
        configurable: true,
        get(this: M2d2Node) {
            return this.classList;
        },
        set(this: M2d2Node, value: unknown) {
            if (utils.isArray(value)) {
                this.className = (value as unknown[]).join(" ");
            } else if (utils.isString(value)) {
                this.className = value;
            } else if (utils.isPlainObject(value)) {
                const obj = value as Record<string, unknown>;
                Object.keys(obj).forEach((c) => {
                    if (obj[c]) {
                        this.classList.add(c);
                    } else {
                        this.classList.remove(c);
                    }
                });
            } else {
                error("Trying to assign a wrong value to css:", value);
            }
        },
    });

    // show: m2d2.src.js:212-254
    Object.defineProperty($node, "show", {
        configurable: true,
        get(this: M2d2Node) {
            return utils.isVisible(this);
        },
        set(this: M2d2Node, show: boolean) {
            const cssDisplay = () => getComputedStyle(this, null).display;
            const defaultDisplay = () => {
                const b = document.getElementsByTagName("body")[0];
                const t = document.createElement("template");
                const n = document.createElement(this.tagName);
                t.append(n);
                b.append(t);
                const display = getComputedStyle(n, null).display;
                t.remove();
                return display;
            };
            if (show) {
                if (cssDisplay() === "none") {
                    if ((this as any)._m2d2_display) {
                        this.style.display = (this as any)._m2d2_display;
                    } else {
                        this.style.removeProperty("display");
                        if (cssDisplay() === "none") {
                            const defaultShow = defaultDisplay();
                            this.style.display =
                                this.dataset.display || (defaultShow !== "none" ? defaultShow : "block");
                        }
                    }
                    if (this.onshow !== undefined && utils.isFunction(this.onshow)) {
                        this.onshow(this);
                    }
                }
            } else {
                const stored = this.style.display !== "none" ? this.style.display : cssDisplay();
                if (stored !== "none") {
                    (this as any)._m2d2_display = stored;
                }
                this.style.display = "none";
            }
        },
    });

    // --- Extension merging ---
    let extend: Record<string, unknown> = {};
    if (extensions["*"] !== undefined) {
        Object.assign(extend, extensions["*"]);
    }
    if (extensions[$node.tagName] !== undefined) {
        Object.assign(extend, extensions[$node.tagName]);
    }

    // --- Methods via Object.assign ---
    Object.assign(
        $node,
        {
            inView: () => utils.inView($node),
            posterior: () => $node.nextElementSibling,
            anterior: () => $node.previousElementSibling,
            parent: () => extDom($node.parentElement),
            sibling: (sel: string) => ((($node.parentElement as M2d2Node) ?? null) as M2d2Node)?.find(sel) ?? null,
            find: (it: string): M2d2Node | null => {
                const node = $node.querySelector(it);
                return node ? extDom(node) : null;
            },
            findAll: (it?: string): Element[] => {
                const nodeList =
                    it === undefined ? Array.from($node.children) : Array.from($node.querySelectorAll(it));
                nodeList.forEach((n) => extDom(n));
                return nodeList;
            },
        },
        extend
    );

    // index: only if node doesn't have it already (like <option>)
    if (($node as any).index === undefined) {
        Object.defineProperty($node, "index", {
            configurable: true,
            value: () => Array.from(($node.parentNode as ParentNode).children).indexOf($node),
            writable: true,
        });
    }

    // Sync value attribute on input: m2d2.src.js:297-299
    if (["INPUT", "TEXTAREA", "SELECT"].indexOf($node.tagName) >= 0 && utils.hasAttrOrProp($node, "value")) {
        ($node as any).oninput = function (this: M2d2Node) {
            this.setAttribute("value", (this as unknown as HTMLInputElement).value);
        };
    }

    // getData on forms: m2d2.src.js:301-324 (with multi-value grouping fix)
    if ($node.tagName === "FORM") {
        Object.defineProperty($node, "getData", {
            configurable: true,
            value: function (this: M2d2Node, includeNotVisible?: boolean): Record<string, unknown> {
                const data: Record<string, unknown> = {};
                const fd = new FormData(this as unknown as HTMLFormElement);
                const include = includeNotVisible || false;
                for (const [name, raw] of fd.entries()) {
                    const elem = this.find("[name='" + name + "']");
                    if (!elem) continue;
                    const isVisible = (elem as any).show;
                    if (include || (elem as any).type === "hidden" || isVisible) {
                        const val =
                            (elem as any).type === "file"
                                ? (elem as unknown as HTMLInputElement).files
                                : raw;
                        if (data[name] !== undefined) {
                            if (utils.isArray(data[name])) {
                                (data[name] as unknown[]).push(val);
                            } else {
                                data[name] = [data[name], val];
                            }
                        } else {
                            data[name] = val;
                        }
                    }
                }
                return data;
            },
            writable: true,
        });
    }

    return $node;
}
