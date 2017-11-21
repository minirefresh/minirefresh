const BaseTheme = MiniRefreshTools.theme.defaults;
const version = MiniRefreshTools.version;
const extend = MiniRefreshTools.extend;
const namespace = MiniRefreshTools.namespace;

/**
 * 一些默认提供的CSS类，一般来说不会变动（由框架提供的）
 * theme字段会根据不同的主题有不同值
 */
const CLASS_THEME = 'minirefresh-theme-taobao';
const CLASS_DOWN_WRAP = 'minirefresh-downwrap';
const CLASS_HARDWARE_SPEEDUP = 'minirefresh-hardware-speedup';
const CLASS_ROTATE = 'minirefresh-rotate';
const CLASS_HIDDEN = 'minirefresh-hidden';

/**
 * 定义几个状态
 * 默认状态
 * 下拉刷新状态
 * 释放刷新状态
 * 准备进入秘密花园状态
 */
const STATE_PULL_DEFAULT = 0;
const STATE_PULL_DOWN = 1;
const STATE_PULL_READY_REFRESH = 2;
const STATE_PULL_READY_SECRETGARDEN = 3;

/**
 * 一些常量
 */
const DEFAULT_DOWN_HEIGHT = 800;

/**
 * 一些样式
 */
const CLASS_SECRET_GARDEN_BG_IN = 'secret-garden-bg-in';
const CLASS_SECRET_GARDEN_BG_OUT = 'secret-garden-bg-out';
const CLASS_SECRET_GARDEN_MOON_IN = 'secret-garden-moon-in';
const CLASS_SECRET_GARDEN_MOON_OUT = 'secret-garden-moon-out';
const CLASS_STATUS_DEFAULT = 'status-default';
const CLASS_STATUS_PULL = 'status-pull';
const CLASS_STATUS_LOADING = 'status-loading';
const CLASS_STATUS_SUCCESS = 'status-success';
const CLASS_STATUS_ERROR = 'status-error';

const defaultSetting = {
    down: {
        // 下拉100出现释放更新
        offset: 100,
        dampRate: 0.4,
        successAnim: {
            // successAnim
            isEnable: false,
        },
        // 本主题独有的效果
        secretGarden: {
            // 是否开启秘密花园（即类似淘宝二楼效果）
            isEnable: true,
            // 下拉超过200后可以出现秘密花园效果，注意，必须大于down的offset
            offset: 200,
            // 提示文字
            tips: '欢迎光临秘密花园',
            inSecretGarden: null,
        },
        // 继承了default的downWrap部分代码，需要这个变量
        isWrapCssTranslate: true,
    },
};

class MiniRefreshTheme extends BaseTheme {
    constructor(options) {
        const newOptions = extend(true, {}, defaultSetting, options);

        super(newOptions);
    }

    /**
     * 重写下拉刷新初始化，变为小程序自己的动画
     */
    _initDownWrap() {
        const container = this.container;
        const contentWrap = this.contentWrap;
        const downWrap = document.createElement('div');

        downWrap.className = `${CLASS_DOWN_WRAP} ${CLASS_HARDWARE_SPEEDUP}`;
        downWrap.innerHTML = ` 
            <div class="downwrap-bg"></div>
            <div class="downwrap-moon"></div>
            <div class="downwrap-content">
                <p class="downwrap-progress"></p>
                <p class="downwrap-tips">${this.options.down.contentdown}</p>
            </div>
        `;
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
        BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
    }

    _transformDownWrap(offset, duration) {
        super._transformDownWrap(offset, duration);
    }

    /**
     * 旋转进度条
     * @param {Number} progress 对应需要选择的进度
     */
    _rotateDownProgress(progress) {
        const rotateStr = `rotate(${progress}deg)`;

        this.downWrapProgress.style.webkitTransform = rotateStr;
        this.downWrapProgress.style.transform = rotateStr;
    }

