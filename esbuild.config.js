/**
 * esbuild build configuration for m2d2.
 *
 * Produces:
 *   - dist/m2d2.esm.js   (ESM bundle, all extensions included)
 *   - dist/m2d2.cjs.js   (CommonJS bundle, all extensions included)
 *   - dist/m2d2.min.js   (IIFE minified bundle, global `m2d2`)
 *   - dist/alert.css        (common structural CSS)
 *   - dist/alert-light.css  (light theme variables)
 *   - dist/alert-dark.css   (dark theme variables)
 *
 * Type declarations (.d.ts) are generated separately via `tsc --emitDeclarationOnly`.
 *
 * Run: `npm run build`
 */
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const shared = {
    entryPoints: ["src/index.ts"],
    bundle: true,
    sourcemap: true,
    target: "es2020",
    legalComments: "none",
};

/** Copy the alert theme CSS files from src/ to dist/. */
function copyAlertCss() {
    const cssDir = "src/extensions/alert/themes";
    const files = ["alert.css", "alert-light.css", "alert-dark.css"];
    for (const f of files) {
        const src = path.join(cssDir, f);
        const dst = path.join("dist", f);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dst);
        }
    }
}

async function build() {
    // ESM build (for `import` consumers):
    await esbuild.build({
        ...shared,
        format: "esm",
        outfile: "dist/m2d2.esm.js",
    });

    // CommonJS build (for `require` consumers / Node):
    await esbuild.build({
        ...shared,
        format: "cjs",
        outfile: "dist/m2d2.cjs.js",
    });

    // IIFE build (global "m2d2") for direct <script> tag inclusion in browsers.
    // Uses src/iife.ts (export = m2d2) so the global IS the m2d2 object — not a
    // module namespace wrapper. ESM/CJS keep using src/index.ts for named exports.
    await esbuild.build({
        ...shared,
        entryPoints: ["src/iife.ts"],
        format: "iife",
        globalName: "m2d2",
        outfile: "dist/m2d2.min.js",
        minify: true,
    });

    // Copy alert CSS themes to dist/:
    copyAlertCss();

    console.log("Build complete: dist/m2d2.esm.js, dist/m2d2.cjs.js, dist/m2d2.min.js, alert CSS themes");
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});
