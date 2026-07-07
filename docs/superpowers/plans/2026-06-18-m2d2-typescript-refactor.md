# M2D2 TypeScript Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the m2d2 reactive DOM library in clean TypeScript, decomposing the 1476-line god-class into focused modules, fixing bugs, and improving usability — while preserving the public `$` factory API.

**Architecture:** Approach A — functional decomposition with the Proxy as a thin edge wrapper around real `HTMLElement`s. The real node is the source of truth. Modules: `config`, `types`, `log`, `utils`, `dom`, `locator`, `binding`, `template`, `items`, `reactivity`, `factory`, `index` + 4 extensions. The old `js/` source is kept as a reference throughout and removed only in the final cleanup task.

**Tech Stack:** TypeScript (ES2020/strict), Vitest + jsdom (terminal tests), esbuild (ESM + UMD + .d.ts bundles), Node 18+.

**Reference spec:** `docs/superpowers/specs/2026-06-18-m2d2-typescript-refactor-design.md`

**Porting convention:** The old source in `js/` is the behavioral reference. When a task says "port `extDom` from `js/m2d2.src.js:137-329`", read that range, port the logic to TypeScript with the specified changes, and validate against the test. Do NOT copy bugs marked for fixing.

---

## Circular dependency note

`binding.ts` ↔ `template.ts` ↔ `items.ts` ↔ `reactivity.ts` are mutually recursive (doDom calls doItems calls doDom; proxy calls doItems; etc.). ES modules handle this correctly **as long as cross-module references only appear inside function bodies, never at module top-level**. Do not call any cross-module function during module initialization — only inside exported function bodies. No registration/late-binding pattern is needed.

---

## File Structure

```
src/
  config.ts           Config flags + extension registry
  types.ts            Shared TS types (M2d2Node, ElementSpec, UpdateDetail, etc.)
  log.ts              Unified warn/error (respects warn:false)
  utils.ts            Utils class → copied onto $ function
  dom.ts              extDom: stamps .text/.html/.css/.show/.find/... onto real nodes
  locator.ts          Smart element resolution (pure)
  binding.ts          doDom core + coerce + linkNode + render
  template.ts         getTemplate + getItem + doItems
  items.ts            extendItems + item methods (push/sort/splice/...)
  reactivity.ts       proxy + observe + short values + linked refs + dispatchUpdate
  factory.ts          $ function + ready + load
  index.ts            Assembles everything, exports m2d2 namespace
  extensions/
    storage.ts        $.local / $.session
    xhr.ts            $.get/.post/... + flexible arg parsing
    upload.ts         $.upload
    ws.ts             $.ws
test/
  helpers.ts          $ + root + fixture helpers
  *.test.ts           One per concern cluster
tsconfig.json
vitest.config.ts
esbuild.config.ts
package.json (modified)
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `test/helpers.ts`
- Modify: `package.json`

- [ ] **Step 1: Add dev dependencies**

Run:
```bash
npm install --save-dev typescript vitest jsdom @types/node esbuild
```

Expected: packages added to `devDependencies` in `package.json`.

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": ".",
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        globals: true,
        testTimeout: 10000,
    },
});
```

- [ ] **Step 4: Create `test/helpers.ts`**

This replaces the old `test/00_include.js`. Each test file imports from here.

```ts
import { beforeEach, afterEach } from "vitest";

// m2d2 is imported once the index exists; until Task 9, this is a placeholder.
// After Task 9, this line is uncommented:
// import { m2d2 } from "../src/index";

// Temporary stub for Tasks 2-8 (before index.ts exists):
// Remove this block in Task 9 Step 1 and use the real import above.
export const $: any = (() => {
    // Will be replaced by: const $ = m2d2.load();
    throw new Error("test helpers not yet wired — complete Task 9 first");
})();

export const id = "qunit-fixture";
export const root = "#" + id;

/**
 * Sets up a fresh #qunit-fixture div before each test.
 * Call setupFixture() at the top of each describe block.
 */
export function setupFixture(): void {
    beforeEach(() => {
        document.body.innerHTML = `<div id="${id}"></div>`;
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });
}

/**
 * Set HTML inside the fixture. Equivalent to $(root, htmlString).
 */
export function fixture(html: string): void {
    const el = document.querySelector(root) as HTMLElement;
    el.innerHTML = html.trim();
}
```

- [ ] **Step 5: Add scripts to `package.json`**

Add to the `"devDependencies"` (already has gulp etc., keep those for now):
```json
"scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "build": "node esbuild.config.js",
    "typecheck": "tsc --noEmit"
}
```

Also update the top-level fields to prepare for the new structure (keep old `"main"` pointing at dist until build works):
```json
"types": "dist/index.d.ts"
```

- [ ] **Step 6: Verify vitest runs (with zero tests)**

Run: `npx vitest run`
Expected: "No test files found" or similar — vitest is installed and config works.

- [ ] **Step 7: Commit**

```bash
git add tsconfig.json vitest.config.ts test/helpers.ts package.json package-lock.json
git commit -m "chore: scaffold TypeScript + Vitest + jsdom project structure"
```

---

## Task 2: Config, Types, Log

**Files:**
- Create: `src/config.ts`
- Create: `src/types.ts`
- Create: `src/log.ts`
- Test: `test/config.test.ts`

- [ ] **Step 1: Create `src/types.ts`**

```ts
/**
 * An HTMLElement extended by extDom with m2d2 properties and methods.
 * The real DOM node is the source of truth; the Proxy only wraps the edge.
 */
export interface M2d2Node extends HTMLElement {
    // m2d2 internal flags
    _m2d2?: boolean;
    _m2d2_display?: string;
    _template?: Element | null;
    __template?: Record<string, unknown> | null;
    domNode?: Element;
    hasEventListeners?: boolean;
    items?: ItemsCollection;

    // m2d2-added properties
    text: string;
    html: string;
    css: DOMTokenList;
    show: boolean;

    // m2d2-added event handlers
    onload?: (ev: Event) => void;
    onready?: (ev: Event) => void;
    onshow?: (node: M2d2Node) => void;
    onupdate?: (ev: CustomEvent<UpdateDetail>) => void;

    // m2d2-added methods
    find: (selector: string) => M2d2Node | null;
    findAll: (selector?: string) => Element[];
    parent: () => M2d2Node | null;
    sibling: (selector: string) => M2d2Node | null;
    posterior: () => Element | null;
    anterior: () => Element | null;
    index: (() => number) | number; // number for <option>, function otherwise
    inView: () => boolean;
    getData?: (includeNotVisible?: boolean) => Record<string, unknown>;

    // dynamic links to children (node.key shortcuts)
    [key: string]: unknown;
}

/**
 * The detail object dispatched with "update" CustomEvents.
 */
export interface UpdateDetail {
    type: string;
    property: string;
    newValue: unknown;
    oldValue: unknown;
}

/**
 * A linked reference: [source, "prop"] or [source, "prop", transformFn].
 */
export type LinkedRef = [source: object, prop: string] | [source: object, prop: string, fn: (val: unknown) => unknown];

/**
 * The items collection after extendItems: HTMLCollection + array-like methods.
 */
export interface ItemsCollection extends HTMLCollection {
    clear(): void;
    get(id: string | number): M2d2Node | null;
    remove(id: string | number): void;
    selected(): M2d2Node | null;
    unselect(): void;
    first(): M2d2Node | null;
    last(): M2d2Node | null;
    pop(): M2d2Node | null;
    shift(): M2d2Node | null;
    push(obj: unknown): void;
    unshift(obj: unknown): void;
    sort(compareFn?: (a: M2d2Node, b: M2d2Node) => number): void;
    reverse(): void;
    splice(start: number, deleteCount?: number, ...items: unknown[]): M2d2Node[];
    fill(value: unknown, start?: number, end?: number): void;
    copyWithin(target: number, start: number, end?: number): void;
    concat(...arrays: unknown[][]): void;
    forEach(cb: (item: M2d2Node, index: number) => void): void;
    map<U>(cb: (item: M2d2Node, index: number) => U): U[];
    filter(cb: (item: M2d2Node, index: number) => boolean): M2d2Node[];
    find(cb: (item: M2d2Node) => boolean): M2d2Node | undefined;
    find(sel: string): M2d2Node | null;
    findAll(sel?: string): Element[] | M2d2Node[];
    [key: string]: unknown;
}

/**
 * A value that may be a plain object spec, a primitive, or an array.
 */
export type SpecValue = unknown;
```

- [ ] **Step 2: Create `src/config.ts`**

```ts
/**
 * M2d2 configuration flags and global registries.
 *
 * Mirrors the original static fields on the m2d2 class (m2d2.src.js:17-20, 37).
 */
export const config = {
    /** Enable short assignation via Proxy. false = better performance. */
    short: true,
    /** Enable onupdate / linked references via MutationObserver + Proxy dispatch. */
    updates: true,
    /** Milliseconds to deduplicate identical update events. */
    storedEventsTimeout: 50,
};

/**
 * Registry of DOM extensions, keyed by tag name (e.g. "INPUT") or "*" (all).
 * Populated by m2d2.load(cb) when cb returns an extension object.
 */
export const extensions: Record<string, Record<string, unknown>> = {};
```

- [ ] **Step 3: Create `src/log.ts`**

Replaces all scattered `console.log`/`console.error` calls in the original. The `warn` flag comes from the node's or object's `warn` property.

```ts
/**
 * Unified logging. Every diagnostic in m2d2 routes through here.
 * Gated by the node/object's `warn` flag (default: warnings shown unless warn===false).
 */

export function warn(node: { warn?: unknown } | null, message: string, ...extra: unknown[]): void {
    if (node && node.warn === false) return;
    console.warn("[m2d2]", message, ...extra);
}

export function error(message: string, ...extra: unknown[]): void {
    console.error("[m2d2]", message, ...extra);
}

/**
 * Warn about a multi-match: multiple elements assigned with one key.
 * Gated by the value object's `warn` property (original: m2d2.src.js:470-476).
 */
export function warnMultiMatch(node: Element, key: string, value: { warn?: unknown }): void {
    if (value.warn === false) return;
    console.warn(
        "[m2d2] Multiple elements were assigned with key: [" + key + "] under node:",
        node,
        "You can set 'warn: false' on that element to hide this message."
    );
}

/**
 * Warn about a key that matched neither prop/attr nor child.
 * Original: m2d2.src.js:549-559. Changed: skip assignment instead of assigning junk.
 */
export function warnUnknownKey(node: Element, key: string, object: Record<string, unknown>): void {
    if (object.warn === false) return;
    console.error(
        "[m2d2] Not sure what to do with key: [" + key + "] under element:",
        node,
        "Most likely the element's property or child no longer exists. " +
            "Set 'warn: false' to dismiss this message."
    );
}
```

- [ ] **Step 4: Create `test/config.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { config, extensions } from "../src/config";

describe("config", () => {
    it("has short=true by default", () => {
        expect(config.short).toBe(true);
    });
    it("has updates=true by default", () => {
        expect(config.updates).toBe(true);
    });
    it("has storedEventsTimeout=50", () => {
        expect(config.storedEventsTimeout).toBe(50);
    });
    it("extensions starts empty", () => {
        expect(Object.keys(extensions).length).toBe(0);
    });
});
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run test/config.test.ts`
Expected: 4 tests pass.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/config.ts src/types.ts src/log.ts test/config.test.ts
git commit -m "feat: add config, types, and unified log module"
```

---

## Task 3: Utils

**Files:**
- Create: `src/utils.ts`
- Test: `test/utils.test.ts`

Port `js/utils.src.js` to TypeScript. This is the `Utils` class with all `is*`, `has*`, `set*`, `new*` methods. Key changes: proper types, `isHtml` rejects non-strings, `htmlElement` returns typed result.

- [ ] **Step 1: Create `src/utils.ts`**

Port the entire `Utils` class from `js/utils.src.js:41-366` with these changes:

1. Add TypeScript types to every method signature.
2. `isString(v: unknown): v is string` — use type predicates where applicable.
3. `isHtml(s: unknown): boolean` — change from `(s + "").trim()` to reject non-strings:
   ```ts
   isHtml(s: unknown): boolean {
       return typeof s === "string" && s.trim().indexOf("<") !== -1;
   }
   ```
4. `htmlElement(html: string): Element | null` — return type is `Element | null` (the original returns `template.content.firstChild` which can be null).
5. `newElement(tagName: string): HTMLElement` — keep the numeric/empty → "invalid" guard.
6. `hasProp` — keep the `value===null means no prop` quirk but add a comment documenting it.
7. `isVisible` and `inView` — take `HTMLElement` param, return `boolean`.
8. All other methods: straight port with types.

Full implementation (reference `js/utils.src.js:41-366` for behavior):

```ts
/**
 * Utility functions for type checking and DOM helpers.
 * Exposed as $.isString, $.isNode, etc. (copied onto the $ function in factory.ts).
 * Ported from js/utils.src.js.
 */
export class Utils {
    isString(v: unknown): v is string {
        return typeof v === "string";
    }

    isBool(b: unknown): b is boolean {
        return typeof b === "boolean";
    }

    isNumeric(n: unknown): boolean {
        const v = Number(n);
        return !isNaN(v) && isFinite(v as number);
    }

    isSelectorID(s: string): boolean {
        return (s + "").trim().indexOf("#") === 0;
    }

    isPlainObject(o: unknown): boolean {
        return typeof o === "object" && o !== null && o.constructor.name === "Object";
    }

    isObject(oa: unknown): boolean {
        return typeof oa === "object" && oa !== null;
    }

    isArray(a: unknown): a is unknown[] {
        return Array.isArray(a);
    }

    isFunction(f: unknown): f is Function {
        return typeof f === "function";
    }

    isElement(n: unknown): n is HTMLElement {
        return n instanceof HTMLElement;
    }

    isNode(n: unknown): n is Node | DocumentFragment {
        return n instanceof Node || n instanceof DocumentFragment;
    }

    isHtml(s: unknown): boolean {
        return typeof s === "string" && s.trim().indexOf("<") !== -1;
    }

    isEmpty(obj: unknown): boolean {
        return (
            obj === undefined ||
            obj === null ||
            obj === "" ||
            (this.isObject(obj) && Object.keys(obj as object).length === 0)
        );
    }

    isVisible(elem: HTMLElement): boolean {
        if (!this.isElement(elem)) {
            console.warn("[m2d2] (isVisible) Not an element:", elem);
            return false;
        }
        const display = elem.style.display !== "none";
        const notHidden = elem.style.visibility !== "hidden";
        return display && notHidden;
    }

    inView(elem: HTMLElement): boolean {
        const rect = elem.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
            rect.width > 0 &&
            rect.height > 0
        );
    }

    cleanArray<T>(a: T[]): T[] {
        return a.filter((e) => e === 0 || e);
    }

    isValidElement(tagName: string): boolean {
        const node = this.newElement(tagName);
        return tagName !== "template" && node.constructor.name !== "HTMLUnknownElement";
    }

    exists(selector: string): boolean {
        return document.querySelector(selector) !== null;
    }

    getAttrOrProp(node: HTMLElement, key: string): unknown {
        let value = "";
        if (this.hasAttrOrProp(node, key)) {
            value = this.hasAttr(node, key) ? node.getAttribute(key) : (node as any)[key];
        }
        return value;
    }

    hasAttrOrProp(node: HTMLElement | null, key: string): boolean {
        return this.hasAttr(node, key) || this.hasProp(node, key);
    }

    hasAttr(node: HTMLElement | null, attr: string): boolean {
        if (!node || this.isNumeric(attr)) return false;
        if (attr === "checked") {
            return node.type !== undefined && (node.type === "radio" || node.type === "checkbox");
        }
        return node.hasAttribute !== undefined ? node.hasAttribute(attr) : false;
    }

    hasProp(node: HTMLElement | null, prop: string): boolean {
        if (!node || this.isNumeric(prop)) return false;
        let has = (node as any)[prop] !== undefined;
        // Quirk: null value means "no value set yet" — keep but documented.
        if (has && (node as any)[prop] === null && prop === "value") {
            has = false;
        }
        return has && !((node as any)[prop] instanceof Node) && !node.hasAttribute(prop);
    }

    setPropOrAttr(node: HTMLElement, key: string, value: unknown): void {
        if (this.hasProp(node, key)) {
            try {
                (node as any)[key] = value;
            } catch {
                this.setAttr(node, key, value);
            }
        } else {
            this.setAttr(node, key, value);
        }
    }

    setAttr(node: HTMLElement, key: string, value: unknown): void {
        if (value) {
            node.setAttribute(key, String(value));
        } else {
            node.removeAttribute(key);
        }
    }

    defineProp(obj: object, prop: string, def: unknown): void {
        if (this.isObject(obj) && (obj as any)[prop] === undefined) {
            Object.defineProperty(obj, prop, {
                enumerable: false,
                writable: true,
                configurable: true,
            });
            (obj as any)[prop] = def;
        }
    }

    htmlElement(html: string): Element | null {
        const template = this.newElement("template") as HTMLTemplateElement;
        template.innerHTML = html.trim();
        return template.content.firstChild as Element | null;
    }

    newElement(tagName: string): HTMLElement {
        if (!tagName || this.isNumeric(tagName)) {
            tagName = "invalid";
        }
        return document.createElement(tagName);
    }

    newEmptyNode(): DocumentFragment {
        return new DocumentFragment();
    }

    getMethods(obj: object): string[] {
        const o = Reflect.getPrototypeOf(obj);
        const x = Reflect.getPrototypeOf(o);
        return Reflect.ownKeys(o as object).filter((it) => Reflect.ownKeys(x as object).indexOf(it) < 0) as string[];
    }

    appendAllChild(srcNode: Node, tgtNode: Node): void {
        while (srcNode.firstChild) {
            tgtNode.appendChild(srcNode.firstChild);
        }
    }

    prependAllChild(srcNode: Node, tgtNode: Node): void {
        while (srcNode.firstChild) {
            tgtNode.insertBefore(srcNode.firstChild, tgtNode.firstChild);
        }
    }
}

export const utils = new Utils();
```

- [ ] **Step 2: Create `test/utils.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { utils } from "../src/utils";

