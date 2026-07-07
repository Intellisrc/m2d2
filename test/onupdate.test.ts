import { describe, it, expect } from "vitest";
import { $, root, setupFixture } from "./helpers";

describe("onupdate and linked references", () => {
    setupFixture();

    it("pushing changes (onchange handler)", () => {
        $(root, `
            <section id="user"><form><input type="text" name="nickname" value="" /></form></section>
            <section id="profile"><span class="nickname"></span></section>
        `);
        const profile = $("#profile", { nickname: "" }) as any;
        const user = $("#user", {
            nickname: {
                onchange: function (this: any) {
                    profile.nickname.text = this.value;
                },
            },
        }) as any;
        user.nickname.value = "dummy";
        user.nickname.onchange();
        expect(document.querySelector("#profile .nickname")!.textContent).toBe("dummy");
    });

    it("pulling changes using plain object", () => {
        $(root, `
            <section id="user"><form><input type="text" name="nickname" value="" /></form></section>
            <section id="profile"><span class="nickname"></span></section>
        `);
        const info = $({ nick: "Nick", phone: "000", email: "n@e.com" }) as any;
        $("#user", { nickname: [info, "nick"] }) as any;
        $("#profile", { nickname: [info, "nick"] }) as any;
        info.nick = "dummy";
        // #user's nickname is an input (bound by name) → value updates:
        expect((document.querySelector("#user [name=nickname]") as HTMLInputElement).value).toBe("dummy");
        // #profile's nickname is a span (bound by class) → text updates:
        expect(document.querySelector("#profile .nickname")!.textContent).toBe("dummy");
    });

    it("pulling changes using node", () => {
        $(root, `
            <section id="user"><form><input type="text" name="nickname" value="" /></form></section>
            <section id="profile"><span class="nickname"></span></section>
        `);
        const user = $("#user", { nickname: "" }) as any;
        $("#profile", { nickname: [user.nickname, "value"] }) as any;
        user.nickname.value = "dummy";
        expect(document.querySelector("#profile .nickname")!.textContent).toBe("dummy");
    });

    it("pulling changes with callback transform", () => {
        $(root, `
            <section id="user"><form><input type="text" name="nickname" value="" /></form></section>
            <section id="profile"><span class="nickname"></span></section>
        `);
        const user = $("#user", { nickname: "" }) as any;
        $("#profile", {
            nickname: [user.nickname, "value", (val: string) => "@" + val],
        }) as any;
        user.nickname.value = "dummy";
        expect(document.querySelector("#profile .nickname")!.textContent).toBe("@dummy");
    });
});
