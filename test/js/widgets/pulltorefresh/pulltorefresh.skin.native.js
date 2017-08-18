/**
 * 作者: dailc
 * 创建时间: 2017/03/28
 * 版本: [1.0, 2017/05/26 ]
 * 版权: dailc
 * 描述: 这个皮肤是ejs或钉钉下的下拉刷新，使用了他们自带提供的原生下拉刷新，以及自定义生成上拉加载
 * 注意:分别在ejs下或者钉钉下依赖对应的库文件
 */
(function(exports, CommonTools) {

    var isSupportTouch = "ontouchend" in document ? true : false;
    //默认的下拉刷新每一个页面只支持一个,所以是单例模式
    var instance;
    //这里的isPullDown是指从上往下拉
    //pullup是指从下往上拉
    var isTouch = false,
        isPullDown = false;
    //定义一个global
    var global = {};
    /**
     * 默认的设置参数
     */
    var defaultSetting = {
        //下拉有关
        down: {
            callback: CommonTools.noop
        },
        //上拉有关
        up: {
            //是否自动上拉加载-初始化是是否自动
            auto: false,
            //是否隐藏那个加载更多动画,达到默认加载效果
            show: true,
            contentrefresh: '正在加载...',
            callback: CommonTools.noop
        },
        //注意,传给Mui时可以传 #id形式或者是  原生dom对象
        element: '#pullrefresh'
    };
    var pulluploadingTips = '<div class="mui-pull-bottom-tips mui-pull-bottom-tips2"><i class="mui-spinner"></i><span class="mui-pull-loading">{{contentrefresh}}</span></div>';
    /**
     * @description 兼容ejs情况下的下拉刷新
     * 去除多余dom
     * @param {HTMLElement} elem 对应的dom
     */
    function compatibleNative(elem) {
        //计划改变，ejs下拉刷新不使用scroll,否则不好计算什么时候可以滑动，而是直接去除这个dom
        //		mui(elem).scroll({
        //			deceleration: 0.0005 //flick 减速系数，系数越大，滚动速度越慢，滚动距离越小，默认值0.0006
        //		});
        if (typeof elem === 'string') {
            elem = document.querySelector(elem);
        }
        if (CommonTools.os.ejs || CommonTools.os.dd) {
            //去除dom,ejs下拉刷新不需要scroll
            var pullRefreshDom = elem;
            pullRefreshDom.classList.remove('mui-scroll-wrapper');
            var scrollDom = pullRefreshDom.querySelector('.mui-scroll');
            if (scrollDom) {
                //pullRefreshDom.innerHTML = scrollDom.innerHTML;
                scrollDom.classList.remove('mui-scroll');
            }
        } else {

        }

    }

    /**
     * @description 将string字符串转为html对象,默认创一个div填充
     * @param {String} strHtml 目标字符串
     * @return {HTMLElement} 返回处理好后的html对象,如果字符串非法,返回null
     */
    function pareseStringToHtml(strHtml) {
        if (strHtml == null || typeof(strHtml) != "string") {
            return null;
        }
        //创一个灵活的div
        var i, a = document.createElement("div");
        var b = document.createDocumentFragment();
        a.innerHTML = strHtml;
        while (i = a.firstChild) b.appendChild(i);
        return b;
    }
    /**
     * @description 浏览器视口的高度
     * @return {Number} 返回具体高度
     */
    function getWinHeight() {
        var windowHeight = 0;
        if (document.compatMode == "CSS1Compat") {
            windowHeight = document.documentElement.clientHeight;
        } else {
            windowHeight = document.body.clientHeight;
        }
        return windowHeight;
    }
    /**
     * @description 获取滚动条在Y轴上的滚动距离
     * @return {Number} 返回具体距离
     */
    function getScrollTop() {
        var scrollTop = 0,
            bodyScrollTop = 0,
            documentScrollTop = 0;
        if (document.body) {
            bodyScrollTop = document.body.scrollTop || 0;
        }
        if (document.documentElement) {
            documentScrollTop = document.documentElement.scrollTop || 0;
        }
        scrollTop = (bodyScrollTop > documentScrollTop) ? bodyScrollTop : documentScrollTop;
        return scrollTop;
    }
    /**
     * @description 获取文档的总高度
     * @return {Number} 返回具体高度
     */
    function getScrollHeight() {
        var scrollHeight = 0,
            bodyScrollHeight = 0,
            documentScrollHeight = 0;
        if (document.body) {
            bodyScrollHeight = document.body.scrollHeight;
        }

        if (document.documentElement) {
            documentScrollHeight = document.documentElement.scrollHeight;
        }
        scrollHeight = (bodyScrollHeight - documentScrollHeight > 0) ? bodyScrollHeight : documentScrollHeight;
        return scrollHeight;
    }
    /**
     * @constructor 构造函数
     * @description 定义下拉刷新构造函数
     * @param {HTMLElement} elem
     * @param {JSON} options
     */
    function PullRefresh(options) {
        options = CommonTools.extend(true, {}, defaultSetting, options);

        var $this = this;
        var elem = options.container;
        $this.loadingUp = false;
        $this.finished = false;
        $this.options = options;
        if (typeof elem === 'string') {
            elem = document.querySelector(elem);
        }
        $this.elem = elem;

        //增加class
        $this.elem.classList.add('pulltorefresh-native-type');
        setPullDownFunc();

        if ($this.options.down) {
            if (CommonTools.os.dd) {
                //钉钉的下拉刷新
                //开启下拉刷新
                dd.ui.pullToRefresh.enable({
                    onSuccess: function() {
                        //alert('下拉刷新成功,立刻收起');
                        $this.options.down.callback && $this.options.down.callback();
                    },
                    onFail: function() {
                        //alert('下拉刷新失败');
                        dd.ui.pullToRefresh.stop();
                    }
                });
            } else {
                //ejs的下拉刷新
                //开启下拉刷新
                if (ejs.nativeUI) {
                    ejs.nativeUI.pullToRefresh.enable(function() {
                        $this.options.down.callback && $this.options.down.callback();
                    });
                } else {
                    ejs.ui.pullToRefresh.enable({
                        success: function() {
                            $this.options.down.callback && $this.options.down.callback();
                        },
                        error: function() {
                            //alert('下拉刷新失败');
                            ejs.ui.pullToRefresh.stop();
                        }
                    });
                }

            }
        }
        
        //兼容原生环境下的处理
        compatibleNative($this.elem || '#pullrefresh');
    }
    /**
     * @description 主动上拉加载更多
     */
    PullRefresh.prototype.pullupLoading = function() {
        if (instance.options.up) {
            //加载更多
            loadMoreAnimation(true);
            //触发上拉回调
            instance.options.up.callback && instance.options.up.callback();
        }
    };
    PullRefresh.prototype.endPullUpToRefresh = function(isNoMore) {
        if (isNoMore) {
            this.finished = true;
        }
        if (instance.options.up) {
            //去除加载更多动画
            loadMoreAnimation(false);
        }
    };
    PullRefresh.prototype.endPullDownToRefresh = function() {
        //关闭下拉刷新
        if (CommonTools.os.dd) {
            dd.ui.pullToRefresh.stop();
        } else if (CommonTools.os.ejs) {
            if (ejs.nativeUI) {
                ejs.nativeUI.pullToRefresh.stop();
            } else {
                ejs.ui.pullToRefresh.stop();
            }
        }

    };
    PullRefresh.prototype.refresh = function(refresh) {
        this.finished = false;
    };
    /**
     * @description 设置下拉刷新相关
     */
    function setPullDownFunc() {
        var x = 0,
            y = 0,
            scrollTop = 0;
        var b = document.body;
        //监听touch时间,模拟下拉
        var touchStartEvt = isSupportTouch ? 'touchstart' : 'mousedown';
        b.addEventListener(touchStartEvt, function(evt) {
            //console.log('touchstart');  
            var touch;
            if (isSupportTouch) {
                touch = evt.touches[0]; //获取第一个触点 
            } else {
                touch = evt;
            }
            x = Number(touch.pageX); //页面触点X坐标  
            y = Number(touch.pageY); //页面触点Y坐标  
            scrollTop = b.scrollTop;
            isTouch = true;
            //console.log('x = ' + x);
            //console.log('y = ' + y);
            //console.log('scrollTop = ' + scrollTop);
        });
        var touchEndEvt = isSupportTouch ? 'touchend' : 'mouseup';
        b.addEventListener(touchEndEvt, function(evt) {
            //console.log('touchend');
            isTouch = false;
            isPullDown = false;
        });
        var touchMoveEvt = isSupportTouch ? 'touchmove' : 'mousemove';
        b.addEventListener(touchMoveEvt, function(evt) {
            //console.log('touchmove');  
            var touch;
            if (isSupportTouch) {
                touch = evt.touches[0]; //获取第一个触点 
            } else {
                touch = evt;
            }
            var mx = Number(touch.pageX); //页面触点X坐标  
            var my = Number(touch.pageY); //页面触点Y坐标  

            //console.log("isTouch = " + isTouch)  
            //console.log("y-my = " + (y-my))  
            //console.log("b.scrollTop = " + b.scrollTop);  
            if (isTouch) {
                if (my - y > 30) {
                    if (b.scrollTop == 0) {
                        if (!isPullDown) {
                            console.log("PullDown");
                            isPullDown = true;
                        }
                    }
                }
                //alert('scrollTop:'+scrollTop+',b.scrollTop:'+b.scrollTop+',y:'+y+',my:'+my);
                if (y - my > 100) {

                    if (scrollTop == b.scrollTop) {
                        if (!instance.loadingUp) {
                            //console.log('my = ' + my);  
                            //console.log('y = ' + y);  
                            //console.log('scrollTop = ' + scrollTop);  
                            //console.log('b.scrollTop = ' + b.scrollTop);  
                            //console.log("pullup,finish:"+instance.finished);
                            if (!instance.finished) {
                                if (instance.options.up) {
                                    //加载更多
                                    loadMoreAnimation(true);
                                    //触发上拉回调
                                    instance.options.up.callback && instance.options.up.callback();
                                }
                            }

                        }
                    }
                }

            }
        });

        //ios下的补救措施
        var scrollFunc = function() {
            var y = getScrollTop();
            var slider = document.getElementById('sliderSegmentedControl');

            if ((y + getWinHeight()) === getScrollHeight()) {
                if (!instance.loadingUp) {
                    if (!instance.finished) {
                        if (instance.options.up) {
                            //加载更多
                            loadMoreAnimation(true);
                            //触发上拉回调
                            instance.options.up.callback && instance.options.up.callback();
                        }
                    }
                }

            }
        };
        document.onscroll = scrollFunc;
    }
    /**
     * @description 控制加载更多
     * @param {Boolean} more
     */
    function loadMoreAnimation(more) {

        var dom = instance.elem;
        if (!dom) {
            return;
        }

        if (more) {
            if (!instance.loadingUp) {
                //显示loading
                var content = instance.options.up.contentrefresh || '正在加载...';
                pulluploadingTips = pulluploadingTips.replace('{{contentrefresh}}', content);
                dom.appendChild(pareseStringToHtml(pulluploadingTips));
                instance.loadingUp = true;
            }
        } else {
            if (instance.loadingUp) {
                //隐藏loading
                var loadingDom = dom.querySelector('.mui-pull-bottom-tips');
                loadingDom && loadingDom.parentNode.removeChild(loadingDom);
                instance.loadingUp = false;
            }
        }
    }
    
    function initPullToRefresh(options) {
        if(instance) {
            return instance;
        }
        instance = new PullRefresh(options);
        
        if (options.up && options.up.auto) {
            // 如果设置了auto，则自动上拉一次
            instance.pullupLoading();
        }
        
        return instance;
    }

    CommonTools.namespace('skin.natives', initPullToRefresh);

})({}, PullToRefreshTools);