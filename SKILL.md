---
name: m2d2
description: Reactive JavaScript framework for web UI with automatic DOM updates. Activate when working with m2d2 library, creating reactive components, data binding, form handling, list templates, or using m2d2 extensions (alert, xhr, storage, lang, ws, upload). Keywords: m2d2, reactive, dom, binding, proxy, template, linked references.
compatibility: Modern browsers with Proxy and MutationObserver support. Node.js via CommonJS/ESM. TypeScript with bundled .d.ts declarations.
---

# M2D2 Agent Skill

## Boundaries & Constraints

**DO NOT:**
- Use arrow functions `() => {}` for event handlers—always use `function() {}` to preserve `this` context
- Create deeply nested objects (>3 levels)—split into separate objects
- Use HTML tag names as object keys (e.g., `div`, `a`, `span`)—use semantic names instead
- Use complex CSS selectors for object creation—prefer simple IDs
- Read short-assignment properties without full path (e.g., `user.name` returns HTMLElement, use `user.name.text`)
- Mix push and pull patterns for reactive updates—prefer linked references
- Generate HTML structure in JavaScript when static HTML exists
- Use `var` declarations—always use `const`

**MUST:**
- Verify HTML structure exists before binding if using IDs
- Use `const` for all m2d2 object declarations
- Call `m2d2.ready()` for DOM-dependent code
- Use `m2d2.load()` for extensions and global functions
- Prefer `$(selector)` for importing existing elements without reinitialization

## Structural Overview

### Core Modules (src/)
```
src/
├── index.ts           # Entry point, exports m2d2 namespace
├── factory.ts         # Core $() factory function
├── reactivity.ts      # Proxy wrapper, dispatchUpdate, observe
├── binding.ts         # Data coercion and element binding
├── dom.ts             # DOM extension methods (find, findAll, text, html)
├── template.ts        # Template and items processing
├── items.ts           # Array-like list collection
├── locator.ts         # Element linking and location
├── utils.ts           # Type checking utilities
└── extensions/        # All extensions bundled in main distribution
```

### Distribution Formats (dist/)
- `m2d2.min.js` — IIFE (browser global `m2d2`)
- `m2d2.cjs.js` — CommonJS (`require('m2d2')`)
- `m2d2.esm.js` — ESM (`import m2d2 from 'm2d2'`)
- `index.d.ts` — TypeScript declarations

### Core API Surface
- `m2d2.ready($ => {})` — DOM-ready initialization
- `m2d2.load($ => {})` — Pre-DOM extension loading
- `$(selector, data)` — Element creation/import
- `$(data)` — Fragment creation (no DOM attachment)

### Extensions (All Included)
- `$.alert`, `$.confirm`, `$.prompt` — Modal dialogs
- `$.get`, `$.post`, `$.put`, `$.delete` — HTTP requests
- `$.local`, `$.session` — Storage wrappers
- `$.lang`, `$.dict` — Internationalization
- `$.ws.connect`, `$.ws.request` — WebSocket client
- `$.upload` — File upload via XHR

## Task-Oriented Workflows

### Creating Reactive Components

**IF** creating a UI component **THEN**:
1. Use `m2d2.ready($ => {})` wrapper
2. Declare with `const element = $("#id", {...})`
3. Use meaningful keys, not tag names
4. Set `css` property for classes, not `className`
5. Use `function() {}` for all event handlers

```javascript
m2d2.ready($ => {
    const user = $("#user", {
        username: "john",
        onclick: function(ev) { console.log(this.text); }
    });
});
```

### Implementing Reactive Data Binding

**IF** multiple elements need to sync **THEN** use linked references:

```javascript
// Pattern 1: Direct property link
dest.prop = [source, "value"]

// Pattern 2: With transformation
dest.prop = [source, "value", (val) => transform(val)]

// Pattern 3: Dataset/style linking
dest.dataset.id = [source.dataset, "uid"]
```

**DO NOT** manually update in event handlers (push pattern).

### Working with Forms

**IF** handling form submission **THEN**:
1. Set `onsubmit` handler returning `false`
2. Call `this.getData()` for validated data
3. Use `this.getData(true)` to include hidden fields

```javascript
const form = $("#form", {
    username: { required: true, pattern: "[a-z0-9]+" },
    onsubmit: function(ev) {
        const data = this.getData();
        // process data
        return false;
    }
});
```

### Creating Dynamic Lists

**IF** rendering list items **THEN**:
1. For small lists (<100 items): use `items.push()`
2. For large lists (1000+ items): build array first, then assign

```javascript
// Small lists
list.items.push({ name: "Item" });

// Large lists (performance critical)
const tmp = [];
for(let i = 0; i < 10000; i++) tmp.push({ id: i });
list.items = tmp;  // Single assignment
```

### Using Templates

**IF** defining list structure **THEN** prefer HTML templates:

