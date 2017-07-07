var gulp = require('gulp')
  , eslint = require('gulp-eslint');

gulp.task('lint', function() {
  return gulp.src(['./src/main/webapp/components/*.js', './src/main/webapp/components/*.js'])
  .pipe(eslint())
  // eslint.format() outputs the lint results to the console.
  // Alternatively use eslint.formatEach() (see Docs).
  .pipe(eslint.format())
  // To have the process exit with an error code (1) on
  // lint error, return the stream and pipe to failAfterError last.
  .pipe(eslint.failAfterError());
});
