const pages = [
    {
        id : "v3pr6twe",
        title: "How to start...",
        description: "In this example we will learn how to start using M2D2 with " +
            "a simple user profile. We 'fill' the fields using a javascript " +
            "plain object.",
        lessons : [
            'We start by using the function: <code>m2d2.ready()</code> which executes your instructions when the page (DOM) is ready.',
            'The dollar sign in the callback function: <code>m2d2.ready($ => { $("#profile"); })</code> is the suggested symbol for M2D2 (and the one used across all examples and documentation). You can use anything you want, for example: <code>m2d2.ready(m => { m("#profile"); })</code>',
            'Usually you want to use an ID as selector: <code>$("#profile")</code>, but you can use any supported selector, for example: <code>$("body section div:first-child")</code> Although I do not recommend it because your code will perform better and it will be easier to understand if you stick to IDs (more about this later in this examples).',
            'You do not need to specify all parents to find an element, for example, instead of: <code>$("#profile", { details : { age : 80 })</code> can be set in a more direct way: <code>$("#profile", { age : 80 });</code>',
        ]
    },
    {
        id : "4o5c83yn",
        title: "DOM objects",
        description : "All objects returned by m2d2 are DOM objects with extra features.",
        lessons : [
            'The value returned by the function: <code>$("#sample")</code> is indeed a DOM element (or Node) which has all standard Javascript properties and functions (like `appendChild`, `classList`, etc). Additionally it has <a href="dom_extend.html">some functions</a> that are useful to keep our code simple.'
        ]
    }
];
