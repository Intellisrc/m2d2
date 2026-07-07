/**
 * Unified logging. Every diagnostic in m2d2 routes through here.
 * Gated by the node/object's `warn` flag (default: warnings shown unless warn===false).
 *
 * Replaces all scattered console.log/console.error calls in the original source.
 */

export function warn(node: { warn?: unknown } | null, message: string, ...extra: unknown[]): void {
    if (node && node.warn === false) return;
    console.warn("[m2d2]", message, ...extra);
}

export function error(message: string, ...extra: unknown[]): void {
    console.error("[m2d2]", message, ...extra);
}

/**
 * Warn about a multi-match: multiple elements assigned with one key.
 * Gated by the value object's `warn` property (original: m2d2.src.js:470-476).
 */
export function warnMultiMatch(node: Element, key: string, value: { warn?: unknown }): void {
    if (value.warn === false) return;
    console.warn(
        "[m2d2] Multiple elements were assigned with key: [" + key + "] under node:",
        node,
        "You can set 'warn: false' on that element to hide this message."
    );
}

/**
 * Warn about a key that matched neither prop/attr nor child.
 * Original: m2d2.src.js:549-559. Changed: skip assignment instead of assigning junk.
 */
export function warnUnknownKey(node: Element, key: string, object: Record<string, unknown>): void {
    if (object.warn === false) return;
    console.error(
        "[m2d2] Not sure what to do with key: [" + key + "] under element:",
        node,
        "Most likely the element's property or child no longer exists. " +
            "Set 'warn: false' to dismiss this message."
    );
}
