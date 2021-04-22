m2d2.ready($ => {
    const menuLinks = {
        "Update from input" : "index.html",
        "Update from input using object" : "object.html",
        "Update from input (multiple targets)" : "multiple.html",
        "Update object" : "index-adv.html",
        "Menu (show and css)" : "menu.html",
        "Timer" : "timer.html",
        "Logging screen" : "log.html",
        "Movie list - Async" : "list-async.html",
        "Item list" : "list.html",
        "Item list (sort)" : "list-sort.html",
        "Item list (advanced)" : "list-alt.html",
        "Phone book - Async" : "async.html",
        "Form validation" : "form.html"
    }
    $(function() {
        const links = [];
        const baseURL = window.location.href.indexOf("examples/") >= 0 ? "" : "examples/";
        for(let title in menuLinks) {
            links.push({
                a : {
                    text : title,
                    href : baseURL + menuLinks[title]
                }
            });
        }
        return {
            footer : {
                hr : {
                    style : {
                        border: "2px solid #DDD",
                        margin: "10px 0"
                    }
                },
                h3 : "Examples:",
                nav : {
                    ul : {
                        template : "li",
                        items : links
                    }
                }
            }
        }
    }());
});
