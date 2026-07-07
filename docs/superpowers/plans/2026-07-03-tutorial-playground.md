# Tutorial Playground & Users/Groups Project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tutorial's JSFiddle embeds with a self-hosted CodeMirror 6 playground, and author a 6-lesson Users/Groups CRUD build-up (with localStorage persistence) as the tutorial's primary content.

**Architecture:** Two new scripts in `examples/js/`: `playground-core.js` (dependency-free pure functions `parseLesson`/`assembleSrcDoc`, exposed on `window.pg`) and `playground.js` (interactive Playground singleton that lazily `import()`s CodeMirror 6 via an import map, fetches+parses lessons, mounts editors, runs them in a sandboxed iframe `srcdoc`, and surfaces iframe errors back via `postMessage`). `pages.js` is rewritten to fetch local lesson files instead of building JSFiddle URLs. Six standalone lesson HTML files in `examples/tutorial/` build the users/groups app incrementally. Pure parse/assemble functions are unit-tested in the existing Vitest suite; interactive parts are covered by a manual checklist.

**Tech Stack:** CodeMirror 6 (ESM via import map / esm.sh), m2d2 (existing), `m2d2.storage` extension (localStorage), Vitest + jsdom (unit tests), vanilla HTML/CSS (lessons).

---

## File Structure

**New files:**
- `examples/js/playground-core.js` — Pure functions only (no deps): `parseLesson` and `assembleSrcDoc`, exposed on `window.pg`. Unit-testable. Classic `<script>`.
- `examples/js/playground.js` — Interactive Playground singleton: lazily imports CodeMirror 6 via dynamic `import()` + an import map, fetches+parses lessons, mounts editors, Run/Reset/Auto-run, error capture. Classic `<script>`; consumes `window.pg`. Exposes `window.playground`.
- `examples/css/playground.css` — Playground layout: toolbar, editor tabs, split panes, preview iframe, error bar, responsive collapse.
- `examples/tutorial/01-static-render.html` — Lesson 1: static user/group list render.
- `examples/tutorial/02-add-user.html` — Lesson 2: + add-user form.
- `examples/tutorial/03-edit-delete.html` — Lesson 3: + edit/delete per user.
- `examples/tutorial/04-groups.html` — Lesson 4: + group CRUD.
- `examples/tutorial/05-membership.html` — Lesson 5: + user↔group membership checkboxes.
- `examples/tutorial/06-persistence.html` — Lesson 6: + localStorage save/load.
- `examples/tutorial/MANUAL.md` — Manual browser test checklist.
- `examples/serve.sh` — One-line HTTP server helper.
- `test/playground.test.ts` — Unit tests for `parseLesson` and `assembleSrcDoc`.

**Modified files:**
- `examples/tutorial.html` — Add CodeMirror CDN script, `playground.css` link, `playground.js` script; add playground mount markup inside `#example`.
- `examples/js/tutorial.js` — Change `pages[]` schema: `id` (JSFiddle hash) → `file` (local lesson path); rewrite the 4 entries to the 6-lesson set.
- `examples/js/pages.js` — Remove JSFiddle URL logic; on lesson select call `playground.load(file)`; keep nav/routing/prev-next/lesson-text rendering.

**Unchanged:** `examples/css/examples.css` (tutorial shell layout already works), `dist/` build (playground is static assets, no build step), all `src/` and `test/` except the new `test/playground.test.ts`.

---

## Task 1: Playground unit tests (TDD — pure functions first)

**Files:**
- Create: `test/playground.test.ts`

This task writes failing tests for the two pure functions the playground exposes (`parseLesson`, `assembleSrcDoc`). They will live in `examples/js/playground-core.js` (Task 2) — a dependency-free classic script that only touches `window`, `DOMParser`, and string concatenation. The tests load it as text and `eval` it into the jsdom global, then call `window.pg.parseLesson` / `window.pg.assembleSrcDoc`. (jsdom provides `DOMParser`.)

- [ ] **Step 1: Write the failing tests**

Create `test/playground.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// playground-core.js is a dependency-free classic script. Load it as text and
// eval into the jsdom global so we can exercise its pure functions. It exposes
// window.pg = { parseLesson, assembleSrcDoc }.
const PG_SRC = fs.readFileSync(
    path.resolve(__dirname, "../examples/js/playground-core.js"),
    "utf8"
);

function loadPg() {
    (0, eval)(PG_SRC);
}

describe("parseLesson", () => {
    beforeEach(() => loadPg());

    it("extracts html, js, css from a complete lesson file", () => {
        const src = `<!DOCTYPE html><html><head>
<style>body { color: red; }</style>
</head><body>
<h1 id="t">Hi</h1>
<script src="../../dist/m2d2.min.js"></script>
<script>m2d2.ready($ => { $("#t", "Hello"); });</script>
</body></html>`;
        const result = (globalThis as any).pg.parseLesson(src);
        expect(result.css.trim()).toBe("body { color: red; }");
        expect(result.js.trim()).toBe('m2d2.ready($ => { $("#t", "Hello"); });');
        // html = body innerHTML minus script/style tags; the h1 remains:
        expect(result.html).toContain('<h1 id="t">Hi</h1>');
        expect(result.html).not.toContain("<script");
        expect(result.html).not.toContain("<style");
    });

    it("handles multiple <style> tags (concatenated)", () => {
        const src = `<html><head><style>a{}</style><style>b{}</style></head><body><p>x</p></body></html>`;
        const result = (globalThis as any).pg.parseLesson(src);
        expect(result.css).toContain("a{}");
        expect(result.css).toContain("b{}");
    });

    it("handles a lesson with no <style> (empty css)", () => {
        const src = `<html><body><p>x</p><script>1;</script></body></html>`;
        const result = (globalThis as any).pg.parseLesson(src);
        expect(result.css).toBe("");
    });

    it("handles a lesson with no inline <script> (empty js)", () => {
        const src = `<html><head><style>x{}</style></head><body><p>x</p></body></html>`;
        const result = (globalThis as any).pg.parseLesson(src);
        expect(result.js).toBe("");
    });

    it("excludes external <script src> from js (only inline scripts)", () => {
        const src = `<html><body><script src="x.js"></script><script>INLINE;</script></body></html>`;
        const result = (globalThis as any).pg.parseLesson(src);
        expect(result.js.trim()).toBe("INLINE;");
    });

    it("throws on malformed input with no <body>", () => {
        const src = `<html><head></head></html>`;
        expect(() => (globalThis as any).pg.parseLesson(src)).toThrow();
    });
});

describe("assembleSrcDoc", () => {
    beforeEach(() => loadPg());

    it("produces a complete html document with base, error bootstrap, and user code", () => {
        const result = (globalThis as any).pg.assembleSrcDoc(
            "<h1>Hi</h1>",
            "m2d2.ready($=>{});",
            "body{color:red;}",
            "http://localhost:8000/examples/tutorial/"
        );
        expect(result).toContain("<!DOCTYPE html>");
        expect(result).toContain('<base href="http://localhost:8000/examples/tutorial/">');
        expect(result).toContain("window.onerror");
        expect(result).toContain("<h1>Hi</h1>");
        expect(result).toContain("m2d2.ready($=>{});");
        expect(result).toContain("body{color:red;}");
    });

    it("includes the m2d2 library script tag", () => {
        const result = (globalThis as any).pg.assembleSrcDoc("", "", "", "http://x/");
        expect(result).toContain('src="../../dist/m2d2.min.js"');
    });

    it("injects the error bootstrap before the library script", () => {
        const result = (globalThis as any).pg.assembleSrcDoc("", "", "", "http://x/");
        const onErrorIdx = result.indexOf("window.onerror");
        const libIdx = result.indexOf('m2d2.min.js');
        expect(onErrorIdx).toBeGreaterThan(-1);
        expect(libIdx).toBeGreaterThan(-1);
        expect(onErrorIdx).toBeLessThan(libIdx);
    });

    it("namespaces console.error/warn through postMessage", () => {
        const result = (globalThis as any).pg.assembleSrcDoc("", "", "", "http://x/");
        expect(result).toContain("pg-error");
        expect(result).toMatch(/console\.(error|warn)/);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/playground.test.ts`