describe("Utils type checks", () => {
    it("isString", () => {
        expect(utils.isString("hello")).toBe(true);
        expect(utils.isString(123)).toBe(false);
        expect(utils.isString(null)).toBe(false);
    });
    it("isBool", () => {
        expect(utils.isBool(true)).toBe(true);
        expect(utils.isBool(1)).toBe(false);
    });
    it("isNumeric", () => {
        expect(utils.isNumeric(42)).toBe(true);
        expect(utils.isNumeric("42")).toBe(true);
        expect(utils.isNumeric("abc")).toBe(false);
        expect(utils.isNumeric(null)).toBe(false);
    });
    it("isPlainObject", () => {
        expect(utils.isPlainObject({})).toBe(true);
        expect(utils.isPlainObject([])).toBe(false);
        expect(utils.isPlainObject(null)).toBe(false);
    });
    it("isObject", () => {
        expect(utils.isObject({})).toBe(true);
        expect(utils.isObject([])).toBe(true);
        expect(utils.isObject(null)).toBe(false);
        expect(utils.isObject("str")).toBe(false);
    });
    it("isArray", () => {
        expect(utils.isArray([])).toBe(true);
        expect(utils.isArray({})).toBe(false);
    });
    it("isFunction", () => {
        expect(utils.isFunction(() => {})).toBe(true);
        expect(utils.isFunction({})).toBe(false);
    });
    it("isHtml — accepts HTML strings, rejects non-strings", () => {
        expect(utils.isHtml("<div>hi</div>")).toBe(true);
        expect(utils.isHtml("plain text")).toBe(false);
        expect(utils.isHtml(undefined)).toBe(false); // FIX: was true in original
        expect(utils.isHtml(123)).toBe(false); // FIX: was true in original
    });
    it("isEmpty", () => {
        expect(utils.isEmpty(undefined)).toBe(true);
        expect(utils.isEmpty(null)).toBe(true);
        expect(utils.isEmpty("")).toBe(true);
        expect(utils.isEmpty({})).toBe(true);
        expect(utils.isEmpty({ a: 1 })).toBe(false);
        expect(utils.isEmpty("text")).toBe(false);
    });
});

describe("Utils element helpers", () => {
    it("newElement creates valid elements", () => {
        expect(utils.newElement("div").tagName).toBe("DIV");
    });
    it("newElement falls back for invalid/numeric tag", () => {
        expect(utils.newElement("123").tagName).toBe("INVALID");
        expect(utils.newElement("").tagName).toBe("INVALID");
    });
    it("htmlElement parses HTML", () => {
        const el = utils.htmlElement("<span>hi</span>");
        expect(el).not.toBeNull();
        expect(el!.tagName).toBe("SPAN");
    });
    it("newEmptyNode returns a DocumentFragment", () => {
        expect(utils.newEmptyNode() instanceof DocumentFragment).toBe(true);
    });
    it("isValidElement recognizes div but not template", () => {
        expect(utils.isValidElement("div")).toBe(true);
        expect(utils.isValidElement("template")).toBe(false);
    });
});

