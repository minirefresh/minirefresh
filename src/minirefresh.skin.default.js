/**
 * minirefresh的默认皮肤
 * 默认皮肤会打包到核心代码中
 * 皮肤类继承自基类，所以可以调用基类的属性（但是不建议滥用）
 * 拓展其它皮肤有两种方案：
 * 1. 直接继承自default，会默认拥有default的属性，只需要覆盖自定义功能即可（注意必须覆盖，否则会调用dwfault的默认操作）
 * 2. 和default一样，继承自 innerUtil.core，这样会与default无关，所以的一切UI都必须自己实现（可以参考default去实现）
 * 
 * 一般，在进行一些小修改时，建议继承自default（这样toTop，上拉加载大部分代码都可复用）
 * 在进行大修改时，建议继承自innerUtil.core，这样可以干干净净的重写皮肤
 */
(function(innerUtil) {

    /**
     * 一些默认提供的CSS类，一般来说不会变动（由框架提供的）
     * skin字段会根据不同的皮肤有不同值
     */
    var CLASS_SKIN = 'minirefresh-skin-default';
    var CLASS_DOWN_WRAP = 'minirefresh-downwrap';
    var CLASS_UP_WRAP = 'minirefresh-upwrap';
    var CLASS_FADE_IN = 'minirefresh-fade-in';
    var CLASS_FADE_OUT = 'minirefresh-fade-out';
    var CLASS_TO_TOP = 'minirefresh-totop';
    var CLASS_ROTATE = 'minirefresh-rotate';
    var CLASS_HARDWARE_SPEEDUP = 'minirefresh-hardware-speedup';
    var CLASS_HIDDEN = 'minirefresh-hidden';

    /**
     * 本皮肤的特色样式
     */
    var CLASS_DOWN_SUCCESS = 'downwrap-success';
    var CLASS_DOWN_ERROR = 'downwrap-error';

    var defaultSetting = {
        down: {
            successAnim: {
                // 下拉刷新结束后是否有成功动画，默认为false，如果想要有成功刷新xxx条数据这种操作，请设为true，并实现对应hook函数
                enable: true,
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
            contenterror: '刷新失败'
        },
        up: {
            toTop: {
                // 是否开启点击回到顶部
                enable: true,
                duration: 300,
                // 滚动多少距离才显示toTop
                offset: 800
            },
            contentdown: '上拉显示更多',
            contentrefresh: '加载中...',
            contentnomore: '没有更多数据了'
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

            container.classList.add(CLASS_SKIN);
            // 加上硬件加速让动画更流畅
            scrollWrap.classList.add(CLASS_HARDWARE_SPEEDUP);

            this._initDownWrap();
            this._initUpWrap();
            this._initToTop();
        },
        _initDownWrap: function() {
            var container = this.container,
                scrollWrap = this.scrollWrap,
                options = this.options;

            // 下拉的区域
            var downWrap = document.createElement('div');

            downWrap.className = CLASS_DOWN_WRAP + ' ' + CLASS_HARDWARE_SPEEDUP;
            downWrap.innerHTML = '<div class="downwrap-content"><p class="downwrap-progress"></p><p class="downwrap-tips">' + options.down.contentdown + ' </p></div>';
            container.insertBefore(downWrap, scrollWrap);

            this.downWrap = downWrap;
            this.downWrapProgress = this.downWrap.querySelector('.downwrap-progress');
            this.downWrapTips = this.downWrap.querySelector('.downwrap-tips');
            // 是否能下拉的变量，控制pull时的状态转变
            this.isCanPullDown = false;
        },
        _initUpWrap: function() {
            var scrollWrap = this.scrollWrap,
                options = this.options;
            
            // 上拉区域
            var upWrap = document.createElement('div');

            upWrap.className = CLASS_UP_WRAP + ' ' + CLASS_HARDWARE_SPEEDUP;
            upWrap.innerHTML = '<p class="upwrap-progress"></p><p class="upwrap-tips">' + options.up.contentdown + '</p>';
            upWrap.style.visibility = 'hidden';
            scrollWrap.appendChild(upWrap);

            this.upWrap = upWrap;
            this.upWrapProgress = this.upWrap.querySelector('.upwrap-progress');
            this.upWrapTips = this.upWrap.querySelector('.upwrap-tips');
        },
        
        /**
         * 自定义实现一个toTop，由于这个是属于额外的事件所以没有添加的核心中，而是由各自的皮肤决定是否实现或者实现成什么样子
         * 不过框架中仍然提供了一个默认的minirefresh-totop样式，可以方便使用
         */
        _initToTop: function() {
            var self = this,
                options = this.options,
                toTop = options.up.toTop.enable,
                duration = options.up.toTop.duration;

            if (toTop) {
                var toTopBtn = document.createElement('div');

                toTopBtn.className = CLASS_TO_TOP + ' ' + CLASS_SKIN;

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
        },
        _scrollHook: function(scrollTop) {
            // 用来判断toTop
            var options = this.options,
                toTop = options.up.toTop.enable,
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
            this.downWrapTips.innerText = this.options.down.contentrefresh;
            this.downWrapProgress.classList.add(CLASS_ROTATE);
        },
        _downLoaingSuccessHook: function(isSuccess) {
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
                this.upWrap.style.visibility = 'hidden';
                this.upWrapTips.innerText = this.options.up.contentdown;
            } else {
                // 已经没有更多数据了
                this.upWrap.style.visibility = 'visible';
                this.upWrapTips.innerText = this.options.up.contentnomore;
            }
            this.upWrapProgress.classList.remove(CLASS_ROTATE);
            this.upWrapProgress.classList.add(CLASS_HIDDEN);
        },
        _lockUpLoadingHook: function(isLock) {
            // 可以实现自己的逻辑
        },
        _lockDownLoadingHook: function(isLock) {
            // 可以实现自己的逻辑
        }
    });

    // 挂载皮肤，这样多个皮肤可以并存，default是关键字，所以使用了defaults
    innerUtil.namespace('skin.defaults', MiniRefreshSkin);

    // 覆盖全局对象，使的全局对象只会指向一个最新的皮肤
    window.MiniRefresh = MiniRefreshSkin;

    /**
     * 兼容require，为了方便使用，暴露出去的就是最终的皮肤
     * 如果要自己实现皮肤，也请在对应的皮肤中增加require支持
     */
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MiniRefreshSkin;
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(function() {
            return MiniRefreshSkin;
        });
    }

})(MiniRefreshTools);