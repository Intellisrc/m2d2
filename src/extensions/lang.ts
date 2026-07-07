/**
 * M2D2 Language Extension
 *
 * $.dict(keyword, [variables])  — look up a translation
 * $.lang(lang?)                 — set language / trigger DOM translation
 * $.lang.getKeyword(text)       — convert text to a dictionary keyword
 * $.lang.onchange = (lang) =>{} — fire when language changes
 *
 * Ported from js/m2d2.lang.src.js.
 */

import { utils } from "../utils";

/** A translation entry: keyword → { langCode → translated text }. */
export type Dictionary = Record<string, Record<string, string>>;

/** Variables for string interpolation: { placeholder: replacement }. */
export type DictVars = Record<string, string> | string;

interface DictionaryApi {
    (keyword: string | undefined, vars?: DictVars): string;
    lang: string;
    /** Class(es) whose elements skip text translation. */
    noTextClass: string | string[];
    /** Class(es) whose elements skip title translation. */
    noTitleClass: string | string[];
    /** Class(es) whose elements skip placeholder translation. */
    noPlaceHolderClass: string | string[];
    /** Class(es) whose elements get their value translated. */
    valueClass: string | string[];
    data: Dictionary;
    set(dictionary: Dictionary): DictionaryApi;
    has(keyword: string, lang?: string): boolean;
    val(keyword: string, report?: boolean): string;
}

/**
 * Build the Dictionary function-object.
 * Ported from the `Dictionary` constructor in js/m2d2.lang.src.js:18-95.
 */
function createDictionary(initialLang: string): DictionaryApi {
    const api = function (keyword: string | undefined, vars?: DictVars): string {
        if (keyword === undefined) return "";
        let msg = api.val(keyword, true);
        if (vars !== undefined) {
            // Normalize to an object (accept legacy ";"-delimited string "k1:v1;k2:v2")
            let varsObj: Record<string, string> | undefined;
            if (typeof vars === "string") {
                if (vars !== "") {
                    const cleaned = vars.replace(/;$/, "");
                    const pairs = cleaned.split(";");
                    const obj: Record<string, string> = {};
                    pairs.forEach((p) => {
                        const part = p.split(":");
                        obj[part[0]] = part[1];
                    });
                    varsObj = obj;
                }
            } else {
                varsObj = vars as Record<string, string>;
            }
            const varsConst = varsObj;
            if (varsConst) {
                Object.keys(varsConst).forEach((v) => {
                    let kwd = varsConst[v] + "";
                    kwd = api.val(kwd, false);
                    msg = msg.replace(v, kwd);
                });
            }
        }
        return msg;
    } as DictionaryApi;

    api.lang = initialLang || "en";
    api.noTextClass = ["notxt", "lang_no_text"];
    api.noTitleClass = "lang_no_title";
    api.noPlaceHolderClass = "lang_no_ph";
    api.valueClass = "lang_value";
    api.data = {};

    api.set = function (dictionary: Dictionary): DictionaryApi {
        api.data = dictionary;
        return api;
    };

    api.has = function (keyword: string, lang?: string): boolean {
        return lang === undefined
            ? api.data[keyword] !== undefined
            : api.data[keyword]?.[lang] !== undefined;
    };

    api.val = function (keyword: string, report = false): string {
        if (utils.isEmpty(api.data)) {
            console.error(
                "[m2d2] Dictionary is empty. Add one, e.g.:\n" +
                    "$.dict.set({\n" +
                    "  save   : { en : 'Save', es : 'Guardar' },\n" +
                    "  cancel : { en : 'Cancel', es : 'Cancelar' }\n" +
                    "})"
            );
            return "";
        }
        if (!keyword) {
            console.error("[m2d2] No keyword specified.");
            return "";
        }
        let translation = keyword;
        keyword = keyword.toLowerCase();
        if (api.has(keyword)) {
            const baseLang = api.lang.split("-")[0];
            if (api.has(keyword, api.lang)) {
                translation = api.data[keyword][api.lang];
            } else if (api.has(keyword, baseLang)) {
                translation = api.data[keyword][baseLang];
            } else if (report) {
                console.log("[m2d2] Missing translation for lang [" + api.lang + "]: " + keyword);
            }
        } else if (report) {
            console.log("[m2d2] Missing keyword: " + keyword);
        }
        return translation;
    };

    return api;
}

