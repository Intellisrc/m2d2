import { describe, it, expect, beforeEach } from "vitest";
import { doDom } from "../src/binding";
import { extDom } from "./../src/dom";

describe("doDom basic binding", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
    });

    it("binds text to empty node", () => {
        const node = doDom("#root", { text: "foo" })!;
        expect(node.text).toBe("foo");
    });

    it("sets innerHTML from html string (shape 2)", () => {
        const node = doDom("#root", "<b>bold</b>")!;
        expect(node.querySelector("b")).not.toBeNull();
    });

    it("returns extended node when no object (shape 3)", () => {
        document.body.innerHTML = '<div id="root"><span>hi</span></div>';
        const node = doDom("#root")!;
        expect(node.find("span")!.text).toBe("hi");
    });

    it("binds to child by class → text", () => {
        document.body.innerHTML = '<div id="root"><span class="name"></span></div>';
        const node = doDom("#root", { name: "Yoda" })!;
        expect(node.find(".name")!.text).toBe("Yoda");
    });

    it("when an input is named 'name'", () => {
		// Even the input element has a 'name' attribute, because it's name is 'name', value should have priority
        document.body.innerHTML = '<div id="root"><input type="text" name="name" class="user_name" value="" /></div>';
        const node = doDom("#root", { name: "yoda222" })!;
        expect(node.name.value).toBe("yoda222");
    });

    it("when an element has class 'name'", () => {
		// Even the input element has a 'name' attribute, because it's class is 'name', value should have priority
        document.body.innerHTML = '<div id="root"><input type="text" name="user_name" class="name" value="" /></div>';
        const node = doDom("#root", { name: "yoda222" })!;
        expect(node.name.value).toBe("yoda222");
    });

    it("binds to child by class → value (input)", () => {
        document.body.innerHTML = '<div id="root"><input class="age" type="text"></div>';
        const node = doDom("#root", { age: 30 })!;
        expect((node.find(".age") as HTMLInputElement).value).toBe("30");
    });

    it("binds to child by name attribute", () => {
        document.body.innerHTML = '<div id="root"><input name="email" type="text"></div>';
        const node = doDom("#root", { email: "a@b.com" })!;
        expect((node.find("[name=email]") as HTMLInputElement).value).toBe("a@b.com");
    });

    it("creates child element by tag name when not found", () => {
        const node = doDom("#root", { span: { text: "created" } })!;
        expect(node.find("span")!.text).toBe("created");
    });

    it("binds css property", () => {
        const node = doDom("#root", { css: "myclass" })!;
        expect(node.className).toBe("myclass");
    });

    it("binds style object", () => {
        const node = doDom("#root", { style: { color: "red" } })!;
        expect(node.style.color).toBe("red");
    });

    it("binds dataset object", () => {
        const node = doDom("#root", { dataset: { id: "100" } })!;
        expect(node.dataset.id).toBe("100");
    });

    it("binds boolean property (disabled)", () => {
        document.body.innerHTML = '<div id="root"><input name="x" type="text"></div>';
        const node = doDom("#root", { x: { disabled: true } })!;
        expect((node.find("[name=x]") as HTMLInputElement).disabled).toBe(true);
    });

    it("dispatches onload for non-native tags", () => {
        let loaded = false;
        doDom("#root", { text: "x", onload: () => { loaded = true; } });
        expect(loaded).toBe(true);
    });
});
