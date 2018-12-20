var gulp = require('gulp');
var flatten = require('gulp-flatten');
var runSequence = require('run-sequence');

gulp.task('copy-checker', function() {
  return gulp.src('./origin_src/checker')
      .pipe(gulp.dest('./src/main/webapp/'));
});

gulp.task('copy-components', function() {
  return gulp.src('./origin_src/components/**/*')
    .pipe(gulp.dest('./src/main/webapp/components'));
});

gulp.task('copy-img', function() {
  return gulp.src('./origin_src/img/**/*')
    .pipe(gulp.dest('./src/main/webapp/img'));
});

gulp.task('copy-lib', function() {
  return gulp.src('./origin_src/lib/**/*')
    .pipe(gulp.dest('./src/main/webapp/lib'));
});

gulp.task('copy-js', function() {
  return gulp.src('./origin_src/js/**/*')
    .pipe(gulp.dest('./src/main/webapp/js'));
});

gulp.task('copy-locales', function() {
  return gulp.src('./origin_src/locales/**/*')
    .pipe(gulp.dest('./src/main/webapp/locales'))
});

gulp.task('copy-style', function() {
  return gulp.src('./origin_src/style/font-awesome-3.2.1/font/*')
    .pipe(gulp.dest('./src/main/webapp/style/font'));
});

gulp.task('copy-components-img', function() {
  return gulp.src('./origin_src/components/**/*.png')
    .pipe(flatten())
    .pipe(gulp.dest('./src/main/webapp/style'));
});

gulp.task('copy-files', function(callback) {
  return runSequence('copy-checker', 'copy-components', 'copy-img', 'copy-lib', 'copy-js', 'copy-locales', 'copy-style', 'copy-components-img', callback);
});
