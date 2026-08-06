import { describe, it, expect } from "vitest";
import { $, setupFixture, fixture } from "./helpers";

/**
 * An items container nested inside a template item must keep its rendered
 * children after the parent item is pushed.
 *
 * Regression: when an item is pushed, getItemWithEvents re-applies the template
 * to the new node to wire event handlers. That re-application used to synthesize
 * `items = []` whenever a `template` was seen without an explicit `items` key
 * (handleNoMatch "items is optional when template is set"). Under the 3.1.0
 * reconciliation, that empty-items call then wiped the nested children that had
 * just been rendered. The fix only synthesizes the empty init when the container
 * has not been initialized yet (`node.items === undefined`).
 */
describe("nested items container inside a template item", () => {
    setupFixture();

    /** A list whose item template declares a nested ".tags" items container. */
    const makeList = () => {
        fixture('<ul id="list"></ul>');
        return $("#list", {
            template: {
                li: {
                    css: "card",
                    tags: {
                        tagName: "span",
                        css: "tags",
                        template: { span: { css: "tag" } }
                    }
                }
            },
            items: []
        } as any);
    };

    it("renders nested items when the parent item is pushed", () => {
        const list = makeList() as any;
        list.items.clear();
        list.items.push({
            dataset: { id: 1 },
            tags: { items: [{ css: "tag", text: "a" }] }
        });
        expect(list.querySelectorAll("li").length).toBe(1);
        expect(list.querySelectorAll("li .tags .tag").length).toBe(1);
        expect(list.querySelector("li .tag")!.textContent).toBe("a");
    });

    it("renders multiple nested items", () => {
        const list = makeList() as any;
        list.items.clear();
        list.items.push({
            tags: { items: [{ css: "tag" }, { css: "tag" }, { css: "tag" }] }
        });
        expect(list.querySelectorAll("li .tags .tag").length).toBe(3);
    });

    it("does not wipe a previous item's nested items when a new item is pushed", () => {
        const list = makeList() as any;
        list.items.clear();
        list.items.push({ tags: { items: [{ css: "tag" }] } });
        list.items.push({ tags: { items: [{ css: "tag" }, { css: "tag" }] } });
        const items = list.querySelectorAll("li");
        expect(items.length).toBe(2);
        expect(items[0].querySelectorAll(".tag").length).toBe(1);
        expect(items[1].querySelectorAll(".tag").length).toBe(2);
    });
});
