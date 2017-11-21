module.exports = {

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../../',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],

    // list of files / patterns to load in the browser
    files: [
        'test/**/*.spec.js',
    ],

    // list of files to exclude
    exclude: [
        '/node_modules/',
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        // 'coverage'
        'test/**/*.spec.js': ['webpack'],
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR
    // || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    // logLevel: config.LOG_INFO,
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    //  Chrome
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    webpack: {
        module: {
            loaders: [{
                test: /\.js$/,
                exclude: [/node_modules/, `${__dirname}xxx/xxx/lib`],
                loader: 'babel-loader',
                query: {
                    // 为什么这个plugin放在代码中而不是配置文件中？
                    // 因为配置文件是给rollup使用的，如果加入这个放污染原本的打包文件
                    // 而这个webpack仅做单测用
                    plugins: [
                        'istanbul',
                    ],
                },
            }],
        },
    },
};