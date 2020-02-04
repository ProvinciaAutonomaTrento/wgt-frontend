var gulp = require('gulp')
    , preprocess = require('gulp-preprocess')
    , rename = require("gulp-rename")
    , argv = require('yargs').argv
    , gutil = require('gulp-util')
    , replace = require('gulp-token-replace');

gulp.task('html-processor', function() {

    if (argv && argv.profile) {

        switch (argv.profile) {
            case 'dev':
                gutil.log('Dev profile is set...');
                var config = require('../profiles/dev/config.json');

                console.log(config.api_url);

                gulp.src('./src/main/webapp/index.html')
                    .pipe(preprocess({
                        'context': {
                            'MODE': 'production',
                            'DEVICE': 'mobile'
                        }
                    }))
                    .pipe(replace({
                        'global': config,
                        'prefix': '${',
                        'suffix': '}'
                    }))
                    .pipe(rename('mobile.html'))
                    .pipe(gulp.dest('./src/main/webapp/'));



                gulp.src('./src/main/webapp/index.html')
                    .pipe(preprocess({
                        'context': {
                            'MODE': 'production',
                            'DEVICE': 'embed'
                        }
                    }))
                    .pipe(replace({
                        'global': config,
                        'prefix': '${',
                        'suffix': '}'
                    }))
                    .pipe(rename('embed.html'))
                    .pipe(gulp.dest('./src/main/webapp/'));

                gulp.src('./src/main/webapp/index.html')
                    .pipe(preprocess({
                        'context': {
                            'MODE': 'production',
                            'DEVICE': 'desktop'
                        }
                    }))
                    .pipe(replace({
                        'global': config,
                        'prefix': '${',
                        'suffix': '}'
                    }))
                    .pipe(gulp.dest('./src/main/webapp/'));

                /*
                aggiungo variabile di endpoint in script.js per la parte di help
                */
                gulp.src('./src/main/webapp/help/js_css/script.js')
                    // .pipe(replace(/WGT_ENDPOINT/g, config.api_url+''))
                    .pipe(replace({
                        'global': config,
                        'prefix': '${',
                        'suffix': '}'
                    }))
                    .pipe(gulp.dest('./src/main/webapp/help/js_css'));

                break;
            // case 'test':
            //   gutil.log('Test profile is set...');
            //   var config = require('../profiles/test/config.json');

            //   gulp.src('./src/main/webapp/index.html')
            //     .pipe(preprocess({
            //       'context': {
            //         'MODE': 'production',
            //         'DEVICE': 'mobile'
            //       }
            //     }))
            //     .pipe(rename('mobile.html'))
            //     .pipe(gulp.dest('./src/main/webapp/'));

            //   gulp.src('./src/main/webapp/index.html')
            //     .pipe(preprocess({
            //       'context': {
            //         'MODE': 'production',
            //         'DEVICE': 'embed'
            //       }
            //     }))
            //     .pipe(rename('embed.html'))
            //     .pipe(gulp.dest('./src/main/webapp/'));

            //   gulp.src('./src/main/webapp/index.html')
            //     .pipe(preprocess({
            //       'context': {
            //         'MODE': 'production',
            //         'DEVICE': 'desktop'
            //       }
            //     }))
            //     .pipe(gulp.dest('./src/main/webapp/'));

            //   gulp.src(['./src/main/webapp/mobile.html', './src/main/webapp/embed.html', './src/main/webapp/index.html'])
            //     .pipe(replace({
            //       'global': config,
            //       'prefix': '${',
            //       'suffix': '}'
            //     }))
            //     .pipe(gulp.dest('./'));

            //   break;
            case 'prod':
                gutil.log('Prod profile is set...');
                var config = require('../profiles/prod/config.json');

                gulp.src('./src/main/webapp/index.html')
                    .pipe(preprocess({
                        'context': {
                            'MODE': 'production',
                            'DEVICE': 'mobile'
                        }
                    }))
                    .pipe(replace({
                        'global': config,
                        'prefix': '${',
                        'suffix': '}'
                    }))
                    .pipe(rename('mobile.html'))
                    .pipe(gulp.dest('./src/main/webapp/'));

                gulp.src('./src/main/webapp/index.html')
                    .pipe(preprocess({
                        'context': {
                            'MODE': 'production',
                            'DEVICE': 'embed'
                        }
                    }))
                    .pipe(replace({
                        'global': config,
                        'prefix': '${',
                        'suffix': '}'
                    }))
                    .pipe(rename('embed.html'))
                    .pipe(gulp.dest('./src/main/webapp/'));

                gulp.src('./src/main/webapp/index.html')
                    .pipe(preprocess({
                        'context': {
                            'MODE': 'production',
                            'DEVICE': 'desktop'
                        }
                    }))
                    .pipe(replace({
                        'global': config,
                        'prefix': '${',
                        'suffix': '}'
                    }))
                    .pipe(gulp.dest('./src/main/webapp/'));

                /*
                 aggiungo variabile di endpoint in script.js per la parte di help
                 */
                gulp.src('./src/main/webapp/help/js_css/script.js')
                // .pipe(replace(/WGT_ENDPOINT/g, config.api_url+''))
                    .pipe(replace({
                        'global': config,
                        'prefix': '${',
                        'suffix': '}'
                    }))
                    .pipe(gulp.dest('./src/main/webapp/help/js_css'));

                break;
        }
    }
});
