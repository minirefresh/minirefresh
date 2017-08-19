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
        // 默认没有hook
        this.hooks = {};

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
            if (self.options.down && self.options.down.auto && !self.isLockDown) {
                // 如果设置了auto，则自动下拉一次
                self.triggerDownLoading();
            } else if (self.options.up && self.options.up.auto && !self.isLockUp) {                
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
        
        if (!this.hooks['beforeDownLoading'] || this.hooks['beforeDownLoading'](self.downHight, options.down.offset)) {
            // 没有hook或者hook返回true都通过，主要是为了方便类似于秘密花园等的自定义下拉刷新动画实现
            self.downLoading = true;
            self.downHight = options.down.offset;
            self._translate(self.downHight, bounceTime);
        
            self.events['downLoading'] && self.events['downLoading']();
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
        this.options.down && (this.isLockDown = isLock);
    };

    /**
     * 只有 up存在时才允许解锁
     * @param {Boolean} isLock
     */
    MiniScroll.prototype.lockUp = function(isLock) {
        this.options.up && (this.isLockUp = isLock);
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
     * 注册钩子函数，主要是一些自定义刷新动画时用到，如进入秘密花园
     * @param {String} hook 名称，范围如下
     * beforeDownLoading 是否准备downLoading，如果返回false，则不会loading，完全进入自定义动画
     */
    MiniScroll.prototype.hook = function(hook, callback) {
        if (!hook || !innerUtil.isFunction(callback)) {
            return;
        }
        this.hooks[hook] = callback;
    };

    innerUtil.scroll = MiniScroll;
})(MiniRefreshTools);