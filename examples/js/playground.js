/* eslint-disable */
/**
 * M2D2 Tutorial Playground — interactive layer.
 *
 * Classic <script>. Lazily imports CodeMirror 6 via dynamic import() against the
 * import map declared in index.html. Consumes window.pg (playground-core.js).
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
    var currentTheme = localStorage.getItem("pg-theme") || "dracula";
    var cmMods = null;       // cached CodeMirror modules { cm, jsLang, htmlLang }
    var themeMods = null;    // cached thememirror namespace (lazy)

    // ---- DOM scaffold ----
    function scaffold() {
        // If a previous editor exists, destroy it first — clearing the DOM via
        // innerHTML detaches CodeMirror's view but leaves `editor` pointing at
        // a dead view, which would make ensureEditor() skip re-init on the next
        // load (code panes would appear empty until a full page reload).
        if (editor) {
            try { editor.destroy(); } catch (e) { /* already detached */ }
            editor = null;
            editorReady = null;
        }
        var example = document.getElementById("example");
        example.innerHTML = "";
        var root = document.createElement("div");
        root.className = "pg-root";
        root.innerHTML =
            '<div class="pg-toolbar">' +
                '<button class="pg-run">Run ▶</button>' +
                '<button class="pg-reset">Reset ↺</button>' +
                '<label><input type="checkbox" class="pg-autorun"> Auto-run</label>' +
                '<label class="pg-theme-label">Theme <select class="pg-theme">' +
                    '<option value="dracula">Dracula (dark)</option>' +
                    '<option value="cobalt">Cobalt (dark blue)</option>' +
                    '<option value="espresso">Espresso (dark brown)</option>' +
                    '<option value="solarizedLight">Solarized (light)</option>' +
                    '<option value="ayuLight">Ayu (light)</option>' +
                    '<option value="amy">Amy (colored)</option>' +
                '</select></label>' +
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
                '<iframe sandbox="allow-scripts allow-same-origin allow-forms"></iframe>' +
                '<div class="pg-errorbar"></div>' +
            '</div>';
        example.appendChild(root);
        MOUNT = root;
        // Restore saved theme selection:
        var themeSel = root.querySelector(".pg-theme");
        if (themeSel) themeSel.value = currentTheme;
        return root;
    }

    // ---- CodeMirror init (lazy ESM import via import map) ----
    // Build the extensions array for the current theme. Non-default themes
    // come from thememirror (lazy-imported and cached).
    function themeExtension() {
        if (currentTheme === "default" || !themeMods) return [];
        var t = themeMods[currentTheme];
        return t ? [t] : [];
    }

    function buildExtensions() {
        var ext = [
            cmMods.cm.basicSetup,
            cmMods.cm.EditorView.lineWrapping,
            cmMods.cm.EditorView.updateListener.of(function (u) {
                if (u.docChanged && autoRunOn) scheduleRun();
            }),
            cmMods.jsLang.javascript(),
            cmMods.htmlLang.html()
        ];
        var theme = themeExtension();
        if (theme) ext.push(theme);
        return ext;
    }

    // Load thememirror (once) if a non-default theme is selected.
    function ensureTheme() {
        if (currentTheme === "default" || themeMods) return Promise.resolve();
        return import("thememirror").then(function (m) {
            themeMods = m;
        }).catch(function (err) {
            console.error("[playground] thememirror failed to load:", err);
            currentTheme = "default";   // fall back
            var sel = MOUNT ? MOUNT.querySelector(".pg-theme") : null;
            if (sel) sel.value = "default";
        });
    }

    function ensureEditor() {
        if (editor) return Promise.resolve();
        if (editorReady) return editorReady;
        editorReady = Promise.all([
            import("codemirror"),
            import("@codemirror/lang-javascript"),
            import("@codemirror/lang-html")
        ]).then(function (mods) {
            cmMods = { cm: mods[0], jsLang: mods[1], htmlLang: mods[2] };
            return ensureTheme();
        }).then(function () {
            var host = MOUNT.querySelector(".pg-editor-host");
            editor = new cmMods.cm.EditorView({
                doc: docs ? (docs[activeTab] || "") : "",
                extensions: buildExtensions(),
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
        // Pass preserved <link> tags through to the srcdoc so external CSS
        // (e.g. the alert extension's stylesheets) is loaded in the iframe.
        var srcdoc = window.pg.assembleSrcDoc(docs.html, docs.js, docs.css, baseUrl, {
            links: current ? current.links : []
        });
        var iframe = MOUNT.querySelector("iframe");
        var bar = MOUNT.querySelector(".pg-errorbar");
        bar.classList.remove("pg-visible");
        bar.textContent = "";
        iframe.srcdoc = srcdoc;
    }

    function reset() {
        if (!current) return;
        docs = { html: current.html, js: current.js, css: current.css, links: current.links };
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
                docs = { html: current.html, js: current.js, css: current.css, links: current.links };
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
            // Group entries by their `group` field using <optgroup>. Entries
            // without a group go into the first (ungrouped) batch. This lets
            // pages.js pass tutorial lessons + extension demos as one list with
            // visual separation in the dropdown.
            var currentGroup = null;
            var groupEl = null;
            entries.forEach(function (e) {
                var g = e.group;
                if (g !== currentGroup) {
                    if (groupEl && groupEl.childElementCount === 0) {
                        // empty previous group — drop it
                        sel.removeChild(groupEl);
                    }
                    currentGroup = g;
                    groupEl = g ? document.createElement("optgroup") : null;
                    if (groupEl) {
                        groupEl.label = g;
                        sel.appendChild(groupEl);
                    }
                }
                var opt = document.createElement("option");
                opt.value = e.file;
                opt.textContent = e.title;
                (groupEl || sel).appendChild(opt);
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
        if (e.target.classList.contains("pg-theme")) setTheme(e.target.value);
    });

    // ---- theme switching ----
    function setTheme(name) {
        currentTheme = name;
        localStorage.setItem("pg-theme", name);
        if (!cmMods) return;   // editor not loaded yet; will apply on init
        // If switching to/from a thememirror theme, load the namespace first:
        var need = (name !== "default");
        var have = !!themeMods;
        if (need && !have) {
            ensureTheme().then(reconfigureEditor);
        } else {
            reconfigureEditor();
        }
    }

    function reconfigureEditor() {
        // Destroy + recreate the editor with the new theme. We avoid @codemirror/state's
        // Compartment because it would require a separate import that resolves to a
        // different module instance than the one bundled inside the `codemirror`
        // package (dual-instance bug → "Unrecognized extension value"). Recreating
        // is simpler and the editor host is local, so it's instant.
        if (!editor || !cmMods) return;
        // Stash current doc text before destroying:
        var text = editor.state.doc.toString();
        try { editor.destroy(); } catch (e) { /* already detached */ }
        editor = null;
        var host = MOUNT.querySelector(".pg-editor-host");
        editor = new cmMods.cm.EditorView({
            doc: text,
            extensions: buildExtensions(),
            parent: host
        });
    }
});