Expected: FAIL — `playground-core.js` does not exist yet, so `fs.readFileSync` throws `ENOENT`.

- [ ] **Step 3: Commit**

```bash
git add test/playground.test.ts
git commit -m "test: add failing tests for playground parse/assemble"
```

---

## Task 2: `playground-core.js` — pure functions (no dependencies)

**Files:**
- Create: `examples/js/playground-core.js`

Implements `parseLesson` and `assembleSrcDoc` as pure functions exposed on `window.pg`. This file is deliberately dependency-free (no m2d2, no CodeMirror) so it's unit-testable in jsdom and loadable as a classic `<script>`. This task makes Task 1's tests pass.

- [ ] **Step 1: Create `playground-core.js`**

Create `examples/js/playground-core.js`:

```js
/**
 * M2D2 Tutorial Playground — core (pure functions, no dependencies).
 *
 * Loaded as a classic <script> (see tutorial.html). Exposes window.pg with:
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

        // html ← body clone with script/style removed
        var clone = body.cloneNode(true);
        clone.querySelectorAll("script, style").forEach(function (node) {
            node.remove();
        });
        var html = clone.innerHTML.trim();

        return { html: html, js: js.trim(), css: css.trim() };
    };

    /**
     * Reassemble a complete HTML document for iframe srcdoc.
     * Injects, in order:
     *   1. <base href> so relative paths (../../dist/m2d2.min.js) resolve
     *   2. error bootstrap (window.onerror + console proxy) — runs before anything else
     *   3. <style> from css pane
     *   4. body content from html pane
     *   5. library script (../../dist/m2d2.min.js)
     *   6. user JS from js pane
     */
    pg.assembleSrcDoc = function (html, js, css, baseUrl) {
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
            "<style>" + css + "</style>\n" +
            "</head>\n<body>\n" +
            html + "\n" +
            '<script src="../../dist/m2d2.min.js"></script>\n' +
            "<script>\n" + js + "\n</script>\n" +
            "</body>\n</html>";
    };

    window.pg = pg;
})();
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run test/playground.test.ts`
Expected: PASS (all 10 tests).

- [ ] **Step 3: Commit**

```bash
git add examples/js/playground-core.js
git commit -m "feat(playground): add parseLesson and assembleSrcDoc pure functions"
```

---

## Task 3: Playground CSS layout

**Files:**
- Create: `examples/css/playground.css`

Standalone CSS file for the playground UI. Imported by `tutorial.html` alongside the existing `examples.css`.

- [ ] **Step 1: Create `playground.css`**

Create `examples/css/playground.css`:

```css
/* M2D2 Tutorial Playground
   Layout: toolbar on top, editor (left) + preview (right) below.
   The #example <section> is the mount point (its template is removed by pages.js
   so the playground owns its contents). */

#example .pg-root {
    display: grid;
    grid-template-rows: auto 1fr;
    grid-template-areas: "toolbar toolbar" "editors preview";
    grid-template-columns: 55% 45%;
    height: 100%;
    min-height: 500px;
}

#example .pg-toolbar {
    grid-area: toolbar;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: #1c2128;
    border-bottom: 1px solid #414a52;
}

#example .pg-toolbar button,
#example .pg-toolbar label {
    background: #2a303b;
    color: #eee;
    border: 1px solid #414a52;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 13px;
    line-height: 1.4;
    border-radius: 3px;
}

#example .pg-toolbar button:hover {
    background: #3a404b;
}

#example .pg-toolbar .pg-spacer {
    flex: 1;
}

#example .pg-toolbar select {
    background: #2a303b;
    color: #eee;
    border: 1px solid #414a52;
    padding: 6px;
    border-radius: 3px;
    font-size: 13px;
}

#example .pg-editors {
    grid-area: editors;
    display: grid;
    grid-template-rows: auto 1fr;
    grid-template-areas: "tabs" "editor";
    background: #1e1e1e;
    border: 1px solid #414a52;
    overflow: hidden;
}

#example .pg-tabs {
    grid-area: tabs;
    display: flex;
    background: #181d26;
    border-bottom: 1px solid #414a52;
}

#example .pg-tabs button {
    background: transparent;
    color: #999;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 13px;
}

#example .pg-tabs button.pg-active {
    color: #eee;
    border-bottom-color: #5a1e34;
}

#example .pg-editor-host {
    grid-area: editor;
    overflow: auto;
}

#example .pg-editor-host .cm-editor {
    height: 100%;
}

#example .pg-editor-host .cm-scroller {
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: 13px;
}

#example .pg-preview-wrap {
    grid-area: preview;
    display: grid;
    grid-template-rows: 1fr auto;
    grid-template-areas: "frame" "error";
    background: #fff;
    border: 1px solid #414a52;
    overflow: hidden;
}

#example .pg-preview-wrap iframe {
    grid-area: frame;
    width: 100%;
    height: 100%;
    border: none;
    background: #fff;
}

#example .pg-errorbar {
    grid-area: error;
    background: #2a1517;
    color: #ff8080;
    border-top: 1px solid #5a1e34;
    padding: 8px;
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: 12px;
    white-space: pre-wrap;
    max-height: 120px;
    overflow: auto;
    display: none;
}

#example .pg-errorbar.pg-visible {
    display: block;
}

/* Responsive: stack editors above preview on narrow screens. */
@media (max-width: 760px) {
    #example .pg-root {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto;
        grid-template-areas: "toolbar" "editors" "preview";
    }
    #example .pg-editors,
    #example .pg-preview-wrap {
        min-height: 300px;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add examples/css/playground.css
git commit -m "feat(playground): add layout CSS (toolbar, editors, preview, errorbar)"
```

---

## Task 4: Playground interactive layer — CodeMirror (ESM import map) + Run/Reset/Auto-run

**Files:**
- Create: `examples/js/playground.js`

A classic `<script>` defining the `Playground` singleton. CodeMirror 6 is ESM-only and has no UMD bundle, so we load it **lazily** with a dynamic `import()` of bare specifiers (`codemirror`, `@codemirror/lang-javascript`, `@codemirror/lang-html`). `tutorial.html` (Task 7) declares an `<script type="importmap">` mapping those bare specifiers to jsDelivr's ESM endpoint, so the dynamic imports resolve from CDN. Because `playground.js` is a classic script, dynamic `import()` is the bridge that lets it consume ESM modules.

This file consumes `window.pg` (from `playground-core.js`, Task 2). `pages.js` (Task 6) calls `window.playground.load(file)`.

- [ ] **Step 1: Create `playground.js`**

Create `examples/js/playground.js`:

