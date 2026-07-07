/**
 * M2D2 WebSocket Extension
 *
 * $.ws — easy-to-use WebSocket client with auto-reconnect.
 * Ported from js/m2d2.ws.src.js.
 */

export interface WsOptions {
    host?: string;
    path?: string;
    port?: number;
    args?: Record<string, unknown>;
    secure?: boolean;
    reconnect?: boolean;
    /** Initial request sent on connect (object → JSON, or plain string). */
    request?: unknown;
    connected?: () => void;
    disconnected?: () => void;
}

export class WsClient {
    private webSocket!: WebSocket;
    private initRequest: unknown = null;
    private onConnect: () => void = () => {};
    private onDisconnect: () => void = () => {};
    /** When false, the client won't attempt to reconnect. */
    private reconnectEnabled = true;
    private host = "";
    private secure = false;
    private port = 80;
    private path = "";
    private args: Record<string, unknown> = {};
    /** The constructed ws(s):// URL. */
    url = "";
    connected = false;
    private interval: ReturnType<typeof setInterval> | null = null;

    /**
     * Send a message. Objects are JSON-stringified; strings are sent as-is.
     */
    request(msg: unknown): void {
        if (!msg) return;
        try {
            this.webSocket.send(typeof msg === "object" ? JSON.stringify(msg) : (msg as string));
        } catch (e) {
            (this.webSocket as any).onerror(e);
        }
    }

    /** Construct a fresh WebSocket and wire its handlers. */
    private getSocket(
        onMessage: (msg: unknown) => void,
        onOpen: (e: Event) => void,
        onClose: (e: CloseEvent) => void
    ): WebSocket {
        const ws = new WebSocket(this.url);
        ws.onopen = onOpen;
        ws.onclose = onClose;
        ws.onmessage = (res: MessageEvent) => {
            if (res.data) {
                try {
                    onMessage(JSON.parse(res.data));
                } catch (e) {
                    (ws as any).onerror(e);
                }
            }
        };
        ws.onerror = (err: Event) => {
            console.error(
                "[m2d2] Socket error:",
                (err as ErrorEvent)?.message || "Unknown",
                "Closing socket"
            );
            if (ws.readyState === 1) {
                ws.close();
            }
        };
        return ws;
    }

    /**
     * Connect to the WebSocket server.
     * Ported from js/m2d2.ws.src.js:52-95.
     */
    connect(options: WsOptions, onMessage: (msg: unknown) => void): void {
        this.initRequest = options.request ?? null;
        this.onConnect = options.connected ?? (() => {});
        this.onDisconnect = options.disconnected ?? (() => {});
        this.reconnectEnabled = options.reconnect !== false;
        this.host = options.host || window.location.hostname;
        this.secure = options.secure === true;
        this.port = options.port || (this.secure ? 443 : 80);
        this.path = "/" + (options.path ? options.path.replace(/^\//, "") : "");
        this.args = Object.assign({}, options.args);

        const protocol = "ws" + (this.secure ? "s" : "") + "://";
        const hostPort = this.host + ":" + this.port;
        const queryStr = this.args
            ? "?" + new URLSearchParams(this.args as Record<string, string>).toString()
            : "";
        this.url = protocol + hostPort + this.path + queryStr;
        this.connected = false;
        this.interval = null;

        const onOpen = () => {
            this.connected = true;
            this.request(this.initRequest);
            this.onConnect();
        };

        const onClose = () => {
            this.connected = false;
            this.onDisconnect();
            if (!this.interval && this.reconnectEnabled) {
                this.interval = setInterval(() => {
                    if (this.connected) {
                        console.log("[m2d2] Reconnected.");
                        if (this.interval) {
                            clearInterval(this.interval);
                            this.interval = null;
                        }
                    } else {
                        try {
                            this.webSocket.close();
                            console.log("[m2d2] Reconnecting...");
                            this.webSocket = this.getSocket(onMessage, onOpen, onClose);
                        } catch {
                            // ignore — will retry on next interval tick
                        }
                    }
                }, 2000);
            }
        };

        this.webSocket = this.getSocket(onMessage, onOpen, onClose);
    }

    /** Disconnect and disable reconnection. */
    disconnect(): void {
        this.reconnectEnabled = false;
        this.webSocket.close();
    }
}

/**
 * Register $.ws on the target.
 */
export function registerWs($target: { ws?: WsClient }): void {
    $target.ws = new WsClient();
}
