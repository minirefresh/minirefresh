/*!
 * minirefresh v2.0.1
 * (c) 2017-2017 dailc
 * Released under the MIT License.
 * https://github.com/minirefresh/minirefresh
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.MiniRefresh = factory());
}(this, (function () { 'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BaseTheme = MiniRefreshTools.theme.defaults;
var version = MiniRefreshTools.version;
var extend = MiniRefreshTools.extend;
var namespace = MiniRefreshTools.namespace;

var defaultSetting = {
    down: {
        isLock: true
    },
    // 强行使用body滚动
    isUseBodyScroll: true
};

var MiniRefreshTheme = function (_BaseTheme) {
    _inherits(MiniRefreshTheme, _BaseTheme);

    function MiniRefreshTheme(options) {
        _classCallCheck(this, MiniRefreshTheme);

        var newOptions = extend(true, {}, defaultSetting, options);

        return _possibleConstructorReturn(this, (MiniRefreshTheme.__proto__ || Object.getPrototypeOf(MiniRefreshTheme)).call(this, newOptions));
    }

    /**
     * 重写下拉刷新初始化
     */


    _createClass(MiniRefreshTheme, [{
        key: '_initDownWrap',
        value: function _initDownWrap() {
            var _this2 = this;

            if (this.os.dd) {
                // 钉钉环境
                dd.ui.pullToRefresh.enable({
                    onSuccess: function onSuccess() {
                        _this2.options.down.callback && _this2.options.down.callback();
                    },
                    onFail: function onFail() {
                        dd.ui.pullToRefresh.stop();
                    }
                });
            } else if (this.os.ejs) {
                // ejs环境
                if (ejs.nativeUI) {
                    // 2.x
                    ejs.nativeUI.pullToRefresh.enable(function () {
                        _this2.options.down.callback && _this2.options.down.callback();
                    });
                } else if (ejs.ui) {
                    // 3.x
                    ejs.ui.pullToRefresh.enable({
                        success: function success() {
                            _this2.options.down.callback && _this2.options.down.callback();
                        },
                        error: function error() {
                            ejs.ui.pullToRefresh.stop();
                        }
                    });
                }
            }
        }
    }, {
        key: 'endDownLoading',
        value: function endDownLoading() {
            if (this.os.dd) {
                dd.ui.pullToRefresh.stop();
            } else if (this.os.ejs) {
                if (ejs.nativeUI) {
                    ejs.nativeUI.pullToRefresh.stop();
                } else {
                    ejs.ui.pullToRefresh.stop();
                }
            }

            // 同时恢复上拉加载的状态，注意，此时没有传isShowUpLoading，所以这个值不会生效
            if (this.options.down.isAutoResetUpLoading) {
                this.resetUpLoading();
            }
        }
        // 将所有下拉相关都重写

    }, {
        key: '_pullHook',
        value: function _pullHook() {}
    }, {
        key: '_downLoaingHook',
        value: function _downLoaingHook() {}
    }, {
        key: '_downLoaingSuccessHook',
        value: function _downLoaingSuccessHook() {}
    }, {
        key: '_downLoaingEndHook',
        value: function _downLoaingEndHook() {}
    }, {
        key: '_cancelLoaingHook',
        value: function _cancelLoaingHook() {}
    }, {
        key: '_lockDownLoadingHook',
        value: function _lockDownLoadingHook() {}
    }]);

    return MiniRefreshTheme;
}(BaseTheme);

MiniRefreshTheme.sign = 'native';
MiniRefreshTheme.version = version;
namespace('theme.natives', MiniRefreshTheme);

return MiniRefreshTheme;

})));
