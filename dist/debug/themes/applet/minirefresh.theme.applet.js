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

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BaseTheme = MiniRefreshTools.theme.defaults;
var version = MiniRefreshTools.version;
var extend = MiniRefreshTools.extend;
var namespace = MiniRefreshTools.namespace;

/**
 * 一些默认提供的CSS类，一般来说不会变动（由框架提供的）
 * theme字段会根据不同的主题有不同值
 */
var CLASS_THEME = 'minirefresh-theme-applet';
var CLASS_DOWN_WRAP = 'minirefresh-downwrap';
var CLASS_HARDWARE_SPEEDUP = 'minirefresh-hardware-speedup';

/**
 * 本主题的特色样式
 */
var CLASS_DOWN_LOADING = 'loading-applet';
var CLASS_STATUS_DEFAULT = 'status-default';
var CLASS_STATUS_PULL = 'status-pull';
var CLASS_STATUS_LOADING = 'status-loading';
var CLASS_STATUS_SUCCESS = 'status-success';
var CLASS_STATUS_ERROR = 'status-error';

/**
 * 一些常量
 */
var DEFAULT_DOWN_HEIGHT = 50;

var defaultSetting = {
    down: {
        successAnim: {
            // 微信小程序没有successAnim 也没有文字提示
            isEnable: false
        },
        // 继承了default的downWrap部分代码，需要这个变量
        isWrapCssTranslate: true
    }
};

var MiniRefreshTheme = function (_BaseTheme) {
    _inherits(MiniRefreshTheme, _BaseTheme);

    function MiniRefreshTheme(options) {
        _classCallCheck(this, MiniRefreshTheme);

        var newOptions = extend(true, {}, defaultSetting, options);

        return _possibleConstructorReturn(this, (MiniRefreshTheme.__proto__ || Object.getPrototypeOf(MiniRefreshTheme)).call(this, newOptions));
    }

    /**
     * 重写下拉刷新初始化，变为小程序自己的动画
     */


    _createClass(MiniRefreshTheme, [{
        key: '_initDownWrap',
        value: function _initDownWrap() {
            var container = this.container;
            var contentWrap = this.contentWrap;
            var downWrap = document.createElement('div');

            downWrap.className = CLASS_DOWN_WRAP + ' ' + CLASS_HARDWARE_SPEEDUP;
            downWrap.innerHTML = ' \n            <div class="downwrap-content ball-beat">\n                <div class="dot"></div>\n                <div class="dot"></div>\n                <div class="dot"></div>\n            </div>\n        ';
            container.insertBefore(downWrap, contentWrap);

            // 由于直接继承的default，所以其实已经有default主题了，这里再加上本主题样式
            container.classList.add(CLASS_THEME);

            this.downWrap = downWrap;
            // 是否能下拉的变量，控制pull时的状态转变
            this.isCanPullDown = false;
            // 留一个默认值，以免样式被覆盖，无法获取
            this.downWrapHeight = this.downWrap.offsetHeight || DEFAULT_DOWN_HEIGHT;
            this._transformDownWrap(-1 * this.downWrapHeight);
            BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
        }
    }, {
        key: '_transformDownWrap',
        value: function _transformDownWrap(offset, duration) {
            _get(MiniRefreshTheme.prototype.__proto__ || Object.getPrototypeOf(MiniRefreshTheme.prototype), '_transformDownWrap', this).call(this, offset, duration);
        }

        /**
         * 重写下拉过程动画
         * @param {Number} downHight 当前下拉的高度
         * @param {Number} downOffset 下拉的阈值
         */

    }, {
        key: '_pullHook',
        value: function _pullHook(downHight, downOffset) {
            if (downHight < downOffset) {
                var rate = downHight / downOffset;
                var offset = this.downWrapHeight * (-1 + rate);

                this._transformDownWrap(offset);
                if (this.isCanPullDown) {
                    this.isCanPullDown = false;
                    BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
                }
            } else {
                this._transformDownWrap(0);
                if (!this.isCanPullDown) {
                    this.isCanPullDown = true;
                    BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_PULL);
                }
            }
        }

        /**
         * 重写下拉动画
         */

    }, {
        key: '_downLoaingHook',
        value: function _downLoaingHook() {
            this.downWrap.classList.add(CLASS_DOWN_LOADING);
            BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_LOADING);
        }

        /**
         * 重写success 但是什么都不做
         */

    }, {
        key: '_downLoaingSuccessHook',
        value: function _downLoaingSuccessHook(isSuccess) {
            // 只改变状态
            BaseTheme._changeWrapStatusClass(this.downWrap, isSuccess ? CLASS_STATUS_SUCCESS : CLASS_STATUS_ERROR);
        }

        /**
         * 重写下拉end
         */

    }, {
        key: '_downLoaingEndHook',
        value: function _downLoaingEndHook() {
            this.downWrap.classList.remove(CLASS_DOWN_LOADING);
            this._transformDownWrap(-1 * this.downWrapHeight, this.options.down.bounceTime);
            // 需要重置回来
            this.isCanPullDown = false;
            BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
        }

        /**
         * 取消loading的回调
         */

    }, {
        key: '_cancelLoaingHook',
        value: function _cancelLoaingHook() {
            this._transformDownWrap(-1 * this.downWrapHeight, this.options.down.bounceTime);
            BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
        }
    }]);

    return MiniRefreshTheme;
}(BaseTheme);

MiniRefreshTheme.sign = 'applet';
MiniRefreshTheme.version = version;
namespace('theme.applet', MiniRefreshTheme);

return MiniRefreshTheme;

})));
