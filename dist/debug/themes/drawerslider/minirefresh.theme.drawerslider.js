/**
 * 滑动抽屉效果
 * 复用了default的代码
 * 下拉动画时完全自定义重写，不移动scroll，而是直接css动画
 */
(function(innerUtil, globalContext) {

    /**
     * 一些默认提供的CSS类，一般来说不会变动（由框架提供的）
     * theme字段会根据不同的主题有不同值
     */
    var CLASS_THEME = 'minirefresh-theme-drawerslider';

    /**
     * 一些常量
     * 默认高度是200
     * 其中背景默认是黑色，内容是白色，再增设阻尼系数可以较好的达到3D效果
     */
    var DEFAULT_DOWN_HEIGHT = 200,
        DOWN_SHADOW_HEIGHT = 2;

    var defaultSetting = {
        down: {
            offset: 100,
            // 阻尼系数，下拉的距离大于offset时,改变下拉区域高度比例;值越接近0,高度变化越小,表现为越往下越难拉
            dampRate: 0.2,
            bounceTime: 500,
            successAnim: {
                // successAnim
                isEnable: false
            },
            // 继承了default的downWrap部分代码，需要这个变量
            isWrapCssTranslate: true,
            // 是否scroll在下拉时会进行css移动，本主题关闭它，完全自定义
            // 这种方案记得修改动画区域的index
            isScrollCssTranslate: false
        }
    };

    var MiniRefreshTheme = innerUtil.theme.defaults.extend({

        /**
         * 拓展自定义的配置
         * @param {Object} options 配置参数
         */
        init: function(options) {
            options = innerUtil.extend(true, {}, defaultSetting, options);
            this._super(options);
        },

        /**
         * 重写下拉刷新初始化，变为小程序自己的动画
         */
        _initDownWrap: function() {
            // 先复用default代码，然后重写
            this._super();
            
            var container = this.container,
                options = this.options,
                downWrap = this.downWrap;
            
            // 改写内容区域
            downWrap.innerHTML = '<div class="drawer">' +
                                '<div class="downwrap-content">' +
                                '<p class="downwrap-progress"></p>' +
                                '<p class="downwrap-tips">' +
                                options.down.contentdown +
                                ' </p></div>' +
                                '<div class="drawer-mask"></div ></div>';

            // 由于直接继承的default，所以其实已经有default主题了，这里再加上本主题样式
            container.classList.add(CLASS_THEME);

            // 改写完后，对象需要重新查找，需要给default用
            this.downWrapProgress = downWrap.querySelector('.downwrap-progress');
            this.downWrapTips = downWrap.querySelector('.downwrap-tips');
            this.drawer = downWrap.querySelector('.drawer');
            this.drawerMask = downWrap.querySelector('.drawer-mask');

            // 留一个默认值，以免样式被覆盖，无法获取
            // +2是去除阴影的位置
            this.downWrapHeight = DOWN_SHADOW_HEIGHT + downWrap.offsetHeight || DEFAULT_DOWN_HEIGHT;
            // 由于downWrap被改变了，重新移动
            this._transformDownWrap(-this.downWrapHeight);
        },
        _transformDownWrap: function(offset, duration) {
            this._super(offset, duration);
            this._transformDrawer(offset, duration);
        },
        _transformDrawer: function(offset, duration) {
            if (!this.drawerMask) {
                return ;
            }
            
            offset = offset || 0;
            duration = duration || 0;

            var opacity = (-offset - this.options.down.offset) / this.downWrapHeight;
            
            opacity = Math.min(1, opacity);
            opacity = Math.max(0, opacity);
            
            this.drawerMask.style.opacity = opacity;
            this.drawerMask.style.webkitTransitionDuration = duration + 'ms';
            this.drawerMask.style.transitionDuration = duration + 'ms';
        },
        
        /**
         * 重写下拉过程动画
         * @param {Number} downHight 当前下拉的高度
         * @param {Number} downOffset 下拉的阈值
         */
        _pullHook: function(downHight, downOffset) {
            // 复用default的同名函数代码
            this._super(downHight, downOffset);
        },

        /**
         * 重写下拉动画
         */
        _downLoaingHook: function() {
            // loading中已经translate了
            this._super();
        },

        /**
         * 重写success 但是什么都不做
         */
        _downLoaingSuccessHook: function() {},

        /**
         * 重写下拉end
         * @param {Boolean} isSuccess 是否成功
         */
        _downLoaingEndHook: function(isSuccess) {
            this._super(isSuccess);
        },
        
        /**
         * 取消loading的回调
         */
        _cancelLoaingHook: function() {
            this._super();
        }
    });

    // 挂载主题，这样多个主题可以并存
    innerUtil.namespace('theme.drawerslider', MiniRefreshTheme);

    // 覆盖全局对象，使的全局对象只会指向一个最新的主题
    globalContext.MiniRefresh = MiniRefreshTheme;

})(MiniRefreshTools, typeof window !== 'undefined' ? window : global);