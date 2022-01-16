# M2D2.JS 

A class to easily place data in DOM and update them immediately upon change. It has no dependencies. It is similar to Angular, Vue, ReactJS and alike frameworks and shares some similarities with JQuery.

The main goal of this framework is to keep the HTML and JS pure and clean, without having to either setup rules in the HTML (like in Angular), use HTML templates inside Javascript like in React, or use mixed templates like Vue. 

If you know Javascript and HTML you pretty much know 98% of M2D2 already. 
Because of that, it has a small learning curve, so you don't need to spend hours trying to understand
how the framework works or how you can apply it to your work.

This framework can work together with any other as it is just pure Javascript. Although, once you use it, you will like how clean your code can be.

Framework/Library comparison:

|        		 		 	| M2D2 | JQuery | Angular | ReactJS | Vue   |
| ------------------------- | ---- | ------ | ------- | ------- | ----- |
| Size  		  			| 19Kb |  88Kb  |  60Kb   | 166Kb   | 181Kb |
| Easy to learn   			|  Yes |  Yes   |   No    |   No    |  No   |
| Clean and standard HTML 	|  Yes |  Yes   |   No    |   Yes   |  No   |
| Clean Javascript    		|  Yes |  Yes   |   Yes   |   No    |  Yes  |
| Good for small projects   |  Yes |  Yes   |   No    |   Yes   |  Yes  |
| Good for large projects   |  Yes |  No    |   Yes   |   Yes   |  Yes  |
| Observe object changes    |  Yes |  No    |   Yes   |   Yes   |  Yes  |
| Large community           |  No  |  Yes   |   Yes   |   Yes   |  Yes  |

Repositories (synchronized):

* https://gitlab.com/lepe/m2d2/
* https://github.com/lepe/m2d2/


## Hello World

```js
// When DOM is ready...
m2d2.ready($ => {
    // Place text in #myid :
    $(myid, "Hello World");
    
    // Then, change it into something else:
    myid.text = "Hola Mundo";
});
```

## Tutorial:
[Learn it Now](https://gl.githack.com/lepe/m2d2/raw/master/examples/tutorial.html)

## Live Demo:
[Try it Now](https://gl.githack.com/lepe/m2d2/raw/master/examples/examples.html)

[Stand-alone examples](https://gl.githack.com/lepe/m2d2/raw/master/examples/tests/index.html)

## Install:

You can use this library either with Web or NodeJS, Framework7, etc. 

### For the Web

* Using npm:

`npm i m2d2`

Then you will find the library files under `node_modules/m2d2/dist/` (more about this below).

* Direct download:

Core Only (~19Kb): [m2d2.min.js](https://gl.githack.com/lepe/m2d2/raw/master/dist/m2d2.min.js) and set it in the HTML head.
With all extensions (~29Kb): [m2d2.min.js](https://gl.githack.com/lepe/m2d2/raw/master/dist/m2d2.bundle.min.js) and set it in the HTML head.

* CDN:

Core Only: [m2d2.min.js](https://cdn.jsdelivr.net/npm/m2d2@2.1.0/dist/m2d2.min.js)

With all extensions: [m2d2.bundle.min.js](https://cdn.jsdelivr.net/npm/m2d2@2.1.0/dist/m2d2.bundle.min.js)

### As Module

* Using npm:

`npm i m2d2`

Then you will use it something like:

```js
import m2d2 from 'm2d2';
const $ = m2d2.load();
```

## Extensions:

* Alert

This extension makes it easy to display alerts, confirmation, input dialogs and more.

Example:
```js
$.confirm("Are you sure?", "This is important", res => {
    if(res) {
        // Do something
    }
});
```

* Storage

This extension provides an easy way to save and restore data into localStorage and sessionStorage.

Example:
```js
// Store something in the localStorage:
$.local.set("key", { age: 20 });
console.log($.local.get("key"));
```

* Lang

With this extension you can handle multiple languages easily.

Example:
```js
$.lang('fr');
const _ = $.dict;
console.log(_("yes"));
```

* XHR

This extension handles almost any kind of HTTP request to a server (e.g., GET, POST, PUT, DELETE, etc.)

Example:
```js
$.put("/my/url", { name : "Tony" }, res => {
    // res = response from server
});
```

* WS

This extension gives you an easy-to-use WebSocket client.

Example:
```js
$.ws.connect({
    host    : "example.com",
    secure  : true,
    path    : "ws/"
}, json => {
    // json is the data received from server
});
$.ws.request({
    user : { id : 1000 }
});
```

## Bundle Packs:

For your convenience, there are some minimized files included in each release (you can find them under `dist/` directory if you install via `npm` or download them clicking on the file name):

|        		 		 	| Core | Alert  | Storage | Lang    | XHR   |  WS   |  Size |
| ------------------------- | ---- | ------ | ------- | ------- | ----- | ----- | ----- |
| [m2d2.min.js](https://gl.githack.com/lepe/m2d2/raw/master/dist/m2d2.min.js)		  		| Yes  | No     |   No    | No      | No    | No    |  19K  |
| [m2d2.bundle.xhr.min.js](https://gl.githack.com/lepe/m2d2/raw/master/dist/m2d2.bundle.xhr.min.js)	| Yes  | Yes    |   Yes   | Yes     | Yes   | No    |  28K  |
| [m2d2.bundle.ws.min.js](https://gl.githack.com/lepe/m2d2/raw/master/dist/m2d2.bundle.ws.min.js)		| Yes  | Yes    |   Yes   | Yes     | No    | Yes   |  27K  |
| [m2d2.bundle.min.js](https://gl.githack.com/lepe/m2d2/raw/master/dist/m2d2.bundle.min.js)		| Yes  | Yes    |   Yes   | Yes     | Yes   | Yes   |  29K  |

## Import:

You can import M2D2 in this way:

```js
import m2d2 from 'm2d2'         // You get m2d2.bundle.min.js
import m2d2 from 'm2d2/core'    // You get m2d2.min.js
import m2d2 from 'm2d2/ws'      // You get m2d2.bundle.ws.min.js
import m2d2 from 'm2d2/xhr'     // You get m2d2.bundle.xhr.min.js
```

## What's New in version 2.0:

This library was almost completely rewritten in v2.0. The main difference is that in 1.x, the M2D2 object was mainly a Proxy object which upon change, updated the DOM. However the main issue was that if you changed the DOM directly, there was no way to update the M2D2 object automatically, and thus could have side effects. In 2.x, the M2D2 object is a Node/HTMLElement wrapped around a Proxy and extended, which means that you can safely change the DOM directly without having side effects. Because now the M2D2 object is a DOM element, you have access to everything through vanilla javascript (like classList, appendChild, style, etc), which greatly simplified things.

Other big difference with v2.0 is that you can split your code across several small files in a very easy way (very useful if you use tools like 'gulp' to concatenate and minify your code).

## Acknowledgments:

Developed with IntelliJ Ultimate Edition.
I would like to thank [JetBrains](https://jb.gg/OpenSource) for their support. 
