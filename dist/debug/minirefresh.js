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
/**
 * MiniRerefresh 处理滑动监听的关键代码，都是逻辑操作，没有UI实现
 * 依赖于一个 MiniRefresh对象
 */
(function(innerUtil) {

    /**
     * 每秒多少帧
     */
    var SECOND_MILLIONS = 1000,
        NUMBER_FRAMES = 60,
        PER_SECOND = SECOND_MILLIONS / NUMBER_FRAMES;

    /**
     * 定义一些常量
     */
    var EVENT_SCROLL = 'scroll',
        EVENT_PULL = 'pull',
        EVENT_UP_LOADING = 'upLoading',
        EVENT_RESET_UP_LOADING = 'resetUpLoading',
        EVENT_DOWN_LOADING = 'downLoading',
        EVENT_CANCEL_LOADING = 'cancelLoading',
        HOOK_BEFORE_DOWN_LOADING = 'beforeDownLoading';
        
    var os = {
        ios: navigator.userAgent.match(/(iPhone\sOS)\s([\d_]+)/) || navigator.userAgent.match(/(iPad).*OS\s([\d_]+)/)
    };

    var rAF = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        // 默认每秒60帧
        function(callback) {
            window.setTimeout(callback, PER_SECOND);
        };

    var MiniScroll = function(minirefresh) {
        this.minirefresh = minirefresh;
        this.container = minirefresh.container;
        this.contentWrap = minirefresh.contentWrap;
        this.scrollWrap = minirefresh.scrollWrap;
        this.options = minirefresh.options;
        // 默认没有事件，需要主动绑定
        this.events = {};
        // 默认没有hook
        this.hooks = {};

        // 锁定上拉和下拉,core内如果想改变，需要通过API调用设置
        this.isLockDown = false;
        this.isLockUp = false;

        // 是否使用了scrollto功能，使用这个功能时会禁止操作
        this.isScrollTo = false;
        // 上拉和下拉的状态
        this.upLoading = false;
        this.downLoading = false;

        // 默认up是没有finish的
        this.isFinishUp = false;

        this._initPullDown();
        this._initPullUp();

        var self = this;

        // 在初始化完毕后，下一个循环的开始再执行
        setTimeout(function() {
            if (self.options.down && self.options.down.isAuto && !self.isLockDown) {
                // 如果设置了auto，则自动下拉一次
                // 需要判断是否需要动画
                if (self.options.down.isAllowAutoLoading) {
                    self.triggerDownLoading();
                } else {
                    self.events[EVENT_DOWN_LOADING] && self.events[EVENT_DOWN_LOADING](true);
                }
            } else if (self.options.up && self.options.up.isAuto && !self.isLockUp) {
                // 如果设置了auto，则自动上拉一次
                self.triggerUpLoading();
            }
        });
    };

    MiniScroll.prototype.refreshOptions = function(options) {
        this.options = options;
    };

    /**
     * 对外暴露的，移动wrap的同时一起修改downHeight
     * @param {Number} y 移动的高度
     * @param {Number} duration 过渡时间
     */
    MiniScroll.prototype.translateContentWrap = function(y, duration) {
        this._translate(y, duration);
        this.downHight = y;
    };

    /**
     * wrap的translate动画，用于下拉刷新时进行transform动画
     * @param {Number} y 移动的高度
     * @param {Number} duration 过渡时间
     */
    MiniScroll.prototype._translate = function(y, duration) {
        if (!this.options.down.isScrollCssTranslate) {
            // 只有允许动画时才会scroll也translate,否则只会改变downHeight
            return;
        }
        y = y || 0;
        duration = duration || 0;

        var wrap = this.contentWrap;

        wrap.style.webkitTransitionDuration = duration + 'ms';
        wrap.style.transitionDuration = duration + 'ms';
        wrap.style.webkitTransform = 'translate(0px, ' + y + 'px) translateZ(0px)';
        wrap.style.transform = 'translate(0px, ' + y + 'px) translateZ(0px)';
    };

    MiniScroll.prototype._initPullDown = function() {
        var self = this,
            clientHeight = document.documentElement.clientHeight,
            // 考虑到options可以更新，所以缓存时请注意一定能最新
            scrollWrap = this.scrollWrap;

        scrollWrap.webkitTransitionTimingFunction = 'cubic-bezier(0.1, 0.57, 0.1, 1)';
        scrollWrap.transitionTimingFunction = 'cubic-bezier(0.1, 0.57, 0.1, 1)';

        var touchstartEvent = function(e) {
            if (self.isScrollTo) {
                // 如果执行滑动事件,则阻止touch事件,优先执行scrollTo方法
                e.preventDefault();
            }
            // 记录startTop, 并且只有startTop存在值时才允许move
            self.startTop = scrollWrap.scrollTop;

            // startY用来计算距离
            self.startY = e.touches ? e.touches[0].pageY : e.clientY;
            // X的作用是用来计算方向，如果是横向，则不进行动画处理，避免误操作
            self.startX = e.touches ? e.touches[0].pageX : e.clientX;
        };

        // 兼容手指滑动与鼠标
        scrollWrap.addEventListener('touchstart', touchstartEvent);
        scrollWrap.addEventListener('mousedown', touchstartEvent);

        var touchmoveEvent = function(e) {
            var options = self.options,
                isAllowDownloading = true;

            if (self.downLoading) {
                isAllowDownloading = false;
            } else if (!options.down.isAways && self.upLoading) {
                isAllowDownloading = false;
            }

            if (self.startTop !== undefined && self.startTop <= 0 &&
                (isAllowDownloading) && !self.isLockDown) {
                // 列表在顶部且不在加载中，并且没有锁住下拉动画

                // 当前第一个手指距离列表顶部的距离
                var curY = e.touches ? e.touches[0].pageY : e.clientY;
                var curX = e.touches ? e.touches[0].pageX : e.clientX;

                // 手指滑出屏幕触发刷新
                if (curY > clientHeight) {
                    touchendEvent(e);
                    return;
                }

                if (!self.preY) {
                    // 设置上次移动的距离，作用是用来计算滑动方向
                    self.preY = curY;
                }

                // 和上次比,移动的距离 (大于0向下,小于0向上)
                var diff = curY - self.preY;

                self.preY = curY;

                // 和起点比,移动的距离,大于0向下拉
                var moveY = curY - self.startY;
                var moveX = curX - self.startX;

                // 如果锁定横向滑动并且横向滑动更多，阻止默认事件
                if (options.isLockX && Math.abs(moveX) > Math.abs(moveY)) {
                    e.preventDefault();

                    return;
                }
                
                if (self.isBounce && os.ios) {
                    // 暂时iOS中去回弹
                    // 下一个版本中，分开成两种情况，一种是absolute的固定动画，一种是在scrollWrap内部跟随滚动的动画
                    return ;
                }

                if (moveY > 0) {
                    // 向下拉
                    self.isMoveDown = true;

                    // 阻止浏览器的默认滚动事件，因为这时候只需要执行动画即可
                    e.preventDefault();

                    if (!self.downHight) {
                        // 下拉区域的高度，用translate动画
                        self.downHight = 0;
                    }

                    var downOffset = options.down.offset,
                        dampRate = 1;

                    if (self.downHight < downOffset) {
                        // 下拉距离  < 指定距离
                        dampRate = options.down.dampRateBegin;
                    } else {
                        // 超出了指定距离，随时可以刷新
                        dampRate = options.down.dampRate;
                    }

                    if (diff > 0) {
                        // 需要加上阻尼系数
                        self.downHight += diff * dampRate;
                    } else {
                        // 向上收回高度,则向上滑多少收多少高度
                        self.downHight += diff;
                    }

                    self.events[EVENT_PULL] && self.events[EVENT_PULL](self.downHight, downOffset);
                    
                    // 执行动画
                    self._translate(self.downHight);
                } else {
                    self.isBounce = true;
                    // 解决嵌套问题。在嵌套有 IScroll，或类似的组件时，这段代码会生效，可以辅助滚动scrolltop
                    // 否则有可能在最开始滚不动
                    if (scrollWrap.scrollTop <= 0) {
                        scrollWrap.scrollTop += Math.abs(diff);
                    }
                }
            }

        };

        scrollWrap.addEventListener('touchmove', touchmoveEvent);
        scrollWrap.addEventListener('mousemove', touchmoveEvent);

        var touchendEvent = function(e) {
            var options = self.options;

            // 需要重置状态
            if (self.isMoveDown) {
                // 如果下拉区域已经执行动画,则需重置回来
                if (self.downHight >= options.down.offset) {
                    // 符合触发刷新的条件
                    self.triggerDownLoading();
                } else {
                    // 否则默认重置位置
                    self._translate(0, options.down.bounceTime);
                    self.downHight = 0;
                    self.events[EVENT_CANCEL_LOADING] && self.events[EVENT_CANCEL_LOADING]();
                }

                self.isMoveDown = false;
            }

            self.startY = 0;
            self.startX = 0;
            self.preY = 0;
            self.startTop = undefined;
            // 当前是否正处于回弹中，常用于iOS中判断，如果先上拉再下拉就处于回弹中（只要moveY为负）
            self.isBounce = false;
        };

        scrollWrap.addEventListener('touchend', touchendEvent);
        scrollWrap.addEventListener('touchcancel', touchendEvent);
        scrollWrap.addEventListener('mouseup', touchendEvent);
        scrollWrap.addEventListener('mouseleave', touchendEvent);

    };

    MiniScroll.prototype._initPullUp = function() {
        var self = this,
            scrollWrap = this.scrollWrap;

        // 如果是Body上的滑动，需要监听window的scroll
        var targetScrollDom = scrollWrap === document.body ? window : scrollWrap;

        targetScrollDom.addEventListener('scroll', function() {
            var scrollTop = scrollWrap.scrollTop,
                scrollHeight = scrollWrap.scrollHeight,
                clientHeight = innerUtil.getClientHeightByDom(scrollWrap),
                options = self.options;

            self.events[EVENT_SCROLL] && self.events[EVENT_SCROLL](scrollTop);

            if (!self.upLoading) {
                if (!self.isLockUp && !self.isFinishUp) {
                    var toBottom = scrollHeight - clientHeight - scrollTop;

                    if (toBottom <= options.up.offset) {
                        // 满足上拉加载
                        self.triggerUpLoading();
                    }
                }
            }
        });
    };

    MiniScroll.prototype._loadFull = function() {
        var self = this,
            scrollWrap = this.scrollWrap,
            options = this.options;

        setTimeout(function() {
            // 在下一个循环中运行
            if (!self.isLockUp && options.up.loadFull.isEnable && scrollWrap.scrollHeight <= innerUtil.getClientHeightByDom(scrollWrap)) {
                self.triggerUpLoading();
            }
        }, options.up.loadFull.delay || 0);
    };

    MiniScroll.prototype.triggerDownLoading = function() {
        var self = this,
            options = this.options,
            bounceTime = options.down.bounceTime;

        if (!this.hooks[HOOK_BEFORE_DOWN_LOADING] || this.hooks[HOOK_BEFORE_DOWN_LOADING](self.downHight, options.down.offset)) {
            // 没有hook或者hook返回true都通过，主要是为了方便类似于秘密花园等的自定义下拉刷新动画实现
            self.downLoading = true;
            self.downHight = options.down.offset;
            self._translate(self.downHight, bounceTime);

            self.events[EVENT_DOWN_LOADING] && self.events[EVENT_DOWN_LOADING]();
        }
    };

    /**
     * 结束下拉刷新动画
     * @param {Number} duration 回弹时间
     */
    MiniScroll.prototype.endDownLoading = function() {
        var self = this,
            options = this.options,
            bounceTime = options.down.bounceTime;

        if (this.downLoading) {

            // 必须是loading时才允许结束
            self._translate(0, bounceTime);
            self.downHight = 0;
            self.downLoading = false;
        }
    };

    MiniScroll.prototype.triggerUpLoading = function() {
        this.upLoading = true;
        this.events[EVENT_UP_LOADING] && this.events[EVENT_UP_LOADING]();
    };

    /**
     * 结束上拉加载动画
     * @param {Boolean} isFinishUp 是否结束上拉加载
     */
    MiniScroll.prototype.endUpLoading = function(isFinishUp) {
        if (this.upLoading) {

            this.upLoading = false;

            if (isFinishUp) {
                this.isFinishUp = true;
            } else {
                this._loadFull();
            }
        }
    };

    /**
     * 滚动到指定的y位置
     * @param {Number} y top坐标
     * @param {Number} duration 单位毫秒
     */
    MiniScroll.prototype.scrollTo = function(y, duration) {
        var self = this,
            scrollWrap = this.scrollWrap;

        y = y || 0;
        duration = duration || 0;

        // 最大可滚动的y
        var maxY = scrollWrap.scrollHeight - innerUtil.getClientHeightByDom(scrollWrap);

        y = Math.max(y, 0);
        y = Math.min(y, maxY);

        // 差值 (可能为负)
        var diff = scrollWrap.scrollTop - y;

        if (diff === 0) {
            return;
        }
        if (duration === 0) {
            scrollWrap.scrollTop = y;

            return;
        }

        // 每秒60帧，计算一共多少帧，然后每帧的步长
        var count = duration / PER_SECOND;
        var step = diff / (count),
            i = 0;

        // 锁定状态
        self.isScrollTo = true;

        var execute = function() {
            if (i < count) {
                if (i === count - 1) {
                    // 最后一次直接设置y,避免计算误差
                    scrollWrap.scrollTop = y;
                } else {
                    scrollWrap.scrollTop -= step;
                }
                i++;
                rAF(execute);
            } else {
                self.isScrollTo = false;
            }
        };

        rAF(execute);
    };

    /**
     * 只有 down存在时才允许解锁
     * @param {Boolean} isLock 是否锁定
     */
    MiniScroll.prototype.lockDown = function(isLock) {
        this.options.down && (this.isLockDown = isLock);
    };

    /**
     * 只有 up存在时才允许解锁
     * @param {Boolean} isLock 是否锁定
     */
    MiniScroll.prototype.lockUp = function(isLock) {
        this.options.up && (this.isLockUp = isLock);
    };

    MiniScroll.prototype.resetUpLoading = function() {
        if (this.isFinishUp) {
            this.isFinishUp = false;
        }
        
        // 检测是否需要加载满屏
        this._loadFull();
        
        this.events[EVENT_RESET_UP_LOADING] && this.events[EVENT_RESET_UP_LOADING]();
    };

    /**
     * 监听事件，包括下拉过程，下拉刷新，上拉加载，滑动等事件都可以监听到
     * @param {String} event 事件名，可选名称
     * scroll 容器滑动的持续回调，可以监听滑动位置
     * pull 下拉滑动过程的回调，持续回调
     * upLoading 上拉加载那一刻触发
     * downLoading 下拉刷新那一刻触发
     * @param {Function} callback 回调函数
     */
    MiniScroll.prototype.on = function(event, callback) {
        if (!event || !innerUtil.isFunction(callback)) {
            return;
        }
        this.events[event] = callback;
    };

    /**
     * 注册钩子函数，主要是一些自定义刷新动画时用到，如进入秘密花园
     * @param {String} hook 名称，范围如下
     * beforeDownLoading 是否准备downLoading，如果返回false，则不会loading，完全进入自定义动画
     * @param {Function} callback 回调函数
     */
    MiniScroll.prototype.hook = function(hook, callback) {
        if (!hook || !innerUtil.isFunction(callback)) {
            return;
        }
        this.hooks[hook] = callback;
    };

    innerUtil.Scroll = MiniScroll;
})(MiniRefreshTools);
/**
 * MiniRerefresh 的核心代码，代码中约定对外的API
 * 可以通过继承  MiniRefreshCore， 得到一个主题类，然后在主题类中实现UI hook函数可以达到不同的动画效果
 * 核心类内部没有任何UI实现，所有的UI都依赖于主题类
 * 
 * 以下是主题类可以实现的Hook（为undefined的话相当于忽略）
 * _initHook(isLockDown, isLockUp)              初始化时的回调
 * _refreshHook(isLockDown, isLockUp)           刷新options时的回调
 * _pullHook(downHight, downOffset)             下拉过程中持续回调
 * _scrollHook(scrollTop)                       滚动过程中持续回调
 * _downLoaingHook()                            下拉触发的那一刻回调
 * _downLoaingSuccessHook(isSuccess)            下拉刷新的成功动画，处理成功或失败提示
 * _downLoaingEndHook(isSuccess)                下拉刷新动画结束后的回调
 * _cancelLoaingHook()                          取消loading的回调
 * _upLoaingHook()                              上拉触发的那一刻回调
 * _upLoaingEndHook(isFinishUp)                 上拉加载动画结束后的回调
 * _resetUpLoadingHook()                         重置上拉状态，变为又可继续上拉
 * __lockUpLoadingHook(isLock)                  锁定上拉时的回调
 * __lockDownLoadingHook(isLock)                锁定下拉时的回调
 * 
 * _beforeDownLoadingHook(downHight, downOffset)一个特殊的hook，返回false时代表不会走入下拉刷新loading，完全自定义实现动画，默认为返回true
 */
