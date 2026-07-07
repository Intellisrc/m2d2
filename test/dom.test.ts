import { describe, it, expect, beforeEach } from "vitest";
import { extDom, installPrototypes } from "../src/dom";

describe("extDom properties", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        installPrototypes();
    });

    it("text get/set on empty node", () => {
        const node = extDom("#root")!;
        node.text = "hello";
        expect(node.text).toBe("hello");
        expect(document.querySelector("#root")!.textContent).toBe("hello");
    });

    it("text preserves child elements (issue #05)", () => {
        document.body.innerHTML = '<div id="root"><span class="child">keep</span></div>';
        const node = extDom("#root")!;
        node.text = "prefix";
        expect(document.querySelector("#root .child")).not.toBeNull();
    });

    it("html get/set", () => {
        const node = extDom("#root")!;
        node.html = "<b>bold</b>";
        expect(node.html).toBe("<b>bold</b>");
        expect(document.querySelector("#root b")).not.toBeNull();
    });

    it("css set via string", () => {
        const node = extDom("#root")!;
        node.css = "myclass";
        expect(node.className).toBe("myclass");
    });

    it("css set via array", () => {
        const node = extDom("#root")!;
        node.css = ["full", "blue"];
        expect(node.className).toBe("full blue");
    });

    it("css set via object (add/remove)", () => {
        const node = extDom("#root")!;
        node.className = "existing";
        node.css = { existing: false, active: true };
        expect(node.classList.contains("existing")).toBe(false);
        expect(node.classList.contains("active")).toBe(true);
    });

    it("css get returns classList", () => {
        const node = extDom("#root")!;
        node.className = "a b";
        expect(node.css.contains("a")).toBe(true);
        expect(node.css.length).toBe(2);
    });

    it("find returns extended child", () => {
        document.body.innerHTML = '<div id="root"><span class="child">x</span></div>';
        const node = extDom("#root")!;
        const child = node.find(".child");
        expect(child).not.toBeNull();
        expect(child!.text).toBe("x");
    });

    it("findAll returns array of children", () => {
        document.body.innerHTML = '<div id="root"><span class="a">1</span><span class="a">2</span></div>';
        const node = extDom("#root")!;
        const items = node.findAll(".a");
        expect(items.length).toBe(2);
    });

    it("index returns position in parent", () => {
        document.body.innerHTML = '<ul><li>1</li><li id="target">2</li><li>3</li></ul>';
        const node = extDom("#target")!;
        expect((node.index as Function)()).toBe(1);
    });

    it("posterior/anterior return siblings", () => {
        document.body.innerHTML = '<ul><li id="a">1</li><li id="b">2</li><li id="c">3</li></ul>';
        const b = extDom("#b")!;
        expect(b.posterior()!.id).toBe("c");
        expect(b.anterior()!.id).toBe("a");
    });

    it("extDom is idempotent (calling twice doesn't re-stamp)", () => {
        const node1 = extDom("#root")!;
        const node2 = extDom("#root")!;
        expect(node1).toBe(node2);
    });

    it("show/hide toggles display", () => {
        const node = extDom("#root")!;
        node.show = false;
        expect(node.style.display).toBe("none");
        node.show = true;
        expect(node.style.display).not.toBe("none");
    });

    it("getData on form returns field values", () => {
        document.body.innerHTML =
            '<form id="root"><input type="text" name="user" value="bob"><input type="checkbox" name="active" value="1" checked></form>';
        const form = extDom("#root")!;
        const data = form.getData!();
        expect(data.user).toBe("bob");
        expect(data.active).toBe("1"); // checkbox has value="1"
    });

    it("getData groups multi-value fields into arrays", () => {
        document.body.innerHTML =
            '<form id="root">' +
            '<input type="checkbox" name="tag" value="a" checked>' +
            '<input type="checkbox" name="tag" value="b" checked>' +
            '<input type="checkbox" name="tag" value="c" checked>' +
            "</form>";
        const form = extDom("#root")!;
        const data = form.getData!();
        expect(data.tag).toEqual(["a", "b", "c"]);
    });
});