```html
<div id="users">
    <template>
        <div class="user">
            <span class="name"></span>
        </div>
    </template>
</div>
```

**OR** JavaScript template for dynamic structures:

```javascript
const users = $("#users", {
    template: {
        div: {
            css: "user",
            name: { tagName: "span", css: "name" }
        }
    }
});
```

### Handling Extensions

**IF** using alert dialogs **THEN** configure once at startup:

```javascript
m2d2.alert.register({ icons: "material", theme: "dark" });
```

**IF** making HTTP requests **THEN** use flexible argument order:

```javascript
$.get(url, data, callback, error, json, timeout);
// All args optional except url, order flexible
```

**IF** using WebSocket **THEN** connect with callback:

```javascript
$.ws.connect({ host: "x.com", path: "ws/", secure: true }, msg => {
    // Handle incoming messages
});
```

### Importing Existing Elements

**IF** element already initialized **THEN** import without data:

```javascript
const existing = $("#element-id");  // Import only
existing.name = "Updated";  // Now reactive
```

## Failure Modes & Checkpoints

### Property Not Updating

**Symptom:** `obj.prop = value` doesn't update DOM

**Recovery:**
1. Verify element exists in DOM before binding
2. Use full property path: `obj.prop.text` for reading, `obj.prop = val` for setting
3. Check `m2d2.updates` is not disabled
4. Verify not using reserved property name (title, id, class, etc.)

### Event Handler Not Firing

**Symptom:** `onclick` or other events silent

**Recovery:**
1. Verify using `function() {}` not arrow function
2. Check `this` context refers to expected element
3. Ensure element is not recreated (loses handlers)
4. Use `onload` for setup, `onready` for post-render actions

### Linked Reference Not Working

**Symptom:** `[source, "prop"]` not syncing

**Recovery:**
1. Verify source is m2d2 object or `$(...)` fragment
2. Check property name is string, not variable
3. Ensure `m2d2.updates` is enabled (default true)
4. Verify no circular references in chain

### Template Items Not Rendering

**Symptom:** `items` array empty or not displaying

**Recovery:**
1. Check template structure matches items data keys
2. For HTML templates, verify `<template>` tag exists
3. Use `items.clear()` before reassigning
4. Verify items are objects, not primitives (unless string items)

### Form Validation Failing

**Symptom:** `getData()` returns null or undefined

**Recovery:**
1. Check `required`, `pattern` attributes on inputs
2. Verify form has valid `name` attributes
3. Ensure `onsubmit` returns `false` to prevent reload
4. Use browser DevTools to check validity state

### Performance Issues

**Symptom:** Slow rendering with large datasets

**Recovery:**
1. For lists >1000 items: batch build array, assign once
2. Disable short assignment if not needed: `m2d2.short = false`
3. Reduce object nesting depth
4. Use `import` pattern instead of re-binding

### Browser Compatibility Issues

**Symptom:** Proxy or MutationObserver errors

**Recovery:**
1. Check browser supports ES6 Proxy (no IE)
2. Disable short assignment: `m2d2.short = false`
3. Disable updates: `m2d2.updates = false`
4. Verify modern browser target in project

### Naming Conflicts

**Symptom:** Property not accessible, logs `$prop` warning

**Recovery:**
1. Avoid reserved names: `title`, `id`, `class`, `style`, `src`, `href`
2. Use semantic prefixes: `userTitle`, `itemId`, `rowClass`
3. Access conflicted property via `obj.$prop`
4. Rename HTML class/id to avoid conflict

### TypeScript Type Errors

**Symptom:** Type mismatches with m2d2 objects

**Recovery:**
1. Import types from `dist/index.d.ts`
2. Use `M2d2Node` type for extended elements
3. Type custom extensions on `$` object
4. Verify `module: "esnext"` in tsconfig for ESM

## Quick Reference Commands

### Development
```bash
npm install           # Install dependencies
npm run build         # Build all dist formats
npm run typecheck     # TypeScript validation
npm test              # Run Vitest test suite
```

### Key Patterns
```javascript
// Component creation
m2d2.ready($ => { const el = $("#id", {}); });

// Extension loading
m2d2.load($ => { $.fn = () => {}; });

// Linked reference
dest.prop = [source, "value"];

// List operations
list.items.clear();
list.items.push({});
list.items = [...array];  // Batch assign

// Form data
const data = form.getData();
```

## Documentation Index

- `README.md` — Overview and installation
- `documentation/m2d2.md` — Complete API reference
- `documentation/quick.md` — 5-minute tutorial
- `documentation/recommendations.md` — Best practices
- `documentation/alert.md` — Alert extension API
- `documentation/xhr.md` — HTTP request methods
- `documentation/storage.md` — Storage API
- `documentation/lang.md` — Internationalization
- `documentation/ws.md` — WebSocket client
- `documentation/upload.md` — File upload
