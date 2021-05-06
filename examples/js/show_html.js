m2d2.ready($ => {
    const escapeHTML = str => str.replace(/[&<>'"]/g, tag => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
    }[tag]));
    const html = escapeHTML(html_beautify($("#example").html, { indent_size: 2, space_in_empty_parent: true }));
    const code = $.htmlNode("<section class='html'><h1>HTML (initial)</h1><code class='html'>" + html + "</code></section>");
    const body = $("body");
    body.appendChild(code);
});