(function(innerUtil) {

    var defaultSetting = {
        // 下拉有关
        down: {
            // 默认没有锁定，可以通过API动态设置
            isLock: false,
            // 是否自动下拉刷新
            isAuto: false,
            // 设置isAuto=true时生效，是否在初始化的下拉刷新触发事件中显示动画，如果是false，初始化的加载只会触发回调，不会触发动画
            isAllowAutoLoading: true,
            // 是否不管任何情况下都能触发下拉刷新，为false的话当上拉时不会触发下拉
            isAways: false,
            // 是否scroll在下拉时会进行css移动，通过关闭它可以实现自定义动画
            isScrollCssTranslate: true,
            // 下拉要大于多少长度后再下拉刷新
            offset: 75,
            // 阻尼系数，下拉小于offset时的阻尼系数，值越接近0,高度变化越小,表现为越往下越难拉
            dampRateBegin: 1,
            // 阻尼系数，下拉的距离大于offset时,改变下拉区域高度比例;值越接近0,高度变化越小,表现为越往下越难拉
            dampRate: 0.3,
            // 回弹动画时间
            bounceTime: 300,
            successAnim: {
                // 下拉刷新结束后是否有成功动画，默认为false，如果想要有成功刷新xxx条数据这种操作，请设为true，并实现对应hook函数
                isEnable: false,
                duration: 300
            },
            // 下拉时会提供回调，默认为null不会执行
            onPull: null,
            // 取消时回调
            onCalcel: null,
            callback: innerUtil.noop
        },
        // 上拉有关
        up: {
            // 默认没有锁定，可以通过API动态设置
            isLock: false,
            // 是否自动上拉加载-初始化是是否自动
            isAuto: true,
            // 是否默认显示上拉进度条，可以通过API改变
            isShowUpLoading: true,
            // 距离底部高度(到达该高度即触发)
            offset: 100,
            loadFull: {
                // 开启配置后，只要没满屏幕，就会自动加载
                isEnable: true,
                delay: 300
            },
            // 滚动时会提供回调，默认为null不会执行
            onScroll: null,
            callback: innerUtil.noop
        },
        // 容器
        container: '#minirefresh',
        // 是否锁定横向滑动，如果锁定则原生滚动条无法滑动
        isLockX: true,
        // 是否使用body对象的scroll而不是minirefresh-scroll对象的scroll
        // 开启后一个页面只能有一个下拉刷新，否则会有冲突
        isUseBodyScroll: false
    };

    var MiniRefreshCore = innerUtil.Clazz.extend({

        /**
         * 初始化
         * @param {Object} options 配置信息
         */
        init: function(options) {
            options = innerUtil.extend(true, {}, defaultSetting, options);

            this.container = innerUtil.selector(options.container);
            // scroll的dom-wrapper下的第一个节点，作用是down动画时的操作
            this.contentWrap = this.container.children[0];
            // 默认是整个container进行滑动
            // 但是为了兼容body的滚动，拆分为两个对象方便处理
            // 如果是使用body的情况，scrollWrap恒为body
            // 注意，滑动不是指下拉时的translate（这时候时contentWrap），而是只默认的原生滑动
            this.scrollWrap = options.isUseBodyScroll ? document.body : this.container;
            
            this.options = options;
            
            // 初始化的hook
            this._initHook && this._initHook(this.options.down.isLock, this.options.up.isLock);

            // 生成一个Scroll对象 ，对象内部处理滑动监听
            this.scroller = new innerUtil.Scroll(this);
           
            this._initEvent();

            // 如果初始化时锁定了，需要触发锁定，避免没有锁定时解锁（会触发逻辑bug）
            options.up.isLock && this._lockUpLoading(options.up.isLock);
            options.down.isLock && this._lockDownLoading(options.down.isLock);
        },
        _resetOptions: function() {
            var options = this.options;

            this._lockUpLoading(options.up.isLock);
            this._lockDownLoading(options.down.isLock);
        },
        _initEvent: function() {
            var self = this,
                options = self.options;

            this.scroller.on('downLoading', function(isHideLoading) {
                !isHideLoading && self._downLoaingHook && self._downLoaingHook();
                options.down.callback && options.down.callback();
            });

            this.scroller.on('cancelLoading', function() {
                self._cancelLoaingHook && self._cancelLoaingHook();
                options.down.onCalcel && options.down.onCalcel();
            });

            this.scroller.on('upLoading', function() {
                self._upLoaingHook && self._upLoaingHook(self.options.up.isShowUpLoading);
                options.up.callback && options.up.callback();
            });
            
            this.scroller.on('resetUpLoading', function() {
                self._resetUpLoadingHook && self._resetUpLoadingHook();
            });

            this.scroller.on('pull', function(downHight, downOffset) {
                self._pullHook && self._pullHook(downHight, downOffset);
                options.down.onPull && options.down.onPull(downHight, downOffset);
            });

            this.scroller.on('scroll', function(scrollTop) {
                self._scrollHook && self._scrollHook(scrollTop);
                options.up.onScroll && options.up.onScroll(scrollTop);
            });

            // 检查是否允许普通的加载中，如果返回false，就代表自定义下拉刷新，通常自己处理
            this.scroller.hook('beforeDownLoading', function(downHight, downOffset) {
                return !self._beforeDownLoadingHook || self._beforeDownLoadingHook(downHight, downOffset);
            });
        },

        /**
         * 内部执行，结束下拉刷新
         * @param {Boolean} isSuccess 是否下拉请求成功
         * @param {String} successTips 需要更新的成功提示
         * 在开启了成功动画时，往往成功的提示是需要由外传入动态更新的，譬如  update 10 news
         */
        _endDownLoading: function(isSuccess, successTips) {
            var self = this;

            if (!this.options.down) {
                // 防止没传down导致错误
                return;
            }

            if (this.scroller.downLoading) {
                // 必须是loading时才允许执行对应hook
                var successAnim = this.options.down.successAnim.isEnable,
                    successAnimTime = this.options.down.successAnim.duration;

                if (successAnim) {
                    // 如果有成功动画    
                    this._downLoaingSuccessHook && this._downLoaingSuccessHook(isSuccess, successTips);
                } else {
                    // 默认为没有成功动画
                    successAnimTime = 0;
                }

                setTimeout(function() {
                    // 成功动画结束后就可以重置位置了
                    self.scroller.endDownLoading();
                    // 触发结束hook
                    self._downLoaingEndHook && self._downLoaingEndHook(isSuccess);

                }, successAnimTime);
            }
        },

        /**
         * 内部执行，结束上拉加载
         * @param {Boolean} isFinishUp 是否结束了上拉加载
         */
        _endUpLoading: function(isFinishUp) {
            if (this.scroller.upLoading) {
                this.scroller.endUpLoading(isFinishUp);
                this._upLoaingEndHook && this._upLoaingEndHook(isFinishUp);
            }
        },

        /**
         * 重新刷新上拉加载，刷新后会变为可以上拉加载
         */
        _resetUpLoading: function() {
            this.scroller.resetUpLoading();
        },

        /**
         * 锁定上拉加载
         * 将开启和禁止合并成一个锁定API
         * @param {Boolean} isLock 是否锁定
         */
        _lockUpLoading: function(isLock) {
            this.scroller.lockUp(isLock);
            this._lockUpLoadingHook && this._lockUpLoadingHook(isLock);
        },

        /**
         * 锁定下拉刷新
         * @param {Boolean} isLock 是否锁定
         */
        _lockDownLoading: function(isLock) {
            this.scroller.lockDown(isLock);
            this._lockDownLoadingHook && this._lockDownLoadingHook(isLock);
        },

        /**
         * 刷新minirefresh的配置，关键性的配置请不要更新，如容器，回调等
         * @param {Object} options 新的配置，会覆盖原有的
         */
        refreshOptions: function(options) {
            this.options = innerUtil.extend(true, {}, this.options, options);
            this.scroller.refreshOptions(this.options);
            this._resetOptions(options);
            this._refreshHook && this._refreshHook();
        },

        /**
         * 结束下拉刷新
         * @param {Boolean} isSuccess 是否请求成功，这个状态会中转给对应主题
         * @param {String} successTips 需要更新的成功提示
         * 在开启了成功动画时，往往成功的提示是需要由外传入动态更新的，譬如  update 10 news
         */
        endDownLoading: function(isSuccess, successTips) {
            typeof isSuccess !== 'boolean' && (isSuccess = true);
            this._endDownLoading(isSuccess, successTips);
            // 同时恢复上拉加载的状态，注意，此时没有传isShowUpLoading，所以这个值不会生效
            this._resetUpLoading();
        },
        
        /**
         * 重置上拉加载状态,如果是没有更多数据后重置，会变为可以继续上拉加载
         */
        resetUpLoading: function() {
            this._resetUpLoading();
        },

        /**
         * 结束上拉加载
         * @param {Boolean} isFinishUp 是否结束上拉加载，如果结束，就相当于变为了没有更多数据，无法再出发上拉加载了
         * 结束后必须reset才能重新开启
         */
        endUpLoading: function(isFinishUp) {
            this._endUpLoading(isFinishUp);
        },

        /**
         * 触发上拉加载
         */
        triggerUpLoading: function() {
            this.scroller.triggerUpLoading();
        },

        /**
         * 触发下拉刷新
         */
        triggerDownLoading: function() {
            this.scroller.scrollTo(0);
            this.scroller.triggerDownLoading();
        },

        /**
         * 滚动到指定的y位置
         * @param {Number} y 需要滑动到的top值
         * @param {Number} duration 单位毫秒
         */
        scrollTo: function(y, duration) {
            this.scroller.scrollTo(y, duration);
        },
        
        /**
         * 获取当前的滚动位置
         * @return {Number} 返回当前的滚动位置
         */
        getPosition: function() {
            return this.scrollWrap.scrollTop;
        }
    });

    innerUtil.core = MiniRefreshCore;
})(MiniRefreshTools);
/**
 * minirefresh的默认主题
 * 默认主题会打包到核心代码中
 * 主题类继承自基类，所以可以调用基类的属性（但是不建议滥用）
 * 拓展其它主题有两种方案：
 * 1. 直接继承自default，会默认拥有default的属性，只需要覆盖自定义功能即可（注意必须覆盖，否则会调用dwfault的默认操作）
 * 2. 和default一样，继承自 innerUtil.core，这样会与default无关，所以的一切UI都必须自己实现（可以参考default去实现）
 * 
 * 一般，在进行一些小修改时，建议继承自default（这样toTop，上拉加载大部分代码都可复用）
 * 在进行大修改时，建议继承自innerUtil.core，这样可以干干净净的重写主题
 */
