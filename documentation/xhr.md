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
 * $.copy

## General Usage:

All methods support any of these arguments:

| Argument       | Type             |          | Comment                                                                    |
|----------------|------------------|----------|----------------------------------------------------------------------------|
| url            | string           | required | empty = current URL                                                        |
| data           | object or string | optional | Usually query params unless 'json' flag is true                            |
| callback       | function         | optional | Get response from server (normal)                                          |
| error_callback | function         | optional | Connection errors will be sent here                                        |
| json           | boolean          | optional | when using 'json' data will be sent as JSON string instead of query params |
| timeout        | number           | optional | milliseconds to wait before timing out                                     |

Optional arguments can be omitted and their order can be also changed (as long as they don't repeat, and you follow the above data types):

```js
$.get(url, data, callback, error_callback, json, timeout);
$.get(url, callback, error_callback, json, timeout);
$.get(url, data, callback, json, timeout);
$.get(url, data, json, timeout);
$.get(url, callback, json, timeout)
$.get(url, json);
$.get(url, data, callback, timeout);
$.get(url, data, timeout);
$.get(url, callback, timeout);
$.get(url, timeout);
$.get(url, callback, data, timeout, json);
$.get(url, json, error_callback, data, timeout);
$.get(url, timeout, data)
// And so on...
```

All methods return the `XMLHttpRequest` object.

```js
const request = $.get(url, json => {});
console.log(request); // XMLHttpRequest object
```

## Examples:

```js
// URL will become: "/api/v1.0/service?enable"
$.get("/api/v1.0/service/", "enable");

// URL will become: "/api/v1.0/?user=1000"
$.get("/api/v1.0/", { user : 1000 }, user => { 
    if(user) {
        ...
    }
}, 1000); // Timeout after 1 second
```
```js
$.put("/api/v1.0/user/markus/", {
    status : "online"
}, true);  // Send data as JSON (body instead of query params)
```

### Handling errors:
```js
$.get("https://unstable.server/data/", { get : 'all' }, data => {
   // Normal response goes here        
}, error => {
   if(error && error.status) {
        switch(error.status) {
            case 404 : console.log("No longer exists"); break
            /* ... */
        }
   }
   console.log(error); // example output: { type : "Connection", reason: "Connection Refused", status: 0 }
});
```

### Aborting connections:

When you assign the request to a variable, it will return the `XMLHttpRequest` object. Aborting it is as simple as:

```js
// Aborting after 5 seconds:
let timeout;
const request = $.get("/slow/server", res => {
    clearTimeout(timeout);
});
timeout = setTimeout(() =>{
    request.abort();
}, 5000);
```

Remember that you can use the `timeout` argument to cancel it automatically.
