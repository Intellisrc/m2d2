# General Recommendations

To get the best of M2D2, I collected these recommendations based on my own
experience after using it in many (practically all) of my web projects:

## 1. Keep it simple

Try to keep your M2D2 object levels to a minimum, for example, if you have this:

```js
const office = $("#office", {
    text : "Office",
    areas : {
        text : "Areas",
        main : {
            text : "Main Area",
            server : {
                model : "ZH300"   
            }
        },
        sub : {
            text : "Sub Area",
            server : {
                model : "PPA144"
            }
        }
    }
});
```

... in order to change the main model name, you will use: `office.areas.main.server.model`, 
which is too long.<br> In such cases, I recommend you to divide your code into small parts:

```js
const office = $("#office", {
    text : "Office"
});
const areas = $("#office .areas", {
        text : "Areas"
});
const main = $("#main", {        
    text : "Main Area",
    server : {
        model : "ZH300"   
    }
});
const sub : $("#sub", {
    text : "Sub Area",
    server : {
        model : "PPA144"
    }
});
```
Now, to change the main model name, you use: `main.server.model`, which is more simple. 

Very deep objects (with many levels) makes the code more difficult to understand, more difficult
to test and more difficult to fix. Whenever you have more than 3 levels, think if you can simplify
it.

## 2. Split your code

One of the features that I like of M2D2 is that it is very easy to split your javascript code in small pieces.
In order to split your code, I highly recommend you to create one javascript file per object, 
so in the previous example you would have:
* office.js
* areas.js
* main.js
* sub.js

