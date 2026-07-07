import { describe, it, expect, beforeEach } from "vitest";
import { doDom } from "../src/binding";

describe("templates and items", () => {
    beforeEach(() => {
        document.body.innerHTML = '<ul id="root"></ul>';
    });

	it("when template exists, items should be created", () => {
		const node = doDom("#root", {
			template : {
				li : {
					span: "",
					a: ""
				}
			}
		});
		expect(node.items);
		expect(node.items.length).toBe(0);
		node.items.push({
			span : "Hello",
			a : "a link"
		});
		expect(node.items.length).toBe(1);
		expect(node.findAll("li").length).toBe(1);
		expect(((node.items.first() as any).span as any).text).toBe("Hello");
	});

	it("tagName properties should create elements", () => {
		const node = doDom("#root", {
			template : {
				li : {
					name : {
						tagName: "span",
						css : "name"
					},
					link : {
						tagName: "a",
						css : "link"
					}
				}
			}
		});
		expect(node.items);
		expect(node.items.length).toBe(0);
		node.items.push({
			name : "Hello",
			link : "a link"
		});
		expect(node.items.length).toBe(1);
		const first = (node.items.first() as any);
		expect(node.findAll("li").length).toBe(1);
		expect(node.findAll("link").length).toBe(0);
		expect((first.name as any).text).toBe("Hello");
		expect((first.name as any).tagName).toBe("SPAN");
		expect((first.name as any).className).toBe("name");
		expect((first.link as any).text).toBe("a link");
		expect((first.link as any).tagName).toBe("A");
		expect((first.link as any).className).toBe("link");
	});

    it("items with default template (ul → li)", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["one", "two", "three"] })!;
        const lis = node.findAll("li");
        expect(lis.length).toBe(3);
        expect((lis[0] as any).text).toBe("one");
    });

    it("items with select → option", () => {
        document.body.innerHTML = '<select id="root"></select>';
        const node = doDom("#root", { items: ["a", "b"] })!;
        expect(node.findAll("option").length).toBe(2);
    });

    it("items with HTML template", () => {
        document.body.innerHTML = `
            <div id="root">
                <template>
                    <div class="user">
                        <span class="name"></span>
                        <span class="age"></span>
                    </div>
                </template>
            </div>
        `;
        const node = doDom("#root", {
            items: [
                { name: "Paul", age: 23 },
                { name: "Sam", age: 72 },
            ],
        })!;
        const users = node.findAll(".user");
        expect(users.length).toBe(2);
        expect((users[0] as any).querySelector(".name").textContent).toBe("Paul");
        expect((users[1] as any).querySelector(".age").textContent).toBe("72");
    });

    it("items with JS template", () => {
        document.body.innerHTML = '<div id="root"></div>';
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
    });

    it("sets dataset.id on items", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b"] })!;
        expect((node.items[0] as any).dataset.id).toBe("0");
        expect((node.items[1] as any).dataset.id).toBe("1");
    });

    it("items get() by dataset.id", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b", "c"] })!;
        const item = node.items.get(1);
        expect(item).not.toBeNull();
        expect((item as any).text).toBe("b");
    });

    it("items first() and last()", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b", "c"] })!;
        expect(node.items.first().text).toBe("a");
        expect(node.items.last().text).toBe("c");
    });

    it("items forEach", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b", "c"] })!;
        const texts: string[] = [];
        node.items.forEach((item: any) => texts.push(item.text));
        expect(texts).toEqual(["a", "b", "c"]);
    });

    it("items push", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a"] })!;
        node.items.push({ text: "b" });
        expect(node.items.length).toBe(2);
        expect(node.items.last().text).toBe("b");
    });

    it("items clear", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b"] })!;
        node.items.clear();
        expect(node.items.length).toBe(0);
    });

    it("items sort", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["banana", "apple", "cherry"] })!;
        node.items.sort();
        expect(node.items.first().text).toBe("apple");
        expect(node.items.last().text).toBe("cherry");
    });

    it("items reverse", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b", "c"] })!;
        node.items.reverse();
        expect(node.items.first().text).toBe("c");
    });

    it("items splice removes and inserts", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b", "c"] })!;
        node.items.splice(1, 1, { text: "x" });
        expect(node.items.length).toBe(3);
        expect(node.items.first().text).toBe("a");
        expect((node.items[1] as any).text).toBe("x");
    });

    it("selected() and unselect()", () => {
        document.body.innerHTML = '<ul id="root"></ul>';
        const node = doDom("#root", { items: ["a", "b", "c"] })!;
        node.items.first().selected = true;
        expect(node.items.selected().text).toBe("a");
        // Select another — should clear the first:
        node.items.last().selected = true;
        expect(node.items.selected().text).toBe("c");
        node.items.unselect();
        expect(node.items.selected()).toBeNull();
    });
});
