const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const gulpSequence = require('gulp-sequence');
const gulpUglify = require('gulp-uglify');
const gulpConcat = require('gulp-concat');
const gulpCleanCSS = require('gulp-clean-css');
const gulpEslint = require('gulp-eslint');
const gulpRename = require('gulp-rename');
const gulpHeader = require('gulp-header');
const gulpStylus = require('gulp-stylus');
const babel = require('rollup-plugin-babel');
const eslint = require('rollup-plugin-eslint');
const pkg = require('../package.json');
const walkByRollup = require('./rollupbuild').walk;

const banner = ['/*!',
    ' * <%= pkg.name %> v<%= pkg.version %>',
    ' * (c) 2017-<%= date %> <%= pkg.author %>',
    ' * Released under the <%= pkg.license %> License.',
    ' * <%= pkg.homepage %>',
    ' */',
    '',
].join('\n').replace(/<%=\s([^%]+)\s%>/g, ($0, $1) => ($1 === 'date' ? new Date().getFullYear() : (pkg[$1.split('.')[1]] || '')));

const RELEASE_ROOT_PATH = 'dist';
const RELEASE_DEBUG_PATH = 'dist/debug';
const RELEASE_PUBLIC_PATH = 'dist';
const SOURCE_ROOT_PATH = 'src';
const isSourceMap = false;

function resolvePath(p) {
    return path.resolve(__dirname, '../', p);
}

if (!fs.existsSync(resolvePath(RELEASE_ROOT_PATH))) {
    fs.mkdirSync(resolvePath(RELEASE_ROOT_PATH));
}

if (!fs.existsSync(resolvePath(RELEASE_DEBUG_PATH))) {
    fs.mkdirSync(resolvePath(RELEASE_DEBUG_PATH));
}

function buildByRollUp(input, output, name) {
    return walkByRollup([{
        input,
        plugins: [
            eslint({
                exclude: 'node_modules/**',
            }),
            babel({
                exclude: 'node_modules/**',
                // rollup使用"transform-runtime"只能通过配置
                // 可以将所有的垫片函数集成到一起，避免重复冗余
                runtimeHelpers: true,
                // 使用class时，external-helpers会莫名其妙引入asyncGenerator
                // 而runtime不会
                // plugins: ['external-helpers'],
            }),
        ],
        output: {
            file: output,
        },
        format: 'umd',
        name,
        banner,
        sourcemap: isSourceMap,
    }]);
}

gulp.task('build_main', () => buildByRollUp(
    resolvePath(`${SOURCE_ROOT_PATH}/index.js`),
    resolvePath(`${RELEASE_DEBUG_PATH}/minirefresh.js`),
    'MiniRefreshTools'));

gulp.task('build_themes', () => {
    const basePath = resolvePath(`${SOURCE_ROOT_PATH}/themes/`);
    const pa = fs.readdirSync(basePath);
    
    if (!fs.existsSync(resolvePath(`${RELEASE_DEBUG_PATH}/themes/`))) {
        fs.mkdirSync(resolvePath(`${RELEASE_DEBUG_PATH}/themes/`));
    }
    
    pa.forEach((ele) => {
        const info = fs.statSync(path.resolve(basePath, ele));
        
        if (info.isDirectory()) {
            // console.log(`dir:${ele}`);
            if (!fs.existsSync(resolvePath(`${RELEASE_DEBUG_PATH}/themes/${ele}`))) {
                fs.mkdirSync(resolvePath(`${RELEASE_DEBUG_PATH}/themes/${ele}`));
            }
            buildByRollUp(
                resolvePath(`${SOURCE_ROOT_PATH}/themes/${ele}/${ele}.js`),
                resolvePath(`${RELEASE_DEBUG_PATH}/themes/${ele}/minirefresh.theme.${ele}.js`),
                'MiniRefresh');
            // css
            gulp.src([
                resolvePath(`${SOURCE_ROOT_PATH}/themes/${ele}/${ele}.styl`),
            ])
                .pipe(gulpStylus())
                .pipe(gulpConcat(`minirefresh.theme.${ele}.css`))
                .pipe(gulp.dest(resolvePath(`${RELEASE_DEBUG_PATH}/themes/${ele}/`)));
           
            // 资源
            gulp.src([
                resolvePath(`${SOURCE_ROOT_PATH}/themes/${ele}/images/*`),
            ])
                .pipe(gulp.dest(resolvePath(`${RELEASE_DEBUG_PATH}/themes/${ele}/images/`)));
        }
    });
});

