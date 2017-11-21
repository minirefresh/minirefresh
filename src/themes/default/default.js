const Core = MiniRefreshTools.Core;
const version = MiniRefreshTools.version;
const extend = MiniRefreshTools.extend;
const namespace = MiniRefreshTools.namespace;

/**
 * 一些默认提供的CSS类，一般来说不会变动（由框架提供的）
 * THEME 字段会根据不同的主题有不同值
 * 在使用body的scroll时，需要加上样式 CLASS_BODY_SCROLL_WRAP
 */
const CLASS_THEME = 'minirefresh-theme-default';
const CLASS_DOWN_WRAP = 'minirefresh-downwrap';
const CLASS_UP_WRAP = 'minirefresh-upwrap';
const CLASS_FADE_IN = 'minirefresh-fade-in';
const CLASS_FADE_OUT = 'minirefresh-fade-out';
const CLASS_TO_TOP = 'minirefresh-totop';
const CLASS_ROTATE = 'minirefresh-rotate';
const CLASS_HARDWARE_SPEEDUP = 'minirefresh-hardware-speedup';
const CLASS_HIDDEN = 'minirefresh-hidden';
const CLASS_BODY_SCROLL_WRAP = 'body-scroll-wrap';

/**
 * 本主题的特色样式
 */
const CLASS_DOWN_SUCCESS = 'downwrap-success';
const CLASS_DOWN_ERROR = 'downwrap-error';
const CLASS_STATUS_DEFAULT = 'status-default';
const CLASS_STATUS_PULL = 'status-pull';
const CLASS_STATUS_LOADING = 'status-loading';
const CLASS_STATUS_SUCCESS = 'status-success';
const CLASS_STATUS_ERROR = 'status-error';
const CLASS_STATUS_NOMORE = 'status-nomore';

/**
 * 一些常量
 */
const DEFAULT_DOWN_HEIGHT = 75;

const defaultSetting = {
    down: {
        successAnim: {
            // 下拉刷新结束后是否有成功动画，默认为false，如果想要有成功刷新xxx条数据这种操作，请设为true，并实现对应hook函数
            isEnable: false,
            duration: 300,
        },
        // 可选，在下拉可刷新状态时，下拉刷新控件上显示的标题内容
        contentdown: '下拉刷新',
        // 可选，在释放可刷新状态时，下拉刷新控件上显示的标题内容
        contentover: '释放刷新',
        // 可选，正在刷新状态时，下拉刷新控件上显示的标题内容
        contentrefresh: '加载中...',
        // 可选，刷新成功的提示，当开启successAnim时才有效
        contentsuccess: '刷新成功',
        // 可选，刷新失败的提示，错误回调用到，当开启successAnim时才有效
        contenterror: '刷新失败',
        // 是否默认跟随进行css动画
        isWrapCssTranslate: false,
    },
    up: {
        toTop: {
            // 是否开启点击回到顶部
            isEnable: true,
            duration: 300,
            // 滚动多少距离才显示toTop
            offset: 800,
        },
        // 默认为空，可以自行改为 上拉显示更多 等
        contentdown: '',
        contentrefresh: '加载中...',
        contentnomore: '没有更多数据了',
    },
};

class MiniRefreshTheme extends Core {
    /**
     * 构造，使用新的默认参数
     * @param {Object} options 配置信息
     * @constructor
     */
    constructor(options) {
        const newOptions = extend(true, {}, defaultSetting, options);

        super(newOptions);
    }

    _initHook() {
        const container = this.container;
        const contentWrap = this.contentWrap;

        container.classList.add(CLASS_THEME);
        // 加上硬件加速让动画更流畅
        contentWrap.classList.add(CLASS_HARDWARE_SPEEDUP);

        if (this.options.isUseBodyScroll) {
            // 如果使用了body的scroll，需要增加对应的样式，否则默认的absolute无法被监听到
            container.classList.add(CLASS_BODY_SCROLL_WRAP);
            contentWrap.classList.add(CLASS_BODY_SCROLL_WRAP);
        }

        this._initDownWrap();
        this._initUpWrap();
        this._initToTop();
    }

    /**
     * 刷新的实现，需要根据新配置进行一些更改
     */
    _refreshHook() {
        // 如果开关csstranslate，需要兼容
        if (this.options.down.isWrapCssTranslate) {
            this._transformDownWrap(-this.downWrapHeight);
        } else {
            this._transformDownWrap(0, 0, true);
        }

        // toTop的显影控制，如果本身显示了，又更新为隐藏，需要马上隐藏
        if (!this.options.up.toTop.isEnable) {
            this.toTopBtn && this.toTopBtn.classList.add(CLASS_HIDDEN);
            this.isShowToTopBtn = false;
        }
    }