Then, use a tool/script to concat those files into one (specially if you are targeting web). You can use
[gulp](https://gulpjs.com) for that.

Just remember that you can import other objects into your current scope in this way:

```js
// office.js
m2d2.ready($ => {
    const office = $("#office", 
        text : "Office"
    });
});
```
```js
// areas.js
m2d2.ready($ => {
    const office = $("#office"); //import
    
    const areas = $("#office .areas", {
        text : "Areas",
        onclick : function(ev) {
            office.text = "Office : " + areas.text;
        }
    });
});

```

## 3. Always use `const`

In Javascript IDs (or elements with id) can be accessed directly, so you can call `office.text` without having to import it
first as long as the ID exists. However, I strongly recommend you to always use the declaration : 
`const myobj = $(...)` as it will save you many headaches. It helps you in these ways:

* Prevents accidental re-assignation of the variable (which can lead to different meaning)
* Prevents you to try to assign a value into a Node directly (when using [short assignment](m2d2.md#short-assign)).
* Prevents `window.*` properties to interfere with your code (for example: When using `#location` vs window.location)
* Allows you to use your constant inside some events in the object.

## 4. Use IDs when creating M2D2 objects

While M2D2 supports any selector, try always to use IDs if possible:

```js
const myobj = $("#myobj", { ... });
```

and avoid something like:
```js
const myobj = $("#main > .parent div", { ... }); // NOT RECOMMENDED
```

Why not?
* If your HTML structure changes, you will have to fix your code
* It is more complicated
* It will impact the rendering performance

## 4. Don't mimic your HTML

I recommend you to build your javascript code without almost looking at your HTML. 

If you have this HTML:
```html
<section id="office">
    <div>
        <a href=""></a>
    </div>
</section>
```
Is tempting to do something like this:
```js
const office = $("#office", {
    div : {
        a : {
            html : "Office <b>HERE</b>",
            href : "/office",
            onclick: function(ev) {
                // do something
            }
        }
    }
});
```

While this code is totally valid, it won't scale nice. Having tags as keys will limit you to have
the same in HTML structure. Whenever you change your HTML, your code will break. 

Instead:
* try to use more meaningful keys
* skip unnecessary wrapping
* move text into HTML
* avoid using HTML in your javascript files

This is better:
```js
const office = $("#office", {
    link : {
        onclick: function(ev) {
            // do something
            
        }
    }
});
```
And update your HTML as:

```html
<section id="office">
    <div>
        <a href="/office" class="link">Office <b>HERE</b></a>
    </div>
</section>
```
That way, you can change your HTML freely and your `office` object may not need to be updated.

If you are generating HTML for your M2D2 object, use `tagName` instead of using tags, for example:

```js
const office = $("#office", {
    details : {
        tagName : "div",
        css : "details",
        more : {
            tagName : "a",
            href : "#",
            onclick : function(ev) { ... }
        }    
    }
});
```

It is better to use: `office.details.more` than `office.div.a` (as you don't know what
kind of information may `div` or `a` hold). And again, if you decide to use a `span` element
instead of `div`, you don't need to update any reference to it.

## 5. When possible, prefer HTML

Because M2D2 allows you to generate HTML using Javascript, that doesn't mean that you should
create all your HTML using Javascript (unless you have a good reason for that). The more the
code used to generate your HTML, the more difficult it will be for you to maintain and to 
detect invalid nesting, etc. Also keep in mind that generating too much HTML may
also generate a lot of code, which will make your code unnecessarily more complex.

If you really need to generate a lot of HTML structures from Javascript, perhaps you could
create that HTML in advance and just show it or hide it as you need it.

Specially when using [templates](m2d2.md#templates), remember that you can use `<template>`
HTML code to create them, and you don't need to always create them in Javascript.

## 6. Avoid conflicting nomenclature

For the same reasons you don't use `class` as variable name, avoid using Node / HTMLElement
properties or HTML tag names as keys, for example, instead of: 

```html
<div id="office">
    <div class="title"></div>
</div>
```
```js
const office = $("#office", {
    title : "Office"
});
```
(because HTML elements have the 'title' property), Instead, use:
```html
<div id="office">
    <div class="heading"></div>
</div>
```
```js
const office = $("#office", {
    heading : "Office"
});
```

Even though M2D2 will try to handle many of conflicting cases, it might not be perfect and could
cause some unexpected behaviour.

I recommend you to read more on [how to solve nomenclature conflicts](m2d2.md#resolving-conflicts).

## 7. Prefer 'link references'

Whenever possible, prefer the use of [link references](m2d2.md#linked-references) instead of changing
other objects on event. Compare the following two examples:

Changing other objects on event (push):

```js
const office = $("#office", {
    number : 0
});

const manager = $("#manager", {
    dataset : {
        id : 0
    }
});

const trigger = $("#trigger", {
    oninput: function (ev) {
        office.number = this.value;
        manager.dataset.id = "man-" + this.value;
    }
})
```

Changing object when other changes: (pull == "linked reference")

```js
const office = $("#office", {
     number : [trigger, "value"]
});

const manager = $("#manager", {
     dataset : {
         id: [office, "number", (val) => {
             return "man-" + val
         }]
     }
});

const trigger = $("#trigger");
```

The main difference is that the logic around updating some value remains in the same object. In the "push"
example, `trigger` is in charge of updating `manager` and `office` (and must have access to them), while in the "pull"
(linked reference) example, each object has their own dependency, and `trigger` doesn't need to have access to any other object.

In other words, imagine if you have hundreds of files (or M2D2 objects), in the first example ("push"), if the "number" 
value in `office` is incorrect, it would be more difficult to figure out where that change was originated. While in the "pull" 
example, you immediately know that the value in `office.number` depends on `trigger.value`, which is easier to follow.

More about this in [Linked References](m2d2.md#linked-references)

## 8. Use normal functions on events

Arrow function expressions like : `() => { ... }`, may look cleaner and easier, but keep in mind
they [are not the same](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) 
as "normal functions" : `function() {}`.
For that reason, I recommend you to use always "normal functions" for events:

```html
<div id="office">
    <input type="text" name="manager" />
</div>
```
```js
const office = $("#office", {
    manager : {
        dataset: { id: 0 },
        oninput: function (ev) {
            console.log(this.dataset.id) 
        }
    },
    onload : function () {
        // Do something, then...
        this.manager.dataset.id = 100;
    }
})
```
If you use arrow function expressions you can't use `this`, so your code becomes:
```js
const office = $("#office", {
    manager : {
        dataset: { id: 0 },
        oninput: (ev) => {
            console.log(ev.target.dataset.id)
        }
    },
    onload : () => {
        // there is no easy way to access other parts of your object here
        // as `this` == `window`
        // you will have to use `onready`
    },
    onready : () => {
        office.manager.dataset.id = 100;
    }
})
```

There are more complications due to scopes when using arrow functions, so avoid them inside your M2D2 objects
unless you know exactly why you are doing it.

## 9. Use onload and onready

First, understand the differences between  [onload](m2d2.md#onload) and [onready](m2d2.md#onready).

These events are useful to keep you code better structured. Let's compare how the code looks without them and
how it looks with them:

```html
<div id="office">
    <select class="status">
        <option value="0">Closed</option>
        <option value="1">Open</option>
        <option value="2">Maintenance</option>
    </select>
</div>
```
Without `onload`:
```js
const office = $("#office", {
    text : "My Office",
})
office.select.focus();
```
With `onload`:
```js
const office = $("#office", {
    text : "My Office",
    select : 1,
    onload : function () {
        this.select.focus();
    }
})
```

While is not a big change, the code is cleaner. That also allows you to use M2D2 objects without having to assign them
to a variable or constant (for quick or temporally objects).

## 10. Add custom functions

Similar to the advantages of using `onload` and `onready`, I recommend you to attach your custom functions into your
M2D2 objects. Keep in mind the nomenclature. Let's again compare the two alternatives:

```js
m2d2.ready($ => {
    function updateOffice(newManager) {
        office.manager.name = newManager
    }
    const office = $("#office", {
        manager : {
            name : "Jan Tompkins",
            onclick : function (ev) {
                $.get("/get/current/manager", response => {
                    updateOffice(response.manager.name);
                });
            }
        }
    });
})
```

Now, let's compare it with (improved version):

```js
m2d2.ready($ => {
    const office = $("#office", {
        manager : {
            name : "Jan Tompkins",
            onclick : function (ev) {
                $.get("/get/current/manager", response => {
                    office.update(response.manager.name);
                });
            }
        },
        update : function (newManager) {
            this.manager.name = newManager
        }
    });
})
```

The main advantage is that you can use : `ofice.update()` anywhere you want. The first way (with the function
outside the object), is preferable if you want to keep that function `private`.

## 11. Extend M2D2

Instead of creating global functions, I recommend you to attach those functions into the M2D2 instance as 
[extension](m2d2.md#extending), for example:

```js
// Here we don't use 'ready', we use 'load' (before DOM is ready)
m2d2.load($ => {
    $.myProperty = false;
    $.mySuperFunction = (options) => {
        // Do something here
    }
})
```

Later, you can use that function as:

```js
m2d2.ready($ => {
    const office = $("#office", {
        onclick : function (ev) {
            if($.myProperty) {
                $.mySuperFunction({ ... });
            }
        }
    }) 
});
```

This way, you don't pollute the global scope. Just be careful not to override any [other extension](m2d2.md#extensions) 
or properties already set in the M2D2 instance (for example, see [Utils](m2d2.md#utils)).