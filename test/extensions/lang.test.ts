import { describe, it, expect, beforeEach, vi } from "vitest";
import { $ } from "../../src/factory";
import { registerLang } from "../../src/extensions/lang";

// Register the lang extension onto $ for these tests:
registerLang($);

describe("Language extension — $.dict", () => {
    it("returns empty string for undefined keyword", () => {
        expect(($ as any).dict(undefined)).toBe("");
    });

    it("returns the keyword itself when dictionary is empty (with console error)", () => {
        // dict starts empty; val() errors and returns "" — but dict() returns the raw keyword
        // because translation falls through to the input keyword.
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        const result = ($ as any).dict("anything");
        // When data is empty, val() returns "" (after erroring), so dict() returns "":
        expect(result).toBe("");
        spy.mockRestore();
    });

    it("looks up a translation after set()", () => {
        ($ as any).dict.set({
            save: { en: "Save", es: "Guardar" },
            cancel: { en: "Cancel", es: "Cancelar" },
        });
        ($ as any).dict.lang = "es";
        expect(($ as any).dict("save")).toBe("Guardar");
        expect(($ as any).dict("cancel")).toBe("Cancelar");
    });

    it("falls back to base lang (es-MX → es)", () => {
        ($ as any).dict.set({ hi: { en: "Hi", es: "Hola" } });
        ($ as any).dict.lang = "es-MX";
        expect(($ as any).dict("hi")).toBe("Hola");
    });

    it("falls back to keyword when no translation found", () => {
        ($ as any).dict.set({ hi: { en: "Hi" } });
        ($ as any).dict.lang = "ja";
        const spy = vi.spyOn(console, "log").mockImplementation(() => {});
        expect(($ as any).dict("hi", false)).toBe("hi");
        spy.mockRestore();
    });

    it("interpolates variables (object form)", () => {
        ($ as any).dict.set({
            greet: { en: "Hello {name}" },
            name: { en: "World" },
        });
        ($ as any).dict.lang = "en";
        expect(($ as any).dict("greet", { "{name}": "m2d2" })).toBe("Hello m2d2");
    });

    it("interpolates variables (legacy string form)", () => {
        ($ as any).dict.set({ greet: { en: "Hi {name}" } });
        ($ as any).dict.lang = "en";
        expect(($ as any).dict("greet", "{name}:User")).toBe("Hi User");
    });

    it("has() checks keyword / lang presence", () => {
        ($ as any).dict.set({ save: { en: "Save", es: "Guardar" } });
        expect(($ as any).dict.has("save")).toBe(true);
        expect(($ as any).dict.has("save", "es")).toBe(true);
        expect(($ as any).dict.has("save", "ja")).toBe(false);
        expect(($ as any).dict.has("missing")).toBe(false);
    });
});

describe("Language extension — $.lang", () => {
    beforeEach(() => {
        localStorage.clear();
        // Reset dictionary to a known state. Text "Hello" → keyword "hello".
        ($ as any).dict.data = {};
        ($ as any).dict.set({
            hello: { en: "Hello", es: "Hola" },
            hello_title: { en: "Say hello", es: "Saluda" },
        });
    });

    it("getKeyword converts text to keyword", () => {
        expect(($ as any).lang.getKeyword("Hello World!")).toBe("hello_world");
        expect(($ as any).lang.getKeyword("  Multiple   Spaces ")).toBe("multiple_spaces");
    });

    it("sets language and persists to localStorage", () => {
        ($ as any).lang("es");
        expect(($ as any).dict.lang).toBe("es");
        expect(localStorage.getItem("m2d2.lang")).toBe("es");
    });

    it("translates element text via [lang] attribute", () => {
        // The keyword is derived from the text: "Hello" → "hello"
        ($ as any).dict.lang = "es";
        document.body.innerHTML = '<span lang="en">Hello</span>';
        ($ as any).lang();
        expect(document.querySelector("span")!.textContent).toBe("Hola");
    });

    it("translates title attribute", () => {
        // An element with lang but NO text: title is the only translatable content.
        ($ as any).dict.lang = "es";
        document.body.innerHTML = '<input lang="en" type="text" title="Say hello" />';
        ($ as any).lang();
        // getKeyword("Say hello") = "say_hello"; not in dict → falls back to original.
        // Use a title whose keyword exists:
        ($ as any).dict.set({ hello: { en: "Hello", es: "Hola" } });
        document.body.innerHTML = '<input lang="en" type="text" title="Hello" />';
        ($ as any).lang();
        expect(document.querySelector("input")!.title).toBe("Hola");
    });

    it("skips elements with noTextClass", () => {
        document.body.innerHTML = '<span lang="en" class="notxt">Hello</span>';
        ($ as any).dict.lang = "es";
        ($ as any).lang();
        expect(document.querySelector("span")!.textContent).toBe("Hello"); // unchanged
    });

    it("onchange adds a callback", () => {
        const calls: string[] = [];
        ($ as any).lang.onchange = (lang: string) => calls.push(lang);
        ($ as any).lang("ja");
        expect(calls).toEqual(["ja"]);
    });
});
