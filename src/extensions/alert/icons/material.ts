/**
 * Material Symbols icon source.
 *
 * Requires the user to load Google Material Symbols in their page:
 *   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
 */
import type { AlertIconSource } from "../types";

export const materialIcons: AlertIconSource = {
    name: "material",
    wrap: "material-symbols-outlined",
    icons: {
        question: "help",
        info: "info",
        error: "error",
        ok: "done",
        input: "edit",
        wait: "pending",
    },
};
