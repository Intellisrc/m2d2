# Changelog

## v3.1.0

Lists (`items`) now reconcile instead of clearing + rebuilding, and `items`
changes fire the `update` event exactly once. Existing list code keeps working
unchanged and immediately benefits; a new optional `key` enables reuse by
identity across reorders.

### Added
- **Keyed reconciliation for `items`** — declare `key` (a field name or a
  function) so list items are reused **by identity** across sorts, filters,
  prepends and reorders, instead of by position. Focus, selection, scroll and
  per-item state are preserved because nodes are moved, not recreated.
  ```js
  $("#list", { key: "id", template: { … }, items: […] });          // field name
  $("#list", { key: (item) => item.uuid, template: { … }, … });    // function
  ```
  `key` is optional — omit it and M2D2 reconciles by position (no code change).

### Fixed
- **`items` updates fire once** — assigning `items` (and `push`, `unshift`,
  `splice`, `pop`, `shift`, `clear`, `remove`, `sort`, `reverse`, `fill`,
  `copyWithin`, `concat`) now dispatches the `update`/`onupdate` event exactly
  once per change. Previously a single reassignment could fire it two or three
  times (the Proxy and the MutationObserver both emitted, with different dedupe
  signatures). The library is now the single source of `items` updates.

### Changed (compat-affecting, all intentional)
1. **`items` reassignment reconciles** — setting `items = […]` on an existing
   list reuses the item nodes that are already there and patches them in place,
   rather than clearing and rebuilding. Faster, and preserves focus/state.
   `dataset.id` still equals the positional index, so `items.get(i)` and the
   `index` are unaffected.
2. **`key` field is consumed, not rendered** — when `key` is a field name, that
   field is used only for matching and is stripped from the item content, so
   keying on `id`, `uuid`, `sku`, etc. neither warns nor appears on the element.
   (Function keys can't know which fields they read, so those still follow the
   normal rules.)
3. **External mutations on a managed list are no longer re-broadcast** — DOM
   changes made outside M2D2 on an `items` container are no longer emitted as
   `items` update events. Library-driven changes (`items = …` and the items
   methods) are the single source.

## v3.0.0 — 2026-06-20

M2D2 has been rewritten in TypeScript. The public API is unchanged
(`m2d2.ready($ => ...)`, `const $ = m2d2.load()`, the `$` factory, short
assignment, linked references, items/templates, extensions). Source code now
lives in `src/` and is compiled to ESM, CJS, and a browser-ready IIFE bundle
with full `.d.ts` type declarations.

### Extensions included
All extensions are registered automatically when importing `m2d2`:
`storage`, `xhr` (+`upload`), `ws`, `lang`, `alert`.

### Alert extension redesign
The alert extension has been redesigned with a cleaner architecture:
- **Minimal core**: `$.message` + entry-point shims (`$.wait`, `$.alert`,
  `$.success`, `$.failure`, `$.confirm`, `$.prompt`, `$.closeAll`) — unchanged
  signatures, no breakage.
- **No default font dependency**: uses Unicode/emoji icons by default
  (`✓`, `ⓘ`, `⚠`, `?`, `✎`, `⏳`). Disable via `m2d2.alert.register({ iconsOff: true })`.
- **Pluggable icon sources** (separate files): `default` (Unicode), `material`
  (Google Material Symbols), `fa` (Font Awesome classes), `svg` (inline SVG markup).
  Select via `m2d2.alert.register({ icons: "material" })`.
- **Modern CSS themes** via `var(--alert-*)` CSS variables: `alert.css` (structural),
  `alert-light.css`, `alert-dark.css` (variable definitions). Dark theme auto-applies
  via `prefers-color-scheme`. Themes are icon-independent.
- **Single configuration point**: `m2d2.alert.register({ icons, theme, iconsOff, dict, css, closeDuration })`.

### Documented behavior changes (compat-affecting, all intentional)
These are small and improve correctness. Existing code that relied on the old
quirky behavior may need a one-line adjustment.

1. **Ambiguous spec key** — when a key matches neither an attribute/property
   nor any child element (and isn't `template`/`items`/`warn`/an event), m2d2
   now warns and **skips** it. Previously it assigned `node[key] = value`,
   leaving junk expando properties on elements.
2. **`form.getData()` multi-value** — a field name appearing more than once
   (checkbox groups, multi-select) now always becomes an array. Previously the
   grouping was inconsistent.
3. **`$.upload` `maxFiles`** — fixed a bitwise-OR bug (`|` → `||`); nonzero
   `maxFiles` values now enforce the limit correctly.
4. **`items.splice` / `items.fill` / `items.copyWithin`** — now implemented
   over the live collection (previously silent no-ops that logged a warning).
5. **`onupdate` single-fire** — assigning `onupdate = fn` no longer double-fires
   (the proxy registered the listener twice).
6. **`storage.get`** — a missing key returns `null`; a parse failure warns and
   returns `null` (previously silently swallowed and returned `{}`/`null`).
7. **`onready` timing** — fires via a microtask instead of `setTimeout(_, 10)`
   (still asynchronous relative to the `$()` return, so the returned const is
   assigned before `onready` runs).