    static _changeWrapStatusClass(wrap, statusClass) {
        wrap.classList.remove(CLASS_STATUS_NOMORE);
        wrap.classList.remove(CLASS_STATUS_DEFAULT);
        wrap.classList.remove(CLASS_STATUS_PULL);
        wrap.classList.remove(CLASS_STATUS_LOADING);
        wrap.classList.remove(CLASS_STATUS_SUCCESS);
        wrap.classList.remove(CLASS_STATUS_ERROR);
        wrap.classList.add(statusClass);
    }

    _initDownWrap() {
        const container = this.container;
        const contentWrap = this.contentWrap;
        const options = this.options;

        // 下拉的区域
        const downWrap = document.createElement('div');

        downWrap.className = `${CLASS_DOWN_WRAP} ${CLASS_HARDWARE_SPEEDUP}`;
        downWrap.innerHTML = ` 
            <div class="downwrap-content">
                <p class="downwrap-progress"></p>
                <p class="downwrap-tips">${options.down.contentdown}</p>
            </div>
        `;
        container.insertBefore(downWrap, contentWrap);

        this.downWrap = downWrap;
        this.downWrapProgress = this.downWrap.querySelector('.downwrap-progress');
        this.downWrapTips = this.downWrap.querySelector('.downwrap-tips');
        // 是否能下拉的变量，控制pull时的状态转变
        this.isCanPullDown = false;
        this.downWrapHeight = downWrap.offsetHeight || DEFAULT_DOWN_HEIGHT;
        this._transformDownWrap(-this.downWrapHeight);
        MiniRefreshTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
    }

    _transformDownWrap(offset = 0, duration = 0, isForce) {
        if (!isForce && !this.options.down.isWrapCssTranslate) {
            // 哪怕关闭了isWrapCssTranslate，也可以通过isForce参数强制移动
            return;
        }

        const duratuinStr = `${duration}ms`;
        const transformStr = `translateY(${offset}px)  translateZ(0px)`;

        // 记得动画时 translateZ 否则硬件加速会被覆盖
        this.downWrap.style.webkitTransitionDuration = duratuinStr;
        this.downWrap.style.transitionDuration = duratuinStr;
        this.downWrap.style.webkitTransform = transformStr;
        this.downWrap.style.transform = transformStr;
    }

    _initUpWrap() {
        const contentWrap = this.contentWrap;
        const options = this.options;

        // 上拉区域
        const upWrap = document.createElement('div');

        upWrap.className = `${CLASS_UP_WRAP} ${CLASS_HARDWARE_SPEEDUP}`;
        upWrap.innerHTML = ` 
            <p class="upwrap-progress"></p>
            <p class="upwrap-tips">${options.up.contentdown}</p>
        `;

        upWrap.style.visibility = 'hidden';
        // 加到container中
        contentWrap.appendChild(upWrap);

        this.upWrap = upWrap;
        this.upWrapProgress = this.upWrap.querySelector('.upwrap-progress');
        this.upWrapTips = this.upWrap.querySelector('.upwrap-tips');
        MiniRefreshTheme._changeWrapStatusClass(this.upWrap, CLASS_STATUS_DEFAULT);
    }

    /**
     * 自定义实现一个toTop，由于这个是属于额外的事件所以没有添加的核心中，而是由各自的主题决定是否实现或者实现成什么样子
     * 不过框架中仍然提供了一个默认的minirefresh-totop样式，可以方便使用
     */
    _initToTop() {
        const options = this.options;
        const toTop = options.up.toTop.isEnable;
        const duration = options.up.toTop.duration;

        if (toTop) {
            const toTopBtn = document.createElement('div');

            toTopBtn.className = `${CLASS_TO_TOP} ${CLASS_THEME}`;

            toTopBtn.onclick = () => {
                this.scroller.scrollTo(0, duration);
            };
            toTopBtn.classList.add(CLASS_HIDDEN);
            this.toTopBtn = toTopBtn;
            this.isShowToTopBtn = false;
            // 默认添加到body中防止冲突
            // 需要添加到container，否则多个totop无法识别
            this.container.appendChild(toTopBtn);
        }
    }

    _pullHook(downHight, downOffset) {
        const options = this.options;
        const FULL_DEGREE = 360;

        if (downHight < downOffset) {
            if (this.isCanPullDown) {
                this.isCanPullDown = false;
                MiniRefreshTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
                this.downWrapTips.innerText = options.down.contentdown;
            }
        } else if (!this.isCanPullDown) {
            this.downWrapTips.innerText = options.down.contentover;
            this.isCanPullDown = true;
            MiniRefreshTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_PULL);
        }

        if (this.downWrapProgress) {
            const rate = downHight / downOffset;
            const progress = FULL_DEGREE * rate;
            const rotateStr = `rotate(${progress}deg)`;

            this.downWrapProgress.style.webkitTransform = rotateStr;
            this.downWrapProgress.style.transform = rotateStr;
        }

