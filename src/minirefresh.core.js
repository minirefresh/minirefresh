/**
 * MiniRerefresh 的核心代码，代码中约定对外的API
 * 可以通过继承  MiniRefreshCore， 得到一个主题类，然后在主题类中实现UI hook函数可以达到不同的动画效果
 * 核心类内部没有任何UI实现，所有的UI都依赖于主题类
 * 
 * 以下是主题类可以实现的Hook（为undefined的话相当于忽略）
 * _initHook(isLockDown, isLockUp)              初始化时的回调
 * _refreshHook(isLockDown, isLockUp)           刷新options时的回调
 * _pullHook(downHight, downOffset)             下拉过程中持续回调
 * _scrollHook(scrollTop)                       滚动过程中持续回调
 * _downLoaingHook()                            下拉触发的那一刻回调
 * _downLoaingSuccessHook(isSuccess)            下拉刷新的成功动画，处理成功或失败提示
 * _downLoaingEndHook(isSuccess)                下拉刷新动画结束后的回调
 * _cancelLoaingHook()                          取消loading的回调
 * _upLoaingHook()                              上拉触发的那一刻回调
 * _upLoaingEndHook(isFinishUp)                 上拉加载动画结束后的回调
 * _resetUpLoadingHook()                         重置上拉状态，变为又可继续上拉
 * __lockUpLoadingHook(isLock)                  锁定上拉时的回调
 * __lockDownLoadingHook(isLock)                锁定下拉时的回调
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
            isAuto: false,
            // 设置isAuto=true时生效，是否在初始化的下拉刷新触发事件中显示动画，如果是false，初始化的加载只会触发回调，不会触发动画
            isAllowAutoLoading: true,
            // 是否不管任何情况下都能触发下拉刷新，为false的话当上拉时不会触发下拉
            isAways: false,
            // 是否scroll在下拉时会进行css移动，通过关闭它可以实现自定义动画
            isScrollCssTranslate: true,
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
                duration: 300
            },
            // 下拉时会提供回调，默认为null不会执行
            onPull: null,
            // 取消时回调
            onCalcel: null,
            callback: innerUtil.noop
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
                delay: 300
            },
            // 滚动时会提供回调，默认为null不会执行
            onScroll: null,
            callback: innerUtil.noop
        },
        // 容器
        container: '#minirefresh',
        // 是否锁定横向滑动，如果锁定则原生滚动条无法滑动
        isLockX: true,
        // 是否使用body对象的scroll而不是minirefresh-scroll对象的scroll
        // 开启后一个页面只能有一个下拉刷新，否则会有冲突
        isUseBodyScroll: false
    };

    var MiniRefreshCore = innerUtil.Clazz.extend({

        /**
         * 初始化
         * @param {Object} options 配置信息
         */
        init: function(options) {
            options = innerUtil.extend(true, {}, defaultSetting, options);

            this.container = innerUtil.selector(options.container);
            // scroll的dom-wrapper下的第一个节点，作用是down动画时的操作
            this.contentWrap = this.container.children[0];
            // 默认是整个container进行滑动
            // 但是为了兼容body的滚动，拆分为两个对象方便处理
            // 如果是使用body的情况，scrollWrap恒为body
            // 注意，滑动不是指下拉时的translate（这时候时contentWrap），而是只默认的原生滑动
            this.scrollWrap = options.isUseBodyScroll ? document.body : this.container;
            
            this.options = options;
            
            // 初始化的hook
            this._initHook && this._initHook(this.options.down.isLock, this.options.up.isLock);

            // 生成一个Scroll对象 ，对象内部处理滑动监听
            this.scroller = new innerUtil.Scroll(this);
           
            this._initEvent();

            // 如果初始化时锁定了，需要触发锁定，避免没有锁定时解锁（会触发逻辑bug）
            options.up.isLock && this._lockUpLoading(options.up.isLock);
            options.down.isLock && this._lockDownLoading(options.down.isLock);
        },
        _resetOptions: function() {
            var options = this.options;

            this._lockUpLoading(options.up.isLock);
            this._lockDownLoading(options.down.isLock);
        },
        _initEvent: function() {
            var self = this,
                options = self.options;

            this.scroller.on('downLoading', function(isHideLoading) {
                !isHideLoading && self._downLoaingHook && self._downLoaingHook();
                options.down.callback && options.down.callback();
            });

            this.scroller.on('cancelLoading', function() {
                self._cancelLoaingHook && self._cancelLoaingHook();
                options.down.onCalcel && options.down.onCalcel();
            });

            this.scroller.on('upLoading', function() {
                self._upLoaingHook && self._upLoaingHook(self.options.up.isShowUpLoading);
                options.up.callback && options.up.callback();
            });
            
            this.scroller.on('resetUpLoading', function() {
                self._resetUpLoadingHook && self._resetUpLoadingHook();
            });

            this.scroller.on('pull', function(downHight, downOffset) {
                self._pullHook && self._pullHook(downHight, downOffset);
                options.down.onPull && options.down.onPull(downHight, downOffset);
            });

            this.scroller.on('scroll', function(scrollTop) {
                self._scrollHook && self._scrollHook(scrollTop);
                options.up.onScroll && options.up.onScroll(scrollTop);
            });

            // 检查是否允许普通的加载中，如果返回false，就代表自定义下拉刷新，通常自己处理
            this.scroller.hook('beforeDownLoading', function(downHight, downOffset) {
                return !self._beforeDownLoadingHook || self._beforeDownLoadingHook(downHight, downOffset);
            });
        },

        /**
         * 内部执行，结束下拉刷新
         * @param {Boolean} isSuccess 是否下拉请求成功
         * @param {String} successTips 需要更新的成功提示
         * 在开启了成功动画时，往往成功的提示是需要由外传入动态更新的，譬如  update 10 news
         */
        _endDownLoading: function(isSuccess, successTips) {
            var self = this;

            if (!this.options.down) {
                // 防止没传down导致错误
                return;
            }

            if (this.scroller.downLoading) {
                // 必须是loading时才允许执行对应hook
                var successAnim = this.options.down.successAnim.isEnable,
                    successAnimTime = this.options.down.successAnim.duration;

                if (successAnim) {
                    // 如果有成功动画    
                    this._downLoaingSuccessHook && this._downLoaingSuccessHook(isSuccess, successTips);
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
         * 重新刷新上拉加载，刷新后会变为可以上拉加载
         */
        _resetUpLoading: function() {
            this.scroller.resetUpLoading();
        },

        /**
         * 锁定上拉加载
         * 将开启和禁止合并成一个锁定API
         * @param {Boolean} isLock 是否锁定
         */
        _lockUpLoading: function(isLock) {
            this.scroller.lockUp(isLock);
            this._lockUpLoadingHook && this._lockUpLoadingHook(isLock);
        },

        /**
         * 锁定下拉刷新
         * @param {Boolean} isLock 是否锁定
         */
        _lockDownLoading: function(isLock) {
            this.scroller.lockDown(isLock);
            this._lockDownLoadingHook && this._lockDownLoadingHook(isLock);
        },

        /**
         * 刷新minirefresh的配置，关键性的配置请不要更新，如容器，回调等
         * @param {Object} options 新的配置，会覆盖原有的
         */
        refreshOptions: function(options) {
            this.options = innerUtil.extend(true, {}, this.options, options);
            this.scroller.refreshOptions(this.options);
            this._resetOptions(options);
            this._refreshHook && this._refreshHook();
        },

        /**
         * 结束下拉刷新
         * @param {Boolean} isSuccess 是否请求成功，这个状态会中转给对应主题
         * @param {String} successTips 需要更新的成功提示
         * 在开启了成功动画时，往往成功的提示是需要由外传入动态更新的，譬如  update 10 news
         */
        endDownLoading: function(isSuccess, successTips) {
            typeof isSuccess !== 'boolean' && (isSuccess = true);
            this._endDownLoading(isSuccess, successTips);
            // 同时恢复上拉加载的状态，注意，此时没有传isShowUpLoading，所以这个值不会生效
            this._resetUpLoading();
        },
        
        /**
         * 重置上拉加载状态,如果是没有更多数据后重置，会变为可以继续上拉加载
         */
        resetUpLoading: function() {
            this._resetUpLoading();
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
        },
        
        /**
         * 获取当前的滚动位置
         * @return {Number} 返回当前的滚动位置
         */
        getPosition: function() {
            return this.scrollWrap.scrollTop;
        }
    });

    innerUtil.core = MiniRefreshCore;
})(MiniRefreshTools);