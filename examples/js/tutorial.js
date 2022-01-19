const pages = [
    {
        id : "v3pr6twe",
        title: "How to start...",
        description: "In this example we will learn how to start using M2D2 with " +
            "a simple user profile. We 'fill' the fields using a javascript " +
            "plain object.",
        lessons : [
            'We start by using the function: <code>m2d2.ready($ => {})</code> which executes your instructions when the page (DOM) is ready. If the DOM is ready (for example, setting the script at the bottom of your HTML page, or handled by another code, or not needed), use: <code>const $ = m2d2.load();</code>',
            'The dollar sign in the callback function: <code>m2d2.ready($ => { $("#profile"); })</code> is the suggested symbol for M2D2 (and the one used across all examples and documentation). You can use anything you want, for example: <code>m2d2.ready(m => { m("#profile"); })</code>',
            'Usually you want to use an ID as selector: <code>$("#profile")</code>, but you can use any supported selector, for example: <code>$("body section div:first-child")</code> Although I do not recommend it because your code will perform better, and it will be easier to understand if you stick to IDs (more about this later in this tutorial).',
            'You do not need to specify all parents to find an element, for example, instead of: <code>$("#profile", { details : { age : 80 })</code> can be set in a more direct way: <code>$("#profile", { age : 80 });</code>',
        ]
    },
    {
        id : "4o5c83yn",
        title: "DOM objects",
        description : "All objects returned by m2d2 are DOM objects with extra features.",
        lessons : [
            'The value returned by the function: <code>$("#sample")</code> is indeed a DOM element (or Node) which has all standard Javascript properties and functions (like `appendChild`, `classList`, etc). Additionally it has <a href="dom_extend.html">some functions</a> that are useful to keep our code simple.',
            'I recommend you to assign your DOM object into a constant: <code>const sample = $("#sample", { ... })</code>Although you can simply use: <code>$(sample, { ... }</code> (as IDs are converted into global variables in browsers), I don\'t recommend it as you may encounter conflicting names like: `window.history`, and sticking with constants you will never face such issues.',
        ]
    },
    {
        id : "rkj7dfq5",
        title: "Locating elements and specifying default attribute",
        description : "M2D2 will try to find the element which matches your key.",
        lessons : [
            'First, M2D2 will try to locate your element by ID, then by "name", then by class and finally by tag name.',
            'In case two or more elements match, it will log a warning about it (more on this later in the tutorial).',
            'When M2D2 finds a form element with "value" attribute, it will use it as default action for strings and numbers.',
            'If the string contains HTML, it will be converted into HTML automatically (I don\'t recommend using html inside strings unless there is a special reason)'
        ]
    }
];
