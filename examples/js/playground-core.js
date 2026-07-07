/**
 * M2D2 Tutorial Playground — core (pure functions, no dependencies).
 *
 * Loaded as a classic <script> (see index.html). Exposes window.pg with:
 *   - parseLesson(src)      → { html, js, css }
 *   - assembleSrcDoc(...)   → full HTML document string for iframe srcdoc
 *
 * The interactive Playground singleton lives in playground.js (Task 4) and
 * consumes window.pg. Splitting the pure functions out keeps them unit-testable
 * in jsdom without dragging in CodeMirror or m2d2.
 */
(function () {
    "use strict";
    var pg = {};

    /**
     * Parse a lesson HTML file into { html, js, css }.
     * - css: concatenated text of all <style> tags
     * - js:  concatenated text of all inline <script> (no src) tags
     * - html: body.innerHTML with <script>/<style> nodes removed
     * - links: array of <link rel="stylesheet" href="..."> outerHTML from <head>
     * Throws if the input has no <body>.
     */
    pg.parseLesson = function (src) {
        var doc = new DOMParser().parseFromString(src, "text/html");
        var body = doc.body;
        if (!body) {
            throw new Error("playground: lesson file has no <body>");
        }

        // css ← all <style> in <head> or <body>
        var css = "";
        doc.querySelectorAll("style").forEach(function (node) {
            css += node.textContent + "\n";
        });

        // js ← only inline <script> (no src attribute)
        var js = "";
        doc.querySelectorAll("script:not([src])").forEach(function (node) {
            js += node.textContent + "\n";
        });

        // links ← <link rel="stylesheet"> from <head> (preserved so the srcdoc
        // can re-inject external CSS like the alert extension's stylesheets).
        var links = [];
        doc.querySelectorAll('head link[rel="stylesheet"]').forEach(function (node) {
            links.push(node.outerHTML);
        });

        // html ← body clone with script/style removed
        var clone = body.cloneNode(true);
        clone.querySelectorAll("script, style").forEach(function (node) {
            node.remove();
        });
        var html = clone.innerHTML.trim();

        return { html: html, js: js.trim(), css: css.trim(), links: links };
    };

    /**
     * Reassemble a complete HTML document for iframe srcdoc.
     * Injects, in order:
     *   1. <base href> so relative paths (../../dist/m2d2.min.js) resolve
     *   2. error bootstrap (window.onerror + console proxy) — runs before anything else
     *   3. <link rel="stylesheet"> tags preserved from the lesson's <head>
     *   4. <style> from css pane
     *   5. body content from html pane
     *   6. library script (../../dist/m2d2.min.js)
     *   7. user JS from js pane
     *
     * `opts` is optional: { links: [..] } from parseLesson's output.
     */
    pg.assembleSrcDoc = function (html, js, css, baseUrl, opts) {
        var links = (opts && opts.links) ? opts.links : [];
        var linksHtml = links.map(function (l) { return l; }).join("\n") + (links.length ? "\n" : "");

        var bootstrap =
            "<script>\n" +
            "(function(){\n" +
            "  function report(level, args){\n" +
            "    try { parent.postMessage({ type: 'pg-error', level: level, \n" +
            "      message: Array.prototype.map.call(args, String).join(' ') }, '*'); } catch(e){}\n" +
            "  }\n" +
            "  window.onerror = function(msg, src, line, col){\n" +
            "    report('error', [msg + ' (line ' + line + ', col ' + col + ')']);\n" +
            "    return false;\n" +
            "  };\n" +
            "  ['error','warn'].forEach(function(level){\n" +
            "    var orig = console[level];\n" +
            "    console[level] = function(){ report(level, arguments); };\n" +
            "  });\n" +
            "})();\n" +
            "</script>";

        return "<!DOCTYPE html>\n" +
            "<html>\n<head>\n" +
            '<base href="' + baseUrl + '">\n' +
            bootstrap + "\n" +
            linksHtml +
            "<style>" + css + "</style>\n" +
            "</head>\n<body>\n" +
            html + "\n" +
            '<script src="../../dist/m2d2.min.js"></script>\n' +
            "<script>\n" + js + "\n</script>\n" +
            "</body>\n</html>";
    };

    window.pg = pg;
})();
