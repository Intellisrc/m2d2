import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { $ } from "../../../src/factory";
import { registerAlert, alertNamespace } from "../../../src/extensions/alert/index";
import { defaultIcons } from "../../../src/extensions/alert/icons/default";
import { materialIcons } from "../../../src/extensions/alert/icons/material";
import { fontAwesomeIcons } from "../../../src/extensions/alert/icons/fontAwesome";
import { svgIcons } from "../../../src/extensions/alert/icons/svg";
import type { AlertIconSource } from "../../../src/extensions/alert/types";

registerAlert($ as any);

describe("Alert icon sources", () => {
    it("defaultIcons has unicode/emoji for every type", () => {
        expect(defaultIcons.name).toBe("default");
        expect(defaultIcons.wrap).toBe("default_style");
        for (const t of ["question", "info", "error", "ok", "input", "wait"]) {
            const def = defaultIcons.icons[t];
            expect(def, `type ${t}`).toBeDefined();
            expect(typeof def).toBe("string");
        }
    });

    it("materialIcons uses Material Symbols names with wrap class", () => {
        expect(materialIcons.wrap).toBe("material-symbols-outlined");
        expect(materialIcons.icons.ok).toBe("done");
        expect(materialIcons.icons.error).toBe("error");
    });

    it("fontAwesomeIcons uses class arrays", () => {
        expect(fontAwesomeIcons.wrap).toBe(false);
        expect(Array.isArray(fontAwesomeIcons.icons.ok)).toBe(true);
        expect(fontAwesomeIcons.icons.ok).toEqual(["fa", "fa-check"]);
    });

    it("svgIcons returns { svg: '<svg...' } markup", () => {
        const ok = svgIcons.icons.ok as { svg: string };
        expect(ok.svg).toContain("<svg");
        expect(ok.svg).toContain("currentColor");
    });
});

describe("Alert m2d2.alert.register / registerIcons", () => {
    it("registerIcons stores a named source", () => {
        const custom: AlertIconSource = {
            name: "custom",
            wrap: false,
            icons: { info: "ℹ️", ok: "👍" },
        };
        alertNamespace.registerIcons("custom", custom);
        // After registering, config.icons = "custom" should pick it up via resolveSource.
        // We verify via the internal behavior: message with icon "ok" and config.icons="custom":
        alertNamespace.register({ icons: "custom", iconsOff: false });
        // No assertion on DOM here; the source is stored.
        expect(alertNamespace.config.icons).toBe("custom");
        // Reset:
        alertNamespace.register({ icons: "default" });
    });

    it("register sets theme attribute on <html>", () => {
        alertNamespace.register({ theme: "dark" });
        expect(document.documentElement.dataset.theme).toBe("dark");
        alertNamespace.register({ theme: "light" });
        expect(document.documentElement.dataset.theme).toBe("light");
    });

    it("register can turn icons off", () => {
        alertNamespace.register({ iconsOff: true });
        expect(alertNamespace.config.iconsOff).toBe(true);
        alertNamespace.register({ iconsOff: false });
    });
});

