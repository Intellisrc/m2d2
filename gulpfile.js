let debug = false;

const gulp = require('gulp'),
	concat = require('gulp-concat'),
    rename = require('gulp-rename'),
	terser = require('gulp-terser'),
	header = require('gulp-header-comment');

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
// Core minified
gulp.task('js', gulp.series([], function() {
	return gulp.src(paths.js)
		.pipe(terser())
		.pipe(concat(paths.prefix + '.min.js'))
		.pipe(header(`
            License: <%= pkg.license %>
            Generated on <%= moment().format('YYYY-MM-DD') %>
            Author: A.Lepe (dev@alepe.com)
            Version: <%= pkg.version %>
        `))
		.pipe(gulp.dest(paths.build));
}));
// Extensions pack minified
gulp.task('ext', gulp.series(['js'], function() {
	return gulp.src(paths.ext)
		.pipe(terser())
        .pipe(rename({ extname : "" })) //remove extensions
        .pipe(rename({ extname : ".min.js" }))
		.pipe(gulp.dest(paths.build));
}));
// Core + Extensions pack minified
gulp.task('bundle', gulp.series(['js', 'ext'], function() {
	return gulp.src(paths.bundle)
		.pipe(concat(paths.prefix + '.bundle.min.js'))
		.pipe(gulp.dest(paths.build));
}));
// Core + Extensions XHR
gulp.task('xhr', gulp.series(['bundle'], function() {
	return gulp.src(paths.xhr)
		.pipe(concat(paths.prefix + '.bundle.xhr.min.js'))
		.pipe(gulp.dest(paths.build));
}));
// Core + Extensions WS
gulp.task('ws', gulp.series(['bundle'], function() {
	return gulp.src(paths.ws)
		.pipe(concat(paths.prefix + '.bundle.ws.min.js'))
		.pipe(gulp.dest(paths.build));
}));
// Source only for development
gulp.task('dev', gulp.series([], function() {
	return gulp.src(paths.js)
		.pipe(concat(paths.prefix + (debug ? '.min.js' : '.src.js')))
		.pipe(gulp.dest(paths.build_src));
}));
// Extension Source only for development
gulp.task('dev_ext', gulp.series([], function() {
	return gulp.src(paths.ext)
		.pipe(gulp.dest(paths.build_src));
}));
// Bundle all source for development
gulp.task('dev_all', gulp.series([], function() {
	return gulp.src(paths.js.concat([paths.ext]))
	    .pipe(concat(paths.prefix + ".all.src.js"))
		.pipe(gulp.dest(paths.build_src));
}));

// Build
gulp.task('default', gulp.series(debug ? ['dev'] : ['js','ext','bundle','xhr','ws','dev','dev_ext','dev_all']));
