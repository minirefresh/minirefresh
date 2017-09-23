const base = require('./karma.base.config.js');

module.exports = function watchConfig(config) {
    config.set(Object.assign(base, {

        reporters: ['progress'],

        browsers: ['Chrome', 'Firefox', 'Safari'],

        singleRun: true,

    }));
};