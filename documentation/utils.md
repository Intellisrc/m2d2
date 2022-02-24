# M2D2 Utils

Functions useful to work with Javascript data and DOM
Used mainly in M2D2 core library but exposed to the
consumer.

This extension provides:

```js
/*
    v : {*} value
    b : {boolean}
    o : {object}
    e : {HTMLElement} || {Node}
    s : {string}
 */
$.isString(v)           // Returns true if variable is string
$.isBool(v)             // Returns true if variable is a boolean
$.isNumeric(v)          // Returns true if variable is a number
$.isSelectorID(s)       // Returns true if selector is an id selector
$.isPlainObject(o)      // Returns true if object is a "plain" object (not an array)
$.isObject(v)           // Returns true if variable is an object (any kind, e.g. Array)
$.isArray(o)            // Returns true if object is an array
$.isFunction(o)         // Returns true if object is a function
$.isElement(o)          // Returns true if object is an HTMLElement
$.isNode(o)             // Returns true if object is a Node or DocumentFragment
$.isHtml(s)             // Returns true if string seems to be an HTML code
$.exists(s)             // Returns true if element exists in DOM based on selector
$.isEmpty(o)            // Checks if an object is empty
$.isVisible(e)          // Checks if an element is visible
$.inView(e)             // Checks if element is in view
$.isValidElement(e)     // Checks if a tag name is a valid HTML element
$.cleanArray(a)         // Remove null, empty or undefined values from an array
$.getAttrOrProp(e,s)    // Get attribute or property from node
$.hasAttrOrProp(e,s)    // if a node contains either a property or an attribute
$.hasAttr(e,s)          // If a node has an attribute
$.hasProp(e,s)          // If a node has a property which is not an attribute
$.setPropOrAttr(e,s,b)  // Set the value of a property which is true/false
$.setAttr(e,s,b)        // Set attribute to node. If value is false, will remove it.
$.defineProp(o,s,v)     // Define a property to an object
$.htmlElement(s)        // Creates a Node using HTML code
$.newElement(s)         // Creates a Node with a tag name
$.newEmptyNode()        // Creates an empty node (DocumentFragment)
$.getMethods(o)         // Get all methods of class object
$.appendAllChild(e,e)   // Append all child from one node to another
$.prependAllChild(e,e)  // Prepend all child from one node to another
```

See [source code](../js/utils.src.js) for more details in implementation.