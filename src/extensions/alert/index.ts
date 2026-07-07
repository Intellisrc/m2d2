/**
 * M2D2 Alerts Extension (v3 — minimal, configurable)
 *
 * A replacement for alert/prompt/confirm. Inspired by SweetAlert, with better
 * m2d2 integration and NO default font dependency.
 *
 * Public API (unchanged entry points):
 *   $.wait(title, text?, callback?)    spinner, no buttons
 *   $.alert(title, text?, callback?)   info icon, "ok" button
 *   $.success(title, text?, callback?) ok icon, "ok" button
 *   $.failure(title, text?, callback?) error icon, "ok" button
 *   $.confirm(title, text?, callback?) question icon, "yes"/"no" buttons
 *   $.prompt(title, text?, callback?)  input icon, "cancel"/"send" buttons
 *   $.message(options)                 free-form (the others are thin wrappers)
 *   $.closeAll()                       close any open alert
 *
 * Configuration (once, at startup):
 *   m2d2.alert.register({ icons: "material", theme: "dark", iconsOff: false, ... })
 *
 * Icon sources are pluggable. The default uses Unicode/emoji (no font).
 * Register a built-in: m2d2.alert.registerIcons("material", materialIcons)
 * or import and pass a source object.
 */
import { $ } from "../../factory";
import { utils } from "../../utils";
import type { AlertConfig, AlertIconSource, AlertOptions, IconDef, MessageIconsSetting } from "./types";
import { defaultIcons } from "./icons/default";
import { materialIcons } from "./icons/material";
import { fontAwesomeIcons } from "./icons/fontAwesome";
import { svgIcons } from "./icons/svg";

// ------------------------------------------------------------------
// Icon-source registry
// ------------------------------------------------------------------

const iconSources = new Map<string, AlertIconSource>();
iconSources.set("default", defaultIcons);
iconSources.set("material", materialIcons);
iconSources.set("fa", fontAwesomeIcons);
iconSources.set("svg", svgIcons);

/** Register a named icon source so it can be selected by name. */
export function registerIcons(name: string, source: AlertIconSource): void {
    source.name = name;
    iconSources.set(name, source);
}

/** Resolve an icon-source setting (name or literal) to a source object. */
function resolveSource(setting: string | AlertIconSource | undefined): AlertIconSource {
    if (!setting || setting === "default") return defaultIcons;
    if (typeof setting === "string") {
        return iconSources.get(setting) ?? defaultIcons;
    }
    return setting;
}

// ------------------------------------------------------------------
// Configuration (mutable, set once via m2d2.alert.register)
// ------------------------------------------------------------------

const config: Required<AlertConfig> = {
    iconsOff: false,
    icons: "default",
    theme: "light",
    dict: {},
    css: [],
	iconsCss: [],
    closeDuration: 400,
};

/**
 * Configure the alert extension. Call once at startup:
 *   m2d2.alert.register({ icons: "material", theme: "dark" })
 */
function register(userConfig: AlertConfig): void {
    Object.assign(config, userConfig);
    // Apply theme attribute to <html>:
    if (config.theme && typeof document !== "undefined") {
        document.documentElement.dataset.theme = config.theme;
    }
}

// ------------------------------------------------------------------
// Rendering helpers
// ------------------------------------------------------------------

/** Close any existing alert, then invoke afterClose. */
function close(afterClose?: () => void): void {
    const existing = document.querySelector("#m2d2-alert .m2d2-alert-front");
    if (existing) {
        existing.classList.add("vanish");
        setTimeout(() => {
            const root = document.querySelector("#m2d2-alert");
            if (root) root.remove();
            if (afterClose) afterClose();
        }, config.closeDuration);
    } else if (afterClose) {
        afterClose();
    }
}

/** Normalize options so callback/text are in the right slots. */
function normalizeOptions(options: AlertOptions): AlertOptions {
    if (!utils.isFunction(options.callback)) {
        if (options.callback && !options.text) {
            options.text = options.callback as unknown as string;
        }
        options.callback = () => {};
    }
    if (!options.text) options.text = "";
    return options;
}

// ------------------------------------------------------------------
// $.message — the core
// ------------------------------------------------------------------

