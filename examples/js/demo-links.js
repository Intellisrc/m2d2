m2d2.ready($ => {
    const menuLinks = {
        "Update from input" : "index.html",
        "Update from input using object" : "object.html",
        "Update from input (multiple targets)" : "multiple.html",
        "Linked references" : "dataset-style.html",
        "Update object" : "index-adv.html",
        "Menu (show and css)" : "menu.html",
        "Timer" : "timer.html",
        "Logging screen" : "log.html",
        "Movie list - Async" : "list-async.html",
        "Item list (sort)" : "list-sort.html",
        "Phone book - Async" : "async.html",
        "Form validation" : "form.html",
        "Performance test" : "performance.html",
    }
    $("body", function() {
        const links = [];
        const baseURL = window.location.href.indexOf("examples/") >= 0 ? "" : "tests/";
        for(let title in menuLinks) {
            links.push({
                selected : window.location.pathname.endsWith("/" + menuLinks[title]),
                a : {
                    text : title,
                    href : baseURL + menuLinks[title]
                }
            });
        }
        return {
            header : { h1 : "Examples" },
            aside : {
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
