import { describe, it, expect, beforeEach, vi } from "vitest";
import { doDom } from "../src/binding";

/**
 * Regression guard: specifying `tagName` means "create this element", never
 * "look it up". None of these creation paths may trigger the unknown-key
 * diagnostic ("Not sure what to do with key: ..."), which routes through
 * console.error via warnUnknownKey() in src/log.ts.
 */
describe("tagName creation never warns 'Not sure what to do with key'", () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    /** Assert neither console channel emitted the unknown-key diagnostic. */
    function expectNoUnknownKey(): void {
        const re = /Not sure what to do with key/;
        const badError = errorSpy.mock.calls.find((c) => re.test(String(c[0] ?? "")));
        const badWarn = warnSpy.mock.calls.find((c) => re.test(String(c[0] ?? "")));
        expect(badError, `unexpected console.error: ${JSON.stringify(badError)}`).toBeUndefined();
        expect(badWarn, `unexpected console.warn: ${JSON.stringify(badWarn)}`).toBeUndefined();
    }

    it("direct tagName spec creates an element", () => {
        const node = doDom("#root", {
            first: { tagName: "div", text: "A" },
        })!;
        expect(node.findAll("div").length).toBe(1);
        expect(node.find("div")!.text).toBe("A");
        expectNoUnknownKey();
    });

    it("tagName spec under a non-tag key creates the element", () => {
        // `child` is NOT a valid HTML tag, so tagName is the only creation hint.
        const node = doDom("#root", {
            child: { tagName: "span", text: "x" },
        })!;
        expect(node.findAll("span").length).toBe(1);
        expect(node.find("span")!.text).toBe("x");
        expectNoUnknownKey();
    });

    it("multiple sibling tagName specs each create their element", () => {
        const node = doDom("#root", {
            first: { tagName: "div", text: "A" },
            second: { tagName: "div", text: "B" },
        })!;
        expect(node.findAll("div").length).toBe(2);
        expectNoUnknownKey();
    });

    it("creation by tag-name key (no tagName field) does not warn", () => {
        const node = doDom("#root", { span: { text: "created" } })!;
        expect(node.find("span")!.text).toBe("created");
        expectNoUnknownKey();
    });

    it("tagName at top level of a spec is silently ignored (no warning)", () => {
        // The root already exists; tagName here is filtered out, never warned.
        const node = doDom("#root", { tagName: "section", text: "hi" })!;
        expect(node.text).toBe("hi");
        expectNoUnknownKey();
    });

    it("template with nested tagName children (issue #35 style 1)", () => {
        const node = doDom("#root", {
            template: {
                span: {
                    name: { tagName: "a", css: "name" },
                },
            },
        })!;
        (node as any).items.push({ name: "test" });
        expect(node.items.length).toBe(1);
        expect((node.items.first() as any).name.text).toBe("test");
        expect((node.items.first() as any).name.tagName).toBe("A");
        expectNoUnknownKey();
    });

    it("template root uses tagName when key is not a valid tag (issue #35 style 2)", () => {
        const node = doDom("#root", {
            template: {
                child: {
                    tagName: "span", // key 'child' is not a valid tag → tagName drives creation
                    name: { tagName: "a", css: "name" },
                },
            },
        })!;
        (node as any).items.push({ name: "test" });
        expect(node.items.length).toBe(1);
        expect((node.items.first() as any).name.text).toBe("test");
        expect((node.items.first() as any).tagName).toBe("SPAN");
        expectNoUnknownKey();
    });

    it("tagName inside JS template + items", () => {
        const node = doDom("#root", {
            template: {
                div: {
                    css: "user",
                    name: { tagName: "span", css: "name" },
                },
            },
            items: [{ name: "Paul" }, { name: "Sam" }],
        })!;
        expect(node.findAll(".user").length).toBe(2);
        expect((node.findAll(".name")[0] as any).textContent).toBe("Paul");
        expectNoUnknownKey();
    });
});
