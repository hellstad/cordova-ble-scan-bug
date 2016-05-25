var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var clean = require('gulp-clean');
var sass = require('gulp-sass');
var cssnano = require('gulp-cssnano');
var rename = require('gulp-rename');
var sh = require('shelljs');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var babel = require('babelify');
var globify = require('require-globify');
var uglify = require('gulp-uglify');

// Clean
gulp.task('clean:js', function () {
    return gulp.src('./www/bundle.{js,js.map,min.js}')
        .pipe(clean());
});

gulp.task('clean:css', function () {
    return gulp.src('./www/style.{css,min.css}')
        .pipe(clean());
});

gulp.task('clean', ['clean:js', 'clean:css']);

// Paths for gulp watch
var paths = {
    sass: ['./src/css/**/*.scss'],
    js: ['./src/js/**/*.js']
};

// JS/Browserify/bundler stuff
var jsEntryFile = './src/js/entry.js';
var jsDistDir = './www';
var bundler = browserify(jsEntryFile, { debug: true })
    .transform(babel.configure({ presets: ['es2015'] }))
    .transform(globify);
bundler.on('error', function (err) {
        console.error(err);
        this.emit('end');
    })
    .on('log', function (msg) {
        console.log('=> Bundled: ', msg);
    })
    .on('update', function (ids) {
        console.log('=> Updated: ', ids.join(', '));
    });

// SASS/SCSS stuff
var scssSrc = './src/css/*.scss';
var scssDistDir = './www';

gulp.task('js', function (done) {
    console.log('=> Building JS');
    bundler.bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(jsDistDir))
        .on('end', done);
});

gulp.task('js:dist', function (done) {
    console.log('=> Building JS (minified)');
    bundler.bundle()
        .pipe(source('bundle.min.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest(jsDistDir))
        .on('end', done);
});

gulp.task('sass', function (done) {
    console.log('=> Building SCSS');
    gulp.src(scssSrc)
        .pipe(concat('style.scss'))
        .pipe(sass())
        .on('error', sass.logError)
        .pipe(gulp.dest(scssDistDir))
        .on('end', done);
});

gulp.task('sass:dist', function (done) {
    console.log('=> Building SCSS (minified)');
    gulp.src(scssSrc)
        .pipe(concat('style.scss'))
        .pipe(sass())
        .on('error', sass.logError)
        .pipe(gulp.dest(scssDistDir))
        .pipe(cssnano({ discardComments: { removeAll: true } }))
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest(scssDistDir))
        .on('end', done);
});

gulp.task('build', ['js', 'sass']);

gulp.task('dist', ['js:dist', 'sass:dist']);

gulp.task('watch', ['build'], function () {
    return gulp.watch([paths.sass, paths.js], ['build']);
});

gulp.task('install', ['git-check'], function () {
    return bower.commands.install()
        .on('log', function (data) {
            gutil.log('bower', gutil.colors.cyan(data.id), data.message);
        });
});

gulp.task('git-check', function (done) {
    if (!sh.which('git')) {
        console.log(
            '  ' + gutil.colors.red('Git is not installed.'),
            '\n  Git, the version control system, is required to download Ionic.',
            '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
            '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
        );
        process.exit(1);
    }

    done();
});

gulp.task('default', ['watch']);