// --- utils (from ../utils) is used directly; no $ reference needed at module level ---

/** Registered language-change callbacks. */
const langEvents: Array<(lang: string | undefined) => void> = [];

/** Convert a piece of text to a dictionary keyword. */
function getKeyword(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ") // collapse runs of whitespace to a single space
        .replace(/ /g, "_")
        .replace(/[^\w]/g, "")
        .replace(/_$/, "");
}

/** True if any class in `classes` is present in `classList`. */
function containsAny(classList: DOMTokenList, classes: string | string[]): boolean {
    const arr = Array.isArray(classes) ? classes : [classes];
    return Array.from(classList).some((cls) => arr.includes(cls));
}

/**
 * Register $.dict and $.lang on the target.
 * The target must be the m2d2 $ function (so $.isEmpty etc. are available).
 */
export function registerLang($target: object): void {
    const manualLang = localStorage.getItem("m2d2.lang") || "";
    const language = manualLang || navigator.language;

    const dict = createDictionary(language);
    ($target as any).dict = dict;

    const langFn: {
        (newLang?: string): void;
        getKeyword: (text: string) => string;
    } = function langFn(newLang?: string): void {
        if (newLang) {
            dict.lang = newLang;
            localStorage.setItem("m2d2.lang", dict.lang);
        }
        // Translate every element carrying a lang attribute:
        document.body.querySelectorAll("[lang]").forEach((elem) => {
            const el = elem as HTMLElement & { dataset: DOMStringMap };
            // NOTE: use textContent (not innerText) — jsdom doesn't implement innerText,
            // and the rendering-awareness difference is irrelevant for translation.
            const txt = el.textContent || "";
            // Text (unless skipped):
            if (txt && !containsAny(el.classList, dict.noTextClass)) {
                if (el.dataset.kw === undefined) {
                    el.dataset.kw = langFn.getKeyword(txt);
                }
                el.textContent = dict(el.dataset.kw);
                const titleKw = el.dataset.kw + "_title";
                const title = dict.has(titleKw) ? dict(titleKw) : "";
                if (title && !containsAny(el.classList, dict.noTitleClass)) {
                    el.title = title;
                }
            }
            // Title attribute:
            if (el.title && !containsAny(el.classList, dict.noTitleClass)) {
                let title = "";
                if (el.dataset.kw) {
                    title = dict(el.dataset.kw);
                } else {
                    el.dataset.kw = langFn.getKeyword(el.title);
                    title = dict(el.dataset.kw);
                }
                if (title) el.title = title;
            }
            // Placeholder:
            if (
                (el as HTMLInputElement).placeholder &&
                !containsAny(el.classList, dict.noPlaceHolderClass)
            ) {
                let placeholder = "";
                if (el.dataset.kw) {
                    placeholder = dict(el.dataset.kw);
                } else {
                    el.dataset.kw = langFn.getKeyword((el as HTMLInputElement).placeholder);
                    placeholder = dict(el.dataset.kw);
                }
                if (placeholder) (el as HTMLInputElement).placeholder = placeholder;
            }
            // Value (opt-in via valueClass):
            if (
                (el as HTMLInputElement).value &&
                containsAny(el.classList, dict.valueClass)
            ) {
                let value = "";
                if (el.dataset.kw) {
                    value = dict(el.dataset.kw);
                } else {
                    el.dataset.kw = langFn.getKeyword((el as HTMLInputElement).value);
                    value = dict(el.dataset.kw);
                }
                if (value) (el as HTMLInputElement).value = value;
            }
        });
        langEvents.forEach((callback) => callback(newLang));
    };

    langFn.getKeyword = getKeyword;

    // $.lang.onchange = fn  →  push into the callback list (additive, supports multiple):
    Object.defineProperty(langFn, "onchange", {
        get() {
            return this;
        },
        set(value: unknown) {
            if (typeof value === "function") {
                langEvents.push(value as (lang: string | undefined) => void);
            } else {
                console.log("[m2d2] Unable to set lang.onchange (not a function):", value);
            }
        },
    });

    ($target as any).lang = langFn;
}
