var gulp = require('gulp')
  , del = require('del');

gulp.task('clean:all', function () {
	return del.sync(['./src/main/webapp/**/*']);
});
