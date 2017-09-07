/**
 * 仿淘宝下拉刷新主题
 * 继承自default
 */
(function(innerUtil, globalContext) {

    /**
     * 一些默认提供的CSS类，一般来说不会变动（由框架提供的）
     * theme字段会根据不同的主题有不同值
     */
    var CLASS_THEME = 'minirefresh-theme-taobao';
    var CLASS_DOWN_WRAP = 'minirefresh-downwrap';
    var CLASS_HARDWARE_SPEEDUP = 'minirefresh-hardware-speedup';
    var CLASS_ROTATE = 'minirefresh-rotate';
    var CLASS_HIDDEN = 'minirefresh-hidden';

    /**
     * 定义几个状态
     * 默认状态
     * 下拉刷新状态
     * 释放刷新状态
     * 准备进入秘密花园状态
     */
    var STATE_PULL_DEFAULT = 0;
    var STATE_PULL_DOWN = 1;
    var STATE_PULL_READY_REFRESH = 2;
    var STATE_PULL_READY_SECRETGARDEN = 3;

    /**
     * 一些常量
     */
    var DEFAULT_DOWN_HEIGHT = 800;

    /**
     * 一些样式
     */
    var CLASS_SECRET_GARDEN_BG_IN = 'secret-garden-bg-in';
    var CLASS_SECRET_GARDEN_BG_OUT = 'secret-garden-bg-out';
    var CLASS_SECRET_GARDEN_MOON_IN = 'secret-garden-moon-in';
    var CLASS_SECRET_GARDEN_MOON_OUT = 'secret-garden-moon-out';

    var defaultSetting = {
        down: {
            // 下拉100出现释放更新
            offset: 100,
            dampRate: 0.4,
            successAnim: {
                // successAnim
                isEnable: false
            },
            // 本主题独有的效果
            secretGarden: {
                // 是否开启秘密花园（即类似淘宝二楼效果）
                isEnable: true,
                // 下拉超过200后可以出现秘密花园效果，注意，必须大于down的offset
                offset: 200,
                // 提示文字
                tips: '欢迎光临秘密花园',
                inSecretGarden: innerUtil.noop
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
                contentWrap = this.contentWrap,
                options = this.options;

            // 下拉的区域
            var downWrap = document.createElement('div');

            downWrap.className = CLASS_DOWN_WRAP + ' ' + CLASS_HARDWARE_SPEEDUP;
            downWrap.innerHTML = '<div class="downwrap-bg"></div>' +
                '<div class="downwrap-moon"></div>' +
                '<div class="downwrap-content">' +
                '<p class="downwrap-progress"></p>' +
                '<p class="downwrap-tips">' +
                options.down.contentdown +
                '</p>' +
                '</div>';
            container.insertBefore(downWrap, contentWrap);

            // 由于直接继承的default，所以其实已经有default主题了，这里再加上本主题样式
            container.classList.add(CLASS_THEME);

            this.downWrap = downWrap;
            this.downWrapProgress = this.downWrap.querySelector('.downwrap-progress');
            this.downWrapTips = this.downWrap.querySelector('.downwrap-tips');
            // 进入秘密花园后有背景和月亮的动画
            this.downWrapBg = this.downWrap.querySelector('.downwrap-bg');
            this.downWrapMoon = this.downWrap.querySelector('.downwrap-moon');
            // 初始化为默认状态
            this.pullState = STATE_PULL_DEFAULT;
            this.downWrapHeight = this.downWrap.offsetHeight || DEFAULT_DOWN_HEIGHT;

            this._transformDownWrap(-1 * this.downWrapHeight);
        },
        _transformDownWrap: function(offset, duration) {
            this._super(offset, duration);
        },

        /**
         * 旋转进度条
         * @param {Number} progress 对应需要选择的进度
         */
        _rotateDownProgress: function(progress) {
            this.downWrapProgress.style.webkitTransform = 'rotate(' + progress + 'deg)';
            this.downWrapProgress.style.transform = 'rotate(' + progress + 'deg)';
        },

        /**
         * 重写下拉过程动画
         * @param {Number} downHight 当前下拉高度
         * @param {Number} downOffset 下拉阈值
         */
        _pullHook: function(downHight, downOffset) {
            var options = this.options,
                down = options.down,
                secretGarden = down.secretGarden.isEnable,
                secretGardenOffset = down.secretGarden.offset,
                FULL_DEGREE = 360;

            var rate = downHight / downOffset,
                progress = FULL_DEGREE * rate;

            this._transformDownWrap(-this.downWrapHeight + downHight);
            this._rotateDownProgress(progress);

            if (downHight < downOffset) {
                if (this.pullState !== STATE_PULL_DOWN) {
                    // tips-down中需要移除bg的动画样式，如果不移除， downWrapTips修改innerText修改后可能无法重新渲染
                    this.downWrapBg.classList.remove(CLASS_SECRET_GARDEN_BG_OUT);
                    this.downWrapMoon.classList.remove(CLASS_SECRET_GARDEN_MOON_OUT);

                    this.downWrapTips.classList.remove(CLASS_HIDDEN);
                    this.downWrapProgress.classList.remove(CLASS_HIDDEN);
                    this.downWrapTips.innerText = down.contentdown;
                    this.pullState = STATE_PULL_DOWN;
                }
            } else if (downHight >= downOffset && (!secretGarden || downHight < secretGardenOffset)) {
                if (this.pullState !== STATE_PULL_READY_REFRESH) {
                    this.downWrapTips.classList.remove(CLASS_HIDDEN);
                    this.downWrapProgress.classList.remove(CLASS_HIDDEN);
                    this.downWrapTips.innerText = down.contentover;
                    this.pullState = STATE_PULL_READY_REFRESH;
                }
            } else {
                if (this.pullState !== STATE_PULL_READY_SECRETGARDEN) {
                    this.downWrapTips.classList.remove(CLASS_HIDDEN);
                    this.downWrapProgress.classList.add(CLASS_HIDDEN);
                    this.downWrapTips.innerText = down.secretGarden.tips;
                    this.pullState = STATE_PULL_READY_SECRETGARDEN;
                }
            }
        },

        /**
         * 因为有自定义秘密花园的动画，所以需要实现这个hook，在特定条件下去除默认行为
         * @param {Number} downHight 当前已经下拉的高度
         * @param {Number} downOffset 下拉阈值
         * @return {Boolean} 返回false就不再进入下拉loading，默认为true
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
            // 默认和contentWrap的同步
            this._transformDownWrap(-this.downWrapHeight + this.options.down.offset, this.options.down.bounceTime);
        },

        /**
         * 重写success 但是什么都不做
         * 秘密花园状态下无法进入
         */
        _downLoaingSuccessHook: function() {},

        /**
         * 重写下拉end
         * 秘密花园状态下无法进入
         * @param {Boolean} isSuccess 是否下拉请求成功
         */
        _downLoaingEndHook: function(isSuccess) {
            this.downWrapTips.innerText = this.options.down.contentdown;
            this.downWrapProgress.classList.remove(CLASS_ROTATE);
            // 默认和contentWrap的同步
            this._transformDownWrap(-this.downWrapHeight, this.options.down.bounceTime);
            // 需要重置回来
            this.pullState = STATE_PULL_DEFAULT;
        },

        /**
         * 取消loading的回调
         */
        _cancelLoaingHook: function() {
            // 默认和contentWrap的同步
            this._transformDownWrap(-this.downWrapHeight, this.options.down.bounceTime);
            this.pullState = STATE_PULL_DEFAULT;
        },

        /**
         * 秘密花园的动画
         * @param {Boolean} isInAnim 是否是进入
         */
        _secretGardenAnimation: function(isInAnim) {
            var bgAnimClassAdd = isInAnim ? CLASS_SECRET_GARDEN_BG_IN : CLASS_SECRET_GARDEN_BG_OUT,
                bgAnimClassRemove = isInAnim ? CLASS_SECRET_GARDEN_BG_OUT : CLASS_SECRET_GARDEN_BG_IN,
                moonAnimClassAdd = isInAnim ? CLASS_SECRET_GARDEN_MOON_IN : CLASS_SECRET_GARDEN_MOON_OUT,
                moonAnimClassRemove = isInAnim ? CLASS_SECRET_GARDEN_MOON_OUT : CLASS_SECRET_GARDEN_MOON_IN;

            // 动画变为加载特定的css样式，这样便于外部修改
            this.downWrapBg.classList.remove(bgAnimClassRemove);
            this.downWrapBg.classList.add(bgAnimClassAdd);

            this.downWrapMoon.classList.remove(moonAnimClassRemove);
            this.downWrapMoon.classList.add(moonAnimClassAdd);
        },

        /**
         * 进入秘密花园
         * 在秘密花园状态下走入的是这个实现
         */
        _inSecretGarden: function() {
            var downBounceTime = this.options.down.bounceTime,
                inSecretGardenCb = this.options.down.secretGarden.inSecretGarden;

            this.downWrapTips.classList.add(CLASS_HIDDEN);
            // 动画
            this.scroller.translateContentWrap(this.contentWrap.clientHeight, downBounceTime);
            this._transformDownWrap(this.contentWrap.clientHeight - this.downWrapHeight, downBounceTime);
            this._secretGardenAnimation(true);
            inSecretGardenCb && inSecretGardenCb();
        },

        /**
         * 重置秘密花园
         */
        resetSecretGarden: function() {
            var downBounceTime = this.options.down.bounceTime;

            // 重置scroll
            this.scroller.translateContentWrap(0, downBounceTime);
            // 重置动画区域的wrap
            this._transformDownWrap(-1 * this.downWrapHeight, downBounceTime);
            this._secretGardenAnimation(false);
            // 需要重置回来
            this.pullState = STATE_PULL_DEFAULT;
        }
    });

    // 挂载主题，这样多个主题可以并存
    innerUtil.namespace('theme.taobao', MiniRefreshTheme);

    // 覆盖全局对象，使的全局对象只会指向一个最新的主题
    globalContext.MiniRefresh = MiniRefreshTheme;

})(MiniRefreshTools, typeof window !== 'undefined' ? window : global);