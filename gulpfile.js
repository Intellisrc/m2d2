let debug = false;

const gulp = require('gulp'),
	concat = require('gulp-concat'),
	terser = require('gulp-terser');

const paths = {
	prefix: 'm2d2',
	build: 'dist/',
	js: [
		'js/utils.src.js',
		'js/m2d2.src.js',
		'js/m2d2.show.src.js',
		'js/m2d2.style.src.js'
	]
};

gulp.task('js', function() {
	return gulp.src(paths.js)
		.pipe(terser())
		.pipe(concat(paths.prefix + '.min.js'))
		.pipe(gulp.dest(paths.build));
});
gulp.task('dev', function() {
	return gulp.src(paths.js)
		.pipe(concat(paths.prefix + (debug ? '.min.js' : '.src.js')))
		.pipe(gulp.dest(paths.build));
});

// Watch
gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['js','dev']);
});

// Build
gulp.task('default', debug ? ['dev'] : ['js','dev']);
