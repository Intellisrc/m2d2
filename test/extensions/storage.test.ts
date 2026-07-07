import { describe, it, expect, beforeEach } from "vitest";
import { Storage } from "../../src/extensions/storage";

describe("Storage", () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it("set/get string round-trips", () => {
        const s = new Storage("local");
        s.set("key", "value");
        expect(s.get("key")).toBe("value");
    });

    it("set/get object round-trips", () => {
        const s = new Storage("local");
        s.set("obj", { a: 1, b: "two" });
        expect(s.get("obj")).toEqual({ a: 1, b: "two" });
    });

    it("set/get array round-trips", () => {
        const s = new Storage("local");
        s.set("arr", [1, 2, 3]);
        expect(s.get("arr")).toEqual([1, 2, 3]);
    });

    it("set/get number round-trips", () => {
        const s = new Storage("local");
        s.set("num", 42);
        expect(s.get("num")).toBe(42);
    });

    it("get missing key returns null", () => {
        const s = new Storage("local");
        expect(s.get("nonexistent")).toBeNull();
    });

    it("del removes key", () => {
        const s = new Storage("local");
        s.set("key", "val");
        s.del("key");
        expect(s.get("key")).toBeNull();
    });

    it("exists checks key presence", () => {
        const s = new Storage("local");
        s.set("key", "val");
        expect(s.exists("key")).toBe(true);
        expect(s.exists("missing")).toBe(false);
    });

    it("keys returns sorted key list", () => {
        const s = new Storage("local");
        s.set("zebra", "z");
        s.set("apple", "a");
        expect(s.keys()).toEqual(["apple", "zebra"]);
    });

    it("log keeps last N entries", () => {
        const s = new Storage("local");
        s.log("log", "a", 3);
        s.log("log", "b", 3);
        s.log("log", "c", 3);
        s.log("log", "d", 3);
        const result = s.get("log") as unknown[];
        expect(result).toEqual(["b", "c", "d"]);
    });

    it("clear removes all keys", () => {
        const s = new Storage("local");
        s.set("a", 1);
        s.set("b", 2);
        s.clear();
        expect(s.keys().length).toBe(0);
    });

    it("session storage is separate from local", () => {
        const local = new Storage("local");
        const session = new Storage("session");
        local.set("key", "L");
        session.set("key", "S");
        expect(local.get("key")).toBe("L");
        expect(session.get("key")).toBe("S");
    });
});
