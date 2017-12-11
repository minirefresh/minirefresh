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
var CLASS_THEME = 'minirefresh-theme-taobao';
var CLASS_DOWN_WRAP = 'minirefresh-downwrap';
var CLASS_HARDWARE_SPEEDUP = 'minirefresh-hardware-speedup';
var CLASS_ROTATE = 'minirefresh-rotate';
var CLASS_HIDDEN = 'minirefresh-hidden';

/**
 * 定义几个状态
 * 默认状态
 * 下拉刷新状态
 * 释放刷新状态
 * 准备进入秘密花园状态
 */
var STATE_PULL_DEFAULT = 0;
var STATE_PULL_DOWN = 1;
var STATE_PULL_READY_REFRESH = 2;
var STATE_PULL_READY_SECRETGARDEN = 3;

/**
 * 一些常量
 */
var DEFAULT_DOWN_HEIGHT = 800;

/**
 * 一些样式
 */
var CLASS_SECRET_GARDEN_BG_IN = 'secret-garden-bg-in';
var CLASS_SECRET_GARDEN_BG_OUT = 'secret-garden-bg-out';
var CLASS_SECRET_GARDEN_MOON_IN = 'secret-garden-moon-in';
var CLASS_SECRET_GARDEN_MOON_OUT = 'secret-garden-moon-out';
var CLASS_STATUS_DEFAULT = 'status-default';
var CLASS_STATUS_PULL = 'status-pull';
var CLASS_STATUS_LOADING = 'status-loading';
var CLASS_STATUS_SUCCESS = 'status-success';
var CLASS_STATUS_ERROR = 'status-error';

