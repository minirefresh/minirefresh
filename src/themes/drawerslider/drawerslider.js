const BaseTheme = MiniRefreshTools.theme.defaults;
const version = MiniRefreshTools.version;
const extend = MiniRefreshTools.extend;
const namespace = MiniRefreshTools.namespace;

/**
 * 一些默认提供的CSS类，一般来说不会变动（由框架提供的）
 * theme字段会根据不同的主题有不同值
 */
const CLASS_THEME = 'minirefresh-theme-drawerslider';

/**
 * 一些常量
 * 默认高度是200
 * 其中背景默认是黑色，内容是白色，再增设阻尼系数可以较好的达到3D效果
 */
const DEFAULT_DOWN_HEIGHT = 200;
const DOWN_SHADOW_HEIGHT = 2;

const defaultSetting = {
    down: {
        offset: 100,
        // 阻尼系数，下拉的距离大于offset时,改变下拉区域高度比例;值越接近0,高度变化越小,表现为越往下越难拉
        dampRate: 0.2,
        bounceTime: 500,
        successAnim: {
            // successAnim
            isEnable: false,
        },
        // 继承了default的downWrap部分代码，需要这个变量
        isWrapCssTranslate: true,
        // 是否scroll在下拉时会进行css移动，本主题关闭它，完全自定义
        // 这种方案记得修改动画区域的index
        isScrollCssTranslate: false,
    },
};

class MiniRefreshTheme extends BaseTheme {
    constructor(options) {
        const newOptions = extend(true, {}, defaultSetting, options);

        super(newOptions);
    }

    _initDownWrap() {
        // 复用
        super._initDownWrap();

        const container = this.container;
        const downWrap = this.downWrap;

        downWrap.innerHTML = ` 
            <div class="drawer">
                <div class="downwrap-content">
                    <p class="downwrap-progress"></p>
                    <p class="downwrap-tips">${this.options.down.contentdown}</p>
                </div>
                <div class="drawer-mask"></div>
            </div>
        `;

        // 由于直接继承的default，所以其实已经有default主题了，这里再加上本主题样式
        container.classList.add(CLASS_THEME);

        // 改写完后，对象需要重新查找
        this.downWrapProgress = downWrap.querySelector('.downwrap-progress');
        this.downWrapTips = downWrap.querySelector('.downwrap-tips');
        this.drawer = downWrap.querySelector('.drawer');
        this.drawerMask = downWrap.querySelector('.drawer-mask');

        // 留一个默认值，以免样式被覆盖，无法获取
        // 去除阴影的位置
        this.downWrapHeight = DOWN_SHADOW_HEIGHT + downWrap.offsetHeight || DEFAULT_DOWN_HEIGHT;
        // 由于downWrap被改变了，重新移动
        this._transformDownWrap(-this.downWrapHeight);
    }

    _transformDownWrap(offset, duration) {
        super._transformDownWrap(offset, duration);
        this._transformDrawer(offset, duration);
    }

    _transformDrawer(offset = 0, duration = 0) {
        if (!this.drawerMask) {
            return;
        }

        let opacity = (-offset - this.options.down.offset) / this.downWrapHeight;

        opacity = Math.min(1, opacity);
        opacity = Math.max(0, opacity);

        this.drawerMask.style.opacity = opacity;
        this.drawerMask.style.webkitTransitionDuration = `${duration}ms`;
        this.drawerMask.style.transitionDuration = `${duration}ms`;
    }

    
    /**
     * 重写下拉过程动画
     * @param {Number} downHight 当前下拉的高度
     * @param {Number} downOffset 下拉的阈值
     */
    _pullHook(downHight, downOffset) {
        // 复用default的同名函数代码
        super._pullHook(downHight, downOffset);
    }

    /**
     * 重写下拉动画
     */
    _downLoaingHook() {
        // loading中已经translate了
        super._downLoaingHook();
    }

    /**
     * 重写success 但是什么都不做
     */
    _downLoaingSuccessHook(isSuccess, successTips) {
        // 只改变状态
        super._downLoaingSuccessHook(isSuccess, successTips);
    }

    /**
     * 重写下拉end
     * @param {Boolean} isSuccess 是否成功
     */
    _downLoaingEndHook(isSuccess) {
        super._downLoaingEndHook(isSuccess);
    }

    /**
     * 取消loading的回调
     */
    _cancelLoaingHook() {
        super._cancelLoaingHook();
    }
}

MiniRefreshTheme.sign = 'drawerslider';
MiniRefreshTheme.version = version;
namespace('theme.drawerslider', MiniRefreshTheme);

export default MiniRefreshTheme;