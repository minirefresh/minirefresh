/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/22
 * 版本: [1.0, 2017/06/22 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 模拟Class的基类,以便模拟Class进行继承等
 */

(function(exports) {
    // 同时声明多个变量,用,分开要好那么一点点
    var initializing = false,
        // 通过正则检查是否是函数
        fnTest = /xyz/.test(function() {
            xyz;
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
            /**
             * 这一些列操作逻辑并不简单，得清楚运算符优先级
             * 逻辑与的优先级是高于三元条件运算符的,得注意下
             * 只有继承的函数存在_super时才会触发(哪怕注释也一样进入)
             * 所以梳理后其实一系列的操作就是判断是否父对象也有相同对象
             * 如果有,则对应函数存在_super这个东西
             */
            prototype[name] = typeof prop[name] == "function" &&
                typeof _super[name] == "function" && fnTest.test(prop[name]) ?
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
        /**
         * callee 的作用是返回当前执行函数的自身
         * 这里其实就是this.extend,不过严格模式下禁止使用
         * Clazz.extend = arguments.callee;
         * 替代callee 返回本身
         */
        Clazz.extend = this.extend;
        return Clazz;
    };
    exports.Clazz = Clazz;
})(Util);