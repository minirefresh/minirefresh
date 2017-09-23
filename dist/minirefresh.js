/*!
 * minirefresh v1.0.5
 * (c) 2017-2017 dailc
 * Released under the GPL-3.0 License.
 * https://github.com/minirefresh/minirefresh
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.minirefresh = factory());
}(this, (function () { 'use strict';

/**
 * 选择这段代码用到的太多了，因此抽取封装出来
 * @param {Object} element dom元素或者selector
 * @return {HTMLElement} 返回选择的Dom对象，无果没有符合要求的，则返回null
 */


/**
 * 获取DOM的可视区高度，兼容PC上的body高度获取
 * 因为在通过body获取时，在PC上会有CSS1Compat形式，所以需要兼容
 * @param {HTMLElement} dom 需要获取可视区高度的dom,对body对象有特殊的兼容方案
 * @return {Number} 返回最终的高度
 */


/**
 * 设置一个Util对象下的命名空间
 * @param {Object} parent 需要绑定到哪一个对象上
 * @param {String} namespace 需要绑定的命名空间名
 * @param {Object} target 需要绑定的目标对象
 * @return {Object} 返回最终的对象
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MiniRefresh =
/**
 * 构造函数
 * @param {Object} options 配置信息
 * @constructor
 */
function MiniRefresh(options) {
    _classCallCheck(this, MiniRefresh);

    this.options = options;
};

/**
 * 静态属性es6没有，需要es7
 * 因此es6手动绑定
 */


MiniRefresh.version = '3.0.0';

return MiniRefresh;

})));
