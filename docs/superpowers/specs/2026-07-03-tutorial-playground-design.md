# Tutorial Playground & Users/Groups Project — Design

**Date:** 2026-07-03
**Status:** Approved (all 6 design sections)
**Branch:** `z`

## Goal

Replace the JSFiddle embeds in the m2d2 tutorial with a self-hosted live code
editor (playground), and make a Users/Groups CRUD editor the tutorial's primary
content — built incrementally across six lessons inside the playground.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Replace strategy | Live code editor (self-hosted playground) |
| Playground ↔ project relation | Playground IS the tutorial content; users/groups is the first lesson set |
| Editor technology | CodeMirror 6 (CDN, ~150KB) |
| Lesson storage | One standalone HTML file per lesson |
| Project scope | Users + Groups CRUD |
| Persistence | `m2d2.storage` extension (localStorage) |
| Lesson structure | Multi-step build-up (6 lessons) |
| Testing | Pure functions in Vitest; interactive parts as manual checklist |

## Architecture

```
tutorial.html  ← shell (nav, prev/next, lesson text) — existing layout kept
  ├─ js/playground.js   ← NEW: editor + preview engine (CodeMirror 6)
  └─ js/pages.js        ← REWRITTEN: loads local lesson HTML files instead of JSFiddle

examples/tutorial/*.html  ← lesson source files (one HTML per lesson, standalone)
  └─ 01-static-render.html, 02-add-user.html, … 06-persistence.html
```

### Data flow per lesson

1. `pages.js` fetches the lesson's `.html` file (e.g. `tutorial/01-static-render.html`)
2. A parser splits it into **HTML body / JS / CSS** strings by reading `<script>` and `<style>` tags
3. CodeMirror panes are populated with each section; the HTML pane shows the `<body>` content
4. On "Run" (or auto-run on edit), the three sections are reassembled into a single HTML document and injected into a sandboxed `<iframe>` via `srcdoc`
5. The iframe loads `dist/m2d2.min.js` from the parent path (via a `<base>` tag) so lesson code can use `m2d2`

### Sandboxing

The iframe uses `sandbox="allow-scripts allow-same-origin"`. `allow-scripts` is
required for lesson code to run; `allow-same-origin` is required so lesson 6's
`m2d2.storage` (localStorage) works — without it the iframe gets an opaque null
origin and localStorage throws `SecurityError`. Since we control the srcdoc
content (lesson code is trusted educational material) and run the error bootstrap
first, this is acceptable for a tutorial playground. Modern browsers' storage
partitioning keeps the iframe's storage separate from the parent's regardless.

## UI layout

```
┌─ #example (section) ──────────────────────────────────┐
│  ┌─ .pg-toolbar ────────────────────────────────────┐ │
│  │  [Run ▶]  [Reset ↺]   Auto-run ☐   Lesson 2/6 ▾  │ │
│  └──────────────────────────────────────────────────┘ │
│  ┌─ .pg-editors (left, ~55%) ──┐ ┌─ .pg-preview ────┐ │
│  │ [ HTML ][ JS ][ CSS ]        │ │                 │ │
│  │ ┌──────────────────────────┐ │ │  <iframe>       │ │
│  │ │ CodeMirror editor        │ │ │  sandboxed      │ │
│  │ │ (syntax-highlighted)     │ │ │  srcdoc         │ │
│  │ └──────────────────────────┘ │ │                 │ │
│  └─────────────────────────────┘ └─────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Interaction

- **Run** rebuilds the iframe from current editor contents
- **Reset** restores the lesson's original parsed source
- **Auto-run** checkbox debounces 500ms after edits (off by default)
- **Lesson dropdown** jumps to any lesson
- **Editor tabs** HTML / JS / CSS, one visible at a time; switching preserves content (single CodeMirror instance, swap doc)
- **Split** ~55% editors / 45% preview on desktop; stacks on narrow screens
- **Preview iframe** no border, fills pane, white background
- **Error bar** under preview: `window.onerror` + `console.error`/`warn` proxy in iframe post messages back to parent; shown in red, cleared on each Run

### CodeMirror config

Line numbers, bracket matching, JavaScript/HTML grammar, dark theme to match
existing `atom-one-dark`. No line wrapping (code scroll). Tab inserts 2 spaces.

### Existing elements reused

`#lesson` (title + description), `#lessons` (bullet points), `#nav`, prev/next
buttons, hash-based routing — all kept and driven by `tutorial.js`'s `pages[]`.
Only what `pages.js` puts into `#example` is replaced.