        this._transformDownWrap(-this.downWrapHeight + downHight);
    }

    _scrollHook(scrollTop) {
        // 用来判断toTop
        const options = this.options;
        const toTop = options.up.toTop.isEnable;
        const toTopBtn = this.toTopBtn;

        if (toTop && toTopBtn) {
            if (scrollTop >= options.up.toTop.offset) {
                if (!this.isShowToTopBtn) {
                    toTopBtn.classList.remove(CLASS_FADE_OUT);
                    toTopBtn.classList.remove(CLASS_HIDDEN);
                    toTopBtn.classList.add(CLASS_FADE_IN);
                    this.isShowToTopBtn = true;
                }
            } else if (this.isShowToTopBtn) {
                toTopBtn.classList.add(CLASS_FADE_OUT);
                toTopBtn.classList.remove(CLASS_FADE_IN);
                this.isShowToTopBtn = false;
            }
        }
    }

    _downLoaingHook() {
        // 默认和contentWrap的同步
        this._transformDownWrap(-this.downWrapHeight + this.options.down.offset,
            this.options.down.bounceTime);
        this.downWrapTips.innerText = this.options.down.contentrefresh;
        this.downWrapProgress.classList.add(CLASS_ROTATE);
        MiniRefreshTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_LOADING);
    }

    _downLoaingSuccessHook(isSuccess, successTips) {
        this.options.down.contentsuccess = successTips || this.options.down.contentsuccess;
        this.downWrapTips.innerText = isSuccess ?
            this.options.down.contentsuccess :
            this.options.down.contenterror;
        this.downWrapProgress.classList.remove(CLASS_ROTATE);
        this.downWrapProgress.classList.add(CLASS_FADE_OUT);
        this.downWrapProgress.classList.add(isSuccess ? CLASS_DOWN_SUCCESS : CLASS_DOWN_ERROR);

        MiniRefreshTheme._changeWrapStatusClass(
            this.downWrap,
            isSuccess ? CLASS_STATUS_SUCCESS : CLASS_STATUS_ERROR);
    }

    _downLoaingEndHook(isSuccess) {
        this.downWrapTips.innerText = this.options.down.contentdown;
        this.downWrapProgress.classList.remove(CLASS_ROTATE);
        this.downWrapProgress.classList.remove(CLASS_FADE_OUT);
        this.downWrapProgress.classList.remove(isSuccess ? CLASS_DOWN_SUCCESS : CLASS_DOWN_ERROR);
        // 默认为不可见
        // 需要重置回来
        this.isCanPullDown = false;
        this._transformDownWrap(-this.downWrapHeight, this.options.down.bounceTime);
        MiniRefreshTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
    }

    _cancelLoaingHook() {
        this._transformDownWrap(-this.downWrapHeight, this.options.down.bounceTime);
        MiniRefreshTheme._changeWrapStatusClass(this.downWrap, CLASS_STATUS_DEFAULT);
    }

    _upLoaingHook(isShowUpLoading) {
        if (isShowUpLoading) {
            this.upWrapTips.innerText = this.options.up.contentrefresh;
            this.upWrapProgress.classList.add(CLASS_ROTATE);
            this.upWrapProgress.classList.remove(CLASS_HIDDEN);
            this.upWrap.style.visibility = 'visible';
        } else {
            this.upWrap.style.visibility = 'hidden';
        }
        MiniRefreshTheme._changeWrapStatusClass(this.upWrap, CLASS_STATUS_LOADING);
    }

    _upLoaingEndHook(isFinishUp) {
        if (!isFinishUp) {
            // 接下来还可以加载更多
            // this.upWrap.style.visibility = 'hidden';
            this.upWrapTips.innerText = this.options.up.contentdown;
            MiniRefreshTheme._changeWrapStatusClass(this.upWrap, CLASS_STATUS_DEFAULT);
        } else {
            // 已经没有更多数据了
            // this.upWrap.style.visibility = 'visible';
            this.upWrapTips.innerText = this.options.up.contentnomore;
            MiniRefreshTheme._changeWrapStatusClass(this.upWrap, CLASS_STATUS_NOMORE);
        }
        this.upWrapProgress.classList.remove(CLASS_ROTATE);
        this.upWrapProgress.classList.add(CLASS_HIDDEN);
    }

    _resetUpLoadingHook() {
        // this.upWrap.style.visibility = 'hidden';
        this.upWrapTips.innerText = this.options.up.contentdown;
        this.upWrapProgress.classList.remove(CLASS_ROTATE);
        this.upWrapProgress.classList.add(CLASS_HIDDEN);
        MiniRefreshTheme._changeWrapStatusClass(this.upWrap, CLASS_STATUS_DEFAULT);
    }

    _lockUpLoadingHook(isLock) {
        this.upWrap.style.visibility = isLock ? 'hidden' : 'visible';
    }

    _lockDownLoadingHook(isLock) {
        this.downWrap.style.visibility = isLock ? 'hidden' : 'visible';
    }
}

MiniRefreshTheme.sign = 'default';
MiniRefreshTheme.version = version;
namespace('theme.defaults', MiniRefreshTheme);

// 覆盖全局变量
window.MiniRefresh = MiniRefreshTheme;

export default MiniRefreshTheme;