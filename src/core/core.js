import {
    noop,
    extend,
    selector,
} from '../util/lang';
import osMixin from '../mixin/os';
import Scroll from './scroll';

const defaultSetting = {
    // 下拉有关
    down: {
        // 默认没有锁定，可以通过API动态设置
        isLock: false,
        // 是否自动下拉刷新
        isAuto: false,
        // 设置isAuto=true时生效，是否在初始化的下拉刷新触发事件中显示动画，如果是false，初始化的加载只会触发回调，不会触发动画
        isAllowAutoLoading: true,
        // 是否不管任何情况下都能触发下拉刷新，为false的话当上拉时不会触发下拉
        isAways: false,
        // 是否scroll在下拉时会进行移动(css3)，通过关闭它可以实现自定义动画
        isScrollCssTranslate: true,
        // 是否每次下拉完毕后默认重置上拉
        isAutoResetUpLoading: true,
        // 下拉要大于多少长度后再下拉刷新
        offset: 75,
        // 阻尼系数，下拉小于offset时的阻尼系数，值越接近0,高度变化越小,表现为越往下越难拉
        dampRateBegin: 1,
        // 阻尼系数，下拉的距离大于offset时,改变下拉区域高度比例;值越接近0,高度变化越小,表现为越往下越难拉
        dampRate: 0.3,
        // 回弹动画时间
        bounceTime: 300,
        successAnim: {
            // 下拉刷新结束后是否有成功动画，默认为false，如果想要有成功刷新xxx条数据这种操作，请设为true，并实现对应hook函数
            isEnable: false,
            duration: 300,
        },
        // 下拉时会提供回调，默认为null不会执行
        onPull: null,
        // 取消时回调
        onCalcel: null,
        callback: noop,
    },
    // 上拉有关
    up: {
        // 默认没有锁定，可以通过API动态设置
        isLock: false,
        // 是否自动上拉加载-初始化是是否自动
        isAuto: true,
        // 是否默认显示上拉进度条，可以通过API改变
        isShowUpLoading: true,
        // 距离底部高度(到达该高度即触发)
        offset: 100,
        loadFull: {
            // 开启配置后，只要没满屏幕，就会自动加载
            isEnable: true,
            delay: 300,
        },
        // 滚动时会提供回调，默认为null不会执行
        onScroll: null,
        callback: noop,
    },
    // 容器
    container: '#minirefresh',
    // 是否锁定横向滑动，如果锁定则原生滚动条无法滑动
    isLockX: true,
    // 是否显示滚动条
    isScrollBar: true,
    // 是否使用body对象的scroll而不是minirefresh-scroll对象的scroll
    // 开启后一个页面只能有一个下拉刷新，否则会有冲突
    isUseBodyScroll: false,
};

const CLASS_HIDDEN_SCROLLBAR = 'minirefresh-hide-scrollbar';

class Core {
    /**
     * 构造函数
     * @param {Object} options 配置信息
     * @constructor
     */
    constructor(options) {
        osMixin(this);
        this.options = extend(true, {}, defaultSetting, options);

        this.container = selector(this.options.container);
        // scroll的dom-wrapper下的第一个节点，作用是down动画时的操作
        this.contentWrap = this.container.children[0];
        // 默认是整个container进行滚动
        // 但是为了兼容body的滚动，拆分为两个对象方便处理
        // 如果是使用body的情况，scrollWrap恒为body
        // 注意，滑动不是指下拉时的translate（这时候时contentWrap），而是只默认的原生滑动
        this.scrollWrap = this.options.isUseBodyScroll ? document.body : this.container;
        
        if (!this.options.isScrollBar) {
            this.container.classList.add(CLASS_HIDDEN_SCROLLBAR);
        }

        // 初始化的hook
        this._initHook && this._initHook(this.options.down.isLock, this.options.up.isLock);

        // 生成一个Scroll对象 ，对象内部处理滑动监听
        this.scroller = new Scroll(this);

        // 内部处理scroll
        this._initEvent();
        // 如果初始化时锁定了，需要触发锁定，避免没有锁定时解锁（会触发逻辑bug）
        this.options.up.isLock && this._lockUpLoading(this.options.up.isLock);
        this.options.down.isLock && this._lockDownLoading(this.options.down.isLock);
    }

