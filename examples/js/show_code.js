m2d2.ready($ => {
    const js = js_beautify($("#code").text, { indent_size: 2, space_in_empty_parent: true });
    const code = $.htmlNode("<section class='js'><h1>Javascript</h1><code class='js'>" + js + "</code></section>");
    const body = $("body");
    body.appendChild(code);
    body.findAll('code').forEach(block => {
        hljs.highlightElement(block);
    });
});