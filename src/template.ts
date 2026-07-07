import { utils } from "./utils";
import { extDom } from "./dom";
import { proxy } from "./reactivity";
import { error } from "./log";
import { doDom, coerce } from "./binding";
import { extendItems } from "./items";
import type { M2d2Node } from "./types";

/**
 * Set a unique attribute among siblings (e.g. "selected").
 * Only one sibling can have it at a time.
 * Ported from m2d2.src.js:947-963.
 */
export function setUniqueAttrib(node: M2d2Node, key: string): void {
    if (!Object.prototype.hasOwnProperty.call(node, key)) {
        Object.defineProperty(node, key, {
            configurable: true,
            get(this: M2d2Node) {
                return this.hasAttribute(key);
            },
            set(this: M2d2Node, val: unknown) {
                if (this.parentNode) {
                    (this.parentNode as M2d2Node)
                        .findAll("[" + key + "]")
                        .forEach((el) => (el as HTMLElement).removeAttribute(key));
                }
                if (val) {
                    this.setAttribute(key, String(val));
                } else {
                    this.removeAttribute(key);
                }
            },
        });
    }
}

/** Copy _template/__template refs from template to new item. */
function addTemplatesToItem(template: M2d2Node, newNode: M2d2Node): void {
    (["_template", "__template"] as const).forEach((key) => {
        if ((template as any)[key] !== undefined) {
            (newNode as any)[key] = (template as any)[key];
        }
    });
}

/** Deep-copy template refs into object tree. */
function addTemplatesToObjectDeep(template: M2d2Node, obj: unknown): void {
    if (utils.isPlainObject(obj)) {
        const objRec = obj as Record<string, unknown>;
        Object.keys(objRec).forEach((key) => {
            const tval = (template as any)[key];
            if (tval && tval.__template && !objRec.template) {
                if (utils.isPlainObject(objRec[key])) {
                    (objRec[key] as Record<string, unknown>).template = tval.__template;
                }
            }
            if (tval && objRec[key]) {
                addTemplatesToObjectDeep(tval, objRec[key]);
            }
        });
    }
}

/** Re-scan __template for events and apply to new item. */
function getItemWithEvents(node: M2d2Node, newNode: M2d2Node): M2d2Node {
    if ((node as any).__template !== undefined) {
        const scan = (
            object: Record<string, unknown>,
            result: Record<string, unknown> = {}
        ): Record<string, unknown> => {
            Object.keys(object).forEach((key) => {
                const val = object[key];
                if (utils.isPlainObject(val)) {
                    result[key] = scan(val as Record<string, unknown>);
                } else if (utils.isFunction(val)) {
                    result[key] = val;
                }
            });
            return result;
        };
        let tree = scan((node as any).__template as Record<string, unknown>);
        if (!utils.isEmpty(tree)) {
            tree = tree[Object.keys(tree)[0]] as Record<string, unknown>;
            if (utils.isPlainObject(tree)) {
                newNode = doDom(newNode, tree) as M2d2Node;
            }
        }
    }
    return newNode;
}

/**
 * Get the template element for a node.
 * Priority: cached _template → <template> child → container default → explicit template → clone children.
 * Ported from m2d2.src.js:833-938.
 */

/**
 * If `parsed` is an element with multiple child elements (ambiguous template
 * root), wrap them in a <span>. Returns the element or undefined.
 * Only applies to HTML-parsed templates — object-spec templates are structured
 * by design and their children are the template's internal structure.
 */
function wrapIfNeeded(parsed: Element | null): Element | undefined {
    if (!parsed) return undefined;
    if (parsed.childElementCount > 1) {
        console.warn("[m2d2] Template has multiple root children, wrapping with <span>:", parsed);
        const span = utils.newElement("span");
        span.appendChild(parsed);
        return span;
    }
    return parsed;
}

