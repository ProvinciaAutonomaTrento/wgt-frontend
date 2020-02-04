var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var inject = require('gulp-inject');
var cleanCSS = require('gulp-clean-css')
var runSequence = require('run-sequence');

gulp.task('copy-bower-js', function () {
    return gulp.src([
        'bower_components/jquery/jquery.js',
        'bower_components/jQuery-ajaxTransport-XDomainRequest/jquery.xdomainrequest.min.js',
        'bower_components/angular/angular.js',
        'bower_components/angular-translate/angular-translate.js',
        'bower_components/bootstrap/dist/js/bootstrap.js',
        'bower_components/angular-bootstrap/ui-bootstrap-tpls.js'
    ])
        .pipe(concat("lib.min.js"))
        .pipe(uglify())
        .pipe(gulp.dest('src/main/webapp/resources/vendor/js'));
});

gulp.task('copy-bower-css', function () {
    return gulp.src([
        //'bower_components/**/*.css'
        'bower_components/bootstrap/dist/css/bootstrap.css',
        'bower_components/angular-bootstrap/ui-bootstrap-csp.css'
    ])
        .pipe(concat('lib.min.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest('src/main/webapp/resources/vendor/css'));
});

gulp.task('copy-bower-fonts', function () {
    return gulp.src([
        'bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.woff'
    ])
        .pipe(gulp.dest('src/main/webapp/resources/vendor/fonts'));
});

gulp.task('inject-to-index', function () {
    var target = gulp.src('custom_src/index.html');
    // var target = gulp.src('origin_src/index.html');
    var sources = gulp.src(['src/main/webapp/resources/**/*.js', 'src/main/webapp/resources/**/*.css'], {
        read: false
    });
    return target.pipe(inject(sources, {
        relative: false,
        addRootSlash: false,
        ignorePath: 'src/main/webapp'
    }))
        .pipe(gulp.dest('src/main/webapp'));
});

gulp.task('copy-bower-components', function (callback) {
    return runSequence('copy-bower-js', 'copy-bower-css', 'copy-bower-fonts', 'inject-to-index', callback);
});
