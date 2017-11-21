import {
    requestAnimationFrame,
} from '../util/raf';

import {
    getClientHeightByDom,
} from '../util/lang';

/**
 * 一些事件
 */
const EVENT_INIT = 'initScroll';
const EVENT_SCROLL = 'scroll';
const EVENT_PULL = 'pull';
const EVENT_UP_LOADING = 'upLoading';
const EVENT_RESET_UP_LOADING = 'resetUpLoading';
const EVENT_DOWN_LOADING = 'downLoading';
const EVENT_CANCEL_LOADING = 'cancelLoading';

/**
 * 一些hook
 * hook是指挥它会影响逻辑
 */
const HOOK_BEFORE_DOWN_LOADING = 'beforeDownLoading';

const PER_SECOND = 1000 / 60;

/**
 * 滑动操作相关类
 * 把一些滑动滚动逻辑单独剥离出来
 * 确保Core中只有纯粹的API定义
 */
class Scroll {
    /**
     * 传入minirefresh对象，因为内部一些配置项依赖于minirefresh
     * @param {Object} options 配置信息
     * @constructor
     */
    constructor(minirefresh) {
        this.contentWrap = minirefresh.contentWrap;
        this.scrollWrap = minirefresh.scrollWrap;
        this.options = minirefresh.options;
        this.os = minirefresh.os;
        // 默认没有事件，需要主动绑定
        this.events = {};
        // 默认没有hook
        this.hooks = {};

        // 使用了scrollto后加锁，防止重复
        this.isScrollTo = false;
        // 上拉和下拉的状态
        this.upLoading = false;
        this.downLoading = false;
        // 默认up是没有finish的
        this.isFinishUp = false;

        this._init();
    }

    _init() {
        this._initPullDown();
        this._initPullUp();

        setTimeout(() => {
            if (this.options.down &&
                this.options.down.isAuto &&
                !this.options.down.isLock
            ) {
                // 满足自动下拉,需要判断是否需要动画（仅仅是首次）
                if (this.options.down.isAllowAutoLoading) {
                    this.triggerDownLoading();
                } else {
                    this.events[EVENT_DOWN_LOADING] &&
                        this.events[EVENT_DOWN_LOADING](true);
                }
            } else if (this.options.up &&
                this.options.up.isAuto &&
                !this.options.up.isLock) {
                // 满足上拉，上拉的配置由配置项决定（每一次）
                this.triggerUpLoading();
            }

            this.events[EVENT_INIT] &&
                this.events[EVENT_INIT]();
        });
    }

    refreshOptions(options) {
        this.options = options;
    }

    /**
     * ContentWrap的translate动画，用于下拉刷新时进行transform动画
     * @param {Number} y 移动的高度
     * @param {Number} duration 过渡时间
     */
    translateContentWrap(y, duration) {
        const translateY = y || 0;
        const translateDuration = duration || 0;

        // 改变downHight， 这个参数关乎逻辑
        this.downHight = translateY;
        
        if (!this.options.down.isScrollCssTranslate) {
            // 只有允许动画时才会scroll也translate,否则只会改变downHeight
            return;
        }

        // 改变wrap的位置（css动画）
        const wrap = this.contentWrap;

        wrap.style.webkitTransitionDuration = `${translateDuration}ms`;
        wrap.style.transitionDuration = `${translateDuration}ms`;
        wrap.style.webkitTransform = `translate(0px, ${translateY}px) translateZ(0px)`;
        wrap.style.transform = `translate(0px, ${translateY}px) translateZ(0px)`;
    }

    _scrollWrapAnimation() {
        this.scrollWrap.webkitTransitionTimingFunction = 'cubic-bezier(0.1, 0.57, 0.1, 1)';
        this.scrollWrap.transitionTimingFunction = 'cubic-bezier(0.1, 0.57, 0.1, 1)';
    }

