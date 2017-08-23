/**
 * MiniRerefresh 的核心代码，代码中约定对外的API
 * 可以通过继承  MiniRefreshCore， 得到一个皮肤类，然后在皮肤类中实现UI hook函数可以达到不同的动画效果
 * 核心类内部没有任何UI实现，所有的UI都依赖于皮肤类
 * 
 * 以下是皮肤类可以实现的Hook（为undefined的话相当于忽略）
 * _initHook(isLockDown, isLockUp)              初始化时的回调
 * _pullHook(downHight, downOffset)             下拉过程中持续回调
 * _scrollHook(scrollTop)                       滚动过程中持续回调
 * _downLoaingHook()                            下拉触发的那一刻回调
 * _downLoaingSuccessHook(isSuccess)            下拉刷新的成功动画，处理成功或失败提示
 * _downLoaingEndHook(isSuccess)                下拉刷新动画结束后的回调
 * _upLoaingHook()                              上拉触发的那一刻回调
 * _upLoaingEndHook(isFinishUp)                 上拉加载动画结束后的回调
 * _lockUpLoadingHook(isLock)                   锁定上拉时的回调
 * _lockDownLoadingHook(isLock)                 锁定下拉时的回调
 * 
 * _beforeDownLoadingHook(downHight, downOffset)一个特殊的hook，返回false时代表不会走入下拉刷新loading，完全自定义实现动画，默认为返回true
 */
