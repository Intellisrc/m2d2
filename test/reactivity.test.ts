import { describe, it, expect, beforeEach, vi } from "vitest";
import { proxy, dispatchUpdate, isLinkedRef, observe, registerSource } from "../src/reactivity";
import { extDom } from "../src/dom";
import { config } from "../src/config";
import type { M2d2Node } from "../src/types";

describe("isLinkedRef", () => {
    it("detects [obj, 'prop']", () => {
        const obj = { name: "x" };
        expect(isLinkedRef([obj, "name"])).toBe(true);
    });
    it("detects [obj, 'prop', fn]", () => {
        const obj = { name: "x" };
        expect(isLinkedRef([obj, "name", (v: unknown) => v])).toBe(true);
    });
    it("rejects plain arrays", () => {
        expect(isLinkedRef([1, 2, 3])).toBe(false);
    });
    it("rejects non-arrays", () => {
        expect(isLinkedRef("string")).toBe(false);
        expect(isLinkedRef({})).toBe(false);
    });
});

describe("proxy short assignment", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"><span class="name">old</span></div>';
    });

    it("proxy wraps element and allows get", () => {
        const node = extDom("#root") as M2d2Node;
        const proxied = proxy(node);
        expect(proxied.find(".name")!.text).toBe("old");
    });

    it("proxy returns unwrapped when short is disabled", () => {
        const saved = config.short;
        config.short = false;
        const node = extDom("#root") as M2d2Node;
        const result = proxy(node);
        expect(result).toBe(node); // no proxy wrapper
        config.short = saved;
    });
});

describe("dispatchUpdate + observe", () => {
    // Use distinct newValues per test so module-level dedupe state doesn't leak between tests:
    it("dispatchUpdate fires update event on node with onupdate", () => {
        document.body.innerHTML = '<div id="root"></div>';
        const node = extDom("#root") as M2d2Node;
        const spy = vi.fn();
        node.onupdate = spy;
        dispatchUpdate(node, { type: "string", property: "text", newValue: "x", oldValue: "" });
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("dispatchUpdate deduplicates identical events within timeout", () => {
        document.body.innerHTML = '<div id="root2"></div>';
        const node = extDom("#root2") as M2d2Node;
        const spy = vi.fn();
        node.onupdate = spy;
        dispatchUpdate(node, { type: "string", property: "dedup-test", newValue: "dedup-x", oldValue: "" });
        dispatchUpdate(node, { type: "string", property: "dedup-test", newValue: "dedup-x", oldValue: "" });
        expect(spy).toHaveBeenCalledTimes(1); // deduped
    });

    it("dispatchUpdate fires for distinct values", () => {
        document.body.innerHTML = '<div id="root3"></div>';
        const node = extDom("#root3") as M2d2Node;
        const spy = vi.fn();
        node.onupdate = spy;
        dispatchUpdate(node, { type: "string", property: "distinct-test", newValue: "a", oldValue: "" });
        dispatchUpdate(node, { type: "string", property: "distinct-test", newValue: "b", oldValue: "a" });
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it("dispatchUpdate does nothing when updates disabled", () => {
        document.body.innerHTML = '<div id="root"></div>';
        const node = extDom("#root") as M2d2Node;
        const spy = vi.fn();
        node.onupdate = spy;
        const saved = config.updates;
        config.updates = false;
        dispatchUpdate(node, { type: "string", property: "text", newValue: "x", oldValue: "" });
        config.updates = saved;
        expect(spy).not.toHaveBeenCalled();
    });
});
