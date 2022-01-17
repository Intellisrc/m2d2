# M2D2 XHR Extension

XHR implementation. One advantage is that you can
send data as JSON if required. All methods are
consistent in parameters.

This extension provides:
 * $.get
 * $.post
 * $.put
 * $.delete
 * $.connect
 * $.options
 * $.trace
 * $.patch

## General Usage:

All methods support any of these arguments:

```js
// url is required (but can be empty : send to current URL)
// data is optional (using URL only)
// callback is optional (send and forget)
// error_callback is optional (ignore errors)
// json is optional (false by default : data as parameter)

$.get(url, data, callback, error_callback, json);
$.get(url, callback, error_callback, json);
$.get(url, data, callback, json);
$.get(url, data, json);
$.get(url, callback, json)
```

## Examples:

```js
$.get("/api/v1.0/", { user : 1000 }, user => {
    if(user) {
        ...
    }
}, () => {
    // On failure
}, true); // Send data as JSON (body)
```
```js
$.put("/api/v1.0/user/markus/", {
    status : "online"
});
```