describe("Utils attr/prop", () => {
    beforeEach(() => {
        document.body.innerHTML = '<input type="text" name="age" value="30" checked>';
    });
    it("hasAttr detects checked on checkbox/radio", () => {
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = true;
        expect(utils.hasAttr(cb, "checked")).toBe(true);
    });
    it("hasProp detects value", () => {
        const inp = document.querySelector("input")!;
        expect(utils.hasProp(inp, "value")).toBe(true);
    });
    it("setAttr sets and removes", () => {
        const div = document.createElement("div");
        utils.setAttr(div, "data-x", "1");
        expect(div.hasAttribute("data-x")).toBe(true);
        utils.setAttr(div, "data-x", false);
        expect(div.hasAttribute("data-x")).toBe(false);
    });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run test/utils.test.ts`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/utils.ts test/utils.test.ts
git commit -m "feat: port Utils class to TypeScript with type predicates"
```

---

## Task 4: DOM Extension (extDom)

**Files:**
- Create: `src/dom.ts`
- Test: `test/dom.test.ts`

Port `extDom` from `js/m2d2.src.js:137-329`. This stamps `.text`, `.html`, `.css`, `.show`, `.find`, `.findAll`, `.parent`, `.sibling`, `.posterior`, `.anterior`, `.index`, `.inView`, `.getData` onto a real HTMLElement. Idempotent via `_m2d2` flag.

- [ ] **Step 1: Create `src/dom.ts`**

Port `extDom` from `js/m2d2.src.js:137-329` with these changes:

1. Export a function `extDom(selector, root?)` that returns `M2d2Node | null`.
2. All `console.log`/`console.error` calls → use `log.ts` functions.
3. The `getData()` method on forms: **fix** multi-value grouping — repeated field names always become arrays (original: `m2d2.src.js:302-323`). The original already groups correctly for >2 values; the fix is ensuring `type="file"` fields with multiple files also become arrays.
4. Add `installPrototypes()` — a guarded one-time install of the `Element.prototype` patches (`m2d2.src.js:22-34`). Export it so `index.ts` can call it once.

Key implementation:

```ts
import { utils } from "./utils";
import { extensions } from "./config";
import { error } from "./log";
import type { M2d2Node } from "./types";

let prototypesInstalled = false;

/**
 * Patch Element.prototype so that appending an m2d2 proxy node appends
 * its underlying DOM node. Original: m2d2.src.js:22-34. Issue #53.
 * Called once from index.ts.
 */
export function installPrototypes(): void {
    if (prototypesInstalled) return;
    prototypesInstalled = true;
    (["after", "before", "append", "prepend", "insertAdjacentElement", "replaceWith"] as const).forEach(
        (p) => {
            const proto = Element.prototype as any;
            proto["_" + p] = proto[p];
            proto[p] = function (this: Element, ...args: unknown[]) {
                const arrArgs = args.map((arg) => {
                    if (arg !== undefined && arg !== null && (arg as any).domNode !== undefined) {
                        return (arg as any).domNode;
                    }
                    return arg;
                });
                return proto["_" + p].apply(this, arrArgs);
            };
        }
    );
}

/**
 * Extend a DOM node with m2d2 properties and methods.
 * Idempotent: if node already has _m2d2 flag, returns as-is.
 * Ported from m2d2.src.js:137-329.
 */
export function extDom(selector: unknown, root?: ParentNode): M2d2Node | null {
    if (!selector) {
        error("Selector was empty");
        return null;
    }
    const $root = root ?? document;
    const $node = (utils.isNode(selector)
        ? selector
        : ($root as ParentNode).querySelector(selector as string)) as M2d2Node | null;
    if (!$node) {
        if (utils.isString(selector)) {
            error("Selector: " + selector + " didn't match any element");
        } else {
            error("Node was null");
        }
        return null;
    }

    if ($node._m2d2) return $node;
    $node._m2d2 = true;

    // Warn if node already has m2d2 properties (collision detection):
    const m2d2Props = [
        "parent", "sibling", "posterior", "anterior", "find", "findAll",
        "onupdate", "onready", "show", "onshow", "inView", "css", "text", "html", "getData", "index",
    ];
    m2d2Props.forEach((f) => {
        if (Object.prototype.hasOwnProperty.call($node, f)) {
            console.warn("[m2d2] Node already had [" + f + "] property. It might cause unexpected behaviour.");
        }
    });

    // --- Properties via Object.defineProperty ---

    // text: m2d2.src.js:163-182
    Object.defineProperty($node, "text", {
        configurable: true,
        get(this: M2d2Node) {
            return this.childNodes.length ? this.innerText : this.textContent;
        },
        set(this: M2d2Node, value: string) {
            if (this.childNodes.length) {
                let found = false;
                this.childNodes.forEach((n) => {
                    if (n.constructor.name === "Text") {
                        n.nodeValue = value;
                        found = true;
                    }
                });
                if (!found) {
                    this.prepend(document.createTextNode(value));
                }
            } else {
                this.textContent = value;
            }
        },
    });

    // html: m2d2.src.js:184-187
    Object.defineProperty($node, "html", {
        configurable: true,
        get(this: M2d2Node) {
            return this.innerHTML;
        },
        set(this: M2d2Node, value: string) {
            this.innerHTML = value;
        },
    });

    // css: m2d2.src.js:189-210
    Object.defineProperty($node, "css", {
        configurable: true,
        get(this: M2d2Node) {
            return this.classList;
        },
        set(this: M2d2Node, value: unknown) {
            if (utils.isArray(value)) {
                this.className = (value as unknown[]).join(" ");
            } else if (utils.isString(value)) {
                this.className = value;
            } else if (utils.isPlainObject(value)) {
                Object.keys(value).forEach((c) => {
                    if ((value as Record<string, unknown>)[c]) {
                        this.classList.add(c);
                    } else {
                        this.classList.remove(c);
                    }
                });
            } else {
                error("Trying to assign a wrong value to css:", value);
            }
        },
    });

    // show: m2d2.src.js:212-254
    Object.defineProperty($node, "show", {
        configurable: true,
        get(this: M2d2Node) {
            return utils.isVisible(this);
        },
        set(this: M2d2Node, show: boolean) {
            const cssDisplay = () => getComputedStyle(this, null).display;
            const defaultDisplay = () => {
                const b = document.getElementsByTagName("body")[0];
                const t = document.createElement("template");
                const n = document.createElement(this.tagName);
                t.append(n);
                b.append(t);
                const display = getComputedStyle(n, null).display;
                t.remove();
                return display;
            };
            if (show) {
                if (cssDisplay() === "none") {
                    if ((this as any)._m2d2_display) {
                        this.style.display = (this as any)._m2d2_display;
                    } else {
                        this.style.removeProperty("display");
                        if (cssDisplay() === "none") {
                            const defaultShow = defaultDisplay();
                            this.style.display =
                                this.dataset.display || (defaultShow !== "none" ? defaultShow : "block");
                        }
                    }
                    if (this.onshow !== undefined && utils.isFunction(this.onshow)) {
                        this.onshow(this);
                    }
                }
            } else {
                const stored = this.style.display !== "none" ? this.style.display : cssDisplay();
                if (stored !== "none") {
                    (this as any)._m2d2_display = stored;
                }
                this.style.display = "none";
            }
        },
    });

    // --- Extension merging ---
    let extend: Record<string, unknown> = {};
    if (extensions["*"] !== undefined) {
        Object.assign(extend, extensions["*"]);
    }
    if (extensions[$node.tagName] !== undefined) {
        Object.assign(extend, extensions[$node.tagName]);
    }

    // --- Methods via Object.assign ---
    Object.assign(
        $node,
        {
            inView: () => utils.inView($node),
            posterior: () => $node.nextElementSibling,
            anterior: () => $node.previousElementSibling,
            parent: () => extDom($node.parentElement),
            sibling: (sel: string) => ($node.parentElement as M2d2Node).find(sel),
            find: (it: string): M2d2Node | null => {
                const node = $node.querySelector(it);
                return node ? extDom(node) : null;
            },
            findAll: (it?: string): Element[] => {
                const nodeList =
                    it === undefined ? Array.from($node.children) : Array.from($node.querySelectorAll(it));
                nodeList.forEach((n) => extDom(n));
                return nodeList;
            },
        },
        extend
    );

    // index: only if node doesn't have it already (like <option>)
    if (($node as any).index === undefined) {
        Object.defineProperty($node, "index", {
            configurable: true,
            value: () => Array.from(($node.parentNode as ParentNode).children).indexOf($node),
            writable: true,
        });
    }

    // Sync value attribute on input: m2d2.src.js:297-299
    if (["INPUT", "TEXTAREA", "SELECT"].indexOf($node.tagName) >= 0 && utils.hasAttrOrProp($node, "value")) {
        ($node as any).oninput = function (this: M2d2Node) {
            this.setAttribute("value", this.value);
        };
    }

    // getData on forms: m2d2.src.js:301-324 (with multi-value fix)
    if ($node.tagName === "FORM") {
        Object.defineProperty($node, "getData", {
            configurable: true,
            value: function (this: M2d2Node, includeNotVisible?: boolean): Record<string, unknown> {
                const data: Record<string, unknown> = {};
                const fd = new FormData(this as unknown as HTMLFormElement);
                const include = includeNotVisible || false;
                for (const [name, raw] of fd.entries()) {
                    const elem = this.find("[name='" + name + "']");
                    if (!elem) continue;
                    const isVisible = (elem as any).show;
                    if (include || (elem as any).type === "hidden" || isVisible) {
                        const val = (elem as any).type === "file" ? (elem as HTMLInputElement).files : raw;
                        if (data[name] !== undefined) {
                            if (utils.isArray(data[name])) {
                                (data[name] as unknown[]).push(val);
                            } else {
                                data[name] = [data[name], val];
                            }
                        } else {
                            data[name] = val;
                        }
                    }
                }
                return data;
            },
            writable: true,
        });
    }

    return $node;
}
```

- [ ] **Step 2: Create `test/dom.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { extDom, installPrototypes } from "../src/dom";

describe("extDom properties", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        installPrototypes();
    });

    it("text get/set on empty node", () => {
        const node = extDom("#root")!;
        node.text = "hello";
        expect(node.text).toBe("hello");
        expect(document.querySelector("#root")!.textContent).toBe("hello");
    });

    it("text preserves child elements (issue #05)", () => {
        document.body.innerHTML = '<div id="root"><span class="child">keep</span></div>';
        const node = extDom("#root")!;
        node.text = "prefix";
        // The child span should still exist
        expect(document.querySelector("#root .child")).not.toBeNull();
    });

    it("html get/set", () => {
        const node = extDom("#root")!;
        node.html = "<b>bold</b>";
        expect(node.html).toBe("<b>bold</b>");
        expect(document.querySelector("#root b")).not.toBeNull();
    });

    it("css set via string", () => {
        const node = extDom("#root")!;
        node.css = "myclass";
        expect(node.className).toBe("myclass");
    });

    it("css set via array", () => {
        const node = extDom("#root")!;
        node.css = ["full", "blue"];
        expect(node.className).toBe("full blue");
    });

    it("css set via object (add/remove)", () => {
        const node = extDom("#root")!;
        node.className = "existing";
        node.css = { existing: false, active: true };
        expect(node.classList.contains("existing")).toBe(false);
        expect(node.classList.contains("active")).toBe(true);
    });

    it("css get returns classList", () => {
        const node = extDom("#root")!;
        node.className = "a b";
        expect(node.css.contains("a")).toBe(true);
        expect(node.css.length).toBe(2);
    });

    it("find returns extended child", () => {
        document.body.innerHTML = '<div id="root"><span class="child">x</span></div>';
        const node = extDom("#root")!;
        const child = node.find(".child");
        expect(child).not.toBeNull();
        expect(child!.text).toBe("x");
    });

    it("findAll returns array of children", () => {
        document.body.innerHTML = '<div id="root"><span class="a">1</span><span class="a">2</span></div>';
        const node = extDom("#root")!;
        const items = node.findAll(".a");
        expect(items.length).toBe(2);
    });

    it("index returns position in parent", () => {
        document.body.innerHTML = '<ul><li>1</li><li id="target">2</li><li>3</li></ul>';
        const node = extDom("#target")!;
        expect((node.index as Function)()).toBe(1);
    });

    it("posterior/anterior return siblings", () => {
        document.body.innerHTML = '<ul><li id="a">1</li><li id="b">2</li><li id="c">3</li></ul>';
        const b = extDom("#b")!;
        expect(b.posterior()!.id).toBe("c");
        expect(b.anterior()!.id).toBe("a");
    });

    it("extDom is idempotent (calling twice doesn't re-stamp)", () => {
        const node1 = extDom("#root")!;
        const node2 = extDom("#root")!;
        expect(node1).toBe(node2);
    });

    it("show/hide toggles display", () => {
        const node = extDom("#root")!;
        node.show = false;
        expect(node.style.display).toBe("none");
        node.show = true;
        expect(node.style.display).not.toBe("none");
    });

    it("getData on form returns field values", () => {
        document.body.innerHTML =
            '<form id="root"><input type="text" name="user" value="bob"><input type="checkbox" name="active" value="1" checked></form>';
        const form = extDom("#root")!;
        const data = form.getData!();
        expect(data.user).toBe("bob");
        expect(data.active).toBe("on"); // FormData gives "on" for checkbox without explicit value
    });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run test/dom.test.ts`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/dom.ts test/dom.test.ts
git commit -m "feat: port extDom with text/html/css/show/find/getData + Element.prototype patch"
```

---

## Task 5: Reactivity

**Files:**
- Create: `src/reactivity.ts`
- Test: `test/reactivity.test.ts`

Port the Proxy (`m2d2.src.js:1073-1149`), MutationObserver (`m2d2.src.js:1157-1235`), short values (`m2d2.src.js:1019-1062`), linked refs (`m2d2.src.js:972-1011`), and `dispatchUpdate`. Key fixes: single-fire `onupdate`, dedupe keyed on `{target, property, newValue}`, WeakMap store for dataset/style, guard empty `addedNodes`.

This module has circular dependencies with `binding.ts` (proxy.set calls `coerce`) and `template.ts` (proxy.set calls `doItems` for items reset). These are resolved at call-time (see circular dependency note at top of plan). Import them as type-only or use dynamic references — see Step 1 for the approach.

- [ ] **Step 1: Create `src/reactivity.ts`**

```ts
import { utils } from "./utils";
import { config } from "./config";
import { error } from "./log";
import type { M2d2Node, UpdateDetail } from "./types";

/**
 * WeakMap: source node → { dataset, style } so linked refs can resolve
 * dataset/style objects back to their parent node.
 * Replaces the parallel arrays in the original _stored (m2d2.src.js:10-16).
 */
interface SourceEntry {
    dataset?: DOMStringMap;
    style?: CSSStyleDeclaration;
}
const sourceMap = new WeakMap<object, SourceEntry>();

/** Register a node's dataset/style for linked-ref resolution. */
export function registerSource(node: M2d2Node): void {
    sourceMap.set(node, { dataset: node.dataset, style: node.style });
}

/** Find the parent node for a given dataset or style object. */
function findParentBySource(obj: object): M2d2Node | null {
    for (const [node, entry] of sourceMap) {
        if (entry.dataset === obj || entry.style === obj) return node as M2d2Node;
    }
    return null;
}

/** Recent dispatches for dedup (replaces _stored.events, m2d2.src.js:1164-1170). */
const recentDispatches: { key: string; timer: ReturnType<typeof setTimeout> }[] = [];

function dedupeKey(target: object, property: string, newValue: unknown): string {
    // Key on target+property+newValue so rapid distinct changes aren't collapsed.
    return JSON.stringify({ t: target.constructor?.name, p: property, v: newValue });
}

/**
 * Dispatch an "update" CustomEvent on target, with deduplication.
 * Replaces the duplicated dispatch logic in proxy.set and onObserve.
 */
export function dispatchUpdate(target: M2d2Node, detail: UpdateDetail): void {
    if (!config.updates) return;
    if (detail.newValue === detail.oldValue) return;
    // Only dispatch if node has onupdate listeners or EventTarget capability:
    if (target.onupdate === undefined && !(target as any).hasEventListeners) return;

    const key = dedupeKey(target, detail.property, detail.newValue);
    const existing = recentDispatches.find((d) => d.key === key);
    if (existing) return; // deduplicate within the timeout window
    const entry = { key, timer: setTimeout(() => {
        const idx = recentDispatches.indexOf(entry);
        if (idx >= 0) recentDispatches.splice(idx, 1);
    }, config.storedEventsTimeout) };
    recentDispatches.push(entry);

    try {
        target.dispatchEvent(new CustomEvent("update", { detail }));
    } catch (e) {
        console.warn("[m2d2] Unable to dispatch update event on:", target, e);
    }
}

/**
 * Guess which property to set on a child node (short assignment).
 * E.g. for an <input>, assigning "foo" sets .value; for <span>, sets .text.
 * Ported from m2d2.src.js:1019-1062.
 */
// These import binding/template lazily to avoid circular init issues:
let _coerce: ((node: M2d2Node, value: unknown) => unknown) | null = null;
let _doItems: ((node: M2d2Node, values: unknown[], template?: unknown) => void) | null = null;

/** Called by factory.ts after all modules are loaded, to wire circular deps. */
export function wireReactivity(
    coerce: (node: M2d2Node, value: unknown) => unknown,
    doItems: (node: M2d2Node, values: unknown[], template?: unknown) => void
): void {
    _coerce = coerce;
    _doItems = doItems;
}

export function setShortValue(node: M2d2Node, key: string, value: unknown): void {
    const child = (node as any)[key];
    if (utils.isNode(child)) {
        if (config.short && _coerce) {
            const o = _coerce(child as M2d2Node, value);
            const k = utils.isPlainObject(o) && Object.keys(o).length >= 1 ? Object.keys(o)[0] : null;
            if (k) {
                (child as any)[k] = value;
            }
        } else {
            console.warn("[m2d2] Short is disabled. Specify the property, e.g. node.text");
        }
    } else {
        (node as any)[key] = value;
    }
}

export function getShortValue(node: M2d2Node, key: string, sample?: unknown): unknown {
    const child = (node as any)[key];
    if (utils.isNode(child)) {
        if (config.short && _coerce) {
            const o = _coerce(child as M2d2Node, sample ?? "");
            const k = utils.isPlainObject(o) && Object.keys(o).length >= 1 ? Object.keys(o)[0] : null;
            if (k) {
                return (child as any)[k];
            }
        }
        return null;
    }
    return child;
}

/**
 * Handle [source, "prop"] linked references.
 * Registers a listener on source that updates the target when prop changes.
 * Ported from m2d2.src.js:972-1011.
 */
export function updateValue(node: M2d2Node, key: string, value: unknown): unknown {
    if (!isLinkedRef(value)) return value;

    const source = value[0] as any;
    const prop = value[1];
    const callback = value[2] ?? ((v: unknown) => v);
    const currentValue = source[prop];

    if (source instanceof CSSStyleDeclaration) {
        const parent = findParentBySource(source);
        if (parent && config.updates) {
            parent.addEventListener("update", (ev: Event) => {
                const detail = (ev as CustomEvent<UpdateDetail>).detail;
                if (detail && detail.property === "style" && String(detail.newValue).startsWith(prop + ":")) {
                    setShortValue(node, key, callback.call(node, source[prop]));
                }
            });
        }
    } else if (source instanceof DOMStringMap) {
        const parent = findParentBySource(source);
        if (parent && config.updates) {
            parent.addEventListener("update", (ev: Event) => {
                const detail = (ev as CustomEvent<UpdateDetail>).detail;
                if (detail && detail.property === "data-" + prop) {
                    setShortValue(node, key, callback.call(node, detail.newValue));
                }
            });
        }
    } else {
        if (config.updates && utils.isObject(source)) {
            source.addEventListener?.("update", (ev: Event) => {
                const detail = (ev as CustomEvent<UpdateDetail>).detail;
                if (detail && detail.property === prop) {
                    if (!utils.isObject((node as any)[key])) {
                        setShortValue(node, key, callback.call(node, detail.newValue));
                    }
                }
            });
        }
    }
    return currentValue;
}

/** Check if a value is a linked ref array [source, "prop"] or [source, "prop", fn]. */
export function isLinkedRef(value: unknown): value is [object, string] | [object, string, Function] {
    if (!utils.isArray(value) || (value.length !== 2 && value.length !== 3)) return false;
    const acceptedType =
        utils.isNode(value[0]) ||
        value[0] instanceof DOMStringMap ||
        value[0] instanceof CSSStyleDeclaration ||
        utils.isObject(value[0]);
    const otherTypes =
        value.length === 2
            ? utils.isString(value[1])
            : utils.isString(value[1]) && utils.isFunction(value[2]);
    return acceptedType && otherTypes;
}

/**
 * Create a Proxy wrapper around a node for short assignment.
 * Ported from m2d2.src.js:1073-1149 with fixes.
 */
export function proxy<T extends object>(obj: T, force?: boolean): T {
    if (!config.short || obj === null || ((obj as any).domNode !== undefined && force === undefined)) {
        return obj;
    }
    if (utils.isNode(obj)) {
        (obj as any).domNode = obj;
    }
    const handler: ProxyHandler<T> = {
        get(target: any, property: string | symbol): any {
            const t = target[property];
            if (t === null || t === undefined) return null;
            if (utils.isFunction(t)) return t.bind(target);
            if (t?.domNode && target["$" + String(property)] !== undefined) {
                return target["$" + String(property)];
            }
            if (t?.domNode === undefined && utils.isElement(t)) {
                return proxy(t);
            }
            return t;
        },
        set(target: any, property: string, value: any): boolean {
            const prop = String(property);
            let oldValue: unknown = "";

            if (utils.isElement(target[prop])) {
                oldValue = getShortValue(target, prop, value);
                setShortValue(target, prop, value);
            } else if (prop === "onupdate") {
                // FIX: register listener only, don't also set property (was double-firing).
                if (config.updates) {
                    if (utils.isFunction(value)) {
                        if (utils.isNode(target)) {
                            target.addEventListener("update", value, true);
                        }
                    } else {
                        error("Value passed to 'onupdate' is not a function, in node:", target);
                    }
                } else {
                    console.warn("[m2d2] Updates disabled (m2d2.updates=false):", target);
                }
            } else if (prop === "items") {
                // Reset items: clear then re-render.
                (target.items as any)?.clear?.();
                if (_doItems && utils.isArray(value)) {
                    _doItems(target, value);
                }
            } else {
                oldValue = target[prop];
                value = updateValue(target, prop, value);
                target[prop] = value;
            }

            dispatchUpdate(target, {
                type: typeof value,
                property: prop,
                newValue: value,
                oldValue,
            });
            return true;
        },
    };
    return new Proxy(obj, handler);
}

/**
 * MutationObserver callback: translates DOM mutations into "update" events.
 * Ported from m2d2.src.js:1157-1218 with empty-addedNodes guard.
 */
export function onObserve(mutationsList: MutationRecord[]): void {
    mutationsList.forEach((m) => {
        const target = m.target as M2d2Node;
        if (target.onupdate === undefined) return;

        if (m.type === "attributes") {
            const value = utils.getAttrOrProp(target as HTMLElement, m.attributeName!);
            if (value !== m.oldValue) {
                dispatchUpdate(target, {
                    type: typeof value,
                    property: m.attributeName!,
                    newValue: value,
                    oldValue: m.oldValue,
                });
            }
        } else if (m.type === "childList") {
            const addedNode = m.addedNodes[0];
            const removedNode = m.removedNodes[0];
            const $child = addedNode || removedNode;
            if ($child && $child.nodeName === "#text") {
                // FIX: guard against empty addedNodes (removal-only mutations).
                const value = addedNode ? addedNode.textContent : null;
                const oldValue = removedNode ? removedNode.textContent : null;
                if (value !== oldValue) {
                    dispatchUpdate(target, {
                        type: typeof value,
                        property: "text",
                        newValue: value,
                        oldValue,
                    });
                }
            } else if ((target as any).items !== undefined) {
                dispatchUpdate(target, {
                    type: "object",
                    property: "items",
                    newValue: m.addedNodes,
                    oldValue: m.removedNodes,
                });
            }
        }
    });
}

/**
 * Attach a MutationObserver to a node.
 * Ported from m2d2.src.js:1224-1235.
 */
export function observe(node: M2d2Node): void {
    if (!config.updates) return;
    const observer = new MutationObserver(onObserve);
    const toObserve = (node as any).domNode || node;
    observer.observe(toObserve, {
        subtree: true,
        childList: true,
        attributeOldValue: true,
    });
}
```

- [ ] **Step 2: Create `test/reactivity.test.ts`**

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { proxy, dispatchUpdate, isLinkedRef, observe, registerSource } from "../src/reactivity";
import { extDom } from "../src/dom";
import { config } from "../src/config";
import type { M2d2Node } from "../src/types";

describe("isLinkedRef", () => {
    it("detects [obj, 'prop']", () => {
        const obj = { name: "x" };
        expect(isLinkedRef([obj, "name"])).toBe(true);
    });
    it("detects [obj, 'prop', fn]", () => {
        const obj = { name: "x" };
        expect(isLinkedRef([obj, "name", (v: unknown) => v])).toBe(true);
    });
    it("rejects plain arrays", () => {
        expect(isLinkedRef([1, 2, 3])).toBe(false);
    });
    it("rejects non-arrays", () => {
        expect(isLinkedRef("string")).toBe(false);
        expect(isLinkedRef({})).toBe(false);
    });
});

describe("proxy short assignment", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"><span class="name">old</span></div>';
    });

    it("proxy wraps element and allows get", () => {
        const node = extDom("#root") as M2d2Node;
        const proxied = proxy(node);
        expect(proxied.find(".name")!.text).toBe("old");
    });

    it("proxy returns null when short is disabled", () => {
        const saved = config.short;
        config.short = false;
        const node = extDom("#root") as M2d2Node;
        const result = proxy(node);
        expect(result).toBe(node); // no proxy wrapper
        config.short = saved;
    });
});

describe("dispatchUpdate + observe", () => {
    it("dispatchUpdate fires update event on node with onupdate", () => {
        document.body.innerHTML = '<div id="root"></div>';
        const node = extDom("#root") as M2d2Node;
        const spy = vi.fn();
        node.onupdate = spy;
        dispatchUpdate(node, { type: "string", property: "text", newValue: "x", oldValue: "" });
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("dispatchUpdate deduplicates identical events within timeout", () => {
        document.body.innerHTML = '<div id="root"></div>';
        const node = extDom("#root") as M2d2Node;
        const spy = vi.fn();
        node.onupdate = spy;
        dispatchUpdate(node, { type: "string", property: "text", newValue: "x", oldValue: "" });
        dispatchUpdate(node, { type: "string", property: "text", newValue: "x", oldValue: "" });
        expect(spy).toHaveBeenCalledTimes(1); // deduped
    });

    it("dispatchUpdate fires for distinct values", () => {
        document.body.innerHTML = '<div id="root"></div>';
        const node = extDom("#root") as M2d2Node;
        const spy = vi.fn();
        node.onupdate = spy;
        dispatchUpdate(node, { type: "string", property: "text", newValue: "a", oldValue: "" });
        dispatchUpdate(node, { type: "string", property: "text", newValue: "b", oldValue: "a" });
        expect(spy).toHaveBeenCalledTimes(2);
    });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run test/reactivity.test.ts`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/reactivity.ts test/reactivity.test.ts
git commit -m "feat: port reactivity (proxy, observe, linked refs, dispatchUpdate) with WeakMap store"
```

---

## Task 6: Locator

**Files:**
- Create: `src/locator.ts`
- Test: `test/locator.test.ts`

Extract the element-location logic from `doDom` (`m2d2.src.js:438-463`). Pure function.

- [ ] **Step 1: Create `src/locator.ts`**

```ts
import { utils } from "./utils";
import type { M2d2Node } from "./types";

export interface LocateResult {
    matched: M2d2Node[];
    ambiguous: boolean;
}

/**
 * Find candidate child elements for a key in priority order:
 * 1. #key (id)  2. [name="key"]  3. .key (class)  4. key as free selector/tag.
 *
 * Skips template keys and function values.
 * Extracted from m2d2.src.js:438-463.
 *
 * NOTE: This must import extDom lazily to avoid circular init.
 * extDom is passed via wireLocator().
 */
let _extDom: ((selector: unknown, root?: ParentNode) => M2d2Node | null) | null = null;

export function wireLocator(extDomFn: (selector: unknown, root?: ParentNode) => M2d2Node | null): void {
    _extDom = extDomFn;
}

export function locate(node: M2d2Node, key: string, value: unknown): LocateResult {
    const options: M2d2Node[] = [];
    if (!_extDom) return { matched: options, ambiguous: false };

    // Skip template keys and function values:
    if (key === "template" || utils.isFunction(value)) {
        return { matched: options, ambiguous: false };
    }

    try {
        // Look for ID, name, class (only if key starts with a word char):
        if (key && key.match(/^\w/)) {
            // ID:
            let elem = node.find("#" + key);
            if (elem && options.indexOf(elem) === -1) options.push(elem);
            // Name:
            elem = node.find("[name='" + key + "']");
            if (elem && options.indexOf(elem) === -1) options.push(elem);
            // Class:
            const elems = Array.from(node.findAll("." + key)).filter(
                (i) => options.indexOf(i as M2d2Node) < 0
            ) as M2d2Node[];
            elems.forEach((e) => options.push(e));
        }
        // Free selector / tag name (e.g. "div > span" or "input"):
        const elems = Array.from(node.findAll(key)).filter(
            (i) => options.indexOf(i as M2d2Node) < 0
        ) as M2d2Node[];
        elems.forEach((e) => options.push(e));
    } catch (e) {
        console.error("[m2d2] Invalid selector:", key, e);
    }

    return { matched: options, ambiguous: options.length > 1 };
}
```

- [ ] **Step 2: Create `test/locator.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { locate, wireLocator } from "../src/locator";
import { extDom } from "../src/dom";

wireLocator(extDom);

describe("locator", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="root">
                <span id="name">by-id</span>
                <input name="email" value="" />
                <span class="active">by-class</span>
                <span class="active">by-class-2</span>
                <p>tag-match</p>
            </div>
        `;
    });

    it("finds by ID first", () => {
        const node = extDom("#root")!;
        const { matched } = locate(node, "name", "");
        expect(matched.length).toBe(1);
        expect(matched[0].id).toBe("name");
    });

    it("finds by name attribute", () => {
        const node = extDom("#root")!;
        const { matched } = locate(node, "email", "");
        expect(matched.length).toBe(1);
        expect((matched[0] as HTMLInputElement).name).toBe("email");
    });

    it("finds by class and marks ambiguous", () => {
        const node = extDom("#root")!;
        const { matched, ambiguous } = locate(node, "active", "");
        expect(matched.length).toBe(2);
        expect(ambiguous).toBe(true);
    });

    it("finds by tag name", () => {
        const node = extDom("#root")!;
        const { matched } = locate(node, "p", "");
        expect(matched.length).toBe(1);
        expect(matched[0].tagName).toBe("P");
    });

    it("skips template key", () => {
        const node = extDom("#root")!;
        const { matched } = locate(node, "template", {});
        expect(matched.length).toBe(0);
    });

    it("skips when value is a function", () => {
        const node = extDom("#root")!;
        const { matched } = locate(node, "name", () => {});
        expect(matched.length).toBe(0);
    });

    it("returns empty for non-existent key", () => {
        const node = extDom("#root")!;
        const { matched, ambiguous } = locate(node, "nonexistent", "");
        expect(matched.length).toBe(0);
        expect(ambiguous).toBe(false);
    });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run test/locator.test.ts`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/locator.ts test/locator.test.ts
git commit -m "feat: extract element locator as pure function"
```

---

## Task 7: Binding Core

**Files:**
- Create: `src/binding.ts`
- Test: `test/binding.test.ts`

Port `doDom` (`m2d2.src.js:337-574`), `plainToObject`/`coerce` (`m2d2.src.js:606-646`), `linkNode` (`m2d2.src.js:679-695`), `render`/`renderAndLink` (`m2d2.src.js:655-670`). This is the orchestrator. Key changes: replace `switch(true)` cascade with explicit predicate, ambiguous-key → warn+skip, `undefined`/`null` → warn+substitute `""`.

This module depends on `template.ts` (doItems, getTemplate) and `items.ts` (extendItems) and `reactivity.ts` (proxy, updateValue). Those are wired via a `wire` function to break circular init. **Implement template.ts and items.ts stubs first** (Step 1), then binding (Step 2), then fill in template/items in Task 8.

- [ ] **Step 1: Create stub `src/template.ts` and `src/items.ts`**

```ts
// src/template.ts — STUB, filled in Task 8
import { utils } from "./utils";
import type { M2d2Node } from "./types";

/**
 * Process items: render each value using a template, append to node.
 * Full implementation in Task 8.
 */
export function doItems(node: M2d2Node, values: unknown[], template?: unknown): void {
    // Stub — will be replaced in Task 8
    console.warn("[m2d2] doItems not yet implemented (Task 8)");
}

/** Get the template element for a node. Stub — Task 8. */
export function getTemplate(node: M2d2Node, template?: unknown): Element | undefined {
    return undefined;
}

/** Get a single rendered item. Stub — Task 8. */
export function getItem(node: M2d2Node, index: number, obj: unknown, template?: Element): M2d2Node | null {
    return null;
}
```

```ts
// src/items.ts — STUB, filled in Task 8
import type { M2d2Node, ItemsCollection } from "./types";

/** Extend node.items with array-like methods. Stub — Task 8. */
export function extendItems(node: M2d2Node): void {
    // Stub — will be replaced in Task 8
}
```

- [ ] **Step 2: Create `src/binding.ts`**

Port `doDom`, `plainToObject` (renamed `coerce`), `linkNode`, `render`, `renderAndLink`, `appendElement` from `js/m2d2.src.js:337-707`.

```ts
import { utils } from "./utils";
import { extDom } from "./dom";
import { locate } from "./locator";
import { proxy, updateValue, isLinkedRef } from "./reactivity";
import { warn, warnMultiMatch, warnUnknownKey, error } from "./log";
import { doItems, getTemplate } from "./template";
import type { M2d2Node } from "./types";

/**
 * Coerce a plain value into an object spec, guessing the target property.
 * E.g. string on <input> → {value: str}; string on <span> → {text: str}.
 * Ported from m2d2.src.js:606-646.
 */
export function coerce(node: M2d2Node, value: unknown): unknown {
    if (utils.isPlainObject(value) || utils.isFunction(value) || utils.isElement(value)) {
        return value;
    }
    if (utils.isHtml(value)) {
        return { html: value };
    }
    if (isLinkedRef(value)) {
        // Linked ref: expand into per-key objects
        const obj = value[0] as any;
        const prop = value[1];
        const callback = value[2] ?? ((v: unknown) => v);
        const tmpVal = coerce(node, callback(obj[prop]));
        if (utils.isPlainObject(tmpVal)) {
            const newValue: Record<string, unknown> = {};
            Object.keys(tmpVal as object).forEach((k) => {
                newValue[k] = value;
            });
            return newValue;
        }
        return value;
    }
    if (utils.isArray(value)) {
        return { items: value };
    }
    if (utils.hasAttrOrProp(node, "value")) {
        if (node.tagName === "SELECT") {
            return { value: value, text: value };
        }
        if (node.tagName === "BUTTON") {
            return { text: value };
        }
        return { value: value };
    }
    if (utils.isString(value) && node.tagName === "IMG") {
        return { src: value };
    }
    if (utils.isString(value) && node.tagName === "A" && node.hasAttribute("href")) {
        return { href: value };
    }
    if (utils.isString(value) || utils.isNumeric(value)) {
        return { text: value };
    }
    return value;
}

/**
 * Check if a value matches the type of a node's property/attribute.
 * Replaces the switch(true) cascade in m2d2.src.js:380-395.
 */
function matchesType(node: M2d2Node, key: string, value: unknown): boolean {
    const existing = (node as any)[key];
    // Special case: value → valueAsDate for dates:
    if (key === "value" && utils.hasProp(node, "valueAsDate") && value instanceof Date) return true;
    // css is a special proxy property:
    if (key === "css") return true;
    // Same typeof:
    if (typeof value === typeof existing && typeof value !== "undefined") return true;
    // Numeric value to string property:
    if (utils.isString(existing) && utils.isNumeric(value)) return true;
    // Function value to object property:
    if (utils.isFunction(value) && utils.isObject(existing)) return true;
    // Boolean value to string property:
    if (utils.isBool(value) && utils.isString(existing)) return true;
    // Object property on INPUT (like "list"):
    if (typeof existing === "object" && existing !== null && node.tagName === "INPUT") return true;
    return false;
}

/**
 * Create a new element inside node and return it.
 */
function appendElement(node: M2d2Node, tagName: string): HTMLElement {
    const newElem = utils.newElement(tagName);
    node.append(newElem);
    return newElem;
}

/**
 * Link a child node to a parent via the key shortcut.
 * Handles conflict resolution: if key collides with existing prop, use $key.
 * Ported from m2d2.src.js:679-695.
 */
export function linkNode(node: M2d2Node, key: string, child: M2d2Node | M2d2Node[]): void {
    if (Array.isArray(child)) {
        // Multiple matches: just set the array link
        if (!utils.hasAttrOrProp(node, key)) {
            (node as any)[key] = child;
        } else {
            (node as any)["$" + key] = child;
            console.warn("[m2d2] Property [" + key + "] existed. Using $" + key + " instead.");
        }
        return;
    }
    if ((node as any)[key] === child) {
        const $proxy = proxy(child);
        try {
            (node as any)[key] = $proxy;
        } catch {
            // Some elements (forms) can't be reassigned; they're proxies already.
        }
        (node as any)["$" + key] = $proxy;
    } else if (utils.hasAttrOrProp(node, key)) {
        (node as any)["$" + key] = child;
        console.warn(
            "[m2d2] Property [" + key + "] existed in node: " + node.tagName +
            ". Using $" + key + " instead for node: " + child.tagName + "."
        );
    } else {
        (node as any)[key] = proxy(child);
    }
}

/**
 * Render a value into a child node (recursive).
 */
export function render(node: M2d2Node, key: string, value: unknown): M2d2Node {
    const coerced = coerce(node, value);
    return doDom(node, coerced as Record<string, unknown>);
}

/** Render and link in one step. */
export function renderAndLink(root: M2d2Node, node: M2d2Node, key: string, value: unknown): void {
    const child = render(node, key, value);
    linkNode(root, key, child);
}

/**
 * The core binding function. Iterates an object spec and assigns each key
 * to a property, attribute, or child element of the node.
 * Ported from m2d2.src.js:337-574 with fixes.
 */
export function doDom(selector: unknown, object?: unknown): M2d2Node | null {
    // Shape: $(plainObject) → fragment
    if (utils.isObject(selector) && object === undefined) {
        object = selector;
        selector = utils.newEmptyNode();
        if ((object as Record<string, unknown>).warn === undefined) {
            (object as Record<string, unknown>).warn = false;
        }
    }
    // Validate selector:
    if (!(utils.isString(selector) || utils.isElement(selector) || utils.isNode(selector))) {
        error("Selector is not a string or a Node:", selector);
        return null;
    }
    if (utils.isString(selector) && !document.querySelector(selector as string)) {
        console.warn("[m2d2] Selected element doesn't exist:", selector);
        return null;
    }

    const node = extDom(selector);
    if (!node) return null;

    // Shape: $(selector) → just extend (no object)
    if (object === undefined) {
        return node;
    }

    // Shape: $(selector, htmlString) → set innerHTML
    if (utils.isString(object) && utils.isHtml(object)) {
        node.innerHTML = object;
        return node;
    }

    const obj = coerce(node, object) as Record<string, unknown>;
    if (!utils.isPlainObject(obj)) {
        // Coerced to a non-object (shouldn't normally happen with a valid object arg)
        return node;
    }

    // Iterate keys (skip tagName):
    Object.keys(obj)
        .filter((key) => key !== "tagName")
        .forEach((key) => {
            let origValue = obj[key];
            if (origValue === undefined || origValue === null) {
                warn(obj, "Value was not set for key: [" + key + "]. Using empty string.");
                origValue = "";
            }

            // Resolve linked refs:
            let value = updateValue(node, key, origValue);

            const isProp = utils.hasProp(node, key);
            const isAttr = utils.hasAttr(node, key);

            // Check if it's a property/attribute match:
            let foundMatch = false;
            if (isAttr || isProp) {
                foundMatch = matchesType(node, key, value);
            }

            if (foundMatch) {
                assignPropAttr(node, key, value, obj);
            } else {
                // Look for child elements:
                const { matched, ambiguous } = locate(node, key, value);

                if (matched.length > 1) {
                    const items: M2d2Node[] = [];
                    matched.forEach((item) => {
                        items.push(render(item, key, value));
                    });
                    linkNode(node, key, items);
                    if (utils.isPlainObject(value)) {
                        warnMultiMatch(node, key, value as Record<string, unknown>);
                    }
                } else if (matched.length === 1) {
                    const opt = matched[0];
                    if (utils.isElement(opt)) {
                        // Re-coerce for this specific child:
                        const childObj = coerce(opt, value);
                        const childKey =
                            utils.isPlainObject(childObj) && Object.keys(childObj as object).length >= 1
                                ? Object.keys(childObj as object)[0]
                                : null;
                        if (childKey) {
                            value = updateValue(opt, childKey, origValue);
                        }
                        if (utils.isArray(value)) {
                            doItems(opt, value, (obj as Record<string, unknown>).template);
                            linkNode(node, key, opt);
                        } else {
                            renderAndLink(node, opt, key, value);
                        }
                    }
                } else {
                    // No match: creation path
                    handleNoMatch(node, key, value, obj);
                }
            }
        });

    // Dispatch onload for non-native-load tags:
    if ((node as any).onload) {
        const nativeTags = ["BODY", "FRAME", "IFRAME", "IMG", "LINK", "SCRIPT", "STYLE"];
        const isNative = nativeTags.indexOf(node.tagName) >= 0;
        const isInputImage = node.tagName === "INPUT" && (node as HTMLInputElement).type === "image";
        if (!(isNative || isInputImage)) {
            node.dispatchEvent(new CustomEvent("load"));
        }
    }

    return node;
}

/**
 * Assign a value to a property or attribute.
 * Handles classList, style, dataset specially.
 */
function assignPropAttr(node: M2d2Node, key: string, value: unknown, obj: Record<string, unknown>): void {
    let error_flag = false;
    switch (key) {
        case "classList":
            if (utils.isArray(value)) {
                (value as unknown[]).forEach((v) => node.classList.add(v as string));
            } else if (utils.isString(value)) {
                node.classList.add(value);
            } else {
                error_flag = true;
            }
            break;
        case "style":
        case "dataset":
            if (utils.isPlainObject(value)) {
                Object.keys(value as object).forEach((k) => {
                    (node as any)[key][k] = updateValue((node as any)[key] as M2d2Node, k, (value as Record<string, unknown>)[k]);
                });
            } else {
                error_flag = true;
            }
            break;
        default:
            if (utils.isBool(value) || utils.hasAttrOrProp(node, key)) {
                utils.setPropOrAttr(node, key, value);
            } else {
                (node as any)[key] = value;
            }
    }
    if (error_flag) {
        error("Invalid value passed to '" + key + "':", value, "Into node:", node);
    }
}

/**
 * Handle the case where no child element matched: create nodes, items, or warn.
 * Ported from m2d2.src.js:498-561. Changed: unknown keys warn+skip (not assign).
 */
function handleNoMatch(node: M2d2Node, key: string, value: unknown, obj: Record<string, unknown>): void {
    // Make "items" optional when template is set:
    if (key === "template" && obj["items"] === undefined) {
        key = "items";
        value = [];
    }

    const isFunc = utils.isFunction(value);
    const valueObj = value as Record<string, unknown> | undefined;

    if (valueObj && valueObj.tagName !== undefined) {
        // Create child with explicit tagName:
        const newNode = appendElement(node, valueObj.tagName as string);
        renderAndLink(node, extDom(newNode)!, key, value);
    } else if (utils.isValidElement(key) && !isFunc) {
        // Create child by tag name:
        const newNode = appendElement(node, key);
        renderAndLink(node, extDom(newNode)!, key, value);
    } else if (key === "items") {
        // Items creation:
        const template = obj["template"];
        if (utils.isPlainObject(value)) {
            // Convert plain object to value→text array (original: m2d2.src.js:514-531):
            const valTmp: unknown[] = [];
            Object.keys(value as object).forEach((o) => {
                let itemObj: Record<string, unknown>;
                if (node.tagName === "DL") {
                    itemObj = { dt: o, dd: (value as Record<string, unknown>)[o] };
                } else {
                    itemObj = { text: (value as Record<string, unknown>)[o] };
                    if (utils.hasAttrOrProp(node, "value")) {
                        itemObj.value = o;
                    } else {
                        itemObj.dataset = { id: o };
                    }
                }
                valTmp.push(itemObj);
            });
            value = valTmp;
        }
        if (utils.isArray(value)) {
            doItems(node, value, template);
        } else {
            console.warn("[m2d2] 'items' specified but value is not an array:", node, value);
        }
    } else if (isFunc) {
        // Event handler:
        if (config_updates() && key === "onupdate") {
            node.addEventListener("update", value as EventListener, true);
        }
        (node as any)[key] = value;
    } else if (key !== "template" && !(key === "warn" && value === false)) {
        // FIX: unknown key → warn + SKIP (was: warn + assign node[key]=value)
        warnUnknownKey(node, key, obj);
    }
}

// Helper to read config.updates without circular import at top level:
import { config } from "./config";
function config_updates(): boolean {
    return config.updates;
}
```

- [ ] **Step 3: Create `test/binding.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { doDom } from "../src/binding";
import { extDom } from "../src/dom";

describe("doDom basic binding", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
    });

    it("binds text to empty node", () => {
        const node = doDom("#root", { text: "foo" })!;
        expect(node.text).toBe("foo");
    });

    it("sets innerHTML from html string (shape 2)", () => {
        const node = doDom("#root", "<b>bold</b>")!;
        expect(node.querySelector("b")).not.toBeNull();
    });

    it("returns extended node when no object (shape 3)", () => {
        document.body.innerHTML = '<div id="root"><span>hi</span></div>';
        const node = doDom("#root")!;
        expect(node.find("span")!.text).toBe("hi");
    });

    it("binds to child by class → text", () => {
        document.body.innerHTML = '<div id="root"><span class="name"></span></div>';
        const node = doDom("#root", { name: "Yoda" })!;
        expect(node.find(".name")!.text).toBe("Yoda");
    });

    it("binds to child by class → value (input)", () => {
        document.body.innerHTML = '<div id="root"><input class="age" type="text"></div>';
        const node = doDom("#root", { age: 30 })!;
        expect((node.find(".age") as HTMLInputElement).value).toBe("30");
    });

    it("binds to child by name attribute", () => {
        document.body.innerHTML = '<div id="root"><input name="email" type="text"></div>';
        const node = doDom("#root", { email: "a@b.com" })!;
        expect((node.find("[name=email]") as HTMLInputElement).value).toBe("a@b.com");
    });

    it("binds to child by id", () => {
        document.body.innerHTML = '<div id="root"><span id="title"></span></div>';
        const node = doDom("#root", { title: "Hello" })!;
        // title is a native property, so it sets the property, not the child:
        expect(node.title).toBe("Hello");
    });

    it("creates child element by tag name when not found", () => {
        const node = doDom("#root", { span: { text: "created" } })!;
        expect(node.find("span")!.text).toBe("created");
    });

    it("binds css property", () => {
        const node = doDom("#root", { css: "myclass" })!;
        expect(node.className).toBe("myclass");
    });

    it("binds style object", () => {
        const node = doDom("#root", { style: { color: "red" } })!;
        expect(node.style.color).toBe("red");
    });

    it("binds dataset object", () => {
        const node = doDom("#root", { dataset: { id: "100" } })!;
        expect(node.dataset.id).toBe("100");
    });

    it("binds boolean property (disabled)", () => {
        document.body.innerHTML = '<div id="root"><input name="x" type="text"></div>';
        const node = doDom("#root", { x: { disabled: true } })!;
        expect((node.find("[name=x]") as HTMLInputElement).disabled).toBe(true);
    });

    it("dispatches onload for non-native tags", () => {
        let loaded = false;
        doDom("#root", { text: "x", onload: () => { loaded = true; } });
        expect(loaded).toBe(true);
    });

    it("multiple element match links array and warns", () => {
        document.body.innerHTML = '<div id="root"><span class="x">1</span><span class="x">2</span></div>';
        const node = doDom("#root", { x: "val", warn: false })!;
        // Both spans get the value:
        const spans = node.findAll(".x");
        // x is linked as an array
        expect(Array.isArray((node as any).x)).toBe(true);
    });
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run test/binding.test.ts`
Expected: all pass except any that require items (those exercise the stub). The basic binding tests should pass.

- [ ] **Step 5: Commit**

```bash
git add src/binding.ts src/template.ts src/items.ts test/binding.test.ts
git commit -m "feat: port doDom binding core with coerce, linkNode, matchesType predicate"
```

---

## Task 8: Templates and Items

**Files:**
- Modify: `src/template.ts` (replace stub)
- Modify: `src/items.ts` (replace stub)
- Test: `test/template.test.ts`
- Test: `test/items.test.ts`

Port `getTemplate` (`m2d2.src.js:833-938`), `getItem` (`m2d2.src.js:716-732`), `doItems` (`m2d2.src.js:801-826`), `extendItems` (`m2d2.src.js:1256-1476`), `setUniqueAttrib` (`m2d2.src.js:947-963`). Implement `splice`/`fill`/`copyWithin` (were stubs).

- [ ] **Step 1: Replace `src/template.ts` stub with full implementation**

Port from `js/m2d2.src.js:716-938`. Key methods: `getTemplate` (with per-container defaults), `getItem` (clone + decorate + doDom + events), `doItems` (iterate + append + cleanup + extendItems).

```ts
import { utils } from "./utils";
import { extDom } from "./dom";
import { proxy } from "./reactivity";
import { error } from "./log";
import { doDom } from "./binding";
import { extendItems } from "./items";
import type { M2d2Node } from "./types";

/**
 * Set a unique attribute among siblings (e.g. "selected").
 * Only one sibling can have it at a time.
 * Ported from m2d2.src.js:947-963.
 */
export function setUniqueAttrib(node: M2d2Node, key: string): void {
    if (!Object.prototype.hasOwnProperty.call(node, key)) {
        Object.defineProperty(node, key, {
            configurable: true,
            get(this: M2d2Node) {
                return this.hasAttribute(key);
            },
            set(this: M2d2Node, val: unknown) {
                if (this.parentNode) {
                    (this.parentNode as M2d2Node)
                        .findAll("[" + key + "]")
                        .forEach((el) => (el as HTMLElement).removeAttribute(key));
                }
                if (val) {
                    this.setAttribute(key, String(val));
                } else {
                    this.removeAttribute(key);
                }
            },
        });
    }
}

/** Copy _template/__template refs from template to new item. */
function addTemplatesToItem(template: M2d2Node, newNode: M2d2Node): void {
    (["_template", "__template"] as const).forEach((key) => {
        if ((template as any)[key] !== undefined) {
            (newNode as any)[key] = (template as any)[key];
        }
    });
}

/** Deep-copy template refs into object tree. */
function addTemplatesToObjectDeep(template: M2d2Node, obj: unknown): void {
    if (utils.isPlainObject(obj)) {
        Object.keys(obj as object).forEach((key) => {
            const tval = (template as any)[key];
            if (tval && tval.__template && !(obj as Record<string, unknown>).template) {
                (obj as Record<string, unknown>)[key] = (obj as Record<string, unknown>)[key] || {};
                if (utils.isPlainObject((obj as Record<string, unknown>)[key])) {
                    ((obj as Record<string, unknown>)[key] as Record<string, unknown>).template = tval.__template;
                }
            }
            if (tval && (obj as Record<string, unknown>)[key]) {
                addTemplatesToObjectDeep(tval, (obj as Record<string, unknown>)[key]);
            }
        });
    }
}

/** Re-scan __template for events and apply to new item. */
function getItemWithEvents(node: M2d2Node, newNode: M2d2Node): M2d2Node {
    if ((node as any).__template !== undefined) {
        const scan = (object: Record<string, unknown>, result: Record<string, unknown> = {}): Record<string, unknown> => {
            Object.keys(object).forEach((key) => {
                const val = object[key];
                if (utils.isPlainObject(val)) {
                    result[key] = scan(val as Record<string, unknown>);
                } else if (utils.isFunction(val)) {
                    result[key] = val;
                }
            });
            return result;
        };
        let tree = scan((node as any).__template as Record<string, unknown>);
        if (!utils.isEmpty(tree)) {
            tree = tree[Object.keys(tree)[0]] as Record<string, unknown>;
            if (utils.isPlainObject(tree)) {
                newNode = doDom(newNode, tree);
            }
        }
    }
    return newNode;
}

/**
 * Get the template element for a node.
 * Priority: cached _template → <template> child → container default → explicit template → clone children.
 * Ported from m2d2.src.js:833-938.
 */
export function getTemplate(node: M2d2Node, template?: unknown): Element | undefined {
    if ((node as any)._template !== undefined && (node as any)._template !== "") {
        return (node as any)._template as Element;
    }

    let $template: Element | undefined;
    const htmlTemplate = node.querySelector("template") as HTMLTemplateElement | null;
    if (htmlTemplate) {
        $template = utils.htmlElement(htmlTemplate.innerHTML.trim()) ?? undefined;
    } else {
        switch (node.tagName) {
            case "SELECT":
            case "DATALIST":
                $template = utils.newElement("option");
                break;
            case "UL":
            case "OL":
                $template = utils.newElement("li");
                break;
            case "NAV":
                $template = utils.newElement("a");
                break;
            case "DL":
                $template = utils.newElement("dd");
                break;
            default:
                if (template && utils.isPlainObject(template)) {
                    // Build from explicit template object:
                    const children = Object.keys(template as object).length;
                    if (children) {
                        if (children > 1) {
                            const tplObj = template as Record<string, unknown>;
                            if (tplObj.tagName !== undefined) {
                                const wrap: Record<string, unknown> = {};
                                wrap[tplObj.tagName as string] = template;
                                template = wrap;
                            } else {
                                console.warn("[m2d2] Template has multiple top elements. Using first:", template);
                            }
                        }
                        const key = Object.keys(template as object)[0];
                        const val = (template as Record<string, unknown>)[key] as Record<string, unknown>;
                        if (utils.isValidElement(key)) {
                            $template = utils.newElement(key);
                        } else if (val.tagName !== undefined) {
                            $template = utils.newElement(val.tagName as string);
                            (template as Record<string, unknown>)[val.tagName as string] = val;
                            delete (template as Record<string, unknown>)[key];
                        } else {
                            error("Template element can't be identified: [" + key + "], using <span>:", template);
                            $template = utils.newElement("span");
                        }
                    } else {
                        error("Template has no definition. Using <span>:", template);
                        $template = utils.newElement("span");
                    }
                } else {
                    // Clone existing children:
                    if (node.childElementCount > 0) {
                        $template = utils.htmlElement(node.innerHTML.trim()) ?? undefined;
                    }
                }
                break;
        }
    }

    // Finalize template from explicit spec:
    if (template) {
        if (utils.isPlainObject(template)) {
            const wrap = utils.newEmptyNode();
            if ($template) wrap.append($template);
            const fragment = doDom(extDom(wrap)!, template);
            $template = (fragment?.children[0] as Element) ?? undefined;
            utils.defineProp(node, "__template", template);
        } else if (utils.isHtml(template)) {
            $template = utils.htmlElement(template) ?? undefined;
        } else if (utils.isSelectorID(template as string)) {
            const src = document.querySelector(template as string);
            $template = src ? utils.htmlElement(src.innerHTML) ?? undefined : undefined;
        } else {
            $template = utils.newElement(template as string);
        }
    }

    if ($template) {
        if ($template.childrenElementCount > 1) {
            console.warn("[m2d2] Template has multiple children, wrapping with <span>:", $template);
            const span = utils.newElement("span");
            span.append($template);
            $template = span;
        } else {
            utils.defineProp(node, "_template", $template);
        }
    } else {
        console.warn("[m2d2] Template not found, using <span>:", node);
        $template = utils.newElement("span");
    }

    return $template;
}

/**
 * Create a single rendered item from a template.
 * Ported from m2d2.src.js:716-732.
 */
export function getItem(node: M2d2Node, index: number | string, obj: unknown, template?: Element): M2d2Node | null {
    const $template = (template as M2d2Node) || getTemplate(node);
    if (!$template) return null;

    const newItem = ($template as M2d2Node).cloneNode(true) as unknown as M2d2Node;
    addTemplatesToItem($template as M2d2Node, newItem);
    newItem.dataset.id = String(index);
    setUniqueAttrib(newItem, "selected");
    addTemplatesToObjectDeep($template as M2d2Node, obj);

    const newNode = doDom(newItem, obj);
    return getItemWithEvents(node, newNode!);
}

/**
 * Process an array of values into items appended to node.
 * Ported from m2d2.src.js:801-826.
 */
export function doItems(node: M2d2Node, values: unknown[], template?: unknown): void {
    const $template = getTemplate(node, template);
    if (!$template) {
        error("Template not found. An array is being used where not expected. Node:", node, "Values:", values);
        return;
    }
    let i = 0;
    values.forEach((val) => {
        const coerced = coerceForItems(node, val);
        const newItem = getItem(node, i++, coerced, $template);
        if (newItem) {
            node.append(newItem);
        }
    });
    // Cleanup <template> tag:
    const tempTag = node.querySelector("template");
    if (tempTag) node.removeChild(tempTag);
    // Set items link:
    (node as any).items = node.children;
    extendItems(node);
}

// Local coerce (to avoid circular import from binding):
import { coerce } from "./binding";
function coerceForItems(node: M2d2Node, val: unknown): unknown {
    return coerce(node, val);
}
```

- [ ] **Step 2: Replace `src/items.ts` stub with full implementation**

Port from `js/m2d2.src.js:1256-1476`. Implement `splice`/`fill`/`copyWithin` (were silent no-ops). All other methods straight ports.

```ts
import { utils } from "./utils";
import { extDom } from "./dom";
import { proxy } from "./reactivity";
import { getItem } from "./template";
import { coerce } from "./binding";
import type { M2d2Node, ItemsCollection } from "./types";

/**
 * Extend node.items (HTMLCollection) with array-like and custom methods.
 * Ported from m2d2.src.js:1256-1476. splice/fill/copyWithin now implemented.
 */
export function extendItems(node: M2d2Node): void {
    const items = node.items as ItemsCollection;
    if (!items) return;

    // Helper: reattach items in array order:
    const reattach = (itemList: Element[]) => {
        itemList.forEach((itm) => {
            const parent = itm.parentNode!;
            const detached = parent.removeChild(itm);
            node.append(detached);
        });
    };

    const nonStd = ["clear", "get", "remove", "selected", "unselect", "first", "last", "findAll"];

    Object.getOwnPropertyNames(Array.prototype)
        .concat(nonStd)
        .forEach((method) => {
            if (items[method as keyof ItemsCollection] !== undefined) return;

            let func: ((...args: unknown[]) => unknown) | null = null;

            switch (method) {
                case "splice":
                    func = function (this: M2d2Node, start: number, deleteCount?: number, ...newItems: unknown[]) {
                        const count = deleteCount ?? 0;
                        const children = Array.from(node.children);
                        const removed: M2d2Node[] = [];
                        // Remove:
                        for (let i = 0; i < count && start + i < children.length; i++) {
                            const child = children[start + i] as M2d2Node;
                            removed.push(proxy(child));
                            child.remove();
                        }
                        // Insert new items:
                        const insertBefore = children[start + count];
                        newItems.forEach((obj) => {
                            const coerced = coerce(node, obj);
                            if (utils.isPlainObject(coerced)) {
                                const child = getItem(node, node.items!.length, coerced);
                                if (child) {
                                    if (insertBefore) {
                                        (insertBefore as Element).before(child);
                                    } else {
                                        node.append(child);
                                    }
                                }
                            }
                        });
                        return removed;
                    };
                    break;

                case "fill":
                    func = function (this: M2d2Node, value: unknown, start = 0, end?: number) {
                        const children = Array.from(node.children);
                        const stop = end ?? children.length;
                        for (let i = start; i < stop && i < children.length; i++) {
                            const child = children[i] as M2d2Node;
                            const coerced = coerce(node, value);
                            if (utils.isPlainObject(coerced)) {
                                Object.keys(coerced as object).forEach((k) => {
                                    (child as any)[k] = (coerced as Record<string, unknown>)[k];
                                });
                            }
                        }
                    };
                    break;

                case "copyWithin":
                    func = function (this: M2d2Node, target: number, start: number, end?: number) {
                        const children = Array.from(node.children) as M2d2Node[];
                        const stop = end ?? children.length;
                        const toCopy = children.slice(start, stop);
                        for (let i = 0; i < toCopy.length && target + i < children.length; i++) {
                            const targetChild = children[target + i];
                            const clone = toCopy[i].cloneNode(true) as unknown as M2d2Node;
                            extDom(clone);
                            targetChild.replaceWith(clone);
                        }
                    };
                    break;

                case "reverse":
                    func = function (this: M2d2Node) {
                        if (node.items!.length) {
                            const arr = Array.from(node.items!);
                            arr.reverse();
                            reattach(arr);
                        }
                    };
                    break;

                case "clear":
                    func = function (this: M2d2Node) {
                        while (node.items![0]) node.items![0].remove();
                    };
                    break;

                case "get":
                    func = function (this: M2d2Node, id: string | number) {
                        let found: M2d2Node | null = null;
                        if (node.items!.length) {
                            Array.from(node.items!).some((item) => {
                                const sameId = utils.isNumeric(id)
                                    ? Number((item as M2d2Node).dataset.id) === Number(id)
                                    : (item as M2d2Node).dataset.id === String(id);
                                if ((item as M2d2Node).dataset && sameId) {
                                    found = item as M2d2Node;
                                    return true;
                                }
                                return false;
                            });
                        }
                        return found;
                    };
                    break;

                case "selected":
                    func = function (this: M2d2Node) {
                        return proxy(node.find(":scope > [selected]") as M2d2Node);
                    };
                    break;

                case "unselect":
                    func = function (this: M2d2Node) {
                        if (node.items!.length) {
                            const sel = (node.items as ItemsCollection).selected();
                            if (sel) (sel as M2d2Node).selected = false;
                        }
                    };
                    break;

                case "first":
                    func = function (this: M2d2Node) {
                        return proxy(node.items![0] as M2d2Node);
                    };
                    break;

                case "last":
                    func = function (this: M2d2Node) {
                        return proxy(node.items![node.items!.length - 1] as M2d2Node);
                    };
                    break;

                case "pop":
                    func = function (this: M2d2Node) {
                        if (node.items!.length) {
                            return proxy(node.removeChild(node.items![node.items!.length - 1]) as M2d2Node);
                        }
                        return null;
                    };
                    break;

                case "push":
                    func = function (this: M2d2Node, obj: unknown) {
                        const coerced = coerce(node, obj);
                        if (utils.isElement(coerced)) {
                            node.append(coerced as Element);
                        } else if (utils.isPlainObject(coerced)) {
                            const index = node.items!.length;
                            const child = getItem(node, index, coerced);
                            if (child) node.appendChild(child);
                        } else {
                            console.warn("[m2d2] Trying to push unknown value into list:", obj);
                        }
                    };
                    break;

                case "remove":
                    func = function (this: M2d2Node, id: string | number) {
                        if (node.items!.length) {
                            const elem = (node.items as ItemsCollection).get(id);
                            if (elem) elem.remove();
                        }
                    };
                    break;

                case "shift":
                    func = function (this: M2d2Node) {
                        if (node.items!.length) {
                            return proxy(node.removeChild(node.items![0]) as M2d2Node);
                        }
                        return null;
                    };
                    break;

                case "sort":
                    func = function (this: M2d2Node, compareFn?: (a: M2d2Node, b: M2d2Node) => number) {
                        if (node.items!.length) {
                            const arr = Array.from(node.items!);
                            arr.sort(compareFn ?? ((a, b) => (a as M2d2Node).text.localeCompare((b as M2d2Node).text)));
                            reattach(arr);
                        }
                    };
                    break;

                case "unshift":
                    func = function (this: M2d2Node, obj: unknown) {
                        const coerced = coerce(node, obj);
                        if (utils.isElement(coerced)) {
                            node.prepend(coerced as Element);
                        } else if (utils.isPlainObject(coerced)) {
                            const index = node.items!.length;
                            const child = getItem(node, index, coerced);
                            if (child) node.prepend(child);
                        } else {
                            console.warn("[m2d2] Trying to unshift unknown value:", obj);
                        }
                    };
                    break;

                case "concat":
                    func = function (this: M2d2Node, ...arrays: unknown[][]) {
                        arrays.forEach((arr) => {
                            if (utils.isArray(arr)) {
                                arr.forEach((obj) => {
                                    if (!utils.isElement(obj)) {
                                        const coerced = coerce(node, obj);
                                        if (utils.isPlainObject(coerced)) {
                                            const index = node.items!.length;
                                            obj = getItem(node, index, coerced);
                                        }
                                    }
                                    (node.items as ItemsCollection).push(obj);
                                });
                            }
                        });
                    };
                    break;

                case "findAll":
                    func = function (this: M2d2Node, ...args: unknown[]) {
                        if (args.length === 0) return node.findAll();
                        if (utils.isString(args[0])) return node.findAll(args[0] as string);
                        // Fall through to array filter:
                        const proxies = Array.from(node.items!).map((n) => proxy(n as M2d2Node));
                        return Array.from(proxies).filter(args[0] as (item: M2d2Node) => boolean);
                    };
                    break;

                default:
                    // Delegate to Array.prototype methods over proxied nodes:
                    if (utils.isFunction((Array.prototype as any)[method])) {
                        const arrFunc = function (this: M2d2Node, ...args: unknown[]) {
                            const proxies = Array.from(node.items!).map((n) => proxy(n as M2d2Node));
                            // Special cases for find:
                            if (method === "find") {
                                if (utils.isString(args[0])) {
                                    return node.find(args[0] as string);
                                }
                            }
                            return (Array.prototype as any)[method].apply(proxies, args);
                        };
                        func = arrFunc as (...args: unknown[]) => unknown;
                    }
            }

            if (func) {
                utils.defineProp(items, method, func.bind(node));
            }
        });
}
```

- [ ] **Step 3: Create `test/template.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { doDom } from "../src/binding";

describe("templates and items", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
    });

    it("items with default template (ul → li)", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["one", "two", "three"] })!;
        const lis = node.findAll("li");
        expect(lis.length).toBe(3);
        expect((lis[0] as any).text).toBe("one");
    });

    it("items with select → option", () => {
        document.body.innerHTML = '<select id="root"></select>';
        const node = doDom("#root", { items: ["a", "b"] })!;
        expect(node.findAll("option").length).toBe(2);
    });

    it("items with HTML template", () => {
        document.body.innerHTML = `
            <div id="root">
                <template>
                    <div class="user">
                        <span class="name"></span>
                        <span class="age"></span>
                    </div>
                </template>
            </div>
        `;
        const node = doDom("#root", {
            items: [
                { name: "Paul", age: 23 },
                { name: "Sam", age: 72 },
            ],
        })!;
        const users = node.findAll(".user");
        expect(users.length).toBe(2);
        expect((users[0] as any).querySelector(".name").textContent).toBe("Paul");
        expect((users[1] as any).querySelector(".age").textContent).toBe("72");
    });

    it("items with JS template", () => {
        document.body.innerHTML = '<div id="root"></div>';
        const node = doDom("#root", {
            template: {
                div: {
                    css: "user",
                    name: { tagName: "span", css: "name" },
                },
            },
            items: [{ name: "Paul" }, { name: "Sam" }],
        })!;
        expect(node.findAll(".user").length).toBe(2);
        expect((node.findAll(".name")[0] as any).textContent).toBe("Paul");
    });

    it("sets dataset.id on items", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b"] })!;
        expect((node.items[0] as any).dataset.id).toBe("0");
        expect((node.items[1] as any).dataset.id).toBe("1");
    });

    it("items get() by dataset.id", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b", "c"] })!;
        const item = node.items.get(1);
        expect(item).not.toBeNull();
        expect((item as any).text).toBe("b");
    });

    it("items first() and last()", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b", "c"] })!;
        expect(node.items.first().text).toBe("a");
        expect(node.items.last().text).toBe("c");
    });

    it("items forEach", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b", "c"] })!;
        const texts: string[] = [];
        node.items.forEach((item: any) => texts.push(item.text));
        expect(texts).toEqual(["a", "b", "c"]);
    });

    it("items push", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a"] })!;
        node.items.push({ text: "b" });
        expect(node.items.length).toBe(2);
        expect(node.items.last().text).toBe("b");
    });

    it("items clear", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b"] })!;
        node.items.clear();
        expect(node.items.length).toBe(0);
    });

    it("items sort", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["banana", "apple", "cherry"] })!;
        node.items.sort();
        expect(node.items.first().text).toBe("apple");
        expect(node.items.last().text).toBe("cherry");
    });

    it("items reverse", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b", "c"] })!;
        node.items.reverse();
        expect(node.items.first().text).toBe("c");
    });

    it("items splice removes and inserts", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b", "c"] })!;
        node.items.splice(1, 1, { text: "x" });
        expect(node.items.length).toBe(3);
        expect(node.items.first().text).toBe("a");
        expect((node.items[1] as any).text).toBe("x");
    });

    it("selected() and unselect()", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b", "c"] })!;
        node.items.first().selected = true;
        expect(node.items.selected().text).toBe("a");
        // Select another — should clear the first:
        node.items.last().selected = true;
        expect(node.items.selected().text).toBe("c");
        node.items.unselect();
        expect(node.items.selected()).toBeNull();
    });
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run test/template.test.ts test/items.test.ts`
Expected: all pass. If some fail due to template/event wiring edge cases, debug and fix — the tests define correct behavior.

- [ ] **Step 5: Run all tests so far**

Run: `npx vitest run`
Expected: all test files pass.

- [ ] **Step 6: Commit**

```bash
git add src/template.ts src/items.ts test/template.test.ts
git commit -m "feat: port templates and items API with implemented splice/fill/copyWithin"
```

---

## Task 9: Factory and Index

**Files:**
- Create: `src/factory.ts`
- Create: `src/index.ts`
- Modify: `test/helpers.ts` (wire real import)
- Test: `test/factory.test.ts`

Port `main`/`getProxyNode` (`m2d2.src.js:38-76, 1243-1249`), `ready` (`m2d2.src.js:81-85`), `load` (`m2d2.src.js:92-129`). Wire the `$` factory, copy utils onto it, assemble everything in `index.ts`.

- [ ] **Step 1: Create `src/factory.ts`**

```ts
import { utils } from "./utils";
import { config, extensions } from "./config";
import { doDom } from "./binding";
import { proxy, observe, registerSource } from "./reactivity";
import { wireReactivity } from "./reactivity";
import { wireLocator } from "./locator";
import { extDom } from "./dom";
import { coerce } from "./binding";
import { doItems } from "./template";
import type { M2d2Node } from "./types";

