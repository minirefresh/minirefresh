// 引进 userName 和 key
var sauce = require('./sauce.json');
var base = require('./karma.base.config.js');

var batches = [
    // the cool kids
    {
        slChrome: {
            base: 'SauceLabs',
            browserName: 'chrome',
            platform: 'Windows 7'
        },
        slFirefox: {
            base: 'SauceLabs',
            browserName: 'firefox'
        },
        slMacSafari: {
            base: 'SauceLabs',
            browserName: 'safari',
            platform: 'OS X 10.10'
        }
    },
    // ie family
    {
        slEdge: {
            base: 'SauceLabs',
            browserName: 'MicrosoftEdge',
            platform: 'Windows 10'
        }
    },
    // mobile
    {
        slIosSafari9: {
            base: 'SauceLabs',
            browserName: 'iphone',
            // 目前最低为8.1
            version: '8.1'
        },
        slIosSafari10: {
            base: 'SauceLabs',
            browserName: 'iphone',
            version: '10.3'
        },
        slAndroid44: {
            base: 'SauceLabs',
            browserName: 'android',
            version: '4.4'
        },
        slAndroid60: {
            base: 'SauceLabs',
            browserName: 'android',
            version: '6.0'
        }
    }
];

module.exports = function(config) {
    // 将 SauceLabs 提供的 username 和 accesskey 放到环境变量中
    if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
        process.env.SAUCE_USERNAME = sauce.username;
        process.env.SAUCE_ACCESS_KEY = sauce.accesskey;
    }
    
    var batch = {};
    
    for (var i = 0, len = batches.length; i < len; i++) {
        batch = Object.assign(batch, batches[i]);
    }
    
    config.set(Object.assign(base, {

        reporters: ['progress', 'saucelabs'],

        sauceLabs: {
            // 测试结果是否公开，如果希望生成矩阵图，必须是 public
            public: 'public',
            testName: 'minirefresh tests',
            recordScreenshots: false,
            connectOptions: {
                // Ignore SSL error on Android emulator
                'no-ssl-bump-domains': 'all'
            },
            build: 'build-' + Date.now()
        },
        // mobile emulators are really slow
        captureTimeout: 300000,
        browserNoActivityTimeout: 300000,
        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: Object.keys(batch),
        customLaunchers: batch
    }));
};