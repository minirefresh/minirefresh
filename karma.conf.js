// Karma configuration
// Generated on Fri Aug 11 2017 08:47:06 GMT+0800 (中国标准时间)

module.exports = function(config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['mocha'],

        // list of files / patterns to load in the browser
        files: [
            'test/**/*.spec.js'
        ],

        // list of files to exclude
        exclude: [
            '/node_modules/'
        ],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'test/**/*.spec.js': ['webpack'] //, 'coverage'
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        //  progress karma-htmlfile-reporter 
        // karma-html-detailed-reporter 如果作者修改了编码，可以考虑
        reporters: ['progress', 'html', 'coverage'],

        htmlReporter: {
            outputFile: '_report/units.html',

            // Optional 
            pageTitle: 'Unit Tests',
            subPageTitle: 'A sample project description',
            groupSuites: true,
            useCompactStyle: true,
            useLegacyStyle: true
        },

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['PhantomJS'], //  Chrome

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,

        coverageReporter: {
            type: 'html',
            dir: '_coverage/'
        },

        webpack: {
            module: {
                loaders: [{
                    test: /\.js$/,
                    exclude: [/node_modules/, __dirname + "xxx/xxx/lib"],
                    loader: "babel-loader"
                }]
            }
        }
    })
}