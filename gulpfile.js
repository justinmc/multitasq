var gulp = require('gulp');

var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');

var paths = {
    scripts: ['app/scripts/model/task.js', 'app/scripts/collection/tasks.js', 'app/scripts/view/sandbox.js', 'app/scripts/view/task.js', 'app/scripts/app.js'],
    styles: ['app/styles/**/*.css'],
    html: ['app/index.html', 'app/404.html'], 
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
        .pipe(gulp.dest(paths.app + 'scripts/'));
});

gulp.task('copy', function() {
    return gulp.src(paths.html.concat(paths.styles))
        .pipe(gulp.dest(paths.dist));
});

gulp.task('watch', function() {
    gulp.watch(paths.scripts, ['scripts']);
});

gulp.task('default', ['clean', 'scripts', 'copy']);

