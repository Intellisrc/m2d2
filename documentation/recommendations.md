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

I recommend you to build your javascript code without almost looking at your HTML. Is tempting
to do something like this:

```html
<section id="office">
    <div>
        <a href=""></a>
    </div>
</section>
```
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

## 5. Avoid conflicting nomenclature

## 5. Use function on events

## 5. Add custom functions


## 6. Prefer 'link references'


## 7. Use onready and onload