(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

const fs = require('fs');
const path = require('path');
const rollup = require('rollup');
const pkg = require('../package.json');
const babel = require('rollup-plugin-babel');
const uglify = require('uglify-js');
const zlib = require('zlib');
const eslint = require('rollup-plugin-eslint');

const RELEASE_ROOT_PATH = 'dist';
const SOURCE_ROOT_PATH = 'src';
const RELEASE_FILE_NAME = pkg.name;
const SOURCE_ENTRY_FILE = `${SOURCE_ROOT_PATH}/index.js`;

if (!fs.existsSync(RELEASE_ROOT_PATH)) {
    fs.mkdirSync(RELEASE_ROOT_PATH);
}

if (!fs.existsSync('_tmp')) {
    fs.mkdirSync('_tmp');
}

function resolvePath(p) {
    return path.resolve(__dirname, '../', p);
}

const banner = ['/*!',
    ' * <%= pkg.name %> v<%= pkg.version %>',
    ' * (c) 2017-<%= date %> <%= pkg.author %>',
    ' * Released under the <%= pkg.license %> License.',
    ' * <%= pkg.homepage %>',
    ' */',
    '',
].join('\n').replace(/<%=\s([^%]+)\s%>/g, ($0, $1) => ($1 === 'date' ? new Date().getFullYear() : (pkg[$1.split('.')[1]] || '')));


const buildOptions = [{
    input: resolvePath(SOURCE_ENTRY_FILE),
    format: 'umd',
    output: {
        file: resolvePath(`${RELEASE_ROOT_PATH}/${RELEASE_FILE_NAME}.js`),
        // 输出文件的umd必须要，否则watch监控失败
        format: 'umd',
    },
    name: 'minirefresh',
    plugins: [
        // 请先使用eslint，因为要在为编译前检测
        eslint({
            exclude: [
                'node_modules/**',
            ],
        }),
        babel({
            // only transpile our source code            
            exclude: 'node_modules/**',
            // rollup使用"transform-runtime"只能通过配置
            // 可以将所有的垫片函数集成到一起，避免重复冗余
            runtimeHelpers: true,
            // 使用class时，external-helpers会莫名其妙引入asyncGenerator
            // 而runtime不会
            // plugins: ['external-helpers'],
        }),
    ],
    banner,
}, {
    input: resolvePath(SOURCE_ENTRY_FILE),
    format: 'umd',
    output: {
        file: resolvePath(`${RELEASE_ROOT_PATH}/${RELEASE_FILE_NAME}.min.js`),
        // 输出文件的umd必须要，否则watch监控失败
        format: 'umd',
    },
    name: 'minirefresh',
    plugins: [
        babel({
            // only transpile our source code
            exclude: 'node_modules/**',
            // rollup使用"transform-runtime"只能通过配置
            // 可以将所有的垫片函数集成到一起，避免重复冗余
            runtimeHelpers: true,
        }),
    ],
    banner,
}, {
    // build里的自动检测，输出到一个临时文件夹即可
    input: resolvePath('test/index.rollup.js'),
    format: 'umd',
    output: {
        file: resolvePath('_tmp/test.rollup.js'),
        // 输出文件的umd必须要，否则watch监控失败
        format: 'umd',
    },
    name: 'test',
    plugins: [
        eslint({}),
    ],
}, {
    // build里的自动检测，输出到一个临时文件夹即可
    input: resolvePath('build/index.rollup.js'),
    format: 'umd',
    output: {
        file: resolvePath('_tmp/build.rollup.js'),
        // 输出文件的umd必须要，否则watch监控失败
        format: 'umd',
    },
    name: 'build',
    plugins: [
        eslint({}),
    ],
}];

module.exports.buildOptions = buildOptions;

function getSize(code) {
    return `${(code.length / 1024).toFixed(2)}kb`;
}

function blue(str) {
    return `\x1b[1m\x1b[34m${str}\x1b[39m\x1b[22m`;
}

function logError(e) {
    console.log(e);
}

function write(dest, code, zip) {
    return new Promise((resolve, reject) => {
        function report(extra) {
            console.log(`${blue(path.relative(process.cwd(), dest))} ${getSize(code)}${extra || ''}`);
            resolve();
        }

        fs.writeFile(dest, code, (err) => {
            if (err) {
                return reject(err);
            }
            if (zip) {
                zlib.gzip(code, (err2, zipped) => {
                    if (err2) {
                        return reject(err2);
                    }
                    report(` (gzipped: ${getSize(zipped)})`);
                    
                    return resolve();
                });
            } else {
                report();
            }
            
            return resolve();
        });
    });
}

function buildEntry(config) {
    const dest = config.output.file;
    const isProd = /min\.js$/.test(dest);
    
    return rollup.rollup(config).then(bundle => bundle.generate(config)).then((res) => {
        if (isProd) {
            const minified = (config.banner ? config.banner : '') + uglify.minify(res.code, {
                output: {
                    ascii_only: true,
                },
                compress: {
                    pure_funcs: ['makeMap'],
                },
            }).code;
            
            return write(dest, minified, true);
        }
        return write(dest, res.code);
    }).catch(logError);
}


function walk(options) {
    let built = 0;
    const total = options.length;
    const next = () => {
        buildEntry(options[built]).then(() => {
            built += 1;
            if (built < total) {
                next();
            }
        }).catch(logError);
    };

    next();
}

walk(buildOptions);

module.exports.rebuild = () => {
    walk(buildOptions);
};

const rollup$1 = require('rollup');
const build = require('./build.js');

const buildOptions$1 = build.buildOptions;
const watcher = rollup$1.watch(buildOptions$1);

watcher.on('event', (event) => {
    // 监听内部自动会build，无需手动build
    // 如果无法自动build，很可能是传入配置错误
    // 譬如输出或输入文件的format没有填写
    console.log(`code${event.code}`);
});

/**
 * 仅仅用了rollup自动检测eslint
 */

})));
