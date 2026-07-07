import { describe, it, expect } from "vitest";
import { $, root, setupFixture } from "./helpers";

describe("issue regression tests", () => {
    setupFixture();

    // Issue #13: mixing onready with array items
    it("#13: mixing onready doesn't duplicate list items", () => {
        $(root, `<div id="user"><span class="name"></span></div><ul id="hobbies"></ul>`);
        const hobbies = $("#hobbies", {
            items: ["skiing", "coding"],
        }) as any;
        expect(hobbies.items.length).toBe(2);
    });

    // Issue #15: tagName creates elements, onload fires once
    it("#15: tagName creates sibling divs", () => {
        let loadCount = 0;
        $(root, `<div id="container"></div>`);
        $("#container", {
            first: { tagName: "div", text: "A", onload: () => loadCount++ },
            second: { tagName: "div", text: "B" },
        }) as any;
        expect(loadCount).toBe(1);
        expect(document.querySelectorAll("#container div").length).toBe(2);
    });

    // Issue #16: onshow fires on show toggle
    it("#16: onshow fires when element becomes visible", () => {
        let shown = false;
        $(root, `<div id="el"></div>`);
        const el = $("#el", {
            show: false,
            onshow: () => {
                shown = true;
            },
        }) as any;
        el.show = true;
        expect(shown).toBe(true);
    });

    // Issue #24: properties added on the fly
    it("#24: can set property not in initial spec", () => {
        $(root, `
            <div id="user">
                <div class="name"></div>
                <div class="phone"></div>
                <div class="age"></div>
            </div>
        `);
        const user = $("#user", {
            name: "Billy",
            phone: "123-456-789",
            age: { style: { color: "blue" } },
        }) as any;
        // We didn't specify 'text' above, but we can use it:
        user.age.text = "45";
        expect(document.querySelector("#user .age")!.textContent).toBe("45");
    });

    // Issue #25: linked ref to dataset and style.
    // The dataset change propagates asynchronously via MutationObserver (microtask),
    // matching the original test which used assert.async() + onready.
    it("#25: linked ref updates on dataset change", async () => {
        $(root, `
            <div id="src" data-id="0"></div>
            <div id="tgt"><span class="uid"></span></div>
        `);
        const src = $("#src", { dataset: { id: 0 } }) as any;
        $("#tgt", { uid: [src.dataset, "id"] }) as any;
        src.dataset.id = 100;
        // MutationObserver fires on microtask; flush it:
        await new Promise((r) => setTimeout(r, 0));
        expect(document.querySelector("#tgt .uid")!.textContent).toBe("100");
    });

    // Issue #27: sorting shouldn't slow down (no proxy accumulation)
    it("#27: sort then reverse preserves order", () => {
        $(root, `<ul id="list"></ul>`);
        const list = $("#list", {
            items: ["banana", "apple", "cherry"],
        }) as any;
        list.items.sort();
        expect(list.items.first().text).toBe("apple");
        list.items.reverse();
        expect(list.items.first().text).toBe("cherry");
    });

    // Issue #29: event on multiple elements fires per element
    it("#29: onclick on matched group fires per element", () => {
        let count = 0;
        $(root, `<div id="root"><div class="x">1</div><div class="x">2</div></div>`);
        $("#root", {
            div: { onclick: () => count++ },
        }) as any;
        const divs = document.querySelectorAll("#root div");
        (divs[0] as HTMLElement).click();
        (divs[1] as HTMLElement).click();
        expect(count).toBe(2);
    });

    // Issue #41: string items via push/concat
    it("#41: push accepts plain string", () => {
        $(root, `<ul id="list"></ul>`);
        const list = $("#list", { items: ["a"] }) as any;
        list.items.push("b");
        expect(list.items.length).toBe(2);
        expect(list.items.last().text).toBe("b");
    });

    // Issue #43: html not ready synchronously, but onready works
    it("#43: html injection + onready event binding", async () => {
        let clicked = false;
        $(root, `<div id="container"></div>`);
        $("#container", {
            html: `<form><button type="button">Click</button></form>`,
            onready: function (this: any) {
                this.find("button").onclick = () => {
                    clicked = true;
                };
            },
        }) as any;
        await Promise.resolve(); // flush microtask (onready)
        (document.querySelector("#container button") as HTMLElement).click();
        expect(clicked).toBe(true);
    });

    // Issue #53: append moves DOM node correctly
    it("#53: append moves m2d2 node into parent", () => {
        $(root, `<div id="a"><span id="child">hello</span></div><div id="b"></div>`);
        const child = $("#child") as any;
        const b = $("#b") as any;
        b.append(child);
        expect(document.querySelector("#b #child")).not.toBeNull();
        expect(document.querySelector("#a #child")).toBeNull();
        expect(($("#child") as any).text).toBe("hello");
    });
});
