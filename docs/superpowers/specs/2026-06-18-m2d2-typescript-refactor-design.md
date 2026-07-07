# M2D2 TypeScript Refactor — Design

- **Date:** 2026-06-18
- **Status:** Approved (pending spec review)
- **Scope:** Core + headless extensions (storage, xhr, upload, ws). `alert` and `lang` deferred to a follow-up.

## 1. Goal

Refactor the m2d2 reactive DOM library into clean, well-typed TypeScript while preserving its
public concepts, fixing real bugs, and improving usability. The rewrite uses the existing `js/`
source as a *reference* only (not a line-by-line port). The library must remain usable the same
way it is today (same entry points, same `$` factory mental model, same bundle story).

m2d2 is a reactive DOM library whose public surface is:

- **Entry points:** `m2d2.ready($ => …)` (waits for `DOMContentLoaded`) and `const $ = m2d2.load()`
  (immediate; also collects extensions). UMD global is `m2d2`; `$` is the conventional factory alias.
- **`$` factory — four call shapes:**
  - `$(selector, object)` — bind a data object to an existing element.
  - `$(selector, htmlString)` — set `innerHTML`, return the extended element.
  - `$(selector)` — return the extended element (no bind); also used to "import" a previously-bound node.
  - `$({ … })` — create a detached, observable fragment (plain-data reactivity source).
- **Short-assign via Proxy:** `user.name = "x"` guesses `text` / `value` / `src` / `href` based on
  the target element.
- **Smart element location:** for each spec key, resolve in priority `tag` → `#id` → `[name]` → `.class`
  → free selector.
- **Linking:** `node.key` shortcuts to a matched child; `node.$key` is the conflict-escape when `key`
  collides with an existing property/attribute.
- **Reactivity:** `onload` / `onready` / `onshow` / `onupdate` events, and **linked references**
  `[source, "prop"]` and `[source, "prop", fn]`.
- **Lists:** `template` + `items` with an array-like API (`push`, `sort`, `filter`, `first`, `last`,
  `get`, `selected`, `unselect`, `clear`, `splice`, …).
- **Special object keys with reserved meaning:** `tagName`, `template`, `items`, `warn`, `css`,
  `style`, `dataset`, `show`, `onload`, `onready`, `onshow`, `onupdate`, plus DOM event handler
  names (`onclick`, `oninput`, `onsubmit`, …).
- **Extensions** registered via `m2d2.load($ => { $.foo = … })`: storage, xhr (+upload), ws
  (in scope); alert, lang (deferred).
- **Utils** exposed as `$.isString`, `$.isNode`, `$.isElement`, `$.htmlElement`, etc.
- **Bundles:** core / xhr / ws / full, consumed via `<script>` (UMD) or
  `import m2d2 from 'm2d2'` / `'m2d2/core'` / `'m2d2/ws'` / `'m2d2/xhr'`.

## 2. Locked Decisions

