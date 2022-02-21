# Quick Start

---
(Read time: 5min)

Any project (UI) is conformed of several parts. For example, if your system has a `profile` section, it will likely
be formed of `username`, `fullname`, `email`, etc.

That section will be displayed on a browser using HTML. You have 3 options for that:

1. Create the structure in HTML and place the user's specific data on top of it.
2. Generate the HTML structure and data using M2D2 (without almost any HTML).
3. Something in between: Some structure in HTML and some in M2D2.

Which one do we recommend? In most of the cases the first option is easier to implement, but it will depend on your
project needs to choose the best option.

Let's see each option how they compare:

### 1. HTML Structure

```html
<div id="user">
    <img class="avatar" src="/img/dummy.png" />
    <div class="info">
        <div class="username">dummy</div>
        <div class="fullname">Dummy Dummy</div>
        <div class="email">dummy@example.com</div>
    </div>
</div>
```
```js
m2d2.ready($ => {
    // M2D2 will find the element you specify no matter the structure of your HTML
    const user = $("#user", {
        avatar   : "https://avatar.example.com/john.doe1.png",
        username : "john.doe1",
        fullname : "John Doe",
        email    : "john.doe@example.com"
    });
});
```
The advantage of this option is that you can work with the design and the logic separately. It doesn't matter which
elements or structure you have under `#user` as long as they have either the class-names or the ids that represent your data.

NOTE: M2D2 will automatically try to guess the property *assigned*, for example:<br>
`user.email = "john@example.com"`
is the same as: <br>
`user.email.text = "john@example.com`. <br>
However, if you want to read the property, you have to use the full annotation: `user.email.text` (as without it
you will be getting the `Node`).

### 2. Structure in M2D2

```html
<div id="user"></div>
```

```js
m2d2.ready($ => {
    // This is the way you can build any HTML structure from M2D2:
    const user = $("#user", {
        avatar : {
            tagName : "img",
            css : "avatar"
        },
        info : {
            tagName : "div",
            username : {
                tagName : "div",
                css     : "username"
            },
            fullname : {
                tagName : "div",
                css     : "fullname"
            },
            email    : {
                tagName : "div",
                css     : "email"
            }
        },
        update : function (data) {
            $(this, data);
        }
    });
    // Then later (similar as Option 1): 
    user.update({
        avatar   : "https://avatar.example.com/john.doe1.png",
        username : "john.doe1",
        fullname : "John Doe",
        email    : "john.doe@example.com"
    });
});
```

In this option, you have full control in javascript how the section will be displayed. One advantage is that your HTML
is greatly simplified to its minimum, which gives you the flexibility to generate different kinds of structures 
depending on your data without making your HTML complicated.

### 3. Something in between

It is not hard to imagine a scenario in which you may want to keep some structure fixed and other part of it more flexible,
in such cases "something in between" could be the best option. The most common case for this is when we use templates
to generate a list of elements on the fly:

```html
<div id="users">
    <h3>Users:</h3>
    <ul class="list"></ul>
</div>
```

```js
m2d2.ready($ => {
   const users = $("#users", {
       list : {
           // `template` is a special keyword
           template : {
              li : {
                  css : "user",
                  title : "click here",
                  img : {
                      css : "avatar",
                  },
                  username : {
                      tagName : "span",
                      css : "username"
                  },
                  fullname : {
                      tagName : "b",
                      css : "fullname"
                  },
                  email: {
                      tagName : "i",
                      css : "email"
                  },
                  button : {
                      css : "delete",
                      onclick : function (ev) {
                          // delete user
                      }
                  }
              } 
           },
           // `items` is a special keyword and it is optional when `template` is set and viceversa
           items : [] 
       },
       // you can assign custom functions associated with it
       update : function (data) {
           this.list.items.clear();
           data.forEach(item => {
               this.list.items.push(item);
           })
       },
       // onready is triggered when the object has been rendered
       onready : function () {
           $.get("/api/users", res => {
               users.update(res); 
           });
       }
   });
});
```
NOTE: `$.get` is from [XHR Extension](xhr.md).

In this example, we get a list of users and display each one in a specific way. Part of the structure is fixed in HTML,
and the other part is dynamic using M2D2 templates.

## Observing object changes