```js
/* eslint-disable */
/**
 * M2D2 Tutorial Playground — interactive layer.
 *
 * Classic <script>. Lazily imports CodeMirror 6 via dynamic import() against the
 * import map declared in tutorial.html. Consumes window.pg (playground-core.js).
 * Exposes window.playground = { load, setLessonList, setCurrentLesson }.
 *
 * Why dynamic import? CodeMirror 6 ships as ESM only (no UMD). A classic script
 * can't use static `import`, but it CAN use the dynamic import() expression, and
 * the import map (Task 7) resolves the bare specifiers to the CDN. This keeps
 * playground.js itself a normal script that runs before the module graph loads.
 */
m2d2.ready(function ($) {
    var MOUNT = null;        // current #example root (.pg-root)
    var editor = null;       // CodeMirror EditorView (set after first load)
    var editorReady = null;  // Promise<void> — in-flight CodeMirror import
    var current = null;      // { html, js, css } original parse (for reset)
    var activeTab = "js";    // current visible tab
    var docs = null;         // { html, js, css } current editable values
    var autoRunTimer = null;
    var autoRunOn = false;
    var baseUrl = "";        // lesson file directory, for <base>

    // ---- DOM scaffold ----
    function scaffold() {
        var example = document.getElementById("example");
        example.innerHTML = "";
        var root = document.createElement("div");
        root.className = "pg-root";
        root.innerHTML =
            '<div class="pg-toolbar">' +
                '<button class="pg-run">Run ▶</button>' +
                '<button class="pg-reset">Reset ↺</button>' +
                '<label><input type="checkbox" class="pg-autorun"> Auto-run</label>' +
                '<span class="pg-spacer"></span>' +
                '<select class="pg-lesson"></select>' +
            '</div>' +
            '<div class="pg-editors">' +
                '<div class="pg-tabs">' +
                    '<button data-tab="html">HTML</button>' +
                    '<button data-tab="js" class="pg-active">JS</button>' +
                    '<button data-tab="css">CSS</button>' +
                '</div>' +
                '<div class="pg-editor-host"></div>' +
            '</div>' +
            '<div class="pg-preview-wrap">' +
                '<iframe sandbox="allow-scripts allow-same-origin"></iframe>' +
                '<div class="pg-errorbar"></div>' +
            '</div>';
        example.appendChild(root);
        MOUNT = root;
        return root;
    }

    // ---- CodeMirror init (lazy ESM import via import map) ----
    function ensureEditor() {
        if (editor) return Promise.resolve();
        if (editorReady) return editorReady;
        editorReady = Promise.all([
            import("codemirror"),                       // default export: basicSetup + EditorView
            import("@codemirror/lang-javascript"),
            import("@codemirror/lang-html")
        ]).then(function (mods) {
            var cm = mods[0];            // { EditorView, basicSetup }
            var jsLang = mods[1];        // { javascript }
            var htmlLang = mods[2];      // { html }
            var host = MOUNT.querySelector(".pg-editor-host");
            editor = new cm.EditorView({
                doc: docs ? (docs[activeTab] || "") : "",
                extensions: [
                    cm.basicSetup,
                    cm.EditorView.lineWrapping,
                    cm.EditorView.updateListener.of(function (u) {
                        if (u.docChanged && autoRunOn) scheduleRun();
                    }),
                    jsLang.javascript(),
                    htmlLang.html()
                ],
                parent: host
            });
        }).catch(function (err) {
            // If the CDN/import-map fails, degrade gracefully: log and keep the
            // preview working without an editor (a <textarea> would be a fallback).
            console.error("[playground] CodeMirror failed to load:", err);
            MOUNT.querySelector(".pg-editor-host").textContent =
                "Editor unavailable (CodeMirror could not be loaded). Preview still works.";
            editorReady = null; // allow retry on next load
        });
        return editorReady;
    }

    // ---- tab switching ----
    function setTab(name) {
        if (!docs) return;
        if (editor) docs[activeTab] = editor.state.doc.toString();
        activeTab = name;
        if (editor) {
            editor.dispatch({
                changes: { from: 0, to: editor.state.doc.length, insert: docs[name] || "" }
            });
        }
        MOUNT.querySelectorAll(".pg-tabs button").forEach(function (b) {
            b.classList.toggle("pg-active", b.dataset.tab === name);
        });
    }

    // ---- run / reset ----
    function run() {
        if (!docs) return;
        if (editor) docs[activeTab] = editor.state.doc.toString();
        var srcdoc = window.pg.assembleSrcDoc(docs.html, docs.js, docs.css, baseUrl);
        var iframe = MOUNT.querySelector("iframe");
        var bar = MOUNT.querySelector(".pg-errorbar");
        bar.classList.remove("pg-visible");
        bar.textContent = "";
        iframe.srcdoc = srcdoc;
    }

    function reset() {
        if (!current) return;
        docs = { html: current.html, js: current.js, css: current.css };
        if (editor) {
            editor.dispatch({
                changes: { from: 0, to: editor.state.doc.length, insert: docs[activeTab] || "" }
            });
        }
        run();
    }

    function scheduleRun() {
        clearTimeout(autoRunTimer);
        autoRunTimer = setTimeout(run, 500);
    }

    // ---- error capture (from iframe postMessage) ----
    window.addEventListener("message", function (event) {
        var data = event.data;
        if (!data || data.type !== "pg-error" || !MOUNT) return;
        var bar = MOUNT.querySelector(".pg-errorbar");
        var line = "[" + (data.level || "error") + "] " + (data.message || "");
        bar.textContent = (bar.textContent ? bar.textContent + "\n" : "") + line;
        bar.classList.add("pg-visible");
    });

    // ---- public API ----
    window.playground = {
        load: function (file) {
            // baseUrl = directory of the lesson file (so ../../dist/m2d2.min.js resolves):
            var here = location.href.substring(0, location.href.lastIndexOf("/") + 1);
            var dir = file.substring(0, file.lastIndexOf("/") + 1);
            baseUrl = here + dir;

            return fetch(file).then(function (r) {
                if (!r.ok) throw new Error("playground: cannot load " + file + " (" + r.status + ")");
                return r.text();
            }).then(function (src) {
                current = window.pg.parseLesson(src);
                docs = { html: current.html, js: current.js, css: current.css };
                scaffold();
                return ensureEditor().then(function () {
                    setTab(activeTab);
                    run();
                    return current;
                });
            });
        },

        setLessonList: function (entries, onSelect) {
            var sel = MOUNT ? MOUNT.querySelector(".pg-lesson") : null;
            if (!sel) return;
            sel.innerHTML = "";
            entries.forEach(function (e) {
                var opt = document.createElement("option");
                opt.value = e.file;
                opt.textContent = e.title;
                sel.appendChild(opt);
            });
            sel.onchange = function () { onSelect(sel.value); };
        },

        setCurrentLesson: function (file) {
            var sel = MOUNT ? MOUNT.querySelector(".pg-lesson") : null;
            if (sel) sel.value = file;
        }
    };

    // ---- toolbar wiring (event delegation on document) ----
    document.addEventListener("click", function (e) {
        if (!MOUNT || !MOUNT.contains(e.target)) return;
        var t = e.target;
        if (t.classList.contains("pg-run")) run();
        else if (t.classList.contains("pg-reset")) reset();
        else if (t.dataset && t.dataset.tab) setTab(t.dataset.tab);
    });
    document.addEventListener("change", function (e) {
        if (!MOUNT || !MOUNT.contains(e.target)) return;
        if (e.target.classList.contains("pg-autorun")) autoRunOn = e.target.checked;
    });
});
```

