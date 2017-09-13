/** 
 * 构建 MiniRefresh
 * MiniRefreshTools 是内部使用的
 * 外部主题会用 MiniRefresh变量
 */
(function(globalContext, factory) {
    'use strict';

    //  if (!globalContext.document) {
    //      throw new Error("minirefresh requires a window with a document");
    //  }
    
    // 不重复执行
    var moduleExports = globalContext.MiniRefreshTools || factory(globalContext);

    if (typeof module !== 'undefined' && module.exports) {
        // 导出一个默认对象
        module.exports = moduleExports;
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        // require模式默认导出整个工具类
        define(function() {
            return moduleExports;
        });
    }

    // 单独引入时暴露的是这个tools 
    globalContext.MiniRefreshTools = moduleExports;
})(typeof window !== 'undefined' ? window : global, function(globalContext, exports) {
    'use strict';

    exports = exports || {};

    /**
     * 模拟Class的基类,以便模拟Class进行继承等
     */
    (function() {
        // 同时声明多个变量,用,分开要好那么一点点
        var initializing = false,
            // 通过正则检查是否是函数
            fnTest = /xyz/.test(function() {
                'xyz';
            }) ? /\b_super\b/ : /.*/;
        var Clazz = function() {};

        // 很灵活的一种写法,直接重写Class的extend,模拟继承
        Clazz.extend = function(prop) {
            var _super = this.prototype;

            initializing = true;
            // 可以这样理解:这个prototype将this中的方法和属性全部都复制了一遍
            var prototype = new this();

            initializing = false;
            for (var name in prop) {
                if (!Object.prototype.hasOwnProperty.call(prop, name)) {
                    // 跳过原型上的
                    continue;
                }

                /**
                 * 这一些列操作逻辑并不简单，得清楚运算符优先级
                 * 逻辑与的优先级是高于三元条件运算符的,得注意下
                 * 只有继承的函数存在_super时才会触发(哪怕注释也一样进入)
                 * 所以梳理后其实一系列的操作就是判断是否父对象也有相同对象
                 * 如果有,则对应函数存在_super这个东西
                 */
                prototype[name] = typeof prop[name] === 'function' &&
                    typeof _super[name] === 'function' && fnTest.test(prop[name]) ?
                    (function(name, fn) {
                        return function() {
                            var tmp = this._super;

                            this._super = _super[name];

                            var ret = fn.apply(this, arguments);

                            this._super = tmp;

                            return ret;
                        };
                    })(name, prop[name]) :
                    prop[name];
            }

            /**
             * Clss的构造,默认会执行init方法
             */
            function Clazz() {
                if (!initializing && this.init) {
                    this.init.apply(this, arguments);
                }
            }
            Clazz.prototype = prototype;
            Clazz.prototype.constructor = Clazz;
            // 只会继承 extend静态属性，其它属性不会继承
            Clazz.extend = this.extend;

            return Clazz;
        };
        exports.Clazz = Clazz;
    })();

    exports.noop = function() {};

    exports.isFunction = function(obj) {
        return typeof obj === 'function';
    };

    exports.isObject = function(obj) {
        return typeof obj === 'object';
    };

    exports.isArray = Array.isArray ||
        function(object) {
            return object instanceof Array;
        };

    /**
     * 参数拓展
     * @param {type} deep 是否深复制
     * @param {type} target 需要拓展的目标对象
     * @param {type} source 其它需要拓展的源，会覆盖目标对象上的相同属性
     * @return {Object} 拓展后的对象
     */
    exports.extend = function() {
        var args = [].slice.call(arguments);

        // 目标
        var target = args[0] || {},
            // 默认source从1开始
            index = 1,
            len = args.length,
            // 默认非深复制
            deep = false;

        if (typeof target === 'boolean') {
            // 如果开启了深复制
            deep = target;
            target = args[index] || {};
            index++;
        }

        if (!exports.isObject(target)) {
            // 确保拓展的一定是object
            target = {};
        }

        for (; index < len; index++) {
            // source的拓展
            var source = args[index];

            if (source && exports.isObject(source)) {
                for (var name in source) {
                    if (!Object.prototype.hasOwnProperty.call(source, name)) {
                        // 防止原型上的数据
                        continue;
                    }

                    var src = target[name];
                    var copy = source[name];
                    var clone,
                        copyIsArray;

                    if (target === copy) {
                        // 防止环形引用
                        continue;
                    }

                    if (deep && copy && (exports.isObject(copy) || (copyIsArray = exports.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && exports.isArray(src) ? src : [];
                        } else {
                            clone = src && exports.isObject(src) ? src : {};
                        }

                        target[name] = exports.extend(deep, clone, copy);
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        return target;
    };

    /**
     * 选择这段代码用到的太多了，因此抽取封装出来
     * @param {Object} element dom元素或者selector
     * @return {HTMLElement} 返回选择的Dom对象，无果没有符合要求的，则返回null
     */
    exports.selector = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        return element;
    };
    
    /**
     * 获取DOM的可视区高度，兼容PC上的body高度获取
     * 因为在通过body获取时，在PC上会有CSS1Compat形式，所以需要兼容
     * @param {HTMLElement} dom 需要获取可视区高度的dom,对body对象有特殊的兼容方案
     * @return {Number} 返回最终的高度
     */
    exports.getClientHeightByDom = function(dom) {
        var height = dom.clientHeight;
        
        if (dom === document.body && document.compatMode === 'CSS1Compat') {
            // PC上body的可视区的特殊处理
            height = document.documentElement.clientHeight;
        }
        
        return height;
    };

    /**
     * 设置一个Util对象下的命名空间
     * @param {String} namespace 命名空间
     * @param {Object} obj 需要赋值的目标对象
     * @return {Object} 返回最终的对象
     */
    exports.namespace = function(namespace, obj) {
        var parent = globalContext.MiniRefreshTools;

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

    return exports;
});