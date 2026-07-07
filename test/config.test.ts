import { describe, it, expect } from "vitest";
import { config, extensions } from "../src/config";

describe("config", () => {
    it("has short=true by default", () => {
        expect(config.short).toBe(true);
    });
    it("has updates=true by default", () => {
        expect(config.updates).toBe(true);
    });
    it("has storedEventsTimeout=50", () => {
        expect(config.storedEventsTimeout).toBe(50);
    });
    it("extensions starts empty", () => {
        expect(Object.keys(extensions).length).toBe(0);
    });
});
