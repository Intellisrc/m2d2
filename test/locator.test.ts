import { describe, it, expect, beforeEach } from "vitest";
import { locate, wireLocator } from "../src/locator";
import { extDom } from "../src/dom";

wireLocator(extDom);

describe("locator", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="root">
                <span id="name">by-id</span>
                <input name="email" value="" />
                <span class="active">by-class</span>
                <span class="active">by-class-2</span>
                <p>tag-match</p>
            </div>
        `;
    });

    it("finds by ID first", () => {
        const node = extDom("#root")!;
        const { matched } = locate(node, "name", "");
        expect(matched.length).toBe(1);
        expect(matched[0].id).toBe("name");
    });

    it("finds by name attribute", () => {
        const node = extDom("#root")!;
        const { matched } = locate(node, "email", "");
        expect(matched.length).toBe(1);
        expect((matched[0] as HTMLInputElement).name).toBe("email");
    });

    it("finds by class and marks ambiguous", () => {
        const node = extDom("#root")!;
        const { matched, ambiguous } = locate(node, "active", "");
        expect(matched.length).toBe(2);
        expect(ambiguous).toBe(true);
    });

    it("finds by tag name", () => {
        const node = extDom("#root")!;
        const { matched } = locate(node, "p", "");
        expect(matched.length).toBe(1);
        expect(matched[0].tagName).toBe("P");
    });

    it("skips template key", () => {
        const node = extDom("#root")!;
        const { matched } = locate(node, "template", {});
        expect(matched.length).toBe(0);
    });

    it("skips when value is a function", () => {
        const node = extDom("#root")!;
        const { matched } = locate(node, "name", () => {});
        expect(matched.length).toBe(0);
    });

    it("returns empty for non-existent key", () => {
        const node = extDom("#root")!;
        const { matched, ambiguous } = locate(node, "nonexistent", "");
        expect(matched.length).toBe(0);
        expect(ambiguous).toBe(false);
    });
});