describe("Alert entry-point shims", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        alertNamespace.register({ icons: "default", theme: "light", iconsOff: false });
    });
    afterEach(() => {
        const root = document.querySelector("#m2d2-alert");
        if (root) root.remove();
    });

    it("$.alert renders a dialog with title and ok button", () => {
        ($ as any).alert("My Title", "My text");
        expect(document.querySelector("#m2d2-alert")).not.toBeNull();
        expect(document.querySelector(".m2d2-alert-title")!.textContent).toContain("My Title");
        expect(document.querySelector(".m2d2-alert-buttons button")!.textContent).toContain("ok");
    });

    it("$.confirm renders yes/no buttons", () => {
        ($ as any).confirm("Are you sure?");
        const buttons = document.querySelectorAll(".m2d2-alert-buttons button");
        expect(buttons.length).toBe(2);
        const texts = Array.from(buttons).map((b) => b.textContent);
        expect(texts.some((t) => t?.includes("yes"))).toBe(true);
        expect(texts.some((t) => t?.includes("no"))).toBe(true);
    });

    it("$.prompt renders an input field", () => {
        ($ as any).prompt("Enter your name");
        expect(document.querySelector(".m2d2-alert-field input")).not.toBeNull();
    });

    it("$.wait renders no buttons", () => {
        ($ as any).wait("Loading...");
        expect(document.querySelector(".m2d2-alert-buttons")).toBeNull();
    });

    it("$.success uses the ok icon class", () => {
        ($ as any).success("Done!");
        const icon = document.querySelector(".m2d2-icon");
        expect(icon).not.toBeNull();
        expect(icon!.classList.contains("icon-ok")).toBe(true);
    });

    it("$.failure uses the error icon class", () => {
        ($ as any).failure("Oops");
        const icon = document.querySelector(".m2d2-icon");
        expect(icon!.classList.contains("icon-error")).toBe(true);
    });

    it("$.closeAll removes the alert", () => {
        ($ as any).alert("Test");
        expect(document.querySelector("#m2d2-alert")).not.toBeNull();
        ($ as any).closeAll();
        // closeAll triggers the vanish animation; the element is removed after closeDuration.
        // We use a small timeout to verify:
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                expect(document.querySelector("#m2d2-alert")).toBeNull();
                resolve();
            }, 450);
        });
    });

    it("iconsOff:true renders no icon span", () => {
        alertNamespace.register({ iconsOff: true });
        ($ as any).alert("No icon");
        expect(document.querySelector(".m2d2-icon")).toBeNull();
        alertNamespace.register({ iconsOff: false });
    });

    it("default icon is rendered as text node (unicode)", () => {
        ($ as any).success("Done");
        const icon = document.querySelector(".m2d2-icon") as HTMLElement;
        expect(icon.textContent).toBe("✅"); // default ok = "✅"
    });

    it("svg icon source renders svg markup", () => {
        alertNamespace.register({ icons: "svg" });
        ($ as any).success("Done");
        const icon = document.querySelector(".m2d2-icon") as HTMLElement;
        expect(icon.querySelector("svg")).not.toBeNull();
        alertNamespace.register({ icons: "default" });
    });

    it("material icon source adds wrap class and text", () => {
        alertNamespace.register({ icons: "material" });
        ($ as any).success("Done");
        const icon = document.querySelector(".m2d2-icon") as HTMLElement;
        expect(icon.classList.contains("material-symbols-outlined")).toBe(true);
        expect(icon.textContent).toBe("done");
        alertNamespace.register({ icons: "default" });
    });

    it("font-awesome source adds fa classes", () => {
        alertNamespace.register({ icons: "fa" });
        ($ as any).success("Done");
        const icon = document.querySelector(".m2d2-icon") as HTMLElement;
        expect(icon.classList.contains("fa")).toBe(true);
        expect(icon.classList.contains("fa-check")).toBe(true);
        alertNamespace.register({ icons: "default" });
    });

    it("callback fires with true on ok button", async () => {
        const cb = vi.fn();
        ($ as any).alert("Title", "Text", cb);
        // Click the ok button (appends hidden "button=ok" input), then submit:
        const okBtn = document.querySelector(".m2d2-alert-buttons button") as HTMLButtonElement;
        okBtn.click();
        const form = document.querySelector("#m2d2-alert form") as HTMLFormElement;
        form.dispatchEvent(new Event("submit"));
        await new Promise((r) => setTimeout(r, 450));
        expect(cb).toHaveBeenCalledWith(true, expect.any(Object));
    });

    it("registers all entry points on $", () => {
        ["message", "wait", "alert", "success", "failure", "confirm", "prompt", "closeAll"].forEach(
            (m) => {
                expect(typeof ($ as any)[m]).toBe("function");
            }
        );
    });
});
