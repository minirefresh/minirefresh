/**
 * 构建 MiniRefresh
 * MiniRefreshTools 是内部使用的
 * 外部皮肤会用 MiniRefresh变量
 */
window.MiniRefreshTools = window.MiniRefreshTools || (function(exports) {
    /**
     * 模拟Class的基类,以便模拟Class进行继承等
     */
    (function() {
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
            //Clazz.extend = this.extend;

            // 一些修改，让静态属性也继承
            for (var prop in this) {
                Clazz[prop] = this[prop];
            }
            return Clazz;
        };
        exports.Clazz = Clazz;
    })();
    
    /**
     * 空函数
     */
    exports.noop = function() {};

    exports.isFunction = function(obj) {
        return typeof(obj) === "function";
    };
    
    exports.isObject = function(obj) {
        return typeof(obj) === "object";
    };

    exports.isArray = Array.isArray ||
        function(object) {
            return object instanceof Array;
        };

    /**
     * 参数拓展
     * @param {type} deep
     * @param {type} target
     * @param {type} source
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

        if (typeof target === "boolean") {
            // 如果开启了深复制
            deep = target;
            target = args[index] || {};
            index++;
        }

        if (!exports.isObject(target)) {
            // 确保拓展的一定是object
            target = {};
        }

        if (index === len) {
            // 如果调用的extend本来就是可以拓展的，第0个就变为source了
            target = this;
            index--;
        }

        for (; index < len; index++) {
            // source的拓展
            var source = args[index];

            if (source && exports.isObject(source)) {
                for (var name in source) {
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
     */
    exports.selector = function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        return element;
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
     * 设置一个Util对象下的命名空间
     * @param {String} namespace
     * @param {Object} obj 需要赋值的目标对象
     */
    exports.namespace = function(namespace, obj) {
        var parent = window.MiniRefreshTools;

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
     * 兼容require，但是require出去的是MiniRefreshTools，所以仍然建议通过全局变量MiniRefresh调用
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
/**
 * MiniRerefresh 处理滑动监听的关键代码，都是逻辑操作，没有UI实现
 * 依赖于一个 MiniRefresh对象
 */
(function(innerUtil) {
    var rAF = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        // 默认每秒60帧
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };

    var MiniScroll = function(minirefresh) {
        this.minirefresh = minirefresh;
        this.container = minirefresh.container;
        this.scrollWrap = minirefresh.scrollWrap;
        this.options = minirefresh.options;
        // 默认没有事件，需要主动绑定
        this.events = {};

        // 是否使用了scrollto功能，使用这个功能时会禁止操作
        this.isScrollTo = false;
        // 上拉和下拉的状态
        this.upLoading = false;
        this.downLoading = false;

        // 锁定上拉和下拉
        this.isLockDown = false;
        this.isLockUp = false;
        this.isShowUpLoading = true;
        // 默认up是没有finish的
        this.isFinishUp = false;

        // 判断是否有down和up决定初始化时是否锁定
        !this.options.down && (this.isLockDown = true);
        !this.options.up && (this.isLockUp = true);

        this._initPullDown();
        this._initPullUp();

        var self = this;
        // 在初始化完毕后，下一个循环的开始再执行
        setTimeout(function() {
            if (self.options.down && self.options.down.auto) {
                // 如果设置了auto，则自动下拉一次
                self.triggerDownLoading();
            } else if (self.options.up && self.options.up.auto) {
                // 如果设置了auto，则自动上拉一次
                self.triggerUpLoading();
            }
        });
    };

    /**
     * wrap的translate动画，用于下拉刷新时进行transform动画
     * @param {Number} y
     * @param {Number} duration
     */
    MiniScroll.prototype._translate = function(y, duration) {
        y = y || 0;
        duration = duration || 0;

        var wrap = this.scrollWrap;

        wrap.style.webkitTransitionDuration = duration + 'ms';
        wrap.style.transitionDuration = duration + 'ms';
        wrap.style.webkitTransform = 'translate(0px, ' + y + 'px) translateZ(0px)'
        wrap.style.transform = 'translate(0px, ' + y + 'px) translateZ(0px)'
    };

    MiniScroll.prototype._initPullDown = function() {
        var self = this,  
            scrollWrap = this.scrollWrap,
            options = this.options,
            bounceTime = options.down.bounceTime,
            downOffset = options.down.offset;   

        scrollWrap.webkitTransitionTimingFunction = 'cubic-bezier(0.1, 0.57, 0.1, 1)';
        scrollWrap.transitionTimingFunction = 'cubic-bezier(0.1, 0.57, 0.1, 1)';

        var touchstartEvent = function(e) {
            if (self.isScrollTo) {
                // 如果执行滑动事件,则阻止touch事件,优先执行scrollTo方法
                e.preventDefault();
            }
            // 记录startTop　并且　只有startTop存在值时才允许move
            self.startTop = scrollWrap.scrollTop;

            // startY用来计算距离
            self.startY = e.touches ? e.touches[0].pageY : e.clientY;
            // X的作用是用来计算方向，如果是横向，则不进行动画处理，避免误操作
            self.startX = e.touches ? e.touches[0].pageX : e.clientX;
        };

        // 兼容手指滑动与鼠标
        scrollWrap.addEventListener("touchstart", touchstartEvent);
        scrollWrap.addEventListener("mousedown", touchstartEvent);

        var touchmoveEvent = function(e) {
            if (self.startTop !== undefined && self.startTop <= 0 &&
                !self.downLoading && !self.isLockDown) {
                // 列表在顶部且不在加载中，并且没有锁住下拉动画

                // 当前第一个手指距离列表顶部的距离
                var curY = e.touches ? e.touches[0].pageY : e.clientY;
                var curX = e.touches ? e.touches[0].pageX : e.clientX;

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

                if (Math.abs(moveX) > Math.abs(moveY)) {
                    // 如果是横向滑动更多，阻止默认事件
                    e.preventDefault();
                    return;
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
                    
                    if (self.downHight < downOffset) {
                        // 下拉距离  < 指定距离
                        self.downHight += diff;                     
                    } else {                        
                        // 超出了指定距离，随时可以刷新
                        if (diff > 0) {
                            // 需要加上阻尼系数
                            self.downHight += diff * options.down.dampRate;
                        } else {
                            // 向上收回高度,则向上滑多少收多少高度
                            self.downHight += diff;
                        }
                    }
                    self.events['pull'] && self.events['pull'](self.downHight, downOffset);
                    // 执行动画
                    self._translate(self.downHight);
                } else {
                    // 解决嵌套问题。在嵌套有 IScroll，或类似的组件时，这段代码会生效，可以辅助滚动scrolltop
                    // 否则有可能在最开始滚不动
                    if (scrollWrap.scrollTop <= 0) {
                        scrollWrap.scrollTop += Math.abs(diff);
                    }
                }
            }

        };

        scrollWrap.addEventListener("touchmove", touchmoveEvent);
        scrollWrap.addEventListener("mousemove", touchmoveEvent);

        var touchendEvent = function(e) {
            // 需要重置状态
            if (self.isMoveDown) {
                // 如果下拉区域已经执行动画,则需重置回来
                if (self.downHight >= downOffset) {
                    // 符合触发刷新的条件
                    self.triggerDownLoading();
                } else {
                    // 否则默认重置位置
                    self._translate(0, bounceTime);
                    self.downHight = 0;
                }

                self.isMoveDown = false;
            }

            self.startY = 0;
            self.startX = 0;
            self.preY = 0;
            self.startTop = undefined;
        };

        scrollWrap.addEventListener("touchend", touchendEvent);
        scrollWrap.addEventListener("mouseup", touchendEvent);
        scrollWrap.addEventListener("mouseleave", touchendEvent);

    };

    MiniScroll.prototype._initPullUp = function() {
        var self = this,
            scrollWrap = this.scrollWrap,
            options = this.options;

        
        scrollWrap.addEventListener("scroll", function() {
            var scrollTop = scrollWrap.scrollTop,
                scrollHeight = scrollWrap.scrollHeight,
                clientHeight = scrollWrap.clientHeight;
                
            self.events['scroll'] && self.events['scroll'](scrollTop);    
            
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
            if (!self.isLockUp && options.up.loadFull.enable && scrollWrap.scrollHeight <= scrollWrap.clientHeight) {
                self.triggerUpLoading();
            }
        }, options.up.loadFull.delay || 0);
    };

    MiniScroll.prototype.triggerDownLoading = function() {
        var self = this,
            options = this.options,
            bounceTime = options.down.bounceTime;
            
        self.downLoading = true;
        self.downHight = options.down.offset;
        self._translate(self.downHight, bounceTime);
        
        self.events['downLoading'] && self.events['downLoading']();
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

        this.events['upLoading'] && this.events['upLoading']();
    };

    /**
     * 结束上拉加载动画
     */
    MiniScroll.prototype.endUpLoading = function(isFinishUp) {
        var options = this.options;

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
     * @param {Number} y
     * @param {Number} duration 单位毫秒
     */
    MiniScroll.prototype.scrollTo = function(y, duration) {
        var self = this,
            scrollWrap = this.scrollWrap;

        y = y || 0;
        duration = duration || 0;

        // 最大可滚动的y
        var maxY = scrollWrap.scrollHeight - scrollWrap.clientHeight;

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
        var count = 60 * duration / 1000;
        var step = diff / (count),
            i = 0;

        // 锁定状态
        self.isScrollTo = true;

        var execute = function() {
            if (i < count) {
                if (i == count - 1) {
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
     * @param {Boolean} isLock
     */
    MiniScroll.prototype.lockDown = function(isLock) {
        this.options.down && isLock && (this.isLockDown = false);
    };

    /**
     * 只有 up存在时才允许解锁
     * @param {Boolean} isLock
     */
    MiniScroll.prototype.lockUp = function(isLock) {
        this.options.up && isLock && (this.isLockUp = false);
    };

    MiniScroll.prototype.resetUpLoading = function(isShowUpLoading) {
        if (this.isFinishUp) {
            this.isFinishUp = false;
            // TODO: 可以做一些其他操作，例如重新变为加载更多 lockUpLoading
        }
        
        if (typeof isShowUpLoading === 'boolean') {
            this.isShowUpLoading = isShowUpLoading;
        }
        
        // 触发一次HTML的scroll事件，以便检查当前位置是否需要加载更多
        var evt = document.createEvent("HTMLEvents");
        
        // 这个事件没有必要冒泡
        evt.initEvent('scroll', false);
        this.scrollWrap.dispatchEvent(evt);
    };

    /**
     * 监听事件，包括下拉过程，下拉刷新，上拉加载，滑动等事件都可以监听到
     * @param {String} event 事件名，可选名称
     * scroll 容器滑动的持续回调，可以监听滑动位置
     * pull 下拉滑动过程的回调，持续回调
     * upLoading 上拉加载那一刻触发
     * downLoading 下拉刷新那一刻触发
     * @param {Function} callback
     */
    MiniScroll.prototype.on = function(event, callback) {
        if (!event || !innerUtil.isFunction(callback)) {
            return;
        }
        this.events[event] = callback;
    };

    /**
     * 事件取消注册
     * @param {Object} event
     */
    MiniScroll.prototype.off = function(event) {
        this.events[event] = undefined;
    };

    innerUtil.scroll = MiniScroll;
})(MiniRefreshTools);
/**
 * MiniRerefresh 的核心代码，代码中约定对外的API
 * 可以通过继承  MiniRefreshCore， 得到一个皮肤类，然后在皮肤类中实现UI hook函数可以达到不同的动画效果
 * 核心类内部没有任何UI实现，所有的UI都依赖于皮肤类
 * 
 * 以下是皮肤类可以实现的Hook（为undefined的话相当于忽略）
 * _initHook(isLockDown, isLockUp)              初始化时的回调
 * _pullHook(downHight, downOffset)             下拉过程中持续回调
 * _scrollHook(scrollTop)                       滚动过程中持续回调
 * _downLoaingHook()                            下拉触发的那一刻回调
 * _downLoaingSuccessHook(isSuccess)            下拉刷新的成功动画，处理成功或失败提示
 * _downLoaingEndHook()                         下拉刷新动画结束后的回调
 * _upLoaingHook()                              上拉触发的那一刻回调
 * _upLoaingEndHook(isFinishUp)                 上拉加载动画结束后的回调
 * _lockUpLoadingHook(isLock)                   锁定上拉时的回调
 * _lockDownLoadingHook(isLock)                 锁定下拉时的回调
 */
(function(innerUtil) {

    var defaultSetting = {
        // 下拉有关
        down: {
            // 是否自动下拉刷新
            auto: false,
            // 下拉要大于多少长度后再下拉刷新
            offset: 75,
            // 阻尼系数，下拉的距离大于offset时,改变下拉区域高度比例;值越接近0,高度变化越小,表现为越往下越难拉
            dampRate: 0.2,
            // 回弹动画时间
            bounceTime: 500,
            successAnim: {
                // 下拉刷新结束后是否有成功动画，默认为false，如果想要有成功刷新xxx条数据这种操作，请设为true，并实现对应hook函数
                enable: false,
                duration: 300
            },
            callback: innerUtil.noop
        },
        // 上拉有关
        up: {
            // 是否自动上拉加载-初始化是是否自动
            auto: true,
            // 距离底部高度(到达该高度即触发)
            offset: 100,
            loadFull: {
                // 开启配置后，只要没满屏幕，就会自动加载
                enable: true,
                delay: 300
            },
            callback: innerUtil.noop

        }, 
        // 容器
        container: '#minirefresh'
    };

    var MiniRefreshCore = innerUtil.Clazz.extend({
        /**
         * 初始化
         * @param {Object} options
         */
        init: function(options) {
            options = innerUtil.extend(true, {}, defaultSetting, options);

            this.container = innerUtil.selector(options.container);
            // scroll的dom-wrapper下的第一个节点
            this.scrollWrap = this.container.children[0];
            this.options = options;
            

            // 生成一个Scroll对象 ，对象内部处理滑动监听
            this.scroller = new innerUtil.scroll(this);
            
            this._initEvent();
            
            // 初始化的hook
            this._initHook && this._initHook(this.scroller.isLockDown, this.scroller.isLockUp);
        },
        _initEvent: function() {
            var self = this,
                options = this.options;
            
            this.scroller.on('downLoading', function() {
                self._downLoaingHook && self._downLoaingHook();
                options.down.callback && options.down.callback();
            });
            
            this.scroller.on('upLoading', function() {
                self._upLoaingHook && self._upLoaingHook();
                options.up.callback && options.up.callback();
            });
            
            this.scroller.on('pull', function(downHight, downOffset) {
                self._pullHook && self._pullHook(downHight, downOffset);
                options.down.pull && options.down.pull();
            });
            
            this.scroller.on('scroll', function(scrollTop) {
                self._scrollHook && self._scrollHook(scrollTop);
                options.up.scroll && options.up.scroll();
            });
        },
        /**
         * 内部执行，结束下拉刷新
         * @param {Boolean} isSuccess
         */
        _endDownLoading: function(isSuccess) {
            var self = this;

            if (!this.options.down) {
                //　防止没传down导致错误
                return;
            }

            if (this.scroller.downLoading) {
                // 必须是loading时才允许执行对应hook
                var successAnim = this.options.down.successAnim.enable,
                    successAnimTime = this.options.down.successAnim.duration;

                if (successAnim) {
                    // 如果有成功动画    
                    this._downLoaingSuccessHook && this._downLoaingSuccessHook(isSuccess);
                } else {
                    // 默认为没有成功动画
                    successAnimTime = 0;
                }

                setTimeout(function() {
                    // 成功动画结束后就可以重置位置了
                    self.scroller.endDownLoading();
                    // 触发结束hook
                    this._downLoaingEndHook && this._downLoaingEndHook();
                    
                }, successAnimTime);
            }
        },
        /**
         * 内部执行，结束上拉加载
         * @param {Boolean} isFinishUp
         */
        _endUpLoading: function(isFinishUp) {
            if (this.scroller.upLoading) {
                this.scroller.endUpLoading(isFinishUp);
                this._upLoaingEndHook && this._upLoaingEndHook(isFinishUp);
            }
        },
        /**
         * 结束下拉刷新
         * @param {Boolean} isSuccess 是否请求成功，这个状态会中转给对应皮肤
         */
        endDownLoading: function(isSuccess) {
            typeof isSuccess !== 'boolean' && (isSuccess = true);
            this._endDownLoading(isSuccess);
            // 同时恢复上拉加载的状态，注意，此时没有传isShowUpLoading，所以这个值不会生效
            this.resetUpLoading();
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
         * 重新刷新上拉加载，刷新后会变为可以上拉加载
         * @param {Boolean} isShowUpLoading 是否显示上拉加载动画，必须是布尔值才设置有效
         */
        resetUpLoading: function(isShowUpLoading) {
            this.scroller.resetUpLoading(isShowUpLoading);
        },
        /**
         * 锁定上拉加载
         * 将开启和禁止合并成一个锁定API
         * @param {Boolean} isLock 是否锁定
         */
        lockUpLoading: function(isLock) {
            this.scroller.lockUp(isLock);
            this._lockUpLoadingHook && this._lockUpLoadingHook(isLock);
        },
        /**
         * 锁定下拉刷新
         * @param {Boolean} isLock 是否锁定
         */
        lockDownLoading: function(isLock) {
            this.scroller.lockDown(isLock);
            this._lockDownLoadingHook && this._lockDownLoadingHook(isLock);
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
         * @param {Number} y
         * @param {Number} duration 单位毫秒
         */
        scrollTo: function(y, duration) {
            this.scroller.scrollTo(y, duration);
        },
    });

    MiniRefreshTools.core = MiniRefreshCore;
})(MiniRefreshTools);
/**
 * minirefresh的默认皮肤
 * 默认皮肤会打包到核心代码中
 * 皮肤类继承自基类，所以可以调用基类的属性（但是不建议滥用）
 * 为了统一调用，其它皮肤的配置参数请尽量按照default来
 */
(function(innerUtil) {

    var defaultSetting = {
        down: {
            successAnim: {
                // 下拉刷新结束后是否有成功动画，默认为false，如果想要有成功刷新xxx条数据这种操作，请设为true，并实现对应hook函数
                enable: true,
                duration: 300
            }
        },
        up: {
            toTop: {
                // 是否开启点击回到顶部
                enable: true,
                duration: 300,
                // 滚动多少距离才显示toTop
                offset: 800
            },
            empty: {
                enable: true,
                click: innerUtil.noop
            }
        }
    };

    var MiniRefreshSkin = innerUtil.core.extend({
        init: function(options) {
            // 拓展自定义的配置
            options = innerUtil.extend(true, {}, defaultSetting, options);
            this._super(options);
        },
        _initHook: function(isLockDown, isLockUp) {
            var container = this.container,
                scrollWrap = this.scrollWrap;

            container.classList.add('minirefresh-skin-default');
            // 下拉的区域
            var downwarp = document.createElement("div");
            downwarp.className = 'minirefresh-downwarp';
            downwarp.innerHTML = '<div class="downwarp-content"><p class="downwarp-progress"></p><p class="downwarp-tip">下拉刷新 </p></div>';
            container.insertBefore(downwarp, scrollWrap);
            this.downwarp = downwarp;
            // 是否能下拉的变量，控制pull时的状态转变
            this.isCanPullDown = false;

            // 上拉区域
            var upwarp = document.createElement("div");
            upwarp.className = 'minirefresh-upwarp';
            upwarp.innerHTML = '<p class="upwarp-tip">加载中..</p>';
            upwarp.style.visibility = 'hidden';
            scrollWrap.appendChild(upwarp);
            this.upwarp = upwarp;

            this._initToTop();
            this._initEmpty();
        },
        /**
         * 自定义实现一个toTop，由于这个是属于额外的事件所以没有添加的核心中，而是由各自的皮肤决定是否实现或者实现成什么样子
         */
        _initToTop: function() {
            var self = this,
                options = this.options,
                toTop = options.up.toTop.enable,
                duration = options.up.toTop.duration;

            if (toTop) {
                var toTopBtn = document.createElement("div");

                toTopBtn.className = 'minirefresh-totop minirefresh-skin-default';

                toTopBtn.onclick = function() {
                    self.scroller.scrollTo(0, duration);
                }
                toTopBtn.classList.add('minirefresh-fade-out');
                this.toTopBtn = toTopBtn;
                this.isShowToTopBtn = false;
                // 默认添加到body中防止冲突
                document.body.appendChild(toTopBtn);
            }
        },
        /**
         * 初始化空布局
         */
        _initEmpty: function() {
            var self = this,
                options = this.options,
                empty = options.up.empty.enable,
                emptyClick = options.up.empty.click;

            if (empty) {
                var emptyContent = document.createElement("div");

                emptyContent.className = 'minirefresh-empty';

                emptyContent.innerHTML = '<div class="empty-icon"></div><p class="empty-tip">暂无相关数据~</p><p class="empty-btn">去逛逛&gt;</p>';

                var emptyBtn = emptyContent.querySelector('.empty-btn');
                
                emptyBtn.onclick = function(e) {
                    emptyClick && emptyClick();

                }
                this.emptyContent = emptyContent;
                this.isEmptyShow = false;
            }
        },
        _pullHook: function(downHight, downOffset) {
            if (downHight < downOffset) {
                if (this.isCanPullDown) {
                    this.downwarp.querySelector('.downwarp-tip').innerText = '下拉刷新';
                    this.isCanPullDown = false;
                }
            } else {
                if (!this.isCanPullDown) {
                    this.downwarp.querySelector('.downwarp-tip').innerText = '释放可以刷新';
                    this.isCanPullDown = true;
                }
            }
        },
        _scrollHook: function(scrollTop) {
            // 用来判断toTop
            var options = this.options,
                toTop = options.up.toTop.enable,
                toTopBtn = this.toTopBtn;

            if (toTop && toTopBtn) {
                if (scrollTop >= options.up.toTop.offset) {
                    if (!this.isShowToTopBtn) {
                        toTopBtn.classList.remove('minirefresh-fade-out');
                        toTopBtn.classList.add('minirefresh-fade-in');
                        this.isShowToTopBtn = true;
                    }
                } else {
                    if (this.isShowToTopBtn) {
                        toTopBtn.classList.add('minirefresh-fade-out');
                        toTopBtn.classList.remove('minirefresh-fade-in');
                        this.isShowToTopBtn = false;
                    }
                }
            }
        },
        _downLoaingHook: function() {
            this.downwarp.querySelector('.downwarp-tip').innerText = '刷新中...';
        },
        _downLoaingSuccessHook: function(isSuccess) {
            this.downwarp.querySelector('.downwarp-tip').innerText = '刷新成功';
        },
        _downLoaingEndHook: function() {
            this.downwarp.querySelector('.downwarp-tip').innerText = '下拉刷新';
            // 需要重置回来
            this.isCanPullDown = false;
        },
        _upLoaingHook: function() {
            this.upwarp.querySelector('.upwarp-tip').innerText = '加载中...';
            this.upwarp.style.visibility = 'visible';
        },
        _upLoaingEndHook: function(isFinishUp) {
            if (!isFinishUp) {
                this.upwarp.style.visibility = 'hidden';
            } else {
                // 正常的加载更多
                this.upwarp.querySelector('.upwarp-tip').innerText = '没有更多数据了';
            }

        },
        _lockUpLoadingHook: function(isLock) {

        },
        _lockDownLoadingHook: function(isLock) {

        },
        /**
         * 对外的API，显示空布局
         */
        showEmpty: function() {
            var options = this.options,
                empty = options.up.empty.enable,
                emptyContent = this.emptyContent;

            if (empty && emptyContent && !this.isEmptyShow) {
                this.scrollWrap.appendChild(emptyContent);
            }
        },
        /**
         * 对外的API，隐藏空布局
         */
        hideEmpty: function() {
            var options = this.options,
                empty = options.up.empty.enable,
                emptyContent = this.emptyContent;

            if (empty && emptyContent && this.isEmptyShow) {
                var parentDom = emptyContent.parentNode;
                if (parentDom) {
                    parentDom.removeChild(emptyContent);
                    this.isEmptyShow = false;
                }
            }
        },
    });

    // 挂载皮肤，这样多个皮肤可以并存
    innerUtil.namespace('skin.default', MiniRefreshSkin);

    // 覆盖全局对象，使的全局对象只会指向一个最新的皮肤
    window.MiniRefresh = MiniRefreshSkin;

})(MiniRefreshTools);