# M2D2

> **v3.0:** M2D2 has been rewritten in TypeScript. The library is consumed
> identically (`m2d2.ready($ => ...)`, `const $ = m2d2.load()`). See
> [CHANGELOG.md](CHANGELOG.md) for the documented behavior changes. All
> extensions (alert, lang, storage, xhr, upload, ws) are included.

[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)
[![Open Source Love](https://badges.frapsoft.com/os/v2/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)
[![npm version](https://badge.fury.io/js/m2d2.svg)](https://www.npmjs.com/package/m2d2)
[![npm downloads](https://img.shields.io/npm/dt/m2d2?color=C52)](https://www.npmjs.com/package/m2d2)
---
[Quick Start](documentation/quick.md) |
[Documentation](documentation/m2d2.md) |
[Recommendations](documentation/recommendations.md) |
[Install](#install) |
[Tutorial](#tutorial) |
[Examples](#live-demo)
---
Extensions: [Alerts](documentation/alert.md) |
[Language](documentation/lang.md) |
[Storage](documentation/storage.md) |
[XHR](documentation/xhr.md) |
[Upload](documentation/upload.md) |
[WebSocket](documentation/ws.md)
---
A class to easily place data in DOM and update them immediately upon change. It has no dependencies. It is similar to Angular, Vue, ReactJS and alike frameworks and shares some similarities with JQuery.

The main goal of this framework is to keep the HTML and JS pure and clean, without having to either setup rules in the HTML (like in Angular), use HTML templates inside Javascript like in React, or use mixed templates like Vue. 

If you know Javascript and HTML you pretty much know 98% of M2D2 already. 
Because of that, it has a small learning curve, so you don't need to spend hours trying to understand
how the framework works or how you can apply it to your work.

This framework can work together with any other as it is just pure Javascript. Although, once you use it, you will like how clean your code can be.

### Is M2D2 for you?

These are some reasons why you may be interested in using M2D2:

- [ ] I deploy mainly for modern browsers (no Internet Explorer, for example)
- [ ] I like to keep my HTML and my Javascript codes clean and simple
- [ ] I like Javascript, but I would like to update the HTML in an easier way
- [ ] I have used JQuery, but I want to make my code to react to value changes automatically
- [ ] I don't want to spend too much time in learning a new framework
- [ ] I really don't like to have all my code in a single file
- [ ] I have some JQuery or Javascript libraries that I would like to use
- [ ] I don't want very complicated codes to achieve simple things

If you checked one or more of the above boxes, M2D2 will suit you well.

### Framework/Library comparison:

| 		 		 	         | M2D2 | JQuery | Angular | ReactJS | Vue   |
|---------------------------|------|--------|---------|---------|-------|
| Size  		  			 | 19Kb | 88Kb   | 60Kb    | 166Kb   | 181Kb |
| Easy to learn   			 | Yes  | Yes    | No      | No      | No    |
| Clean and standard HTML 	 | Yes  | Yes    | No      | Yes     | No    |
| Clean Javascript    		 | Yes  | Yes    | Yes     | No      | Yes   |
| Good for small projects   | Yes  | Yes    | No      | Yes     | Yes   |
| Good for large projects   | Yes  | No     | Yes     | Yes     | Yes   |
| Observe object changes    | Yes  | No     | Yes     | Yes     | Yes   |
| Large community           | No   | Yes    | Yes     | Yes     | Yes   |

### Repositories (synchronized):

* https://gitlab.com/intellisrc/m2d2/
* https://github.com/intellisrc/m2d2/


## Hello World

---
```js
// When DOM is ready...
m2d2.ready($ => {
    // Place text in #myid :
    $(myid, "Hello World");
    
    // Then, change it into something else:
    myid.text = "Hola Mundo";
});
```

To better understand how M2D2 works, let's imagine you have this object:

```js
const user_data = {
    user_id : 1289943,
    first_name : "Beth",
    middle_name : "Eleonor",
    last_name : "Wilson",
    age : 35,
    emails : [
        "beth900@example.com",
        "beth.wilson@example.com"
    ]
}
```

Now, we want to place that information in this HTML:

```html
<div id="user">
    <div><span>ID:</span><span class="user_id"></span></div>
    <div><span>First Name:</span><span class="first_name"></span></div>
    <div><span>Middle Name:</span><span class="middle_name"></span></div>
    <div><span>Last Name:</span><span class="last_name"></span></div>
    <div><span>Age:</span><span class="age"></span></div>
    <div>
        <span>Emails:</span>
        <ul class="emails"></ul>
    </div>
</div>
```

This is what you need to code (for example: `user.js`):

```js
m2d2.ready($ => {
    const user = $("#user", user_data);
})
```

And that's it! ... But what if `user_info` doesn't match our HTML structure?

for example this one:

```html
<div id="user">
    <div><span>Name:</span><span class="name"></span></div>
    <div><span>Email:</span><span class="email"></span></div>
</div>
```

```js
m2d2.ready($ => {
    // Assuming we don't have empty fields (for simplicity)
    const user = $("#user", {
        dataset : { id : user_info.user_id }, // will create `data-id=` attribute in `#user`
        name  : user_info.first_name + " " + user_info.middle_name[0].toUpperCase() + ". " + user_info.last_name,
        email : user_info.emails[0]
    });
})
```

... and that's it! ... But what if you need to interact with it (using events) ?

```js
m2d2.ready($ => {
    const user = $("#user", {
        /* ... */
        email : {
            text : user_info.emails[0],
            onclick : function(ev) {
                window.location.href = "mailto:" + this.text;
            }
        }
    });
})
```

... and that's it! ... But what if ... ?

Read the documentation, try the tutorial or the examples:

### Quick Start:
[5 minute reading](documentation/quick.md)

### General Recommendations
[Best practices when using M2D2](documentation/recommendations.md)

### Tutorial:
[Learn it now](https://gl.githack.com/intellisrc/m2d2/raw/master/examples/index.html)

### Live Demo:
[Stand-alone html + js examples](https://gl.githack.com/intellisrc/m2d2/raw/master/examples/tests/index.html)

### Documentation:
[M2D2 Reference](documentation/m2d2.md)

## Install

---
You can use this library either with Web or NodeJS, Framework7, etc. 

### For the Web

#### Option 1 : Get M2D2 using npm / yarn

[npm web page](https://www.npmjs.com/package/m2d2) | [yarn web page](https://yarnpkg.com/package/m2d2)

> npm i m2d2

or

> yarn add m2d2

Then you will find the library files under `node_modules/m2d2/dist/` (more about this below).

#### Option 2 : Direct download

> All extensions included: [m2d2.min.js](https://gl.githack.com/intellisrc/m2d2/raw/master/dist/m2d2.min.js) — set it in the HTML head.

#### Option 3 : CDN

> [m2d2.min.js](https://cdn.jsdelivr.net/npm/m2d2@3/dist/m2d2.min.js)

To use it:

```js
m2d2.ready($ => {
    // your code here
});
```

### As Module

Using npm:

> npm i m2d2

Then you will use it something like:

```js
import m2d2 from 'm2d2';
const $ = m2d2.load();
```

The npm package includes full TypeScript type declarations (`.d.ts`).

You can use it [together with JQuery](documentation/m2d2.md#using-with-jquery), or [with Framework7](documentation/m2d2.md#using-with-framework7)
or any other framework of your choice.

## Extensions:

### Alert

---
This extension makes it easy to display alerts, confirmation, input dialogs and more.
Uses Unicode icons by default (no font dependency), with pluggable icon sources
(Material, Font Awesome, SVG) and modern CSS themes (light/dark).

Example:
```js
$.confirm("Are you sure?", "This is important", res => {
    if(res) {
        // Do something
    }
});
```

Configure once at startup:
```js
m2d2.alert.register({
    icons: "material",   // "default" | "material" | "fa" | "svg"
    theme: "dark",       // "light" | "dark"
    iconsOff: false      // disable icons entirely
});
```

[Learn about it](documentation/alert.md)

### Storage

------------
This extension provides an easy way to save and restore data into localStorage and sessionStorage.

Example:
```js
// Store something in the localStorage:
$.local.set("key", { age: 20 });
console.log($.local.get("key"));
```

[Try it](https://gl.githack.com/intellisrc/m2d2/raw/master/examples/extensions/storage.html)
or
[Learn about it](documentation/storage.md)

### Lang

---
With this extension you can handle multiple languages easily.

Example:
```js
$.lang('fr');
const _ = $.dict;
console.log(_("yes"));
```

[Try it](https://gl.githack.com/intellisrc/m2d2/raw/master/examples/extensions/lang.html)
or
[Learn about it](documentation/lang.md)

### XHR

---
This extension handles almost any kind of HTTP request to a server (e.g., GET, POST, PUT, DELETE, etc.)

Example:
```js
$.put("/my/url", { name : "Tony" }, res => {
    // res = response from server
});
```

[Try it](https://gl.githack.com/intellisrc/m2d2/raw/master/examples/extensions/xhr.html)
or
[Learn about it](documentation/xhr.md)

### Upload

---
This extension makes it easy to upload files to a server via XHR (included in XHR bundle).

Example:
```js
$("uploadFileButton", {
    onclick : function(event) {
        $.upload(event, {
            upload : "example.com/upload/",
            field  : "file",
            onDone : (response, allDone) => {
                console.log("Uploaded");
            }
        });
    }    
});
```

[Learn about it](documentation/upload.md)

### WS

---
This extension gives you an easy-to-use WebSocket client.

Example:
```js
$.ws.connect({
    host    : "example.com",
    path    : "ws/",
    secure  : true, // for wss://
    request : {} // initial request
}, json => {
    // json is the data received from server
    if(json.user) { /* ... */ }
});
// Send a message to server:
$.ws.request({
    user : { id : 1000 }
});
```

[Try it](https://gl.githack.com/intellisrc/m2d2/raw/master/examples/extensions/ws.html)
or
[Learn about it](documentation/ws.md)

## Bundles:

---
As of v3.0, there is a single bundle that includes core + all extensions
(alert, lang, storage, xhr, upload, ws). It is available in three formats:

| File | Format | Use case |
|------|--------|----------|
| `m2d2.min.js`  | IIFE (browser global `m2d2`) | `<script>` tag in HTML |
| `m2d2.cjs.js`  | CommonJS | `require()` in Node |
| `m2d2.esm.js`  | ESM | `import` in bundlers / Node ESM |

## Import:

---
```js
import m2d2 from 'm2d2';        // ESM — includes all extensions
const $ = m2d2.load();
```

```js
const m2d2 = require('m2d2');   // CommonJS
const $ = m2d2.load();
```

TypeScript types are included automatically (`dist/index.d.ts`).

## What's New in version 3.0:

---
M2D2 has been rewritten in TypeScript. The source is now modular (`src/` with
focused modules) and compiled to ESM, CJS, and a browser IIFE bundle with full
type declarations. The public API is unchanged. See
[CHANGELOG.md](CHANGELOG.md) for the complete list of bug fixes and behavior
changes.

The alert extension has been redesigned with a cleaner architecture:
pluggable icon sources (Unicode default, Material Symbols, Font Awesome, SVG),
modern CSS themes (light/dark via CSS variables), and a single configuration
point (`m2d2.alert.register({ icons, theme, ... })`).

## What's New in version 2.0:

---
This library was almost completely rewritten in v2.0. The main difference is that in 1.x, the M2D2 object was mainly a Proxy object which upon change, updated the DOM. However the main issue was that if you changed the DOM directly, there was no way to update the M2D2 object automatically, and thus could have side effects. In 2.x, the M2D2 object is a Node/HTMLElement wrapped around a Proxy and extended, which means that you can safely change the DOM directly without having side effects. Because now the M2D2 object is a DOM element, you have access to everything through vanilla javascript (like classList, appendChild, style, etc), which greatly simplified things.

# Developing

To modify or contribute to this code, start by cloning this repository.

Then execute: `npm install`

To build: `npm run build` (produces `dist/` — ESM, CJS, IIFE, and `.d.ts`)

To typecheck: `npm run typecheck`

To run all tests: `npm test` (Vitest + jsdom, terminal-based)

## Acknowledgments:

---
Developed with IntelliJ Ultimate Edition.
I would like to thank [JetBrains](https://jb.gg/OpenSource) for their support. 
