/**
 * Alert extension types.
 */

/** The built-in message kinds. Users can also pass custom icon names. */
export type AlertType = "question" | "info" | "error" | "ok" | "input" | "wait" | string;

/**
 * One icon definition. Can be:
 *   - string          → text/emoji (e.g. "?", "✓") rendered as node text
 *   - string[]        → CSS classes (e.g. ["fa", "fa-check"]) added to the icon span
 *   - { svg: string } → inline SVG markup rendered via innerHTML
 */
export type IconDef = string | string[] | { svg: string };

/**
 * An icon source: a named set of icons + an optional wrapping class.
 * Every icon source (default, material, font-awesome, svg) implements this.
 */
export interface AlertIconSource {
    /** Source name, e.g. "default", "material", "fa", "svg". */
    name: string;
    /** Parent class added to every icon span (e.g. "material-symbols-outlined"), or false for none. */
    wrap?: string | false;
    /** Per-type icon definitions. */
    icons: Record<string, IconDef>;
}

/** Options passed to $.message (and indirectly to $.alert, $.confirm, etc). */
export interface AlertOptions {
    icon?: AlertType;
    css?: string | string[];
    title?: string;
    text?: string | Record<string, unknown>;
    buttons?: string[];
    callback?: (result: unknown, data: Record<string, unknown>) => void;
    /** Per-call icon overrides (merged with the active source). */
    icons?: Record<string, IconDef>;
    /** autofocus selector hint (passed through to the form). */
    autofocus?: string;
}

/**
 * Configuration accepted by m2d2.alert.register({ ... }).
 * All fields optional — only override what you want to change.
 */
export interface AlertConfig {
    /** Disable icons entirely (no icon span rendered). Default: false (icons on). */
    iconsOff?: boolean;
    /**
     * The icon source to use. Accepts:
     *   - a registered source name: "default" | "material" | "fa" | "svg"
     *   - a literal AlertIconSource object
     */
    icons?: string | AlertIconSource;
    /**
     * Theme to apply. Accepts:
     *   - "light" | "dark" → sets data-theme attribute (CSS files handle the rest)
     *   - a custom attribute value
     */
    theme?: string;
    /** Custom buttons text dictionary (e.g. for i18n). */
    dict?: Record<string, string>;
    /** Extra CSS class(es) added to every alert front container. */
    css?: string | string[];
    /** Extra CSS class(es) added to alert icons. */
    iconsCss?: string | string[];
    /** Override the close animation duration (ms). Default: 400. */
    closeDuration?: number;
}

/** The shape exposed on $.messageIcons for backward compatibility. */
export type MessageIconsSetting = string | AlertIconSource | Record<string, IconDef>;
