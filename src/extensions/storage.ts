/**
 * M2D2 Storage Extension
 *
 * Wrapper for localStorage/sessionStorage with type-preserving serialization.
 * Ported from js/m2d2.storage.src.js.
 * Fix: missing key → null; parse failure → warn + null (was: silently swallow).
 */

/** A type alias to avoid clashing with our Storage class and the global Storage. */
type WebStorage = globalThis.Storage;

export class Storage {
    private store: WebStorage;

    constructor(type: "local" | "session") {
        if (type === "local" && typeof localStorage !== "undefined") {
            this.store = localStorage;
        } else if (type === "session" && typeof sessionStorage !== "undefined") {
            this.store = sessionStorage;
        } else {
            // Default fallback:
            this.store = typeof localStorage !== "undefined" ? localStorage : (null as unknown as WebStorage);
        }
    }

    set(key: string, val: unknown): void {
        if (typeof val === "string") {
            // Wrap strings in an envelope so they're distinguishable from serialized objects:
            val = { $: val };
        }
        this.store.setItem(key, JSON.stringify(val));
    }

    get(key: string): unknown {
        const raw = this.store.getItem(key);
        if (raw === null) return null; // FIX: missing key → null
        try {
            const val = JSON.parse(raw);
            if (val && typeof val === "object" && "$" in val) {
                return (val as { $: unknown }).$;
            }
            if (
                val &&
                typeof val === "object" &&
                Object.keys(val).length === 0 &&
                val.constructor === Object
            ) {
                return null;
            }
            return val;
        } catch {
            // FIX: parse failure → warn + null (was: silently swallow and return {} → null)
            console.warn("[m2d2] Storage parse error for key:", key);
            return null;
        }
    }

    del(key: string): void {
        this.store.removeItem(key);
    }

    keys(): string[] {
        return Object.keys(this.store).sort();
    }

    clear(): void {
        this.store.clear();
    }

    exists(key: string): boolean {
        // Use getItem rather than hasOwnProperty: Storage instances in some
        // environments (jsdom, older browsers) don't expose keys as own properties.
        return this.store.getItem(key) !== null;
    }

    log(key: string, val: unknown, n = 10): void {
        const tmp = (this.get(key) as unknown[]) || [];
        tmp.push(val);
        while (tmp.length > n) tmp.shift();
        this.set(key, tmp);
    }
}

/**
 * Register $.local and $.session on the target ($ function or object).
 */
export function registerStorage($target: { local?: Storage; session?: Storage }): void {
    $target.local = new Storage("local");
    $target.session = new Storage("session");
}
