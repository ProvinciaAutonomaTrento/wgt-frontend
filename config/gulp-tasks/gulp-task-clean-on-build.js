var gulp = require('gulp')
  , del = require('del');

gulp.task('clean:all', function () {
	return del.sync(['./src/main/webapp/**/*',
  '!./src/main/webapp/crossdomain.xml',
  '!./src/main/webapp/WEB-INF',
  '!./src/main/webapp/WEB-INF/web.xml',
  '!./src/main/webapp/WEB-INF/spring',
  '!./src/main/webapp/WEB-INF/spring/wgt-client-context.xml']);
});
