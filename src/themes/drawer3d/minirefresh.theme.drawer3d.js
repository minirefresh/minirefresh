/**
 * 3D抽屉效果
 * 复用了default的代码，在其基础上增加3D效果
 */
(function(innerUtil) {

    /**
     * 一些默认提供的CSS类，一般来说不会变动（由框架提供的）
     * skin字段会根据不同的皮肤有不同值
     */
    var CLASS_SKIN = 'minirefresh-skin-drawer3d';

    /**
     * 一些常量
     * 默认高度是200
     * 其中背景默认是黑色，内容是白色，再增设阻尼系数可以较好的达到3D效果
     */
    var DEFAULT_DOWN_HEIGHT = 200;
    var DRAWER_FULL_DEGREE = 90;

    var defaultSetting = {
        down: {
            offset: 100,
            // 阻尼系数，下拉的距离大于offset时,改变下拉区域高度比例;值越接近0,高度变化越小,表现为越往下越难拉
            dampRate: 0.2,
            bounceTime: 500,
            successAnim: {
                // successAnim
                enable: false
            }
        }
    };

    var MiniRefreshSkin = innerUtil.skin.defaults.extend({

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
            // 先复用default代码，然后重写
            this._super();
            
            var container = this.container,
                options = this.options,
                downWrap = this.downWrap;
            
            // 改写内容区域
            downWrap.innerHTML = '<div class="drawer3d">' +
                                '<div class="downwrap-content">' +
                                '<p class="downwrap-progress"></p>' +
                                '<p class="downwrap-tips">' +
                                options.down.contentdown +
                                ' </p></div>' +
                                '<div class="drawer3d-mask"></div ></div>';

            // 由于直接继承的default，所以其实已经有default皮肤了，这里再加上本皮肤样式
            container.classList.add(CLASS_SKIN);

            // 改写完后，对象需要重新查找
            this.downWrapProgress = downWrap.querySelector('.downwrap-progress');
            this.downWrapTips = downWrap.querySelector('.downwrap-tips');
            this.drawer = downWrap.querySelector('.drawer3d');
            this.drawerMask = downWrap.querySelector('.drawer3d-mask');

            // 留一个默认值，以免样式被覆盖，无法获取
            this.downWrapHeight = downWrap.offsetHeight || DEFAULT_DOWN_HEIGHT;
            this._resetDownWrapAndDrawer(false);
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
        _transformDrawer: function(degree, duration) {
            degree = degree || 0;
            duration = duration || 0;
            this.drawer.style.webkitTransform = 'perspective(100px) rotateX(' + degree + 'deg) rotateY(0deg) translateY(2px)';
            this.drawer.style.transform = 'perspective(100px) rotateX(' + degree + 'deg) rotateY(0deg) translateY(2px)';
            this.drawer.style.webkitTransitionDuration = duration + 'ms';
            this.drawer.style.transitionDuration = duration + 'ms';
            
            var opacity = degree / DRAWER_FULL_DEGREE;
            
            this.drawerMask.style.opacity = opacity;
            this.drawerMask.style.webkitTransitionDuration = duration + 'ms';
            this.drawerMask.style.transitionDuration = duration + 'ms';
        },
        
        /**
         * 重置wrap和抽屉
         * @param {Boolean} isWrapDuration 是否使用wrap的过渡时间，默认为false
         * 一般初始化时为false，其余为true
         */
        _resetDownWrapAndDrawer: function(isWrapDuration) {
            this._transformDownWrap(-this.downWrapHeight, isWrapDuration ? this.options.down.bounceTime : 0);
            this._transformDrawer(DRAWER_FULL_DEGREE, this.options.down.bounceTime);
        },

        /**
         * 重写下拉过程动画
         * @param {Number} downHight 当前下拉的高度
         * @param {Number} downOffset 下拉的阈值
         */
        _pullHook: function(downHight, downOffset) {
            // 复用default的同名函数代码           
            this._super(downHight, downOffset);
            
            var rate = downHight / downOffset,
                degree = DRAWER_FULL_DEGREE * (1 - Math.min(rate, 1));
            
            // downWrap跟随tramsform
            this._transformDownWrap(-this.downWrapHeight + downHight);
            this._transformDrawer(degree);
        },

        /**
         * 重写下拉动画
         */
        _downLoaingHook: function() {
            this._super();
            
            // 默认和scrollwrap的同步
            this._transformDownWrap(-this.downWrapHeight + this.options.down.offset, this.options.down.bounceTime);
            this._transformDrawer(0, this.options.down.bounceTime);
        },

        /**
         * 重写success 但是什么都不做
         */
        _downLoaingSuccessHook: function() {},

        /**
         * 重写下拉end
         * @param {Boolean} isSuccess 是否成功
         */
        _downLoaingEndHook: function(isSuccess) {
            this._super(isSuccess);
            this._resetDownWrapAndDrawer(true);
        },
        
        /**
         * 取消loading的回调
         */
        _cancelLoaingHook: function() {
            this._resetDownWrapAndDrawer(true);
        }
    });

    // 挂载皮肤，这样多个皮肤可以并存
    innerUtil.namespace('skin.drawer3d', MiniRefreshSkin);

    // 覆盖全局对象，使的全局对象只会指向一个最新的皮肤
    window.MiniRefresh = MiniRefreshSkin;

    /**
     * 兼容require，为了方便使用，暴露出去的就是最终的皮肤
     * 如果要自己实现皮肤，也请在对应的皮肤中增加require支持
     */
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MiniRefreshSkin;
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(function() {
            return MiniRefreshSkin;
        });
    }

})(MiniRefreshTools);