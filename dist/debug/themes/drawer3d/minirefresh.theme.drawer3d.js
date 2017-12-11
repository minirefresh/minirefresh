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
var CLASS_THEME = 'minirefresh-theme-drawer3d';

/**
 * 一些常量
 * 默认高度是200
 * 其中背景默认是黑色，内容是白色，再增设阻尼系数可以较好的达到3D效果
 */
var DEFAULT_DOWN_HEIGHT = 200;
var DRAWER_FULL_DEGREE = 90;

var defaultSetting = {
    down: {
        offset: 100,
        // 阻尼系数，下拉的距离大于offset时,改变下拉区域高度比例;值越接近0,高度变化越小,表现为越往下越难拉
        dampRate: 0.2,
        bounceTime: 500,
        successAnim: {
            // successAnim
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

    _createClass(MiniRefreshTheme, [{
        key: '_initDownWrap',
        value: function _initDownWrap() {
            // 复用
            _get(MiniRefreshTheme.prototype.__proto__ || Object.getPrototypeOf(MiniRefreshTheme.prototype), '_initDownWrap', this).call(this);

            var container = this.container;
            var downWrap = this.downWrap;

            downWrap.innerHTML = ' \n            <div class="state-3d">\n                <div class="drawer3d">\n                    <div class="downwrap-content">\n                        <p class="downwrap-progress"></p>\n                        <p class="downwrap-tips">' + this.options.down.contentdown + '</p>\n                    </div>\n                    <div class="drawer3d-mask"></div>\n                </div>\n            </div>\n        ';

            // 由于直接继承的default，所以其实已经有default主题了，这里再加上本主题样式
            container.classList.add(CLASS_THEME);

            // 改写完后，对象需要重新查找
            this.downWrapProgress = downWrap.querySelector('.downwrap-progress');
            this.downWrapTips = downWrap.querySelector('.downwrap-tips');
            this.drawer = downWrap.querySelector('.drawer3d');
            this.drawerMask = downWrap.querySelector('.drawer3d-mask');

            // 留一个默认值，以免样式被覆盖，无法获取
            this.downWrapHeight = downWrap.offsetHeight || DEFAULT_DOWN_HEIGHT;
            // 由于downWrap被改变了，重新移动
            this._transformDownWrap(-this.downWrapHeight);
            this._resetDrawer();
        }
    }, {
        key: '_transformDownWrap',
        value: function _transformDownWrap(offset, duration) {
            _get(MiniRefreshTheme.prototype.__proto__ || Object.getPrototypeOf(MiniRefreshTheme.prototype), '_transformDownWrap', this).call(this, offset, duration);
        }
    }, {
        key: '_transformDrawer',
        value: function _transformDrawer() {
            var degree = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
            var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            var rotateStr = 'rotateX(' + degree + 'deg) rotateY(0deg)';
            var durationStr = duration + 'ms';

            // 一些3D相关属性写到了CSS中
            this.drawer.style.transform = rotateStr;
            this.drawer.style.webkitTransform = rotateStr;
            this.drawer.style.transitionDuration = durationStr;
            this.drawer.style.webkitTransitionDuration = durationStr;

            var opacity = degree / DRAWER_FULL_DEGREE;

            this.drawerMask.style.opacity = opacity;
            this.drawerMask.style.transitionDuration = durationStr;
            this.drawerMask.style.webkitTransitionDuration = durationStr;
        }

        /**
         * 重置抽屉，主要是旋转角度
         */

    }, {
        key: '_resetDrawer',
        value: function _resetDrawer() {
            this._transformDrawer(DRAWER_FULL_DEGREE, this.options.down.bounceTime);
        }

        /**
         * 重写下拉过程动画
         * @param {Number} downHight 当前下拉的高度
         * @param {Number} downOffset 下拉的阈值
         */

    }, {
        key: '_pullHook',
        value: function _pullHook(downHight, downOffset) {
            // 复用default的同名函数代码
            _get(MiniRefreshTheme.prototype.__proto__ || Object.getPrototypeOf(MiniRefreshTheme.prototype), '_pullHook', this).call(this, downHight, downOffset);

            var rate = downHight / downOffset;
            var degree = DRAWER_FULL_DEGREE * (1 - Math.min(rate, 1));

            this._transformDrawer(degree);
        }

        /**
         * 重写下拉动画
         */

    }, {
        key: '_downLoaingHook',
        value: function _downLoaingHook() {
            // loading中已经translate了
            _get(MiniRefreshTheme.prototype.__proto__ || Object.getPrototypeOf(MiniRefreshTheme.prototype), '_downLoaingHook', this).call(this);

            this._transformDrawer(0, this.options.down.bounceTime);
        }

        /**
         * 重写success 但是什么都不做
         */

    }, {
        key: '_downLoaingSuccessHook',
        value: function _downLoaingSuccessHook(isSuccess, successTips) {
            // 只改变状态
            _get(MiniRefreshTheme.prototype.__proto__ || Object.getPrototypeOf(MiniRefreshTheme.prototype), '_downLoaingSuccessHook', this).call(this, isSuccess, successTips);
        }

        /**
         * 重写下拉end
         * @param {Boolean} isSuccess 是否成功
         */

    }, {
        key: '_downLoaingEndHook',
        value: function _downLoaingEndHook(isSuccess) {
            _get(MiniRefreshTheme.prototype.__proto__ || Object.getPrototypeOf(MiniRefreshTheme.prototype), '_downLoaingEndHook', this).call(this, isSuccess);
            this._resetDrawer();
        }

        /**
         * 取消loading的回调
         */

    }, {
        key: '_cancelLoaingHook',
        value: function _cancelLoaingHook() {
            _get(MiniRefreshTheme.prototype.__proto__ || Object.getPrototypeOf(MiniRefreshTheme.prototype), '_cancelLoaingHook', this).call(this);
            this._resetDrawer();
        }
    }]);

    return MiniRefreshTheme;
}(BaseTheme);

MiniRefreshTheme.sign = 'drawer3d';
MiniRefreshTheme.version = version;
namespace('theme.drawer3d', MiniRefreshTheme);

return MiniRefreshTheme;

})));
