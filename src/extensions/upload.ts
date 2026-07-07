/**
 * M2D2 Upload Extension
 *
 * $.upload(ev, options) — opens a file dialog and uploads via XHR.
 * Ported from js/m2d2.upload.src.js.
 * FIX: the maxFiles guard used bitwise-OR (`|`) instead of logical-OR (`||`),
 *      so nonzero maxFiles values were computed incorrectly.
 */

export interface UploadOptions {
    upload?: string;
    args?: Record<string, unknown>;
    accept?: string;
    parallel?: boolean;
    field?: string;
    multiple?: boolean;
    maxFiles?: number;
    maxParallel?: number;
    maxSizeMb?: number;
    php?: boolean;
    onSelect?: (files: FileList, sources: string[]) => void;
    onUpdate?: (pct: number, file: File, index: number) => void;
    onDone?: (response: UploadResponse[], allDone: boolean) => void;
    onError?: (error: unknown) => void;
    onResponse?: (response: unknown) => unknown;
}

export interface UploadResponse {
    file: File;
    data: unknown;
    index: number;
}

/** Resolved options after applying defaults. */
interface ResolvedOptions {
    upload: string;
    args: Record<string, unknown>;
    accept: string;
    parallel: boolean;
    field: string;
    multiple: boolean;
    maxFiles: number;
    maxParallel: number;
    maxSizeMb: number;
    php: boolean;
    onSelect?: (files: FileList, sources: string[]) => void;
    onUpdate: (pct: number, file: File, index: number) => void;
    onDone: (response: UploadResponse[], allDone: boolean) => void;
    onError: (error: unknown) => void;
    onResponse: (response: unknown) => unknown;
}

interface FileUploadContext {
    fieldName: string;
    files: File[];
    index: number;
    options: ResolvedOptions;
    callback: (data: unknown, files: File[], index: number) => void;
}

function getResponse(data: unknown, files: File[], index: number): UploadResponse[] {
    const response: UploadResponse[] = [];
    data = data || {};
    files.forEach((f, i) => {
        let row: unknown;
        if (Array.isArray(data) && data.length === files.length) {
            row = (data as unknown[])[index];
        } else if (
            !Array.isArray(data) &&
            typeof data === "object" &&
            data !== null &&
            (data as Record<string, unknown>)[f.name] !== undefined
        ) {
            row = (data as Record<string, unknown>)[f.name];
        } else {
            row = data;
        }
        response.push({ file: f, data: row, index: index + i });
    });
    return response;
}

function getFileForm(fieldName: string, files: File[]): FormData {
    const form = new FormData();
    files.forEach((file) => {
        if (file) form.append(fieldName, file, file.name);
    });
    return form;
}

/**
 * Upload a batch of files via XHR.
 * Ported from js/m2d2.upload.src.js:146-206 (FileUpload).
 */
function fileUpload(ctx: FileUploadContext): void {
    const { fieldName, files, index, options, callback } = ctx;
    const xhr = new XMLHttpRequest();
    const fileArr = Array.from(files);

    xhr.upload.addEventListener(
        "progress",
        (e: ProgressEvent) => {
            if (!e.lengthComputable) return;
            if (options.parallel) {
                const pct = Math.round((e.loaded * 100) / e.total);
                options.onUpdate(pct, fileArr[0], index);
            } else {
                let sizeAccum = 0;
                let i = 0;
                fileArr.some((f) => {
                    sizeAccum += f.size;
                    const pct =
                        e.loaded >= sizeAccum
                            ? 100
                            : 100 - Math.round(((sizeAccum - e.loaded) * 100) / f.size);
                    options.onUpdate(pct, f, i++);
                    return sizeAccum >= e.loaded;
                });
            }
        },
        false
    );

    xhr.addEventListener(
        "load",
        () => {
            let data: { error?: unknown; [k: string]: unknown } = {};
            try {
                data = xhr.responseText
                    ? JSON.parse(xhr.responseText)
                    : { error: { type: "Unknown", reason: "Unknown Error" } };
            } catch (err) {
                data.error = { type: "Parse Error", reason: (err as Error).message };
            }
            if (xhr.status >= 200 && xhr.status < 400) {
                callback(options.onResponse(data), fileArr, index);
            } else {
                let err = data.error;
                if (typeof err === "string") {
                    err = { type: "Exception", reason: err };
                }
                options.onError(err);
            }
        },
        false
    );

    xhr.open("POST", options.upload);

    // Read each file to ensure it's loadable, then send the form once all are read:
    const loaded = Array(fileArr.length).fill(false);
    const form = getFileForm(fieldName, fileArr);
    let loadIndex = 0;
    fileArr.forEach((f) => {
        if (f) {
            const reader = new FileReader();
            reader.onload = () => {
                loaded[loadIndex++] = true;
                if (loaded.indexOf(false) === -1) {
                    xhr.send(form);
                }
            };
            reader.readAsBinaryString(f);
        }
    });
}