## Lesson format

Each lesson is a **standalone HTML file** — openable directly in a browser, loads
`m2d2.min.js`, has a `<body>`, works on its own. The playground parses them.

### Lesson file structure

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* CSS pane content */
  </style>
</head>
<body>
  <!-- HTML pane content (body innerHTML only) -->
  <script src="../../dist/m2d2.min.js"></script>
  <script>
    // JS pane content
    m2d2.ready($ => { ... });
  </script>
</body>
</html>
```

The parser extracts:
- `css` ← concatenated text of all `<style>` tags
- `js` ← concatenated text of all inline `<script>` (no `src`) tags
- `html` ← `body.innerHTML` with `<script>`/`<style>` nodes removed

The `m2d2.min.js` script tags are stripped during parsing but re-injected on Run
so the iframe always loads the library from the right relative path.

## Users/Groups build-up (6 lessons)

Each lesson is self-contained and complete — lesson 2's file contains everything
from lesson 1 plus the new feature. A learner can open any `.html` directly and
see a working (partial) app. This avoids "lesson N depends on lesson N-1's code"
breakage and means each file is a valid standalone example.

| # | File | Adds | Demonstrates |
|---|------|------|--------------|
| 1 | `01-static-render.html` | Static data → render user list + group list | Short-assign, templates, items, `m2d2.ready` |
| 2 | `02-add-user.html` | Form to add a user (name, email) | Forms, events (`onclick`), `items.push`, validation |
| 3 | `03-edit-delete.html` | Edit-in-place + delete buttons per user | Linked refs, `onupdate`, `items.splice`, `items.selected` |
| 4 | `04-groups.html` | Group CRUD (name only) | Reusing templates, multiple lists, separating concerns |
| 5 | `05-membership.html` | Assign users to groups (checkboxes) | Linked references `[user, "groups"]`, nested templates, `onupdate` cascades |
| 6 | `06-persistence.html` | Save/load via `m2d2.storage` | Storage extension, `onupdate` autosave, initialization from storage |

**Seed data:** ~5 users and ~3 groups inline in each lesson file (so every
lesson is standalone — no shared `seed.js` dependency).

## `pages.js` rewrite & backward compatibility

### `pages[]` schema change

The `id` (JSFiddle hash) becomes a `file` (local path):

```js
const pages = [
    {
        file: "01-static-render.html",      // ← was: id: "v3pr6twe"
        title: "1. Render the data",
        description: "...",
        lessons: [ "bullet point text...", ... ]   // unchanged
    },
    ...
];
```

`file` is relative to `examples/tutorial/`. `title`/`description`/`lessons` stay
exactly as the current schema. Old `id`-based JSFiddle entries replaced.

### Loading sequence

1. `pages.js` handles nav/routing (unchanged logic: hash → selected lesson, prev/next)
2. On lesson select, calls `playground.load(file)` with the new file path
3. `playground.js` does: `fetch(file)` → parse HTML/JS/CSS → populate editors → auto-run once
4. On Run/Reset/auto-run, `playground.js` rebuilds the iframe `srcdoc`

### Removed

`getCodeURL`/`getViewURL`/JSFiddle URL logic, the two `<script async src="…jsfiddle…">`
iframe items, and the `example` template that created them (~30 lines).

### Kept untouched

`tutorial.js`'s `pages[]` array (re-pointing `id`→`file`), nav rendering, prev/next
button wiring, hash routing, `#lesson`/`#lessons` rendering, highlight.js on lesson
text. The tutorial shell HTML needs only the two `<script>` tags added for
CodeMirror + playground.

