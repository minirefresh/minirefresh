/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/22 
 * 版本: [3.0, 2017/05/22 ]
 * 版权: 移动研发部
 * 描述: h5和原生交互，jsbridge核心代码
 * 仅native api时用到，基于ejs.core的
 */
(function() {
    window.JSBridge = window.top.JSBridge || {};

    // 长期存在的回调
    var responseCallbacksLongTerm = {};
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    // jsbridge协议定义的名称
    var CUSTOM_PROTOCOL_SCHEME = 'EpointJSBridge';

    // 定义的回调函数集合,在原生调用完对应的方法后,会执行对应的回调函数id
    var responseCallbacks = {};
    // 唯一id,用来确保长期回调的唯一性
    var uniqueLongCallbackId = 10000001;
    // 本地注册的方法集合,原生只能调用本地注册的方法,否则会提示错误
    var messageHandlers = {};
    // 当原生调用H5注册的方法时,通过回调来调用(也就是变为了异步执行,加强安全性)
    var dispatchMessagesWithTimeoutSafety = true;

    // 实际暴露给原生调用的对象
    var Inner = {
        /**
         * 注册本地JS方法通过JSBridge给原生调用
         * 我们规定,原生必须通过JSBridge来调用H5的方法
         * 注意,这里一般对本地函数有一些要求,要求第一个参数是data,第二个参数是callback
         * @param {String} handlerName 方法名
         * @param {Function} handler 对应的方法
         */
        registerHandler: function(handlerName, handler) {
            messageHandlers[handlerName] = handler;
        },
        /**
         * 注册长期回调到本地
         * @param {String} callbackId 回调id
         * @param {Function} callback 对应回调函数
         */
        registerLongCallback: function(callbackId, callback) {
            responseCallbacksLongTerm[callbackId] = callback;
        },
        /**
         * 获得本地的长期回调，每一次都是一个唯一的值
         * @retrurn 返回对应的回调id
         */
        getLongCallbackId: function() {
            return uniqueLongCallbackId++;
        },
        /**
         * 调用原生开放的方法
         * @param {String} obj 这个属于协议头的一部分
         * @param {String} handlerName 方法名
         * @param {JSON} data 参数
         * @param {Function||String} callback 回调函数或者是长期的回调id
         */
        callHandler: function(obj, handlerName, data, callback) {
            // 如果没有 data
            if (arguments.length == 3 && typeof data == 'function') {
                callback = data;
                data = null;
            }
            _doSend(obj, {
                handlerName: handlerName,
                data: data
            }, callback);
        },

        /**
         * 原生调用H5页面注册的方法,或者调用回调方法
         * @param {String} messageJSON 对应的方法的详情,需要手动转为json
         */
        _handleMessageFromNative: function(messageJSON) {
            if (dispatchMessagesWithTimeoutSafety) {
                setTimeout(_doDispatchMessageFromNative);
            } else {
                _doDispatchMessageFromNative();
            }
            /**
             * 处理原生过来的方法
             */
            function _doDispatchMessageFromNative() {
                var message;
                try {
                    if (typeof messageJSON === 'string') {
                        messageJSON = decodeURIComponent(messageJSON);
                        message = JSON.parse(messageJSON);
                    } else {
                        message = messageJSON;
                    }
                } catch (e) {
                    // TODO: handle the exception
                    ejs.errorTips(ejs.globalError.ERROR_TYPE_NATIVECALL.code, ejs.globalError.ERROR_TYPE_NATIVECALL.msg);
                    // console.error("原生调用H5方法出错,传入参数错误");
                    return;
                }

                // 回调函数
                var responseCallback;
                if (message.responseId) {
                    // 这里规定,原生执行方法完毕后准备通知h5执行回调时,回调函数id是responseId
                    responseCallback = responseCallbacks[message.responseId];
                    responseCallback = responseCallback || responseCallbacksLongTerm[message.responseId];
                    if (!responseCallback) {
                        return;
                    }
                    // 执行本地的回调函数
                    responseCallback && responseCallback(message.responseData);
                    delete responseCallbacks[message.responseId];

                } else {
                    // 否则,代表原生主动执行h5本地的函数
                    // 也需要映射非法字符

                    // 从本地注册的函数中获取
                    var handler = messageHandlers[message.handlerName];
                    if (!handler) {
                        // 本地没有注册这个函数
                    } else {
                        // 执行本地函数,按照要求传入数据和回调
                        handler(message.data);
                    }
                }
            }
        }

    };
    /**
     * JS调用原生方法前,会先send到这里进行处理
     * @param {String} obj 这个属于协议头的一部分
     * @param {JSON} message 调用的方法详情,包括方法名,参数
     * @param {Function||String} responseCallback 调用完方法后的回调,或者长期回调的id
     */
    function _doSend(obj, message, responseCallback) {
        if (responseCallback && (typeof responseCallback === 'function')) {
            // 取到一个唯一的callbackid
            var callbackId = Util.getCallbackId();
            // 回调函数添加到集合中
            responseCallbacks[callbackId] = responseCallback;
            // 方法的详情添加回调函数的关键标识
            message['callbackId'] = callbackId;
        } else if (typeof responseCallback === 'string' || typeof responseCallback === 'number') {
            // 长期的回调,传进来的就是id,已经默认在回调池中了
            message['callbackId'] = responseCallback;
        }

        // 获取 触发方法的url scheme
        // android和ios的url scheme调用有所区别
        var uri = Util.getUri(obj, message);

        if (ejs.os.ejs) {
            if (ejs.isDebug) {
                alert("触发ejs scheme:" + uri);
            }
            if (ejs.os.ios) {
                // ios采用
                window.webkit.messageHandlers.WKWebViewJavascriptBridge.postMessage(uri);
            } else {
                window.top.prompt(uri, "");
            }
        } else {
            // 浏览器
            console.error("浏览器中ejs无效,scheme:" + uri);
        }
    }

    var Util = {
        /**
         * 获取回调id
         * @return {Number} 返回一个随机的回调id
         */
        getCallbackId: function() {
            var random = Math.floor(Math.random() * (1 << 30));
            if (Math.abs(random - uniqueLongCallbackId) > 1000) {
                // 如果满足要求，不能和长期回调重合，目前保留1000个长期回调，实际上是不会有1000个的
                return random + '';
            } else {
                // 重新生成
                return this.getCallbackId();
            }
        },
        /**
         * /获取url scheme
         * @param {Object} obj
         * @param {Object} message 兼容android中的做法
         * android中由于原生不能获取JS函数的返回值,所以得通过协议传输
         */
        getUri: function(obj, message) {
            var uri = CUSTOM_PROTOCOL_SCHEME + '://' + obj;
            // 回调id作为端口存在
            var callbackId, method, params;
            if (message.callbackId) {
                // 第一种:h5主动调用原生
                callbackId = message.callbackId;
                method = message.handlerName;
                params = message.data;
            } else if (message.responseId) {
                // 第二种:原生调用h5后,h5回调
                // 这种情况下需要原生自行分析传过去的port是否是它定义的回调
                callbackId = message.responseId;
                method = message.handlerName;
                params = message.responseData;
            }
            // 参数转为字符串
            params = this.getParam(params);
            // uri 补充,需要编码，防止非法字符
            uri += ':' + callbackId + '/' + method + '?' + encodeURIComponent(params);

            return uri;
        },
        /**
         * 将参数转为字符串
         * @param {Object} obj
         */
        getParam: function(obj) {
            if (obj && typeof obj === 'object') {
                return JSON.stringify(obj);
            } else {
                return obj || '';
            }
        }
    };
    for (var key in Inner) {
        if (!hasOwnProperty.call(JSBridge, key)) {
            JSBridge[key] = Inner[key];
        }
    }

})();
/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/01
 * 版本: [3.0, 2017/06/01 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: native的 auth 模块 
 */
(function() {

    /**
     * 拓展ui模块
     */
    ejs.extendModule('auth', [{
        namespace: "getToken",
        os: ['ejs']
    }]);
})();
/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/25
 * 版本: [3.0, 2017/05/25 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: native的 call 模块，核心都是通过call来调用，统一管理 
 */
(function() {
    /**
     * 注册接收原生的错误信息
     */
    JSBridge.registerHandler('handleError', function(data) {
        // 可以后续将data传给h5
        ejs.errorTips(ejs.globalError.ERROR_TYPE_NATIVE.code, '原生容器错误:' + JSON.stringify(data));
    });

    /**
     * 调用ejs的自定义方法
     * 有三大类型，短期回调，延时回调，长期回调，其中长期回调中又有一个event比较特殊
     * @param {JSON} options 配置参数，包括
     * handlerName 方法名
     * data 额外参数
     * isLongCb 是否是长期回调，如果是，则会生成一个长期回调id，以长期回调的形式存在
     * proto 默认为 custom，其中
     * origin 代表ejs默认的头部
     * custom 代表自定义头部
     * 其它 代表相应的头部
     * 
     * @param {Function} success 成功回调函数
     * @param {Function} error 错误回调函数
     * 
     */
    ejs._innerCall = function(options, resolve, reject) {
        options = options || {};
        var proto = options.proto,
            success = options.success,
            error = options.error,
            dataFilter = options.dataFilter;

        if (!proto) {
            ejs.errorTips(ejs.globalError.ERROR_TYPE_PROTONOTEXIST.code, ejs.globalError.ERROR_TYPE_PROTONOTEXIST.msg);
            return;
        }

        var handlerName = options.handlerName,
            isLongCb = options.isLongCb || false,
            isEvent = options.isEvent || false,
            data = options.data || {};

        // 统一的回调处理
        var cbFunc = function(res) {
            if (res.code == 0) {
                error && error(res);
                !isLongCb && reject && reject(res);
            } else {
                if (dataFilter) {
                    res = dataFilter(res);
                }
                success && success(res.result);
                !isLongCb && resolve && resolve(res.result);
            }
        };

        if (isLongCb) {
            /**
             * 长期回调的做法，需要注册一个长期回调id,每一个方法都有一个固定的长期回调id
             * 短期回调的做法(短期回调执行一次后会自动销毁)
             * 但长期回调不会销毁，因此可以持续触发，例如下拉刷新
             * 长期回调id通过函数自动生成，每次会获取一个唯一的id
             */
            var longCbId = JSBridge.getLongCallbackId();
            if (isEvent) {
                // 如果是event，data里需要增加一个参数
                data.port = longCbId;
            }
            JSBridge.registerLongCallback(longCbId, cbFunc);
            // 传入的是id
            JSBridge.callHandler(proto, handlerName, data, longCbId);
            // 长期回调默认就成功了，这是兼容的情况，防止有人误用
            resolve && resolve();
        } else {
            // 短期回调直接使用方法
            JSBridge.callHandler(proto, handlerName, data, cbFunc);
        }
    };

    /**
     * 专门供API内部调用的，this指针被执行了proxy对象，方便处理
     * @param {Object} options
     */
    ejs._callProxy = function(options, resolve, reject) {
        if (!this.api || !this.api.moduleName || !this.api.namespace) {
            return;
        }
        var data = ejs.innerUtil.extend({}, options);

        data.success = undefined;
        data.error = undefined;
        data.dataFilter = undefined;

        /**
         * 注册长期回调可以由一个统一的方法控制，而不是写死
         * 注意，取消注册时是一个短期回调
         * 另外，namespace默认为h5与原生一致，如果不一致，相应的API内部可以自行修改
         */
        ejs._innerCall({
            'handlerName': this.api.namespace,
            'data': data,
            'proto': this.api.moduleName,
            'success': options.success,
            'error': options.error,
            'dataFilter': options.dataFilter,
            'isLongCb': this.api.isLongCb,
            'isEvent': this.api.isEvent
        }, resolve, reject);

    };

    /**
     * 调用自定义API
     * @param {Object} options
     */
    ejs.callApi = function(options) {
        options = options || {};

        var callback = function(resolve, reject) {
            /**
             * 注册长期回调可以由一个统一的方法控制，而不是写死
             * 注意，取消注册时是一个短期回调
             * 另外，namespace默认为h5与原生一致，如果不一致，相应的API内部可以自行修改
             */
            ejs._innerCall({
                'handlerName': options.name,
                'proto': options.mudule,
                'data': options.data,
                'success': options.success,
                'error': options.error,
                'isLongCb': options.isLongCb,
                'isEvent': options.isEvent
            }, resolve, reject);
        };
        
        
        return (ejs.Promise && new Promise(callback)) || callback();
    };
})();
/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/31
 * 版本: [3.0, 2017/05/31 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: native的 page 模块 
 */
(function() {
    /**
     * 拓展ui模块
     */
    ejs.extendModule('device', [{
        namespace: "setOrientation",
        os: ['ejs'],
        defaultParams: {
            // 1表示竖屏，0表示横屏，其他表示跟随系统
            orientation: 1
        }
    }, {
        namespace: "getDeviceId",
        os: ['ejs']
    }, {
        namespace: "getMacAddress",
        os: ['ejs']
    }, {
        namespace: "getScreenInfo",
        os: ['ejs']
    }, {
        namespace: "getVendorInfo",
        os: ['ejs']
    }, {
        namespace: "isTablet",
        os: ['ejs']
    }, {
        namespace: "getNetWorkInfo",
        os: ['ejs']
    }, {
        namespace: "callPhone",
        os: ['ejs'],
        defaultParams: {
            phoneNum: ''
        },
        runCode: function(options, resolve, reject) {
            // 兼容字符串形式
            if (typeof options !== 'object') {
                options = {
                    phoneNum: arguments[0]
                };
            }
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "sendMsg",
        os: ['ejs'],
        defaultParams: {
            phoneNum: '',
            message: ''
        },
        runCode: function(options, resolve, reject) {
            // 兼容字符串形式
            if (typeof options !== 'object') {
                options = {
                    phoneNum: arguments[0],
                    message: arguments[1]
                };
            }
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "sendTo",
        os: ['ejs'],
        defaultParams: {
            title: '',
            url: '',
            imgBase64: '',
            imgURL: '',
            sdPath: ''
        }
    }]);
})();
/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/01
 * 版本: [3.0, 2017/06/01 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: native的 event 模块 
 */
(function() {

    /**
     * 前端的EVENT名称和原生容器的有一些差别
     */
    var EVENT_MAPPING = {
        resume: 'OnPageResume',
        pause: 'OnPagePause',
        netChange: 'OnNetChanged'
    };
    /**
     * 拓展ui模块
     */
    ejs.extendModule('event', [{
        namespace: "registerEvent",
        os: ['ejs'],
        defaultParams: {
            key: ""
        },
        runCode: function(options, resolve, reject) {
           
            options.key = EVENT_MAPPING[options.key];

            if (!options.key) {
                ejs.errorTips(ejs.globalError.ERROR_TYPE_EVENTNOTEXIST.code, ejs.globalError.ERROR_TYPE_EVENTNOTEXIST.msg);
                return;
            }
            
            // 长期回调为true，里面会自动生成长期回调id
            this.api.isLongCb = true;
            // 标识是event，event的时候需要额外增加一个port参数，对应相应的长期回调id
            this.api.isEvent = true;
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "unRegisterEvent",
        os: ['ejs'],
        defaultParams: {
            key: ""
        },
        runCode: function(options, resolve, reject) {
            
            options.key = EVENT_MAPPING[options.key];

            if (!options.key) {
                ejs.errorTips(ejs.globalError.ERROR_TYPE_EVENTNOTEXIST.code, ejs.globalError.ERROR_TYPE_EVENTNOTEXIST.msg);
                return;
            }
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "isRegisterEvent",
        os: ['ejs'],
        defaultParams: {
            key: ""
        }
    }, {
        namespace: "config",
        os: ['ejs'],
        defaultParams: {
            // 一个数组
            jsApiList: null
        }
    }]);
})();
/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/31
 * 版本: [3.0, 2017/05/31 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: native的 navigator 模块 
 */
(function() {

    /**
     * 拓展ui模块
     */
    ejs.extendModule('navigator', [{
        namespace: "setTitle",
        os: ['ejs'],
        defaultParams: {
            pageTitle: ""
        },
        runCode: function(options, resolve, reject) {
            if (typeof options === 'string') {
                // 兼容字符串
                options = {
                    pageTitle: options
                };
            }
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "show",
        os: ['ejs']
    }, {
        namespace: "hide",
        os: ['ejs']
    }, {
        namespace: "showSearchBar",
        os: ['ejs'],
        runCode: function(options, resolve, reject) {
            // 长期回调为true，里面会自动生成长期回调id
            this.api.isLongCb = true;
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "hideSearchBar",
        os: ['ejs']
    }, {
        namespace: "hideBackButton",
        os: ['ejs']
    }, {
        namespace: "hookSysBack",
        os: ['ejs'],
        runCode: function(options, resolve, reject) {
            // 长期回调为true，里面会自动生成长期回调id
            this.api.isLongCb = true;
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "hookBackBtn",
        os: ['ejs'],
        runCode: function(options, resolve, reject) {
            // 长期回调为true，里面会自动生成长期回调id
            this.api.isLongCb = true;
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "setRightBtn",
        os: ['ejs'],
        defaultParams: {
            text: '',
            imageUrl: '',
            isShow: 1
        },
        runCode: function(options, resolve, reject) {
            // 长期回调为true，里面会自动生成长期回调id
            this.api.isLongCb = true;
            
            options.imageUrl = ejs.innerUtil.getFullPath(options.imageUrl);
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "setRightBtn2",
        os: ['ejs'],
        defaultParams: {
            text: '',
            imageUrl: '',
            isShow: 1
        },
        runCode: function(options, resolve, reject) {
           // 长期回调为true，里面会自动生成长期回调id
            this.api.isLongCb = true;
            
            options.imageUrl = ejs.innerUtil.getFullPath(options.imageUrl);
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "setRightMenu",
        os: ['ejs'],
        defaultParams: {
            text: '',
            imageUrl: '',
            // 过滤色默认为空
            iconFilterColor: '',
            // 点击后出现的菜单列表，这个API会覆盖rightBtn
            titleItems: [],
            iconItems: []
        },
        runCode: function(options, resolve, reject) {
            // 这个API比较特殊，暂时由前端模拟
            var newOptions = ejs.innerUtil.extend({}, options);
            
            // popwindow相关的它内部会修改
            newOptions.imageUrl = ejs.innerUtil.getFullPath(newOptions.imageUrl);                       
            
            newOptions.success = function(result, res) {
                // 点击的时候，弹出菜单
                ejs.ui.popWindow(options);
            };
                      
            ejs.navigator.setRightBtn(newOptions, resolve, reject);
        }
    }, {
        namespace: "setLeftBtn",
        os: ['ejs'],
        defaultParams: {
            text: '',
            imageUrl: '',
            isShow: 1
        },
        runCode: function(options, resolve, reject) {
            // 长期回调为true，里面会自动生成长期回调id
            this.api.isLongCb = true;
            
            options.imageUrl = ejs.innerUtil.getFullPath(options.imageUrl);
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "showStatusBar",
        os: ['ejs']
    }, {
        namespace: "hideStatusBar",
        os: ['ejs']
    }]);
})();
/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/31
 * 版本: [3.0, 2017/05/31 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: native的 page 模块 
 */
(function() {

    /**
     * 拓展ui模块
     */
    ejs.extendModule('page', [{
        namespace: "open",
        os: ['ejs'],
        defaultParams: {
            pageUrl: "",
            pageStyle: 1,
            // 横竖屏,默认为1表示竖屏
            orientation: 1,
            // 额外数据
            data: {}
        },        
        runCode: function(options, resolve, reject) {
            // TODO: ejs openpage需要支持相对路径
            
            if (typeof options === 'string') {
                // 兼容open(url,data)的做法                
                options = {
                    pageUrl: arguments[0],
                    data: arguments[1]
                };
            }

            // 将额外数据拼接到url中
            options.pageUrl = ejs.innerUtil.getFullUrlByParams(options.pageUrl, options.data);
            // 去除无用参数的干扰
            options.data = undefined;
            
            var success = options.success;
            
            ejs._callProxy.call(this, ejs.innerUtil.extend({
                success: function(result, res) {
                    // 转为json，针对closePage的传参优化
                    if (typeof res.result.resultData === 'string') {
                        try {
                            res.result.resultData = JSON.parse(res.result.resultData);
                        } catch (e) {}
                    }
                    success && success(res.result, res);
                }
            }, options), resolve, reject);

        }
    }, {
        namespace: "openLocal",
        os: ['ejs'],
        defaultParams: {
            className: "",
            // 为1则是打开已存在的页面，会杀掉所有该页面上的页面
            isOpenExist: 0,
            // 额外数据，注意额外数据只能一层键值对形式，不能再包裹子json
            data: {}
        }
    }, {
        namespace: "close",
        os: ['ejs'],
        defaultParams: {
            // 需要传递的参数，是一个字符串
            resultData: ''
        },
        runCode: function(options, resolve, reject) {
            // 兼容字符串形式
            if (typeof options === 'string') {
                options = {
                    resultData: arguments[0]
                };
            }             
            
            if (typeof options.resultData == 'object') {
                // 如果传递的参数是一个json
                options.resultData = JSON.stringify(options.resultData);
            }
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "reload",
        os: ['ejs']
    }]);
})();
/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/01
 * 版本: [3.0, 2017/06/01 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: native的 runtime 模块 
 */
(function() {

    /**
     * 拓展ui模块
     */
    ejs.extendModule('runtime', [{
        namespace: "launchApp",
        os: ['ejs'],
        defaultParams: {
            // android应用的包名
            packageName: '',
            // android应用页面类名
            className: '',
            // android应用页面配置的ActionName
            actionName: '',
            // 页面配置的Scheme名字，适用于Android与iOS
            scheme: '',
            // 传递的参数。需要目标应用解析获取参数。字符串形式
            data: ''
        }
    }, {
        namespace: "getAppKey",
        os: ['ejs']
    }, {
        namespace: "getVersion",
        os: ['ejs']
    }, {
        namespace: "getEjsVersion",
        os: ['ejs']
    }, {
        namespace: "checkUpdate",
        os: ['ejs']
    }, {
        namespace: "clearCache",
        os: ['ejs']
    }, {
        namespace: "getGeolocation",
        os: ['ejs'],
        defaultParams: {
            isShowDetail: 0
        }
    }]);
})();
/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/01
 * 版本: [3.0, 2017/06/01 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: native的 storage 模块 
 */
(function() {

    /**
     * 拓展ui模块
     */
    ejs.extendModule('storage', [{
        namespace: "getItem",
        os: ['ejs'],
        defaultParams: {
            // 对应的key
            key: '',
        },
        runCode: function(options, resolve, reject) {
            // 如果传进来的是字符串，变为数组格式
            if (typeof options.key === 'string') {
                options.key = [options.key];
            }
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "setItem",
        os: ['ejs']
        // 格式为 key: value形式，支持多个key value
    }, {
        namespace: "removeItem",
        os: ['ejs'],
        defaultParams: {
            // 对应的key
            key: ''
        },
        runCode: function(options, resolve, reject) {
            // 如果传进来的是字符串，变为数组格式
            if (typeof options.key === 'string') {
                options.key = [options.key];
            }
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "collection.getCollections",
        os: ['ejs'],
        defaultParams: {
            pageIndex: 1,
            pageSize: 20
        },
        runCode: function(options, resolve, reject) {
            // 修改为原生中的namespace
            this.api.namespace = 'getCollections';
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "collection.saveCollections",
        os: ['ejs'],
        defaultParams: {
            // 信息guid，必选
            msgGuid: '',
            // 信息标题，必选
            title: '',
            // 信息类型,根据业务需求自行定义，必选
            type: '',
            // 以下为可选内容
            dateTime: '',
            publisher: '',
            // 链接地址
            url: '',
            remark: '',
            flag: ''
        },
        runCode: function(options, resolve, reject) {
            // 修改为原生中的namespace
            this.api.namespace = 'saveCollections';
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "collection.isCollection",
        os: ['ejs'],
        defaultParams: {
            // 信息guid，必选
            msgGuid: '',
        },
        runCode: function(options, resolve, reject) {
            // 修改为原生中的namespace
            this.api.namespace = 'isCollection';
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "collection.delCollection",
        os: ['ejs'],
        defaultParams: {
            // 需要删除的信息guid，必选
            msgGuid: '',
        },
        runCode: function(options, resolve, reject) {
            // 修改为原生中的namespace
            this.api.namespace = 'delCollection';
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "collection.delAllCollections",
        os: ['ejs'],
        runCode: function(options, resolve, reject) {
            // 修改为原生中的namespace
            this.api.namespace = 'delAllCollections';
            
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }]);
})();
/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/06
 * 版本: [3.0, 2017/06/06 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: native的 stream 模块 
 */
(function() {

    /**
     * 拓展ui模块
     */
    ejs.extendModule('stream', [{
        namespace: "fetch",
        os: ['ejs'],
        defaultParams: {
            url: "",
            method: 'POST',
            // json text
            type: 'json',
            body: '',
            // 有一些默认的头部信息
            headers: {
                //  application/json
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    }, {
        namespace: "uploadFile",
        os: ['ejs'],
        defaultParams: {
            // 目前如果有额外参数，请拼接到url中
            url: "",
            path: '',
            // 有一些默认的头部信息
            headers: {
                'Content-Type': 'application/json'
            }
        }
    }]);
})();
/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/25
 * 版本: [3.0, 2017/05/25 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: native的 ui 模块 
 */
(function() {

    /**
     * 拓展ui模块
     */
    ejs.extendModule('ui', [{
        namespace: "toast",
        // 必填，只有在特定的os下才会实现，不填则不会实现
        // 另外，填了相应的os后，会覆盖原来os下相应的func
        // 每一个os下可以有一个相应的api提示
        os: ['ejs'],
        defaultParams: {
            message: ""
        },
        runCode: function(options, resolve, reject) {
            if (typeof options !== 'object') {
                options = {
                    message: options
                };
            }

            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "showDebugDialog",
        os: ['ejs'],
        defaultParams: {
            debugInfo: "",
        },
        runCode: function(options, resolve, reject) {
            if (typeof options !== 'object') {
                options = {
                    debugInfo: options
                };
            }
            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "alert",
        os: ['ejs'],
        defaultParams: {
            title: "",
            message: "",
            buttonName: "确定",
            // 默认可取消
            cancelable: 1,
        },
        // 用confirm来模拟alert
        runCode: function(options, resolve, reject) {
            if (typeof options !== 'object') {
                options = {
                    cancelable: 1,
                    message: options,
                    title: '',
                    buttonLabels: ['确定']
                };
                // 处理快速调用时的 resolve 与参数关系
                if (typeof arguments[1] === 'string') {
                    options.title = arguments[1];
                    if (typeof arguments[2] === 'string') {
                        options.buttonLabels = [arguments[2]];
                        resolve = arguments[3];
                        reject = arguments[4];
                    } else {
                        resolve = arguments[2];
                        reject = arguments[3];
                    }
                }
            } else {
                options.buttonLabels = [options.buttonName];
            }

            ejs.ui.confirm(options, resolve, reject);

        }
    }, {
        namespace: "confirm",
        os: ['ejs'],
        defaultParams: {
            // 这是默认参数，API的每一个参数都应该有一个默认值
            title: "",
            message: "",
            buttonLabels: ['取消', '确定'],
            // 默认可取消
            cancelable: 1,
        }
    }, {
        namespace: "prompt",
        os: ['ejs'],
        defaultParams: {
            title: "",
            hint: "",
            text: "",
            lines: 1,
            maxLength: 10000,
            buttonLabels: ['取消', '确定'],
            // 默认可取消
            cancelable: 1
        }
    }, {
        namespace: "select",
        os: ['ejs'],
        defaultParams: {
            title: '',
            items: [],
            choiceState: [],
            // 由以前的true和false替换为了1和0
            isMultiSelect: 0,
            // 样式类型，默认为0。 0：单列表样式；1：九宫格样式(目前只支持单选)
            type: 0,
            columns: 3,
            // 可取消
            cancelable: 1,
        },
        runCode: function(options, resolve, reject) {
            var originalItems = options.items;

            options.dataFilter = function(res) {
                // 需要处理下选择的内容
                var index = -1;
                var content = '';

                if (res.result) {
                    var choiceState = res.result.choiceState;
                    if (res.result.which != null) {
                        index = res.result.which || 0;
                        content = originalItems[index];
                        // 需要将中文解码
                        res.result.content = decodeURIComponent(content);
                    } else if (choiceState != null) {
                        res.result.choiceContent = [];
                        for (var i = 0, len = choiceState.length; i < len; i++)　 {
                            if (choiceState[i] == '1') {
                                res.result.choiceContent.push(originalItems[i]);
                            }
                        }
                    }

                }               
                return res;
            };

            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "actionSheet",
        os: ['ejs'],
        defaultParams: {
            items: [],
            // 默认可取消
            cancelable: 1,
        },
        runCode: function(options, resolve, reject) {
            var originalItems = options.items;

            options.dataFilter = function(res) {
                // 需要处理下选择的内容
                var index = -1;
                var content = '';
                if (res.result) {
                    index = res.result.which || 0;
                    content = originalItems[index];
                    // 需要将中文解码
                    res.result.content = decodeURIComponent(content);
                }

                return res;
            };

            ejs._callProxy.call(this, options, resolve, reject);

        }
    }, {
        /**
         * 有横向菜单和垂直菜单2种
         * 可配合setNBRightImage、setNBRightText使用(iOS 不可配合使用)
         */
        namespace: "popWindow",
        os: ['ejs'],
        defaultParams: {
            titleItems: [],
            iconItems: [],
            iconFilterColor: ''
        },
        runCode: function(options, resolve, reject) {
            var originalItems = options.titleItems;
            
            // 处理相对路径问题
            for (var i = 0, len = options.iconItems.length; i < len; i++) {
                options.iconItems[i] = ejs.innerUtil.getFullPath(options.iconItems[i]);
            }

            options.dataFilter = function(res) {
                // 需要处理下选择的内容
                var index = -1;
                var content = '';
                if (res.result) {
                    index = res.result.which || 0;
                    content = originalItems[index];
                    // 需要将中文解码
                    res.result.content = decodeURIComponent(content);
                }

                return res;
            };

            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "pickDate",
        os: ['ejs'],
        defaultParams: {
            // 部分设备上设置标题后遮挡控件可不设置标题
            title: '',
            // 默认为空为使用当前时间
            // 格式为 yyyy-MM-dd。
            datetime: ''
        }
    }, {
        namespace: "pickMonth",
        os: ['ejs'],
        defaultParams: {
            // 部分设备上设置标题后遮挡控件可不设置标题
            title: '',
            // 默认为空为使用当前时间
            // 格式为 yyyy-MM
            datetime: ''
        }
    }, {
        namespace: "pickTime",
        os: ['ejs'],
        defaultParams: {
            // 部分设备上设置标题后遮挡控件可不设置标题
            title: '',
            // 默认为空为使用当前时间
            // 格式为 HH:mm
            datetime: ''
        }
    }, {
        namespace: "pickDateTime",
        os: ['ejs'],
        defaultParams: {
            title1: '',
            title2: '',
            // 默认为空为使用当前时间
            // 格式为 yyyy-MM-dd HH:mm
            datetime: ''
        }
    }, {
        namespace: "showWaiting",
        os: ['ejs']
    }, {
        namespace: "closeWaiting",
        os: ['ejs']
    }, {
        namespace: "pullToRefresh.disable",
        os: ['ejs'],
        runCode: function(options, resolve, reject) {
            // 修改为原生中的namespace
            this.api.namespace = 'pullToRefreshDisable';

            ejs._callProxy.call(this, options, resolve, reject);

        }
    }, {
        /**
         * 启用下拉刷新后，只要有下拉刷新就会回调，属于长期回调范围
         */
        namespace: "pullToRefresh.enable",
        os: ['ejs'],
        defaultParams: {
            color: '000000',
        },
        runCode: function(options, resolve, reject) {
            // 修改为原生中的namespace
            this.api.namespace = 'pullToRefreshEnable';
            this.api.isLongCb = true;

            ejs._callProxy.call(this, options, resolve, reject);
        }
    }, {
        namespace: "pullToRefresh.stop",
        os: ['ejs'],
        runCode: function(options, resolve, reject) {
            // 修改为原生中的namespace
            this.api.namespace = 'pullToRefreshStop';

            ejs._callProxy.call(this, options, resolve, reject);

        }
    }]);
})();
/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/01
 * 版本: [3.0, 2017/06/01 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: native的 util 模块 
 */
(function() {

    /**
     * 拓展ui模块
     */
    ejs.extendModule('util', [{
        namespace: "scan",
        os: ['ejs']
    }, {
        namespace: "downloadFile",
        os: ['ejs'],
        defaultParams: {
            // 下载地址
            url: '',
            // 文件名。必填。
            fileName: '',
            // 下载分类。默认为(其他分类)。推荐传对应的模块名称。例如邮件(MAIL)。如果没有"附件管理"模块，可忽略该参数。
            type: '',
            //  如果本地已有该文件是否重新下载。默认为0(直接打开文件)，为1时重新下载文件并且重命名。
            reDownloaded: 0,
            // 是否下载后打开，为1为默认打开
            openAfterComplete: 1
        }
    }, {
        namespace: "playVideo",
        os: ['ejs'],
        defaultParams: {
            // 视频地址
            videoUrl: ''
        }
    }, {
        namespace: "selectImage",
        os: ['ejs'],
        defaultParams: {
            // 图片数量
            photoCount: 9,
            // 是否允许拍照，1：允许；0：不允许
            showCamera: 0,
            // 是否显示gif图片，1：显示；0：不显示
            showGif: 0,
            // 是否允许预览，1：允许，0：不允许
            previewEnabled: 1,
            // 已选图片，json数组格式，item为元素本地地址
            selectedPhotos: []
        }
    }, {
        namespace: "selectFile",
        os: ['ejs'],
        defaultParams: {
            // 文件数量
            count: 9,
        }
    }, {
        namespace: "prevImage",
        os: ['ejs'],
        defaultParams: {
            // 默认显示图片序号
            index: 0,
            // 是否显示删除按钮，1：显示，0：不显示，默认不显示。如果显示按钮则自动注册回调事件。
            showDeleteButton: 0,
            // 图片地址，json数组格式，item为元素本地地址
            selectedPhotos: []
        },
        runCode: function(options, resolve, reject) {
            // 处理相对路径问题
            for (var i = 0, len = options.selectedPhotos.length; i < len; i++) {
                options.selectedPhotos[i] = ejs.innerUtil.getFullPath(options.selectedPhotos[i]);
            }

            ejs._callProxy.call(this, options, resolve, reject);

        }
    }, {
        namespace: "cameraImage",
        os: ['ejs'],
        defaultParams: {
            // 宽度
            width: 720,
            // 压缩质量
            quality: 70
        }
    }]);
})();