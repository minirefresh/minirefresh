/**
 * 作者: dailc
 * 创建时间: 2017/03/28
 * 版本: [1.0, 2017/05/26 ]
 * 版权: dailc
 * 描述: 下拉刷新基于业务的实现
 * 仍然基于公司的标准接口(handdata里的v6和v7)
 */
(function(CommonTools) {
    "use strict";

    var dataProcess = Util.dataProcess;

    /**
     * 通过判断是否支持tap来决定点击的是tap还是click
     */
    var touchSupport = ('ontouchstart' in document);
    var tapEventName = touchSupport ? 'tap' : 'click';

    var defaultSetting = {
        // 是否是debug模式,如果是的话会输出错误提示
        isDebug: false,
        // 默认的下拉刷新容器选择器
        container: '#pullrefresh',
        // 默认的列表数据容器选择器
        listContainer: '#listdata',
        type: 'POST',
        // 默认的请求页面,根据不同项目服务器配置而不同,正常来说应该是0
        initPageIndex: 0,
        pageSize: 10,
        // 得到url 要求是一个函数(返回字符串) 或者字符串
        url: null,
        // 得到模板 要求是一个函数(返回字符串) 或者字符串
        template: '#item-template',
        // 得到请求参数 必须是一个函数,因为会根据不同的分页请求不同的数据,该函数的第一个参数是当前请求的页码
        dataRequest: null,
        // 改变数据的函数,代表外部如何处理服务器端返回过来的数据
        // 如果没有传入,则采用内部默认的数据处理方法
        dataChange: null,
        // 列表元素点击回调，传入参数是  e,即目标对象
        itemClick: null,
        // 请求成功,并且成功处理后会调用的成功回调方法,传入参数是成功处理后的数据
        success: null,
        // 请求失败后的回调,可以自己处理逻辑,默认请求失败不做任何提示
        error: null,
        // 下拉刷新回调,这个回调主要是为了自动映射时进行数据处理
        refresh: null,
        // 是否请求完数据后就自动渲染到列表容器中,如果为false，则不会
        // 代表需要自己手动在成功回调中自定义渲染
        isAutoRender: true,
        // 表监听元素选择器,默认为给li标签添加标签
        itemSelector: 'li',
        // 下拉刷新后的延迟访问时间,单位为毫秒
        delay: 0,
        // 默认的请求超时时间
        timeout: 6000,
        /* ajax的Accept,不同的项目中对于传入的Accept是有要求的
         * 传入参数,传null为使用默认值
         * 示例
         * {
         * script: 'text/javascript, application/javascript, application/x-javascript',
         * json: 'application/json;charset=utf-8'
         * 等等(详情看源码)
         * }
         */
        accepts: {
            script: 'text/javascript, application/javascript, application/x-javascript',
            json: 'application/json',
            xml: 'application/xml, text/xml',
            html: 'text/html',
            text: 'text/plain'
        },
        // 默认的contentType
        contentType: "application/x-www-form-urlencoded",
        // 自定义头部默认为空
        headers: null,
        setting: {
            // 下拉有关
            down: {
                // 可以自定义自己的设置
                isSuccessTips: true,
            },
            // 上拉有关
            up: {
                // 可以自定义自己的设置
                auto: true,
            }
        }
    };

    /**
     * 将string字符串转为html对象,默认创一个div填充
     * @param {String} strHtml 目标字符串
     * @return {HTMLElement} 返回处理好后的html对象,如果字符串非法,返回null
     */
    function pareseStringToHtml(strHtml) {
        if (strHtml == null || typeof(strHtml) != "string") {
            return null;
        }
        // 创一个灵活的div
        var i, a = document.createElement("div");
        var b = document.createDocumentFragment();

        a.innerHTML = strHtml;
        while (i = a.firstChild) b.appendChild(i);
        return b;
    }

    /**
     * 组件的构造函数
     * @param {Object} options 配置参数，和init以及initData的一致
     * @constructor
     */
    function PullToRefresh(options) {
        var self = this;

        options = CommonTools.extend(true, {}, defaultSetting, options);

        // 准备改变 template的默认值
        var template = options.template;

        if ((typeof template === 'string' && /^[.#]/.test(template)) || template instanceof HTMLElement) {
            // 这个代表仅仅是模板
            var templateDom = CommonTools.selector(template);
            if (templateDom) {
                template = templateDom.innerHTML.toString() || '';
            }
        }

        options.template = template;

        // 生成下拉刷新对象,有一个默认值
        var PullToRefreshBase = options.skin || PullToRefreshTools.skin.defaults;

        if (!PullToRefreshBase) {
            throw new Error("错误:传入的下拉刷新皮肤错误,超出范围!");
            return;
        }

        // 下拉刷新基础的设置
        var setting = options.setting;

        // 需要修改setting的container指向真实container
        setting.container = options.container;

        if (setting.down) {
            setting.down.callback = function() {
                self._pullDownCallback();
            };
        }
        if (setting.up) {
            setting.up.callback = function() {
                self._pullUpCallback();
            };
        }

        this.container = CommonTools.selector(options.container);
        this.listContainer = CommonTools.selector(options.listContainer);
        this.options = options;
        this.setting = setting;

        this._initParams();
        
        // 生成真正的下拉刷新示例对象，要在参数初始化完毕后生成
        this.instance = new PullToRefreshBase(setting);
        
        this._addEvent();

    }

    /**
     * 定义原型
     */
    PullToRefresh.prototype = {
        _initParams: function() {
            // 是否不可以加载更多,如果某些的返回数据为空,代表不可以加载更多了
            this.isShouldNoMoreData = true;
            // 初始化当前页
            this.currPage = this.options.initPageIndex;
            if (this.setting.up && this.setting.up.auto) {
                // 如果初始化请求,当前页面要减1
                this.currPage--;
            }
        },
        /**
         * 下拉回调
         */
        _pullDownCallback: function() {
            var self = this,
                options = this.options;

            if (!this.loadingDown) {
                // 清空 -下拉的时候不清空,请求成功或者失败后再清空
                // 下拉标记,为了回复的时候进行辨别
                this.isPullDown = true;
                this.loadingDown = true;
                this.currPage = options.initPageIndex;

                // 延迟delayTime毫秒访问
                setTimeout(function() {
                    self._ajaxRequest();
                }, options.delay);

                // 下拉刷新回调
                options.refresh && options.refresh(true);
            }
        },
        /**
         * 上拉回调
         */
        _pullUpCallback: function() {
            var self = this;

            if (!this.loadingUp) {
                this.isPullDown = false;
                this.loadingUp = true;

                this.currPage++;
                setTimeout(function() {
                    self._ajaxRequest();
                }, this.options.delay);
            }
        },
        _clearResponseEl: function() {
            this.options.isAutoRender && this.listContainer && (this.listContainer.innerHTML = '');
        },
        /**
         * 渲染下拉刷新的模板，返回渲染的数据条数
         * @param {Object} response
         * @return {Number} 实际渲染的数据调试
         */
        _render: function(response) {
            var options = this.options;

            var dataLen = 0;

            if (options.isAutoRender) {
                // 如果自动渲染
                // 如果是下拉加载 先清空
                if (this.isPullDown) {
                    this._clearResponseEl();
                }

                // 必须包含Mustache
                if (window.Mustache) {
                    if (response && Array.isArray(response) && response.length > 0) {
                        var outList = '';
                        for (var i = 0, len = response.length; i < len; i++) {
                            var value = response[i];
                            // 默认模版
                            var template = "";
                            if (options.template) {
                                if (typeof(options.template) === "string") {
                                    // 如果模板是字符串
                                    template = options.template;
                                } else if (typeof(options.template) === "function") {
                                    // 如果模板是函数
                                    template = options.template(value);
                                }
                            }
                            outList += Mustache.render(template, value);
                            dataLen++;
                        }
                        if (outList != "") {
                            this.listContainer.appendChild(pareseStringToHtml(outList));
                        }
                    } else {
                        // 没有返回数据,代表不可以加载更多
                        this.isShouldNoMoreData = false;
                    }
                } else {
                    this.isShouldNoMoreData = false;
                    if (options.isDebug) {
                        console.error('error***没有包含mustache文件,无法进行模板渲染');
                    }
                }
            }

            return dataLen;
        },
        /**
         * 内置的默认数据转换函数
         * @param {JSON} response
         */
        _dataChangeDefault: function(response) {
            // 数据都使用通用处理方法
            var result = dataProcess(response, {
                dataPath: ['custom.infolist', 'custom.infoList', 'UserArea.InfoList']
            });

            return result.data;
        },
        _ajaxRequest: function() {
            var self = this,
                options = this.options;

            if (!options.url) {
                // 如果url不存在
                if (options.isDebug) {
                    console.error('error***url无效,无法访问');
                }
                // 触发错误回调
                this._errorRequest(null, null, '请求url为空!');
                return;
            }

            var next = function(requestData) {
                var url = "";

                if (typeof(options.url) == "function") {
                    url = options.url();
                } else {
                    url = options.url;
                }

                Util.ajax({
                    url: url,
                    data: requestData,
                    dataType: "json",
                    timeout: options.timeout,
                    type: options.type,
                    // 接受的头
                    accepts: options.accepts,
                    // 自定义头部
                    headers: options.headers,
                    // contentType
                    contentType: options.contentType,
                    success: function(response) {
                        self._successRequest(response);
                    },
                    error: function(xhr, status) {
                        self._errorRequest(xhr, status, '请求失败!');
                    }
                });
            };

            if (options.dataRequest) {
                var requestData = options.dataRequest(this.currPage, function(requestData) {
                    next(requestData);
                });
                if (requestData !== undefined) {
                    next(requestData);
                }

            } else {
                if (options.isDebug) {
                    console.warn('warning***请注意dataRequest不存在,默认数据为空');
                }
                next();
            }
        },
        /**
         * 请求失败回调
         * @param {JSON} xhr
         * @param {Number} status
         * @param {String} msg
         */
        _errorRequest: function(xhr, status, msg) {
            var options = this.options;

            // 没有返回数据,代表不可以加载更多
            this.isShouldNoMoreData = false;
            this._refreshState(false);
            this.currPage--;
            this.currPage = this.currPage >= options.initPageIndex ? this.currPage : options.initPageIndex;
            options.error && options.error(xhr, status, msg);
        },
        /**
         * 成功回调
         * @param {JSON} response 成功返回数据
         */
        _successRequest: function(response) {
            var options = this.options;
            
            if (!response) {
                if (options.isDebug) {
                    console.log('warning***返回的数据为空,请注意！');
                }
                this.isShouldNoMoreData = false;
                this._refreshState(false);
                return;
            }
            if (options.isDebug) {
                console.log('下拉刷新返回数据:' + JSON.stringify(response));
            }
            if (options.dataChange) {
                // 如果存在转换数据的函数,用外部提供的
                response = options.dataChange(response);
            } else {
                // 使用默认的数据转换
                response = this._dataChangeDefault(response);
            }
            
            var dataLen = this._render(response);
            
            if(this.loadingMoreSuccess) {
                this.loadingMoreSuccess();
                this.loadingMoreSuccess = null;
            }
            
            // 成功后的回调方法
            if (options.success && typeof(options.success) === "function") {
                // 如果回调函数存在,第二个参数代表是否是下拉刷新请求的,如果是,则是代表需要重新刷新数据
                options.success(response, this.isPullDown || (this.currPage == options.initPageIndex));
            }
            
            this._refreshState(true, dataLen);
        },
        /**
         * 重置状态
         * @param {Boolean} isSuccess 是否请求成功
         * @param {Number} dataLen 更新的数据条数
         */
        _refreshState: function(isSuccess, dataLen) {
            var instance = this.instance;

            dataLen = dataLen || 0;
            // 设置tips  这个可以用来设置  更新了多少条数据等等
            instance.setSuccessTips && instance.setSuccessTips('更新' + dataLen + '条数据');

            if (this.isPullDown) {
                // 如果是下拉刷新
                instance.endPullDownToRefresh(isSuccess);
                // 不管是下拉刷新还是上拉加载,都要刷新加载更多状态
                // 如果加载更多是否已经结束了
                if (instance.finished) {
                    instance.refresh(true);
                    // 又可以加载更多
                    this.isShouldNoMoreData = true;
                }
            }
            if (!this.isShouldNoMoreData) {
                // 没有更多数据 
                instance.endPullUpToRefresh(true, isSuccess);
            } else {
                // 加载更多
                instance.endPullUpToRefresh(false, isSuccess);
            }

            this.loadingDown = false;
            this.loadingUp = false;
        },
        /**
         * 增加监听事件
         * 目前用mui的监听
         */
        _addEvent: function() {
            var listContainer = this.listContainer,
                options = this.options,
                itemClick = options.itemClick;

            if (typeof itemClick === 'function') {
                mui(listContainer).on(tapEventName, options.itemSelector, itemClick);
            }
        },
        /**
         * 刷新,这里默认为清空,并触发一次加载更多
         */
        refresh: function() {
            var options = this.options;

            if (!options.up || !this.instance.enablePullUp) {
                // 如果不存在上拉加载
                this._clearResponseEl();
                this._pullDownCallback();
            } else if (!this.loadingUp) {
                // 存在上拉加载
                // 清空以前容器中的数据
                this._clearResponseEl();
                // 当前页变为初始页-1  因为会处罚上拉回调,默认将页数+1
                this.currPage = options.initPageIndex - 1;
                this.loadingMore();
            }
        },
        /**
         * 增加加载更多的翻页功能
         * @param {Function} callback 成功回调
         */
        loadingMore: function(callback) {
            var instance = this.instance;

            // 只会用一次的，用完即可删除
            this.loadingMoreSuccess = callback;
            // 手动将状态设为可以加载更多
            if (this.instance.finished) {
                this.instance.refresh(true);
                this.isShouldNoMoreData = true;
            }
            // 触发一次加载更多
            instance.pullupLoading();
        },
        /**
         * 禁止上拉加载功能
         */
        disablePullupToRefresh: function() {
            this.pullToRefreshInstance.disablePullupToRefresh();
        },
        /**
         * 开启上拉加载功能
         */
        enablePullupToRefresh: function() {
            this.pullToRefreshInstance.enablePullupToRefresh();
        },
        /**
         * 将需要暴露的destroy绑定到了 原型链上
         */
        destroy: function() {

            mui(listContainer).off();

            this.container = null;
            this.listContainer = null;
            this.instance = null;
            this.options = null;

        }
    };

    CommonTools.namespace('bizlogic', PullToRefresh);
})(PullToRefreshTools);