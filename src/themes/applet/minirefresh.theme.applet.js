/**
 * 仿微信小程序主题
 * 由于要复用default的上拉加载，toTop功能，所以直接继承自default
 * 只重写了 downWrap相关操作
 */
(function(innerUtil, globalContext) {

    /**
     * 一些默认提供的CSS类，一般来说不会变动（由框架提供的）
     * theme字段会根据不同的主题有不同值
     */
    var CLASS_THEME = 'minirefresh-theme-applet';
    var CLASS_DOWN_WRAP = 'minirefresh-downwrap';
    var CLASS_HARDWARE_SPEEDUP = 'minirefresh-hardware-speedup';

    /**
     * 本主题的特色样式
     */
    var CLASS_DOWN_LOADING = 'loading-applet';

    /**
     * 一些常量
     */
    var DEFAULT_DOWN_HEIGHT = 50;

    var defaultSetting = {
        down: {
            successAnim: {
                // 微信小程序没有successAnim 也没有文字提示
                isEnable: false
            },
            // 继承了default的downWrap部分代码，需要这个变量
            isWrapCssTranslate: true
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
            var container = this.container,
                contentWrap = this.contentWrap;

            // 下拉的区域
            var downWrap = document.createElement('div');

            downWrap.className = CLASS_DOWN_WRAP + ' ' + CLASS_HARDWARE_SPEEDUP;
            downWrap.innerHTML = '<div class="downwrap-content ball-beat"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
            container.insertBefore(downWrap, contentWrap);

            // 由于直接继承的default，所以其实已经有default主题了，这里再加上本主题样式
            container.classList.add(CLASS_THEME);

            this.downWrap = downWrap;
            // 留一个默认值，以免样式被覆盖，无法获取
            this.downWrapHeight = this.downWrap.offsetHeight || DEFAULT_DOWN_HEIGHT;
            this._transformDownWrap(-1 * this.downWrapHeight);
        },
        _transformDownWrap: function(offset, duration) {
            this._super(offset, duration);
        },

        /**
         * 重写下拉过程动画
         * @param {Number} downHight 当前下拉的高度
         * @param {Number} downOffset 下拉的阈值
         */
        _pullHook: function(downHight, downOffset) {

            if (downHight < downOffset) {
                var rate = downHight / downOffset,
                    offset = this.downWrapHeight * (-1 + rate);

                this._transformDownWrap(offset);
            } else {
                this._transformDownWrap(0);
            }
        },

        /**
         * 重写下拉动画
         */
        _downLoaingHook: function() {
            this.downWrap.classList.add(CLASS_DOWN_LOADING);
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
            this.downWrap.classList.remove(CLASS_DOWN_LOADING);
            this._transformDownWrap(-1 * this.downWrapHeight, this.options.down.bounceTime);
        },
        
        /**
         * 取消loading的回调
         */
        _cancelLoaingHook: function() {
            this._transformDownWrap(-1 * this.downWrapHeight, this.options.down.bounceTime);
        }
    });

    // 挂载主题，这样多个主题可以并存
    innerUtil.namespace('theme.applet', MiniRefreshTheme);

    // 覆盖全局对象，使的全局对象只会指向一个最新的主题
    globalContext.MiniRefresh = MiniRefreshTheme;

})(MiniRefreshTools, typeof window !== 'undefined' ? window : global);