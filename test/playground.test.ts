import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// playground-core.js is a dependency-free classic script. Load it as text and
// eval into the jsdom global so we can exercise its pure functions. It exposes
// window.pg = { parseLesson, assembleSrcDoc }.
const PG_SRC = fs.readFileSync(
    path.resolve(__dirname, "../examples/js/playground-core.js"),
    "utf8"
);

function loadPg() {
    (0, eval)(PG_SRC);
}

describe("parseLesson", () => {
    beforeEach(() => loadPg());

    it("extracts html, js, css from a complete lesson file", () => {
        const src = `<!DOCTYPE html><html><head>
<style>body { color: red; }</style>
</head><body>
<h1 id="t">Hi</h1>
<script src="../../dist/m2d2.min.js"></script>
<script>m2d2.ready($ => { $("#t", "Hello"); });</script>
</body></html>`;
        const result = (globalThis as any).pg.parseLesson(src);
        expect(result.css.trim()).toBe("body { color: red; }");
        expect(result.js.trim()).toBe('m2d2.ready($ => { $("#t", "Hello"); });');
        // html = body innerHTML minus script/style tags; the h1 remains:
        expect(result.html).toContain('<h1 id="t">Hi</h1>');
        expect(result.html).not.toContain("<script");
        expect(result.html).not.toContain("<style");
    });

    it("handles multiple <style> tags (concatenated)", () => {
        const src = `<html><head><style>a{}</style><style>b{}</style></head><body><p>x</p></body></html>`;
        const result = (globalThis as any).pg.parseLesson(src);
        expect(result.css).toContain("a{}");
        expect(result.css).toContain("b{}");
    });

    it("handles a lesson with no <style> (empty css)", () => {
        const src = `<html><body><p>x</p><script>1;</script></body></html>`;
        const result = (globalThis as any).pg.parseLesson(src);
        expect(result.css).toBe("");
    });

    it("handles a lesson with no inline <script> (empty js)", () => {
        const src = `<html><head><style>x{}</style></head><body><p>x</p></body></html>`;
        const result = (globalThis as any).pg.parseLesson(src);
        expect(result.js).toBe("");
    });

    it("excludes external <script src> from js (only inline scripts)", () => {
        const src = `<html><body><script src="x.js"></script><script>INLINE;</script></body></html>`;
        const result = (globalThis as any).pg.parseLesson(src);
        expect(result.js.trim()).toBe("INLINE;");
    });

    it("handles a body-less html string (DOMParser synthesizes an empty body)", () => {
        // DOMParser in text/html mode always creates a <body>, even for markup
        // that doesn't include one. So parseLesson returns empty html rather than
        // throwing. The defensive !body guard is for non-HTML parser modes only.
        const src = `<html><head></head></html>`;
        const result = (globalThis as any).pg.parseLesson(src);
        expect(result.html).toBe("");
        expect(result.js).toBe("");
        expect(result.css).toBe("");
    });

    it("extracts <link rel=stylesheet> tags from <head> into links[]", () => {
        const src = `<html><head>
<link rel="stylesheet" href="../../dist/alert.css">
<link rel="stylesheet" href="other.css">
</head><body><p>hi</p></body></html>`;
        const result = (globalThis as any).pg.parseLesson(src);
        expect(result.links).toHaveLength(2);
        expect(result.links[0]).toContain('href="../../dist/alert.css"');
        expect(result.links[1]).toContain('href="other.css"');
    });
});

describe("assembleSrcDoc", () => {
    beforeEach(() => loadPg());

    it("produces a complete html document with base, error bootstrap, and user code", () => {
        const result = (globalThis as any).pg.assembleSrcDoc(
            "<h1>Hi</h1>",
            "m2d2.ready($=>{});",
            "body{color:red;}",
            "http://localhost:8000/examples/tutorial/"
        );
        expect(result).toContain("<!DOCTYPE html>");
        expect(result).toContain('<base href="http://localhost:8000/examples/tutorial/">');
        expect(result).toContain("window.onerror");
        expect(result).toContain("<h1>Hi</h1>");
        expect(result).toContain("m2d2.ready($=>{});");
        expect(result).toContain("body{color:red;}");
    });

    it("includes the m2d2 library script tag", () => {
        const result = (globalThis as any).pg.assembleSrcDoc("", "", "", "http://x/");
        expect(result).toContain('src="../../dist/m2d2.min.js"');
    });

    it("injects the error bootstrap before the library script", () => {
        const result = (globalThis as any).pg.assembleSrcDoc("", "", "", "http://x/");
        const onErrorIdx = result.indexOf("window.onerror");
        const libIdx = result.indexOf('m2d2.min.js');
        expect(onErrorIdx).toBeGreaterThan(-1);
        expect(libIdx).toBeGreaterThan(-1);
        expect(onErrorIdx).toBeLessThan(libIdx);
    });

    it("namespaces console.error/warn through postMessage", () => {
        const result = (globalThis as any).pg.assembleSrcDoc("", "", "", "http://x/");
        // The bootstrap loops ['error','warn'] and reassigns console[level], so
        // it doesn't literally contain "console.error" — check for the loop and
        // the pg-error postMessage type instead.
        expect(result).toContain("pg-error");
        expect(result).toContain("['error','warn']");
        expect(result).toContain("console[level]");
    });

    it("injects preserved <link> tags into <head> when opts.links is passed", () => {
        const links = ['<link rel="stylesheet" href="../../dist/alert.css">'];
        const result = (globalThis as any).pg.assembleSrcDoc(
            "<p>hi</p>", "", "", "http://x/", { links }
        );
        expect(result).toContain('<link rel="stylesheet" href="../../dist/alert.css">');
        // links go in <head>, after <base> and bootstrap, before <style>:
        const linkIdx = result.indexOf('alert.css');
        const styleIdx = result.indexOf("<style>");
        expect(linkIdx).toBeGreaterThan(-1);
        expect(styleIdx).toBeGreaterThan(-1);
        expect(linkIdx).toBeLessThan(styleIdx);
    });

    it("omits links when opts.links is not provided (backward compatible)", () => {
        const result = (globalThis as any).pg.assembleSrcDoc("", "", "", "http://x/");
        expect(result).not.toContain("<link");
    });
});
