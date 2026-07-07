m2d2.ready($ => {
    "use strict";

    // Per-lesson explanations live as comments in tutorial.js (next to each
    // pages[] entry); this file only drives the prev/next header and the
    // playground. There is no <aside>/#nav sidebar and no <footer>/#lessons
    // list in index.html anymore.

    // Extension examples shown in the playground dropdown after the tutorial
    // lessons. Paths are relative to examples/ (same as tutorial lesson paths).
    // Both tutorial/ and extensions/ are two levels below repo root, so the
    // <base>-relative ../../dist/m2d2.min.js resolves identically for both.
    const extensionExamples = [
        { file: "extensions/alert.html",      title: "Alert" },
        { file: "extensions/lang.html",       title: "Language (i18n)" },
        { file: "extensions/storage.html",    title: "Storage" },
        { file: "extensions/xhr.html",        title: "XHR" },
        { file: "extensions/xhr-stream.html", title: "XHR stream" },
        { file: "extensions/ws.html",         title: "WebSocket" }
    ];

    // The dropdown shows tutorial lessons first, then extension examples.
    // prev/next header nav walks tutorial lessons only (it's the curriculum);
    // the dropdown is the way to jump to extension demos. The `group` field
    // drives <optgroup> labels in the dropdown (see playground.setLessonList).
    const allEntries = pages
        .map(p => ({ file: p.file, title: p.title, group: "Tutorial" }))
        .concat(extensionExamples.map(e => ({ file: e.file, title: e.title, group: "Extensions" })));

    function loadLesson(item) {
        // Bind the H1 by its id. We don't use the `title` key on the <article>
        // because <article> has a native title attribute — m2d2 would warn
        // about the ambiguity (attribute vs the #title child).
        // Per-lesson descriptions now live as doc comments in each lesson's JS.
        $("#title", item.title || "");
        if (window.playground) {
            playground.load(item.file).then(function () {
                playground.setLessonList(
                    allEntries.map(function (e) {
                        return { file: e.file, title: e.title, group: e.group };
                    }),
                    function (file) {
                        // Dropdown selection → jump to that entry.
                        const target = allEntries.find(e => e.file === file);
                        if (target) selectEntry(target);
                    }
                );
                playground.setCurrentLesson(item.file);
            });
        }
    }

    // Central entry-point for selecting any entry (tutorial or extension).
    // Updates the URL hash, loads the lesson, and refreshes prev/next (which
    // only apply to tutorial lessons).
    function selectEntry(target) {
        window.location.hash = fileToHash(target.file);
        const tIdx = pages.findIndex(p => p.file === target.file);
        currentIndex = tIdx;  // -1 for extensions
        updateButtons();
        loadLesson(target);
    }

    function fileToHash(file) {
        // Hash encodes the path without the directory prefix and .html suffix,
        // e.g. "extensions/alert" or "01-static-render".
        return "#" + file.replace(/^(tutorial|extensions)\//, "").replace(/\.html$/, "");
    }
    function hashToFile(hash) {
        const key = hash.replace(/^#/, "");
        const tu = "tutorial/" + key + ".html";
        if (allEntries.some(e => e.file === tu)) return tu;
        const ex = "extensions/" + key + ".html";
        if (allEntries.some(e => e.file === ex)) return ex;
        return tu;
    }

    let currentIndex = 0;

    // Update prev/next button state from currentIndex. Does NOT load anything
    // — callers pair this with loadLesson() via selectEntry() or directly.
    function updateButtons() {
        const prev = buttons.find(".prev");
        const next = buttons.find(".next");
        if (currentIndex > 0) {
            prev.disabled = false;
            prev.text = pages[currentIndex - 1].title;
        } else {
            prev.disabled = true;
            prev.text = "";
        }
        if (currentIndex >= 0 && currentIndex < pages.length - 1) {
            next.disabled = false;
            next.text = pages[currentIndex + 1].title;
        } else {
            next.disabled = true;
            next.text = "";
        }
    }

    // ---- Prev / Next header nav (tutorial lessons only) ----
    const buttons = $("#buttons", {
        button: {
            warn: false,
            onclick: function () {
                if (this.classList.contains("prev") && currentIndex > 0) {
                    currentIndex--;
                    selectEntry(pages[currentIndex]);
                } else if (this.classList.contains("next") && currentIndex >= 0 && currentIndex < pages.length - 1) {
                    currentIndex++;
                    selectEntry(pages[currentIndex]);
                }
                return false;
            }
        }
    });

    // ---- Resolve initial entry from URL hash, else tutorial lesson 0 ----
    const hashId = window.location.hash.replace("#", "");
    let initialEntry;
    if (hashId) {
        const file = hashToFile("#" + hashId);
        initialEntry = allEntries.find(e => e.file === file) || pages[0];
    } else {
        initialEntry = pages[0];
    }
    currentIndex = pages.findIndex(p => p.file === initialEntry.file);
    selectEntry(initialEntry);
});
