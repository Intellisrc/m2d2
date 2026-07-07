/**
 * IIFE entry stub.
 *
 * Why this exists:
 *   `src/index.ts` uses `export default m2d2` plus named exports (`m2d2`, `$`,
 *   `ready`, `load`, `config`) so ESM/CJS consumers get a proper module namespace
 *   with tree-shakeable named exports, and tests can `import { m2d2 }`.
 *
 *   For the browser IIFE bundle, however, we want the *global* `m2d2` to BE the
 *   `m2d2` object itself (so `m2d2.ready`, `m2d2.alert.register`, `m2d2.short`
 *   all work directly off `window.m2d2`). With esbuild's IIFE format, a module
 *   that mixes `export default` with named exports assigns the *module
 *   namespace* (`{ default, ...named }`) to the global — so `m2d2.alert` would
 *   be `undefined` (it lives on `m2d2.default`).
 *
 *   Using `export = m2d2` here makes esbuild assign the object itself to the
 *   global, while ESM/CJS builds keep using `src/index.ts` unchanged.
 */
import { m2d2 } from "./index";

export = m2d2;
