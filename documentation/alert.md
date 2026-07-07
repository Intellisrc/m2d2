# M2D2 Alerts Extension

A modern replacement for `alert`, `prompt` and `confirm`. Inspired by SweetAlert,
with pluggable icons, CSS-variable theming, and seamless m2d2 integration.

No font dependency by default — uses Unicode/emoji icons that work everywhere.

## Quick Start

Load the alert CSS (any theme) in your HTML head:
```html
<link rel="stylesheet" href="dist/alert.css" />
<link rel="stylesheet" href="dist/alert-light.css" />  <!-- or alert-dark.css -->
```

Then use any entry point:
```js
m2d2.ready($ => {
    $.alert("Hello!", "This is a message.");
    $.confirm("Delete?", "Are you sure?", res => {
        if (res) { /* confirmed */ }
    });
});
```

## Entry Points

All entry points are unchanged from previous versions — existing code works
without modification:

| Function | Icon | Buttons | Use case |
|----------|------|---------|----------|
| `$.wait(title, text?, callback?)` | ⏳ | none | Spinner / loading indicator |
| `$.alert(title, text?, callback?)` | ⓘ | ok | Informational message |
| `$.success(title, text?, callback?)` | ✓ | ok | Success confirmation |
| `$.failure(title, text?, callback?)` | ⚠ | ok | Error message |
| `$.confirm(title, text?, callback?)` | ? | yes, no | Confirmation dialog |
| `$.prompt(title, text?, callback?)` | ✎ | cancel, send | Input dialog |
| `$.message(options)` | * | * | Free-form (the others wrap this) |
| `$.closeAll()` | — | — | Close any open alert |

The callback receives two arguments:
- **First**: the simplest return value (`true`/`false`/`null` for confirm; the
  field value for prompt; the full data object for custom buttons).
- **Second**: the form data as an object (e.g. `{ button: "send", answer: "Hello" }`).

## Configuration

Configure the alert extension once at startup:

```js
m2d2.alert.register({
    icons: "default",   // "default" | "material" | "fa" | "svg" | AlertIconSource
    theme: "light",     // "light" | "dark" (sets data-theme on <html>)
    iconsOff: false,    // true = no icon rendered at all
    dict: { ok: "OK" }, // override button text (e.g. for i18n)
    css: "my-class",    // extra CSS class(es) on every alert
    closeDuration: 400  // close animation duration in ms
});
```

### Disabling Icons

```js
m2d2.alert.register({ iconsOff: true });
```

## Icon Sources

Icons are pluggable. Four sources ship with m2d2:

### Default (Unicode/emoji)
No font needed. Works everywhere out of the box.
```js
m2d2.alert.register({ icons: "default" });
```

| Type | Icon |
|------|------|
| question | ? |
| info | ⓘ |
| error | ⚠ |
| ok | ✓ |
| input | ✎ |
| wait | ⏳ |

### Material Symbols
Requires [Google Material Symbols](https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined):
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
```
```js
m2d2.alert.register({ icons: "material" });
```

### Font Awesome
Requires [Font Awesome](https://fontawesome.com):
```js
m2d2.alert.register({ icons: "fa" });
```

### SVG (inline)
No font dependency. Renders inline Feather-style SVGs:
```js
m2d2.alert.register({ icons: "svg" });
```

### Custom Icon Source
You can define your own:
```js
const myIcons = {
    name: "custom",
    wrap: false,              // parent class, or false
    icons: {
        question: "❓",
        info: "ℹ️",
        error: "❌",
        ok: "🎉",
        input: "📝",
        wait: "⌛"
    }
};
m2d2.alert.registerIcons("custom", myIcons);
m2d2.alert.register({ icons: "custom" });
```

### Per-call Icon Overrides
Override icons for a single message:
```js
$.message({
    icon: "warn",
    icons: { warn: "🚨" },   // add a custom icon for this call only
    title: "Warning!",
    text: "Something happened."
});
```

### Backward Compatibility: `$.messageIcons`
The legacy `$.messageIcons` setter still works (updates the active source):
```js
$.messageIcons = "material";  // equivalent to m2d2.alert.register({ icons: "material" })
```

## Themes

Themes use CSS variables (`--alert-*`). The structural CSS is icon-independent
and theme-independent — themes only define colors.

### Loading a theme

```html
<!-- Structural CSS (required) -->
<link rel="stylesheet" href="alert.css" />
<!-- Pick one theme: -->
<link rel="stylesheet" href="alert-light.css" />
<!-- or -->
<link rel="stylesheet" href="alert-dark.css" />
```

### Switching theme at runtime

```js
// Via the register API:
m2d2.alert.register({ theme: "dark" });

// Or directly on <html>:
document.documentElement.dataset.theme = "dark";
```

### Dark mode auto-detection
`alert-dark.css` includes a `@media (prefers-color-scheme: dark)` rule that
auto-applies the dark theme when the user's OS is in dark mode (unless
`data-theme="light"` is explicitly set).

### Available CSS Variables

| Variable | Description |
|----------|-------------|
| `--alert-back` | Backdrop overlay color |
| `--alert-front-bg` | Dialog background |
| `--alert-front-fg` | Dialog text color |
| `--alert-title-fg` | Title text color |
| `--alert-text-fg` | Body text color |
| `--alert-icon-fg` | Default icon color (overridden by per-type colors) |
| `--alert-border` | Border color |
| `--alert-shadow` | Box shadow |
| `--alert-button-bg` | Button background |
| `--alert-button-fg` | Button text color |
| `--alert-button-hover-bg` | Button hover background |
| `--alert-ok` | "ok"/"yes" accent color |
| `--alert-error` | Error/no accent color |
| `--alert-question` | Question accent color |
| `--alert-info` | Info/send accent color |
| `--alert-input` | Input accent color |
| `--alert-wait` | Wait accent color |
| `--alert-radius` | Dialog border radius |
| `--alert-radius-sm` | Input/button border radius |
| `--alert-padding` | Dialog padding |
| `--alert-max-width` | Dialog max width |
| `--alert-font` | Font family |
| `--alert-animation` | Animation duration |
| `--alert-easing` | Animation easing function |

### Custom theme
Define your own variables to create a custom theme without touching the CSS:
```css
:root {
    --alert-front-bg: #fef3c7;
    --alert-title-fg: #78350f;
    --alert-ok: #059669;
    /* ... override any variables you want ... */
}
```

## Advanced: $.message

The free-form `$.message` accepts all options:

```js
$.message({
    icon: "info",            // OPTIONAL: "question", "info", "error", "ok", "input", "wait", or custom
    css: "special",          // extra CSS class(es)
    title: "Title",
    text: "Body text",       // string, or object for custom form fields
    buttons: ["No way!", "Roger"],  // custom button labels
    callback: (result, data) => { /* ... */ },
    icons: { warn: "🚨" }    // per-call icon overrides
});
```

### Custom form fields

Pass an object as `text` to render custom form fields:
```js
$.prompt("Select your country:", {
    select: ["USA", "Canada", "Mexico"]
}, (res, raw) => {
    console.log("Country:", res);
});
```

## Examples

### $.wait
```js
const waitMsg = $.wait("Please wait...");
setTimeout(() => {
    waitMsg.close(() => {
        $.success("Done!");
    });
}, 2000);
```

### $.confirm
```js
$.confirm("Are you sure?", "You are about to delete all images!", res => {
    if (res) { console.log("Deleted!"); }
});
```

### $.prompt
```js
$.prompt("Please enter your name:", res => {
    console.log("Name:", res);
});
```