/** Build the icon child-spec for the front object (or null if iconsOff). */
function buildIconSpec(
    source: AlertIconSource,
    iconType: string,
    overrides?: Record<string, IconDef>
): Record<string, unknown> | null {
    if (config.iconsOff) return null;
    const merged = overrides ? { ...source.icons, ...overrides } : source.icons;
    let def = merged[iconType];
    if (def === undefined) {
        console.warn(
            "[m2d2] Alert icon [" + iconType + "] not found in source [" + source.name +
            "]. Adding it automatically."
        );
        def = iconType;
    }
    const classes = ["m2d2-icon", "icon-" + iconType];
    if (iconType === "wait") classes.push("spin");
	if(config.iconsCss) {
		classes.push(...(Array.isArray(config.iconsCss) ? config.iconsCss : [config.iconsCss]));
	}
    let text = "";
    let svg: string | undefined;
    if (typeof def === "string") {
        text = def;
    } else if (Array.isArray(def)) {
        def.forEach((c) => classes.push(c));
    } else if (def && typeof def === "object" && "svg" in def) {
        svg = def.svg;
    }
    const wrap = source.wrap ?? false;
    if (wrap) classes.push(wrap);
    const spec: Record<string, unknown> = { tagName: "span", css: classes };
    if (svg) spec.html = svg;
    else spec.text = text;
    return { icon: spec };
}

function message(options: AlertOptions): { close: typeof close } {
    options = normalizeOptions(options);
    const iconType = options.icon ?? "info";

    // Resolve the active icon source (respecting $.messageIcons for back-compat):
    let activeSource: AlertIconSource;
    const mi = (message as unknown as { icons?: MessageIconsSetting }).icons;
    if (typeof mi === "string") {
        activeSource = resolveSource(mi);
    } else if (mi && typeof mi === "object" && "icons" in mi) {
        activeSource = mi as AlertIconSource;
    } else {
        activeSource = resolveSource(config.icons as string | AlertIconSource);
    }

    close(() => {
        const iconSpec = buildIconSpec(activeSource, iconType, options.icons);

        // Base CSS for the front container:
        const baseCss = ["m2d2-alert-front", "popup"];
        if (options.css) {
            baseCss.push(...(Array.isArray(options.css) ? options.css : [options.css]));
        }
        if (config.css) {
            baseCss.push(...(Array.isArray(config.css) ? config.css : [config.css]));
        }

        // Sub-message (text body or input field). Omitted entirely when there
        // is no message body at all — in that case the alert renders "compact"
        // (icon | title | buttons in a single row). See .m2d2-alert-front.compact
        // in alert.css.
        const hasTextBody =
            iconType === "input" ||
            (options.text !== undefined && options.text !== null && options.text !== "");

        let submsgContent: Record<string, unknown>;
        if (iconType === "input" && !options.text) {
            submsgContent = {
                fieldset: {
                    css: "m2d2-alert-field",
                    input: {
                        type: "text",
                        name: "answer",
                        css: "input",
                        onload: function (this: HTMLInputElement) {
                            this.focus();
                        },
                    },
                },
            };
        } else if (utils.isPlainObject(options.text)) {
            submsgContent = {
                fieldset: Object.assign({ css: "m2d2-alert-field" }, options.text),
            };
        } else {
            submsgContent = { span: String(options.text).replace(/\n/g, "<br>") };
        }

        const compact = !hasTextBody;
        if (compact) baseCss.push("compact");

        // Assemble the front (form) spec — faithfully following the original structure:
        const frontSpec: Record<string, unknown> = Object.assign(
            {
                tagName: "form",
                css: baseCss,
                style: { zIndex: 100 },
                message: {
                    tagName: "div",
                    css: "m2d2-alert-title",
                    span: options.title ?? "",
                },
                ...(compact ? {} : {
                    submsg: Object.assign({ tagName: "div", css: "m2d2-alert-text" }, submsgContent),
                }),
                onsubmit: function (this: HTMLElement) {
                    const data = (this as any).getData() as Record<string, unknown>;
                    let func: () => void;
                    const cb = options.callback!;
                    switch (data.button) {
                        case "ok":
                        case "yes":
                            func = () => cb(true, data);
                            break;
                        case "no":
                            func = () => cb(false, data);
                            break;
                        case "cancel":
                            func = () => cb(null, data);
                            break;
                        case "send": {
                            const keys = Object.keys(data);
                            if (keys.length === 1) {
                                func = () => cb(data[keys[0]], data);
                            } else if (keys.length === 2) {
                                func = () => cb(data[keys.find((k) => k !== "button")!], data);
                            } else {
                                func = () => cb(data, data);
                            }
                            break;
                        }
                        default:
                            func = () => cb(data, data);
                    }
                    close(func);
                    return false;
                },
                onload: function (this: HTMLElement) {
                    const def = (this as any).find("[autofocus]") as HTMLElement | null;
                    if (def) def.focus();
                },
            },
            iconSpec ?? {}
        );

        // Render the full alert tree:
        $("body", {
            m2d2Alert: {
                tagName: "div",
                id: "m2d2-alert",
                back: {
                    tagName: "div",
                    css: "m2d2-alert-back",
                    style: {
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        backgroundColor: "var(--alert-back)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    },
                    front: frontSpec,
                },
            },
        });

        // Phase 2: append buttons as a SEPARATE $() call (matches original structure):
        const buttons = options.buttons ?? [];
        if (buttons.length) {
            const newButtons: Record<string, unknown> = {
                buttons: {
                    tagName: "div",
                    css: "m2d2-alert-buttons",
                },
            };
            buttons.forEach((b) => {
                const key = b.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, "_");
                const dictLabel = config.dict[b] ?? b;
                (newButtons.buttons as Record<string, unknown>)[key] = {
                    tagName: "button",
                    type: "submit",
                    value: key,
                    css: ["color", key],
                    text: dictLabel,
                    autofocus: ["ok", "yes"].includes(b),
                    formNoValidate: ["cancel"].includes(b),
                    onclick: function (this: HTMLElement) {
                        const form = this.closest("form");
                        if (form) {
                            const hide = document.createElement("input");
                            hide.type = "hidden";
                            hide.name = "button";
                            (hide as HTMLInputElement).value = key;
                            form.appendChild(hide);
                        }
                    },
                };
            });
            ($ as unknown as (sel: string, obj: unknown) => unknown)("#m2d2-alert .m2d2-alert-front", newButtons);
        }

        // Auto-name unnamed fields:
        let i = 1;
        document
            .querySelectorAll("#m2d2-alert .m2d2-alert-front input, #m2d2-alert .m2d2-alert-front select, #m2d2-alert .m2d2-alert-front textarea")
            .forEach((elem) => {
                const el = elem as HTMLInputElement;
                if (el.name === "") el.name = "field_" + i++;
            });
    });

    return { close };
}

