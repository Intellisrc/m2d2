/**
 * Font Awesome icon source.
 *
 * Requires the user to load Font Awesome in their page:
 *   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/.../all.min.css" />
 */
import type { AlertIconSource } from "../types";

export const fontAwesomeIcons: AlertIconSource = {
    name: "fa",
    wrap: false,
    icons: {
        question: ["fa", "fa-question-circle"],
        info: ["fa", "fa-exclamation-circle"],
        error: ["fa", "fa-exclamation-triangle"],
        ok: ["fa", "fa-check"],
        input: ["fa", "fa-edit"],
        wait: ["fa", "fa-cog", "fa-spin"],
    },
};
