var gulp = require('gulp');

var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var bases = {
    app: 'app/',
    dist: 'dist/',
};

var paths = {
    scripts: ['scripts/app.js', 'scripts/model/task.js', 'scripts/collection/tasks.js', 'scripts/view/sandbox.js', 'scripts/view/task.js', 'scripts/view/modal.js', 'scripts/view/editable_input.js', 'scripts/router.js', 'scripts/app_bootstrap.js'],
    styles: ['styles/**/*.css', 'styles/**/*.eot', 'styles/**/*.svg', 'styles/**/*.ttf', 'styles/**/*.woff'],
    html: ['index.html', '404.html'], 
    bower: ['bower_components/jquery/dist/jquery.js', 'bower_components/underscore/underscore.js', 'bower_components/backbone/backbone.js', 'bower_components/backbone.localStorage/backbone.localStorage-min.js'],
    extras: ['crossdomain.xml', 'humans.txt', 'manifest.appcache', 'robots.txt', 'favicon.ico', '.htaccess'],
};

gulp.task('clean', function() {
    return gulp.src(bases.dist)
        .pipe(clean());
});

gulp.task('scripts', function() {
    return gulp.src(paths.scripts, {cwd: bases.app})
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(uglify())
        .pipe(concat('multitasq.min.js'))
        .pipe(gulp.dest(bases.dist + 'scripts/'));
});

/* Not needed for favicon
gulp.task('imagemin', function() {
    return gulp.src(paths.images)
        .pipe(imagemin())
        .pipe(gulp.dest(bases.dist));
});
*/

gulp.task('copy', function() {
    // copy html
    gulp.src(paths.html, {cwd: bases.app})
        .pipe(gulp.dest(bases.dist));

    // copy styles
    gulp.src(paths.styles, {cwd: 'app/**'})
        .pipe(gulp.dest(bases.dist));

    // copy bower scripts
    gulp.src(paths.bower, {cwd: 'app/**'})
        .pipe(gulp.dest(bases.dist));

    // copy extra html5bp files
    gulp.src(paths.extras, {cwd: bases.app})
        .pipe(gulp.dest(bases.dist));
});

gulp.task('watch', function() {
    gulp.watch('app/**/*', ['scripts', 'copy']);
});

gulp.task('default', ['clean', 'scripts', 'copy']);

