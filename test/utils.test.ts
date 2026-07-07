import { describe, it, expect, beforeEach } from "vitest";
import { utils } from "../src/utils";

describe("Utils type checks", () => {
    it("isString", () => {
        expect(utils.isString("hello")).toBe(true);
        expect(utils.isString(123)).toBe(false);
        expect(utils.isString(null)).toBe(false);
    });
    it("isBool", () => {
        expect(utils.isBool(true)).toBe(true);
        expect(utils.isBool(1)).toBe(false);
    });
    it("isNumeric", () => {
        expect(utils.isNumeric(42)).toBe(true);
        expect(utils.isNumeric("42")).toBe(true);
        expect(utils.isNumeric("abc")).toBe(false);
        expect(utils.isNumeric(null)).toBe(false);
    });
    it("isPlainObject", () => {
        expect(utils.isPlainObject({})).toBe(true);
        expect(utils.isPlainObject([])).toBe(false);
        expect(utils.isPlainObject(null)).toBe(false);
    });
    it("isObject", () => {
        expect(utils.isObject({})).toBe(true);
        expect(utils.isObject([])).toBe(true);
        expect(utils.isObject(null)).toBe(false);
        expect(utils.isObject("str")).toBe(false);
    });
    it("isArray", () => {
        expect(utils.isArray([])).toBe(true);
        expect(utils.isArray({})).toBe(false);
    });
    it("isFunction", () => {
        expect(utils.isFunction(() => {})).toBe(true);
        expect(utils.isFunction({})).toBe(false);
    });
    it("isHtml — accepts HTML strings, rejects non-strings", () => {
        expect(utils.isHtml("<div>hi</div>")).toBe(true);
        expect(utils.isHtml("plain text")).toBe(false);
        expect(utils.isHtml(undefined)).toBe(false); // FIX: was true in original
        expect(utils.isHtml(123)).toBe(false); // FIX: was true in original
    });
    it("isEmpty", () => {
        expect(utils.isEmpty(undefined)).toBe(true);
        expect(utils.isEmpty(null)).toBe(true);
        expect(utils.isEmpty("")).toBe(true);
        expect(utils.isEmpty({})).toBe(true);
        expect(utils.isEmpty({ a: 1 })).toBe(false);
        expect(utils.isEmpty("text")).toBe(false);
    });
});

describe("Utils element helpers", () => {
    it("newElement creates valid elements", () => {
        expect(utils.newElement("div").tagName).toBe("DIV");
    });
    it("newElement falls back for invalid/numeric tag", () => {
        expect(utils.newElement("123").tagName).toBe("INVALID");
        expect(utils.newElement("").tagName).toBe("INVALID");
    });
    it("htmlElement parses HTML", () => {
        const el = utils.htmlElement("<span>hi</span>");
        expect(el).not.toBeNull();
        expect(el!.tagName).toBe("SPAN");
    });
    it("newEmptyNode returns a DocumentFragment", () => {
        expect(utils.newEmptyNode() instanceof DocumentFragment).toBe(true);
    });
    it("isValidElement recognizes div but not template", () => {
        expect(utils.isValidElement("div")).toBe(true);
        expect(utils.isValidElement("template")).toBe(false);
    });
});

describe("Utils attr/prop", () => {
    beforeEach(() => {
        document.body.innerHTML = '<input type="text" name="age" value="30">';
    });
    it("hasAttr detects checked on checkbox/radio", () => {
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = true;
        expect(utils.hasAttr(cb, "checked")).toBe(true);
    });
    it("hasProp vs hasAttr for value", () => {
        const inp = document.querySelector("input")!;
        // value is set as an attribute (value="30"), so hasProp is false but hasAttr/hasAttrOrProp true:
        expect(utils.hasProp(inp, "value")).toBe(false);
        expect(utils.hasAttr(inp, "value")).toBe(true);
        expect(utils.hasAttrOrProp(inp, "value")).toBe(true);
    });
    it("setAttr sets and removes", () => {
        const div = document.createElement("div");
        utils.setAttr(div, "data-x", "1");
        expect(div.hasAttribute("data-x")).toBe(true);
        utils.setAttr(div, "data-x", false);
        expect(div.hasAttribute("data-x")).toBe(false);
    });
});
