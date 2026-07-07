/**
 * M2d2 configuration flags and global registries.
 *
 * Mirrors the original static fields on the m2d2 class (m2d2.src.js:17-20, 37).
 */
export const config = {
    /** Enable short assignation via Proxy. false = better performance. */
    short: true,
    /** Enable onupdate / linked references via MutationObserver + Proxy dispatch. */
    updates: true,
    /** Milliseconds to deduplicate identical update events. */
    storedEventsTimeout: 50,
};

/**
 * Registry of DOM extensions, keyed by tag name (e.g. "INPUT") or "*" (all).
 * Populated by m2d2.load(cb) when cb returns an extension object.
 */
export const extensions: Record<string, Record<string, unknown>> = {};
