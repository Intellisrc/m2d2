# M2D2 WebSocket Extension

WebSocket wrapper made easy

This extension provides:
* $.ws

## Usage:
```js
$.ws.connect({
    host         : "localhost", // Server name
    path         : "", // WebSocket's URL path, for example: ws://server/<path> (default: "")
    port         : 80, // Port in which the WebSocket server is listening (default: 80, 443)
    args         : {}, // Arguments to pass as query string in the URL, example: { id : "myId" }
    secure       : false, // If true, will use wss
    reconnect    : true, // Try to reconnect if it gets disconnected (default: true)
    request      : { ... }, // Initial Request (optional)
    connected    : () => {}, // Function to execute when connected
    disconnected : () => {}, // Function to execute when it gets disconnected
}, msg => { // When we receive a message it will be returned here: (as JSON)
    // Your message handling code goes here
});
wsc.request({ ... }); // To request something to the server, send it as object.
wsc.disconnect(); // Disconnect from server (it will turn off reconnection)
```

## Example:
```js
$.ws.connect({
    host : "localhost",
    port : "8080",
    path : "ws/",
    args : { id : profile.username },
    request : {
        status : [ "profile", "messages" ]
    },
    connected : () => {
        profile.online.show = true;
    },
    disconnected : () => {
        profile.online.show = false;
    }
}, json => {
    for(let key in json) {
        const value = json[key];
        switch(key) {
            case "status" :
                status.update(value);
                break
            default:
                console.log("Unknown key: " + key);    
        }
    }
});
// Profile:
const profile = $("#profile", {
    username : "user1000",
    disconnect : {
        onclick : function(ev) {
            // This request will be sent as JSON encoded string (see note below for sending plain text)
            $.ws.request({
                save : draft.text // Send unsaved information
            });
            $.ws.disconnect();
        }
    }
});
```
NOTE: You can also request using a string, for example: `$.ws.request("ping");`.