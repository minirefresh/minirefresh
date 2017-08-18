var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var cleanCSS = require('gulp-clean-css');
// 串行执行任务
var gulpSequence = require('gulp-sequence');
// 头部注释
var header = require('gulp-header');
var pkg = require('./package.json');
var banner = ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @author <%= pkg.author %>',
    ' * <%= pkg.homepage %>',
    ' */',
    ''
].join('\n');

var debugPath = './dist/_debug/';
var releasePath = './dist/';

// MiniRefresh核心文件合并，默认打包核心文件已经default皮肤
gulp.task('core_concat', function() {
    return gulp.src(['./src/minirefresh.js', './src/minirefresh.innerutil.js', './src/minirefresh.scroll.js', './src/minirefresh.core.js', './src/skin/minirefresh.skin.default.js'])
        .pipe(concat('minirefresh.js'))
        .pipe(gulp.dest(debugPath));
});

// 打包skin系列（除了default，因为default已经默认打包）
gulp.task('pack_skin', function() {
    return gulp.src(['./src/skin/*.js', '!./src/skin/minirefresh.skin.default.js'])
        .pipe(gulp.dest(debugPath));
});

// 打包 css以及静态资源
gulp.task('pack_resources', function() {
    return gulp.src(['./src/css/**/*'])
        .pipe(gulp.dest(debugPath));
});

// 压缩发布的源文件
gulp.task('js_uglify', function() {
    return gulp.src([debugPath + '**/*.js', '!' + debugPath + '**/*.min.js'])
        .pipe(uglify())
        // 压缩时进行异常捕获
        .on('error', function(err) {
            console.log('line number: %d, message: %s', err.lineNumber, err.message);
            this.end();
        })
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(header(banner, {
            pkg: pkg
        }))
        .pipe(gulp.dest(releasePath));
});

// 压缩发布 css
gulp.task('clean_css', function() {
    return gulp.src([debugPath + '**/*.css', '!' + debugPath + '**/*.min.css'])
        .pipe(cleanCSS())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(header(banner, {
            pkg: pkg
        }))
        .pipe(gulp.dest(releasePath));
});

// 压缩发布 图片资源,暂时不压缩
gulp.task('resource_uglify', function() {
    return gulp.src([debugPath + '**/*', '!' + debugPath + '**/*.css', '!' + debugPath + '**/*.js'])
        .pipe(gulp.dest(releasePath));
});

gulp.task('pack_debug', ['core_concat', 'pack_skin', 'pack_resources']);

gulp.task('pack_release', ['js_uglify', 'clean_css', 'resource_uglify']);

gulp.task('default', gulpSequence('pack_debug', 'pack_release'));

// 看守
gulp.task('watch', function() {

    // 看守所有位在 dist/  目录下的档案，一旦有更动，便进行重整
    //  gulp.watch([config.src+'/gulpWatch.json']).on('change', function(file) {
    //      console.log("改动");
    //  });
    gulp.watch('./src/**/*', ['default']);

});