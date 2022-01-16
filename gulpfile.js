let debug = false;

const gulp = require('gulp'),
	concat = require('gulp-concat'),
    rename = require('gulp-rename'),
	terser = require('gulp-terser'),
	header = require('gulp-header-comment'),
	umd	   = require('gulp-umd');

const paths = {
	prefix: 'm2d2',
	build: 'dist/',
	build_src: 'dist/src/',
	js: [
		'js/utils.src.js',
		'js/m2d2.src.js'
	],
	ext : 'js/m2d2.*.src.js',
	bundle : [
	    'dist/m2d2.min.js',
	    'dist/m2d2.*.min.js',
	    '!dist/m2d2.bundle.*.js'
	],
	xhr : [
	    'dist/m2d2.min.js',
	    'dist/m2d2.*.min.js',
	    '!dist/m2d2.ws.min.js',
	    '!dist/m2d2.bundle.*.js'
	],
	ws : [
	    'dist/m2d2.min.js',
	    'dist/m2d2.*.min.js',
	    '!dist/m2d2.xhr.min.js',
	    '!dist/m2d2.bundle.*.js'
	]
};
const umdOpts = {
	exports: () => { return paths.prefix },
	namespace : () => { return paths.prefix }
}
const headers = `
Author : A.Lepe (dev@alepe.com) - intellisrc.com
License: <%= pkg.license %>
Version: <%= pkg.version %>
Updated: <%= moment().format('YYYY-MM-DD') %>
Content: `;
// Core minified
gulp.task('js', gulp.series([], function() {
	return gulp.src(paths.js)
		.pipe(terser())
		.pipe(concat(paths.prefix + '.min.js'))
		.pipe(gulp.dest(paths.build));
}));
// Extensions pack minified
gulp.task('ext', gulp.series(['js'], function() {
	return gulp.src(paths.ext)
		.pipe(terser())
		.pipe(header(headers + "Extension"))
        .pipe(rename({ extname : "" })) //remove extensions
        .pipe(rename({ extname : ".min.js" }))
		.pipe(gulp.dest(paths.build));
}));
// Core + Extensions pack minified
gulp.task('bundle', gulp.series(['js', 'ext'], function() {
	return gulp.src(paths.bundle)
		.pipe(concat(paths.prefix + '.bundle.min.js'))
		.pipe(umd(umdOpts))
		.pipe(terser())
		.pipe(header(headers + "Full Bundle"))
		.pipe(gulp.dest(paths.build));
}));
// Core + Extensions XHR
gulp.task('xhr', gulp.series(['bundle'], function() {
	return gulp.src(paths.xhr)
		.pipe(concat(paths.prefix + '.bundle.xhr.min.js'))
		.pipe(umd(umdOpts))
		.pipe(terser())
		.pipe(header(headers + "XHR Bundle"))
		.pipe(gulp.dest(paths.build));
}));
// Core + Extensions WS
gulp.task('ws', gulp.series(['bundle'], function() {
	return gulp.src(paths.ws)
		.pipe(concat(paths.prefix + '.bundle.ws.min.js'))
		.pipe(umd(umdOpts))
		.pipe(terser())
		.pipe(header(headers + "WebSocket Bundle"))
		.pipe(gulp.dest(paths.build));
}));
// Core minified with umd (the first time 'js' is used a base for bundles, this is for m2d2.min.js)
gulp.task('jse', gulp.series(['ws'], function() {
	return gulp.src(paths.js)
		.pipe(terser())
		.pipe(concat(paths.prefix + '.min.js'))
		.pipe(umd(umdOpts))
		.pipe(terser())
		.pipe(header(headers + "Core"))
		.pipe(gulp.dest(paths.build));
}));
// Source only for development
gulp.task('dev', gulp.series([], function() {
	return gulp.src(paths.js)
		.pipe(concat(paths.prefix + (debug ? '.min.js' : '.src.js')))
		.pipe(umd(umdOpts))
		.pipe(header(headers + "Core (Debug)"))
		.pipe(gulp.dest(paths.build_src));
}));
// Extension Source only for development
gulp.task('dev_ext', gulp.series([], function() {
	return gulp.src(paths.ext)
		.pipe(header(headers + "Extension (Debug)"))
		.pipe(gulp.dest(paths.build_src));
}));
// Bundle all source for development
gulp.task('dev_all', gulp.series([], function() {
	return gulp.src(paths.js.concat(paths.ext))
	    .pipe(concat(paths.prefix + ".all.src.js"))
		.pipe(umd(umdOpts))
		.pipe(header(headers + "Full Bundle (Debug)"))
		.pipe(gulp.dest(paths.build_src));
}));

// Build
gulp.task('default', gulp.series(debug ? ['dev'] : ['js','ext','bundle','xhr','ws','jse','dev','dev_ext','dev_all']));