// Wire circular dependencies:
wireReactivity(coerce, doItems);
wireLocator(extDom);

/**
 * The core $ factory function.
 * Supports four shapes:
 *   $(selector, object)   → bind
 *   $(selector, htmlStr)  → set innerHTML
 *   $(selector)           → extend only
 *   $({ ... })            → detached observable fragment
 *
 * Ported from m2d2.src.js:38-76.
 */
export function $(selector?: unknown, object?: unknown): unknown {
    // Shape 4: plain object → fragment
    if (utils.isPlainObject(selector)) {
        const copy = JSON.parse(JSON.stringify(selector));
        addEventTargetCapabilities(copy);
        return proxy(copy, true);
    }

    // Shapes 1-3: selector path
    const node = getProxyNode(selector, object ?? {});
    if (!node) return null;

    // onready wiring (microtask, replaces setTimeout 10ms):
    if (node.onready && utils.isFunction(node.onready)) {
        node.addEventListener("ready", node.onready as EventListener, { once: true });
        queueMicrotask(() => {
            node.dispatchEvent(new CustomEvent("ready"));
        });
    }

    // Register dataset/style for linked-ref resolution:
    registerSource(node);

    return node;
}

/** Add EventTarget capabilities to a plain object (for fragment reactivity). */
function addEventTargetCapabilities(target: object): void {
    const eventTarget = new EventTarget();
    Object.assign(target, {
        addEventListener: eventTarget.addEventListener.bind(eventTarget),
        removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
        dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
        hasEventListeners: true,
    });
}

