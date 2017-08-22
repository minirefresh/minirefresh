/**
 * 仿淘宝下拉刷新皮肤
 * 继承自default
 */
(function(innerUtil) {
    // TODO: 秘密花园的后续待参考了淘宝后再决定，目前雏形已经有了
    
    /**
     * 一些默认提供的CSS类，一般来说不会变动（由框架提供的）
     * skin字段会根据不同的皮肤有不同值
     */
    var CLASS_SKIN = 'minirefresh-skin-applet';
    var CLASS_DOWN_WRAP = 'minirefresh-downwrap';
    var CLASS_HARDWARE_SPEEDUP = 'minirefresh-hardware-speedup';
    var CLASS_ROTATE = 'minirefresh-rotate';
    var CLASS_FADE_IN = 'minirefresh-fade-in';
    var CLASS_FADE_OUT = 'minirefresh-fade-out';
    var CLASS_HIDDEN = 'minirefresh-hidden';
    /**
     * 定义几个状态
     * 下拉刷新默认状态
     * 释放刷新状态
     * 准备进入秘密花园状态
     */
    var STATE_PULL_DEFAULT = 0;
    var STATE_PULL_READY_REFRESH = 1;
    var STATE_PULL_READY_SECRETGARDEN = 2;
    
    /**
     * 秘密花园的样式
     */
    var CLASS_SECRET_GARDEN = 'minirefresh-secret-garden';

    var defaultSetting = {
        down: {
            // 下拉100出现释放更新
            offset: 100,
            successAnim: {
                // successAnim
                enable: false,
            }, 
            // 本皮肤独有的效果
            secretGarden: {
                // 是否开启秘密花园（即类似淘宝二楼效果）
                enable: true,
                // 下拉超过200后可以出现秘密花园效果，注意，必须大于down的offset
                offset: 150,
                // 提示文字
                tips: '欢迎光临秘密花园'
            }
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
            downWrap.innerHTML = '<div class="downwrap-content"><p class="downwrap-progress"></p><p class="downwrap-tips">' + options.down.contentdown + ' </p></div>';
            container.insertBefore(downWrap, scrollWrap);

            // 由于直接继承的default，所以其实已经有default皮肤了，这里再加上本皮肤样式
            container.classList.add(CLASS_SKIN);

            this.downWrap = downWrap;
            this.downWrapProgress = this.downWrap.querySelector('.downwrap-progress');
            this.downWrapTips = this.downWrap.querySelector('.downwrap-tips');
            // 初始化为默认状态
            this.pullState = STATE_PULL_DEFAULT;
            this.downWrapHeight = this.downWrap.offsetHeight || 200;
            
            this._transformDownWrap(-1 * this.downWrapHeight);
        },
        _transformDownWrap: function(offset, duration) {
            offset = offset || 0;
            duration = duration || 0;
            // 记得动画时 translateZ 否则硬件加速会被覆盖
            this.downWrap.style.webkitTransitionDuration = duration + 'ms';
            this.downWrap.style.transitionDuration = duration + 'ms';
            this.downWrap.style.webkitTransform = 'translateY(' + offset + 'px)  translateZ(0px)';
            this.downWrap.style.transform = 'translateY(' + offset + 'px)  translateZ(0px)';
        },
        /**
         * 重写下拉过程动画
         * @param {Number} downHight
         * @param {Number} downOffset
         */
        _pullHook: function(downHight, downOffset) {
            var options = this.options,
                down = options.down,
                secretGarden = down.secretGarden.enable,
                secretGardenOffset = down.secretGarden.offset;
                
            var rate = downHight / downOffset,
                offset = this.downWrapHeight * (-1 + rate),
                progress = 360 * rate;

            this._transformDownWrap(-this.downWrapHeight + downHight);
            this.downWrapProgress.style.webkitTransform = "rotate(" + progress + "deg)";
            this.downWrapProgress.style.transform = "rotate(" + progress + "deg)";
            
            if (downHight < downOffset) {
                if (this.pullState !== STATE_PULL_DEFAULT) {
                    this.downWrapTips.innerText = down.contentdown;
                    this.pullState = STATE_PULL_DEFAULT;
                }
            } else if (downHight >= downOffset && (!secretGarden || downHight < secretGardenOffset)){               
                if (this.pullState !== STATE_PULL_READY_REFRESH) {
                    this.downWrapTips.innerText = down.contentover;
                    this.pullState = STATE_PULL_READY_REFRESH;
                }
            } else {
                if (this.pullState !== STATE_PULL_READY_SECRETGARDEN) {
                    this.downWrapTips.innerText = down.secretGarden.tips;
                    this.pullState = STATE_PULL_READY_SECRETGARDEN;
                }
            }
        },
        /**
         * 因为有自定义秘密花园的动画，所以需要实现这个hook，在特定条件下去除默认行为
         * @param {Number} downHight
         * @param {Number} downOffset
         */
        _beforeDownLoadingHook: function(downHight, downOffset) {            
            // 只要没有进入秘密花园，就仍然是以前的动作，否则downLoading都无法进入了，需要自定义实现
            if (this.pullState === STATE_PULL_READY_SECRETGARDEN) {
                this._inSecretGarden();
                return false;
            } else {
                return true;
            }
        },
        /**
         * 重写下拉动画
         * 秘密花园状态下无法进入
         */
        _downLoaingHook: function() {
            this.downWrapTips.innerText = this.options.down.contentrefresh;
            this.downWrapProgress.classList.add(CLASS_ROTATE);
            // 默认和scrollwrap的同步
            this._transformDownWrap(-this.downWrapHeight+this.options.down.offset, this.options.down.bounceTime);
        },
        /**
         * 重写success 但是什么都不做
         * 秘密花园状态下无法进入
         */
        _downLoaingSuccessHook: function() {},
        /**
         * 重写下拉end
         * 秘密花园状态下无法进入
         */
        _downLoaingEndHook: function(isSuccess) {
            this.downWrapTips.innerText = this.options.down.contentdown;
            this.downWrapProgress.classList.remove(CLASS_ROTATE);
            // 默认和scrollwrap的同步
            this._transformDownWrap(-this.downWrapHeight, this.options.down.bounceTime);
            // 需要重置回来
            this.pullState = STATE_PULL_DEFAULT;
        },
        /**
         * 进入秘密花园
         * 在秘密花园状态下走入的是这个实现
         */
        _inSecretGarden: function() {
            this.secretGarden = document.querySelector('.'+CLASS_SECRET_GARDEN);
            this.container.classList.add(CLASS_FADE_OUT);
            this.secretGarden.classList.remove(CLASS_HIDDEN);
            this.secretGarden.classList.add(CLASS_FADE_IN);
        },
    });

    // 挂载皮肤，这样多个皮肤可以并存
    innerUtil.namespace('skin.taobao', MiniRefreshSkin);

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