var gulp = require('gulp')
  , less = require('gulp-less')
  , concat = require('gulp-concat');

gulp.task('less-origin', function () {
  return gulp.src('./origin_src/style/app.less')
    .pipe(less())
    .pipe(gulp.dest('./src/main/webapp/style/'));
});

gulp.task('less-custom', function() {
  return gulp.src(['./custom_src/style/variables.less','./custom_src/style/custom.less','./custom_src/components/**/style/*.less'])
   .pipe(concat("custom.less"))
   .pipe(less())
   .pipe(gulp.dest('./src/main/webapp/style/'));
})

gulp.task('less', ['less-origin', 'less-custom']);
