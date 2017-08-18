/**
 * 作者: 戴荔春
 * 创建时间: 2016/12/06
 * 版本: [1.0, 2017/08/07 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: ejs 2.1系列版本，基于JSBridge技术，异步与原生容器交互
 * 最新更新版本为2.1.9
 * 最新修改，支持相对路径的打开，configvalue支持h5下的回调
 */
(function(global, factory) {
    "use strict";
    var moduleExports = factory(global);
    if (typeof module !== 'undefined' && typeof exports === 'object') {
        module.exports = moduleExports;
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(function() {
            return moduleExports;
        });
    }
})(typeof window !== 'undefined' ? window : global, function(global) {
    "use strict";
    //实际的逻辑代码
    var isEmptyObject = function(e) {
        for (var t in e) {
            if (window.Config && window.Config.ejsVer != undefined && window.Config.ejsVer != 2) {
                // 如果存在框架配置 ejs版本不为2.0 也重新生成
                return 1;
            }
            return 0;
        }
        return 1;
    };
    //实际的逻辑代码-确保只会被执行一遍
    if (!isEmptyObject(global.ejs)) {
        //如果已经不是空对象，就不再次运行
        return global.ejs;
    }
    //返回全局变量返回值，便于模块化时引用，也同时声明全局对象
    return (function(exports, isLocal) {
        /******************通用代码**********************/
        (function() {
            /**
             * extend(simple)
             * @param {type} deep 是否递归合并
             * @param {type} target 最终返回的就是target
             * @param {type} source 从左到又，优先级依次提高，最右侧的是最后覆盖的
             * @returns {unresolved}
             */
            exports.extend = function() {
                // from jquery2
                var options, name, src, copy, copyIsArray, clone,
                    target = arguments[0] || {},
                    i = 1,
                    length = arguments.length,
                    deep = false;

                if (typeof target === "boolean") {
                    deep = target;
                    target = arguments[i] || {};
                    i++;
                }
                if (typeof target !== "object" && !exports.isFunction(target)) {
                    target = {};
                }
                if (i === length) {
                    target = this;
                    i--;
                }
                for (; i < length; i++) {
                    if ((options = arguments[i]) != null) {
                        for (name in options) {
                            src = target[name];
                            copy = options[name];
                            if (target === copy) {
                                continue;
                            }
                            if (deep && copy && (exports.isPlainObject(copy) || (copyIsArray = exports.isArray(copy)))) {
                                if (copyIsArray) {
                                    copyIsArray = false;
                                    clone = src && exports.isArray(src) ? src : [];

                                } else {
                                    clone = src && exports.isPlainObject(src) ? src : {};
                                }

                                target[name] = exports.extend(deep, clone, copy);
                            } else if (copy !== undefined) {
                                target[name] = copy;
                            }
                        }
                    }
                }
                return target;
            };
            /**
             *  isFunction
             */
            exports.noop = function() {},
                /**
                 *  isFunction
                 */
                exports.isFunction = function(value) {
                    return exports.type(value) === "function";
                };
            /**
             *  isPlainObject
             */
            exports.isPlainObject = function(obj) {
                return exports.isObject(obj) && !exports.isWindow(obj) && Object.getPrototypeOf(obj) === Object.prototype;
            };
            exports.isArray = Array.isArray ||
                function(object) {
                    return object instanceof Array;
                };
            /**
             *  isWindow(需考虑obj为undefined的情况)
             */
            exports.isWindow = function(obj) {
                return obj != null && obj === obj.window;
            };
            /**
             *  isObject
             */
            exports.isObject = function(obj) {
                return exports.type(obj) === "object";
            };
            exports.type = function(obj) {
                return obj == null ? String(obj) : class2type[{}.toString.call(obj)] || "object";
            };
            /**
             * @description each遍历操作
             * @param {type} elements
             * @param {type} callback
             * @returns {global}
             */
            exports.each = function(elements, callback, hasOwnProperty) {
                if (!elements) {
                    return this;
                }
                if (typeof elements.length === 'number') {
                    [].every.call(elements, function(el, idx) {
                        return callback.call(el, idx, el) !== false;
                    });
                } else {
                    for (var key in elements) {
                        if (hasOwnProperty) {
                            if (elements.hasOwnProperty(key)) {
                                if (callback.call(elements[key], key, elements[key]) === false) return elements;
                            }
                        } else {
                            if (callback.call(elements[key], key, elements[key]) === false) return elements;
                        }
                    }
                }
                return this;
            };
            var class2type = {};
            exports.each(['Boolean', 'Number', 'String', 'Function', 'Array', 'Date', 'RegExp', 'Object', 'Error'], function(i, name) {
                class2type["[object " + name + "]"] = name.toLowerCase();
            });
            (function() {
                function detect(ua) {
                    this.os = {};
                    this.os.name = 'browser';
                    var funcs = [
                        function() { //android
                            var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
                            if (android) {
                                this.os.android = true;
                                this.os.version = android[2];
                                this.os.isBadAndroid = !(/Chrome\/\d/.test(window.navigator.appVersion));
                                this.os.name += '_' + 'Android';
                                this.os.name += '_' + 'mobile';
                            }
                            return this.os.android === true;
                        },
                        function() { //ios
                            var iphone = ua.match(/(iPhone\sOS)\s([\d_]+)/);
                            if (iphone) { //iphone
                                this.os.ios = this.os.iphone = true;
                                this.os.version = iphone[2].replace(/_/g, '.');
                                this.os.name += '_' + 'iphone';
                                this.os.name += '_' + 'mobile';
                            } else {
                                var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
                                if (ipad) { //ipad
                                    this.os.ios = this.os.ipad = true;
                                    this.os.version = ipad[2].replace(/_/g, '.');
                                    this.os.name += '_' + 'iOS';
                                    this.os.name += '_' + 'mobile';
                                }

                            }
                            return this.os.ios === true;
                        }
                    ];
                    [].every.call(funcs, function(func) {
                        return !func.call(exports);
                    });
                }
                detect.call(exports, navigator.userAgent);
            })();
            /**
             * @description 判断os系统 ,判断是否是ejs
             * ejs.os
             * @param {type} 
             * @returns {undefined}
             */
            (function() {
                function detect(ua) {
                    this.os = this.os || {};
                    //比如 EpointEJS/6.1.1  也可以/(EpointEJS)\/([\d\.]+)/i
                    var ejs = ua.match(/EpointEJS/i); //TODO ejs
                    if (ejs) {
                        this.os.ejs = true;
                        this.os.name += '_' + 'ejs';
                    }
                    //阿里的钉钉 DingTalk/3.0.0 
                    var dd = ua.match(/DingTalk/i); //TODO dingding
                    if (dd) {
                        this.os.dd = true;
                        this.os.name += '_' + 'dd';
                    }

                    // 如果ejs和钉钉都不是，则默认为h5
                    if (!ejs && !dd) {
                        this.os.h5 = true;
                        this.os.name += '_' + 'h5';
                    }
                }
                detect.call(exports, navigator.userAgent);
            })();
        })();

        /******************ejs核心代码**********************/
        //最外层的ejs api名称
        var EJS_API = 'epoint_bridge';
        //全局错误回调
        var globalError;
        // 错误池子，页面加载时候的错误先存储
        var errorPool = [];
        ejs.EJS_API = EJS_API;
        //默认的自定义api的名
        var EJS_API_CUSTOM = 'custom_epoint_bridge';
        ejs.EJS_API_CUSTOM = EJS_API_CUSTOM;
        //长期存在的回调
        var responseCallbacksLongTerm = {};
        (function() {
            var hasOwnProperty = Object.prototype.hasOwnProperty;

            window.JSBridge = window.top.JSBridge || {};
            //jsbridge协议定义的名称
            var CUSTOM_PROTOCOL_SCHEME = 'EpointJSBridge';
            //ios中进行url scheme传值的iframe,用top,否则如果在iframe中,无法正常触发
            var messagingIframe = window.top.document.createElement('iframe');
            messagingIframe.style.display = 'none';
            if (ejs.os.ejs && ejs.os.ios) {
                messagingIframe.src = CUSTOM_PROTOCOL_SCHEME + '://__BRIDGE_LOADED__';
            }
            document.documentElement.appendChild(messagingIframe);

            //定义的回调函数集合,在原生调用完对应的方法后,会执行对应的回调函数id
            var responseCallbacks = {};
            //唯一id,用来确保每一个回调函数的唯一性
            var uniqueId = 1;
            //本地注册的方法集合,原生只能调用本地注册的方法,否则会提示错误
            var messageHandlers = {};
            //当原生调用H5注册的方法时,通过回调来调用(也就是变为了异步执行,加强安全性)
            var dispatchMessagesWithTimeoutSafety = true;
            //本地运行中的方法队列
            var sendMessageQueue = [];

            //实际暴露给原生调用的对象
            var Inner = {
                /**
                 * @description 注册本地JS方法通过JSBridge给原生调用
                 * 我们规定,原生必须通过JSBridge来调用H5的方法
                 * 注意,这里一般对本地函数有一些要求,要求第一个参数是data,第二个参数是callback
                 * @param {String} handlerName 方法名
                 * @param {Function} handler 对应的方法
                 */
                registerHandler: function(handlerName, handler) {
                    messageHandlers[handlerName] = handler;
                },
                /**
                 * @description 注册长期回调到本地
                 * @param {String} callbackId 回调id
                 * @param {Function} callback 对应回调函数
                 */
                registerLongCallback: function(callbackId, callback) {
                    responseCallbacksLongTerm[callbackId] = callback;
                },
                /**
                 * @description 调用原生开放的方法
                 * @param {String} obj 这个属于协议头的一部分
                 * @param {String} handlerName 方法名
                 * @param {JSON} data 参数
                 * @param {Function||String} callback 回调函数或者是长期的回调id
                 */
                callHandler: function(obj, handlerName, data, callback) {
                    //如果没有 data
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
                 * iOS专用
                 * @description 当本地调用了callHandler之后,实际是调用了通用的scheme,通知原生
                 * 然后原生通过调用这个方法来获知当前正在调用的方法队列
                 */
                _fetchQueue: function() {
                    var messageQueueString = JSON.stringify(sendMessageQueue);
                    sendMessageQueue = [];
                    return messageQueueString;
                },
                /**
                 * @description 原生调用H5页面注册的方法,或者调用回调方法
                 * @param {String} messageJSON 对应的方法的详情,需要手动转为json
                 */
                _handleMessageFromNative: function(messageJSON) {
                    if (dispatchMessagesWithTimeoutSafety) {
                        setTimeout(_doDispatchMessageFromNative);
                    } else {
                        _doDispatchMessageFromNative();
                    }
                    /**
                     * @description 处理原生过来的方法
                     */
                    function _doDispatchMessageFromNative() {
                        var message;
                        try {
                            if (typeof messageJSON === 'string') {
                                message = JSON.parse(messageJSON);
                            } else {
                                message = messageJSON;
                            }
                        } catch (e) {
                            //TODO handle the exception
                            console.error("原生调用H5方法出错,传入参数错误");
                            return;
                        }

                        //回调函数
                        var responseCallback;
                        if (message.responseId) {
                            //这里规定,原生执行方法完毕后准备通知h5执行回调时,回调函数id是responseId
                            responseCallback = responseCallbacks[message.responseId];
                            responseCallback = responseCallback || responseCallbacksLongTerm[message.responseId];
                            if (!responseCallback) {
                                return;
                            }
                            //执行本地的回调函数
                            responseCallback && responseCallback(message.responseData);
                            delete responseCallbacks[message.responseId];

                        } else {
                            //否则,代表原生主动执行h5本地的函数
                            if (message.callbackId) {
                                //先判断是否需要本地H5执行回调函数
                                //如果需要本地函数执行回调通知原生,那么在本地注册回调函数,然后再调用原生
                                //回调数据有h5函数执行完毕后传入
                                var callbackResponseId = message.callbackId;
                                responseCallback = function(responseData) {
                                    //默认是调用EJS api上面的函数
                                    //然后接下来原生知道scheme被调用后主动获取这个信息
                                    //所以原生这时候应该会进行判断,判断对于函数是否成功执行,并接收数据
                                    //这时候通讯完毕(由于h5不会对回调添加回调,所以接下来没有通信了)
                                    _doSend(EJS_API, {
                                        handlerName: message.handlerName,
                                        responseId: callbackResponseId,
                                        responseData: responseData
                                    });
                                };
                            }

                            //从本地注册的函数中获取
                            var handler = messageHandlers[message.handlerName];
                            if (!handler) {
                                //本地没有注册这个函数
                            } else {
                                //执行本地函数,按照要求传入数据和回调
                                handler(message.data, responseCallback);
                            }
                        }
                    }
                },
                /**
                 * @description 正常来说,在原生调用H5方法是是异步的,调用这个方法后,可以变为同步
                 */
                disableJavscriptAlertBoxSafetyTimeout: function() {
                    dispatchMessagesWithTimeoutSafety = false;
                }

            };
            /**
             * @description JS调用原生方法前,会先send到这里进行处理
             * @param {String} obj 这个属于协议头的一部分
             * @param {JSON} message 调用的方法详情,包括方法名,参数
             * @param {Function||String} responseCallback 调用完方法后的回调,或者长期回调的id
             */
            function _doSend(obj, message, responseCallback) {
                if (responseCallback && (typeof responseCallback === 'function')) {
                    //取到一个唯一的callbackid
                    var callbackId = Util.getCallbackId();
                    //回调函数添加到集合中
                    responseCallbacks[callbackId] = responseCallback;
                    //方法的详情添加回调函数的关键标识
                    message['callbackId'] = callbackId;
                } else if (typeof responseCallback === 'string' || typeof responseCallback === 'number') {
                    //长期的回调,传进来的就是id,已经默认在回调池中了
                    message['callbackId'] = responseCallback;
                }
                //android中,可以通过onJsPrompt或者截取Url访问都行
                if (ejs.os.ios) {
                    //ios中,通过截取客户端url访问
                    //因为ios可以不暴露scheme,而是由原生手动获取
                    //正在调用的方法详情添加进入消息队列中,原生会主动获取
                    sendMessageQueue.push(message);
                }
                //获取 触发方法的url scheme
                var uri = Util.getUri(obj, message);
                //android和ios的url scheme调用有所区别
                //console.log("ua:"+navigator.userAgent);
                //console.log("uri:"+uri);
                if (ejs.os.ejs) {
                    if (ejs.os.ios) {
                        //ios采用iframe跳转scheme的方法
                        messagingIframe.src = uri;
                        //console.log("ios:触发uri:"+uri);
                    } else {
                        window.top.prompt(uri, "");
                    }
                } else {
                    //浏览器
                    console.error("浏览器中ejs无效,scheme:" + uri);
                }
            }

            var Util = {
                getCallbackId: function() {
                    //return 'cb_' + (uniqueId++) + '_' + new Date().getTime();
                    return Math.floor(Math.random() * (1 << 30)) + '';
                },
                //获取url scheme
                //第二个参数是兼容android中的做法
                //android中由于原生不能获取JS函数的返回值,所以得通过协议传输
                getUri: function(obj, message) {
                    var uri = CUSTOM_PROTOCOL_SCHEME + '://' + obj;
                    if (!ejs.os.ios) {
                        //回调id作为端口存在
                        var callbackId, method, params;
                        if (message.callbackId) {
                            //第一种:h5主动调用原生
                            callbackId = message.callbackId;
                            method = message.handlerName;
                            params = message.data;
                        } else if (message.responseId) {
                            //第二种:原生调用h5后,h5回调
                            //这种情况下需要原生自行分析传过去的port是否是它定义的回调
                            callbackId = message.responseId;
                            method = message.handlerName;
                            params = message.responseData;
                        }
                        //参数转为字符串
                        params = this.getParam(params);
                        //uri 补充
                        uri += ':' + callbackId + '/' + method + '?' + params;
                    }

                    return uri;
                },
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

            // 接收原生的错误信息
            JSBridge.registerHandler('handleError', function(data) {
                if (globalError) {
                    for (var i = 0; i < errorPool.length; i++) {
                        globalError(errorPool[i]);
                    }
                    errorPool = [];
                    globalError(data);
                } else {
                    errorPool.push(data);
                }
            });
        })();

        //拓展EJS功能，可以进行插拔式拓展,一般为拓展ejs环境外的使用方法
        //如兼容h5，兼容钉钉等
        (function() {
            /**
             * @description 拓展某一个方法
             * @param {String} moduleName 模块名
             * @param {String} api 模块下的api名
             * @param {Function} extendFuc 额外拓展的方法
             * @param {Boolean} isDisableOld 是否禁用老的api
             */
            function extendFuc(moduleName, api, extendFuc, isDisableOld) {
                isDisableOld = isDisableOld || false;
                if (!ejs[moduleName]) {
                    ejs[moduleName] = {};
                }
                var module = ejs[moduleName];
                var old = module[api];
                module[api] = function() {
                    !isDisableOld && old && old.apply(this, arguments);
                    extendFuc.apply(this, arguments);
                };
            }
            /**
             * @description 拓展整个对象模块
             * @param {String} moduleName 模块名
             * @param {Object} obj 对象，对象里包括api名以及方法
             */
            function extendFucObj(moduleName, obj) {
                for (var item in obj) {
                    extendFuc(moduleName, item, obj[item]);
                }
            }

            exports.extendFuc = extendFuc;
            exports.extendFucObj = extendFucObj;
        })();
        /******************ejs api相关**********************/
        //Android本地资源的路径
        var ANDROID_LOCAL = 'file:///android_asset/';
        //iOS本地资源的路径
        var IOS_LOCAL = '';

        /**
         * @description 得到一个项目的根路径,只适用于混合开发
         * h5模式下例如:http://id:端口/项目名/
         * @return {String} 项目的根路径
         */
        function getProjectBasePath() {
            var flag = window.ejsForceLocal || isLocal;
            var basePath = '';
            if (!flag) {
                //非本地
                var obj = window.location;
                var patehName = obj.pathname;
                //h5
                var contextPath = '';
                //这种获取路径的方法有一个要求,那就是所有的html必须在html文件夹中,并且html文件夹必须在项目的根目录
                //普通浏览器
                contextPath = patehName.substr(0, patehName.lastIndexOf("/html") + 1);
                if (!contextPath || contextPath === '/') {
                    //兼容pages
                    contextPath = patehName.substr(0, patehName.lastIndexOf("/pages") + 1);
                }
                //var contextPath = obj.pathname.split("/")[1] + '/';
                basePath = obj.protocol + "//" + obj.host + (contextPath ? contextPath : '/');
            } else {
                //本地
                if (ejs.os.android) {
                    basePath = ANDROID_LOCAL;
                } else if (ejs.os.ios) {
                    basePath = IOS_LOCAL;
                }
            }

            return basePath;
        }

        /**
         * 将相对路径转为绝对路径 ./ ../ 开头的  为相对路径
         * 会基于对应调用js的html路径去计算
         * @param {Object} path
         */
        function changeRelativePathToAbsolute(path) {
            var obj = window.location,
                patehName = window.location.pathname;

            // 匹配相对路径返回父级的个数
            var relatives = path.match(/\.\.\//g);
            var count = relatives && relatives.length;

            // 将patehName拆为数组，然后计算当前的父路径，需要去掉相应相对路径的层级
            var pathArray = patehName.split('/');
            var parentPath = pathArray.slice(0, pathArray.length - (count + 1)).join('/');
            // 找到最后的路径， 通过正则 去除 ./ 之前的所有路径
            var finalPath = parentPath + '/' + path.replace(/\.+\//g, '');

            finalPath = obj.protocol + "//" + obj.host + finalPath;

            return finalPath;
        }
        /**
         * @description 得到一个全路径
         * @param {String} path
         */
        function getFullPath(path) {
            // 全路径
            if (/^(http|https|ftp|\/\/)/g.test(path)) {
                return path;
            }
            // 是否是相对路径
            var isRelative = path.indexOf('./') != -1 || path.indexOf('../') != -1;
            // 非相对路径，页面路径默认从html目录开始
            path = (isRelative ? changeRelativePathToAbsolute(path) : ((getProjectBasePath()) + path));
            return path;
        }

        function getFullUrlByParams(url, jsonObj) {
            url = url || '';
            url = getFullPath(url);
            //将jsonObj拼接到url上
            var extrasDataStr = '';
            if (jsonObj) {
                for (var item in jsonObj) {
                    if (extrasDataStr.indexOf('?') == -1 && url.indexOf('?') == -1) {
                        extrasDataStr += '?';
                    } else {
                        extrasDataStr += '&';
                    }
                    extrasDataStr += item + '=' + jsonObj[item];
                }
            }
            url = url + extrasDataStr;

            return url;
        }

        /*
         ***************************EJS API********************************************
         * 返回参数格式：
         * {"code":1,"msg":"OK","result":"{}"}
         * code int类型 api调用成功与否 1：成功 0：失败
         * msg String类型 描述信息
         * result json类型 返回值
         * 正常情况下 只会有一个code,又返回值才会有回调result
         * */
        /**
         ***Page 模块 ,页面操作
         */
        ejs.page = {
            /**
             * @description 打开新页面
             * 异步
             * @param {String} url 页面的url
             * @param {String} title 页面的标题
             * @param {JSON} jsonObj json参数
             * @param {JSON} options 额外的配置参数
             * 包括 requestCode  请求code,startActivityForResult时需要用到,到时候用来进行页面传参
             * 包括 finishAfterOpen 是否打开下一个页面后关闭关闭当前页面 1为是,其它为否,默认为0
             * @param {Function} callback 回调函数
             * @param {Function} error 错误回调
             */
            openPage: function(url, title, jsonObj, options, callback, error) {
                //jsonObj里面的额外参数 viewtitle()
                jsonObj = jsonObj || {};
                options = options || {};
                url = getFullUrlByParams(url, jsonObj);
                //这时候包括
                options.PAGE_URL = url;
                options.PAGE_TITLE = title || '';
                //一些其它参数就不再定义了,直接传入
                if (ejs.os.ejs || options.isDebug) {
                    //ejs
                    JSBridge.callHandler(EJS_API, 'openPage', {
                        //1为是,其它为否
                        "finishAfterOpen": options.finishAfterOpen || '0',
                        //默认为1101
                        'requestCode': options.requestCode || 1101,
                        'data': options
                    }, function(res) {
                        if (res.code == '4') {
                            //默认只有状态为4时才回调
                            callback && callback(res.result, res.msg, res);
                        } else if (res.code == '0') {
                            error && error(res);
                        } else {
                            error && error(res);
                        }
                    });
                } else {
                    //普通
                    document.location.href = url;
                }
            },
            /**
             * @description 以fragment形式，同时打开多个页面
             * @param {Array} dataArray 每一个页面的单独参数
             * url,title,jsonObj,options
             * @param {JSON} commonOptions 通用配置参数
             * @param {Function} callback 回调函数
             */
            openPageMulti: function(dataArray, commonOptions, callback) {
                var paramsArray = [];
                for (var i = 0, len = dataArray.length; i < len; i++) {
                    paramsArray[i] = {};
                    paramsArray[i].PAGE_URL = getFullUrlByParams(dataArray[i].url, dataArray[i].jsonObj);
                    paramsArray[i].PAGE_TITLE = dataArray[i].title;
                    for (var item in dataArray[i].options) {
                        paramsArray[i][item] = dataArray[i].options[item];
                    }
                }
                JSBridge.callHandler(EJS_API, 'openPage', {
                    //1为是,其它为否
                    "finishAfterOpen": commonOptions.finishAfterOpen || '0',
                    //默认为1101
                    'requestCode': commonOptions.requestCode || '1101',
                    'data': paramsArray
                }, function(res) {
                    if (res.code == '4') {
                        //默认只有状态为4时才回调
                        callback && callback(res.result, res.msg, res);
                    }
                });
            },
            /**
             * @description 打开原生页面
             * 异步
             * @param {String} localPageClassName 本地activity或viewController名称
             * @param {JSON} jsonObj json参数 或者和下面的options合并成一个也行
             * @param {JSON} options 额外的配置参数
             * 包括 requestCode  请求code,startActivityForResult时需要用到,到时候用来进行页面传参
             * 包括 viewtitle  h5页面title
             * 包括 finishAfterOpen 是否打开下一个页面后关闭关闭当前页面 1为是,其它为否,默认为0
             * @param {Function} callback 回调函数
             * @param {Function} error 回调函数
             */
            openLocal: function(localPageClassName, jsonObj, options, callback, error) {
                //jsonObj里面的额外参数 viewtitle()
                //兼容jsonObj和options合并
                jsonObj = jsonObj || {};
                if (typeof arguments[2] === 'function') {
                    options = {};
                    callback = arguments[2];
                    error = arguments[3];
                }
                options = options || {};
                //参数合并
                jsonObj = ejs.extend(jsonObj, options, false);
                JSBridge.callHandler(EJS_API, 'openLocal', {
                    "localPageClassName": localPageClassName,
                    //1为是,其它为否
                    "finishAfterOpen": options.finishAfterOpen || '0',
                    //默认为1101
                    'requestCode': options.requestCode || '1101',
                    'openExistLocal': options.openExistLocal || false,
                    'data': jsonObj

                }, function(res) {
                    if (res.code == '4') {
                        //默认只有状态为4时才回调
                        callback && callback(res.result, res.msg, res);
                    } else if (res.code == '0') {
                        //默认只有状态为4时才回调
                        error && error(res);
                    }
                });

            },
            /**
             * @description 关闭当前页面，可以传入额外参数
             * @param {JSON} extras 关闭时,传给打开页面的额外参数
             * activit->finish
             * ios->pop
             * 异步
             */
            closePage: function(extras) {
                if (typeof extras === 'object') {
                    extras = JSON.stringify(extras);
                }
                if (ejs.os.ejs) {
                    JSBridge.callHandler(EJS_API, 'closePage', {
                        "resultData": extras
                    }, function(res) {

                    });
                } else {
                    //浏览器退出
                    if (window.history.length > 1) {
                        window.history.back();
                        return true;
                    }
                }
            },
            /**
             * @deprecated 设置页面在恢复时，是否刷新页面元素(重新加载地址)
             * 不推荐使用,请使用最新的 setResumeCallback
             * @param {Function} callback 回调函数
             */
            setResumeReload: function(callback) {
                JSBridge.callHandler(EJS_API, 'setResumeReload', {}, function(res) {
                    callback && callback(null, res.msg, res);
                });
            },
            /**
             * @description 设置页面在恢复时，触发回调
             * 异步
             * @param {Function} callback 回调函数,回调函数代表页面恢复了,页面可以做自己的逻辑
             */
            setResumeCallback: function(callback) {
                //设置一个页面resume的id
                var callbackId = '10000002';

                //注册长期回调
                JSBridge.registerLongCallback(callbackId, function(res) {
                    if (res.code == '3') {
                        //默认只有状态为3时才回调
                        callback && callback(res.result, res.msg, res);
                    }
                });
                JSBridge.callHandler(EJS_API, 'setResumeCallback', {}, callbackId);
            },
            /**
             * @description 重新加载页面
             * 异步
             * @param {Function} callback 回调函数
             */
            reloadPage: function(callback) {
                if (ejs.os.ejs) {
                    JSBridge.callHandler(EJS_API, 'reloadPage', {}, function(res) {
                        callback && callback(res.result, res.msg, res);
                    });
                } else {
                    window.location.reload();
                }

            }
        };
        /**
         ***NativeUI 模块 
         */
        ejs.nativeUI = {
            /**
             * @description toast提示信息
             * 异步
             * @param {JSON} options或者是message内容
             * 包含 msg
             */
            toast: function(options) {
                var msg = '';
                options = options || {};
                if (typeof options === 'string') {
                    msg = options;
                } else {
                    msg = options.message;
                }
                JSBridge.callHandler(EJS_API, 'toast', {
                    'message': msg
                }, function(res) {

                });
            },
            /**
             * @description 只用于页面调试用
             * 可复制信息以及发送信息
             * @param {String} debugInfo
             */
            showDebugDialog: function(debugInfo) {
                JSBridge.callHandler(EJS_API, 'showDebugDialog', {
                    'debugInfo': debugInfo
                }, function(res) {

                });
                if (!ejs.os.ejs) {
                    ejs.nativeUI.alert(debugInfo);
                }
            },
            /**
             * @description 显示alert
             * 异步
             * @param {JSON} options或者是msg内容
             * 包含 title,message
             */
            alert: function(options) {
                var title = '',
                    msg = '';
                options = options || {};
                if (typeof options === 'string') {
                    msg = options;
                    title = arguments[1] || '';
                } else {
                    msg = options.message;
                    title = options.title;
                }
                //目前按钮名称不能自定义
                JSBridge.callHandler(EJS_API, 'showMsgDialog', {
                    'title': title,
                    'message': msg
                }, function(res) {

                });
            },
            /**
             * @description 显示confirm
             * iOS不支持cancelable参数设置
             * 异步
             * @param {JSON} options 额外配置参数
             * title 标题
             * message 消息内容
             * btn1 第一个按钮
             * btn2 第二个按钮
             * cancelable 是否可取消
             * @param {Function} callback 回调函数
             * 
             */
            confirm: function(options, callback) {
                options = options || {};
                if (typeof options === 'string') {
                    options = {
                        'message': options
                    };
                    if (typeof arguments[1] === 'string') {
                        options.title = arguments[1];
                        callback = arguments[2];
                    }
                }
                //目前按钮名称不能自定义
                JSBridge.callHandler(EJS_API, 'showConfirmDialog', {
                    'title': options.title,
                    'message': options.message,
                    'btn1': options.btn1 || '取消',
                    'btn2': options.btn2 || (options.btn2 !== null ? '确定' : ''),
                    //默认为可取消
                    'cancelable': options.cancelable || 0,
                }, function(res) {
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 创建输入对话框
             * 显示输入框
             * iOS 不支持cancelable参数设置
             * 异步
             * @param {JSON} options 额外配置参数
             * title 标题
             * hint 输入提示
             * text 默认文本
             * @param {Function} callback 回调函数
             */
            prompt: function(options, callback) {
                options = options || {};
                //目前按钮名称不能自定义
                JSBridge.callHandler(EJS_API, 'showEditTextDialog', {
                    'title': options.title,
                    'hint': options.hint,
                    'text': options.text,
                    'cancelable': options.cancelable || 0,
                    'lines': options.lines || 1,
                    'maxLength': options.maxLength || 10000
                }, function(res) {
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 显示列表选择对话框
             * 支持单选和多选
             * iOS不支持cancelable参数设置
             * 异步
             * @param {JSON} options 额外配置参数
             * title 标题
             * itemArray item数组
             * checkState 设置为选择的array,multi时才有效
             * cancelable 是否可以取消
             * isMultiSelect 是否是多选，默认为false
             * type 样式类型，默认为0。 0：单列表样式；1：九宫格样式(目前只支持单选)
             * columns 九宫格列数，默认3列，只有当type为1时有效。
             * @param {Function} callback 回调函数
             * 
             */
            select: function(options, callback) {
                options = options || {};
                options.items = options.items || [];
                options.checkState = options.checkState || [];
                var isMultiSelect = options.isMultiSelect || false;

                //目前按钮名称不能自定义
                JSBridge.callHandler(EJS_API, 'showSelectedDialog', {
                    'title': options.title,
                    'items': options.items.join(','),
                    'checkState': options.checkState.join(','),
                    //默认为可取消
                    'cancelable': options.cancelable || 0,
                    'isMultiSelect': isMultiSelect,
                    'type': options.type || 0,
                    'columns': options.columns || 3,
                }, function(res) {
                    //默认选择的items
                    var items = [];
                    var result = res.result;
                    if (isMultiSelect) {
                        //多选
                        var choiceState = result.choiceState;
                        choiceState = choiceState.split(',');
                        var choiceArray = [];
                        for (var i = 0, len = choiceState.length; i < len; i++) {
                            if (choiceState[i] != null && choiceState[i] != '') {
                                choiceArray.push(choiceState[i]);
                                if (choiceState[i] == '1') {
                                    items.push(options.items[i] || '');
                                }
                            }
                        }
                    } else {
                        //单选
                        var which = result.which;
                        var item = options.items[which];
                        items.push(item);
                    }
                    result.items = items;
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 弹出底部选项按钮
             * iOS 不支持cancelable参数设置
             * 异步
             * @param {JSON} options 额外配置参数
             * items 内容
             * cancelable 是否可取消
             * @param {Function} callback 回调函数
             * 
             */
            actionSheet: function(options, callback) {
                options = options || {};
                options.items = options.items || [];
                //目前按钮名称不能自定义
                JSBridge.callHandler(EJS_API, 'showActionsheet', {
                    'items': options.items.join(','),
                    'cancelable': options.cancelable || 0
                }, function(res) {
                    var index = -1;
                    var content = '';
                    if (res.result) {
                        index = res.result.which || 0;
                        content = options.items[index];
                        res.result.content = content;
                    }
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 弹出顶部窗口选项按钮
             * 有横向菜单和垂直菜单2种
             * 可配合setNBRightImage、setNBRightText使用(iOS 不可配合使用)
             * 异步
             * @param {JSON} options 额外配置参数
             * titleItems 标题内容
             * iconItems 图标内容
             * orientation 菜单类别。仅为"horizontal"时弹出横向菜单，否则弹出垂直菜单。
             * @param {Function} callback 回调函数
             * 
             */
            popWindow: function(options, callback) {
                options = options || {};
                options.titleItems = options.titleItems || [];
                options.iconItems = options.iconItems || [];
                JSBridge.callHandler(EJS_API, 'showPopupWindow', {
                    'titleItems': options.titleItems.join(','),
                    'iconItems': options.iconItems.join(','),
                    'orientation': options.orientation || ''
                }, function(res) {
                    callback && callback(res.result, res.msg, res);
                });
            },

            /**
             * @description 日期选择
             * 部分设备上设置标题后遮挡控件可不设置标题
             * cancelable默认为true，且无法设置
             * 异步
             * @param {JSON} options 额外配置参数
             * title 标题
             * datetime 指定日期，默认当前日期。格式为 yyyy-MM-dd。
             * @param {Function} callback 回调函数
             */
            pickDate: function(options, callback) {
                options = options || {};
                //目前按钮名称不能自定义
                JSBridge.callHandler(EJS_API, 'showDatePickDialog', {
                    'title': options.title,
                    'datetime': options.datetime
                }, function(res) {
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 时间选择
             * 显示时间选择对话框
             * cancelable默认为true，且无法设置
             * 异步
             * @param {JSON} options 额外配置参数
             * title 标题
             * datetime 指定日期，默认当前日期。格式为 yyyy-MM-dd HH:mm
             * @param {Function} callback 回调函数
             */
            pickTime: function(options, callback) {
                options = options || {};
                //目前按钮名称不能自定义
                JSBridge.callHandler(EJS_API, 'showTimePickDialog', {
                    'title': options.title,
                    'datetime': options.datetime
                }, function(res) {
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 日期时间选择
             * 显示日期时间选择对话框
             * cancelable默认为true，且无法设置
             * 异步
             * @param {JSON} options 额外配置参数
             * title1 日期选择控件标题
             * title2 时间选择控件标题
             * datetime 指定日期，默认当前日期。格式为 yyyy-MM-dd。
             * @param {Function} callback 回调函数
             */
            pickDateTime: function(options, callback) {
                options = options || {};
                //目前按钮名称不能自定义
                JSBridge.callHandler(EJS_API, 'showDateTimePickDialog', {
                    'title1': options.title1,
                    'title2': options.title2,
                    'datetime': options.datetime
                }, function(res) {
                    callback && callback(res.result, res.msg, res);
                });
            },

            /**
             * @description 显示等待对话框
             * 异步
             */
            showWaiting: function(title, callback) {
                JSBridge.callHandler(EJS_API, 'showProgress', {}, function(res) {
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 显示遮罩
             */
            showMask: function() {
                if (!this.mask) {
                    this.mask = mui.createMask();
                }
                this.mask.show();
            },
            /**
             * @description 隐藏遮罩
             */
            hideMask: function() {
                if (this.mask) {
                    this.mask.close();
                }
            },
            /**
             * @description 隐藏等待对话框
             * 异步
             */
            closeWaiting: function() {
                JSBridge.callHandler(EJS_API, 'hideProgress', {}, function(res) {

                });
            },
            //下拉刷新模块 pullToRefresh
            pullToRefresh: {
                /**
                 * @description 禁用下拉刷新
                 * 异步
                 */
                disable: function() {
                    JSBridge.callHandler(EJS_API, 'setSwipeRefreshEnable', {
                        'swipeRefreshEnable': false
                    }, function(res) {

                    });
                },
                /**
                 * @description 启用下拉刷新
                 * 异步
                 * @param {Function} callback 每次下拉会调用的回调
                 */
                enable: function(callback) {
                    //设置一个专属的下拉刷新id
                    var callbackId = '10000001';
                    //注册长期回调
                    JSBridge.registerLongCallback(callbackId, function(res) {
                        if (res.code == '2') {
                            //默认只有状态为2时才回调
                            callback && callback(res.result, res.msg, res);
                        }
                    });
                    JSBridge.callHandler(EJS_API, 'setSwipeRefreshEnable', {
                        'swipeRefreshEnable': true
                    }, callbackId);
                },
                /**
                 * @description 收起下拉刷新loading
                 * 异步
                 */
                stop: function() {
                    JSBridge.callHandler(EJS_API, 'stopSwipeRefresh', {}, function(res) {

                    });
                }
            }
        };
        /**
         ***Navigator 模块 
         * 包括原生页面title操作以及部分导航栏操作
         */
        ejs.navigator = {
            /**
             * @description 显示导航栏
             */
            showNavigation: function() {
                JSBridge.callHandler(EJS_API, 'showNavigation', {}, function(res) {

                });
            },
            /**
             * @description 隐藏导航栏
             */
            hideNavigation: function() {
                JSBridge.callHandler(EJS_API, 'hideNavigation', {}, function(res) {

                });
            },
            /**
             * @description 设置页面标题
             * 建议通过openPage调用，将标题传递给下个页面
             * 异步
             * @param {String} title
             */
            setTitle: function(title) {
                title = title || '';
                JSBridge.callHandler(EJS_API, 'setNaigationTitle', {
                    "PAGE_TITLE": title
                }, function(res) {

                });
            },
            /**
             * @description 设置导航栏右上角文字按钮
             * 需要设置的按钮文字,若为空则隐藏按钮。页面需要实现 onClickNBRightEJS()函数来接收点击事件。
             * @param {String} title
             * @param {Function} callback
             */
            setRightTextBtn: function(title, callback) {
                title = title || '';
                JSBridge.callHandler(EJS_API, 'setNBRightText', {
                    "nbRightText": title
                }, function(res) {

                });
                if (callback) {
                    //监听右侧事件
                    window.onClickNBRightEJS = function() {
                        callback && callback();
                    };
                }
            },
            /**
             * @description 设置导航栏右上角图片按钮
             * 仅支持设置应用中的资源图片,传图片名称,若为空则隐藏按钮。页面需要实现onClickNBRightEJS()函数来接收点击事件。
             * @param {String} localImgUrl
             */
            setRightImageBtn: function(localImgUrl) {
                JSBridge.callHandler(EJS_API, 'setNBRightImage', {
                    "nbRightImage": localImgUrl
                }, function(res) {

                });
            },
            /**
             * 隐藏页面返回按钮
             * 异步
             */
            hideBackButton: function() {
                JSBridge.callHandler(EJS_API, 'hideBackButton', {}, function(res) {

                });
            },
            /**
             * 显示原生搜索栏
             * 异步
             */
            showSearchBar: function() {
                JSBridge.callHandler(EJS_API, 'showSearchBar', {}, function(res) {

                });
            },
            /**
             * 隐藏原生搜索栏
             * 异步
             */
            hideSearchBar: function() {
                JSBridge.callHandler(EJS_API, 'hideSearchBar', {}, function(res) {

                });
            },
            /**
             * 设置webview默认背景色
             * 该设置为全局设置，数据保存本地数据库，V6中对应的key值是FrmConfigKeys_EjsBgColor，通过getConfigValue可获取。
             * 异步
             * @param {String} color 对应颜色
             * 只支持16进制形式
             */
            setBgColor: function(color) {
                JSBridge.callHandler(EJS_API, 'setBgColor', {
                    "Color": color
                }, function(res) {

                });
            },
            /**
             * 设置导航栏主题
             * 设置主题后修改所有页面导航栏的背景色，文字颜色以及图片
             * V6框架中主题初始化在代码中写死了，如果需要个性化主题请原生开发人员手动添加。Android代码路径：com.epoint.frame.action.theme.ThemeConfig
             * 异步
             * @param {String} themeId 对应的皮肤id,原生内置
             * 框架目前提供的ThemeId有（请以项目实际代码为准）：
             * theme_default_blue(默认蓝色)、
             * theme_black、theme_red、
             * theme_sky、theme_water、
             * theme_mount、theme_night。
             * 其它需要自行拓展
             */
            setNbBarTheme: function(themeId) {
                JSBridge.callHandler(EJS_API, 'setNbBarTheme', {
                    "ThemeId": themeId
                }, function(res) {

                });
            },
            /**
             * @description 设置全局的skin
             * 这个api里内置了一些适合业务的webviewbg和barbg
             * @param {String} skin 相应的skin
             * 目前包括  default,day,night
             */
            setSkinTheme: function(skin) {
                skin = skin || 'default';
                if (skin === 'day') {
                    ejs.navigator.setBgColor('ffffff');
                    ejs.navigator.setNbBarTheme('theme_default_blue');
                } else if (skin === 'night') {
                    ejs.navigator.setBgColor('1a1a1a');
                    ejs.navigator.setNbBarTheme('theme_night');
                } else {
                    //default
                    //暂时使用和日间相同的设置
                    ejs.navigator.setBgColor('ffffff');
                    ejs.navigator.setNbBarTheme('theme_default_blue');
                }
            },
        };

        /**
         ***Sql 模块 
         * 包括原生的数据库键值操作
         */
        ejs.sql = {
            /**
             * @description 获取原生数据库中的键值对
             * 异步
             * @param {String} callback key
             * @param {Function} callback 回调函数
             */
            getConfigValue: function(key, callback, defaultValue) {
                key = key || '';
                if (ejs.os.ejs) {
                    JSBridge.callHandler(EJS_API, 'getConfigValue', {
                        "config_key": key
                    }, function(res) {
                        res = res || {};
                        callback && callback(res.result, res.msg, res);
                    });
                } else {
                    callback && callback({
                        result: {
                            value: defaultValue || ''
                        }
                    });
                }
            },
            /**
             * @description 设置原生数据库中的键值对
             * 异步
             * @param {String}  key
             * @param {String}  value
             * @param {Function} callback 回调函数
             */
            setConfigValue: function(key, value, callback) {
                key = key || '';
                JSBridge.callHandler(EJS_API, 'setConfigValue', {
                    "config_key": key,
                    "config_value": value
                }, function(res) {
                    res = res || {};
                    callback && callback(res.result, res.msg, res);
                });
            }
        };

        /**
         ***Oauth 模块 
         * 授权认证相关,如获取原生的token
         */
        ejs.oauth = {
            /**
             * @description 获取Token值
             * 异步
             * @param {Function} callback 回调函数,回调token值
             */
            getToken: function(callback, defaultValue) {
                if (ejs.os.ejs) {
                    JSBridge.callHandler(EJS_API, 'getToken', {}, function(res) {
                        res = res || {};
                        callback && callback(res.result, res.msg, res);
                    });
                } else {
                    callback && callback({
                        result: {
                            token: defaultValue || 'gtig_newtech**##'
                        }
                    });
                }

            },
            /**
             * @description 获取App应用Guid，与中间平台配置的应用guid匹配
             * 演示版本返回"moa_app_standard_v6"
             * 异步
             * @param {Function} callback 回调函数
             */
            getAppGuid: function(callback) {
                JSBridge.callHandler(EJS_API, 'getAppGuid', {}, function(res) {
                    res = res || {};
                    callback && callback(res.result, res.msg, res);
                });
            }
        };
        /**
         ***runtime 模块 
         * 运行环境管理，包括应用间的通信等
         */
        ejs.runtime = {
            /**
             * @description 调用第三方应用
             * 异步
             * @param {JSON} options 相关参数
             * 除了Param参数由H5提供，其他参数都要原生开发人员提供。
             * android有下面4种方式打开第三方app（优先级从上至下）：
             * 传PackageName+ClassName：打开指定页面；
             * 只传PackageName：打开app的启动页面；
             * 只传ActionName：打开指定页面；
             * 只传Scheme：打开指定页面。
             * @param {Function} callback 回调函数
             */
            launchApp: function(options, callback) {
                options = options || {};
                JSBridge.callHandler(EJS_API, 'openApp', {
                    "PackageName": options.PackageName,
                    "ClassName": options.ClassName,
                    "ActionName": options.ActionName,
                    "Scheme": options.Scheme,
                    "Param": options.Param
                }, function(res) {
                    res = res || {};
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 获取系统版本号名称
             * @param {JSON} options
             * @param {Function} callback
             */
            getVersionName: function(options, callback) {
                options = options || {};
                if (typeof options === 'function') {
                    callback = options;
                }
                JSBridge.callHandler(EJS_API, 'getVersionName', {

                }, function(res) {
                    res = res || {};
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 清除缓存
             * 会清楚webview的图片缓存，历史记录等存在内存中的信息
             * @param {JSON} options
             * @param {Function} callback
             */
            clearCache: function(options, callback) {
                options = options || {};
                if (typeof options === 'function') {
                    callback = options;
                }
                JSBridge.callHandler(EJS_API, 'clearCache', {

                }, function(res) {
                    res = res || {};
                    callback && callback(res.result, res.msg, res);
                });
            },
        };

        /**
         ***device 模块 
         * 设备信息相关
         */
        ejs.device = {
            /**
             * @description 获取当前网络状态
             * 异步
             * @param {Function} callback 对应的回调函数
             * 
             */
            getNetWorkType: function(callback) {
                JSBridge.callHandler(EJS_API, 'getNetWorkType', {}, function(res) {
                    //回调参数示例 {"result":{'NetWorkType':1(-1:无网络； 1：wifi； 0：移动网络)}}
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 强制设置屏幕的方向
             * Android中对首页的Fragment无效
             * 异步
             * @param {String} orientation 
             * 为"1"时强制竖屏；为"0"时强制横屏；其他按照系统设置旋转。
             */
            setOrientation: function(orientation) {
                JSBridge.callHandler(EJS_API, 'setOrientation', {
                    //默认是跟随系统设置
                    'orientation': orientation || '2'
                }, function(res) {
                    res = res || {};
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 获取屏幕分辨率
             * @param {Function} callback 回调函数
             */
            getPixel: function(callback) {
                JSBridge.callHandler(EJS_API, 'getPixel', {}, function(res) {
                    res = res || {};
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 获取设备厂商以及型号
             * @param {Function} callback 回调函数
             */
            getUAinfo: function(callback) {
                JSBridge.callHandler(EJS_API, 'getUAinfo', {}, function(res) {
                    res = res || {};
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 获取设备Mac地址（iOS 不支持该API）
             * 如果Wifi关闭的时候，可能返回空
             * 异步
             * @param {Function} callback 回调函数
             */
            getMacAddress: function(callback) {
                JSBridge.callHandler(EJS_API, 'getMacAddress', {}, function(res) {
                    res = res || {};
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 获取设备机器码
             * 双卡手机切换sim卡或者系统重置后可能会变
             * 如果机器码为空则返回mac地址
             * 异步
             * @param {Function} callback 回调函数
             */
            getDeviceId: function(callback) {
                JSBridge.callHandler(EJS_API, 'getDeviceid', {}, function(res) {
                    res = res || {};
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 打电话
             * 异步
             * @param {JSON} options
             * phoneNum 电话号码
             * @param {Function} callback 回调函数
             */
            callPhone: function(options, callback) {
                options = options || {};
                if (typeof options === 'string') {
                    options = {
                        phoneNum: options
                    };
                }
                JSBridge.callHandler(EJS_API, 'call', {
                    "phoneNum": options.phoneNum
                }, function(res) {
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 发短信
             * 进入手机短信编辑界面
             * 异步
             * @param {JSON} options
             * phoneNum 电话号码
             * message 短信内容
             * @param {Function} callback 回调函数
             */
            sendMsg: function(options, callback) {
                options = options || {};
                if (typeof options === 'string') {
                    options = {
                        phoneNum: options,
                        message: arguments[1]
                    };
                    callback = arguments[2];
                }
                JSBridge.callHandler(EJS_API, 'sendMsg', {
                    "phoneNum": options.phoneNum,
                    "message": options.message
                }, function(res) {
                    callback && callback(res.result, res.msg, res);
                });
            },
            /**
             * @description 是否平板设备
             * 异步
             * @param {Function} callback 回调函数
             */
            isTablet: function(callback) {
                JSBridge.callHandler(EJS_API, 'isTablet', {}, function(res) {
                    res = res || {};
                    callback && callback(res.result, res.msg, res);
                });
            }
        };

        /**
         ***app 模块 
         * 一些其它的杂七杂八的操作
         */
        ejs.app = {
            /**
             * @description 通过传入key值,得到页面key的初始化传值
             * 实际情况是获取 window.location.href 中的参数的值
             * 同步
             * @param {String} key
             */
            getExtraDataByKey: function(key) {
                if (!key) {
                    return null;
                }
                //获取url中的参数值
                var getUrlParamsValue = function(url, paramName) {
                    var paraString = url.substring(url.indexOf("?") + 1, url.length).split("&");
                    var paraObj = {}
                    var i, j;
                    for (i = 0; j = paraString[i]; i++) {
                        paraObj[j.substring(0, j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=") + 1, j.length);
                    }
                    var returnValue = paraObj[paramName.toLowerCase()];
                    //需要解码浏览器编码
                    returnValue = decodeURIComponent(returnValue);
                    if (typeof(returnValue) == "undefined") {
                        return undefined;
                    } else {
                        return returnValue;
                    }
                };
                var value = getUrlParamsValue(window.location.href, key);
                if (value === 'undefined') {
                    value = null;
                }
                return value;
            },
            /**
             * @description 添加参数到url上
             * @param {String} url
             * @param {JSON} jsonObj
             */
            appendParams: function(url, jsonObj) {
                return getFullUrlByParams(url, jsonObj);
            },
        };
        /**
         *** nativeComponents
         * 原生组件模块
         */
        ejs.nativeComponents = {
            /**
             * @description 打开二维码扫描功能
             * @param {JSON} options 额外参数
             * isOrientationLocked 扫码界面是否固定竖屏，仅当值为'0'时不固定
             * @param {Function} callback 回调函数
             * @param {Function} error 错误回调
             */
            openScan: function(options, callback, error) {
                options = options || {};
                JSBridge.callHandler(EJS_API, 'openScan', {
                    "isOrientationLocked": options.isOrientationLocked || '0'
                }, function(res) {
                    if (res.code == '4') {
                        //默认只有状态为4时才回调
                        callback && callback(res.result, res.msg, res);
                    } else if (res.code == '0') {
                        error && error(res);
                    }
                });
            },
            /**
             * @description 下载文件
             * 下载完成后自动打开文件。
             * 最大并发下载数5，超出部分等前面下载完成后自动下载
             * 
             * @param {JSON} options 额外参数
             * reDownloaded 是否重新下载。
             * reDownloader这个参数iOS未处理
             * 如果本地已有该文件是否重新下载。默认直接打开文件，为"1"时重新下载文件并且重命名。
             * 命名规则：原文件名_数字.后缀名。数字从1开始逐次递加,直到不再是重复名字。
             * url 下载地址。
             * fileName 文件名。如果为空，会根据url地址或者头文件中读取出文件名。。
             * @param {Function} callback 回调函数
             * @param {Function} error 错误回调
             * 
             */
            downloadFile: function(options, callback, error) {
                options = options || {};
                JSBridge.callHandler(EJS_API, 'downloadFile', {
                    //下载分类。默认不分类，保存路径统一为"/sacard/epointapp/attach/"。
                    //框架提供的指定分类有待办(TODO)，邮件(MAIL)，分类信息(CLASSITFY)，
                    //网络硬盘(NETDISK)，微消息(IM)，分别对应不同模块的附件下载，有对应的保存路径，
                    //指定分类后可在"附件管理"模块查看附件。另外还可以个性化分类，但需要原生开发配合新增类别。
                    //如果没有"附件管理"模块，可忽略该参数。
                    "type": options.type || '其他',
                    "reDownloaded": options.reDownloaded,
                    "url": options.url,
                    "fileName": options.fileName,
                    "isBackground": options.isBackground || 0,
                }, function(res) {
                    if (res.code == '1') {
                        //默认只有状态为4时才回调
                        callback && callback(res.result, res.msg, res);
                    } else if (res.code == '0') {
                        error && error(res);
                    }
                });
            },
            /**
             * @description 打开通用历史搜索界面
             * 支持手动和语音输入。
             * 语音输入需要讯飞sdk。
             * @param {JSON} options 额外参数
             * hint 输入框提示文字
             * @param {Function} callback 回调函数
             * @param {Function} error 错误回调
             */
            historySearch: function(options, callback, error) {
                options = options || {};
                JSBridge.callHandler(EJS_API, 'historySearch', {
                    "hint": options.hint
                }, function(res) {
                    if (res.code == '4') {
                        //默认只有状态为4时才回调
                        callback && callback(res.result, res.msg, res);
                    } else if (res.code == '0') {
                        error && error(res);
                    }
                });
            },
            /**
             * @description 打开本地通讯录选人组件
             * 同步完组织架构才能正常选择人员
             * iOS原生组件不支持单选
             * @param {JSON} options 额外参数
             * chooseType 选择类别，0代表多选，1代表单选
             * @param {Function} callback 回调函数
             * @param {Function} error 错误回调
             * selectedInfo
             * 已选人员信息。若非空则表示多选。值为人员信息的json数组。json对象格式需要符合以下规则：
             * key值为人员userguid，value值为人员信息键值对。
             * 人员信息可根据业务实际需求填写，传递哪些参数回调时也返回这些参数。
             * 参数包括UserGuid，LoginID，DisplayName，OUGuid，OrderNumber，Title，
             * TelephoneOffice，TelephoneHome，Mobile，Email，Sex，Fax，PostalAddress，
             * PostalCode，PhotoUrl，Description，ShortMobile，QQNumber，NTXExtNumber，
             * NamePYShou，SequenceId，Mark。
             */
            selectContact: function(options, callback, error) {
                options = options || {};
                //{'transFilterNames':'张三;李四','transFilterGuids':'1001;1002'}
                JSBridge.callHandler(EJS_API, 'selectContact', {
                    "isSingle": options.isSingle || '0',
                    "selectedInfo": options.selectedInfo,
                    //备选人员名字，多个用";"隔开。
                    "transFilterNames": options.transFilterNames || '',
                    //备选人员guid，多个用";"隔开。与transFilterNames一一对应。
                    "transFilterGuids": options.transFilterGuids || ''
                }, function(res) {
                    if (res.code == '4' || res.code == '1') {
                        //默认只有状态为4时才回调
                        callback && callback(res.result, res.msg, res);
                    } else if (res.code == '0') {
                        error && error(res);
                    }
                });
            },
            /**
             * @description 多图片选择
             * 选择过程中可进行已选图片预览。
             * 回调获取的是图片本地路径。
             * 可配合图片预览previewPics使用。
             * @param {JSON} options 额外参数
             * maxPic 可选图片的最大数。不能小于1。
             * @param {Function} callback 回调函数
             * @param {Function} error 错误回调函数
             */
            selectPics: function(options, callback, error) {
                options = options || {};
                JSBridge.callHandler(EJS_API, 'selectPics', {
                    "maxPic": options.maxPic
                }, function(res) {
                    if (res.code == '4') {
                        //默认只有状态为4时才回调
                        callback && callback(res.result, res.msg, res);
                    } else if (res.code == '0') {
                        error && error(res);
                    }
                });
            },
            /**
             * @description 图片预览
             * 支持网络图片，设备本地图片，应用资源图片。
             * iOS中以"file://"开头，加载的是沙盒中的图片，fileGuid
             * iOS中以“drawable://”开头，加载的是mainBundle中的图片，后面拼接的是图片的名字
             * @param {JSON} options 额外参数
             * url图片地址。网络图片以"http://"开头；设备本地路径以"file://"开头，
             * 后面接文件sd卡路径，；用drawable中的资源文件以"drawable://"开头，
             * 后面接图片名字；应用assets中的资源文件以"assets://"开头，后面接文件路径。
             * index 默认显示图片序号。值为数字
             */
            previewPics: function(options) {
                options = options || {};
                JSBridge.callHandler(EJS_API, 'previewPics', {
                    "url": options.url,
                    'index': options.index || 0
                }, function() {

                });
            },
            /**
             * @description 检查app更新
             */
            updateApp: function() {

                JSBridge.callHandler(EJS_API, 'updateApp', {

                }, function() {

                });
            },
            /**
             * @description 系统分享
             * 该api调用的是原生系统组件，不同手机展示的界面以及效果可能不一样
             * 只能弹出手机中已安装的应用,包括qq，微信，微博，钉钉等
             * 系统分享能力有限，如果需要更加强大的分享功能请使用sharesdk
             * 参数SDPath仅android支持
             * 参数shareImgURL仅iOS支持
             * @param {JSON} options 额外参数
             */
            sysShare: function(options) {
                options = options || {};
                var title = '';
                if (typeof options === 'string') {
                    title = options;
                } else {
                    title = options.shareTitle;
                }
                JSBridge.callHandler(EJS_API, 'sysShare', {
                    'shareTitle': title || '',
                    'shareURL': options.shareURL,
                    'shareImgBase64': options.shareImgBase64,
                    'shareImgURL': options.shareImgURL,
                    'SDPath': options.SDPath,
                }, function() {

                });
            },
            /**
             * @description 播放在线视频
             * @param {JSON} options 额外参数
             * videoUrl 视频地址，必填
             * thumbUrl 缩略图地址，默认为空
             * title 顶部标题，默认为空
             * @param {Function} callback 回调函数
             * @param {Function} error 错误回调
             */
            playVideo: function(options, callback, error) {
                options = options || {};
                JSBridge.callHandler(EJS_API, 'playVideo', {
                    "videoUrl": options.videoUrl || '',
                    "thumbUrl": options.thumbUrl || '',
                    "title": options.title || '',
                }, function(res) {
                    if (res.code == '1') {
                        //默认只有状态为4时才回调
                        callback && callback(res.result, res.msg, res);
                    } else if (res.code == '0') {
                        error && error(res);
                    }
                });
            },
            //收藏模块
            //使用收藏相关API请升级框架核心类库(android升级至epointandroidcore_V2.1.jar以上版本) 
            //只返回保存为非空的字段以及CollectionTime(保存时间)字段
            collection: {
                /**
                 * @description 保存本地收藏信息
                 * 保存本地数据库，可用于离线查看
                 * 可根据实际业务需求灵活应用该API
                 * 返回code为1表示保存，否则保存失败
                 * @param {JSON} options 相关配置参数
                 * @param {Function} callback 回调函数
                 * @param {Function} error 错误回调
                 */
                saveLocalCollections: function(options, callback, error) {
                    JSBridge.callHandler(EJS_API, 'saveLocalCollections', {
                        'MsgGuid': options.MsgGuid || '',
                        'Title': options.Title || '',
                        'DateTime': options.DateTime || '',
                        'Publisher': options.Publisher || '',
                        'Type': options.Type || '',
                        'URL': options.URL || '',
                        'Remark': options.Remark || '',
                        'Flag': options.Flag || '',
                    }, function(res) {
                        if (res.code == '1') {
                            callback && callback(res.result, res.msg, res);
                        } else {
                            error && error(res);
                        }
                    });
                },
                /**
                 * @description 获取本地收藏信息
                 * @param {params} options 配置参数
                 * pageIndex 从第一页开始
                 * pageSize 默认是10
                 * @param {Function} callback 回调函数
                 */
                getLocalCollections: function(options, callback) {
                    if (typeof arguments[0] === 'function') {
                        callback = typeof arguments[0];
                        options = {};
                    }
                    options = options || {};
                    JSBridge.callHandler(EJS_API, 'getLocalCollections', {
                        'pageIndex': options.pageIndex || 1,
                        'pageSize': options.pageSize || 10
                    }, function(res) {
                        //{'collectionInfo':[{"CollectionTime":"2016-12-26 16:26:14","Type":"test","MsgGuid":"1","DateTime":"2016.12.26 15:20","Title":"收藏title"}]}
                        callback && callback(res.result, res.msg, res);
                    });
                },
                /**
                 * @description 判断是否收藏
                 * @param {String} MsgGuid 信息guid
                 * @param {Function} callback 回调函数
                 */
                isCollection: function(MsgGuid, callback) {
                    JSBridge.callHandler(EJS_API, 'isCollection', {
                        'MsgGuid': MsgGuid
                    }, function(res) {
                        //{'isCollection':'1'（1表示收藏 0表示未收藏）}
                        callback && callback(res.result, res.msg, res);
                    });
                },
                /**
                 * @description 取消本地收藏信息
                 * 返回code为1表示删除成功，否则删除失败
                 * @param {String} MsgGuid 信息guid
                 * @param {Function} callback 回调函数
                 * @param {Function} error 错误回调
                 */
                delCollection: function(MsgGuid, callback, error) {
                    JSBridge.callHandler(EJS_API, 'delCollection', {
                        //信息guid
                        'MsgGuid': MsgGuid
                    }, function(res) {
                        if (res.code == '1') {
                            callback && callback(res.result, res.msg, res);
                        } else {
                            error && error(res);
                        }

                    });
                },
                /**
                 * @description 清空本地所有收藏信息
                 * 如果有登录帐号，则只会删除该帐号收藏的所有信息
                 * 返回code为1表示删除成功，否则删除失败
                 * @param {Function} callback 回调函数
                 * @param {Function} error 错误回调
                 */
                delAllCollections: function(callback, error) {
                    JSBridge.callHandler(EJS_API, 'delAllCollections', {}, function(res) {
                        if (res.code == '1') {
                            callback && callback(res.result, res.msg, res);
                        } else {
                            error && error(res);
                        }

                    });
                },

            },

        };
        /**
         * @description 调用ejs的错误回调
         * @param {Function} callback 回调函数
         */
        ejs.error = function(callback) {
            globalError = callback;
        };
        /**
         * @description ready方法
         * 目前暂时不做操作，作为保留方法
         * @param {Function} callback 回调函数
         */
        ejs.ready = function(callback) {
            callback && callback();
        };
        /**
         * @description 调用ejs的自定义方法
         * @param {String} handlerName 方法名
         * @param {JSON} data 额外参数
         * @param {Function} callback 回调函数
         * @param {String} proto 协议头,默认为epoint_bridge_custom
         */
        ejs.call = function(handlerName, data, callback, proto) {
            proto = proto || EJS_API_CUSTOM;
            data = data || {};
            JSBridge.callHandler(proto, handlerName, data, function(res) {
                callback && callback(res.result, res.msg, res);
            });
        };

        exports.version = '2.1.6';
        return exports;
    })(global.ejs = {}, false);
});