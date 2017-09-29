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