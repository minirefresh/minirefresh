const base = require('./karma.base.config.js');

module.exports = function coverConfig(config) {
    config.set(Object.assign(base, {

        // progress karma-htmlfile-reporter
        // karma-html-detailed-reporter 如果作者修改了编码，可以考虑
        reporters: ['progress', 'html', 'coverage'],

        browsers: ['PhantomJS'],

        singleRun: true,

        htmlReporter: {
            outputFile: '_report/units.html',

            // Optional
            pageTitle: 'ejs Tests',
            subPageTitle: 'unit test',
            groupSuites: true,
            useCompactStyle: true,
            useLegacyStyle: true,
        },

        coverageReporter: {
            reporters: [
                // generates ./coverage/lcov.info
                {
                    type: 'lcovonly',
                    subdir: '.',
                    dir: '_coverage/',
                },
                {
                    type: 'json',
                    subdir: '.',
                    dir: '_coverage/',
                },
                // generates ./coverage/coverage-final.json
                {
                    type: 'html',
                    subdir: '.',
                    dir: '_coverage/',
                },
            ],
        },
    }));
};