| Concern | Decision |
|---|---|
| Tests | **Vitest + jsdom** (terminal, native TS, MutationObserver/FormData/localStorage supported). Rewrite the existing QUnit tests as Vitest specs. |
| Build | **TypeScript `src/` + esbuild bundles** (ESM + UMD + `.d.ts`). Retire gulp. Keep the multi-pack story (`'m2d2'`, `'m2d2/core'`, `'m2d2/ws'`, `'m2d2/xhr'`). |
| Scope | **Core + headless extensions** (storage, xhr, upload, ws). `alert` and `lang` deferred. |
| Compat posture | **Same concepts, cleaner API.** Keep short-assign, linked refs, `$key` conflict resolution, `warn:false`, flexible xhr argument ordering. Fix real bugs; small, documented behavior changes acceptable for elegance. |
| Architecture | **Approach A** — functional decomposition; Proxy stays a thin *edge* wrapper around real `HTMLElement`s. The real node is the source of truth. |
| `onready` timing | **Microtask** (`Promise.resolve().then` / `queueMicrotask`) — async vs the `$()` return, no magic 10ms. |
| `Element.prototype` patching | **Keep** (append/before/after/prepend/insertAdjacentElement/replaceWith) so `parentDiv.append(m2d2Node)` Just Works. One-time install, idempotent. |
| Ambiguous spec key | **Warn (gated by `warn:false`) + skip** — do not assign junk expando properties to nodes. *(Behavior change vs today's "warn + assign".)* |
| Array mutators `splice`/`copyWithin`/`fill` | **Implement** over the live collection (today they are silent no-ops). |
| Linked-ref dataset/style store | **WeakMap** keyed by source node — no manual parallel arrays, GC-friendly. |
| Old source | **Keep `js/`, `gulpfile.js`, old `test/*.js`, and staged `dist/` deletions until the TS port passes its tests**, then remove in a final cleanup commit. |
| Language target | **ES2020 / Node 18+.** Native Proxy/MutationObserver/WeakMap/optional-chaining; solid jsdom support. |

## 3. Architecture — Module Map

Decompose the current 1476-line god-class (`js/m2d2.src.js`) into focused modules. The one contract
that must not break: **`$(sel)` returns a real, extended `HTMLElement`** — `$.isElement(q)` stays
`true`, `document.querySelector("#x").text` keeps working (because `extDom` stamps the property on
the element instance), and m2d2 objects pass cleanly to native / jQuery APIs. The Proxy only wraps
the edge; it never stores state.

```
src/
  index.ts            Public entry; assembles & exports `m2d2` (ready/load/main); default UMD global
  config.ts           Flags: short, updates, storedEventsTimeout + extension registry
  types.ts            Shared TS types: ElementSpec, Binding, UpdateDetail, LinkedRef, M2d2Node
  log.ts              Unified warn/error layer; single place that respects `warn:false` & conflict reporting
  utils.ts            Utils class (is*, hasAttr/hasProp, newElement, htmlElement, …) → $.xxx
  dom.ts              extDom: stamps .text/.html/.css/.show/.find/.findAll/.parent/.sibling/
                      .posterior/.anterior/.index/.inView/.getData onto real nodes (idempotent via _m2d2 flag)
  locator.ts          Smart element resolution (tag → #id → [name] → .class → free selector)
  binding.ts          doDom core: iterate keys, resolve attr/prop vs child, dispatch onload, special-key handling
  template.ts         getTemplate / getItem / doItems — template resolution + per-container defaults
  items.ts            extendItems: array-like items API (push/sort/filter/first/last/get/selected/…)
  reactivity.ts       proxy (short-assign) + MutationObserver + updateValue + linked refs + onupdate dispatch
  factory.ts          The $ function: $(sel,obj) / $(sel,html) / $(sel) / $({…}); ready / load wiring
  extensions/
    storage.ts        $.local / $.session
    xhr.ts            $.get/.post/…/.head/.copy + flexible argument parsing
    upload.ts         $.upload
    ws.ts             $.ws WebSocket client
```

**Design rules the modules enforce:**

- **Real node is the source of truth.** Proxy never stores state; it intercepts get/set at the edge
  and delegates to the node. Removes today's scattered `target.domNode` checks.
- **One logging surface** (`log.ts`). Every `console.log`/`console.error` in the current code routes
  through here, gated by the node's `warn` flag. No ad-hoc checks scattered through `doDom`.
- **`extDom` stays idempotent** (`_m2d2` flag). Calling it on an already-extended node is a no-op,
  so double-references and `find()` chains stay cheap.
- **Extensions are plain registers** — each exports a `register($)` function; bundled builds import
  core + the chosen extensions.

## 4. The `$` Factory

### Call shapes
| Shape | Call | Result |
|---|---|---|
| 1 | `$(selector, object)` | Bind object to existing element |
| 2 | `$(selector, htmlString)` | Set `innerHTML`, return extended element |
| 3 | `$(selector)` | Return extended element (no bind) / import |
| 4 | `$({ … })` | Detached observable fragment |

### Resolution order
1. **Detect shape.** Plain-object first arg ⇒ shape 4 (fragment). String/element first arg ⇒
   shape 1/2/3; second-arg type decides 1 vs 2.
2. **Shape 4 — fragment:** deep-clone the object, attach `EventTarget` capabilities (so
   `onupdate`/linked-refs work on plain data), wrap in Proxy, return. *Fix:* the proxy must own a
   fresh copy but remain reactive for itself; the original must not be mutated through the proxy.
3. **Shape 1/2/3 — selector path:** `doDom(selector, objectOrHtml)`:
   - `object === undefined` → extend & return (shape 3).
   - `isHtml(object)` (string starting with `<`) → set `innerHTML`, return (shape 2). **Made
     explicit and tested** (today it's an emergent side effect of `plainToObject`).
   - otherwise → full bind (shape 1).
4. **`onready` wiring** (shape 1 only): register a one-shot `"ready"` listener; dispatch via
   **microtask** after the object is fully built (replaces today's `setTimeout(_, 10)`).
5. **Reactivity attach:** register `dataset`/`style` refs with the reactivity store (WeakMap);
   wrap root in Proxy; start the MutationObserver.

### Config & namespace
Config flags stay on the `m2d2` namespace: `m2d2.short`, `m2d2.updates`, `m2d2.storedEventsTimeout`,
`m2d2.extensions`. `ready(cb)` waits for `DOMContentLoaded`; `load(cb?)` runs immediately and
collects extensions. The `$.xxx` utils are copied onto the `$` function exactly as today.

## 5. DOM Extension (`dom.ts`)

`extDom` stamps the m2d2 surface onto a real `HTMLElement`. Keep the exact surface and the
idempotent `_m2d2` guard; each definition becomes a clean module-level function.

**Properties** (`Object.defineProperty` on the node instance):
| prop | get | set |
|---|---|---|
| `text` | `innerText` if child nodes exist else `textContent` | update only Text nodes; prepend a new Text node if none (preserves child elements) |
| `html` | `innerHTML` | `innerHTML` |
| `css` | `classList` | string → `className`; array → join; object → add/remove per boolean; else `log.error` |
| `show` | `isVisible(node)` | restore saved display / remove `display:none` / compute default per tag; fire `onshow` on hidden→shown transition. hide: stash current display, set `none`. |

**Methods** (assigned via `Object.assign`, bound to the node):
`find(sel)`, `findAll(sel?)`, `parent()`, `sibling(sel)`, `posterior()`, `anterior()`, `index()`,
`inView()`, and — for `<form>` only — `getData(includeNotVisible?)`.

**Form `getData()`** — `FormData`-based; **fix:** a field name appearing exactly once → its single
value; a field name appearing more than once → an array of its values (today the grouping is
inconsistent). `type="file"` → `files` (or array of `files` if multiple).

**`value` sync on inputs:** for `INPUT`/`TEXTAREA`/`SELECT` with a `value`, an `oninput` handler
keeps the `value` attribute in sync (current behavior).

**Collision handling:** if the node already owns one of these names natively (e.g. `<option>.index`),
skip and `log.warn` exactly once — never clobber.

### `Element.prototype` patching (kept)
Install once (guarded so re-install is a no-op): override `append`/`before`/`after`/`prepend`/
`insertAdjacentElement`/`replaceWith` so that passing an m2d2 proxy appends its underlying node
(issue #53). Original methods stashed under `_*` names as today.

## 6. Binding & Locator (`binding.ts` + `locator.ts`)

### Locator (pure)
Given `$node` and `key`, returns `{ matched: Element[], ambiguous: boolean }` in priority:
`#key` → `[name="key"]` → `.key` → free selector / tag. Skips `template` keys and function values.
Pure function; fully unit-testable in isolation.

### Binder (orchestrator)
Iterates the spec object's keys (filtering out `tagName`); for each key/value:

1. **Coerce value** (`coerce` helper, formerly `plainToObject`): HTML string → `{html}`; array →
   `{items}`; plain value on input → `{value}`; on `<select>` → `{value, text}`; on `<button>` →
   `{text}`; on `<img>` → `{src}`; on `<a[href]>` → `{href}`; else `{text}`. Recognizes the
   linked-ref shapes `[node,"prop"]` / `[node,"prop",fn]` (delegated to `reactivity.ts`).
2. **Resolve target** via an explicit `matchesType(node, key, value)` predicate (replaces today's
   fall-through `switch(true)` cascade).
3. **Branch:**
   - **Property/attribute match** → `css`/`style`/`dataset` get their own handlers; booleans and
     attr-or-props go through `setPropOrAttr`; everything else direct-assigns.
   - **Child element(s) found** → single match: `renderAndLink`; multiple: render each, `linkNode`,
     emit the multi-match warning (gated by `warn`).
   - **No match** → creation path: `value.tagName` or `isValidElement(key)` creates a new child;
     `key==="items"` triggers `template.ts`; a function value registers `onupdate`; otherwise the
     ambiguous-key warning **+ skip** (no expando assignment).
4. **`linkNode`** (conflict rule, explicit):
   - if `node[key]` isn't already the child and `!hasAttrOrProp(node, key)` → `node[key] = proxy(child)`.
   - if `key` collides with an existing prop/attr → `node["$"+key]` instead + `log.warn`.
5. **`onload` dispatch:** after binding, fire `onload` for non-native-load tags via
   `CustomEvent("load")`. Runs before `onready`.

### Reserved special keys
`tagName`, `template`, `items`, `warn`, `css`, `style`, `dataset`, `show`, `onload`, `onready`,
`onshow`, `onupdate`, and DOM event handler names.

### Fixes in this layer
1. `doDom`'s silent `undefined`/`null` → `""` substitution becomes a `log.warn` (still substitutes
   `""`).
2. The `switch(true)` type-match cascade is replaced by an explicit predicate — same outcomes, no
   fall-through.

## 7. Templates & Items (`template.ts` + `items.ts`)

### Template resolution (`getTemplate`)
Returns the element used to clone each item, in priority:
1. Cached `$node._template` → reuse (avoids re-parsing every render — perf requirement behind the
   sort-regression test).
2. A `<template>` child in HTML → use its `innerHTML`.
3. Per-container default tag: `SELECT`/`DATALIST`→`OPTION`, `UL`/`OL`→`LI`, `NAV`→`A`, `DL`→`DD`.
4. An explicit `template` object/string → build from it; multiple top keys → use the first (warn) or
   wrap via `template.tagName`.
5. Fallback: clone the node's existing children, else `<span>` with a warn.

The template is **decorated** by running `doDom` over a wrapper so child links/events in the
template spec attach to each cloned item. The original template-with-events is stashed as
non-enumerable `__template`; the DOM clone as `_template`. Multi-child templates auto-wrap in
`<span>` (warn).

### Item rendering (`doItems` / `getItem`)
For each value: `coerce`, clone `_template`, copy `__template`/`_template` refs, set
`dataset.id = index`, install the `selected` unique-attribute getter/setter, `doDom` the item,
re-scan `__template` for events, append. Remove the `<template>` tag afterward; set
`node.items = node.children`.

### Items API (`extendItems`)
Turns `node.items` (an `HTMLCollection`) into the documented array-like over the live collection
(DOM mutations reflect immediately):

- **Mutators that re-attach:** `reverse`, `sort` — copy to array, mutate, reattach. Meets the
  sort-regression perf requirement (no Proxy accumulation).
- **Custom:** `clear`, `get(id)` (by `dataset.id`), `remove(id)`, `selected()`, `unselect()`,
  `first()`, `last()`, `pop`, `shift`, `push`, `unshift`, `concat`, `findAll`.
- **Newly implemented:** `splice`, `copyWithin`, `fill` — over the live collection (today they are
  silent no-ops).
- **Delegated to Array** (over proxied nodes): `forEach`, `map`, `filter`, `every`, `some`, `find`,
  `findIndex`, `includes`, `indexOf`, `slice`, `reduce`, etc. `find`/`findAll` keep the
  string-selector special-case.

### Fixes in this layer
1. **`selected()` uniqueness** — centralize selected-state in one place; test the multi-select-clear
  edge directly (this has been buggy repeatedly per commit history).
2. `push`/`unshift`/`concat` with plain strings stays supported.

## 8. Reactivity (`reactivity.ts`)

Unifies today's `proxy`, `observe`/`onObserve`, `updateValue`, linked references, and `update`
dispatch. The "did the value actually change?" check currently appears in three places; it becomes
one source of truth.

### The `update` event contract
```
CustomEvent("update", { detail: { type, property, newValue, oldValue } })
```
Dispatched on a bound value change — by direct proxy assignment, by a linked-ref source changing, or
by an observed DOM mutation. Listeners fire `onupdate`. **Duplicate-event suppression:** the 50ms
dedupe stays (known double-trigger when an element is both proxied and `$`-linked) but moves into
one helper (`dispatchUpdate`), keyed on the `{target, property, newValue}` tuple so legitimate rapid
distinct changes aren't lost.

### Three reactive mechanisms
1. **Short-assign Proxy** — wraps a node at the edge.
   - `set`: if target is an element, compute `oldValue`/`newValue` via `getShortValue`/`setShortValue`
     (guess text vs value), then `dispatchUpdate`; special-case `onupdate` (register listener),
     `items` (clear + `doItems`), and linked-ref values (`updateValue`).
   - `get`: bind functions, unwrap nested elements through the proxy, pass through the rest.
   - Disabled wholesale when `m2d2.short === false`.
   - *Fix:* element-valued props consistently return proxied children.
2. **MutationObserver** — one per root node (attached in `getProxyNode`), watching
   `{subtree, childList, attributes, attributeOldValue}`. Translates mutations into `update` events:
   attribute → `{property: attrName}`; text-node childList → `{property:"text"}`; item childList →
   `{property:"items", newValue:added, oldValue:removed}`. Disabled when `m2d2.updates === false`.
   - *Fix:* guard `m.addedNodes[0].textContent` against empty `addedNodes` on removal-only mutations.
3. **Linked references** `[source, "prop"]` / `[source, "prop", fn]` — `updateValue` registers a
   listener on the source's `update` event filtering by `ev.detail.property === prop`, transforms via
   `fn` (default identity), writes to target via `setShortValue`. Sources: a proxied node, a `dataset`
   (`DOMStringMap`), or a `style` (`CSSStyleDeclaration`) — resolved against a **WeakMap** store
   (keyed by source node) populated by the factory. The `$({…})` plain-object fragment works because
   `EventTarget` is attached to it and its own property writes are observed.

### Fixes in this layer
1. Event-storm/double-dispatch: keep 50ms dedupe but key on `{target, property, newValue}`.
2. `onupdate = fn` via proxy: register the listener and do **not** also assign the property when
   `updates` is on (today it does both → double fire).

## 9. Utils & Extensions (in scope)

### `utils.ts`
The `Utils` class ported to TS with proper signatures. Exposed three ways: as `m2d2.utils` (the
instance), and **copied onto the `$` function** so `$.isString`, `$.isNode`, `$.isElement`, etc.
all work (every test relies on this). Fixes: `isHtml` rejects non-strings; `htmlElement` returns a
typed `Element | null`; `hasProp`'s "value===null means no prop" quirk kept but documented.

### `extensions/storage.ts`
`$.local` / `$.session`. Wraps `localStorage`/`sessionStorage`; type-preserving JSON envelope
(`{$:"str"}` for strings, raw object otherwise). `set/get/del/keys/clear/exists/log`.
*Fix:* missing key → `null`; parse failure → `log.warn` + `null` (today silently swallows).

### `extensions/xhr.ts`
`$.get/.post/.put/.delete/.connect/.options/.trace/.patch/.head/.copy`. Keeps the **flexible argument
parsing** (any order of url/data/callback/error/json/timeout by type) — explicitly advertised in the
docs. Returns the `XMLHttpRequest`. Cleans up the `onreadystatechange` re-declaration footgun
(`const headers`/`partial` redeclared per `switch` case). Adds `'headers'`/`'partial'` stream
callbacks as documented.

### `extensions/upload.ts`
`$.upload(ev, opts)`. Parallel vs Sequence modes; `onSelect/onUpdate/onDone/onError/onResponse`;
`accept/multiple/maxFiles/maxSizeMb/parallel/maxParallel/field/php`.
*Fix:* `opts.maxFiles === 0 | el.files.length <= opts.maxFiles` is a **bitwise-OR bug** → `||`.

### `extensions/ws.ts`
`$.ws.connect(opts, onMessage)` / `.request(msg)` / `.disconnect()`. Auto-reconnect loop; `wss` when
`secure`. Kept close to current; typed options.

### Deferred (out of scope this pass)
`alert.ts` and `lang.ts` — they render DOM/CSS and are the fiddliest to port; a follow-up handles
them. The `m2d2.bundle.min.js` full pack will, for now, be assembled as core + storage + xhr + upload
+ ws (no alert/lang); this is noted in the README/changelog with the follow-up tracked.

## 10. Project Layout

```
src/
  index.ts  config.ts  types.ts  log.ts  utils.ts
  dom.ts  locator.ts  binding.ts  template.ts  items.ts  reactivity.ts  factory.ts
  extensions/{storage,xhr,upload,ws}.ts
test/                       ← rewritten in Vitest + jsdom
  helpers.ts                (old 00_include.js: $ + root fixture setup)
  *.test.ts                 (one per old test, renamed to describe behavior)
tsconfig.json  vitest.config.ts  esbuild.config.ts  package.json
dist/                       ← generated: m2d2.{min.js, esm.js, .d.ts} + bundle packs
```

## 11. Build & Tooling

- **esbuild** replaces gulp. Bundles + types:
  - `m2d2` (core): `src/index.ts`
  - `m2d2/xhr`: core + storage + xhr + upload
  - `m2d2/ws`: core + storage + xhr + ws
  - (full bundle: core + storage + xhr + upload + ws for now; alert/lang added in follow-up)
- Emits **ESM + UMD** (UMD global `m2d2`) + **`.d.ts`**.
- `package.json` gets `"exports"` mapping for `'m2d2'`/`'m2d2/core'`/`'m2d2/ws'`/`'m2d2/xhr'`,
  `"types"`, and `test`/`build` scripts.
- **tsconfig:** `target: ES2020`, `module: ESNext`, `strict: true`, DOM lib.
- **vitest.config:** `environment: 'jsdom'`, setup file wires the document fixture.

## 12. Test Plan

Rewrite each existing QUnit test file as a Vitest spec under `test/`, one `*.test.ts` per old test,
renamed to describe behavior. New coverage for the bug fixes:

- **`getData()` multi-value grouping** (checkbox groups / multi-select → arrays).
- **`items.splice/copyWithin/fill`** newly-implemented mutators.
- **`selected()` multi-select-clear** edge.
- **`onupdate` single-fire** (no double dispatch).
- **`maxFiles` bitwise-OR fix** (nonzero `maxFiles` with over-limit file count).
- **`storage` missing-key → `null`** and parse-failure warn.
- **Factory shape 2** (`$(sel, htmlString)`) as an explicit, tested path.
- **`onready` microtask timing** (fires after `$()` returns).

The test runner is terminal-only: `npm test` runs Vitest under jsdom.

## 13. Migration / Cleanup

- Keep `js/`, `gulpfile.js`, old `test/*.js`, and the staged `dist/` deletions **until the TS port
  passes its tests**. The old source remains a live diff reference during porting.
- Final cleanup commit removes `js/`, `gulpfile.js`, old QUnit `test/*.js`, and finalizes the
  `dist/` regeneration.
- The `documentation/*.md` files are accurate as-is for the in-scope surface; a short CHANGELOG note
  records the deferred alert/lang and the documented small behavior changes (ambiguous-key skip;
  `getData` multi-value; `maxFiles` fix; `splice/copyWithin/fill` implemented).

## 14. Out of Scope / Follow-ups

- `alert.ts` and `lang.ts` ports (DOM/CSS-render extensions).
- Full bundle regaining alert/lang.
- Any new features not present in the current library.
- Bundling CSS for the (deferred) alert extension.

## 15. Documented Behavior Changes (compat-affecting)

These are intentional, small, and improve correctness:

1. **Ambiguous spec key:** warn + **skip** (was: warn + assign `node[key] = value`, leaving junk
   expando properties).
2. **`getData()` multi-value:** repeated field names always become arrays (was: inconsistent).
3. **`$.upload` `maxFiles`:** fixed bitwise-OR → logical-OR; nonzero `maxFiles` now enforces
   correctly.
4. **`items.splice/copyWithin/fill`:** implemented (were silent no-ops).
5. **`onupdate` single-fire:** no longer double-fires on literal `onupdate = fn` assignment.
6. **`storage.get`:** missing key → `null`; parse failure → warn + `null` (was: swallow + `{}`/`null`).
7. **`onready`:** microtask instead of `setTimeout(_, 10)` (still async vs `$()` return).
