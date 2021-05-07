m2d2.ready($ => {
    const body = $("body");
    const ol = $.newNode("ol");
    body.appendChild(ol);
    const nav = $(ol, {
        css : "nav",
        template : { li : { a : {} }},
        items : [
            { a : { text : "How to start...", href : "index.html" } },
            { a : { text : "DOM objects", href : "dom-objects.html" } },
        ]
    });
    body.findAll('code').forEach(block => {
        block.classList.add("js");
        hljs.highlightElement(block);
    });
});