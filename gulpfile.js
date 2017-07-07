var gulp = require('gulp');
var requireDir = require('require-dir');
var runSequence = require('run-sequence');
var connect = require('gulp-connect');

requireDir('./config/gulp-tasks');

gulp.task('default', function(){
     return runSequence('clean:all', 'copy-files', 'copy-custom-files', 'copy-bower-components', 'lint', 'html-processor', 'less', 'deps-writer');
});

gulp.task('connect', function() {
    connect.server({
        port: 3000,
        root: './src/main/webapp',
        livereload: false
    });
});
