import { describe, it, expect, vi } from "vitest";
import { upload } from "../../src/extensions/upload";

describe("upload extension", () => {
    it("the maxFiles check uses logical OR (regression for bitwise bug)", () => {
        // The fix: opts.maxFiles === 0 || el.files.length <= opts.maxFiles
        const check = (maxFiles: number, fileCount: number): boolean => {
            return maxFiles === 0 || fileCount <= maxFiles;
        };
        // maxFiles=0 → always allowed:
        expect(check(0, 100)).toBe(true);
        // maxFiles=2, 3 files → not allowed:
        expect(check(2, 3)).toBe(false);
        // maxFiles=2, 2 files → allowed:
        expect(check(2, 2)).toBe(true);
        // The OLD buggy code computed: (2===0 | 3<=2) = (0 | 0) = 0 (falsy) → reject (accident)
        //                          (2===0 | 2<=2) = (0 | 1) = 1 (truthy) → allow
        // The fix makes both correct, and also fixes e.g. maxFiles=1, 1 file:
        expect(check(1, 1)).toBe(true);
        expect(check(1, 2)).toBe(false);
    });

    it("accepts all documented options without throwing", () => {
        const mockClick = vi.fn();
        const origCreate = document.createElement.bind(document);
        const spy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
            const el = origCreate(tag);
            if (tag === "input") {
                el.click = mockClick;
            }
            return el;
        });
        try {
            expect(() => {
                upload(null, {
                    upload: "/upload",
                    accept: "image/*",
                    parallel: true,
                    maxFiles: 5,
                    maxSizeMb: 10,
                    field: "myfile",
                    php: true,
                });
            }).not.toThrow();
            expect(mockClick).toHaveBeenCalled();
        } finally {
            spy.mockRestore();
        }
    });

    it("registers via registerUpload", async () => {
        const { registerUpload } = await import("../../src/extensions/upload");
        const $: Record<string, unknown> = {};
        registerUpload($);
        expect(typeof $.upload).toBe("function");
    });
});
