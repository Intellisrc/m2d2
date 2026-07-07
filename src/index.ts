import { utils } from "./utils";
import { config, extensions } from "./config";
import { installPrototypes } from "./dom";
import { $, ready, load } from "./factory";
import { registerStorage } from "./extensions/storage";
import { registerXhr } from "./extensions/xhr";
import { registerUpload } from "./extensions/upload";
import { registerWs } from "./extensions/ws";
import { registerLang } from "./extensions/lang";
import { registerAlert, alertNamespace } from "./extensions/alert";

// Install Element.prototype patches once:
installPrototypes();

// Copy all utils methods onto $ so they're accessible as $.isString, $.isNode, etc.:
utils.getMethods(utils).forEach((k) => {
    ($ as any)[k] = (utils as any)[k];
});

// Register all extensions onto $:
registerStorage($ as any);
registerXhr($ as any);
registerUpload($ as any);
registerWs($ as any);
registerLang($ as any);
registerAlert($ as any);

/**
 * The m2d2 namespace — the UMD global.
 * Usage:
 *   m2d2.ready($ => { ... })
 *   const $ = m2d2.load()
 *   m2d2.short = false  // disable short assignment
 *   m2d2.alert.register({ icons: "material", theme: "dark" })  // configure alert
 */
export const m2d2 = {
    ready,
    load,
    main: $,
    // Config flags (mutable, backed by the config module):
    get short(): boolean {
        return config.short;
    },
    set short(v: boolean) {
        config.short = v;
    },
    get updates(): boolean {
        return config.updates;
    },
    set updates(v: boolean) {
        config.updates = v;
    },
    get storedEventsTimeout(): number {
        return config.storedEventsTimeout;
    },
    set storedEventsTimeout(v: number) {
        config.storedEventsTimeout = v;
    },
    // Utils instance:
    utils,
    // Extension registry (shared with config):
    extensions,
    // Alert configuration namespace:
    alert: alertNamespace,
};

export default m2d2;
export { $, ready, load, config };