    _initPullDown() {
        // 考虑到options可以更新，所以不能被缓存，而是应该在回调中直接获取
        const scrollWrap = this.scrollWrap;
        const docClientHeight = document.documentElement.clientHeight;

        this._scrollWrapAnimation();

        // 触摸开始
        const touchstartEvent = (e) => {
            if (this.isScrollTo) {
                // 如果执行滑动事件,则阻止touch事件,优先执行scrollTo方法
                e.preventDefault();
            }
            // 记录startTop, 并且只有startTop存在值时才允许move
            this.startTop = scrollWrap.scrollTop;

            // startY用来计算距离
            this.startY = e.touches ? e.touches[0].pageY : e.clientY;
            // X的作用是用来计算方向，如果是横向，则不进行动画处理，避免误操作
            this.startX = e.touches ? e.touches[0].pageX : e.clientX;
        };

        scrollWrap.addEventListener('touchstart', touchstartEvent);
        scrollWrap.addEventListener('mousedown', touchstartEvent);
        
        
        // 触摸结束
        const touchendEvent = () => {
            const options = this.options;

            // 需要重置状态
            if (this.isMoveDown) {
                // 如果下拉区域已经执行动画,则需重置回来
                if (this.downHight >= options.down.offset) {
                    // 符合触发刷新的条件
                    this.triggerDownLoading();
                } else {
                    // 否则默认重置位置
                    this.translateContentWrap(0, options.down.bounceTime);
                    this.events[EVENT_CANCEL_LOADING] &&
                        this.events[EVENT_CANCEL_LOADING]();
                }

                this.isMoveDown = false;
            }

            this.startY = 0;
            this.startX = 0;
            this.preY = 0;
            this.startTop = undefined;
            // 当前是否正处于回弹中，常用于iOS中判断，如果先上拉再下拉就处于回弹中（只要moveY为负）
            this.isBounce = false;
        };

        scrollWrap.addEventListener('touchend', touchendEvent);
        scrollWrap.addEventListener('mouseup', touchendEvent);
        scrollWrap.addEventListener('mouseleave', touchendEvent);

        // 触摸中
        const touchmoveEvent = (e) => {
            const options = this.options;
            let isAllowDownloading = true;

            if (this.downLoading) {
                isAllowDownloading = false;
            } else if (!options.down.isAways && this.upLoading) {
                isAllowDownloading = false;
            }

            if (this.startTop !== undefined &&
                this.startTop <= 0 &&
                (isAllowDownloading) &&
                !this.options.down.isLock) {
                // 列表在顶部且不在加载中，并且没有锁住下拉动画

                // 当前第一个手指距离列表顶部的距离
                const curY = e.touches ? e.touches[0].pageY : e.clientY;
                const curX = e.touches ? e.touches[0].pageX : e.clientX;
                
                // 手指滑出屏幕触发刷新
                if (curY > docClientHeight) {
                    touchendEvent(e);
                    
                    return;
                }

                if (!this.preY) {
                    // 设置上次移动的距离，作用是用来计算滑动方向
                    this.preY = curY;
                }

                // 和上次比,移动的距离 (大于0向下,小于0向上)
                const diff = curY - this.preY;

                this.preY = curY;

                // 和起点比,移动的距离,大于0向下拉
                const moveY = curY - this.startY;
                const moveX = curX - this.startX;

                // 如果锁定横向滑动并且横向滑动更多，阻止默认事件
                if (options.isLockX && Math.abs(moveX) > Math.abs(moveY)) {
                    e.preventDefault();

                    return;
                }

                if (this.isBounce && this.os.ios) {
                    // 暂时iOS中去回弹
                    // 下一个版本中，分开成两种情况，一种是absolute的固定动画，一种是在scrollWrap内部跟随滚动的动画
                    return;
                }

                if (moveY > 0) {
                    // 向下拉
                    this.isMoveDown = true;

                    // 阻止浏览器的默认滚动事件，因为这时候只需要执行动画即可
                    e.preventDefault();

                    if (!this.downHight) {
                        // 下拉区域的高度，用translate动画
                        this.downHight = 0;
                    }

                    const downOffset = options.down.offset;
                    let dampRate = 1;

                    if (this.downHight < downOffset) {
                        // 下拉距离  < 指定距离
                        dampRate = options.down.dampRateBegin;
                    } else {
                        // 超出了指定距离，随时可以刷新
                        dampRate = options.down.dampRate;
                    }

                    if (diff > 0) {
                        // 需要加上阻尼系数
                        this.downHight += diff * dampRate;
                    } else {
                        // 向上收回高度,则向上滑多少收多少高度
                        this.downHight += diff;
                    }

                    this.events[EVENT_PULL] &&
                        this.events[EVENT_PULL](this.downHight, downOffset);

                    // 执行动画
                    this.translateContentWrap(this.downHight);
                } else {
                    this.isBounce = true;
                    // 解决嵌套问题。在嵌套有 IScroll，或类似的组件时，这段代码会生效，可以辅助滚动scrolltop
                    // 否则有可能在最开始滚不动
                    if (scrollWrap.scrollTop <= 0) {
                        scrollWrap.scrollTop += Math.abs(diff);
                    }
                }
            }
        };

        scrollWrap.addEventListener('touchmove', touchmoveEvent);
        scrollWrap.addEventListener('mousemove', touchmoveEvent);
    }

    _initPullUp() {
        const scrollWrap = this.scrollWrap;

        // 如果是Body上的滑动，需要监听window的scroll
        const targetScrollDom = (scrollWrap === document.body) ? window : scrollWrap;

        targetScrollDom.addEventListener('scroll', () => {
            const scrollTop = scrollWrap.scrollTop;
            const scrollHeight = scrollWrap.scrollHeight;
            const clientHeight = getClientHeightByDom(scrollWrap);
            const options = this.options;

            this.events[EVENT_SCROLL] && this.events[EVENT_SCROLL](scrollTop);
            
            let isAllowUploading = true;
            
            if (this.upLoading) {
                isAllowUploading = false;
            } else if (!options.down.isAways && this.downLoading) {
                isAllowUploading = false;
            }

            if (isAllowUploading) {
                if (!this.options.up.isLock &&
                    !this.isFinishUp &&
                    scrollHeight > 0) {
                    const toBottom = scrollHeight - clientHeight - scrollTop;

                    if (toBottom <= options.up.offset) {
                        // 满足上拉加载
                        this.triggerUpLoading();
                    }
                }
            }
        });
    }