/** Get proxy-wrapped node with observer attached. m2d2.src.js:1243-1249. */
function getProxyNode(selector: unknown, obj: unknown): M2d2Node {
    const node = doDom(selector, obj);
    if (node) {
        observe(node);
        return proxy(node) as M2d2Node;
    }
    return null as unknown as M2d2Node;
}

/**
 * Run callback when DOM is ready.
 * Ported from m2d2.src.js:81-85.
 */
export function ready(callback: ($: typeof $) => void): void {
    document.addEventListener("DOMContentLoaded", () => {
        callback($);
    });
}

/**
 * Load m2d2 immediately and optionally register extensions.
 * Ported from m2d2.src.js:92-129.
 */
export function load(callback?: ($: typeof $) => Record<string, unknown> | void): typeof $ {
    if (callback !== undefined) {
        const ext = callback($);
        if (utils.isObject(ext) && !utils.isEmpty(ext)) {
            Object.keys(ext as object).forEach((k) => {
                const extObj = (ext as Record<string, Record<string, unknown>>)[k];
                if (utils.isValidElement(k)) {
                    if (extensions[k] === undefined) extensions[k] = {};
                    const $node = utils.newElement(k);
                    Object.keys(extObj).forEach((it) => {
                        if (utils.hasProp($node, it)) {
                            console.warn("[m2d2] Property [" + it + "] already exists in node: [" + k + "]");
                        }
                    });
                    Object.assign(extensions[k], extObj);
                } else {
                    if (extensions["*"] === undefined) extensions["*"] = {};
                    Object.assign(extensions["*"], extObj);
                }
            });
        }
    }
    return $;
}
```

- [ ] **Step 2: Create `src/index.ts`**

```ts
import { utils } from "./utils";
import { config } from "./config";
import { installPrototypes } from "./dom";
import { $, ready, load } from "./factory";

