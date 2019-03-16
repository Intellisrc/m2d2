document.addEventListener("DOMContentLoaded", function() {
    var menuLinks = {
        "Update from input" : "index.html",
        "Update from input (alternative way)" : "index2.html",
        "Update from input using callback" : "index-adv.html",
        "Menu (using JQuery)" : "menu.html",
        "Using object" : "object.html",
        "Timer" : "timer.html",
        "Item list" : "list.html",
        "Item list (advanced)" : "list-adv.html",
        "Phone book - Async" : "async.html",
        "Form validation" : "form.html",
        "Custom extensions" : "extend.html",
    }
    m2d2(function(callback) {
        var links = [];
        for(var title in menuLinks) {
            links.push({
                a : {
                    text : title,
                    href : menuLinks[title]
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
