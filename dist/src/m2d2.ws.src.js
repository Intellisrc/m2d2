/**
 * Author : A.Lepe (dev@alepe.com) - intellisrc.com
 * License: MIT
 * Version: 2.1.3
 * Updated: 2022-05-26
 * Content: Extension (Debug)
 */

m2d2.load($ => {
    //------------------------ WS --------------------------------
    /**
     * @author: A.Lepe
     * @version: 210425 : Added secure, host and converted to m2d2 extension
     *           210406 : Retry until reconnect
     * @since : 2018
     * WebSocket wrapper
     *
     * This extension provides:
     * $.ws
     *
     * Documentation :
     * https://gitlab.com/intellisrc/m2d2/tree/master/documentation/ws.md
     * https://github.com/intellisrc/m2d2/tree/master/documentation/ws.md
     */
    class ws {
        request(msg) {
            if (msg) {
                try {
                    this.webSocket.send($.isObject(msg) ? JSON.stringify(msg) : msg);
                } catch(e) {
                    this.webSocket.onerror(e);
                }
            }
        }
        /**
         * Connect and return the websocket object
         */
        getSocket(onMessage, onOpen, onClose) {
            const webSocket = new WebSocket(this.url);
            webSocket.onopen = onOpen;
            webSocket.onclose = onClose;
            webSocket.onmessage = (res) => {
                if (res.data) {
                    try {
                        onMessage(JSON.parse(res.data));
                    } catch(e) {
                        webSocket.onerror(e);
                    }
                }
            }
            webSocket.onerror = (err) => {
                console.error('Socket encountered error: ', err ? err.message : 'Unknown', 'Closing socket');
                const wsk = webSocket || this;
                if(wsk.readyState === 1) {
                    wsk.close();
                }
            }
            return webSocket;
        }
        connect(options, onMessage) {
            this.initRequest = options.request || null;
            this.onConnect = options.connected || (() => {});
            this.onDisconnect = options.disconnected || (() => {});
            this.reconnect = options.reconnect !== false;
            this.host = options.host || window.location.hostname;
            this.secure = options.secure === true;
            this.port = options.port || (this.secure ? 443 : 80);
            this.path = "/" + (options.path.replace(/^\//,"") || "");
            this.args = Object.assign({}, options.args);
            const protocol = "ws" + (this.secure ? "s" : "") + "://";
            const hostPort = this.host + ":" + this.port;
            const uriPath  = this.path;
            const queryStr = (this.args ? "?" + new URLSearchParams(this.args).toString() : "");
            this.url = protocol + hostPort + uriPath + queryStr;
            this.connected = false;
            this.interval = null;
            //-------- Connect ----------
            const onOpen = (e) => {
                this.connected = true;
                this.request(this.initRequest);
                this.onConnect();

            }
            const onClose = (e) => {
                this.connected = false;
                this.onDisconnect();
                if(!this.interval && this.reconnect) {
                    this.interval = setInterval(() => {
                        if(this.connected) {
                            console.log("Reconnected...")
                            clearInterval(this.interval);
                        } else {
                            try {
                                this.webSocket.close();
                                console.log("Reconnecting...")
                                this.webSocket = this.getSocket(onMessage, onOpen, onClose);
                            } catch(ignore) {}
                        }
                    }, 2000);
                }
            }
            this.webSocket = this.getSocket(onMessage, onOpen, onClose);
        }
        disconnect() {
            this.reconnect = false;
            this.webSocket.close();
        }
    }
    $.ws = new ws();
});