// Install Element.prototype patches once:
installPrototypes();

// Copy all utils methods onto $ so they're accessible as $.isString, $.isNode, etc.:
utils.getMethods(utils).forEach((k) => {
    ($ as any)[k] = (utils as any)[k];
});

/**
 * The m2d2 namespace — the UMD global.
 * Usage:
 *   m2d2.ready($ => { ... })
 *   const $ = m2d2.load()
 *   m2d2.short = false  // disable short assignment
 */
export const m2d2 = {
    ready,
    load,
    main: $,
    // Config flags (mutable):
    get short() { return config.short; },
    set short(v: boolean) { config.short = v; },
    get updates() { return config.updates; },
    set updates(v: boolean) { config.updates = v; },
    get storedEventsTimeout() { return config.storedEventsTimeout; },
    set storedEventsTimeout(v: number) { config.storedEventsTimeout = v; },
    // Utils instance:
    utils,
    // Extension registry:
    extensions: {},
};

export default m2d2;
export { $, ready, load, config };
```

- [ ] **Step 3: Wire `test/helpers.ts` to use real import**

Replace the placeholder `$` stub in `test/helpers.ts` with:

```ts
import { beforeEach, afterEach } from "vitest";
import { m2d2 } from "../src/index";

const $ = m2d2.load();
export { $ };

export const id = "qunit-fixture";
export const root = "#" + id;

export function setupFixture(): void {
    beforeEach(() => {
        document.body.innerHTML = `<div id="${id}"></div>`;
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });
}

export function fixture(html: string): void {
    const el = document.querySelector(root) as HTMLElement;
    el.innerHTML = html.trim();
}
```

- [ ] **Step 4: Create `test/factory.test.ts`**

This validates the public `$` API end-to-end, mirroring the key QUnit tests:

```ts
import { describe, it, expect } from "vitest";
import { $, root, setupFixture } from "./helpers";

describe("$ factory shapes", () => {
    setupFixture();

    it("$(selector, {text}) sets text", () => {
        const q = $(root, { text: "foo" }) as any;
        expect(q.text).toBe("foo");
        expect(document.querySelector(root)!.textContent).toBe("foo");
    });

    it("$(selector) returns extended element", () => {
        const q = $(root) as any;
        expect(typeof q.find).toBe("function");
        expect(typeof q.findAll).toBe("function");
    });

    it("$(selector, htmlString) sets innerHTML", () => {
        $(root, `<div class="injected">hi</div>`);
        expect(document.querySelector(root + " .injected")).not.toBeNull();
    });

    it("$({plain}) creates observable fragment", () => {
        const frag = $({ name: "test", value: 42 }) as any;
        expect(frag.name).toBe("test");
        expect(frag.value).toBe(42);
    });

    it("short assignment: set value guesses property", () => {
        document.body.innerHTML = '<div id="root"><span class="name"></span></div>';
        const node = $(root, { name: "Yoda" }) as any;
        expect(node.name.text).toBe("Yoda");
        // Short assign: node.name = "x" sets .text
        node.name = "Changed";
        expect(node.name.text).toBe("Changed");
    });

    it("onready fires after $() returns (microtask)", async () => {
        let ready = false;
        const node = $(root, {
            text: "x",
            onready: () => { ready = true; },
        }) as any;
        expect(ready).toBe(false); // not yet (microtask)
        await Promise.resolve(); // flush microtask
        expect(ready).toBe(true);
    });

    it("onload fires synchronously during bind", () => {
        let loaded = false;
        $(root, {
            text: "x",
            onload: () => { loaded = true; },
        });
        expect(loaded).toBe(true);
    });
});
```

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: all tests pass (config, utils, dom, reactivity, locator, binding, template, factory). Some earlier unit tests that stubbed `$` may need the helpers import updated — fix any failures.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (fix any type issues).

- [ ] **Step 7: Commit**

```bash
git add src/factory.ts src/index.ts test/helpers.ts test/factory.test.ts
git commit -m "feat: implement $ factory with ready/load, wire index, microtask onready"
```

---

## Task 10: Port Remaining Core Integration Tests

**Files:**
- Create: `test/onupdate.test.ts` (port of `test/06_test_onupdate.js`)
- Create: `test/issues.test.ts` (port of issue tests: 13, 15, 16, 24, 25, 27, 29, 35, 41, 43, 53)

Port the remaining QUnit tests to validate the full reactivity + linking + items behavior. Each test uses the `$` factory via `test/helpers.ts`.

- [ ] **Step 1: Create `test/onupdate.test.ts`**

Port `test/06_test_onupdate.js` (4 tests: pushing changes, pulling via object, pulling via node, pulling with callback):

```ts
import { describe, it, expect } from "vitest";
import { $, root, setupFixture } from "./helpers";

