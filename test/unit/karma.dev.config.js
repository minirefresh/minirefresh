const base = require('./karma.base.config.js');

module.exports = function devConfig(config) {
    config.set(Object.assign(base, {

        reporters: ['progress'],
        
        // Chrome
        browsers: ['PhantomJS'],

        singleRun: false,

    }));
};