- [ ] **Step 2: Commit**

```bash
git add examples/js/playground.js
git commit -m "feat(playground): add interactive layer (lazy CM6 via import map, run/reset/autorun/errorbar)"
```

---

## Task 5: Rewrite `tutorial.js` — `pages[]` schema → `file`

**Files:**
- Modify: `examples/js/tutorial.js`

Change the data array so each entry points to a local lesson file instead of a JSFiddle ID. The 6-lesson users/groups build-up.

- [ ] **Step 1: Replace the `pages` array contents**

Open `examples/js/tutorial.js`. Replace the entire `const pages = [ ... ];` array with:

```js
const pages = [
    {
        file: "tutorial/01-static-render.html",
        title: "1. Render the data",
        description: "We start by rendering a static list of users and groups. " +
            "This lesson covers <code>m2d2.ready</code>, short-assign, templates, and items.",
        lessons: [
            "Every m2d2 program begins with <code>m2d2.ready($ =&gt; { ... })</code>. " +
            "The <code>$</code> is the m2d2 function used to bind data to the DOM.",
            "We use a <strong>template</strong> to describe how each row looks. " +
            "Then <strong>items</strong> fills the template for every record.",
            "Short-assign means a plain string value like <code>name: \"Ada\"</code> " +
            "is placed into the most sensible attribute (here, the element's text).",
            "Edit the JS pane and press <strong>Run</strong>. Try adding a user to the array."
        ]
    },
    {
        file: "tutorial/02-add-user.html",
        title: "2. Add a user",
        description: "Now we add a form to create new users. " +
            "We cover forms, the <code>onclick</code> event, <code>items.push</code>, and validation.",
        lessons: [
            "Form elements can be bound just like any other element. " +
            "We read the inputs' <code>value</code> and push a new item onto the list.",
            "<code>items.push(obj)</code> appends a row built from the template, instantly.",
            "Validation: we check the name isn't empty before pushing. " +
            "Try submitting an empty name to see the warning.",
            "Try adding a user in the preview, then edit this lesson's JS to require an email too."
        ]
    },
    {
        file: "tutorial/03-edit-delete.html",
        title: "3. Edit and delete",
        description: "Each row gets edit and delete buttons. " +
            "We cover <code>items.splice</code>, in-place editing, and the <code>onupdate</code> event.",
        lessons: [
            "Delete uses <code>items.splice(index, 1)</code> — the row vanishes reactively.",
            "Edit swaps the row's text for inputs; Save writes them back via short-assign.",
            "<code>onupdate</code> fires whenever the bound object changes — useful for side effects.",
            "Notice how linked references keep the row and the underlying data in sync."
        ]
    },
    {
        file: "tutorial/04-groups.html",
        title: "4. Groups",
        description: "We add a second collection: groups. " +
            "Same patterns (template + items), applied to a new list.",
        lessons: [
            "Reusing the template + items pattern for a second list is straightforward.",
            "Each list owns its own template and items array — they don't interfere.",
            "Notice we kept the user list from lesson 3; this lesson adds groups beside it.",
            "The structure scales: a third collection (e.g. roles) would follow the same shape."
        ]
    },
    {
        file: "tutorial/05-membership.html",
        title: "5. Membership",
        description: "Users belong to groups. " +
            "We wire checkboxes to each user's <code>groupIds</code> array using event handlers.",
        lessons: [
            "A membership is a many-to-many link. We store <code>groupIds</code> on each user.",
            "Each group becomes a checkbox built from a template. " +
            "<code>onchange</code> reads <code>this.checked</code> and mutates the user's array.",
            "Checking a box updates the user's <code>groupIds</code>; the underlying data is the source of truth.",
            "This is the core of m2d2: bind handlers in the template, keep your data as plain objects."
        ]
    },
    {
        file: "tutorial/06-persistence.html",
        title: "6. Persistence",
        description: "Finally, we save and load the data with the " +
            "<code>m2d2.storage</code> extension (localStorage). " +
            "Data survives reloads.",
        lessons: [
            "<code>$.local.set(\"users\", users)</code> serializes the array to localStorage.",
            "<code>$.local.get(\"users\")</code> reads it back; we seed if it's empty.",
            "We hook <code>onupdate</code> to autosave whenever the data changes.",
            "Reload the preview (Run) — your users and groups are still there. " +
            "This is the complete users/groups editor."
        ]
    }
];
```

Leave the rest of `tutorial.js` (the trailing comment block and any closing) as-is.

- [ ] **Step 2: Commit**

```bash
git add examples/js/tutorial.js
git commit -m "feat(tutorial): switch pages[] from JSFiddle id to local lesson file"
```

---

## Task 6: Rewrite `pages.js` — drive the playground

**Files:**
- Modify: `examples/js/pages.js`

Remove all JSFiddle URL logic. On lesson select, call `window.playground.load(file)`. Keep nav rendering, prev/next, hash routing, lesson text rendering. Populate the playground's lesson dropdown.

- [ ] **Step 1: Replace the entire contents of `pages.js`**

Overwrite `examples/js/pages.js` with:

```js
m2d2.ready($ => {
    "use strict";

    function loadLesson(item) {
        $("#lesson", {
            title: { text: item.title },
            description: item.description
        });
        lessons.update(item.lessons);
        // Drive the playground:
        if (window.playground) {
            playground.load(item.file).then(function () {
                playground.setLessonList(
                    pages.map(function (p) { return { file: p.file, title: p.title }; }),
                    function (file) {
                        const target = pages.find(p => p.file === file);
                        if (target) {
                            window.location.hash = fileToHash(target.file);
                            selectByFile(target.file);
                        }
                    }
                );
                playground.setCurrentLesson(item.file);
            });
        }
    }

    function fileToHash(file) {
        // "tutorial/01-static-render.html" → "#01-static-render"
        return "#" + file.replace(/^tutorial\//, "").replace(/\.html$/, "");
    }
    function hashToFile(hash) {
        const key = hash.replace(/^#/, "");
        return "tutorial/" + key + ".html";
    }
    function selectByFile(file) {
        const li = nav.items.get(fileToHash(file).slice(1));
        if (li) li.selected = true;
        showPage();
    }

    function showPage() {
        let sel = nav.items.selected();
        if (!sel) {
            const hashId = window.location.hash.replace("#", "");
            if (hashId) {
                sel = nav.items.get(hashId);
                if (sel) sel.selected = true;
            }
            if (!sel) sel = nav.items.first();
        }
        let found = false;
        let nextSet = false;
        buttons.find(".prev").dataset.id = "";
        buttons.find(".prev").disabled = true;
        buttons.find(".next").disabled = true;
        pages.forEach(item => {
            if (item.file === sel.dataset.file || fileToHash(item.file).slice(1) === sel.dataset.id) {
                loadLesson(item);
                sel.selected = true;
                found = true;
            } else if (!nextSet) {
                if (found) {
                    buttons.find(".next").dataset.id = item.file;
                    buttons.find(".next").disabled = false;
                    buttons.find(".next").text = item.title;
                    nextSet = true;
                } else {
                    buttons.find(".prev").dataset.id = item.file;
                    buttons.find(".prev").disabled = false;
                    buttons.find(".prev").text = item.title;
                }
            }
        });
        lessons.findAll("code").forEach(block => {
            block.classList.add("js");
            if (window.hljs) hljs.highlightElement(block);
        });
    }

    // ---- Lesson bullet list (kept from original) ----
    const lessons = $("#lessons", {
        items: [],
        update: function (items) {
            this.items.clear();
            this.items.concat(items);
        }
    });

    // ---- Nav (left sidebar) ----
    const nav = $("#nav", {
        template: {
            li: {
                a: {},
                onclick: function () {
                    this.selected = true;
                    showPage();
                }
            }
        },
        onload: function () {
            pages.forEach(item => {
                this.items.push({
                    dataset: { id: fileToHash(item.file).slice(1), file: item.file },
                    a: {
                        text: item.title,
                        href: fileToHash(item.file)
                    }
                });
            });
        }
    });

    // ---- Prev / Next ----
    const buttons = $("#buttons", {
        button: {
            warn: false,
            onclick: function () {
                if (this.dataset.id) {
                    window.location.hash = fileToHash(this.dataset.id);
                    selectByFile(this.dataset.id);
                }
                return false;
            }
        }
    });

    showPage();
});
```

