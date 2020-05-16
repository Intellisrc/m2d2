document.addEventListener("DOMContentLoaded", function() {
    const menuLinks = {
        "Update from input" : "index.html",
        "Update from input (alternative way)" : "index2.html",
        "Update from input using object" : "object.html",
        "Update from input (multiple targets)" : "multiple.html",
        "Update using callback" : "index-adv.html",
        "Menu (show and style extensions)" : "menu.html",
        "Timer" : "timer.html",
        "Logging screen" : "log.html",
        "Movie list - Async" : "list-async.html",
        "Item list" : "list.html",
        "Item list (advanced)" : "list-adv.html",
        "Phone book - Async" : "async.html",
        "Form validation" : "form.html",
        "Custom extensions" : "extend.html",
    }
    m2d2(function(callback) {
        const links = [];
        for(let title in menuLinks) {
            links.push({
                a : {
                    text : title,
                    href : "examples/" + menuLinks[title]
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
    });
});
