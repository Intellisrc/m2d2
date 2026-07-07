import { beforeEach, afterEach } from "vitest";
import { m2d2 } from "../src/index";

const $ = m2d2.load();
export { $ };

export const id = "qunit-fixture";
export const root = "#" + id;

/**
 * Sets up a fresh #qunit-fixture div before each test.
 * Call setupFixture() at the top of each describe block.
 */
export function setupFixture(): void {
    beforeEach(() => {
        document.body.innerHTML = `<div id="${id}"></div>`;
    });
    afterEach(() => {
        document.body.innerHTML = "";
    });
}

/**
 * Set HTML inside the fixture. Equivalent to $(root, htmlString).
 */
export function fixture(html: string): void {
    const el = document.querySelector(root) as HTMLElement;
    el.innerHTML = html.trim();
}
