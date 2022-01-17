# M2D2 Storage Extension

Wrapper for different kinds of storage. One advantage is that objects are stored with type instead of string.

This extension provides:
* $.local : To get/set values in localStorage
* $.session : To get/set values in sessionStorage

## Methods:
* set      : saves the information
* get      : retrieve the info.
* del      : remove data
* clear    : remove all keys
* exists   : check if key exists
* keys     : get all keys
* log      : add in array (it will keep "n" number of items in queue)

## Examples:

```js
$.local.set("mykey",myval);
console.log(local.get("mykey"));
console.log(local.exists("mykey")); // returns: true
$.local.del("mykey");
$.local.log("mylog", message, 10); // Keep only the last 10
$.local.clear(); // Remove all keys
```

## Notes:
`myval` can be : string, number, object, array
