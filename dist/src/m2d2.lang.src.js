/**
 * Author : A.Lepe (dev@alepe.com) - intellisrc.com
 * License: MIT
 * Version: 2.1.1
 * Updated: 2022-02-15
 * Content: Extension (Debug)
 */

/**
 * M2D2 Language Extension
 * @since 2021-06-01
 *
 * Add supports for multi-language interfaces
 *
 * This extension provides:
 * $.dict(keyword, [variables])  : To get translations from dictionary
 * $.lang(lang)                  : Set new language
 *
 * Documentation :
 * https://gitlab.com/intellisrc/m2d2/tree/master/documentation/lang.md
 * https://github.com/intellisrc/m2d2/tree/master/documentation/lang.md
 */
m2d2.load($ => {
    let manualLang = localStorage.getItem("m2d2.lang") || ""
    let language = manualLang || navigator.language;
    function Dictionary(lang) {
        const obj =                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         function(keyword, vars) {
            if(keyword === undefined) return "";
            let msg = obj.val(keyword,true);
            if(vars !== undefined) {
                if(typeof vars == "string"){
                    if(vars !== "") {
                        vars = vars.replace(/;$/,"");
                        const pairs = vars.split(";");
                        vars = {};
                        pairs.forEach(p => {
                            const part = pairs[p].split(":");
                            vars[part[0]] = part[1];
                        });
                    }
                }
                if(typeof vars == "object"){
                    vars.forEach(v => {
                        let kwd = vars[v] + ""; //Be sure its string
                        kwd = obj.val(kwd,false);
                        msg = msg.replace(v,kwd);
                    })
                }
            }
            return msg;
        }
        obj.lang = lang || "en";
        obj.data = {};
        obj.set = function(dictionary) {
            this.data = dictionary;
            return this;
        };
        obj.has = function(keyword, lang) {
            return lang === undefined ? this.data[keyword] !== undefined : this.data[keyword][lang] !== undefined;
        };
        obj.val = function(keyword, report){
            if($.isEmpty(obj.data)) {
                console.error("Dictionary is empty. You need to add a dictionary, for example: `$.dict.set({\n" +
                    "save   : { en : 'Save', es : 'Guardar' },\n" +
                    "cancel : { en : 'Cancel', es : 'Cancelar' }\n" +
                    "yes    : { en : 'Yes', es : 'Si' },\n" +
                    "no     : { en : 'No', es : 'No' }\n" +
                "})`");
                return "";
            }
            if(!keyword){
                console.error("No keyword specified.");
                return "";
            }
            let translation = keyword;
            if(report === undefined) {
                report = false;
            }
            keyword = keyword.toLowerCase();
            if(this.has(keyword)) {
                const baseLang = this.lang.split("-")[0];
                if(this.has(keyword, this.lang)) {
                    translation = this.data[keyword][this.lang];
                } else if(this.has(keyword,baseLang)) {
                    translation = this.data[keyword][baseLang];
                } else {
                    if(report){
                        console.log("Missing translation for lang ["+this.lang+"]: "+keyword);
                    }
                }
            } else {
                if(report){
                    console.log("Missing keyword: "+keyword);
                }
            }
            return translation;
        };
        return obj;
    }

    // Initialize dictionary
    $.dict = new Dictionary(language);

    const langEvents = [];
    $.lang = function(newLang) {
        if(newLang) {
            $.dict.lang = newLang;
            localStorage.setItem("m2d2.lang", $.dict.lang);
        }
        $("body").findAll("[lang]").forEach((elem) => {
            let txt = elem.text;
            // When element has content and (optional) title
            if(txt &&! elem.classList.contains("notxt")) {
                if(elem.dataset.kw === undefined) {
                    elem.dataset.kw = $.lang.getKeyword(txt);
                }
                elem.text = $.dict(elem.dataset.kw);
                const titleKw = elem.dataset.kw + "_title";
                let title = $.dict.has(titleKw) ? $.dict(titleKw) : "";
                if(title) {
                    elem.title = title;
                }
                // When element only has title:
            } else if(elem.title) {
                let title = ""
                if(elem.dataset.kw) {
                    title = $.dict(elem.dataset.kw);
                } else {
                    elem.dataset.kw = $.lang.getKeyword(elem.title);
                    title = $.dict(elem.dataset.kw);
                }
                if(title) {
                    elem.title = title;
                }
            } else if(elem.placeholder) {
                let placeholder = ""
                if(elem.dataset.kw) {
                    placeholder = $.dict(elem.dataset.kw);
                } else {
                    elem.dataset.kw = $.lang.getKeyword(elem.placeholder);
                    placeholder = $.dict(elem.dataset.kw);
                }
                if(placeholder) {
                    elem.placeholder = placeholder;
                }
            } else if(elem.value) {
                let value = ""
                if(elem.dataset.kw) {
                    value = $.dict(elem.dataset.kw);
                } else {
                    elem.dataset.kw = $.lang.getKeyword(elem.value);
                    value = $.dict(elem.dataset.kw);
                }
                if(value) {
                    elem.value = value;
                }
            }
        });
        langEvents.forEach(callback => {
            callback(newLang);
        });
    }
    /**
     * Convert text to keyword
     */
    $.lang.getKeyword = function(text) {
        return text.toLowerCase().trim().replace(/ /g,"_").replace(/[^\w]/g,"").replace(/_$/,"");
    }
    Object.defineProperty($.lang, "onchange", {
        get() { return this },
        set(value) {
            if($.isFunction(value)) {
                langEvents.push(value);
            } else {
                console.log("Unable to set lang.onchange, because it is not a function: ");
                console.log(value);
            }
        }
    })
});
// Translate HTML on ready:
m2d2.ready($ => {
    const manualLang = localStorage.getItem("m2d2.lang") || ""
    const bodyLang = $("body").find("[lang]");
    const htmlLang = $("html").lang || (bodyLang ? bodyLang.lang : null) || "en";
    const isDifferent = manualLang ? htmlLang !== manualLang : htmlLang !== navigator.language.split("-")[0];
    if(isDifferent) { $.lang() }
});