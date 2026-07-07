import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Mock XMLHttpRequest that captures the request without hitting a server.
 * Tests focus on the flexible argument parsing (the documented feature).
 */
class MockXHR {
    static last: MockXHR;
    method = "";
    url = "";
    data: unknown = null;
    /** Captured request headers (set via setRequestHeader). */
    reqHeaders: Record<string, string> = {};
    _timeout: number | undefined;
    readyState = 0;
    status = 200;
    responseText = "";
    response = "";
    onreadystatechange: (() => void) | null = null;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    ontimeout: (() => void) | null = null;
    sent = false;

    static HEADERS_RECEIVED = 2;
    static LOADING = 3;

    open(method: string, url: string): void {
        this.method = method;
        this.url = url;
    }
    setRequestHeader(k: string, v: string): void {
        // NOTE: the source attaches a chainable `.headers(cb)` helper to the request
        // AFTER send, which would clobber a field named `headers`. We store under
        // `reqHeaders` to read captured headers reliably.
        this.reqHeaders[k] = v;
    }
    send(data: unknown): void {
        this.data = data;
        this.sent = true;
        MockXHR.last = this;
    }
    set timeout(v: number) {
        this._timeout = v;
    }
    get timeout(): number {
        return this._timeout ?? 0;
    }
    getAllResponseHeaders(): string {
        return "";
    }
    dispatchEvent(): void {}
    addEventListener(): void {}
}

describe("XHR flexible argument parsing", () => {
    const originalXHR = (globalThis as any).XMLHttpRequest;

    beforeEach(async () => {
        (globalThis as any).XMLHttpRequest = MockXHR;
        // Re-import to pick up the mock (module caches the reference at call time, not import):
        MockXHR.last = undefined as unknown as MockXHR;
    });

    afterEach(() => {
        (globalThis as any).XMLHttpRequest = originalXHR;
    });

    it("parses (url, data, callback)", async () => {
        const { registerXhr } = await import("../../src/extensions/xhr");
        const $: Record<string, unknown> = {};
        registerXhr($);
        const cb = vi.fn();
        ($.get as Function)("/api", { q: 1 }, cb);
        expect(MockXHR.last.method).toBe("GET");
        expect(MockXHR.last.url).toContain("/api");
        expect(MockXHR.last.url).toContain("q=1");
    });

    it("parses (url, callback)", async () => {
        const { registerXhr } = await import("../../src/extensions/xhr");
        const $: Record<string, unknown> = {};
        registerXhr($);
        const cb = vi.fn();
        ($.get as Function)("/api", cb);
        expect(MockXHR.last.url).toBe("/api");
    });

    it("parses (url, data, json=true)", async () => {
        const { registerXhr } = await import("../../src/extensions/xhr");
        const $: Record<string, unknown> = {};
        registerXhr($);
        ($.put as Function)("/api", { status: "ok" }, true);
        expect(MockXHR.last.reqHeaders["Content-Type"]).toBe("application/json");
        expect(MockXHR.last.data).toBe(JSON.stringify({ status: "ok" }));
    });

    it("parses (url, timeout)", async () => {
        const { registerXhr } = await import("../../src/extensions/xhr");
        const $: Record<string, unknown> = {};
        registerXhr($);
        ($.get as Function)("/api", 5000);
        expect(MockXHR.last._timeout).toBe(5000);
    });

    it("POST sends data in body", async () => {
        const { registerXhr } = await import("../../src/extensions/xhr");
        const $: Record<string, unknown> = {};
        registerXhr($);
        ($.post as Function)("/api", { name: "test" });
        expect(MockXHR.last.method).toBe("POST");
        expect(MockXHR.last.data).toBe("name=test");
    });

    it("DELETE uses correct method", async () => {
        const { registerXhr } = await import("../../src/extensions/xhr");
        const $: Record<string, unknown> = {};
        registerXhr($);
        ($.delete as Function)("/api/1");
        expect(MockXHR.last.method).toBe("DELETE");
    });

    it("registers all documented methods", async () => {
        const { registerXhr } = await import("../../src/extensions/xhr");
        const $: Record<string, unknown> = {};
        registerXhr($);
        ["get", "post", "put", "delete", "connect", "options", "trace", "patch", "head", "copy"].forEach(
            (m) => {
                expect(typeof $[m]).toBe("function");
            }
        );
    });

    it("returns the XMLHttpRequest object", async () => {
        const { registerXhr } = await import("../../src/extensions/xhr");
        const $: Record<string, unknown> = {};
        registerXhr($);
        const req = ($.get as Function)("/api");
        expect(req).toBe(MockXHR.last);
    });
});
