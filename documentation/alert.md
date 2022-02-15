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

## Example Usage:

### $.wait :
```js
const waitMsg = $.wait("Please wait...");
setTimeout(() => { 
    waitMsg.close(); 
}, 2000);
```
**IMPORTANT:**

If you want to open another alert (of any type, like: failure, success, etc),
specify a callback in `close()` method, for example:
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
