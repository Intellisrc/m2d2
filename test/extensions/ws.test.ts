import { describe, it, expect, vi, beforeEach } from "vitest";
import { WsClient } from "../../src/extensions/ws";

/** Mock WebSocket that captures the URL and records sent messages. */
class MockWebSocket {
    static lastUrl = "";
    static last: MockWebSocket;
    static instances: MockWebSocket[] = [];
    readyState = 0;
    onopen: ((e: Event) => void) | null = null;
    onclose: ((e: CloseEvent) => void) | null = null;
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: Event) => void) | null = null;
    sent: string[] = [];

    constructor(url: string) {
        MockWebSocket.lastUrl = url;
        MockWebSocket.last = this;
        MockWebSocket.instances.push(this);
    }
    send(data: string): void {
        this.sent.push(data);
    }
    close(): void {
        this.readyState = 3;
    }
}

describe("WsClient", () => {
    beforeEach(() => {
        (globalThis as any).WebSocket = MockWebSocket;
        MockWebSocket.instances = [];
        MockWebSocket.lastUrl = "";
    });

    it("constructs ws:// URL from options", () => {
        const client = new WsClient();
        client.connect(
            { host: "localhost", port: 8080, path: "ws/", args: { id: "user1" } },
            () => {}
        );
        expect(MockWebSocket.lastUrl).toBe("ws://localhost:8080/ws/?id=user1");
    });

    it("constructs wss:// URL when secure=true", () => {
        const client = new WsClient();
        client.connect({ host: "example.com", port: 443, secure: true }, () => {});
        expect(MockWebSocket.lastUrl).toBe("wss://example.com:443/?");
    });

    it("defaults port to 80 (ws)", () => {
        const client = new WsClient();
        client.connect({ host: "example.com" }, () => {});
        expect(MockWebSocket.lastUrl).toContain(":80");
    });

    it("defaults port to 443 (wss) when secure", () => {
        const client = new WsClient();
        client.connect({ host: "example.com", secure: true }, () => {});
        expect(MockWebSocket.lastUrl).toContain(":443");
    });

    it("request sends JSON for objects", () => {
        const client = new WsClient();
        client.connect({ host: "localhost", port: 8080 }, () => {});
        const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1];
        // Simulate open so the request path can send:
        (client as any).webSocket = ws;
        ws.readyState = 1;
        client.request({ cmd: "ping" });
        expect(ws.sent).toContain(JSON.stringify({ cmd: "ping" }));
    });

    it("request sends plain string as-is", () => {
        const client = new WsClient();
        client.connect({ host: "localhost", port: 8080 }, () => {});
        const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1];
        (client as any).webSocket = ws;
        ws.readyState = 1;
        client.request("ping");
        expect(ws.sent).toContain("ping");
    });

    it("disconnect disables reconnect", () => {
        const client = new WsClient();
        client.connect({ host: "localhost", port: 8080, reconnect: true }, () => {});
        client.disconnect();
        expect((client as any).reconnectEnabled).toBe(false);
    });

    it("registers via registerWs", async () => {
        const { registerWs } = await import("../../src/extensions/ws");
        const $: { ws?: WsClient } = {};
        registerWs($);
        expect($).toBeDefined();
        expect(typeof $?.ws?.connect).toBe("function");
    });

    it("strips leading slash from path", () => {
        const client = new WsClient();
        client.connect({ host: "h", port: 80, path: "/foo/bar" }, () => {});
        expect(MockWebSocket.lastUrl).toContain("/foo/bar");
    });
});
