var gulp = require('gulp');

var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var paths = {
    scripts: ['app/scripts/model/task.js', 'app/scripts/collection/tasks.js', 'app/scripts/view/sandbox.js', 'app/scripts/view/task.js', 'app/scripts/app.js'],
    styles: ['app/styles/**/*.css'],
    html: ['app/index.html', 'app/404.html'], 
    bower: ['bower_components/jquery/dist/jquery.js', 'bower_components/underscore/underscore.js', 'bower_components/backbone/backbone.js', 'bower_components/backbone.localStorage/backbone.localStorage-min.js'],
    extras: ['app/crossdomain.xml', 'app/humans.txt', 'app/manifest.appcache', 'app/robots.txt', 'app/favicon.ico'],
    app: 'app/',
    dist: 'dist/'
};

gulp.task('clean', function() {
    return gulp.src(paths.dist)
        .pipe(clean());
});

gulp.task('scripts', function() {
    return gulp.src(paths.scripts)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(uglify())
        .pipe(concat('multitasq.min.js'))
        .pipe(gulp.dest(paths.dist + 'scripts/'));
});

/* Not needed for favicon
gulp.task('imagemin', function() {
    return gulp.src(paths.images)
        .pipe(imagemin())
        .pipe(gulp.dest(paths.dist));
});
*/

gulp.task('copy', function() {
    // copy html
    gulp.src(paths.html)
        .pipe(gulp.dest(paths.dist));

    // copy styles
    gulp.src(paths.styles)
        .pipe(gulp.dest(paths.dist + 'styles'));

    // copy bower scripts
    gulp.src(paths.bower, {cwd: 'app/**'})
        .pipe(gulp.dest(paths.dist));

    // copy extra html5bp files
    gulp.src(paths.extras)
        .pipe(gulp.dest(paths.dist));
});

gulp.task('watch', function() {
    gulp.watch('app/**/*', ['scripts', 'copy']);
});

gulp.task('default', ['clean', 'scripts', 'copy']);