    _loadFull() {
        const scrollWrap = this.scrollWrap;
        const options = this.options;

        setTimeout(() => {
            // 在下一个循环中运行
            if (!this.options.up.isLock
                && options.up.loadFull.isEnable
                // 避免无法计算高度时无限加载
                && scrollWrap.scrollTop === 0
                // scrollHeight是网页内容高度（最小值是clientHeight）
                && scrollWrap.scrollHeight > 0
                && scrollWrap.scrollHeight <= getClientHeightByDom(scrollWrap)
            ) {
                this.triggerUpLoading();
            }
        }, options.up.loadFull.delay || 0);
    }

    triggerDownLoading() {
        const options = this.options;

        if (!this.hooks[HOOK_BEFORE_DOWN_LOADING] ||
            this.hooks[HOOK_BEFORE_DOWN_LOADING](this.downHight, options.down.offset)) {
            // 没有hook或者hook返回true都通过，主要是为了方便类似于秘密花园等的自定义下拉刷新动画实现
            this.downLoading = true;
            this.translateContentWrap(options.down.offset, options.down.bounceTime);

            this.events[EVENT_DOWN_LOADING] && this.events[EVENT_DOWN_LOADING]();
        }
    }

    endDownLoading() {
        const options = this.options;

        if (this.downLoading) {
            // 必须是loading时才允许结束
            this.translateContentWrap(0, options.down.bounceTime);
            this.downLoading = false;
        }
    }

    triggerUpLoading() {
        this.upLoading = true;
        this.events[EVENT_UP_LOADING] && this.events[EVENT_UP_LOADING]();
    }

    /**
     * 结束上拉加载动画时需要判断是否已经finished(不能加载更多，没有数据了)
     * @param {Boolean} isFinishUp 是否结束上拉加载
     */
    endUpLoading(isFinishUp) {
        if (this.upLoading) {
            this.upLoading = false;

            if (isFinishUp) {
                this.isFinishUp = true;
            } else {
                this._loadFull();
            }
        }
    }

    resetUpLoading() {
        if (this.isFinishUp) {
            this.isFinishUp = false;
        }

        // 检测是否需要加载满屏
        this._loadFull();
        
        this.events[EVENT_RESET_UP_LOADING] && this.events[EVENT_RESET_UP_LOADING]();
    }

    /**
     * 滚动到指定的y位置
     * @param {Number} y top坐标
     * @param {Number} duration 单位毫秒
     */
    scrollTo(y, duration) {
        const scrollWrap = this.scrollWrap;
        const translateDuration = duration || 0;
        // 最大可滚动的y
        const maxY = scrollWrap.scrollHeight - getClientHeightByDom(scrollWrap);
        let translateY = y || 0;

        translateY = Math.max(translateY, 0);
        translateY = Math.min(translateY, maxY);

        // 差值 (可能为负)
        const diff = scrollWrap.scrollTop - translateY;

        if (diff === 0 || translateDuration === 0) {
            scrollWrap.scrollTop = translateY;

            return;
        }

        // 每秒60帧，计算一共多少帧，然后每帧的步长
        const count = Math.floor(translateDuration / PER_SECOND);
        const step = diff / count;
        let curr = 0;

        const execute = () => {
            if (curr < count) {
                if (curr === count - 1) {
                    // 最后一次直接设置y,避免计算误差
                    scrollWrap.scrollTop = translateY;
                } else {
                    scrollWrap.scrollTop -= step;
                }
                curr += 1;
                requestAnimationFrame(execute);
            } else {
                scrollWrap.scrollTop = translateY;
                this.isScrollTo = false;
            }
        };

        // 锁定状态
        this.isScrollTo = true;
        requestAnimationFrame(execute);
    }

    /**
     * 监听事件，包括下拉过程，下拉刷新，上拉加载，滑动等事件都可以监听到
     * @param {String} event 事件名，可选名称
     * 在最上方的常量有定义
     * @param {Function} callback 回调函数
     */
    on(event, callback) {
        if (event && typeof callback === 'function') {
            this.events[event] = callback;
        }
    }

    /**
     * 注册钩子函数，主要是一些自定义刷新动画时用到，如进入秘密花园
     * @param {String} hook 名称，范围如下
     * beforeDownLoading 是否准备downLoading，如果返回false，则不会loading，完全进入自定义动画
     * @param {Function} callback 回调函数
     */
    hook(hook, callback) {
        if (hook && typeof callback === 'function') {
            this.hooks[hook] = callback;
        }
    }
}

export default Scroll;