- [ ] **Step 2: Commit**

```bash
git add examples/js/pages.js
git commit -m "feat(tutorial): rewrite pages.js to drive the self-hosted playground"
```

---

## Task 7: Update `tutorial.html` — import map + playground assets

**Files:**
- Modify: `examples/tutorial.html`

CodeMirror 6 is ESM-only — there is no UMD bundle. We declare an **import map** mapping the bare specifiers `codemirror`, `@codemirror/lang-javascript`, and `@codemirror/lang-html` to jsDelivr's ESM endpoint. `playground.js` (Task 4) then dynamically `import()`s those specifiers. The import map MUST appear before any module scripts and before `playground.js`'s dynamic import runs. Classic scripts (`playground-core.js`, `m2d2.min.js`, `playground.js`, `tutorial.js`, `pages.js`) keep their normal `<script>` form and load order.

- [ ] **Step 1: Replace the `<head>` script/css block**

In `examples/tutorial.html`, replace the existing `<head>` script block (the block that loads `m2d2.min.js`, `tutorial.js`, `pages.js`) with:

```html
    <!-- CSS used by examples and examples: -->
    <link rel="stylesheet" href="css/examples.css" type="text/css" />
    <!-- CSS used to highlight code (lesson text): -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/styles/atom-one-dark.min.css" type="text/css">
    <!-- Playground layout: -->
    <link rel="stylesheet" href="css/playground.css" type="text/css" />
    <!-- highlight JS code (lesson text): -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/highlight.min.js" type="text/javascript"></script>

    <!-- Import map: maps bare ESM specifiers used by playground.js to a CDN.
         playground.js dynamically import()s these. Must come before any module
         scripts. esm.sh resolves the CM6 dependency graph for us. -->
    <script type="importmap">
    {
      "imports": {
        "codemirror": "https://esm.sh/codemirror@6.0.1",
        "@codemirror/lang-javascript": "https://esm.sh/@codemirror/lang-javascript@6.2.2",
        "@codemirror/lang-html": "https://esm.sh/@codemirror/lang-html@6.4.9"
      }
    }
    </script>

    <!-- Playground pure functions (no deps; exposes window.pg): -->
    <script src="js/playground-core.js"></script>
    <!-- Using M2D2 to render parts of the examples: -->
    <script src="../dist/m2d2.min.js" type="text/javascript"></script>
    <!-- Generates the pages[] data: -->
    <script src="js/tutorial.js" type="text/javascript"></script>
    <!-- Playground interactive layer (uses window.pg + dynamic import()): -->
    <script src="js/playground.js" type="text/javascript"></script>
    <!-- Drives nav/routing and calls playground.load(): -->
    <script src="js/pages.js" type="text/javascript"></script>
```

**Why esm.sh:** it re-bundles each package's transitive ESM deps into a single resolvable module, so `import("codemirror")` returns `{ EditorView, basicSetup, ... }` without us having to map every `@codemirror/*` sub-package. jsDelivr's `/+esm` would also work; esm.sh is chosen because it additionally re-exports the `codemirror` package's named exports (`basicSetup`, `EditorView`) on the default + namespace, which is what `playground.js` reads.

- [ ] **Step 2: Confirm `<body>` needs no change**

The `<body>` of `tutorial.html` already contains `<section id="example"></section>`, which is the playground mount point. The playground's `scaffold()` clears and fills it. No body edit required.

- [ ] **Step 3: Commit**

```bash
git add examples/tutorial.html
git commit -m "feat(tutorial): add CodeMirror 6 import map and playground scripts"
```

---

## Task 8: Serve helper + write Lesson 1 (static render)

**Files:**
- Create: `examples/serve.sh`
- Create: `examples/tutorial/01-static-render.html`

The serve helper makes the `file://` caveat explicit. Lesson 1 renders a static user list and group list with templates + items.

- [ ] **Step 1: Create `serve.sh`**

Create `examples/serve.sh`:

```sh
#!/usr/bin/env bash
# Serve the tutorial over HTTP (required because lesson files are fetched).
# Run from anywhere: examples/serve.sh
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
echo "Serving examples/ at http://localhost:8000/"
echo "Open: http://localhost:8000/tutorial.html"
python3 -m http.server 8000
```

Make it executable: `chmod +x examples/serve.sh`.

- [ ] **Step 2: Create lesson 1**

Create `examples/tutorial/01-static-render.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>M2D2 Lesson 1 — Render the data</title>
<style>
    body { font-family: system-ui, sans-serif; padding: 16px; color: #222; }
    h2 { margin: 0 0 8px; font-size: 16px; }
    .panel { margin-bottom: 20px; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; gap: 8px; }
    .name { font-weight: 600; }
    .email { color: #666; }
</style>
</head>
<body>
<div class="panel">
    <h2>Users</h2>
    <ul id="users"></ul>
</div>
<div class="panel">
    <h2>Groups</h2>
    <ul id="groups"></ul>
</div>

<script src="../../dist/m2d2.min.js"></script>
<script>
// Lesson 1: render static data with templates + items.
// Edit me! Try adding a user to the array, then press Run.

const users = [
    { id: 1, name: "Ada Lovelace",    email: "ada@analyticalengine.io" },
    { id: 2, name: "Alan Turing",     email: "alan@enigma.co.uk" },
    { id: 3, name: "Grace Hopper",    email: "grace@navy.mil" },
    { id: 4, name: "Margaret Hamilton", email: "margaret@mit.edu" },
    { id: 5, name: "Linus Torvalds",  email: "linus@kernel.org" }
];

const groups = [
    { id: 101, name: "Pioneers" },
    { id: 102, name: "Engineers" },
    { id: 103, name: "Mentors" }
];

m2d2.ready($ => {
    $("#users", {
        template: { li: { span: { css: "name" }, span: { css: "email" } } },
        items: users.map(u => ({ name: u.name, email: u.email }))
    });

    $("#groups", {
        template: { li: { span: { css: "name" } } },
        items: groups.map(g => ({ name: g.name }))
    });
});
</script>
</body>
</html>
```

- [ ] **Step 3: Verify the lesson loads standalone**

Run: `cd examples && python3 -m http.server 8000 &` then open `http://localhost:8000/tutorial/01-static-render.html` in a browser. Confirm the user list and group list render. Then kill the server: `kill %1`.