// ------------------------------------------------------------------
// Entry-point shims (unchanged signatures)
// ------------------------------------------------------------------

/** The 3-arg (title, text, callback) shim shared by all entry points. */
type EntryShim = (title: string, text?: unknown, callback?: (result: unknown, data: Record<string, unknown>) => void) => { close: typeof close };

function makeShim(icon: string, css: string, buttons: string[]): EntryShim {
    return (title, text, callback) => {
        return message({
            icon: icon as AlertOptions["icon"],
            css,
            title,
            buttons,
            text: callback === undefined ? undefined : (text as string),
            callback: callback === undefined ? (text as () => void) : callback,
        });
    };
}

const wait = makeShim("wait", "wait", []) as EntryShim;
const alert = makeShim("info", "alert", ["ok"]);
const success = makeShim("ok", "success", ["ok"]);
const failure = makeShim("error", "failure", ["ok"]);
const confirm = makeShim("question", "confirm", ["yes", "no"]);
const prompt = makeShim("input", "prompt", ["cancel", "send"]);

/** Close all open alerts. */
function closeAll(): void {
    close();
}

// ------------------------------------------------------------------
// Register onto $ and expose m2d2.alert
// ------------------------------------------------------------------

/** Wire the alert extension onto the $ function and expose the config API. */
export function registerAlert($target: Record<string, unknown>): void {
    $target.message = message;
    $target.wait = wait;
    $target.alert = alert;
    $target.success = success;
    $target.failure = failure;
    $target.confirm = confirm;
    $target.prompt = prompt;
    $target.closeAll = closeAll;

    // Back-compat: $.messageIcons setter (accepts "material" | "fa" | source object).
    // Writing to it updates the config.icons source.
    let messageIconsValue: MessageIconsSetting = "default";
    Object.defineProperty($target, "messageIcons", {
        get: () => messageIconsValue,
        set: (v: MessageIconsSetting) => {
            messageIconsValue = v;
            config.icons = v as string | AlertIconSource;
        },
        configurable: true,
    });
}

// The m2d2.alert namespace (returned for users who import the module directly):
export const alertNamespace = {
    register,
    registerIcons,
    config,
};