(function(innerUtil) {

    var defaultSetting = {
        // 下拉有关
        down: {
            // 默认没有锁定，可以通过API动态设置
            isLock: false,
            // 是否自动下拉刷新
            auto: false,
            // 下拉要大于多少长度后再下拉刷新
            offset: 75,
            // 阻尼系数，下拉的距离大于offset时,改变下拉区域高度比例;值越接近0,高度变化越小,表现为越往下越难拉
            dampRate: 0.2,
            // 回弹动画时间
            bounceTime: 300,
            successAnim: {
                // 下拉刷新结束后是否有成功动画，默认为false，如果想要有成功刷新xxx条数据这种操作，请设为true，并实现对应hook函数
                enable: false,
                duration: 300
            },
            callback: innerUtil.noop
        },
        // 上拉有关
        up: {
            // 默认没有锁定，可以通过API动态设置
            isLock: false,
            // 是否自动上拉加载-初始化是是否自动
            auto: true,
            // 距离底部高度(到达该高度即触发)
            offset: 100,
            loadFull: {
                // 开启配置后，只要没满屏幕，就会自动加载
                enable: true,
                delay: 300
            },
            // 是否默认显示上拉进度条，可以通过API改变
            isShowUpLoading: true,
            callback: innerUtil.noop

        },
        // 容器
        container: '#minirefresh'
    };

    var MiniRefreshCore = innerUtil.Clazz.extend({

        /**
         * 初始化
         * @param {Object} options 配置信息
         */
        init: function(options) {
            options = innerUtil.extend(true, {}, defaultSetting, options);

            this.container = innerUtil.selector(options.container);
            // scroll的dom-wrapper下的第一个节点
            this.scrollWrap = this.container.children[0];
            this.options = options;

            // 生成一个Scroll对象 ，对象内部处理滑动监听
            this.scroller = new innerUtil.Scroll(this);

            this.resetUpLoading(options.up.isShowUpLoading);
            this.lockUpLoading(options.up.isLock);
            this.lockDownLoading(options.down.isLock);
            this._initEvent();

            // 初始化的hook
            this._initHook && this._initHook(this.scroller.isLockDown, this.scroller.isLockUp);
        },
        _initEvent: function() {
            var self = this,
                options = self.options;

            this.scroller.on('downLoading', function() {
                self._downLoaingHook && self._downLoaingHook();
                options.down.callback && options.down.callback();
            });

            this.scroller.on('upLoading', function() {
                self._upLoaingHook && self._upLoaingHook(self.scroller.isShowUpLoading);
                options.up.callback && options.up.callback();
            });

            this.scroller.on('pull', function(downHight, downOffset) {
                self._pullHook && self._pullHook(downHight, downOffset);
                options.down.pull && options.down.pull();
            });

            this.scroller.on('scroll', function(scrollTop) {
                self._scrollHook && self._scrollHook(scrollTop);
                options.up.scroll && options.up.scroll();
            });

            // 检查是否允许普通的加载中，如果返回false，就代表自定义下拉刷新，通常自己处理
            this.scroller.hook('beforeDownLoading', function(downHight, downOffset) {
                return !self._beforeDownLoadingHook || self._beforeDownLoadingHook(downHight, downOffset);
            });
        },
        
        /**
         * 内部执行，结束下拉刷新
         * @param {Boolean} isSuccess 是否下拉请求成功
         */
        _endDownLoading: function(isSuccess) {
            var self = this;

            if (!this.options.down) {
                // 防止没传down导致错误
                return;
            }

            if (this.scroller.downLoading) {
                // 必须是loading时才允许执行对应hook
                var successAnim = this.options.down.successAnim.enable,
                    successAnimTime = this.options.down.successAnim.duration;

                if (successAnim) {
                    // 如果有成功动画    
                    this._downLoaingSuccessHook && this._downLoaingSuccessHook(isSuccess);
                } else {
                    // 默认为没有成功动画
                    successAnimTime = 0;
                }

                setTimeout(function() {
                    // 成功动画结束后就可以重置位置了
                    self.scroller.endDownLoading();
                    // 触发结束hook
                    self._downLoaingEndHook && self._downLoaingEndHook(isSuccess);

                }, successAnimTime);
            }
        },
        
        /**
         * 内部执行，结束上拉加载
         * @param {Boolean} isFinishUp 是否结束了上拉加载
         */
        _endUpLoading: function(isFinishUp) {
            if (this.scroller.upLoading) {
                this.scroller.endUpLoading(isFinishUp);
                this._upLoaingEndHook && this._upLoaingEndHook(isFinishUp);
            }
        },
        
        /**
         * 结束下拉刷新
         * @param {Boolean} isSuccess 是否请求成功，这个状态会中转给对应皮肤
         */
        endDownLoading: function(isSuccess) {
            typeof isSuccess !== 'boolean' && (isSuccess = true);
            this._endDownLoading(isSuccess);
            // 同时恢复上拉加载的状态，注意，此时没有传isShowUpLoading，所以这个值不会生效
            this.resetUpLoading();
        },
        
        /**
         * 结束上拉加载
         * @param {Boolean} isFinishUp 是否结束上拉加载，如果结束，就相当于变为了没有更多数据，无法再出发上拉加载了
         * 结束后必须reset才能重新开启
         */
        endUpLoading: function(isFinishUp) {
            this._endUpLoading(isFinishUp);
        },
        
        /**
         * 重新刷新上拉加载，刷新后会变为可以上拉加载，这里面也可以主动更新一些其它状态
         * @param {Boolean} isShowUpLoading 是否显示上拉加载动画，必须是布尔值才设置有效
         */
        resetUpLoading: function(isShowUpLoading) {
            this.scroller.resetUpLoading(isShowUpLoading);
        },
        
        /**
         * 锁定上拉加载
         * 将开启和禁止合并成一个锁定API
         * @param {Boolean} isLock 是否锁定
         */
        lockUpLoading: function(isLock) {
            this.scroller.lockUp(isLock);
            this._lockUpLoadingHook && this._lockUpLoadingHook(isLock);
        },
        
        /**
         * 锁定下拉刷新
         * @param {Boolean} isLock 是否锁定
         */
        lockDownLoading: function(isLock) {
            this.scroller.lockDown(isLock);
            this._lockDownLoadingHook && this._lockDownLoadingHook(isLock);
        },
        
        /**
         * 触发上拉加载
         */
        triggerUpLoading: function() {
            this.scroller.triggerUpLoading();
        },
        
        /**
         * 触发下拉刷新
         */
        triggerDownLoading: function() {
            this.scroller.scrollTo(0);
            this.scroller.triggerDownLoading();
        },
        
        /**
         * 滚动到指定的y位置
         * @param {Number} y 需要滑动到的top值
         * @param {Number} duration 单位毫秒
         */
        scrollTo: function(y, duration) {
            this.scroller.scrollTo(y, duration);
        }
    });

    innerUtil.core = MiniRefreshCore;
})(MiniRefreshTools);