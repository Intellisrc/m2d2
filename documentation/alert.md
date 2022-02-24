# M2D2 Alert Extension

A replacement of `alert`,`prompt` and `confirm`. Inspired by `SweetAlert`, with
customizable theme and better M2D2 integration.

This extension provides:

* $.wait       : Displays a spinner without any button in it.
* $.alert      : Displays a simple message with "ok" button.
* $.success    : Same as $.alert, but show a "check" icon.
* $.failure    : Same as $.alert, but shows a "warning" icon.
* $.confirm    : Displays a confirmation message with "yes" and "no" buttons.
* $.prompt     : Displays an input prompt with "cancel" and "send" buttons.
* $.message    : Free form message (all the previous implementations uses this function)
* $.closeAll   : Close any message that might be open

## Style Setup:

In order to display the alerts, you need to add (and possibly modify) the [alert.css](../examples/css/alert.css) file.
We have included the [scss files](../examples/css/alert/) for your convenience.

The easiest way is to use `UTF-8` icons (no extra files needed). 
Check the inline CSS included in the [alert.html](../examples/extensions/alert.html) example.
You can easily replace the icons with SVG files, for example (just use the css classes).

If you use [Font Awesome](https://fontawesome.com), take a look to the [alert-fontawesome.html](../examples/extensions/alert-fontawesome.html) example.

> In order to use Font Awesome icons, you need to specify: `$.messageIcons = 'fa'`.

If you use [Google Material Icons](https://material.io/icons), take a look to the [alert-material.html](../examples/extensions/alert-material.html) example.

> In order to use Google Material icons, you need to specify: `$.messageIcons = 'material'`.

If you are using other icons, or want to change the ones set by default, you can set your custom icons in this way:

* Add special classes to icons (example Font Awesome):
```js
const faIcons = {
    wrap     : false,
    question : ["fa", "fa-question-circle"],
    info     : ["fa", "fa-exclamation-circle"],
    error    : ["fa", "fa-exclamation-triangle"],
    ok       : ["fa", "fa-check"],
    input    : ["fa", "fa-edit"],
    wait     : ["fa", "fa-cog", "fa-spin"]
}
```
Output example: `<span class="fa fa-cog fa-spin"></span>`

* Add a parent class and type as text (like Material Icons):
```js
const material = {
    wrap     : "material-icons",
    question : "help",
    info     : "info",
    error    : "error",
    ok       : "done",
    input    : "edit",
    wait     : "pending"
}
```
Output example: `<span class="materia-icons">pending</span>`

## Example Usage:

### $.wait :
```js
const waitMsg = $.wait("Please wait...");
setTimeout(() => { 
    waitMsg.close(); 
}, 2000);
```
You can use the callback to wait until the alert closes to perform some action:

```js
const waitMsg = $.wait("Please wait...");
// By passing a callback, you are sure that the `wait` message was closed properly.
setTimeout(() => { 
    waitMsg.close(() => {
        $.success("We waited 2 seconds!");
    });
}, 2000);
```

Using a cancel button inside `$.wait` :

```js
const waitMsg = $.wait("Please wait...", {
    div : {
        css : "m2d2-alert-buttons",
        button : {
            text : "Cancel",
            css  : ["color", "cancel"],
            onclick : function() {
                waitMsg.close();
            }
        }
    }
});
```

### $.alert, $.success, $.failure :
```js
$.alert("Hint of the day", "To exit, click in 'logout' button.", () => { 
    console.log("The alert has been closed.") 
});
$.success("Data has been saved!", () => { 
    console.log("The alert has been closed. I didn't specified text, just title.") 
});
$.failure("Server error"); //Display just the message
```

### $.confirm :
```js
$.confirm("Are you sure?", "You are about to delete all images!", (res) => { 
    if(res) { 
        console.log("All images are gone!") 
    }
});
```


### $.prompt :
```js
$.prompt("Please enter your name:", (res) => { 
    console.log("your name is:" + res); 
});
$.prompt("Please enter your age:", "No need to lie...", (res) => { 
    console.log("your age is:" + res); 
});
$.prompt("Please enter your sex:", {
    select : ["Female","Male","Other"]
}, (res, raw) => { console.log("your sex is:" + res); });
```

### $.message : (Advanced)
```js
$.message({
    icon : "times",     // OPTIONAL: you can use : "question", "info", "error", "ok", "input", "wait"
    css  : "special",   // Set class or classes
    title : "Title",
    text  : "Text to use",
    buttons : ["No way!", "Roger"], // Specify button text and classes which in this case be: "no_way" and "roger"
    callback : function() {}
});
```

### Notes:
callback gets two arguments:
* The first one is the simplest return value when possible
* The second one is the form data as an object, for example: { button : "send", answer : "Hello" }