// eslint代码检查打包文件以外的文件
gulp.task('eslint_others', () => gulp.src([
    resolvePath('build/**/*.js'),
    resolvePath('test/**/*.js'),
    // 主动ignore
    `!${resolvePath('test/inner/promise.js')}`,
])
    .pipe(gulpEslint())
    .pipe(gulpEslint.format()));
// 开启后如果报错会退出
// .pipe(gulpEslint.failAfterError());

gulp.task('concat_css', () => gulp.src([
    resolvePath(`${SOURCE_ROOT_PATH}/styl/index.styl`),
])
    .pipe(gulpStylus())
    .pipe(gulpConcat('minirefresh.css'))
    .pipe(gulp.dest(resolvePath(RELEASE_DEBUG_PATH))));

// 打包 核心文件的资源css和资源的打包
gulp.task('pack_resources', () => gulp.src([
    resolvePath(`${SOURCE_ROOT_PATH}/styl/**/*`),
    '!PATH'.replace('PATH', resolvePath(`${SOURCE_ROOT_PATH}/**/*.styl`)),
    
])
    .pipe(gulp.dest(resolvePath(RELEASE_DEBUG_PATH))));


gulp.task('build', ['build_main', 'concat_css', 'pack_resources', 'build_themes', 'eslint_others']);

gulp.task('dist_js_uglify', () => gulp.src([
    resolvePath(`${RELEASE_DEBUG_PATH}/**/*.js`),
    '!PATH'.replace('PATH', resolvePath(`${RELEASE_DEBUG_PATH}/**/*.min.js`)),
])
    .pipe(gulpUglify())
    .on('error', (err) => {
        console.log('line number: %d, message: %s', err.lineNumber, err.message);
        this.end();
    })
    .pipe(gulpRename({
        suffix: '.min',
    }))
    .pipe(gulpHeader(banner))
    .pipe(gulp.dest(resolvePath(`${RELEASE_PUBLIC_PATH}/`))));

// 压缩core css
gulp.task('clean_css', () => gulp.src([
    resolvePath(`${RELEASE_DEBUG_PATH}/**/*.css`),
    '!PATH'.replace('PATH', resolvePath(`${RELEASE_DEBUG_PATH}/**/*.min.css`)),
])
    .pipe(gulpCleanCSS())
    .pipe(gulpRename({
        suffix: '.min',
    }))
    .pipe(gulp.dest(resolvePath(`${RELEASE_PUBLIC_PATH}/`))));

    
gulp.task('pack_resources_release', () => gulp.src([
    resolvePath(`${RELEASE_DEBUG_PATH}/**/*`),
    '!PATH'.replace('PATH', resolvePath(`${RELEASE_DEBUG_PATH}/**/*.css`)),
    '!PATH'.replace('PATH', resolvePath(`${RELEASE_DEBUG_PATH}/**/*.js`)),
])
    .pipe(gulp.dest(resolvePath(`${RELEASE_PUBLIC_PATH}/`))));

gulp.task('dist', [
    'pack_resources_release',
    'dist_js_uglify',
    'clean_css',
]);

gulp.task('concat_minirefresh_theme_js', () => gulp.src([
    resolvePath(`${RELEASE_DEBUG_PATH}/minirefresh.js`),
    resolvePath(`${RELEASE_DEBUG_PATH}/themes/default/minirefresh.theme.default.js`),
])
    .pipe(gulpConcat('minirefresh.js'))
    .pipe(gulp.dest(resolvePath(RELEASE_DEBUG_PATH))));
    
gulp.task('concat_minirefresh_theme_css', () => gulp.src([
    resolvePath(`${RELEASE_DEBUG_PATH}/minirefresh.css`),
    resolvePath(`${RELEASE_DEBUG_PATH}/themes/default/minirefresh.theme.default.css`),
])
    .pipe(gulpConcat('minirefresh.css'))
    .pipe(gulp.dest(resolvePath(RELEASE_DEBUG_PATH))));

/*
 * 合并主题方式暂时放弃，改为代码内部自动选择引入对应主题
 */
gulp.task('concat_theme', [
    'concat_minirefresh_theme_js',
    'concat_minirefresh_theme_css',
]);

gulp.task('default', (callback) => {
    gulpSequence('build', 'dist')(callback);
});

gulp.task('watch', () => {
    gulp.watch([
        resolvePath(`${SOURCE_ROOT_PATH}/**/**/*.js`),
        resolvePath(`${SOURCE_ROOT_PATH}/**/**/*.styl`),
        resolvePath('build/**/*.js'),
        resolvePath('test/**/*.js'),
    ], ['default']);
});