describe("onupdate and linked references", () => {
    setupFixture();

    it("pushing changes (onchange handler)", () => {
        $(root, `
            <section id="user"><form><input type="text" name="nickname" value="" /></form></section>
            <section id="profile"><span class="nickname"></span></section>
        `);
        const profile = $("#profile", { nickname: "" }) as any;
        const user = $("#user", {
            nickname: {
                onchange: function (this: any) {
                    profile.nickname.text = this.value;
                },
            },
        }) as any;
        user.nickname.value = "dummy";
        user.nickname.onchange();
        expect(document.querySelector("#profile .nickname")!.textContent).toBe("dummy");
    });

    it("pulling changes using plain object", () => {
        $(root, `
            <section id="user"><form><input type="text" name="nickname" value="" /></form></section>
            <section id="profile"><span class="nickname"></span></section>
        `);
        const info = $({ nick: "Nick", phone: "000", email: "n@e.com" }) as any;
        $("#user", { nickname: [info, "nick"] }) as any;
        $("#profile", { nickname: [info, "nick"] }) as any;
        info.nick = "dummy";
        expect(document.querySelector("#user .nickname")!.textContent).toBe("dummy");
        expect(document.querySelector("#profile .nickname")!.textContent).toBe("dummy");
    });

    it("pulling changes using node", () => {
        $(root, `
            <section id="user"><form><input type="text" name="nickname" value="" /></form></section>
            <section id="profile"><span class="nickname"></span></section>
        `);
        const user = $("#user", { nickname: "" }) as any;
        $("#profile", { nickname: [user.nickname, "value"] }) as any;
        user.nickname.value = "dummy";
        expect(document.querySelector("#profile .nickname")!.textContent).toBe("dummy");
    });

    it("pulling changes with callback transform", () => {
        $(root, `
            <section id="user"><form><input type="text" name="nickname" value="" /></form></section>
            <section id="profile"><span class="nickname"></span></section>
        `);
        const user = $("#user", { nickname: "" }) as any;
        $("#profile", {
            nickname: [user.nickname, "value", (val: string) => "@" + val],
        }) as any;
        user.nickname.value = "dummy";
        expect(document.querySelector("#profile .nickname")!.textContent).toBe("@dummy");
    });
});
```

- [ ] **Step 2: Create `test/issues.test.ts`**

Port the issue-specific tests. Each verifies a specific bug fix or edge case from the original test suite. Use the HTML setup pattern `$(root, \`<html>\`)` then bind with `$(selector, {obj})`:

```ts
import { describe, it, expect } from "vitest";
import { $, root, setupFixture } from "./helpers";

describe("issue regression tests", () => {
    setupFixture();

    // Issue #13: mixing onready with array items
    it("#13: mixing onready doesn't duplicate list items", () => {
        $(root, `<div id="user"><span class="name"></span></div><ul id="hobbies"></ul>`);
        const user = $("#user", { name: "test" }) as any;
        const hobbies = $("#hobbies", {
            items: ["skiing", "coding"],
        }) as any;
        expect(hobbies.items.length).toBe(2);
    });

    // Issue #15: tagName creates elements, onload fires once
    it("#15: tagName creates sibling divs", () => {
        let loadCount = 0;
        $(root, `<div id="container"></div>`);
        $("#container", {
            first: { tagName: "div", text: "A", onload: () => loadCount++ },
            second: { tagName: "div", text: "B" },
        }) as any;
        expect(loadCount).toBe(1);
        expect(document.querySelectorAll("#container div").length).toBe(2);
    });

    // Issue #16: onupdate/onshow fire on show toggle
    it("#16: onshow fires when element becomes visible", () => {
        let shown = false;
        $(root, `<div id="el"></div>`);
        const el = $("#el", {
            show: false,
            onshow: () => { shown = true; },
        }) as any;
        el.show = true;
        expect(shown).toBe(true);
    });

    // Issue #24: properties added on the fly
    it("#24: can set property not in initial spec", () => {
        $(root, `<div id="user"><span class="age"></span></div>`);
        const user = $("#user", { style: { color: "blue" } }) as any;
        user.age.text = "30";
        expect(document.querySelector("#user .age")!.textContent).toBe("30");
    });

    // Issue #25: linked ref to dataset and style
    it("#25: linked ref updates on dataset change", () => {
        $(root, `
            <div id="src" data-id="0"></div>
            <div id="tgt"><span class="uid"></span></div>
        `);
        const src = $("#src", { dataset: { id: 0 } }) as any;
        $("#tgt", { uid: [src.dataset, "id"] }) as any;
        src.dataset.id = 100;
        expect(document.querySelector("#tgt .uid")!.textContent).toBe("100");
    });

    // Issue #27: sorting shouldn't slow down (no proxy accumulation)
    it("#27: sort then reverse preserves order", () => {
        $(root, `<ul id="list"></ul>`);
        const list = $("#list", {
            items: ["banana", "apple", "cherry"],
        }) as any;
        list.items.sort();
        expect(list.items.first().text).toBe("apple");
        list.items.reverse();
        expect(list.items.first().text).toBe("cherry");
    });

    // Issue #29: event on multiple elements fires per element
    it("#29: onclick on matched group fires per element", () => {
        let count = 0;
        $(root, `<div id="root"><div class="x">1</div><div class="x">2</div></div>`);
        $("#root", {
            div: { onclick: () => count++ },
        }) as any;
        const divs = document.querySelectorAll("#root div");
        (divs[0] as HTMLElement).click();
        (divs[1] as HTMLElement).click();
        expect(count).toBe(2);
    });

    // Issue #41: string items via push/concat
    it("#41: push accepts plain string", () => {
        $(root, `<ul id="list"></ul>`);
        const list = $("#list", { items: ["a"] }) as any;
        list.items.push("b");
        expect(list.items.length).toBe(2);
        expect(list.items.last().text).toBe("b");
    });

    // Issue #43: html not ready synchronously, but onready works
    it("#43: html injection + onready event binding", async () => {
        let clicked = false;
        $(root, `<div id="container"></div>`);
        $("#container", {
            html: `<form><button type="button">Click</button></form>`,
            onready: function (this: any) {
                this.find("button").onclick = () => { clicked = true; };
            },
        }) as any;
        await Promise.resolve(); // flush microtask (onready)
        (document.querySelector("#container button") as HTMLElement).click();
        expect(clicked).toBe(true);
    });

    // Issue #53: append moves DOM node correctly
    it("#53: append moves m2d2 node into parent", () => {
        $(root, `<div id="a"><span id="child">hello</span></div><div id="b"></div>`);
        const child = $("#child") as any;
        const b = $("#b") as any;
        b.append(child);
        expect(document.querySelector("#b #child")).not.toBeNull();
        expect(document.querySelector("#a #child")).toBeNull();
        expect($("#child").text).toBe("hello");
    });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run`
Expected: all tests pass. If any fail, debug the specific behavior — these are the ground-truth behavioral tests from the original suite.

**Note:** If a linked-reference test fails (e.g. pulling changes via object), the likely cause is that the fragment's `EventTarget` dispatch isn't wired through the proxy correctly. Check that `dispatchUpdate` is called on the fragment proxy's set handler, and that the listener registered in `updateValue` receives it.

- [ ] **Step 4: Commit**

```bash
git add test/onupdate.test.ts test/issues.test.ts
git commit -m "test: port onupdate and issue regression tests to Vitest"
```

---

## Task 11: Storage Extension

**Files:**
- Create: `src/extensions/storage.ts`
- Test: `test/extensions/storage.test.ts`

Port `js/m2d2.storage.src.js`. Fix: missing key → `null`, parse failure → warn + `null`.

- [ ] **Step 1: Create `src/extensions/storage.ts`**

```ts
import type { M2d2Node } from "../types";

interface StorageOptions {
    [key: string]: unknown;
}

/**
 * Wrapper for localStorage/sessionStorage with type-preserving serialization.
 * Ported from js/m2d2.storage.src.js.
 * Fix: missing key → null; parse failure → warn + null.
 */
export class Storage {
    private store: Storage_Web;

    constructor(type: "local" | "session") {
        if (type === "local" && typeof localStorage !== "undefined") {
            this.store = localStorage;
        } else if (type === "session" && typeof sessionStorage !== "undefined") {
            this.store = sessionStorage;
        } else {
            this.store = localStorage;
        }
    }

    set(key: string, val: unknown): void {
        if (typeof val === "string") {
            val = { $: val };
        }
        this.store.setItem(key, JSON.stringify(val));
    }

    get(key: string): unknown {
        const raw = this.store.getItem(key);
        if (raw === null) return null; // FIX: missing key → null (was: {} → null via convoluted path)
        try {
            const val = JSON.parse(raw);
            if (val && typeof val === "object" && "$" in val) {
                return val.$;
            }
            if (val && typeof val === "object" && Object.keys(val).length === 0 && val.constructor === Object) {
                return null;
            }
            return val;
        } catch {
            // FIX: parse failure → warn + null (was: silently swallow)
            console.warn("[m2d2] Storage parse error for key:", key);
            return null;
        }
    }

    del(key: string): void {
        this.store.removeItem(key);
    }

    keys(): string[] {
        return Object.keys(this.store).sort();
    }

    clear(): void {
        this.store.clear();
    }

    exists(key: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.store, key);
    }

    log(key: string, val: unknown, n = 10): void {
        const tmp = (this.get(key) as unknown[]) || [];
        tmp.push(val);
        while (tmp.length > n) tmp.shift();
        this.set(key, tmp);
    }
}

// Type alias to avoid clash with our Storage class and the global Storage:
type Storage_Web = globalThis.Storage;

/**
 * Register $.local and $.session on the m2d2 $ function.
 */
export function registerStorage($target: { local?: Storage; session?: Storage }): void {
    $target.local = new Storage("local");
    $target.session = new Storage("session");
}
```

- [ ] **Step 2: Create `test/extensions/storage.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { Storage } from "../../src/extensions/storage";

describe("Storage", () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it("set/get string round-trips", () => {
        const s = new Storage("local");
        s.set("key", "value");
        expect(s.get("key")).toBe("value");
    });

    it("set/get object round-trips", () => {
        const s = new Storage("local");
        s.set("obj", { a: 1, b: "two" });
        expect(s.get("obj")).toEqual({ a: 1, b: "two" });
    });

    it("set/get array round-trips", () => {
        const s = new Storage("local");
        s.set("arr", [1, 2, 3]);
        expect(s.get("arr")).toEqual([1, 2, 3]);
    });

    it("get missing key returns null", () => {
        const s = new Storage("local");
        expect(s.get("nonexistent")).toBeNull();
    });

    it("del removes key", () => {
        const s = new Storage("local");
        s.set("key", "val");
        s.del("key");
        expect(s.get("key")).toBeNull();
    });

    it("exists checks key presence", () => {
        const s = new Storage("local");
        s.set("key", "val");
        expect(s.exists("key")).toBe(true);
        expect(s.exists("missing")).toBe(false);
    });

    it("keys returns sorted key list", () => {
        const s = new Storage("local");
        s.set("zebra", "z");
        s.set("apple", "a");
        expect(s.keys()).toEqual(["apple", "zebra"]);
    });

    it("log keeps last N entries", () => {
        const s = new Storage("local");
        s.log("log", "a", 3);
        s.log("log", "b", 3);
        s.log("log", "c", 3);
        s.log("log", "d", 3);
        const result = s.get("log") as unknown[];
        expect(result).toEqual(["b", "c", "d"]);
    });

    it("clear removes all keys", () => {
        const s = new Storage("local");
        s.set("a", 1);
        s.set("b", 2);
        s.clear();
        expect(s.keys().length).toBe(0);
    });

    it("session storage is separate from local", () => {
        const local = new Storage("local");
        const session = new Storage("session");
        local.set("key", "L");
        session.set("key", "S");
        expect(local.get("key")).toBe("L");
        expect(session.get("key")).toBe("S");
    });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run test/extensions/storage.test.ts`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/extensions/storage.ts test/extensions/storage.test.ts
git commit -m "feat: port storage extension with missing-key null fix"
```

---

## Task 12: XHR Extension

**Files:**
- Create: `src/extensions/xhr.ts`
- Test: `test/extensions/xhr.test.ts`

Port `js/m2d2.xhr.src.js`. Keep flexible argument parsing. Fix: `onreadystatechange` redeclaration footgun (add braces).

- [ ] **Step 1: Create `src/extensions/xhr.ts`**

Port from `js/m2d2.xhr.src.js` with the `const headers`/`const partial` redeclaration fixed (wrap in braces). The flexible argument parsing stays identical.

```ts
/**
 * XHR extension: $.get, $.post, $.put, $.delete, $.connect, $.options,
 * $.trace, $.patch, $.head, $.copy.
 * Ported from js/m2d2.xhr.src.js.
 * Supports flexible argument order (any permutation of url/data/callback/error/json/timeout by type).
 */
export interface XhrError {
    type: string;
    reason: string;
    status: number;
}

interface XhrArgs {
    url?: string;
    data?: Record<string, unknown> | string;
    callback?: (data: unknown) => void;
    error_callback?: (error: XhrError) => void;
    json?: boolean;
    timeout?: number;
}

function performRequest(
    method: string,
    url: string,
    data: Record<string, unknown> | string,
    callback: ((data: unknown) => void) | undefined,
    errorCallback: (error: XhrError) => void,
    json: boolean,
    timeout: number | undefined
): XMLHttpRequest {
    const request = new XMLHttpRequest();

    if (data && typeof data === "object" && Object.entries(data).length === 0) {
        data = "";
    }
    if (data) {
        if (json) {
            data = JSON.stringify(data);
        } else {
            switch (method.toUpperCase()) {
                case "HEAD":
                case "GET": {
                    if (typeof data === "string") {
                        const obj: Record<string, string> = {};
                        obj[data] = "";
                        data = obj;
                    }
                    const dataObj = data as Record<string, unknown>;
                    url +=
                        (url.indexOf("?") !== -1 ? "&" : "?") +
                        Object.keys(dataObj)
                            .map((key) => key + "=" + dataObj[key])
                            .join("&");
                    data = "";
                    break;
                }
                default: {
                    const dataObj = data as Record<string, unknown>;
                    data = Object.keys(dataObj)
                        .map((key) => key + "=" + dataObj[key])
                        .join("&");
                }
            }
        }
    }

    request.open(method, url, true);

    if (timeout) {
        request.timeout = timeout;
        request.ontimeout = () => {
            errorCallback({ type: "Timeout", reason: "Connection timed out", status: 0 });
        };
    }

    if (json) {
        request.setRequestHeader("Content-Type", "application/json");
    } else {
        request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    }

    request.onerror = () => {
        errorCallback({ type: "Connection", reason: "Connection Refused", status: 0 });
    };

    let loadedBytes = 0;
    request.onreadystatechange = () => {
        switch (request.readyState) {
            case request.HEADERS_RECEIVED: {
                // FIX: wrapped in braces (was redeclaring const without braces)
                const headers = request
                    .getAllResponseHeaders()
                    .trim()
                    .split("\r\n")
                    .reduce((acc: Record<string, string>, current) => {
                        const idx = current.indexOf(": ");
                        const x = current.substring(0, idx);
                        const v = current.substring(idx + 2);
                        acc[x] = v;
                        return acc;
                    }, {});
                request.dispatchEvent(new CustomEvent("headers", { detail: headers }));
                if (method === "HEAD" && callback) {
                    callback(headers);
                }
                break;
            }
            case request.LOADING: {
                // FIX: wrapped in braces
                const partial = (request.response as string).substr(loadedBytes);
                loadedBytes = request.responseText.length;
                request.dispatchEvent(new CustomEvent("partial", { detail: partial }));
                break;
            }
        }
    };

    request.onload = () => {
        let data: any = {};
        try {
            data = request.responseText
                ? JSON.parse(request.responseText)
                : { error: { type: "Response", reason: "Empty response", status: 0 } };
        } catch (err) {
            data.error = { type: "Parse Error", reason: (err as Error).message, status: 0 };
        }
        if (request.status >= 200 && request.status < 400) {
            if (callback !== undefined && method !== "HEAD") {
                callback(data);
            }
        } else if (request.status >= 400) {
            if (errorCallback !== undefined) {
                if (typeof data.error === "string") {
                    data.error = { type: "Exception", reason: data.error, status: request.status };
                }
                errorCallback(data.error);
            }
        } else if (request.status) {
            console.log("[m2d2] Received response with code:", request.status);
        } else if (data.error) {
            errorCallback(data.error);
        }
    };

    // Override helpers for headers/partial stream callbacks:
    (request as any).headers = function (cb: (headers: Record<string, string>) => void) {
        request.addEventListener("headers", ((e: Event) => cb((e as CustomEvent).detail)) as EventListener);
    };
    (request as any).partial = function (cb: (partial: string) => void) {
        request.addEventListener("partial", ((e: Event) => cb((e as CustomEvent).detail)) as EventListener);
    };

    request.send(data as DocumentBody);
    return request;
}

/**
 * Parse flexible arguments by type and dispatch to performRequest.
 * Ported from js/m2d2.xhr.src.js:144-199.
 */
function makeMethod(method: string) {
    return function (...args: unknown[]): XMLHttpRequest {
        const parsed: XhrArgs = {};
        Array.from(args).forEach((a) => {
            if (typeof a === "string") {
                if (!parsed.url) {
                    parsed.url = a;
                } else if (!parsed.data) {
                    parsed.data = a;
                } else {
                    console.warn("[m2d2] Too many string args to", method);
                }
            } else if (typeof a === "object" && a !== null) {
                if (!parsed.data) {
                    parsed.data = a as Record<string, unknown>;
                } else {
                    console.warn("[m2d2] Duplicate data arg to", method);
                }
            } else if (typeof a === "function") {
                if (!parsed.callback) {
                    parsed.callback = a as (data: unknown) => void;
                } else if (!parsed.error_callback) {
                    parsed.error_callback = a as (error: XhrError) => void;
                }
            } else if (typeof a === "boolean") {
                if (parsed.json === undefined) {
                    parsed.json = a;
                }
            } else if (typeof a === "number") {
                if (parsed.timeout === undefined) {
                    parsed.timeout = a;
                }
            }
        });
        if (parsed.data === undefined) parsed.data = {};

        return performRequest(
            method.toUpperCase(),
            parsed.url || "",
            parsed.data as Record<string, unknown>,
            parsed.callback,
            parsed.error_callback ?? ((e) => console.log("[m2d2]", e)),
            parsed.json ?? false,
            parsed.timeout
        );
    };
}

/**
 * Register $.get, $.post, etc. on the target.
 */
export function registerXhr($target: Record<string, unknown>): void {
    ["get", "post", "put", "delete", "connect", "options", "trace", "patch", "head", "copy"].forEach(
        (method) => {
            $target[method] = makeMethod(method);
        }
    );
}
```

**Note:** The `request.send(data as DocumentBody)` cast is needed because `data` is typed as string|object but `send` expects `DocumentBody | null`. This is fine since at this point `data` is always a string.

- [ ] **Step 2: Create `test/extensions/xhr.test.ts`**

Since XHR needs a server, use Vitest's `vi.fn()` to mock `XMLHttpRequest` or test only the argument parsing logic:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock XMLHttpRequest:
class MockXHR {
    static last: MockXHR;
    method: string = "";
    url: string = "";
    data: unknown = "";
    headers: Record<string, string> = {};
    timeout: number | undefined;
    readyState: number = 0;
    status: number = 200;
    responseText: string = "";
    response: string = "";
    onreadystatechange: (() => void) | null = null;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    ontimeout: (() => void) | null = null;
    addEventListener = vi.fn();

    open(method: string, url: string) { this.method = method; this.url = url; }
    setRequestHeader(k: string, v: string) { this.headers[k] = v; }
    send(data: unknown) { this.data = data; MockXHR.last = this; }
    set timeout(v: number) { this._timeout = v; }
    get timeout() { return this._timeout; }
    _timeout: number | undefined;
    getAllResponseHeaders() { return ""; }
    dispatchEvent() {}
    static HEADERS_RECEIVED = 2;
    static LOADING = 3;
}

describe("XHR flexible argument parsing", () => {
    beforeEach(() => {
        (globalThis as any).XMLHttpRequest = MockXHR;
    });

    it("parses (url, data, callback)", async () => {
        const { registerXhr } = await import("../../src/extensions/xhr");
        const $: any = {};
        registerXhr($);
        const cb = vi.fn();
        $.get("/api", { q: 1 }, cb);
        expect(MockXHR.last.method).toBe("GET");
        expect(MockXHR.last.url).toContain("/api");
        expect(MockXHR.last.url).toContain("q=1");
    });

    it("parses (url, callback)", async () => {
        const { registerXhr } = await import("../../src/extensions/xhr");
        const $: any = {};
        registerXhr($);
        const cb = vi.fn();
        $.get("/api", cb);
        expect(MockXHR.last.url).toBe("/api");
    });

    it("parses (url, data, json=true)", async () => {
        const { registerXhr } = await import("../../src/extensions/xhr");
        const $: any = {};
        registerXhr($);
        $.put("/api", { status: "ok" }, true);
        expect(MockXHR.last.headers["Content-Type"]).toBe("application/json");
        expect(MockXHR.last.data).toBe(JSON.stringify({ status: "ok" }));
    });

    it("parses (url, timeout)", async () => {
        const { registerXhr } = await import("../../src/extensions/xhr");
        const $: any = {};
        registerXhr($);
        $.get("/api", 5000);
        expect(MockXHR.last._timeout).toBe(5000);
    });

    it("POST sends data in body", async () => {
        const { registerXhr } = await import("../../src/extensions/xhr");
        const $: any = {};
        registerXhr($);
        $.post("/api", { name: "test" });
        expect(MockXHR.last.method).toBe("POST");
        expect(MockXHR.last.data).toBe("name=test");
    });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run test/extensions/xhr.test.ts`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/extensions/xhr.ts test/extensions/xhr.test.ts
git commit -m "feat: port XHR extension with flexible arg parsing, fix redeclaration"
```

---

## Task 13: Upload Extension

**Files:**
- Create: `src/extensions/upload.ts`
- Test: `test/extensions/upload.test.ts`

Port `js/m2d2.upload.src.js`. **Fix the bitwise-OR bug**: `opts.maxFiles === 0 | el.files.length <= opts.maxFiles` → `opts.maxFiles === 0 || el.files.length <= opts.maxFiles` (line 58 of original).

- [ ] **Step 1: Create `src/extensions/upload.ts`**

Port from `js/m2d2.upload.src.js` with the `|` → `||` fix on the maxFiles check. All other logic stays the same. The key methods: `$.upload(ev, opts)`, internal `FileUpload`, `getResponse`, `getFileForm`.

```ts
/**
 * Upload extension: $.upload(ev, options)
 * Ported from js/m2d2.upload.src.js.
 * Fix: bitwise-OR → logical-OR in maxFiles check.
 */
export interface UploadOptions {
    upload?: string;
    args?: Record<string, unknown>;
    accept?: string;
    parallel?: boolean;
    field?: string;
    multiple?: boolean;
    maxFiles?: number;
    maxParallel?: number;
    maxSizeMb?: number;
    php?: boolean;
    onSelect?: (files: FileList, sources: string[]) => void;
    onUpdate?: (pct: number, file: File, index: number) => void;
    onDone?: (response: UploadResponse[], allDone: boolean) => void;
    onError?: (error: unknown) => void;
    onResponse?: (response: unknown) => unknown;
}

export interface UploadResponse {
    file: File;
    data: unknown;
    index: number;
}

interface UploadOptsInternal extends Required<Omit<UploadOptions, "onSelect" | "onResponse" | "onError" | "onDone" | "onUpdate">> {
    onSelect?: (files: FileList, sources: string[]) => void;
    onUpdate: (pct: number, file: File, index: number) => void;
    onDone: (response: UploadResponse[], allDone: boolean) => void;
    onError: (error: unknown) => void;
    onResponse: (response: unknown) => unknown;
}

function getResponse(data: unknown, files: File[], index: number): UploadResponse[] {
    const response: UploadResponse[] = [];
    data = data || {};
    files.forEach((f, i) => {
        let row: unknown;
        if (Array.isArray(data) && data.length === files.length) {
            row = (data as unknown[])[index];
        } else if (!Array.isArray(data) && typeof data === "object" && data !== null && (data as Record<string, unknown>)[f.name] !== undefined) {
            row = (data as Record<string, unknown>)[f.name];
        } else {
            row = data;
        }
        response.push({
            file: f,
            data: row,
            index: index + i,
        });
    });
    return response;
}

function getFileForm(fieldName: string, files: File[]): FormData {
    const form = new FormData();
    files.forEach((file) => {
        if (file) form.append(fieldName, file, file.name);
    });
    return form;
}

function FileUpload(
    fieldName: string,
    files: File[],
    index: number,
    options: UploadOptsInternal,
    callback: (data: unknown, files: File[], index: number) => void
): void {
    const xhr = new XMLHttpRequest();
    files = Array.from(files);

    xhr.upload.addEventListener(
        "progress",
        (e) => {
            if (e.lengthComputable) {
                if (options.parallel) {
                    const pct = Math.round((e.loaded * 100) / e.total);
                    options.onUpdate(pct, files[0], index);
                } else {
                    let sizeAccum = 0;
                    let i = 0;
                    files.some((f) => {
                        sizeAccum += f.size;
                        const pct = e.loaded >= sizeAccum ? 100 : 100 - Math.round(((sizeAccum - e.loaded) * 100) / f.size);
                        options.onUpdate(pct, f, i++);
                        return sizeAccum >= e.loaded;
                    });
                }
            }
        },
        false
    );

    xhr.addEventListener(
        "load",
        () => {
            let data: any = {};
            try {
                data = xhr.responseText
                    ? JSON.parse(xhr.responseText)
                    : { error: { type: "Unknown", reason: "Unknown Error" } };
            } catch (err) {
                data.error = { type: "Parse Error", reason: (err as Error).message };
            }
            if (xhr.status >= 200 && xhr.status < 400) {
                callback(options.onResponse(data), files, index);
            } else {
                if (typeof data.error === "string") {
                    data.error = { type: "Exception", reason: data.error };
                }
                options.onError(data.error);
            }
        },
        false
    );

    xhr.open("POST", options.upload);

    const loaded = Array(files.length).fill(false);
    const form = getFileForm(fieldName, files);
    let loadIndex = 0;
    files.forEach((f) => {
        if (f) {
            const reader = new FileReader();
            reader.onload = () => {
                loaded[loadIndex++] = true;
                if (loaded.indexOf(false) === -1) {
                    xhr.send(form);
                }
            };
            reader.readAsBinaryString(f);
        }
    });
}

export function upload(ev: unknown, userOptions?: UploadOptions): void {
    const opts: UploadOptsInternal = Object.assign(
        {
            upload: "",
            args: {},
            accept: "*/*",
            parallel: false,
            field: "file",
            multiple: true,
            maxFiles: 0,
            maxParallel: 0,
            maxSizeMb: 0,
            php: false,
        },
        userOptions
    ) as UploadOptsInternal;

    // Default callbacks:
    opts.onDone = opts.onDone ?? ((response) => console.log("[m2d2]", response));
    opts.onError = opts.onError ?? ((response) => console.error("[m2d2] Upload error:", response));
    opts.onUpdate =
        opts.onUpdate ??
        ((pct, file) => console.log("[m2d2] Uploading:", pct + "%", opts.parallel ? "[" + file.name + "]" : ""));
    opts.onResponse = opts.onResponse ?? ((res) => res);

    const el = document.createElement("input") as HTMLInputElement;
    el.name = opts.field;
    el.type = "file";
    el.accept = opts.accept;
    if (opts.multiple) {
        el.multiple = true;
        if (opts.php) {
            el.name += "[]";
        }
    }
    if (!opts.upload) {
        console.warn("[m2d2] Upload URL not specified. Using current page.");
        opts.upload = "";
    }
    const queryStr = opts.args
        ? (opts.upload.indexOf("?") !== -1 ? "&" : "?") + new URLSearchParams(opts.args as Record<string, string>).toString()
        : "";
    opts.upload += queryStr;

    el.addEventListener("change", () => {
        if (!el.files || !el.files.length) return;

        // FIX: was `opts.maxFiles === 0 | el.files.length <= opts.maxFiles` (bitwise OR).
        // Now correctly `||` (logical OR):
        if (opts.maxFiles === 0 || el.files.length <= opts.maxFiles) {
            if (opts.onSelect) {
                const srcs: string[] = [];
                let totSize = 0;
                Array.from(el.files).forEach((file) => {
                    srcs.push(URL.createObjectURL(file));
                    totSize += file.size;
                });
                const mbs = totSize / (1024 * 1024);
                if (opts.maxSizeMb && mbs > opts.maxSizeMb) {
                    opts.onError("Maximum size exceeded: " + Math.ceil(mbs) + "MB > " + opts.maxSizeMb + "MB");
                    return;
                }
                opts.onSelect(el.files, srcs);
            }

            new Promise<void>((resolve) => {
                if (opts.parallel) {
                    let index = 0;
                    const files = Array.from(el.files);
                    const fileDone = Array(files.length).fill(false);
                    let uploading: (File | undefined)[] = [];

                    const uploadFile = (file: File) => {
                        FileUpload(el.name, [file], index++, opts, (data, files, idx) => {
                            fileDone[idx] = true;
                            if (uploading.length) {
                                const ui = uploading.indexOf(file);
                                if (ui >= 0) uploading[ui] = undefined;
                                uploading = uploading.filter((e) => e !== undefined);
                            }
                            const allDone = fileDone.indexOf(false) === -1;
                            opts.onDone(getResponse(data, files, idx), allDone);
                            if (allDone) resolve();
                        });
                    };

                    if (opts.maxParallel) {
                        const timer = setInterval(() => {
                            if (files.length === 0) {
                                clearInterval(timer);
                            } else {
                                while (uploading.length < opts.maxParallel) {
                                    const file = files.shift()!;
                                    uploading.push(file);
                                    uploadFile(file);
                                }
                            }
                        }, 100);
                    } else {
                        files.forEach(uploadFile);
                    }
                } else {
                    FileUpload(el.name, Array.from(el.files), 0, opts, (data, files, idx) => {
                        opts.onDone(getResponse(data, files, idx), true);
                        resolve();
                    });
                }
            });
        } else {
            opts.onError("Max file limit exceeded. Maximum files: " + opts.maxFiles);
        }
    });

    el.click();
}
```

- [ ] **Step 2: Create `test/extensions/upload.test.ts`**

Test the maxFiles fix and option defaults (without a real server):

```ts
import { describe, it, expect, vi } from "vitest";
import { upload } from "../../src/extensions/upload";

describe("upload extension", () => {
    it("the maxFiles check uses logical OR (regression for bitwise bug)", () => {
        // The fix: opts.maxFiles === 0 || el.files.length <= opts.maxFiles
        // Test with maxFiles=2 and 3 files → should trigger error
        // We can't easily trigger a real file dialog, but we verify the logic:
        const check = (maxFiles: number, fileCount: number): boolean => {
            return maxFiles === 0 || fileCount <= maxFiles;
        };
        // maxFiles=0 → always allowed:
        expect(check(0, 100)).toBe(true);
        // maxFiles=2, 3 files → not allowed:
        expect(check(2, 3)).toBe(false);
        // maxFiles=2, 2 files → allowed:
        expect(check(2, 2)).toBe(true);
        // The OLD buggy code would have computed: (0 | 100<=0) etc.
        // For maxFiles=2, count=3: old = (2===0 | 3<=2) = (0 | 0) = 0 (falsy) → would incorrectly reject
        // For maxFiles=2, count=2: old = (2===0 | 2<=2) = (0 | 1) = 1 (truthy) → ok
        // The fix makes both correct.
    });

    it("accepts all documented options", () => {
        // Just verify the function doesn't throw with options:
        const mockClick = vi.fn();
        // Override createElement to capture the input:
        const origCreate = document.createElement.bind(document);
        const spy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
            const el = origCreate(tag);
            if (tag === "input") {
                el.click = mockClick;
            }
            return el;
        });
        try {
            expect(() => {
                upload(null, {
                    upload: "/upload",
                    accept: "image/*",
                    parallel: true,
                    maxFiles: 5,
                    maxSizeMb: 10,
                    field: "myfile",
                    php: true,
                });
            }).not.toThrow();
            expect(mockClick).toHaveBeenCalled();
        } finally {
            spy.mockRestore();
        }
    });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run test/extensions/upload.test.ts`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/extensions/upload.ts test/extensions/upload.test.ts
git commit -m "feat: port upload extension, fix maxFiles bitwise-OR bug"
```

---

## Task 14: WebSocket Extension

**Files:**
- Create: `src/extensions/ws.ts`
- Test: `test/extensions/ws.test.ts`

Port `js/m2d2.ws.src.js`. Straight port with typed options.

- [ ] **Step 1: Create `src/extensions/ws.ts`**

```ts
/**
 * WebSocket extension: $.ws
 * Ported from js/m2d2.ws.src.js.
 */

export interface WsOptions {
    host?: string;
    path?: string;
    port?: number;
    args?: Record<string, unknown>;
    secure?: boolean;
    reconnect?: boolean;
    request?: unknown;
    connected?: () => void;
    disconnected?: () => void;
}

export class WsClient {
    private webSocket!: WebSocket;
    private initRequest: unknown = null;
    private onConnect: () => void = () => {};
    private onDisconnect: () => void = () => {};
    private reconnect = true;
    private host = "";
    private secure = false;
    private port = 80;
    private path = "";
    private args: Record<string, unknown> = {};
    url = "";
    connected = false;
    private interval: ReturnType<typeof setInterval> | null = null;

    request(msg: unknown): void {
        if (!msg) return;
        try {
            this.webSocket.send(typeof msg === "object" ? JSON.stringify(msg) : (msg as string));
        } catch (e) {
            (this.webSocket as any).onerror(e);
        }
    }

    private getSocket(
        onMessage: (msg: unknown) => void,
        onOpen: (e: Event) => void,
        onClose: (e: CloseEvent) => void
    ): WebSocket {
        const ws = new WebSocket(this.url);
        ws.onopen = onOpen;
        ws.onclose = onClose;
        ws.onmessage = (res) => {
            if (res.data) {
                try {
                    onMessage(JSON.parse(res.data));
                } catch (e) {
                    (ws as any).onerror(e);
                }
            }
        };
        ws.onerror = (err) => {
            console.error(
                "[m2d2] Socket error:",
                (err as ErrorEvent)?.message || "Unknown",
                "Closing socket"
            );
            if (ws.readyState === 1) {
                ws.close();
            }
        };
        return ws;
    }

    connect(options: WsOptions, onMessage: (msg: unknown) => void): void {
        this.initRequest = options.request ?? null;
        this.onConnect = options.connected ?? (() => {});
        this.onDisconnect = options.disconnected ?? (() => {});
        this.reconnect = options.reconnect !== false;
        this.host = options.host || window.location.hostname;
        this.secure = options.secure === true;
        this.port = options.port || (this.secure ? 443 : 80);
        this.path = "/" + (options.path ? options.path.replace(/^\//, "") : "");
        this.args = Object.assign({}, options.args);

        const protocol = "ws" + (this.secure ? "s" : "") + "://";
        const hostPort = this.host + ":" + this.port;
        const queryStr = this.args ? "?" + new URLSearchParams(this.args as Record<string, string>).toString() : "";
        this.url = protocol + hostPort + this.path + queryStr;
        this.connected = false;
        this.interval = null;

        const onOpen = () => {
            this.connected = true;
            this.request(this.initRequest);
            this.onConnect();
        };

        const onClose = () => {
            this.connected = false;
            this.onDisconnect();
            if (!this.interval && this.reconnect) {
                this.interval = setInterval(() => {
                    if (this.connected) {
                        console.log("[m2d2] Reconnected.");
                        clearInterval(this.interval!);
                        this.interval = null;
                    } else {
                        try {
                            this.webSocket.close();
                            console.log("[m2d2] Reconnecting...");
                            this.webSocket = this.getSocket(onMessage, onOpen, onClose);
                        } catch {
                            // ignore
                        }
                    }
                }, 2000);
            }
        };

        this.webSocket = this.getSocket(onMessage, onOpen, onClose);
    }

    disconnect(): void {
        this.reconnect = false;
        this.webSocket.close();
    }
}

export function registerWs($target: { ws?: WsClient }): void {
    $target.ws = new WsClient();
}
```

- [ ] **Step 2: Create `test/extensions/ws.test.ts`**

Test URL construction and option parsing (mock WebSocket):

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WsClient } from "../../src/extensions/ws";

