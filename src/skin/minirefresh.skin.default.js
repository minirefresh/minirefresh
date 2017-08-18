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