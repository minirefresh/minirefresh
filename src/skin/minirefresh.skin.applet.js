/**
 * 微信小程序皮肤
 * 由于要复用default的上拉加载，toTop功能，所以直接继承自default
 * 只重写了 downWrap相关操作
 */
(function(innerUtil) {

    /**
     * 一些默认提供的CSS类，一般来说不会变动（由框架提供的）
     * skin字段会根据不同的皮肤有不同值
     */
    var CLASS_SKIN = 'minirefresh-skin-applet';
    var CLASS_DOWN_WRAP = 'minirefresh-downwrap';
    var CLASS_HARDWARE_SPEEDUP = 'minirefresh-hardware-speedup';

    /**
     * 本皮肤的特色样式
     */
    var CLASS_DOWN_LOADING = 'loading-applet';

    var defaultSetting = {
        down: {
            successAnim: {
                // 微信小程序皮肤没有successAnim 也没有文字提示
                enable: false,
            },
            // 是否开启applet的dot css动画，这是本皮肤的拓展
            // 如果过于影响性能，可以关闭掉
            appletAnimation: true
        }
    };

    var MiniRefreshSkin = innerUtil.skin.defaults.extend({
        /**
         * 拓展自定义的配置
         * @param {Object} options
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
                scrollWrap = this.scrollWrap,
                options = this.options;

            // 下拉的区域
            var downWrap = document.createElement("div");

            downWrap.className = CLASS_DOWN_WRAP + ' ' + CLASS_HARDWARE_SPEEDUP;
            downWrap.innerHTML = '<div class="downwrap-content ball-beat"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
            container.insertBefore(downWrap, scrollWrap);
            
            // 由于直接继承的default，所以其实已经有default皮肤了，这里再加上本皮肤样式
            container.classList.add(CLASS_SKIN);

            this.downWrap = downWrap;
            this._resetDownWrap();
        },
        _resetDownWrap: function() {
            if (this.options.down.appletAnimation) {
                this.downWrap.style.webkitTransform = 'translateY(-50px)';
                this.downWrap.style.transform = 'translateY(-50px)';
            }
        },
        /**
         * 重写下拉过程动画
         * @param {Number} downHight
         * @param {Number} downOffset
         */
        _pullHook: function(downHight, downOffset) {
            var options = this.options;

            if (this.options.down.appletAnimation) {
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
         */
        _downLoaingEndHook: function(isSuccess) {
            this.downWrap.classList.remove(CLASS_DOWN_LOADING);
            this._resetDownWrap();
        }
    });

    // 挂载皮肤，这样多个皮肤可以并存
    innerUtil.namespace('skin.applet', MiniRefreshSkin);

    // 覆盖全局对象，使的全局对象只会指向一个最新的皮肤
    window.MiniRefresh = MiniRefreshSkin;
    
    /**
     * 兼容require，为了方便使用，暴露出去的就是最终的皮肤
     * 如果要自己实现皮肤，也请在对应的皮肤中增加require支持
     */
    if (typeof module != 'undefined' && module.exports) {
        module.exports = MiniRefresh;
    } else if (typeof define == 'function' && (define.amd || define.cmd)) {
        define(function() {
            return MiniRefresh;
        });
    }

})(MiniRefreshTools);