    _initEvent() {
        // 缓存options，这部分的配置是不允许reset的
        const options = this.options;

        this.scroller.on('initScroll', () => {
            this._initScrollHook && this._initScrollHook();
        });
        this.scroller.on('downLoading', (isHideLoading) => {
            !isHideLoading && this._downLoaingHook && this._downLoaingHook();
            options.down.callback && options.down.callback();
        });
        this.scroller.on('cancelLoading', () => {
            this._cancelLoaingHook && this._cancelLoaingHook();
            options.down.onCalcel && options.down.onCalcel();
        });
        this.scroller.on('pull', (downHight, downOffset) => {
            this._pullHook && this._pullHook(downHight, downOffset);
            options.down.onPull && options.down.onPull(downHight, downOffset);
        });
        this.scroller.on('upLoading', () => {
            this._upLoaingHook && this._upLoaingHook(this.options.up.isShowUpLoading);
            options.up.callback && options.up.callback(this.options.up.isShowUpLoading);
        });
        this.scroller.on('resetUpLoading', () => {
            this._resetUpLoadingHook && this._resetUpLoadingHook();
        });
        this.scroller.on('scroll', (scrollTop) => {
            this._scrollHook && this._scrollHook(scrollTop);
            options.up.onScroll && options.up.onScroll(scrollTop);
        });

        // 检查是否允许普通的加载中，如果返回false，就代表自定义下拉刷新，通常自己处理
        this.scroller.hook('beforeDownLoading', (downHight, downOffset) => (
            !this._beforeDownLoadingHook
            || this._beforeDownLoadingHook(downHight, downOffset)));
    }

    /**
     * 内部执行，结束下拉刷新
     * @param {Boolean} isSuccess 是否下拉请求成功
     * @param {String} successTips 需要更新的成功提示
     * 在开启了成功动画时，往往成功的提示是需要由外传入动态更新的，譬如  update 10 news
     */
    _endDownLoading(isSuccess, successTips) {
        if (!this.options.down) {
            // 防止没传down导致错误
            return;
        }

        if (this.scroller.downLoading) {
            // 必须是loading时才允许执行对应hook
            const successAnim = this.options.down.successAnim.isEnable;
            let successAnimTime = this.options.down.successAnim.duration;

            if (successAnim) {
                // 如果有成功动画
                this._downLoaingSuccessHook && this._downLoaingSuccessHook(isSuccess, successTips);
            } else {
                // 默认为没有成功动画
                successAnimTime = 0;
            }

            setTimeout(() => {
                // 成功动画结束后就可以重置位置了
                this.scroller.endDownLoading();
                // 触发结束hook
                this._downLoaingEndHook && this._downLoaingEndHook(isSuccess);
            }, successAnimTime);
        }
    }

    /**
     * 锁定上拉加载
     * 将开启和禁止合并成一个锁定API
     * @param {Boolean} isLock 是否锁定
     */
    _lockUpLoading(isLock) {
        this.options.up.isLock = isLock;
        this._lockUpLoadingHook && this._lockUpLoadingHook(isLock);
    }

    /**
     * 锁定下拉刷新
     * @param {Boolean} isLock 是否锁定
     */
    _lockDownLoading(isLock) {
        this.options.down.isLock = isLock;
        this._lockDownLoadingHook && this._lockDownLoadingHook(isLock);
    }

    /**
     * 刷新minirefresh的配置，关键性的配置请不要更新，如容器，回调等
     * @param {Object} options 新的配置，会覆盖原有的
     */
    refreshOptions(options) {
        this.options = extend(true, {}, this.options, options);
        this.scroller.refreshOptions(this.options);
        this._lockUpLoading(this.options.up.isLock);
        this._lockDownLoading(this.options.down.isLock);
        this._refreshHook && this._refreshHook();
    }

    /**
     * 结束下拉刷新
     * @param {Boolean} isSuccess 是否请求成功，这个状态会中转给对应主题
     * @param {String} successTips 需要更新的成功提示
     * 在开启了成功动画时，往往成功的提示是需要由外传入动态更新的，譬如  update 10 news
     */
    endDownLoading(isSuccess = true, successTips) {
        this._endDownLoading(isSuccess, successTips);
        // 同时恢复上拉加载的状态，注意，此时没有传isShowUpLoading，所以这个值不会生效
        if (this.options.down.isAutoResetUpLoading) {
            this.resetUpLoading();
        }
    }

    /**
     * 重置上拉加载状态,如果是没有更多数据后重置，会变为可以继续上拉加载
     */
    resetUpLoading() {
        this.scroller.resetUpLoading();
    }

    /**
     * 结束上拉加载
     * @param {Boolean} isFinishUp 是否结束上拉加载，如果结束，就相当于变为了没有更多数据，无法再出发上拉加载了
     * 结束后必须reset才能重新开启
     */
    endUpLoading(isFinishUp) {
        if (this.scroller.upLoading) {
            this.scroller.endUpLoading(isFinishUp);
            this._upLoaingEndHook && this._upLoaingEndHook(isFinishUp);
        }
    }

    triggerUpLoading() {
        this.scroller.triggerUpLoading();
    }

    triggerDownLoading() {
        this.scroller.scrollTo(0);
        this.scroller.triggerDownLoading();
    }

    /**
     * 滚动到指定的y位置
     * @param {Number} y 需要滑动到的top值
     * @param {Number} duration 单位毫秒
     */
    scrollTo(y, duration) {
        this.scroller.scrollTo(y, duration);
    }

    /**
     * 获取当前的滚动位置
     * @return {Number} 返回当前的滚动位置
     */
    getPosition() {
        return this.scrollWrap.scrollTop;
    }
}

export default Core;