### No build step changes

Playground files live in `examples/js/` and `examples/tutorial/` — pure static
assets served as-is. `esbuild.config.js` doesn't touch them.

### `file://` caveat

Opening `tutorial.html` via `file://` won't work for `fetch()` of lesson files
(CORS). The tutorial must be served over HTTP (e.g.
`python3 -m http.server` from `examples/`). Noted in tutorial intro and a
one-line `examples/serve.sh` helper.

## `playground.js` internals

```
examples/js/playground.js
  ├─ Playground singleton (m2d2.ready($ => { ... }))
  │    ├─ load(fileUrl)       — fetch + parse + populate + first run
  │    ├─ run()               — assemble srcdoc, inject into iframe
  │    ├─ reset()             — restore original parsed source
  │    ├─ setTab(name)        — switch HTML/JS/CSS editor doc
  │    └─ autoRun(toggle)     — wire/debounce edits → run
  ├─ parseLesson(htmlString)  — { html, js, css }  (pure function)
  ├─ assembleSrcDoc(html,js,css) — full HTML doc string (pure function)
  └─ initCodeMirror()         — one EditorView, doc-per-tab state
```

### `parseLesson`

Uses `DOMParser` to read the lesson file, then:
- `css` ← concatenated text of all `<style>` tags
- `js` ← concatenated text of all inline `<script>` (no `src`) tags
- `html` ← `body.innerHTML` with `<script>`/`<style>` nodes removed
- Throws a clear error if no `<body>` (defensive — malformed lesson)

### `assembleSrcDoc`

Rebuilds a complete document. The iframe runs under `sandbox="allow-scripts"`
(no same-origin), so relative paths like `../../dist/m2d2.min.js` resolve relative
to the iframe's base URL (`about:blank`). A `<base>` tag points at the lesson
file's directory so paths resolve correctly:

```html
<base href="http://localhost:8000/examples/tutorial/">
<script src="../../dist/m2d2.min.js"></script>
```

The lesson's own `<script src>` keeps working unmodified — lessons remain
standalone-openable, and the playground doesn't need to rewrite paths.

### Error capture

`assembleSrcDoc` injects a bootstrap before the user script:

```js
window.onerror = (msg, src, line, col, err) => {
  parent.postMessage({ type: "pg-error", message: msg, line, col }, "*");
};
```

`playground.js` listens via `window.addEventListener("message", …)`, routes
`pg-error` to a `.pg-errorbar` element under the preview. Cleared on each Run.
Non-error messages ignored (type prefix namespaces ours).

Console capture is lightweight: proxy `console.error`/`console.warn` in the
iframe the same way. Error/warn only — not a full console mirror.

### CodeMirror lifecycle

One `EditorView`, doc-per-tab. `setTab` calls
`editor.dispatch({ changes: { from: 0, to: doc.length, insert: nextDoc } })`.
`reset()` repopulates from stashed original parse.

### Auto-run

On `doc.updateListener`, if auto-run on, debounce 500ms → `run()`. Off by default.

## Testing strategy

### Tier 1 — Unit tests in jsdom (Vitest, added to existing suite)

The pure-logic pieces, exposed for testing:
- `parseLesson(htmlString)` → correct `{ html, js, css }` split (script/style extraction, body isolation, multiple `<style>` tags, no-body malformed input throws)
- `assembleSrcDoc(html, js, css, baseUrl)` → produces complete document with `<base>`, error bootstrap, user code in right order; library script preserved
- `<base>` href resolution logic

Target: ~15-20 tests. Run in `npm test`. Regression protection on parsing/assembly.

### Tier 2 — Manual browser checklist

`examples/tutorial/MANUAL.md` with checkbox checklist: load each lesson, edit JS,
run, check error bar, reset, auto-run, narrow viewport. The honest scope boundary
for iframe/CodeMirror behavior.

### Not tested in automation

CodeMirror behavior, iframe sandbox execution, `postMessage` round-trips, lesson
content correctness (lesson HTML files are themselves the "test").
