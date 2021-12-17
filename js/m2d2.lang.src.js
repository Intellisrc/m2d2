/**
 * M2D2 Language Extension
 * @since 2021-06-01
 *
 * This extension provides:
 * $.dict(keyword, [variables])  : To get translations from dictionary
 * $.lang(lang)                  : Set new language
 *
 * Usage:
 *  1) First you need to specify a dictionary with this format:
    const dictionary = {
        save   : {
            en : "Save",
            es : "Archivar",
            'es-MX' : "Guardar" // More specific translation
        },
        cancel : {
            en : "Cancel Now",
            es : "Cancelar Ahora"
        }
    }

    2) Then on initialization (only once), set the dictionary:
    // Recommended way:
    const _ = m2d2.load().dict.set(dictionary);
    // Or:
    m2d2.load($ => {
        $.dict.set(dictionary);
    });

    // And specify which language you want to use as default:
    m2d2.ready($ => {
        $.lang('en');

        // You can set the shortcut here if you want and if you didn't set it before:
        const _ = $.dict;
        // Then use it as: (example)
        $("#myid", {
            text : _("some_key"),
            css : "translated"
        });
    });

    3) In HTML you can set which texts should be translated automatically:
    `<span lang="es">Cancelar</span>`
    Then, in the next step, it will be translated if it doesn't match the target language.

    NOTE: If you use 'lang' in HTML, be sure that the language and the text matches the keys. For example,
    if your default language is English, you should do something like this:
    `<span lang="en">Phone Number</span>`
    Then, in your dictionary, you should use the keyword:
    {
        phone_number : {
            en : "Phone Number",
            es : "Número de Teléfono"
        }
    }
    If the key is not found it will display it, so that is one way to know which keyword to use, another way
    is getting the key from a text with: $.lang.toKeyword("Some Text").

    If your default language is not English, you have 3 options:
        a) Create the interface in English and execute `$.lang('xx')` on ready (xx = your language code). That will translate the UI
        b) Put keywords instead of English words (e.g, `<span lang='en'>user_name_goes_here</span>`) and execute `$.lang('xx')` on ready.
        c) specify the keyword in the dataset: `<span class="usr" lang='pa' data-kw='username'>ਉਪਭੋਗਤਾ ਨਾਮ</span>` or in javascript:
               usr : {
                    dataset : { kw : "username" },
                    lang : "pa",
                    text : "ਉਪਭੋਗਤਾ ਨਾਮ"
               }

    4) To set or change the language (by default it will use browser's default language):
    $.lang("en");

    5) Get translation:
    user.title.text = $.dict("user");

    6) You can set your default language (page language) in your html tag: `<html lang='es'>`, that way this extension
    knows that your HTML content is by default in that language, and decide if we need to translated for the user.
    If you don't set it, it will use the first element with the attribute "lang".

    7) You can execute some code when the language is changed by setting an event listener:
    `$.lang.onchange = (new_lang) => { ... }`

    Recommendation:
    I recommend to set a shortcut for the dictionary (you can set it right after loading this extension):
    const _ = $.dict;
    Or setting dictionary at the same time:
    const _ = $.dict.set(dictionary);
    To declare it as global, you can set it as:
    const _ = m2d2.load().dict;

    That way, you can use it like:
    user.title.text = _("user");

    Final Note:
    When you change the language, it will keep in the local storage (at the browser) your selection, so
    if you refresh the page it will still use your selected language.
 *
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
    const htmlLang = $("html").lang || $("body").find("[lang]").lang || "en";
    const isDifferent = manualLang ? htmlLang !== manualLang : htmlLang !== navigator.language.split("-")[0];
    if(isDifferent) { $.lang() }
});