    /**
     * 重写下拉过程动画
     * @param {Number} downHight 当前下拉的高度
     * @param {Number} downOffset 下拉的阈值
     */
    _pullHook(downHight, downOffset) {
        const options = this.options;
        const down = options.down;
        const secretGarden = down.secretGarden.isEnable;
        const secretGardenOffset = down.secretGarden.offset;
        const FULL_DEGREE = 360;
        const rate = downHight / downOffset;
        const progress = FULL_DEGREE * rate;

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
                BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
            }
        } else if (downHight >= downOffset && (!secretGarden || downHight < secretGardenOffset)) {
            if (this.pullState !== STATE_PULL_READY_REFRESH) {
                this.downWrapTips.classList.remove(CLASS_HIDDEN);
                this.downWrapProgress.classList.remove(CLASS_HIDDEN);
                this.downWrapTips.innerText = down.contentover;
                this.pullState = STATE_PULL_READY_REFRESH;
                BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_PULL);
            }
        } else if (this.pullState !== STATE_PULL_READY_SECRETGARDEN) {
            this.downWrapTips.classList.remove(CLASS_HIDDEN);
            this.downWrapProgress.classList.add(CLASS_HIDDEN);
            this.downWrapTips.innerText = down.secretGarden.tips;
            this.pullState = STATE_PULL_READY_SECRETGARDEN;
        }
    }

    /**
     * 因为有自定义秘密花园的动画，所以需要实现这个hook，在特定条件下去除默认行为
     * @return {Boolean} 返回false就不再进入下拉loading，默认为true
     */
    _beforeDownLoadingHook() {
        // 只要没有进入秘密花园，就仍然是以前的动作，否则downLoading都无法进入了，需要自定义实现
        if (this.pullState === STATE_PULL_READY_SECRETGARDEN) {
            this._inSecretGarden();

            return false;
        }
        
        return true;
    }

    /**
     * 重写下拉动画
     * 秘密花园状态下无法进入
     */
    _downLoaingHook() {
        this.downWrapTips.innerText = this.options.down.contentrefresh;
        this.downWrapProgress.classList.add(CLASS_ROTATE);
        // 默认和contentWrap的同步
        this._transformDownWrap(
            -this.downWrapHeight + this.options.down.offset,
            this.options.down.bounceTime);

        BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_LOADING);
    }

    /**
     * 重写success 但是什么都不做
     */
    _downLoaingSuccessHook(isSuccess) {
        // 只改变状态
        BaseTheme._changeWrapStatusClass(
            this.downWrap,
            isSuccess ? CLASS_STATUS_SUCCESS : CLASS_STATUS_ERROR);
    }

    /**
     * 重写下拉end
     */
    _downLoaingEndHook() {
        this.downWrapTips.innerText = this.options.down.contentdown;
        this.downWrapProgress.classList.remove(CLASS_ROTATE);
        // 默认和contentWrap的同步
        this._transformDownWrap(-this.downWrapHeight, this.options.down.bounceTime);
        // 需要重置回来
        this.pullState = STATE_PULL_DEFAULT;

        BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
    }

    /**
     * 取消loading的回调
     */
    _cancelLoaingHook() {
        // 默认和contentWrap的同步
        this._transformDownWrap(-this.downWrapHeight, this.options.down.bounceTime);
        this.pullState = STATE_PULL_DEFAULT;
        BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
    }

    /**
     * 秘密花园的动画
     * @param {Boolean} isInAnim 是否是进入
     */
    _secretGardenAnimation(isInAnim) {
        const bgAnimClassAdd = isInAnim
            ? CLASS_SECRET_GARDEN_BG_IN
            : CLASS_SECRET_GARDEN_BG_OUT;
        const bgAnimClassRemove = isInAnim
            ? CLASS_SECRET_GARDEN_BG_OUT
            : CLASS_SECRET_GARDEN_BG_IN;
        const moonAnimClassAdd = isInAnim
            ? CLASS_SECRET_GARDEN_MOON_IN
            : CLASS_SECRET_GARDEN_MOON_OUT;
        const moonAnimClassRemove = isInAnim
            ? CLASS_SECRET_GARDEN_MOON_OUT
            : CLASS_SECRET_GARDEN_MOON_IN;

        // 动画变为加载特定的css样式，这样便于外部修改
        this.downWrapBg.classList.remove(bgAnimClassRemove);
        this.downWrapBg.classList.add(bgAnimClassAdd);

        this.downWrapMoon.classList.remove(moonAnimClassRemove);
        this.downWrapMoon.classList.add(moonAnimClassAdd);
    }

    /**
     * 进入秘密花园
     * 在秘密花园状态下走入的是这个实现
     */
    _inSecretGarden() {
        const downBounceTime = this.options.down.bounceTime;
        const inSecretGardenCb = this.options.down.secretGarden.inSecretGarden;
        const docClientHeight = document.documentElement.clientHeight;

        this.downWrapTips.classList.add(CLASS_HIDDEN);
        // 动画
        this.scroller.translateContentWrap(docClientHeight, downBounceTime);
        this._transformDownWrap(
            docClientHeight - this.downWrapHeight,
            downBounceTime);
        this._secretGardenAnimation(true);
        inSecretGardenCb && inSecretGardenCb();
    }

    /**
     * 重置秘密花园
     */
    resetSecretGarden() {
        const downBounceTime = this.options.down.bounceTime;

        // 重置scroll
        this.scroller.translateContentWrap(0, downBounceTime);
        // 重置动画区域的wrap
        this._transformDownWrap(-1 * this.downWrapHeight, downBounceTime);
        this._secretGardenAnimation(false);
        // 需要重置回来
        this.pullState = STATE_PULL_DEFAULT;
    }
}

MiniRefreshTheme.sign = 'taobao';
MiniRefreshTheme.version = version;
namespace('theme.taobao', MiniRefreshTheme);

export default MiniRefreshTheme;