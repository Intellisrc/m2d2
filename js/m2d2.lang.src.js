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
            'es-MX' : "Guardar"
        },
        cancel : {
            en : "Cancel Now",
            es : "Cancelar Ahora"
        }
    }

    2) Then on initialization (only once), set the dictionary:
    $.dict.set(dictionary);

    3) Set / change language (if not set, it will use browser's default language):
    $.lang("en");

    4) Get translation:
    user.title.text = $.dict("user");

    Recommendation:
    I recommend to set a shortcut for the dictionary (you can set it right after loading this extension):
    const _ = $.dict;

    That way, you can use it like:
    user.title.text = _("user");
 *
 */
m2d2.load($ => {
    let language = localStorage.getItem("m2d2.lang") || navigator.language;
    function Dictionary(lang) {
        const obj = function(keyword, vars) {
            if(keyword === undefined) return "";
            let msg = this.val(keyword,true);
            if(vars !== undefined) {
                if(typeof vars == "string"){
                    if(vars != "") {
                        vars = vars.replace(/;$/,"");
                        var pairs = vars.split(";");
                        vars = {};
                        for(var p in pairs){
                            var part = pairs[p].split(":");
                            vars[part[0]] = part[1];
                        }
                    }
                }
                if(typeof vars == "object"){
                    for(var v in vars) {
                        let kwd = vars[v] + ""; //Be sure its string
                        kwd = this.val(kwd,false);
                        msg = msg.replace(v,kwd);
                    }
                }
            }
            return msg;
        };
        obj.lang = lang || "en";
        obj.data = {};
        obj.set = function(dictionary) {
            this.data = dictionary;
        };
        obj.has = function(keyword, lang) {
            return lang === undefined ? this.data[keyword] !== undefined : this.data[keyword][lang] !== undefined;
        };
        obj.val = function(keyword, report){
            if($.isEmpty(obj.data)) {
                console.error("Dictionary is empty. You need to add a dictionary, for example: `$.lang('en', {\n" +
                    "save : { en : 'Save', es : 'Guardar' },\n" +
                    "cancel : { en : 'Cancel', es : 'Cancelar' }\n" +
                "})`");
                return "";
            }
            if(!keyword){
                console.error("No keyword specified.");
                return "";
            }
            let translation = keyword;
            if(report == undefined) {
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
    };
    /**
     * Convert text to keyword
     */
    function textToKW(text) {
        return text.toLowerCase().trim().replace(/ /g,"_").replace(/[^\w]/g,"").replace(/_$/,"");
    }

    // Initialize dictionary
    $.dict = new Dictionary(language);

    const langEvents = [];
    $.lang = function(newLang) {
        $.dict.lang = newLang;
        localStorage.setItem("m2d2.lang", $.dict.lang);
        $("body").findAll("[lang]").forEach((elem) => {
            let txt = elem.text;
            // When element has content and (optional) title
            if(txt &&! elem.classList.contains("notxt")) {
                if(elem.dataset.kw == undefined) {
                    elem.dataset.kw = textToKW(txt);
                }
                elem.text = $.dict(elem.dataset.kw);
                const titleKw = elem.dataset.kw + "_title";
                let title = $.dict.has(titleKw) ? $.dict(titleKw) : "";
                if(title) {
                    elem.title = title;
                }
            // When element only has title:
            } else if(elem.title) {
                if(elem.dataset.kw == undefined) {
                    elem.dataset.kw = textToKW(txt);
                }
                let title = $.dict(elem.dataset.kw);
                if(title) {
                    elem.title = title;
                }
            } else if(elem.value) {
                if(elem.dataset.kw == undefined) {
                    elem.dataset.kw = textToKW(txt);
                }
                let value = $.dict(elem.dataset.kw);
                if(value) {
                    elem.value = value;
                }
            }
        });
        langEvents.forEach(callback => {
            callback();
        });
    }
    $.lang.onchange = function(callback) {
        if(callback) {
            langEvents.push(callback);
        }
    }
});