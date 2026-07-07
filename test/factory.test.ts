import { describe, it, expect } from "vitest";
import { $, root, setupFixture } from "./helpers";

describe("$ factory shapes", () => {
    setupFixture();

    it("$(selector, {text}) sets text", () => {
        const q = $(root, { text: "foo" }) as any;
        expect(q.text).toBe("foo");
        expect(document.querySelector(root)!.textContent).toBe("foo");
    });

    it("$(selector) returns extended element", () => {
        const q = $(root) as any;
        expect(typeof q.find).toBe("function");
        expect(typeof q.findAll).toBe("function");
    });

    it("$(selector, htmlString) sets innerHTML", () => {
        $(root, `<div class="injected">hi</div>`);
        expect(document.querySelector(root + " .injected")).not.toBeNull();
    });

    it("$({plain}) creates observable fragment", () => {
        const frag = $({ name: "test", value: 42 }) as any;
        expect(frag.name).toBe("test");
        expect(frag.value).toBe(42);
    });

    it("short assignment: set value guesses property", () => {
        document.body.innerHTML = '<div id="qunit-fixture"><span class="name"></span></div>';
        const node = $(root, { name: "Yoda" }) as any;
        expect(node.name.text).toBe("Yoda");
        // Short assign: node.name = "x" sets .text
        node.name = "Changed";
        expect(node.name.text).toBe("Changed");
    });

    it("onready fires after $() returns (microtask)", async () => {
        let ready = false;
        const node = $(root, {
            text: "x",
            onready: () => {
                ready = true;
            },
        }) as any;
        expect(ready).toBe(false); // not yet (microtask)
        await Promise.resolve(); // flush microtask
        expect(ready).toBe(true);
    });

    it("onload fires synchronously during bind", () => {
        let loaded = false;
        $(root, {
            text: "x",
            onload: () => {
                loaded = true;
            },
        });
        expect(loaded).toBe(true);
    });
});
