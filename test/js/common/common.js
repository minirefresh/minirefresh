/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/23 
 * 版本: [1.0, 2017/05/23 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 统一前端框架，统一Util文件
 */
"use strict";

window.Util = window.Util || (function(exports, undefined) {
    
    exports.version = '7.0.0';
    
    /**
     * 产生一个 唯一uuid，默认为32位的随机字符串，8-4-4-4-12 格式
     * @param {Object} options 配置参数
     * len 默认为32位，最大不能超过36，最小不能小于4
     * radix 随机的基数，如果小于等于10代表只用纯数字，最大为62，最小为2，默认为62
     * type 类别，默认为default代表 8-4-4-4-12的模式，如果为 noline代表不会有连线
     * @return {String} 返回一个随机性的唯一uuid
     */
    exports.uuid = function(options) {
        options = options || {};

        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''),
            uuid = [],
            i;
        var radix = options.radix || chars.length;
        var len = options.len || 32;
        var type = options.type || 'default';

        len = Math.min(len, 36);
        len = Math.max(len, 4);
        radix = Math.min(radix, 62);
        radix = Math.max(radix, 2);

        if (len) {
            for (i = 0; i < len; i++) {
                uuid[i] = chars[0 | Math.random() * radix];
            }

            if (type == 'default') {
                len > 23 && (uuid[23] = '-');
                len > 18 && (uuid[18] = '-');
                len > 13 && (uuid[13] = '-');
                len > 8 && (uuid[8] = '-');
            }
        }
        return uuid.join('');
    };
    /**
     * 为了减少代码量，直接使用ejs的源码实现
     * 3.x中工具类在 innerUtil上
     * 2.x中直接在 ejs上
     */
    var innerUtil = ejs.innerUtil || ejs;

    exports.noop = innerUtil.noop;
    /**
     * extend 合并多个对象，可以递归合并
     * @param {type} deep 是否递归合并
     * @param {type} target 最终返回的就是target
     * @param {type} source 从左到又，优先级依次提高，最右侧的是最后覆盖的
     * @returns {Object} 最终的合并对象
     */
    exports.extend = innerUtil.extend;
    exports.isFunction = innerUtil.isFunction;
    exports.isPlainObject = innerUtil.isPlainObject;
    exports.isArray = innerUtil.isArray;
    /**
     *  isWindow(需考虑obj为undefined的情况)
     */
    exports.isWindow = innerUtil.isWindow;
    exports.isObject = innerUtil.isObject;
    exports.type = innerUtil.type;
    /**
     * each遍历操作
     * @param {type} elements
     * @param {type} callback
     * @returns {global}
     */
    exports.each = innerUtil.each;

    /**
     * 选择这段代码用到的太多了，因此抽取封装出来
     * @param {Object} element dom元素或者selector
     */
    exports.selector = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        return element;
    };

    /**
     * 设置一个Util对象下的命名空间
     * @param {String} namespace
     * @param {Object} obj 需要赋值的目标对象
     */
    exports.namespace = function(namespace, obj) {
        // 永远不要试图修改arguments，请单独备份，否则在严格模式和非严格模式下容易出现错误
        var args = [].slice.call(arguments);
        var parent = window.Util;

        if (!namespace) {
            return parent;
        }

        var namespaceArr = namespace.split('.'),
            len = namespaceArr.length;

        for (var i = 0; i < len - 1; i++) {
            var tmp = namespaceArr[i];
            // 不存在的话要重新创建对象
            parent[tmp] = parent[tmp] || {};
            // parent要向下一级
            parent = parent[tmp];
        }
        parent[namespaceArr[len - 1]] = obj;

        return parent[namespaceArr[len - 1]];
    };
    /**
     * 获取这个模块下对应命名空间的对象
     * 如果不存在，则返回null，这个api只要是供内部获取接口数据时调用
     * @param {Object} module
     * @param {Array} namespace
     */
    exports.getNameSpaceObj = function(module, namespace) {
        if (!namespace) {
            return null;
        }
        var namespaceArr = namespace.split('.'),
            len = namespaceArr.length;
        for (var i = 0; i < len; i++) {
            module && (module = module[namespaceArr[i]]);
        }
        return module;
    };

    /**
     * 将string字符串转为html对象,默认创一个div填充
     * 因为很常用，所以单独提取出来了
     * @param {String} strHtml 目标字符串
     * @return {HTMLElement} 返回处理好后的html对象,如果字符串非法,返回null
     */
    exports.parseHtml = function(strHtml) {
        if (strHtml == null || typeof(strHtml) != "string") {
            return null;
        }
        // 创一个灵活的div
        var i, a = document.createElement("div");
        var b = document.createDocumentFragment();
        a.innerHTML = strHtml;
        while (i = a.firstChild) b.appendChild(i);
        return b;
    };

    /**
     * 通过传入key值,得到页面key的初始化传值
     * 实际情况是获取 window.location.href 中的参数的值
     * @param {String} key
     */
    exports.getExtraDataByKey = function(key) {
        if (!key) {
            return null;
        }
        //获取url中的参数值
        var getUrlParamsValue = function(url, paramName) {
            var paraString = url.substring(url.indexOf("?") + 1, url.length).split("&");
            var paraObj = {}
            var i, j;
            for (i = 0; j = paraString[i]; i++) {
                paraObj[j.substring(0, j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=") + 1, j.length);
            }
            var returnValue = paraObj[paramName.toLowerCase()];
            //需要解码浏览器编码
            returnValue = decodeURIComponent(returnValue);
            if (typeof(returnValue) == "undefined") {
                return undefined;
            } else {
                return returnValue;
            }
        };
        var value = getUrlParamsValue(window.location.href, key);
        if (value === 'undefined') {
            value = null;
        }
        return value;
    };

    /**
     * 兼容require
     */
    if (typeof module != 'undefined' && module.exports) {
        module.exports = exports;
    } else if (typeof define == 'function' && (define.amd || define.cmd)) {
        define(function() {
            return exports;
        });
    }

    return exports;
})({});