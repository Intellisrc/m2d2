/**
 * Utility functions for type checking and DOM helpers.
 * Exposed as $.isString, $.isNode, etc. (copied onto the $ function in factory.ts).
 * Ported from js/utils.src.js.
 */
export class Utils {
    isString(v: unknown): v is string {
        return typeof v === "string";
    }

    isBool(b: unknown): b is boolean {
        return typeof b === "boolean";
    }

    isNumeric(n: unknown): boolean {
        // Matches original behavior: parseFloat(null/undefined/"") = NaN → false.
        return !isNaN(parseFloat(n as string)) && isFinite(n as number);
    }

    isSelectorID(s: string): boolean {
        return (s + "").trim().indexOf("#") === 0;
    }

    isPlainObject(o: unknown): boolean {
        return typeof o === "object" && o !== null && o.constructor.name === "Object";
    }

    isObject(oa: unknown): boolean {
        return typeof oa === "object" && oa !== null;
    }

    isArray(a: unknown): a is unknown[] {
        return Array.isArray(a);
    }

    isFunction(f: unknown): f is Function {
        return typeof f === "function";
    }

    isElement(n: unknown): n is HTMLElement {
        return n instanceof HTMLElement;
    }

    isNode(n: unknown): n is Node | DocumentFragment {
        return n instanceof Node || n instanceof DocumentFragment;
    }

    /**
     * Return true if string seems to be HTML code.
     * FIX vs original: rejects non-strings (original coerced via (s+"")).
     */
    isHtml(s: unknown): boolean {
        return typeof s === "string" && s.trim().indexOf("<") !== -1;
    }

    isEmpty(obj: unknown): boolean {
        return (
            obj === undefined ||
            obj === null ||
            obj === "" ||
            (this.isObject(obj) && Object.keys(obj as object).length === 0)
        );
    }

    isVisible(elem: HTMLElement): boolean {
        if (!this.isElement(elem)) {
            console.warn("[m2d2] (isVisible) Not an element:", elem);
            return false;
        }
        const display = elem.style.display !== "none";
        const notHidden = elem.style.visibility !== "hidden";
        return display && notHidden;
    }

    inView(elem: HTMLElement): boolean {
        const rect = elem.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
            rect.width > 0 &&
            rect.height > 0
        );
    }

    cleanArray<T>(a: T[]): T[] {
        return a.filter((e) => e === 0 || e);
    }

    isValidElement(tagName: string): boolean {
        const node = this.newElement(tagName);
        return tagName !== "template" && node.constructor.name !== "HTMLUnknownElement";
    }

    exists(selector: string): boolean {
        return document.querySelector(selector) !== null;
    }

    getAttrOrProp(node: HTMLElement, key: string): unknown {
        let value = "";
        if (this.hasAttrOrProp(node, key)) {
            value = this.hasAttr(node, key) ? node.getAttribute(key) : (node as any)[key];
        }
        return value;
    }

    hasAttrOrProp(node: HTMLElement | null, key: string): boolean {
        return this.hasAttr(node, key) || this.hasProp(node, key);
    }

    hasAttr(node: HTMLElement | null, attr: string): boolean {
        if (!node || this.isNumeric(attr)) return false;
        if (attr === "checked") {
            const type = (node as HTMLInputElement).type;
            return type !== undefined && (type === "radio" || type === "checkbox");
        }
        return node.hasAttribute !== undefined ? node.hasAttribute(attr) : false;
    }

    hasProp(node: HTMLElement | null, prop: string): boolean {
        if (!node || this.isNumeric(prop)) return false;
        let has = (node as any)[prop] !== undefined;
        // Quirk: null value means "no value set yet" — kept for compatibility, documented here.
        if (has && (node as any)[prop] === null && prop === "value") {
            has = false;
        }
        return has && !((node as any)[prop] instanceof Node) && !node.hasAttribute(prop);
    }

    setPropOrAttr(node: HTMLElement, key: string, value: unknown): void {
        if (this.hasProp(node, key)) {
            try {
                (node as any)[key] = value;
            } catch {
                this.setAttr(node, key, value);
            }
        } else {
            this.setAttr(node, key, value);
        }
    }

    setAttr(node: HTMLElement, key: string, value: unknown): void {
        if (value) {
            node.setAttribute(key, String(value));
        } else {
            node.removeAttribute(key);
        }
    }

    defineProp(obj: object, prop: string, def: unknown): void {
        if (this.isObject(obj) && (obj as any)[prop] === undefined) {
            Object.defineProperty(obj, prop, {
                enumerable: false,
                writable: true,
                configurable: true,
            });
            (obj as any)[prop] = def;
        }
    }

    htmlElement(html: string): Element | null {
        const template = this.newElement("template") as unknown as HTMLTemplateElement;
        template.innerHTML = html.trim();
        return template.content.firstChild as Element | null;
    }

    newElement(tagName: string): HTMLElement {
        if (!tagName || this.isNumeric(tagName)) {
            tagName = "invalid";
        }
        return document.createElement(tagName);
    }

    newEmptyNode(): DocumentFragment {
        return new DocumentFragment();
    }

    getMethods(obj: object): string[] {
        const o = Reflect.getPrototypeOf(obj) as object | null;
        const x = o ? Reflect.getPrototypeOf(o) : null;
        if (!o || !x) return [];
        return Reflect.ownKeys(o).filter((it) => Reflect.ownKeys(x).indexOf(it) < 0) as string[];
    }

    appendAllChild(srcNode: Node, tgtNode: Node): void {
        while (srcNode.firstChild) {
            tgtNode.appendChild(srcNode.firstChild);
        }
    }

    prependAllChild(srcNode: Node, tgtNode: Node): void {
        while (srcNode.firstChild) {
            tgtNode.insertBefore(srcNode.firstChild, tgtNode.firstChild);
        }
    }
}

export const utils = new Utils();
