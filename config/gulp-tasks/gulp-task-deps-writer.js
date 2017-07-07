var gulp = require('gulp')
  , closureDeps = require('gulp-closure-deps');

var paths = {
  scripts: [
    'src/main/webapp/components/**/*.js',
    'src/main/webapp/js/**/*.js'
  ]
};

gulp.task('deps-writer-from-src', function() {
  return gulp.src(paths.scripts)
    .pipe(closureDeps({
      'fileName': 'deps.js',
      'prefix': './',
      'baseDir': 'src/main/webapp'
    }))
    .pipe(gulp.dest('./src/main/webapp'));
});


gulp.task('deps-writer', ['deps-writer-from-src']);
