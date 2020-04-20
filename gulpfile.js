const gulp = require('gulp'),
	concat = require('gulp-concat'),
	terser = require('gulp-terser');

const paths = {
	prefix: 'm2d2.min',
	build: 'js/',
	js: [
		'js/m2d2.src.js',
		'js/m2d2.show.src.js',
		'js/m2d2.style.src.js'
	]
};

gulp.task('js', function() {
	return gulp.src(paths.js)
		.pipe(terser())
		.pipe(concat(paths.prefix + '.js'))
		.pipe(gulp.dest(paths.build));
});

// Watch
gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['js']);
});

// Build
gulp.task('default', ['js']);