In many cases an object may depend on other object values. For example, if you have a `basic` account type, and you add
extra features to it (pro version). In that case, the `pro` version depends on the `basic` version. In order to update
the `pro` information, you can either "push" the `basic` changes into the `pro` object, or you can pull the `basic` 
changes from the `pro` object.

Let's see both cases:

```html
<section id="basic">
    <span>Nickname: </span>
    <input type="text" name="nickname" value="" />
</section>
<section id="pro">
    <div class="nickname"></div>
    <div>Number of Licenses: <span class="licenses">0</span></div>
</section>
```

Task: If the object `basic` is modified, you will update the `pro` object.

### Pushing changes from `basic` into `pro`: 

This is they way you will do it if you use `JQuery`. This works by pushing your changes into all the affected parts.
The advantage is that it is easier to understand, but the complex a project becomes, the harder is to track changes.
Another disadvantage is that dependencies are reversed, it means, that `basic` needs to know about `pro`.

```js
// basic.js
m2d2.ready($ => {
    const pro = $("#pro"); // import `pro`
    
    const basic = $("#basic", {
        nickname : {
            // this is the event which triggers the change:
            oninput : function(ev) {
                // changes are "pushed" into `pro`
                pro.nickname.text = this.value;
            }
        }
    });
});
```

```js
// pro.js
m2d2.ready($ => {
    const pro = $("#pro", {
        nickname : $.local.get("user.nickname"), // <-- default value from LocalStorage (just an example)
        licenses : 1
    });
});
```
Note:  `$.local` is an [extension to use LocalStorage](storage.md)

### Pulling `basic` changes from `pro`:

This is the way `Angular`, `React`, `Vue` and similar works. Instead of pushing the changes, they are "pulled" (or more
correctly, observed and then applied), I call it "linked reference". The advantage is that all changes related to a 
single object are done in one place, so if something is not rendered correctly, it is easier to find out. 

In our example, it is more natural that `pro` requires `basic`, and that `basic` no need to know about `pro` existence:

```js
// basic.js
m2d2.ready($ => {
    const basic = $("#basic", {
        nickname : ""
    });
});
```

```js
// pro.js
m2d2.ready($ => {
    const basic = $("#basic"); // import `basic`
    
    const pro = $("#pro", {
        nickname : [ basic.nickname, 'value' ], // <-- we are using 'value' here as basic.nickname is an `input` element.
        licenses : 1
    });
});
```

Whenever `basic.nickname.value` changes, `pro.nickname.text` will be updated. 
In order this "magic" to work, you need to assign an array with its first element, a `Node` and the second
element a `string` (property to observe). 

You can use this "linked reference" to modify and observe dataset and style changes as well, or use a callback function
to update the value before is updated, for example
(more on this in [the documentation](m2d2.md#linked-references)):

```js
m2d2.ready($ => {
    const user = $("#user", {
        dataset : {
            uid : 100
        },
        style : { 
            color : "blue"
        },
        channel : {
            text : "user100"
        }
    });
    
    const profile = $("#profile", {
        user_id : [ user.dataset, "uid" ],
        a : {
            text : "User Channel",
            style : {
                backgroundColor : [ user.style, "color" ]
            },
            href : [ user.channel, "text" , txt => { return "/channels/users/" + txt } ]
        }
    });
});
```

Finally, another way to observe an object change without having to assign it, is:

```js
// observe.js (for example, in another file)
const user = $("#user"); // import `user`

// You can assign multiple `onupdate` callbacks to the same node.
user.nickname.onupdate = (ev) => {
    // ev.detail is an object with the changes summary
    if(ev.detail.property === 'value') {
        console.log("Old value: " + ev.detail.oldValue);
        console.log("New value: " + ev.detail.newValue);
        $.alert("Nickname was updated");
    }
}
```
NOTE: `$.alert` is from [Alert Extension](alert.md).

---
This will likely help you to start. For more details:

* [A complete project example and tutorial](project.md)
* [Full documentation](m2d2.md)
* [Tutorial using jsfiddle](https://gl.githack.com/intellisrc/m2d2/raw/master/examples/tutorial.html)
* [Examples using jsfiddle](https://gl.githack.com/intellisrc/m2d2/raw/master/examples/examples.html)
* [Stand-alone html + js examples](https://gl.githack.com/intellisrc/m2d2/raw/master/examples/tests/index.html)