var defaultSetting = {
    down: {
        // 下拉100出现释放更新
        offset: 100,
        dampRate: 0.4,
        successAnim: {
            // successAnim
            isEnable: false
        },
        // 本主题独有的效果
        secretGarden: {
            // 是否开启秘密花园（即类似淘宝二楼效果）
            isEnable: true,
            // 下拉超过200后可以出现秘密花园效果，注意，必须大于down的offset
            offset: 200,
            // 提示文字
            tips: '欢迎光临秘密花园',
            inSecretGarden: null
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
            downWrap.innerHTML = ' \n            <div class="downwrap-bg"></div>\n            <div class="downwrap-moon"></div>\n            <div class="downwrap-content">\n                <p class="downwrap-progress"></p>\n                <p class="downwrap-tips">' + this.options.down.contentdown + '</p>\n            </div>\n        ';
            container.insertBefore(downWrap, contentWrap);

            // 由于直接继承的default，所以其实已经有default主题了，这里再加上本主题样式
            container.classList.add(CLASS_THEME);

            this.downWrap = downWrap;
            this.downWrapProgress = this.downWrap.querySelector('.downwrap-progress');
            this.downWrapTips = this.downWrap.querySelector('.downwrap-tips');
            // 进入秘密花园后有背景和月亮的动画
            this.downWrapBg = this.downWrap.querySelector('.downwrap-bg');
            this.downWrapMoon = this.downWrap.querySelector('.downwrap-moon');
            // 初始化为默认状态
            this.pullState = STATE_PULL_DEFAULT;
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
         * 旋转进度条
         * @param {Number} progress 对应需要选择的进度
         */

    }, {
        key: '_rotateDownProgress',
        value: function _rotateDownProgress(progress) {
            var rotateStr = 'rotate(' + progress + 'deg)';

            this.downWrapProgress.style.webkitTransform = rotateStr;
            this.downWrapProgress.style.transform = rotateStr;
        }

        /**
         * 重写下拉过程动画
         * @param {Number} downHight 当前下拉的高度
         * @param {Number} downOffset 下拉的阈值
         */

    }, {
        key: '_pullHook',
        value: function _pullHook(downHight, downOffset) {
            var options = this.options;
            var down = options.down;
            var secretGarden = down.secretGarden.isEnable;
            var secretGardenOffset = down.secretGarden.offset;
            var FULL_DEGREE = 360;
            var rate = downHight / downOffset;
            var progress = FULL_DEGREE * rate;

            this._transformDownWrap(-this.downWrapHeight + downHight);
            this._rotateDownProgress(progress);

            if (downHight < downOffset) {
                if (this.pullState !== STATE_PULL_DOWN) {
                    // tips-down中需要移除bg的动画样式，如果不移除， downWrapTips修改innerText修改后可能无法重新渲染
                    this.downWrapBg.classList.remove(CLASS_SECRET_GARDEN_BG_OUT);
                    this.downWrapMoon.classList.remove(CLASS_SECRET_GARDEN_MOON_OUT);

                    this.downWrapTips.classList.remove(CLASS_HIDDEN);
                    this.downWrapProgress.classList.remove(CLASS_HIDDEN);
                    this.downWrapTips.innerText = down.contentdown;
                    this.pullState = STATE_PULL_DOWN;
                    BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
                }
            } else if (downHight >= downOffset && (!secretGarden || downHight < secretGardenOffset)) {
                if (this.pullState !== STATE_PULL_READY_REFRESH) {
                    this.downWrapTips.classList.remove(CLASS_HIDDEN);
                    this.downWrapProgress.classList.remove(CLASS_HIDDEN);
                    this.downWrapTips.innerText = down.contentover;
                    this.pullState = STATE_PULL_READY_REFRESH;
                    BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_PULL);
                }
            } else if (this.pullState !== STATE_PULL_READY_SECRETGARDEN) {
                this.downWrapTips.classList.remove(CLASS_HIDDEN);
                this.downWrapProgress.classList.add(CLASS_HIDDEN);
                this.downWrapTips.innerText = down.secretGarden.tips;
                this.pullState = STATE_PULL_READY_SECRETGARDEN;
            }
        }

        /**
         * 因为有自定义秘密花园的动画，所以需要实现这个hook，在特定条件下去除默认行为
         * @return {Boolean} 返回false就不再进入下拉loading，默认为true
         */

    }, {
        key: '_beforeDownLoadingHook',
        value: function _beforeDownLoadingHook() {
            // 只要没有进入秘密花园，就仍然是以前的动作，否则downLoading都无法进入了，需要自定义实现
            if (this.pullState === STATE_PULL_READY_SECRETGARDEN) {
                this._inSecretGarden();

                return false;
            }

            return true;
        }

        /**
         * 重写下拉动画
         * 秘密花园状态下无法进入
         */

    }, {
        key: '_downLoaingHook',
        value: function _downLoaingHook() {
            this.downWrapTips.innerText = this.options.down.contentrefresh;
            this.downWrapProgress.classList.add(CLASS_ROTATE);
            // 默认和contentWrap的同步
            this._transformDownWrap(-this.downWrapHeight + this.options.down.offset, this.options.down.bounceTime);

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
            this.downWrapTips.innerText = this.options.down.contentdown;
            this.downWrapProgress.classList.remove(CLASS_ROTATE);
            // 默认和contentWrap的同步
            this._transformDownWrap(-this.downWrapHeight, this.options.down.bounceTime);
            // 需要重置回来
            this.pullState = STATE_PULL_DEFAULT;

            BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
        }

        /**
         * 取消loading的回调
         */

    }, {
        key: '_cancelLoaingHook',
        value: function _cancelLoaingHook() {
            // 默认和contentWrap的同步
            this._transformDownWrap(-this.downWrapHeight, this.options.down.bounceTime);
            this.pullState = STATE_PULL_DEFAULT;
            BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
        }

        /**
         * 秘密花园的动画
         * @param {Boolean} isInAnim 是否是进入
         */

    }, {
        key: '_secretGardenAnimation',
        value: function _secretGardenAnimation(isInAnim) {
            var bgAnimClassAdd = isInAnim ? CLASS_SECRET_GARDEN_BG_IN : CLASS_SECRET_GARDEN_BG_OUT;
            var bgAnimClassRemove = isInAnim ? CLASS_SECRET_GARDEN_BG_OUT : CLASS_SECRET_GARDEN_BG_IN;
            var moonAnimClassAdd = isInAnim ? CLASS_SECRET_GARDEN_MOON_IN : CLASS_SECRET_GARDEN_MOON_OUT;
            var moonAnimClassRemove = isInAnim ? CLASS_SECRET_GARDEN_MOON_OUT : CLASS_SECRET_GARDEN_MOON_IN;

            // 动画变为加载特定的css样式，这样便于外部修改
            this.downWrapBg.classList.remove(bgAnimClassRemove);
            this.downWrapBg.classList.add(bgAnimClassAdd);

            this.downWrapMoon.classList.remove(moonAnimClassRemove);
            this.downWrapMoon.classList.add(moonAnimClassAdd);
        }

        /**
         * 进入秘密花园
         * 在秘密花园状态下走入的是这个实现
         */

    }, {
        key: '_inSecretGarden',
        value: function _inSecretGarden() {
            var downBounceTime = this.options.down.bounceTime;
            var inSecretGardenCb = this.options.down.secretGarden.inSecretGarden;
            var docClientHeight = document.documentElement.clientHeight;

            this.downWrapTips.classList.add(CLASS_HIDDEN);
            // 动画
            this.scroller.translateContentWrap(docClientHeight, downBounceTime);
            this._transformDownWrap(docClientHeight - this.downWrapHeight, downBounceTime);
            this._secretGardenAnimation(true);
            inSecretGardenCb && inSecretGardenCb();
        }

        /**
         * 重置秘密花园
         */

    }, {
        key: 'resetSecretGarden',
        value: function resetSecretGarden() {
            var downBounceTime = this.options.down.bounceTime;

            // 重置scroll
            this.scroller.translateContentWrap(0, downBounceTime);
            // 重置动画区域的wrap
            this._transformDownWrap(-1 * this.downWrapHeight, downBounceTime);
            this._secretGardenAnimation(false);
            // 需要重置回来
            this.pullState = STATE_PULL_DEFAULT;
        }
    }]);

    return MiniRefreshTheme;
}(BaseTheme);

MiniRefreshTheme.sign = 'taobao';
MiniRefreshTheme.version = version;
namespace('theme.taobao', MiniRefreshTheme);

return MiniRefreshTheme;

})));
