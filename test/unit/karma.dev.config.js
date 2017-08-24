var base = require('./karma.base.config.js');

module.exports = function(config) {

    config.set(Object.assign(base, {

        reporters: ['progress'],

        browsers: ['Chrome'],

        singleRun: false

    }));
};