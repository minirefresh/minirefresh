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