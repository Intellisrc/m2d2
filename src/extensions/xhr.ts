/**
 * M2D2 XHR Extension
 *
 * $.get, $.post, $.put, $.delete, $.connect, $.options, $.trace, $.patch, $.head, $.copy.
 * Ported from js/m2d2.xhr.src.js.
 *
 * Supports flexible argument order (any permutation of url/data/callback/error/json/timeout by type).
 * FIX: the onreadystatechange switch redeclared `const headers`/`const partial` without braces
 *      (a latent strict-mode footgun); cases are now block-scoped.
 */

export interface XhrError {
    type: string;
    reason: string;
    status: number;
}

interface ParsedArgs {
    url?: string;
    data?: Record<string, unknown> | string;
    callback?: (data: unknown) => void;
    errorCallback?: (error: XhrError) => void;
    json?: boolean;
    timeout?: number;
}

/**
 * Perform a single XHR request.
 * Ported from js/m2d2.xhr.src.js:31-134 (the internal XHR function).
 */
function performRequest(
    method: string,
    url: string,
    data: Record<string, unknown> | string,
    callback: ((data: unknown) => void) | undefined,
    errorCallback: (error: XhrError) => void,
    json: boolean,
    timeout: number | undefined
): XMLHttpRequest {
    // Resolve XMLHttpRequest dynamically so test mocks (and non-window envs) take effect:
    const XhrCtor = (globalThis as any).XMLHttpRequest;
    const request = new XhrCtor() as XMLHttpRequest;

    if (data && typeof data === "object" && Object.entries(data).length === 0) {
        data = "";
    }
    if (data) {
        if (json) {
            data = JSON.stringify(data);
        } else {
            switch (method.toUpperCase()) {
                case "HEAD":
                case "GET": {
                    // FIX: block-scoped (was: const redeclared across fall-through).
                    if (typeof data === "string") {
                        const obj: Record<string, string> = {};
                        obj[data] = "";
                        data = obj;
                    }
                    const dataObj = data as Record<string, unknown>;
                    url +=
                        (url.indexOf("?") !== -1 ? "&" : "?") +
                        Object.keys(dataObj)
                            .map((key) => key + "=" + dataObj[key])
                            .join("&");
                    data = "";
                    break;
                }
                default: {
                    // FIX: block-scoped.
                    const dataObj = data as Record<string, unknown>;
                    data = Object.keys(dataObj)
                        .map((key) => key + "=" + dataObj[key])
                        .join("&");
                }
            }
        }
    }

    request.open(method, url, true);

    if (timeout) {
        request.timeout = timeout;
        request.ontimeout = () => {
            errorCallback({ type: "Timeout", reason: "Connection timed out", status: 0 });
        };
    }

    if (json) {
        request.setRequestHeader("Content-Type", "application/json");
    } else {
        request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    }

    request.onerror = () => {
        errorCallback({ type: "Connection", reason: "Connection Refused", status: 0 });
    };

    let loadedBytes = 0;
    request.onreadystatechange = () => {
        switch (request.readyState) {
            case request.HEADERS_RECEIVED: {
                // FIX: block-scoped.
                const headers = request
                    .getAllResponseHeaders()
                    .trim()
                    .split("\r\n")
                    .reduce((acc: Record<string, string>, current) => {
                        const idx = current.indexOf(": ");
                        const x = current.substring(0, idx);
                        const v = current.substring(idx + 2);
                        acc[x] = v;
                        return acc;
                    }, {});
                request.dispatchEvent(new CustomEvent("headers", { detail: headers }));
                if (method === "HEAD" && callback) {
                    callback(headers);
                }
                break;
            }
            case request.LOADING: {
                // FIX: block-scoped.
                const partial = (request.response as string).substr(loadedBytes);
                loadedBytes = request.responseText.length;
                request.dispatchEvent(new CustomEvent("partial", { detail: partial }));
                break;
            }
        }
    };

    request.onload = () => {
        let resData: { error?: unknown; [k: string]: unknown } = {};
        try {
            resData = request.responseText
                ? JSON.parse(request.responseText)
                : { error: { type: "Response", reason: "Empty response", status: 0 } };
        } catch (err) {
            resData.error = { type: "Parse Error", reason: (err as Error).message, status: 0 };
        }
        if (request.status >= 200 && request.status < 400) {
            if (callback !== undefined && method !== "HEAD") {
                callback(resData);
            }
        } else if (request.status >= 400) {
            if (errorCallback !== undefined) {
                let err = resData.error;
                if (typeof err === "string") {
                    err = { type: "Exception", reason: err, status: request.status };
                }
                errorCallback(err as XhrError);
            }
        } else if (request.status) {
            console.log("[m2d2] Received response with code:", request.status);
        } else if (resData.error) {
            errorCallback(resData.error as XhrError);
        }
    };

    // Optional stream-callback helpers (chainable on the returned request):
    (request as any).headers = function (cb: (headers: Record<string, string>) => void): XMLHttpRequest {
        request.addEventListener("headers", ((e: Event) => cb((e as CustomEvent).detail)) as EventListener);
        return request;
    };
    (request as any).partial = function (cb: (partial: string) => void): XMLHttpRequest {
        request.addEventListener("partial", ((e: Event) => cb((e as CustomEvent).detail)) as EventListener);
        return request;
    };

    // Cast through XMLHttpRequestBodyInit: at this point `data` is always a
    // string (query params, JSON body, or "").
    request.send((data as XMLHttpRequestBodyInit) || null);
    return request;
}

/**
 * Build a method function with flexible argument parsing.
 * Ported from js/m2d2.xhr.src.js:144-199.
 */
function makeMethod(method: string): (...args: unknown[]) => XMLHttpRequest {
    return function (...args: unknown[]): XMLHttpRequest {
        const parsed: ParsedArgs = {};
        Array.from(args).forEach((a) => {
            if (typeof a === "string") {
                if (!parsed.url) {
                    parsed.url = a;
                } else if (!parsed.data) {
                    parsed.data = a;
                } else {
                    console.warn("[m2d2] Too many string args to", method);
                }
            } else if (typeof a === "object" && a !== null) {
                if (!parsed.data) {
                    parsed.data = a as Record<string, unknown>;
                } else {
                    console.warn("[m2d2] Duplicate data arg to", method);
                }
            } else if (typeof a === "function") {
                if (!parsed.callback) {
                    parsed.callback = a as (data: unknown) => void;
                } else if (!parsed.errorCallback) {
                    parsed.errorCallback = a as (error: XhrError) => void;
                }
            } else if (typeof a === "boolean") {
                if (parsed.json === undefined) {
                    parsed.json = a;
                }
            } else if (typeof a === "number") {
                if (parsed.timeout === undefined) {
                    parsed.timeout = a;
                }
            }
        });
        if (parsed.data === undefined) parsed.data = {};

        return performRequest(
            method.toUpperCase(),
            parsed.url || "",
            parsed.data as Record<string, unknown>,
            parsed.callback,
            parsed.errorCallback ?? ((e) => console.log("[m2d2]", e)),
            parsed.json ?? false,
            parsed.timeout
        );
    };
}

/**
 * Register $.get, $.post, etc. on the target.
 */
export function registerXhr($target: Record<string, unknown>): void {
    ["get", "post", "put", "delete", "connect", "options", "trace", "patch", "head", "copy"].forEach(
        (method) => {
            $target[method] = makeMethod(method);
        }
    );
}
