/**
 * Author : A.Lepe (dev@alepe.com) - intellisrc.com
 * License: MIT
 * Version: 2.1.4
 * Updated: 2022-08-15
 * Content: Extension (Debug)
 */

m2d2.load($ => {
    /**
     * @author A.Lepe (dev@alepe.com)
     * XHR implementation
     *
     * This extension provides:
     * $.get
     * $.post
     * $.put
     * $.delete
     * $.connect
     * $.options
     * $.trace
     * $.patch
	 * $.head
     *
     * Documentation :
     * https://gitlab.com/intellisrc/m2d2/tree/master/documentation/xhr.md
     * https://github.com/intellisrc/m2d2/tree/master/documentation/xhr.md
     */

     /**
     * @param method: HTTP method (GET, POST, PUT, DELETE, etc)
     * @param url: service URL
     * @param data: Data object to send (in case of POST and PUT)
     * @param callback: Callback on Success (it will return data)
     * @param error_callback: Callback on Failure
     * @param json : Boolean (if set, it will set request content-type as json and in case of GET, it will send it as body instead of query)
     * @param timeout : number (milliseconds)
     */
    const XHR = function(method, url, data, callback, error_callback, json, timeout) {
        const request = new XMLHttpRequest();
        if(json === undefined) { json = false }
        if(error_callback === undefined) { error_callback = function(e) { console.log(e); } }
        if(data && Object.entries(data).length === 0) {
            data = "";
        }
        if(data) {
            if(json) {
                data = JSON.stringify(data);
            } else {
                switch(method.toUpperCase()) {
                    case "HEAD":
                    case "GET":
                        if(typeof data == "string") {
                            const obj = {};
                            obj[data] = "";
                            data = obj;
                        }
                        url += (url.indexOf("?") !== -1 ? "&" : "?") + (Object.keys(data).map(key => key + '=' + data[key]).join('&'));
                        data = "";
                        break
                    default:
                        data = (Object.keys(data).map(key => key + '=' + data[key]).join('&'));
                }
            }
        }
        request.open(method, url, true);
        if(timeout) {
            request.timeout = timeout;
            request.ontimeout = function(err) {
                error_callback({ type : "Timeout", reason: "Connection timed out", status: 0 });
            }
        }
        if(json) {
            request.setRequestHeader('Content-Type', 'application/json');
        } else {
            request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        }
        request.onerror = function(e) {
            error_callback({type : "Connection", reason: "Connection Refused", status: 0 });
        }
		let loadedBytes = 0;
		request.onreadystatechange = function() {
		  switch(request.readyState) {
			case request.HEADERS_RECEIVED: //Headers
                const headers = request.getAllResponseHeaders().trim().split('\r\n').reduce((acc, current) => {
                      const [x,v] = current.split(': ');
                      return Object.assign(acc, { [x] : v });
                }, {});
				request.dispatchEvent(new CustomEvent('headers', { detail : headers }));
				if(method == "HEAD") {
				    callback(headers);
				}
				break
			case request.LOADING: //Partial
				const partial = request.response.substr(loadedBytes);
				loadedBytes = request.responseText.length;
				request.dispatchEvent(new CustomEvent('partial', { detail : partial }));
				break
		  }
		};
        request.onload = function() {
            let data = {};
            try {
                data = request.responseText ? JSON.parse(request.responseText) : {
                    error: { type: "Response", reason: "Empty response", status: 0 }
                };
            } catch(err) {
                data.error = { type : "Parse Error", reason : err.message, status: 0 }
            }
            if (request.status >= 200 && request.status < 400) {
                if(callback !== undefined && method != "HEAD") {
                    callback(data);
                }
            } else if(request.status >= 400) {
                if(error_callback !== undefined) {
                    if(typeof data.error == "string") {
                        data.error = { type : "Exception", reason : data.error, status : request.status }
                    }
                    error_callback(data.error);
                }
            } else if(request.status) {
                console.log("Received response with code: " + request.status)
            } else if(data.error) {
                error_callback(data.error);
            }
        };
		// Override if needed
		request.headers = function(callback) {
		    request.addEventListener("headers", function(e) {
		        callback(e.detail)
		    });
	    }
		// Override if needed
		request.partial = function(callback) {
		    request.addEventListener("partial", function(e) {
		        callback(e.detail)
		    });
		}
		// Send
        request.send(data);
        return request;
    };
    /**
     * Short method. It also validates arguments and allow omitting some, eg.:
     * xhr.get(url, data, callback, error_callback, json);
     * xhr.get(url, callback, error_callback, json);
     * xhr.get(url, data, callback, json);
     * xhr.get(url, data, json);
     * xhr.get(url, callback, json);
     * xhr.get(url, json);
     */
    const xhr = {};
    ["get","post","put","delete","connect","options","trace","patch","head"].forEach(function(method) {
        xhr[method] = function() {
            let url, data, callback, error_callback, json, timeout;
            // noinspection FallThroughInSwitchStatementJS
            Array.from(arguments).forEach(a => {
                if(typeof a === "string") {
                    if(! url) {
                        url = a;
                    } else if(! data) {
                        data = a;
                    } else {
                        console.log("Incorrect arguments passed to: " + method + " [" + url + "]. URL (or data as string) was already specified.")
                    }
                } else if(typeof a === "object") {
                    if(! data) {
                        data = a;
                    } else {
                        console.log("Incorrect arguments passed to: " + method + " [" + url + "]. Possibly data was duplicated.")
                    }
                } else if(typeof a === "function") {
                    if(! callback) {
                        callback = a;
                    } else if(! error_callback) {
                        error_callback = a;
                    } else {
                        console.log("Incorrect arguments passed to: " + method + " [" + url + "]. Too many functions.")
                    }
                } else if(typeof a === "boolean") {
                    if(! json) {
                        json = a;
                    } else {
                        console.log("Incorrect arguments passed to: " + method + " [" + url + "]. Json flag was already specified.")
                    }
                } else if(typeof a === "number") {
                    if(! timeout) {
                        timeout = a;
                    } else {
                        console.log("Incorrect arguments passed to: " + method + " [" + url + "]. Timeout was already specified.")
                    }
                } else {
                    console.log("Incorrect arguments passed to: " + method + " [" + url + "]. Argument with type: " + (typeof a) + " is not accepted:");
                    console.log(a);
                }
            });
            if(data === undefined) { data = {} }
            /*
            console.log("URL: " + url);
            console.log("DATA: " + data);
            console.log("CALLBACK: " + callback);
            console.log("ERROR CALLBACK: " + error_callback);
            console.log("JSON: " + json);
            */
            return XHR(method.toUpperCase(), url, data, callback, error_callback, json, timeout);
        }
    });
    Object.assign($, xhr);
});