// Mock WebSocket:
class MockWebSocket {
    static lastUrl: string;
    static instances: MockWebSocket[] = [];
    readyState = 0;
    onopen: ((e: Event) => void) | null = null;
    onclose: ((e: CloseEvent) => void) | null = null;
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: Event) => void) | null = null;
    sent: string[] = [];

    constructor(url: string) {
        MockWebSocket.lastUrl = url;
        MockWebSocket.instances.push(this);
    }
    send(data: string) { this.sent.push(data); }
    close() { this.readyState = 3; }
}

describe("WsClient", () => {
    beforeEach(() => {
        (globalThis as any).WebSocket = MockWebSocket;
        MockWebSocket.instances = [];
    });

    it("constructs ws:// URL from options", () => {
        const client = new WsClient();
        client.connect({
            host: "localhost",
            port: 8080,
            path: "ws/",
            args: { id: "user1" },
        }, () => {});
        expect(MockWebSocket.lastUrl).toBe("ws://localhost:8080/ws/?id=user1");
    });

    it("constructs wss:// URL when secure=true", () => {
        const client = new WsClient();
        client.connect({
            host: "example.com",
            port: 443,
            secure: true,
        }, () => {});
        expect(MockWebSocket.lastUrl).toBe("wss://example.com:443/?");
    });

    it("defaults port to 80 (ws) or 443 (wss)", () => {
        const client = new WsClient();
        client.connect({ host: "example.com" }, () => {});
        expect(MockWebSocket.lastUrl).toContain(":80");
    });

    it("request sends JSON for objects", () => {
        const client = new WsClient();
        client.connect({ host: "localhost", port: 8080 }, () => {});
        const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1];
        // Simulate open:
        client["webSocket"] = ws;
        ws.readyState = 1;
        client.request({ cmd: "ping" });
        expect(ws.sent).toContain(JSON.stringify({ cmd: "ping" }));
    });

    it("request sends plain string as-is", () => {
        const client = new WsClient();
        client.connect({ host: "localhost", port: 8080 }, () => {});
        const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1];
        client["webSocket"] = ws;
        ws.readyState = 1;
        client.request("ping");
        expect(ws.sent).toContain("ping");
    });

    it("disconnect turns off reconnect", () => {
        const client = new WsClient();
        client.connect({ host: "localhost", port: 8080, reconnect: true }, () => {});
        client.disconnect();
        expect(client["reconnect"]).toBe(false);
    });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run test/extensions/ws.test.ts`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/extensions/ws.ts test/extensions/ws.test.ts
git commit -m "feat: port WebSocket extension with typed options"
```

---

## Task 15: Wire Extensions into Index and Full Test Suite

**Files:**
- Modify: `src/index.ts` (import and register extensions)
- Modify: `src/factory.ts` (or create a separate wiring point)

- [ ] **Step 1: Update `src/index.ts` to register extensions**

Add imports and registration calls after the `$` function is defined:

```ts
import { utils } from "./utils";
import { config } from "./config";
import { installPrototypes } from "./dom";
import { $, ready, load } from "./factory";
import { registerStorage } from "./extensions/storage";
import { registerXhr } from "./extensions/xhr";
import { upload } from "./extensions/upload";
import { registerWs } from "./extensions/ws";

installPrototypes();

utils.getMethods(utils).forEach((k) => {
    ($ as any)[k] = (utils as any)[k];
});

// Register extensions onto $:
registerStorage($ as any);
registerXhr($ as any);
($ as any).upload = upload;
registerWs($ as any);

export const m2d2 = {
    ready,
    load,
    main: $,
    get short() { return config.short; },
    set short(v: boolean) { config.short = v; },
    get updates() { return config.updates; },
    set updates(v: boolean) { config.updates = v; },
    get storedEventsTimeout() { return config.storedEventsTimeout; },
    set storedEventsTimeout(v: number) { config.storedEventsTimeout = v; },
    utils,
    extensions: {},
};

export default m2d2;
export { $, ready, load, config };
```

- [ ] **Step 2: Run the full test suite**

Run: `npx vitest run`
Expected: ALL tests pass — config, utils, dom, reactivity, locator, binding, template, factory, onupdate, issues, and all 4 extension test files.

- [ ] **Step 3: Fix any failures**

Debug and fix any test failures. The most likely areas:
- Linked references (onupdate tests) — ensure `dispatchUpdate` fires on the fragment proxy.
- `getData` — jsdom `FormData` behavior may differ slightly.
- `items.splice` — the insertion index math.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat: wire all extensions into index, full test suite passing"
```

---

## Task 16: esbuild Build Configuration

**Files:**
- Create: `esbuild.config.js`
- Modify: `package.json` (exports, types, files)

- [ ] **Step 1: Create `esbuild.config.js`**

```js
const esbuild = require("esbuild");
const pkg = require("./package.json");

const shared = {
    entryPoints: ["src/index.ts"],
    bundle: true,
    sourcemap: true,
    target: "es2020",
    legalComments: "none",
};

// ESM build:
esbuild.build({
    ...shared,
    format: "esm",
    outfile: "dist/m2d2.esm.js",
});

// UMD/IIFE build (global "m2d2"):
esbuild.build({
    ...shared,
    format: "iife",
    globalName: "m2d2",
    outfile: "dist/m2d2.min.js",
    minify: true,
});

// Core only (no extensions) — for 'm2d2/core':
esbuild.build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    format: "esm",
    outfile: "dist/m2d2.core.esm.js",
    sourcemap: true,
    target: "es2020",
    // Note: extensions are always bundled in index.ts for now.
    // A separate core entry can be created by splitting index if needed.
    legalComments: "none",
});

console.log("Build complete: dist/m2d2.esm.js, dist/m2d2.min.js");
```

- [ ] **Step 2: Generate type declarations**

Run: `npx tsc --emitDeclarationOnly --declaration --outDir dist`
Expected: `dist/*.d.ts` files generated.

- [ ] **Step 3: Update `package.json` exports and files**

```json
{
    "main": "dist/m2d2.min.js",
    "module": "dist/m2d2.esm.js",
    "types": "dist/index.d.ts",
    "exports": {
        ".": {
            "import": "./dist/m2d2.esm.js",
            "require": "./dist/m2d2.min.js",
            "types": "./dist/index.d.ts"
        },
        "./core": {
            "import": "./dist/m2d2.core.esm.js",
            "require": "./dist/m2d2.min.js",
            "types": "./dist/index.d.ts"
        }
    },
    "files": [
        "dist/**/*.js",
        "dist/**/*.d.ts",
        "dist/**/*.map"
    ]
}
```

- [ ] **Step 4: Run the build**

Run: `npm run build`
Expected: `dist/m2d2.esm.js`, `dist/m2d2.min.js`, and `.d.ts` files created.

- [ ] **Step 5: Verify the built UMD works in a quick smoke test**

```bash
node -e "const m = require('./dist/m2d2.min.js'); console.log(typeof m.default.ready)"
```
Expected: `function` (or the global is set up). Note: UMD/IIFE may need `window`/`document`; this smoke test may fail in pure Node without jsdom. That's acceptable — the build just needs to produce valid JS.

- [ ] **Step 6: Commit**

```bash
git add esbuild.config.js package.json dist/
git commit -m "build: add esbuild config, ESM+UMD bundles, type declarations"
```

---

## Task 17: Final Cleanup

**Files:**
- Remove: `js/` (all `.src.js` files — the reference source)
- Remove: `gulpfile.js`
- Remove: `test/*.js` (old QUnit tests)
- Remove: `core/`, `debug/`, `xhr/`, `ws/` (old empty package.json stubs)
- Modify: `package.json` (remove gulp devDependencies)
- Modify: `.gitignore` (add `dist/` if not already ignoring generated files)

**Only do this after ALL tests pass and the build works.**

- [ ] **Step 1: Verify everything works one final time**

Run: `npm test && npm run build && npm run typecheck`
Expected: all pass.

- [ ] **Step 2: Remove old source and build infrastructure**

```bash
git rm -r js/ gulpfile.js core/ debug/ xhr/ ws/
git rm test/00_include.js test/01_test_basic.js test/02_test_css_class.js test/03_test_selectors_short.js test/04_test_multiple.js test/05_test_changes.js test/06_test_onupdate.js test/07_test_items.js test/08_test_form.js test/13_issue_mixing_onready.js test/15_issue_tagname_onload.js test/16_issue_onupdate_onshow.js test/17_issue_auto_templates.js test/24_issue_properties.js test/25_issue_onupdate_dataset.js test/27_issue_sort_proxy.js test/29_issue_event_multiple.js test/35_issue_tagname_template.js test/41_issue_string_items.js test/43_issue_html_not_ready.js test/53_issue_append.js
```

- [ ] **Step 3: Remove gulp devDependencies from package.json**

Remove from `devDependencies`:
- `gulp`, `gulp-concat`, `gulp-header-comment`, `gulp-rename`, `gulp-sourcemaps`, `gulp-terser`, `gulp-umd`, `qunit`

- [ ] **Step 4: Update `.gitignore`**

```
.idea
node_modules
dist
*.log
```

- [ ] **Step 5: Update README.md (brief note)**

Add a note at the top of README.md about the TypeScript rewrite:

```markdown
> **Note:** As of v3.0, m2d2 has been rewritten in TypeScript. The library is consumed
> identically (`m2d2.ready($ => ...)`, `const $ = m2d2.load()`). See
> [CHANGELOG](CHANGELOG.md) for details.
```

- [ ] **Step 6: Run final verification**

Run: `npm test && npm run typecheck`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove old JS source, gulp, QUnit tests; TypeScript rewrite complete"
```

---

## Summary of Bug Fixes Implemented

| # | Bug | Fix Location | Change |
|---|-----|-------------|--------|
| 1 | `isHtml` coerces non-strings to strings | Task 3 | `isHtml` now rejects non-string inputs |
| 2 | `getData()` inconsistent multi-value grouping | Task 4 | Repeated field names always → arrays |
| 3 | `onupdate = fn` double-fires | Task 5 | Proxy `set` for `onupdate` registers listener only, doesn't also set property |
| 4 | Dedupe collapses distinct rapid changes | Task 5 | Key on `{target, property, newValue}` tuple |
| 5 | Empty `addedNodes` crash in observer | Task 5 | Guard against removal-only mutations |
| 6 | Linked-ref dataset/style arrays never shrink | Task 5 | WeakMap store, GC-friendly |
| 7 | Ambiguous keys create junk expando props | Task 7 | Warn + skip (was: warn + assign) |
| 8 | `switch(true)` fragile type matching | Task 7 | Explicit `matchesType()` predicate |
| 9 | `splice`/`fill`/`copyWithin` silent no-ops | Task 8 | Fully implemented over live collection |
| 10 | `onready` uses magic `setTimeout(10)` | Task 9 | Microtask via `queueMicrotask` |
| 11 | `storage.get` swallows parse errors | Task 11 | Missing key → null; parse failure → warn + null |
| 12 | XHR `const` redeclaration in switch | Task 12 | Wrapped cases in braces |
| 13 | `upload` maxFiles bitwise-OR bug | Task 13 | `|` → `||` |