(function(innerUtil, globalContext) {

    /**
     * 一些默认提供的CSS类，一般来说不会变动（由框架提供的）
     * THEME 字段会根据不同的主题有不同值
     * 在使用body的scroll时，需要加上样式 CLASS_BODY_SCROLL_WRAP
     */
    var CLASS_THEME = 'minirefresh-theme-default';
    var CLASS_DOWN_WRAP = 'minirefresh-downwrap';
    var CLASS_UP_WRAP = 'minirefresh-upwrap';
    var CLASS_FADE_IN = 'minirefresh-fade-in';
    var CLASS_FADE_OUT = 'minirefresh-fade-out';
    var CLASS_TO_TOP = 'minirefresh-totop';
    var CLASS_ROTATE = 'minirefresh-rotate';
    var CLASS_HARDWARE_SPEEDUP = 'minirefresh-hardware-speedup';
    var CLASS_HIDDEN = 'minirefresh-hidden';
    var CLASS_BODY_SCROLL_WRAP = 'body-scroll-wrap';

    /**
     * 本主题的特色样式
     */
    var CLASS_DOWN_SUCCESS = 'downwrap-success';
    var CLASS_DOWN_ERROR = 'downwrap-error';
    
    /**
     * 一些常量
     */
    var DEFAULT_DOWN_HEIGHT = 75;

    var defaultSetting = {
        down: {
            successAnim: {
                // 下拉刷新结束后是否有成功动画，默认为false，如果想要有成功刷新xxx条数据这种操作，请设为true，并实现对应hook函数
                isEnable: false,
                duration: 300
            },
            // 可选，在下拉可刷新状态时，下拉刷新控件上显示的标题内容
            contentdown: '下拉刷新',
            // 可选，在释放可刷新状态时，下拉刷新控件上显示的标题内容
            contentover: '释放刷新',
            // 可选，正在刷新状态时，下拉刷新控件上显示的标题内容
            contentrefresh: '加载中...',
            // 可选，刷新成功的提示，当开启successAnim时才有效
            contentsuccess: '刷新成功',
            // 可选，刷新失败的提示，错误回调用到，当开启successAnim时才有效
            contenterror: '刷新失败',
            // 是否默认跟随进行css动画
            isWrapCssTranslate: false
        },
        up: {
            toTop: {
                // 是否开启点击回到顶部
                isEnable: true,
                duration: 300,
                // 滚动多少距离才显示toTop
                offset: 800
            },
            // 默认为空，可以自行改为 上拉显示更多 等
            contentdown: '',
            contentrefresh: '加载中...',
            contentnomore: '没有更多数据了'
        }
    };

    var MiniRefreshTheme = innerUtil.core.extend({
        init: function(options) {
            // 拓展自定义的配置
            options = innerUtil.extend(true, {}, defaultSetting, options);
            this._super(options);
        },
        _initHook: function(isLockDown, isLockUp) {
            var container = this.container,
                contentWrap = this.contentWrap;

            container.classList.add(CLASS_THEME);
            // 加上硬件加速让动画更流畅
            contentWrap.classList.add(CLASS_HARDWARE_SPEEDUP);
            
            if (this.options.isUseBodyScroll) {
                // 如果使用了body的scroll，需要增加对应的样式，否则默认的absolute无法被监听到
                container.classList.add(CLASS_BODY_SCROLL_WRAP);
                contentWrap.classList.add(CLASS_BODY_SCROLL_WRAP);
            }

            this._initDownWrap();
            this._initUpWrap();
            this._initToTop();
        },
        
        /**
         * 刷新的实现，需要根据新配置进行一些更改
         */
        _refreshHook: function() {
            // 如果开关csstranslate，需要兼容
            if (this.options.down.isWrapCssTranslate) {
                this._transformDownWrap(-this.downWrapHeight);
            } else {
                this._transformDownWrap(0, 0, true);
            }
            
            // toTop的显影控制，如果本身显示了，又更新为隐藏，需要马上隐藏
            if (!this.options.up.toTop.isEnable) {
                this.toTopBtn && this.toTopBtn.classList.add(CLASS_HIDDEN);
                this.isShowToTopBtn = false;
            }
        },
        _initDownWrap: function() {
            var container = this.container,
                contentWrap = this.contentWrap,
                options = this.options;

            // 下拉的区域
            var downWrap = document.createElement('div');

            downWrap.className = CLASS_DOWN_WRAP + ' ' + CLASS_HARDWARE_SPEEDUP;
            downWrap.innerHTML = '<div class="downwrap-content"><p class="downwrap-progress"></p><p class="downwrap-tips">' + options.down.contentdown + ' </p></div>';
            container.insertBefore(downWrap, contentWrap);

            this.downWrap = downWrap;
            this.downWrapProgress = this.downWrap.querySelector('.downwrap-progress');
            this.downWrapTips = this.downWrap.querySelector('.downwrap-tips');
            // 是否能下拉的变量，控制pull时的状态转变
            this.isCanPullDown = false;
            
            this.downWrapHeight = downWrap.offsetHeight || DEFAULT_DOWN_HEIGHT;
            this._transformDownWrap(-this.downWrapHeight);
        },
        _transformDownWrap: function(offset, duration, isForce) {
            if (!isForce && !this.options.down.isWrapCssTranslate) {
                return ;
            }
            offset = offset || 0;
            duration = duration || 0;
            // 记得动画时 translateZ 否则硬件加速会被覆盖
            this.downWrap.style.webkitTransitionDuration = duration + 'ms';
            this.downWrap.style.transitionDuration = duration + 'ms';
            this.downWrap.style.webkitTransform = 'translateY(' + offset + 'px)  translateZ(0px)';
            this.downWrap.style.transform = 'translateY(' + offset + 'px)  translateZ(0px)';
        },
        
        _initUpWrap: function() {
            var contentWrap = this.contentWrap,
                options = this.options;
            
            // 上拉区域
            var upWrap = document.createElement('div');

            upWrap.className = CLASS_UP_WRAP + ' ' + CLASS_HARDWARE_SPEEDUP;
            upWrap.innerHTML = '<p class="upwrap-progress"></p><p class="upwrap-tips">' + options.up.contentdown + '</p>';
            upWrap.style.visibility = 'hidden';
            // 加到container中
            contentWrap.appendChild(upWrap);

            this.upWrap = upWrap;
            this.upWrapProgress = this.upWrap.querySelector('.upwrap-progress');
            this.upWrapTips = this.upWrap.querySelector('.upwrap-tips');
        },
        
        /**
         * 自定义实现一个toTop，由于这个是属于额外的事件所以没有添加的核心中，而是由各自的主题决定是否实现或者实现成什么样子
         * 不过框架中仍然提供了一个默认的minirefresh-totop样式，可以方便使用
         */
        _initToTop: function() {
            var self = this,
                options = this.options,
                toTop = options.up.toTop.isEnable,
                duration = options.up.toTop.duration;

            if (toTop) {
                var toTopBtn = document.createElement('div');

                toTopBtn.className = CLASS_TO_TOP + ' ' + CLASS_THEME;

                toTopBtn.onclick = function() {
                    self.scroller.scrollTo(0, duration);
                };
                toTopBtn.classList.add(CLASS_HIDDEN);
                this.toTopBtn = toTopBtn;
                this.isShowToTopBtn = false;
                // 默认添加到body中防止冲突
                document.body.appendChild(toTopBtn);
            }
        },
        _pullHook: function(downHight, downOffset) {
            var options = this.options,
                FULL_DEGREE = 360;

            if (downHight < downOffset) {
                if (this.isCanPullDown) {
                    this.downWrapTips.innerText = options.down.contentdown;
                    this.isCanPullDown = false;
                }
            } else {
                if (!this.isCanPullDown) {
                    this.downWrapTips.innerText = options.down.contentover;
                    this.isCanPullDown = true;
                }
            }

            var rate = downHight / downOffset,
                progress = FULL_DEGREE * rate;

            this.downWrapProgress.style.webkitTransform = 'rotate(' + progress + 'deg)';
            this.downWrapProgress.style.transform = 'rotate(' + progress + 'deg)';
            this._transformDownWrap(-this.downWrapHeight + downHight);
        },
        _scrollHook: function(scrollTop) {
            // 用来判断toTop
            var options = this.options,
                toTop = options.up.toTop.isEnable,
                toTopBtn = this.toTopBtn;

            if (toTop && toTopBtn) {
                if (scrollTop >= options.up.toTop.offset) {
                    if (!this.isShowToTopBtn) {
                        toTopBtn.classList.remove(CLASS_FADE_OUT);
                        toTopBtn.classList.remove(CLASS_HIDDEN);
                        toTopBtn.classList.add(CLASS_FADE_IN);
                        this.isShowToTopBtn = true;
                    }
                } else {
                    if (this.isShowToTopBtn) {
                        toTopBtn.classList.add(CLASS_FADE_OUT);
                        toTopBtn.classList.remove(CLASS_FADE_IN);
                        this.isShowToTopBtn = false;
                    }
                }
            }
        },
        _downLoaingHook: function() {
            // 默认和contentWrap的同步
            this._transformDownWrap(-this.downWrapHeight + this.options.down.offset, this.options.down.bounceTime);
            this.downWrapTips.innerText = this.options.down.contentrefresh;
            this.downWrapProgress.classList.add(CLASS_ROTATE);
        },
        _downLoaingSuccessHook: function(isSuccess, successTips) {
            this.options.down.contentsuccess = successTips || this.options.down.contentsuccess;
            this.downWrapTips.innerText = isSuccess ? this.options.down.contentsuccess : this.options.down.contenterror;
            this.downWrapProgress.classList.remove(CLASS_ROTATE);
            this.downWrapProgress.classList.add(CLASS_FADE_OUT);
            this.downWrapProgress.classList.add(isSuccess ? CLASS_DOWN_SUCCESS : CLASS_DOWN_ERROR);
        },
        _downLoaingEndHook: function(isSuccess) {
            this.downWrapTips.innerText = this.options.down.contentdown;
            this.downWrapProgress.classList.remove(CLASS_ROTATE);
            this.downWrapProgress.classList.remove(CLASS_FADE_OUT);
            this.downWrapProgress.classList.remove(isSuccess ? CLASS_DOWN_SUCCESS : CLASS_DOWN_ERROR);
            // 默认为不可见
            // 需要重置回来
            this.isCanPullDown = false;
            this._transformDownWrap(-this.downWrapHeight, this.options.down.bounceTime);
        },
        _cancelLoaingHook: function() {
            this._transformDownWrap(-this.downWrapHeight, this.options.down.bounceTime);
        },
        _upLoaingHook: function(isShowUpLoading) {
            if (isShowUpLoading) {
                this.upWrapTips.innerText = this.options.up.contentrefresh;
                this.upWrapProgress.classList.add(CLASS_ROTATE);
                this.upWrapProgress.classList.remove(CLASS_HIDDEN);
                this.upWrap.style.visibility = 'visible';
            } else {
                this.upWrap.style.visibility = 'hidden';
            }

        },
        _upLoaingEndHook: function(isFinishUp) {
            if (!isFinishUp) {
                // 接下来还可以加载更多
                // this.upWrap.style.visibility = 'hidden';
                this.upWrapTips.innerText = this.options.up.contentdown;
            } else {
                // 已经没有更多数据了
                // this.upWrap.style.visibility = 'visible';
                this.upWrapTips.innerText = this.options.up.contentnomore;
            }
            this.upWrapProgress.classList.remove(CLASS_ROTATE);
            this.upWrapProgress.classList.add(CLASS_HIDDEN);
        },
        _resetUpLoadingHook: function() {
            // this.upWrap.style.visibility = 'hidden';
            this.upWrapTips.innerText = this.options.up.contentdown;
            this.upWrapProgress.classList.remove(CLASS_ROTATE);
            this.upWrapProgress.classList.add(CLASS_HIDDEN);
        },
        _lockUpLoadingHook: function(isLock) {
            this.upWrap.style.visibility = isLock ? 'hidden' : 'visible';
        },
        _lockDownLoadingHook: function(isLock) {
            this.downWrap.style.visibility = isLock ? 'hidden' : 'visible';
        }
    });

    // 挂载主题，这样多个主题可以并存，default是关键字，所以使用了defaults
    innerUtil.namespace('theme.defaults', MiniRefreshTheme);

    // 覆盖全局对象，使的全局对象只会指向一个最新的主题
    globalContext.MiniRefresh = MiniRefreshTheme;

})(MiniRefreshTools, typeof window !== 'undefined' ? window : global);