export function getTemplate(node: M2d2Node, template?: unknown): Element | undefined {
    if ((node as any)._template !== undefined && (node as any)._template !== "") {
        return (node as any)._template as Element;
    }

    let $template: Element | undefined;
    const htmlTemplate = node.querySelector("template") as HTMLTemplateElement | null;
    if (htmlTemplate) {
        // Parsed from HTML — may have multiple root elements, wrap if so:
        const parsed = utils.htmlElement(htmlTemplate.innerHTML.trim());
        $template = wrapIfNeeded(parsed);
    } else {
        switch (node.tagName) {
            case "SELECT":
            case "DATALIST":
                $template = utils.newElement("option");
                break;
            case "UL":
            case "OL":
                $template = utils.newElement("li");
                break;
            case "NAV":
                $template = utils.newElement("a");
                break;
            case "DL":
                $template = utils.newElement("dd");
                break;
            default: {
                if (template && utils.isPlainObject(template)) {
                    // Build from explicit template object:
                    const children = Object.keys(template as object).length;
                    if (children) {
                        if (children > 1) {
                            const tplObj = template as Record<string, unknown>;
                            if (tplObj.tagName !== undefined) {
                                const wrap: Record<string, unknown> = {};
                                wrap[tplObj.tagName as string] = template;
                                template = wrap;
                            } else {
                                console.warn("[m2d2] Template has multiple top elements. Using first:", template);
                            }
                        }
                        const tplRec = template as Record<string, unknown>;
                        const key = Object.keys(tplRec)[0];
                        const val = tplRec[key] as Record<string, unknown>;
                        if (utils.isValidElement(key)) {
                            $template = utils.newElement(key);
                        } else if (val.tagName !== undefined) {
                            $template = utils.newElement(val.tagName as string);
                            tplRec[val.tagName as string] = val;
                            delete tplRec[key];
                        } else {
                            error("Template element can't be identified: [" + key + "], using <span>:", template);
                            $template = utils.newElement("span");
                        }
                    } else {
                        error("Template has no definition. Using <span>:", template);
                        $template = utils.newElement("span");
                    }
                } else {
                    // Clone existing children:
                    if (node.childElementCount > 0) {
                        const parsed = utils.htmlElement(node.innerHTML.trim());
                        $template = wrapIfNeeded(parsed);
                    }
                }
                break;
            }
        }
    }

    // Finalize template from explicit spec:
    if (template) {
        if (utils.isPlainObject(template)) {
            const wrap = utils.newEmptyNode();
            if ($template) wrap.appendChild($template);
            const fragment = doDom(extDom(wrap)!, template);
            // The decoration may have replaced $template with the decorated version.
            // Check if the wrap ended up with multiple top-level children (ambiguous):
            const fragChildren = fragment ? fragment.children.length : 0;
            if (fragChildren > 1) {
                console.warn("[m2d2] Template has multiple top-level children, wrapping with <span>:", fragment);
                const span = utils.newElement("span");
                if (fragment) Array.from(fragment.children).forEach((c) => span.appendChild(c));
                $template = span;
            } else {
                $template = (fragment?.children[0] as Element) ?? undefined;
            }
            utils.defineProp(node, "__template", template);
        } else if (utils.isString(template) && utils.isHtml(template)) {
            const parsed = utils.htmlElement(template);
            $template = wrapIfNeeded(parsed);
        } else if (utils.isString(template) && utils.isSelectorID(template)) {
            const src = document.querySelector(template);
            $template = (src ? utils.htmlElement(src.innerHTML) : null) ?? undefined;
        } else if (utils.isString(template)) {
            $template = utils.newElement(template);
        }
    }

    if ($template) {
        utils.defineProp(node, "_template", $template);
    } else {
        console.warn("[m2d2] Template not found, using <span>:", node);
        $template = utils.newElement("span");
    }

    return $template;
}

/**
 * Create a single rendered item from a template.
 * Ported from m2d2.src.js:716-732.
 */
export function getItem(
    node: M2d2Node,
    index: number | string,
    obj: unknown,
    template?: Element
): M2d2Node | null {
    const $template = (template as M2d2Node) || getTemplate(node);
    if (!$template) return null;

    const newItem = ($template as M2d2Node).cloneNode(true) as unknown as M2d2Node;
    addTemplatesToItem($template as M2d2Node, newItem);
    newItem.dataset.id = String(index);
    setUniqueAttrib(newItem, "selected");
    addTemplatesToObjectDeep($template as M2d2Node, obj);

    const newNode = doDom(newItem, obj) as M2d2Node;
    return getItemWithEvents(node, newNode);
}

/**
 * Process an array of values into items appended to node.
 * Ported from m2d2.src.js:801-826.
 */
export function doItems(node: M2d2Node, values: unknown[], template?: unknown): void {
    const $template = getTemplate(node, template);
    if (!$template) {
        error("Template not found. An array is being used where not expected. Node:", node, "Values:", values);
        return;
    }
    let i = 0;
    values.forEach((val) => {
        const coerced = coerce(node, val);
        const newItem = getItem(node, i++, coerced, $template);
        if (newItem) {
            node.appendChild(newItem);
        }
    });
    // Cleanup <template> tag:
    const tempTag = node.querySelector("template");
    if (tempTag) node.removeChild(tempTag);
    // Set items link:
    (node as any).items = node.children;
    extendItems(node);
}
