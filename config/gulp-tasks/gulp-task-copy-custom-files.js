var gulp = require('gulp');
var flatten = require('gulp-flatten');
var runSequence = require('run-sequence');

gulp.task('copy-custom-components', function() {
  return gulp.src('./custom_src/components/**/*')
    .pipe(gulp.dest('./src/main/webapp/components'));
});

gulp.task('copy-custom-img', function() {
  return gulp.src('./custom_src/img/**/*')
    .pipe(gulp.dest('./src/main/webapp/img'));
});

gulp.task('copy-custom-lib', function() {
  return gulp.src('./custom_src/lib/**/*')
    .pipe(gulp.dest('./src/main/webapp/lib'));
});

gulp.task('copy-custom-js', function() {
  return gulp.src('./custom_src/js/**/*')
    .pipe(gulp.dest('./src/main/webapp/js'));
});

gulp.task('copy-custom-locales', function() {
  return gulp.src('./custom_src/locales/**/*')
    .pipe(gulp.dest('./src/main/webapp/locales'))
});

gulp.task('copy-custom-components-img', function() {
  return gulp.src('./custom_src/components/**/*.png')
    .pipe(flatten())
    .pipe(gulp.dest('./src/main/webapp/style'));
});

gulp.task('copy-custom-helper', function() {
  return gulp.src('./custom_src/help/**/*')
    .pipe(gulp.dest('./src/main/webapp/help'));
});

gulp.task('copy-custom-files', function(callback) {
  return runSequence('copy-custom-components', 'copy-custom-img', 'copy-custom-lib', 'copy-custom-js', 'copy-custom-locales', 'copy-custom-components-img', 'copy-custom-helper', callback);
});
