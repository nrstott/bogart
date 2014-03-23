var gulp = require('gulp')
  , concat = require('gulp-concat')
  , uglify = require('gulp-uglify')
  , less = require('gulp-less')
  , minifyCSS = require('gulp-minify-css');

var paths = {
  styles: [
    './bower_components/bootstrap/less/*.less',
    './less/app.less'
  ],

  allStyles: [
    './less/*.less'
  ],

  components: [
    './bower_components/jquery/dist/jquery.min.js',
    './bower_components/fastclick/lib/fastclick.js',
    './bower_components/bootstrap/js/scrollspy.js',
  ],

  scripts: [
    './js/prism.js',
    './js/setup.js',
    './js/smoothscroll.js'
  ]
};

var defaultTasks = [
  'components',
  'scripts',
  'styles',
  'watch'
];

gulp.task('styles', function () {
  return gulp.src(['./less/app.less'])
  .pipe(less({
    paths: paths.styles
  }))
  // .pipe(minifyCSS())
  .pipe(gulp.dest('./css'));
});

gulp.task('scripts', function () {
  return gulp.src(paths.scripts)
  .pipe(concat('app.js'))
  // .pipe(uglify())
  .pipe(gulp.dest('./js'));
});

gulp.task('components', function () {
  return gulp.src(paths.components)
  .pipe(concat('components.js'))
  // .pipe(uglify())
  .pipe(gulp.dest('./js'));
});

gulp.task('watch', function () {
  gulp.watch(paths.allStyles, ['styles']);
  gulp.watch(paths.scripts, ['scripts']);
  gulp.watch(paths.components, ['components']);
});

gulp.task('buildScripts', function () {
  return gulp.src([
    './js/components.js',
    './js/app.js'
  ])
  .pipe(concat('build.js'))
  .pipe(uglify())
  .pipe(gulp.dest('./js'));
});

gulp.task('buildStyles', function () {
  return gulp.src(['./css/app.css'])
  .pipe(minifyCSS())
  .pipe(gulp.dest('./css'));
});


gulp.task('build', ['buildStyles', 'buildScripts']);
gulp.task('default', defaultTasks);