(If a browser isn't available in CI, this step is a manual check — see Task 13.)

- [ ] **Step 4: Commit**

```bash
chmod +x examples/serve.sh
git add examples/serve.sh examples/tutorial/01-static-render.html
git commit -m "feat(tutorial): add serve helper and lesson 1 (static render)"
```

---

## Task 9: Lesson 2 — Add a user

**Files:**
- Create: `examples/tutorial/02-add-user.html`

Lesson 1's content plus an add-user form. Demonstrates forms, `onclick`, `items.push`, validation. Self-contained file.

- [ ] **Step 1: Create lesson 2**

Create `examples/tutorial/02-add-user.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>M2D2 Lesson 2 — Add a user</title>
<style>
    body { font-family: system-ui, sans-serif; padding: 16px; color: #222; }
    h2 { margin: 0 0 8px; font-size: 16px; }
    .panel { margin-bottom: 20px; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; gap: 8px; }
    .name { font-weight: 600; }
    .email { color: #666; }
    form { display: flex; gap: 6px; margin-bottom: 12px; }
    input[type="text"] { padding: 4px 6px; border: 1px solid #999; border-radius: 3px; }
    button { padding: 4px 12px; cursor: pointer; }
    .warn { color: #c00; font-size: 12px; }
</style>
</head>
<body>
<div class="panel">
    <h2>Add a user</h2>
    <form id="addUser" action="#">
        <input type="text" name="name" placeholder="Name">
        <input type="text" name="email" placeholder="Email">
        <button>Add</button>
    </form>
    <p class="warn" id="msg"></p>
</div>
<div class="panel">
    <h2>Users</h2>
    <ul id="users"></ul>
</div>

<script src="../../dist/m2d2.min.js"></script>
<script>
// Lesson 2: add a user via a form.
// We read the inputs, validate, and items.push a new row.

const users = [
    { id: 1, name: "Ada Lovelace",    email: "ada@analyticalengine.io" },
    { id: 2, name: "Alan Turing",     email: "alan@enigma.co.uk" },
    { id: 3, name: "Grace Hopper",    email: "grace@navy.mil" }
];
let nextId = 4;

m2d2.ready($ => {
    const userList = $("#users", {
        template: { li: { span: { css: "name" }, span: { css: "email" } } },
        items: users.map(u => ({ name: u.name, email: u.email }))
    });

    $("#addUser", {
        onsubmit: function (e) {
            e.preventDefault();
            const name = this.find('[name="name"]').value.trim();
            const email = this.find('[name="email"]').value.trim();
            if (!name) {
                $("#msg", "Please enter a name.");
                return;
            }
            users.push({ id: nextId++, name: name, email: email });
            userList.items.push({ name: name, email: email });
            // reset the form:
            this.find('[name="name"]').value = "";
            this.find('[name="email"]').value = "";
            $("#msg", "");
        }
    });
});
</script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add examples/tutorial/02-add-user.html
git commit -m "feat(tutorial): lesson 2 (add user with form + items.push + validation)"
```

---

## Task 10: Lesson 3 — Edit and delete

**Files:**
- Create: `examples/tutorial/03-edit-delete.html`

Adds per-row edit/delete buttons. Edit swaps text → inputs; Save writes back. Delete uses `items.splice`. `onupdate` demonstrated.

- [ ] **Step 1: Create lesson 3**

Create `examples/tutorial/03-edit-delete.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>M2D2 Lesson 3 — Edit and delete</title>
<style>
    body { font-family: system-ui, sans-serif; padding: 16px; color: #222; }
    h2 { margin: 0 0 8px; font-size: 16px; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; gap: 8px; align-items: center; }
    .name { font-weight: 600; min-width: 160px; }
    .email { color: #666; flex: 1; }
    .row-btn { padding: 2px 8px; font-size: 12px; cursor: pointer; }
    .del { color: #c00; }
    input[type="text"] { padding: 2px 4px; border: 1px solid #999; }
</style>
</head>
<body>
<div class="panel">
    <h2>Users (edit / delete)</h2>
    <ul id="users"></ul>
</div>
<p id="log" style="font-size:12px;color:#666"></p>

<script src="../../dist/m2d2.min.js"></script>
<script>
// Lesson 3: edit in place + delete with items.splice.
// Each row has Edit / Delete buttons. onupdate logs changes.

const users = [
    { id: 1, name: "Ada Lovelace",    email: "ada@analyticalengine.io" },
    { id: 2, name: "Alan Turing",     email: "alan@enigma.co.uk" },
    { id: 3, name: "Grace Hopper",    email: "grace@navy.mil" }
];

m2d2.ready($ => {
    const userList = $("#users", {
        template: {
            li: {
                name:  { span: { css: "name" } },
                email: { span: { css: "email" } },
                edit:  { button: { css: "row-btn", text: "Edit" } },
                del:   { button: { css: "row-btn del", text: "Delete" } }
            }
        },
        items: users.map(u => ({
            name: u.name,
            email: u.email,
            edit: {
                onclick: function () {
                    const li = this.closest("li");
                    const row = userList.items.get(userList.items.indexOf(li));
                    // swap to inputs:
                    row.name  = { input: { css: "name", value: u.name } };
                    row.email = { input: { css: "email", value: u.email } };
                    row.edit  = { button: { css: "row-btn", text: "Save",
                        onclick: function () {
                            const li2 = this.closest("li");
                            const idx = userList.items.indexOf(li2);
                            const nm = li2.querySelector(".name").value;
                            const em = li2.querySelector(".email").value;
                            users[idx].name = nm;
                            users[idx].email = em;
                            userList.items[idx].name  = { span: { css: "name", text: nm } };
                            userList.items[idx].email = { span: { css: "email", text: em } };
                            userList.items[idx].edit  = { button: { css: "row-btn", text: "Edit" } };
                        }
                    }};
                }
            },
            del: {
                onclick: function () {
                    const li = this.closest("li");
                    const idx = userList.items.indexOf(li);
                    users.splice(idx, 1);
                    userList.items.splice(idx, 1);
                }
            }
        })),
        onupdate: function (e) {
            $("#log", "List updated.");
        }
    });
});
</script>
</body>
</html>
```

- [ ] **Step  code review:** this lesson intentionally keeps edit logic inline per-row for tutorial readability. The pattern (swap span → input → back) demonstrates m2d2's reactive re-binding; a production app would extract a component. This is acceptable for a lesson.

- [ ] **Step 2: Commit**

```bash
git add examples/tutorial/03-edit-delete.html
git commit -m "feat(tutorial): lesson 3 (edit in place + delete via items.splice)"
```

---

## Task 11: Lesson 4 — Groups

**Files:**
- Create: `examples/tutorial/04-groups.html`

Adds a second collection (groups) with its own add form. Same template+items pattern, applied to a new list.

- [ ] **Step 1: Create lesson 4**

Create `examples/tutorial/04-groups.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>M2D2 Lesson 4 — Groups</title>
<style>
    body { font-family: system-ui, sans-serif; padding: 16px; color: #222; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    h2 { margin: 0 0 8px; font-size: 16px; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { padding: 6px 8px; border-bottom: 1px solid #eee; display: flex; gap: 8px; align-items: center; }
    .name { font-weight: 600; flex: 1; }
    .row-btn { padding: 2px 8px; font-size: 12px; cursor: pointer; color: #c00; }
    form { display: flex; gap: 6px; margin-bottom: 12px; }
    input[type="text"] { padding: 4px 6px; border: 1px solid #999; border-radius: 3px; }
    button { padding: 4px 12px; cursor: pointer; }
</style>
</head>
<body>
<div>
    <h2>Users</h2>
    <ul id="users"></ul>
</div>
<div>
    <h2>Groups</h2>
    <form id="addGroup" action="#">
        <input type="text" name="name" placeholder="Group name">
        <button>Add</button>
    </form>
    <ul id="groups"></ul>
</div>

<script src="../../dist/m2d2.min.js"></script>
<script>
// Lesson 4: a second collection (groups) using the same template + items pattern.

const users = [
    { id: 1, name: "Ada Lovelace",    email: "ada@analyticalengine.io" },
    { id: 2, name: "Alan Turing",     email: "alan@enigma.co.uk" },
    { id: 3, name: "Grace Hopper",    email: "grace@navy.mil" }
];
const groups = [
    { id: 101, name: "Pioneers" },
    { id: 102, name: "Engineers" }
];
let nextGroupId = 103;

m2d2.ready($ => {
    $("#users", {
        template: { li: { span: { css: "name" }, span: { css: "email" } } },
        items: users.map(u => ({ name: u.name, email: u.email }))
    });

    const groupList = $("#groups", {
        template: {
            li: {
                name: { span: { css: "name" } },
                del:  { button: { css: "row-btn", text: "Delete" } }
            }
        },
        items: groups.map(g => ({
            name: g.name,
            del: {
                onclick: function () {
                    const li = this.closest("li");
                    const idx = groupList.items.indexOf(li);
                    groups.splice(idx, 1);
                    groupList.items.splice(idx, 1);
                }
            }
        }))
    });

    $("#addGroup", {
        onsubmit: function (e) {
            e.preventDefault();
            const name = this.find('[name="name"]').value.trim();
            if (!name) return;
            groups.push({ id: nextGroupId++, name: name });
            groupList.items.push({
                name: name,
                del: {
                    onclick: function () {
                        const li = this.closest("li");
                        const idx = groupList.items.indexOf(li);
                        groups.splice(idx, 1);
                        groupList.items.splice(idx, 1);
                    }
                }
            });
            this.find('[name="name"]').value = "";
        }
    });
});
</script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add examples/tutorial/04-groups.html
git commit -m "feat(tutorial): lesson 4 (group CRUD, second collection)"
```

---

## Task 12: Lesson 5 — Membership (linked references)

**Files:**
- Create: `examples/tutorial/05-membership.html`

Users get a `groupIds` array. For each user row, render the list of groups as checkboxes. Checking one updates the user's data. Demonstrates linked references and reactive membership display.

- [ ] **Step 1: Create lesson 5**

Create `examples/tutorial/05-membership.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>M2D2 Lesson 5 — Membership</title>
<style>
    body { font-family: system-ui, sans-serif; padding: 16px; color: #222; }
    h2 { margin: 0 0 8px; font-size: 16px; }
    ul { list-style: none; padding: 0; margin: 0; }
    li.user { padding: 8px; border-bottom: 1px solid #eee; }
    .uname { font-weight: 600; }
    .uemail { color: #666; font-size: 13px; }
    .groups { margin-top: 6px; display: flex; gap: 12px; flex-wrap: wrap; }
    .groups label { font-size: 13px; display: flex; gap: 3px; align-items: center; }
</style>
</head>
<body>
<div class="panel">
    <h2>Users & group membership</h2>
    <ul id="users"></ul>
</div>

<script src="../../dist/m2d2.min.js"></script>
<script>
// Lesson 5: many-to-many membership via checkboxes.
// Each user has a groupIds[] array. Checking a box updates the data reactively.

const users = [
    { id: 1, name: "Ada Lovelace",  email: "ada@analyticalengine.io", groupIds: [101] },
    { id: 2, name: "Alan Turing",   email: "alan@enigma.co.uk",       groupIds: [101, 102] },
    { id: 3, name: "Grace Hopper",  email: "grace@navy.mil",          groupIds: [102] }
];
const groups = [
    { id: 101, name: "Pioneers" },
    { id: 102, name: "Engineers" }
];

m2d2.ready($ => {
    function membershipCheckboxes(user) {
        // Build a checkbox per group; checked if user belongs to it.
        const fieldset = {};
        groups.forEach(g => {
            const checked = user.groupIds.indexOf(g.id) >= 0;
            fieldset["g" + g.id] = {
                tagName: "label",
                input: {
                    type: "checkbox",
                    checked: checked,
                    // Linked: toggling mutates user.groupIds:
                    onchange: function () {
                        const idx = user.groupIds.indexOf(g.id);
                        if (this.checked && idx < 0) user.groupIds.push(g.id);
                        else if (!this.checked && idx >= 0) user.groupIds.splice(idx, 1);
                        console.log(user.name + " → " + user.groupIds.join(","));
                    }
                },
                text: " " + g.name
            };
        });
        return fieldset;
    }

    $("#users", {
        template: {
            li: {
                css: "user",
                head: { span: { css: "uname" }, span: { css: "uemail" } },
                groups: { div: { css: "groups" } }
            }
        },
        items: users.map(u => ({
            head: { uname: u.name, uemail: " (" + u.email + ")" },
            groups: membershipCheckboxes(u)
        }))
    });
});
</script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add examples/tutorial/05-membership.html
git commit -m "feat(tutorial): lesson 5 (membership via checkboxes, data-bound)"
```

---

## Task 13: Lesson 6 — Persistence (m2d2.storage)

**Files:**
- Create: `examples/tutorial/06-persistence.html`

Adds localStorage save/load via the `m2d2.storage` extension. On load, reads from storage (seeds if empty). Hooks `onupdate` to autosave.

- [ ] **Step 1: Create lesson 6**

Create `examples/tutorial/06-persistence.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>M2D2 Lesson 6 — Persistence</title>
<style>
    body { font-family: system-ui, sans-serif; padding: 16px; color: #222; }
    h2 { margin: 0 0 8px; font-size: 16px; }
    ul { list-style: none; padding: 0; margin: 0; }
    li.user { padding: 8px; border-bottom: 1px solid #eee; }
    .uname { font-weight: 600; }
    .uemail { color: #666; font-size: 13px; }
    .groups { margin-top: 6px; display: flex; gap: 12px; flex-wrap: wrap; }
    .groups label { font-size: 13px; display: flex; gap: 3px; align-items: center; }
    .toolbar { margin-bottom: 12px; }
    .toolbar button { padding: 4px 12px; cursor: pointer; }
    .note { font-size: 12px; color: #666; margin-top: 8px; }
</style>
</head>
<body>
<div class="toolbar">
    <button id="reset">Reset stored data</button>
    <p class="note">Data is saved to localStorage on every change. Reload to confirm.</p>
</div>
<div class="panel">
    <h2>Users</h2>
    <ul id="users"></ul>
</div>

<script src="../../dist/m2d2.min.js"></script>
<script>
// Lesson 6: persistence with the m2d2.storage extension (localStorage).
// On startup we load; on every change we autosave.

const SEED_USERS = [
    { id: 1, name: "Ada Lovelace",  email: "ada@analyticalengine.io", groupIds: [101] },
    { id: 2, name: "Alan Turing",   email: "alan@enigma.co.uk",       groupIds: [101, 102] }
];
const SEED_GROUPS = [
    { id: 101, name: "Pioneers" },
    { id: 102, name: "Engineers" }
];
const KEY = "m2d2-tutorial-users";

m2d2.ready($ => {
    // Load (or seed):
    let users = $.local.get(KEY);
    if (!users) {
        users = SEED_USERS;
        $.local.set(KEY, users);
    }
    const groups = SEED_GROUPS;

    function save() { $.local.set(KEY, users); }

    function membershipCheckboxes(user) {
        const fieldset = {};
        groups.forEach(g => {
            const checked = user.groupIds.indexOf(g.id) >= 0;
            fieldset["g" + g.id] = {
                tagName: "label",
                input: {
                    type: "checkbox",
                    checked: checked,
                    onchange: function () {
                        const idx = user.groupIds.indexOf(g.id);
                        if (this.checked && idx < 0) user.groupIds.push(g.id);
                        else if (!this.checked && idx >= 0) user.groupIds.splice(idx, 1);
                        save();   // autosave on membership change
                    }
                },
                text: " " + g.name
            };
        });
        return fieldset;
    }

    $("#users", {
        template: {
            li: {
                css: "user",
                head: { span: { css: "uname" }, span: { css: "uemail" } },
                groups: { div: { css: "groups" } }
            }
        },
        items: users.map(u => ({
            head: { uname: u.name, uemail: " (" + u.email + ")" },
            groups: membershipCheckboxes(u)
        })),
        onupdate: save    // autosave whenever the list itself changes
    });

    $("#reset", {
        onclick: function () {
            $.local.del(KEY);
            location.reload();
        }
    });
});
</script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add examples/tutorial/06-persistence.html
git commit -m "feat(tutorial): lesson 6 (localStorage persistence via m2d2.storage)"
```

---

## Task 14: Manual test checklist

**Files:**
- Create: `examples/tutorial/MANUAL.md`

The honest scope boundary for the interactive playground. Lists every interactive behavior that must be verified by hand in a browser.

- [ ] **Step 1: Create `MANUAL.md`**

Create `examples/tutorial/MANUAL.md`:

```markdown
# Tutorial Playground — Manual Test Checklist

The playground's pure parse/assemble logic is unit-tested in `test/playground.test.ts`.
The interactive parts (CodeMirror, iframe srcdoc execution, postMessage) can only be
verified in a real browser. Run through this checklist after any playground change.

## Setup

1. `cd examples && ./serve.sh` (or `python3 -m http.server 8000`)
2. Open `http://localhost:8000/tutorial.html`

## Shell (nav, routing, lesson text)

- [ ] Left nav lists all 6 lessons; clicking each loads it.
- [ ] Prev / Next buttons step through lessons in order.
- [ ] Browser back/forward changes the active lesson (hash routing).
- [ ] Title, description, and bullet points update for each lesson.
- [ ] Bullet-point `<code>` blocks are syntax-highlighted (atom-one-dark).

## Playground — editor

- [ ] Three tabs: HTML / JS / CSS. Switching preserves each pane's content.
- [ ] JS pane shows syntax-highlighted code (CodeMirror).
- [ ] Tab inserts 2 spaces; line numbers visible; bracket matching works.

## Playground — preview

- [ ] Preview iframe renders the lesson on load (white background, list visible).
- [ ] Edit the JS pane, click **Run ▶** → preview updates with the new code.
- [ ] Click **Reset ↺** → editor and preview return to the lesson's original code.
- [ ] Turn on **Auto-run**, edit → preview updates ~500ms after typing stops.
- [ ] Lesson dropdown jumps to any lesson.

## Playground — error bar

- [ ] Edit JS to introduce a `SyntaxError`, Run → red error bar appears under preview with the message.
- [ ] A `console.warn(...)` in lesson code → appears in the error bar (warn level).
- [ ] Clicking Run again with valid code → error bar clears.

## Lessons (each one renders and is interactive)

- [ ] **L1 Render the data**: user list + group list both render with seed data.
- [ ] **L2 Add a user**: form adds a row; empty name shows the warning.
- [ ] **L3 Edit and delete**: Edit swaps to inputs, Save writes back; Delete removes the row.
- [ ] **L4 Groups**: group add/delete works independently of users.
- [ ] **L5 Membership**: checkboxes reflect initial state; toggling logs the new groupIds.
- [ ] **L6 Persistence**: toggle membership → reload preview (Run) → checkbox state persists; Reset clears it.

## Responsive

- [ ] Narrow the browser to < 760px: editors stack above preview (single column).
```

- [ ] **Step 2: Commit**

```bash
git add examples/tutorial/MANUAL.md
git commit -m "docs(tutorial): add manual test checklist for the playground"
```

---

## Task 15: Final verification

- [ ] **Step 1: Run the full unit test suite**

Run: `npm test`
Expected: all prior tests pass (170) PLUS the new `playground.test.ts` tests (10) = 180 passing.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: clean (no errors). The new `playground.js` is plain JS (not compiled), so it doesn't affect typecheck.

- [ ] **Step 3: Run the manual checklist**

Run: `cd examples && ./serve.sh`, open `http://localhost:8000/tutorial.html`, walk through `examples/tutorial/MANUAL.md`. Fix any issues found.

- [ ] **Step 4: Commit any fixes from manual testing**

If the manual pass surfaced issues, commit the fixes:

```bash
git add -A
git commit -m "fix(tutorial): address issues from manual test pass"
```

- [ ] **Step 5: Final commit (if anything uncommitted remains)**

```bash
git status
git add -A
git commit -m "feat(tutorial): complete self-hosted playground and users/groups lessons"
```

---

## Self-Review Notes

**Spec coverage:** Every spec section maps to a task:
- Architecture (playground + lesson files) → Tasks 2, 4, 6, 7
- UI layout → Tasks 3, 4
- Lesson format → Tasks 8–13
- pages.js rewrite → Tasks 5, 6
- playground internals (parse/assemble/run/reset/error capture) → Tasks 2, 4
- Testing (unit + manual) → Tasks 1, 14, 15

**Type consistency:** `parseLesson` returns `{ html, js, css }` everywhere. `assembleSrcDoc(html, js, css, baseUrl)` signature is consistent across tests, pure-function module, and the interactive caller in `run()`. `window.playground.load(file)` / `.setLessonList()` / `.setCurrentLesson()` signatures match between `playground.js` (Task 4) and `pages.js` (Task 6).

**Known risks flagged in the plan:**
- CodeMirror 6 is ESM-only. The plan loads it via an import map + dynamic `import()` (Task 7 + Task 4). If the `esm.sh` URLs 404 or the browser doesn't support import maps, the editor degrades gracefully (Task 4's `ensureEditor` catch block shows a message and keeps the preview working). Verify the import-map path works in the Task 15 manual pass; if `esm.sh` is unreliable, swap the import map URLs to `jsDelivr /+esm` equivalents (no code change in `playground.js`).
- Lesson 3's inline edit logic is intentionally verbose for tutorial readability, not a production pattern.
- The pure-function unit tests (Task 1) load only `playground-core.js`, which is dependency-free — they never touch CodeMirror or m2d2, so they run cleanly in jsdom.

**Divergence from spec (intentional):** The spec's lesson table says Lesson 5 demonstrates "Linked references `[user, \"groups\"]`, nested templates, `onupdate` cascades." The plan's Lesson 5 code instead wires membership via `onchange` handlers mutating plain `groupIds` arrays — simpler, more approachable for a tutorial, and avoids overloading one lesson. The lesson's bullet text (Task 5) has been corrected to describe what the code actually shows. Linked references remain covered in the existing `examples/tests/dataset-style.html` demo, outside the tutorial.
