/**
 * minirefresh的默认皮肤
 * 默认皮肤会打包到核心代码中
 * 皮肤类继承自基类，所以可以调用基类的属性（但是不建议滥用）
 * 为了统一调用，其它皮肤的配置参数请尽量按照default来
 */
(function(innerUtil) {

    /**
     * 一些默认提供的CSS类，一般来说不会变动（由框架提供的）
     * skin字段会根据不同的皮肤有不同值
     */
    var CLASS_SKIN = 'minirefresh-skin-applet';
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
    var CLASS_DOWN_LOADING = 'loading';

    var defaultSetting = {
        down: {
            successAnim: {
                // 微信小程序皮肤没有successAnim 也没有文字提示
                enable: false,
            },
            // 是否开启css动画
            cssAnimation: true
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
            contentnomore: '没有更多数据了',
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
                scrollWrap = this.scrollWrap,
                options = this.options;

            container.classList.add(CLASS_SKIN);
            // 加上硬件加速让动画更流畅
            scrollWrap.classList.add(CLASS_HARDWARE_SPEEDUP);

            // 下拉的区域
            var downWrap = document.createElement("div");

            downWrap.className = CLASS_DOWN_WRAP + ' ' + CLASS_HARDWARE_SPEEDUP;
            downWrap.innerHTML = '<div class="downwrap-content ball-beat"><div></div><div></div><div></div></div>';
            container.insertBefore(downWrap, scrollWrap);

            this.downWrap = downWrap;
            this._resetDownWrap();

            // 上拉区域
            var upWrap = document.createElement("div");

            upWrap.className = CLASS_UP_WRAP + ' ' + CLASS_HARDWARE_SPEEDUP;
            upWrap.innerHTML = '<p class="upwrap-progress"></p><p class="upwrap-tips">' + options.up.contentdown + '</p>';
            upWrap.style.visibility = 'hidden';
            scrollWrap.appendChild(upWrap);

            this.upWrap = upWrap;
            this.upWrapProgress = this.upWrap.querySelector('.upwrap-progress');
            this.upWrapTips = this.upWrap.querySelector('.upwrap-tips');

            this._initToTop();
        },
        _resetDownWrap: function() {
            if (this.options.down.cssAnimation) {
                this.downWrap.style.webkitTransform = 'translateY(-50px)';
                this.downWrap.style.transform = 'translateY(-50px)';
            }
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
                var toTopBtn = document.createElement("div");

                toTopBtn.className = CLASS_TO_TOP + ' ' + CLASS_SKIN;

                toTopBtn.onclick = function() {
                    self.scroller.scrollTo(0, duration);
                }
                toTopBtn.classList.add(CLASS_HIDDEN);
                this.toTopBtn = toTopBtn;
                this.isShowToTopBtn = false;
                // 默认添加到body中防止冲突
                document.body.appendChild(toTopBtn);
            }
        },
        _pullHook: function(downHight, downOffset) {
            var options = this.options;

            if (this.options.down.cssAnimation) {
                if (downHight < downOffset) {
                    var rate = downHight / downOffset,
                        offset = (-50 + rate * 50);

                    this.downWrap.style.webkitTransform = 'translateY(' + offset + 'px)';
                    this.downWrap.style.transform = 'translateY(' + offset + 'px)';
                } else {
                    this.downWrap.style.webkitTransform = 'translateY(0)';
                    this.downWrap.style.transform = 'translateY(0)';
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
            this.downWrap.classList.add(CLASS_DOWN_LOADING);
        },
        // applet没有success hook
        _downLoaingEndHook: function(isSuccess) {
            this.downWrap.classList.remove(CLASS_DOWN_LOADING);
            this._resetDownWrap();
        },
        _upLoaingHook: function() {
            this.upWrapTips.innerText = this.options.up.contentrefresh;
            this.upWrapProgress.classList.add(CLASS_ROTATE);
            this.upWrapProgress.classList.remove(CLASS_HIDDEN);
            this.upWrap.style.visibility = 'visible';
        },
        _upLoaingEndHook: function(isFinishUp) {
            if (!isFinishUp) {
                // 接下来还可以加载更多
                this.upWrap.style.visibility = 'hidden';
                this.upWrapTips.innerText = this.options.up.contentdown;
            } else {
                // 已经没有更多数据了
                this.upWrapTips.innerText = this.options.up.contentnomore;
            }
            this.upWrapProgress.classList.remove(CLASS_ROTATE);
            this.upWrapProgress.classList.add(CLASS_HIDDEN);
        },
        _lockUpLoadingHook: function(isLock) {

        },
        _lockDownLoadingHook: function(isLock) {

        },
    });

    // 挂载皮肤，这样多个皮肤可以并存
    innerUtil.namespace('skin.applet', MiniRefreshSkin);

    // 覆盖全局对象，使的全局对象只会指向一个最新的皮肤
    window.MiniRefresh = MiniRefreshSkin;

})(MiniRefreshTools);