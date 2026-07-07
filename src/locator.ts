import { utils } from "./utils";
import type { M2d2Node } from "./types";

export interface LocateResult {
    matched: M2d2Node[];
    ambiguous: boolean;
}

/**
 * Find candidate child elements for a key in priority order:
 * 1. #key (id)  2. [name="key"]  3. .key (class)  4. key as free selector/tag.
 *
 * Skips template keys and function values.
 * Extracted from m2d2.src.js:438-463.
 *
 * NOTE: extDom is passed via wireLocator() to avoid a circular init (dom.ts ← locator.ts).
 */
let _extDom: ((selector: unknown, root?: ParentNode) => M2d2Node | null) | null = null;

export function wireLocator(extDomFn: (selector: unknown, root?: ParentNode) => M2d2Node | null): void {
    _extDom = extDomFn;
}

export function locate(node: M2d2Node, key: string, value: unknown): LocateResult {
    const options: M2d2Node[] = [];
    if (!_extDom) return { matched: options, ambiguous: false };

    // Skip template keys and function values:
    if (key === "template" || utils.isFunction(value)) {
        return { matched: options, ambiguous: false };
    }

    try {
        // Look for ID, name, class (only if key starts with a word char):
        if (key && key.match(/^\w/)) {
            // ID:
            let elem = node.find("#" + key);
            if (elem && options.indexOf(elem) === -1) options.push(elem);
            // Name:
            elem = node.find("[name='" + key + "']");
            if (elem && options.indexOf(elem) === -1) options.push(elem);
            // Class:
            const classElems = Array.from(node.findAll("." + key)).filter(
                (i) => options.indexOf(i as M2d2Node) < 0
            ) as M2d2Node[];
            classElems.forEach((e) => options.push(e));
        }
        // Free selector / tag name (e.g. "div > span" or "input"):
        const tagElems = Array.from(node.findAll(key)).filter(
            (i) => options.indexOf(i as M2d2Node) < 0
        ) as M2d2Node[];
        tagElems.forEach((e) => options.push(e));
    } catch (e) {
        console.error("[m2d2] Invalid selector:", key, e);
    }

    return { matched: options, ambiguous: options.length > 1 };
}