/**
 * Open a file dialog and upload selected files.
 * Ported from js/m2d2.upload.src.js:14-127.
 */
export function upload(ev: unknown, userOptions?: UploadOptions): void {
    const opts: ResolvedOptions = Object.assign(
        {
            upload: "",
            args: {},
            accept: "*/*",
            parallel: false,
            field: "file",
            multiple: true,
            maxFiles: 0,
            maxParallel: 0,
            maxSizeMb: 0,
            php: false,
        },
        userOptions
    ) as ResolvedOptions;

    // Default callbacks:
    opts.onDone = opts.onDone ?? ((response) => console.log("[m2d2]", response));
    opts.onError =
        opts.onError ?? ((response) => console.error("[m2d2] Upload error:", response));
    opts.onUpdate =
        opts.onUpdate ??
        ((pct, file) =>
            console.log("[m2d2] Uploading:", pct + "%", opts.parallel ? "[" + file.name + "]" : ""));
    opts.onResponse = opts.onResponse ?? ((res) => res);

    const el = document.createElement("input") as HTMLInputElement;
    el.name = opts.field;
    el.type = "file";
    el.accept = opts.accept;
    if (opts.multiple) {
        el.multiple = true;
        if (opts.php) {
            el.name += "[]"; // PHP-compatible field name
        }
    }
    if (!opts.upload) {
        console.warn("[m2d2] Upload URL not specified. Using current page.");
        opts.upload = "";
    }
    const queryStr = opts.args
        ? (opts.upload.indexOf("?") !== -1 ? "&" : "?") +
          new URLSearchParams(opts.args as Record<string, string>).toString()
        : "";
    opts.upload += queryStr;

    el.addEventListener("change", () => {
        if (!el.files || !el.files.length) return;
        // Capture the narrowed FileList so downstream closures see it as non-null.
        const selectedFiles = el.files;

        // FIX: original used bitwise-OR (`opts.maxFiles === 0 | el.files.length <= opts.maxFiles`).
        // Now correctly logical-OR: unlimited when 0, otherwise enforce the limit.
        if (opts.maxFiles === 0 || selectedFiles.length <= opts.maxFiles) {
            if (opts.onSelect) {
                const srcs: string[] = [];
                let totSize = 0;
                Array.from(selectedFiles).forEach((file) => {
                    srcs.push(URL.createObjectURL(file));
                    totSize += file.size;
                });
                const mbs = totSize / (1024 * 1024);
                if (opts.maxSizeMb && mbs > opts.maxSizeMb) {
                    opts.onError(
                        "Maximum size exceeded: " + Math.ceil(mbs) + "MB > " + opts.maxSizeMb + "MB"
                    );
                    return;
                }
                opts.onSelect(selectedFiles, srcs);
            }

            new Promise<void>((resolve) => {
                if (opts.parallel) {
                    let index = 0;
                    const files = Array.from(selectedFiles);
                    const fileDone = Array(files.length).fill(false);
                    let uploading: (File | undefined)[] = [];

                    const uploadOne = (file: File) => {
                        fileUpload({
                            fieldName: el.name,
                            files: [file],
                            index: index++,
                            options: opts,
                            callback: (data, fList, idx) => {
                                fileDone[idx] = true;
                                if (uploading.length) {
                                    const ui = uploading.indexOf(file);
                                    if (ui >= 0) uploading[ui] = undefined;
                                    uploading = uploading.filter((e) => e !== undefined);
                                }
                                const allDone = fileDone.indexOf(false) === -1;
                                opts.onDone(getResponse(data, fList, idx), allDone);
                                if (allDone) resolve();
                            },
                        });
                    };

                    if (opts.maxParallel) {
                        const timer = setInterval(() => {
                            if (files.length === 0) {
                                clearInterval(timer);
                            } else {
                                while (uploading.length < opts.maxParallel) {
                                    const file = files.shift();
                                    if (file) {
                                        uploading.push(file);
                                        uploadOne(file);
                                    } else {
                                        break;
                                    }
                                }
                            }
                        }, 100);
                    } else {
                        files.forEach(uploadOne);
                    }
                } else {
                    fileUpload({
                        fieldName: el.name,
                        files: Array.from(selectedFiles),
                        index: 0,
                        options: opts,
                        callback: (data, fList, idx) => {
                            opts.onDone(getResponse(data, fList, idx), true);
                            resolve();
                        },
                    });
                }
            });
        } else {
            opts.onError("Max file limit exceeded. Maximum files: " + opts.maxFiles);
        }
    });

    el.click(); // open dialog
}

/**
 * Register $.upload on the target.
 */
export function registerUpload($target: { upload?: typeof upload }): void {
    $target.upload = upload;
}
