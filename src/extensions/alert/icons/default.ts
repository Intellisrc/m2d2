/**
 * Default icon source — Unicode/emoji icons.
 *
 * No font dependency; works everywhere out of the box.
 * `wrap` is false (just text nodes).
 */
import type { AlertIconSource } from "../types";

export const defaultIcons: AlertIconSource = {
    name: "default",
    wrap: "default_style",
    icons: {
        question: "❔",
        info: "💡",
        error: "❕",
        ok: "✅",
        input: "✏️",
        wait: "🕛",
    },
};
