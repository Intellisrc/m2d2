m2d2.load($ => {
    /**
     * Common XHR method
     * @version 2020-05-09
     *
     * @param method: HTTP method (GET, POST, PUT, DELETE)
     * @param url: service URL
     * @param data: Data object to send (in case of POST and PUT)
     * @param callback: Callback on Success (it will return data)
     * @param error_callback: Callback on Failure
     * @param json : Boolean (if set, it will set request content-type as json and in case of GET, it will send it as body instead of query)
     *
     * @author A.Lepe (dev@alepe.com)
     */
    const XHR = function(method, url, data, callback, error_callback, json) {
        const request = new XMLHttpRequest();
        if(json === undefined) { json = false }
        if(data && Object.entries(data).length === 0) {
            data = "";
        }
        if(data) {
            if(method.toUpperCase() === "GET" &&! json) {
                if(data) {
                    url += (url.indexOf("?") !== -1 ? "&" : "?") + (Object.keys(data).map(key => key + '=' + data[key]).join('&'));
                    data = "";
                }
            } else {
                data = JSON.stringify(data);
            }
        }
        request.open(method, url, true);
        if(json) {
            request.setRequestHeader('Content-Type', 'application/json');
        }
        request.onload = function() {
            const data = request.responseText ? JSON.parse(request.responseText) : {
                error: {type: "Unknown", reason: "Unknown Error"}
            };
            if (request.status >= 200 && request.status < 400) {
                if(callback !== undefined) {
                    callback(data);
                }
            } else {
                if(error_callback !== undefined) {
                    if(typeof data.error == "string") {
                        data.error = { type : "Exception", reason : data.error }
                    }
                    error_callback(data.error);
                }
            }
        };
        request.send(data);
    };
    /**
     * Short method. It also validates arguments and allow omitting some, eg.:
     * xhr.get(url, data, callback, error_callback, json);
     * xhr.get(url, callback, error_callback, json);
     * xhr.get(url, data, callback, json);
     * xhr.get(url, data, json);
     * xhr.get(url, callback, json);
     */
    const xhr = {};
    ["get","post","put","delete","connect","options","trace","patch"].forEach(function(method) {
        xhr[method] = function() {
            let url, data, callback, error_callback, json;
            // noinspection FallThroughInSwitchStatementJS
            switch(arguments.length) {
                case 5:
                    if(typeof arguments[4] == "boolean") {
                        json = arguments[4];
                    } else {
                        console.log("Passed JSON argument: " + arguments[4] + " is not boolean.");
                    }
                case 4:
                    if(typeof arguments[3] == "function") {
                        error_callback = arguments[3];
                    } else if(arguments.length === 4 && typeof arguments[3] == "boolean") {
                        // Make error callback optional:
                        json = arguments[3];
                    } else {
                        console.log("Passed argument 4: " + arguments[3] + " is mistaken");
                    }
                case 3:
                    if(typeof arguments[2] == "function") {
                        if(typeof arguments[1] == "function" && arguments.length < 5) {
                            error_callback = arguments[2];
                        } else {
                            callback = arguments[2];
                        }
                    } else if(arguments.length === 3 && typeof arguments[2] == "boolean") {
                        // Make callback and error callback optional:
                        json = arguments[2];
                    } else {
                        console.log("Passed argument 3: " + arguments[2] + " is mistaken");
                    }
                case 2:
                    if(typeof arguments[1] == "object" || typeof arguments[1] == "string") {
                        data = arguments[1];
                    } else if(typeof arguments[1] == "function") {
                        // Make data optional:
                        callback = arguments[1];
                    } else {
                        console.log("Passed argument 2: " + arguments[1] + " is mistaken");
                    }
                case 1:
                    if(typeof arguments[0] == "string") {
                        url = arguments[0];
                    } else if(Array.isArray(arguments[0])) {
                        url = arguments[0].join("/");
                    } else {
                        console.log("Passed URL: "+arguments[0]+" was not a string.");
                    }
                    break;
                default:
                    console.log("Incorrect number of arguments passed to xhr");
            }
            if(data === undefined) { data = {} }
            /*
            console.log("URL: " + url);
            console.log("DATA: " + data);
            console.log("CALLBACK: " + callback);
            console.log("ERROR CALLBACK: " + error_callback);
            console.log("JSON: " + json);
            */
            XHR(method.toUpperCase(), url, data, callback, error_callback, json);
        }
    });
    Object.assign($, xhr);
});