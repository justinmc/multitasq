var gulp = require('gulp');

var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');

var paths = {
    scripts: ['app/js/**/*.js', '!app/js/libs/**/*.js'],
    styles: ['app/css/**/*.css'],
    html: ['app/**/*.html'], 
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

gulp.task('copy', function() {
    return gulp.src(paths.html.concat(paths.styles))
        .pipe(gulp.dest(paths.dist));
});

gulp.task('default', ['clean', 'scripts', 'copy']);

