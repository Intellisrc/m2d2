import { describe, it, expect, vi } from "vitest";
import { $, setupFixture, fixture } from "./helpers";

/**
 * Covers two changes:
 *  1. Bug: `items` changes must fire the "update" event exactly once (was 2–3×).
 *  2. Feature: reassigning `items` reconciles (reuses/reorders nodes) instead of
 *     clearing + rebuilding — preserving DOM identity, focus, and dataset.id.
 *
 * `dataset.id` must always equal the positional index in every mode, so that
 * `items.get(i)` and the existing invariant (template.test.ts) keep working.
 */
describe("items reconciliation + single update", () => {
    setupFixture();

    /** Resolve observer microtasks + clear the 50ms dedupe window. */
    function flush(): Promise<void> {
        return new Promise((r) => setTimeout(r, 80));
    }

    it("reassigning items reuses the same DOM nodes (no rebuild)", () => {
        fixture('<ul id="root"></ul>');
        const node = $("#root", {
            template: { li: { span: { css: "name" } } },
            items: [{ name: "A" }, { name: "B" }],
        }) as any;

        const liBefore = node.findAll("li")[0];
        const spanBefore = liBefore.querySelector(".name");

        node.items = [{ name: "A2" }, { name: "B2" }];

        const liAfter = node.findAll("li")[0];
        expect(liAfter).toBe(liBefore); // same <li> element reused
        expect(liAfter.querySelector(".name")).toBe(spanBefore); // same child reused
        expect(liAfter.querySelector(".name").textContent).toBe("A2"); // content updated
    });

    it("positional reconcile grows and shrinks the list", () => {
        fixture('<ul id="root"></ul>');
        const node = $("#root", { template: { li: { span: { css: "name" } } } }) as any;

        node.items = [{ name: "a" }, { name: "b" }, { name: "c" }];
        expect(node.findAll("li").length).toBe(3);

        // Shrink — the reused nodes keep their identity:
        const firstLi = node.findAll("li")[0];
        node.items = [{ name: "a" }];
        expect(node.findAll("li").length).toBe(1);
        expect(node.findAll("li")[0]).toBe(firstLi);

        // Grow again:
        node.items = [{ name: "a" }, { name: "b" }];
        expect(node.findAll("li").length).toBe(2);
    });

    it("dataset.id always equals the positional index after reassign", () => {
        fixture('<ul id="root"></ul>');
        const node = $("#root", {
            template: { li: { span: { css: "name" } } },
            items: [{ name: "a" }, { name: "b" }],
        }) as any;

        node.items = [{ name: "x" }, { name: "y" }, { name: "z" }];
        expect(node.items[0].dataset.id).toBe("0");
        expect(node.items[1].dataset.id).toBe("1");
        expect(node.items[2].dataset.id).toBe("2");
        // get() still works by index:
        expect(node.items.get(1).querySelector(".name").textContent).toBe("y");
    });

    it("keyed reconcile reuses the right nodes across a reorder", () => {
        fixture('<ul id="root"></ul>');
        const node = $("#root", {
            key: "id",
            template: { li: { span: { css: "name" } } },
            items: [
                { id: 1, name: "A" },
                { id: 2, name: "B" },
                { id: 3, name: "C" },
            ],
        }) as any;

        const spanOfId2 = node.findAll("li")[1].querySelector(".name");

        // Reverse the order; id:2 stays in the middle:
        node.items = [
            { id: 3, name: "C" },
            { id: 2, name: "B" },
            { id: 1, name: "A" },
        ];

        const lis = node.findAll("li");
        // Same span node reused (now still at the middle position):
        expect(lis[1].querySelector(".name")).toBe(spanOfId2);
        // New order reflected in content:
        expect(lis[0].querySelector(".name").textContent).toBe("C");
        expect(lis[2].querySelector(".name").textContent).toBe("A");
        // dataset.id stays positional even in keyed mode:
        expect(node.items[0].dataset.id).toBe("0");
        expect(node.items[2].dataset.id).toBe("2");
    });

    it("keyed reconcile handles prepend without rebuilding existing nodes", () => {
        fixture('<ul id="root"></ul>');
        const node = $("#root", {
            key: "id",
            template: { li: { span: { css: "name" } } },
            items: [{ id: 1, name: "A" }, { id: 2, name: "B" }],
        }) as any;

        const spanA = node.findAll("li")[0].querySelector(".name");
        const spanB = node.findAll("li")[1].querySelector(".name");

        node.items = [
            { id: 3, name: "C" },
            { id: 1, name: "A" },
            { id: 2, name: "B" },
        ];

        const lis = node.findAll("li");
        expect(lis[1].querySelector(".name")).toBe(spanA); // A reused
        expect(lis[2].querySelector(".name")).toBe(spanB); // B reused
        expect(lis[0].querySelector(".name").textContent).toBe("C"); // C created
    });

    it("key can be declared as a function", () => {
        fixture('<ul id="root"></ul>');
        const node = $("#root", {
            key: (item: any) => "u" + item.id, // computed key
            template: { li: { span: { css: "name" } } },
            items: [{ id: 1, name: "A" }, { id: 2, name: "B" }],
        }) as any;

        const spanA = node.findAll("li")[0].querySelector(".name");
        node.items = [{ id: 2, name: "B" }, { id: 1, name: "A" }];
        const lis = node.findAll("li");
        expect(lis[1].querySelector(".name")).toBe(spanA); // id:1 reused, moved to index 1
        expect(lis[0].querySelector(".name").textContent).toBe("B");
    });

    it("a non-renderable string key field is consumed, not warned about", () => {
        fixture('<ul id="root"></ul>');
        const eSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const wSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const node = $("#root", {
            key: "sku", // 'sku' is neither a prop nor a child of <li>
            template: { li: { span: { css: "name" } } },
            items: [{ sku: "x1", name: "A" }, { sku: "x2", name: "B" }],
        }) as any;

        const spanB = node.findAll("li")[1].querySelector(".name");
        node.items = [{ sku: "x2", name: "B" }, { sku: "x1", name: "A" }];
        const lis = node.findAll("li");
        expect(lis[0].querySelector(".name")).toBe(spanB); // x2 reused, moved to front

        const unknownKey = [...eSpy.mock.calls, ...wSpy.mock.calls].some((c) =>
            /Not sure what to do with key/.test(String(c[0] ?? ""))
        );
        expect(unknownKey, "string key field should be consumed without warning").toBe(false);
    });

    it("BUG: reassigning items fires the update event exactly once", async () => {
        fixture('<ul id="root"></ul>');
        const node = $("#root", {
            template: { li: { text: "" } },
            items: [{ text: "a" }],
        }) as any;

        let count = 0;
        node.addEventListener("update", (ev: any) => {
            if (ev.detail.property === "items") count++;
        });

        node.items = [{ text: "x" }, { text: "y" }];
        await flush();

        expect(count).toBe(1);
    });

    it("BUG: two rapid reassignments both fire (dedupe must not drop them)", async () => {
        fixture('<ul id="root"></ul>');
        const node = $("#root", { template: { li: { text: "" } }, items: [] }) as any;

        let count = 0;
        node.addEventListener("update", (ev: any) => {
            if (ev.detail.property === "items") count++;
        });

        node.items = [{ text: "a" }];
        node.items = [{ text: "b" }];
        await flush();

        expect(count).toBe(2);
    });

    it("BUG: push fires the update event exactly once", async () => {
        fixture('<ul id="root"></ul>');
        const node = $("#root", { template: { li: { text: "" } }, items: [] }) as any;

        let count = 0;
        node.addEventListener("update", (ev: any) => {
            if (ev.detail.property === "items") count++;
        });

        node.items.push({ text: "a" });
        await flush();

        expect(count).toBe(1);
    });

    it("BUG: splice fires the update event exactly once", async () => {
        fixture('<ul id="root"></ul>');
        const node = $("#root", {
            template: { li: { text: "" } },
            items: [{ text: "a" }, { text: "b" }, { text: "c" }],
        }) as any;

        let count = 0;
        node.addEventListener("update", (ev: any) => {
            if (ev.detail.property === "items") count++;
        });

        node.items.splice(1, 1, { text: "x" });
        await flush();

        expect(count).toBe(1);
        expect(node.items[1].text).toBe("x");
    });
});
