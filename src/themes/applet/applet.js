const BaseTheme = MiniRefreshTools.theme.defaults;
const version = MiniRefreshTools.version;
const extend = MiniRefreshTools.extend;
const namespace = MiniRefreshTools.namespace;

/**
 * 一些默认提供的CSS类，一般来说不会变动（由框架提供的）
 * theme字段会根据不同的主题有不同值
 */
const CLASS_THEME = 'minirefresh-theme-applet';
const CLASS_DOWN_WRAP = 'minirefresh-downwrap';
const CLASS_HARDWARE_SPEEDUP = 'minirefresh-hardware-speedup';

/**
 * 本主题的特色样式
 */
const CLASS_DOWN_LOADING = 'loading-applet';
const CLASS_STATUS_DEFAULT = 'status-default';
const CLASS_STATUS_PULL = 'status-pull';
const CLASS_STATUS_LOADING = 'status-loading';
const CLASS_STATUS_SUCCESS = 'status-success';
const CLASS_STATUS_ERROR = 'status-error';

/**
 * 一些常量
 */
const DEFAULT_DOWN_HEIGHT = 50;

const defaultSetting = {
    down: {
        successAnim: {
            // 微信小程序没有successAnim 也没有文字提示
            isEnable: false,
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
            <div class="downwrap-content ball-beat">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
        container.insertBefore(downWrap, contentWrap);

        // 由于直接继承的default，所以其实已经有default主题了，这里再加上本主题样式
        container.classList.add(CLASS_THEME);

        this.downWrap = downWrap;
        // 是否能下拉的变量，控制pull时的状态转变
        this.isCanPullDown = false;
        // 留一个默认值，以免样式被覆盖，无法获取
        this.downWrapHeight = this.downWrap.offsetHeight || DEFAULT_DOWN_HEIGHT;
        this._transformDownWrap(-1 * this.downWrapHeight);
        BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
    }

    _transformDownWrap(offset, duration) {
        super._transformDownWrap(offset, duration);
    }

    /**
     * 重写下拉过程动画
     * @param {Number} downHight 当前下拉的高度
     * @param {Number} downOffset 下拉的阈值
     */
    _pullHook(downHight, downOffset) {
        if (downHight < downOffset) {
            const rate = downHight / downOffset;
            const offset = this.downWrapHeight * (-1 + rate);
            
            this._transformDownWrap(offset);
            if (this.isCanPullDown) {
                this.isCanPullDown = false;
                BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
            }
        } else {
            this._transformDownWrap(0);
            if (!this.isCanPullDown) {
                this.isCanPullDown = true;
                BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_PULL);
            }
        }
    }

    /**
     * 重写下拉动画
     */
    _downLoaingHook() {
        this.downWrap.classList.add(CLASS_DOWN_LOADING);
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
        this.downWrap.classList.remove(CLASS_DOWN_LOADING);
        this._transformDownWrap(-1 * this.downWrapHeight, this.options.down.bounceTime);
        // 需要重置回来
        this.isCanPullDown = false;
        BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
    }

    /**
     * 取消loading的回调
     */
    _cancelLoaingHook() {
        this._transformDownWrap(-1 * this.downWrapHeight, this.options.down.bounceTime);
        BaseTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
    }
}

MiniRefreshTheme.sign = 'applet';
MiniRefreshTheme.version = version;
namespace('theme.applet', MiniRefreshTheme);

export default MiniRefreshTheme;