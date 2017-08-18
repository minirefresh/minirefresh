/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/21
 * 版本: [3.0, 2017/06/21 ]
 * 版权: 移动研发部
 * 描述: ejs的定义
 * 有一些api的成功执行是需要依赖于一些ejs内部组件的，例如globalError等
 */
"use strict";

var ejs = window.ejs || (function(exports, undefined) {

    /**
     * 默认不是debug版本
     */
    exports.isDebug = false;

    /**
     * 版本号控制
     * 大版本.小版本.修正版本
     */
    exports.version = '3.0.0';
    
    /**
     * Promise的支持
     */
    exports.Promise = window.Promise;

    /**
     * 几个全局变量 用来控制全局的config与ready逻辑
     * 默认ready是false的
     */
    var globalError,
        globalReady,
        isAllowReady = false,
        isConfig = false;

    /**
     * 提示全局错误
     * @param {Object} target
     * @param {Nunber} code
     * @param {String} msg
     */
    function errorTips(code, msg) {
        code = code || 0;
        msg = msg || '错误!';

        console.error('错误代码:' + code + ',' + msg);

        globalError && globalError({
            code: code,
            message: msg
        });
    }
    exports.errorTips = errorTips;

    /**
     * 检查ejs是否合法，包括
     * 是否是3.0，如果不是，给出错误提示
     * 是否版本号小于容器版本号，如果小于，给予升级提示
     */
    function checkEnv() {
        if (!ejs.os.ejs) {
            return;
        }
        if ((!ejs.runtime || !ejs.runtime.getEjsVersion)) {
            errorTips(ejs.globalError.ERROR_TYPE_VERSIONNOTSUPPORT.code, ejs.globalError.ERROR_TYPE_VERSIONNOTSUPPORT.msg);
        } else {
            ejs.runtime.getEjsVersion({
                success: function(result, res) {
                    var version = result.version;

                    if (ejs.innerUtil.compareVersion(ejs.version, version) < 0) {
                        errorTips(ejs.globalError.ERROR_TYPE_VERSIONNEEDUPGRADE.code, ejs.globalError.ERROR_TYPE_VERSIONNEEDUPGRADE.msg);
                    }
                },
                error: function(error) {
                    errorTips(ejs.globalError.ERROR_TYPE_INITVERSIONERROR.code, ejs.globalError.ERROR_TYPE_INITVERSIONERROR.msg);
                }
            });
        }
    }
    /**
     * 页面初始化时必须要这个config函数
     * 必须先声明ready，然后再config
     * @param {Object} params
     * config的jsApiList主要是同来通知给原生进行注册的
     * 所以这个接口到时候需要向ejs原生请求的
     */
    exports.config = function(params) {
        if (isConfig) {
            errorTips(ejs.globalError.ERROR_TYPE_CONFIGMODIFY.code, ejs.globalError.ERROR_TYPE_CONFIGMODIFY.msg);
        } else {
            isConfig = true;
            var success = function() {
                // 如果这时候有ready回调
                if (globalReady) {
                    globalReady && globalReady();
                } else {
                    // 允许ready直接执行
                    isAllowReady = true;
                }
            };
            if (ejs.os.ejs) {
                // 暂时检查环境默认就进行，因为框架默认注册了基本api的，并且这样2.也可以给予相应提示
                checkEnv();
                
                ejs.event.config(ejs.innerUtil.extend({
                    success: function(result, res) {
                        success();
                    },
                    error: function(error) {
                        errorTips(ejs.globalError.ERROR_TYPE_CONFIGERROR.code, ejs.globalError.ERROR_TYPE_CONFIGERROR.msg);
                    }
                }, params));
                
            } else {
                success();
            }
        }
    };

    /**
     * 当ejs 初始化完毕，并且config验证完毕后会触发这个回调
     * 注意，只有config了，才会触发ready，否则无法触发
     * ready只会触发一次，所以如果同时设置两个，第二个ready回调会无效
     * @param {Function} callback
     */
    exports.ready = function(callback) {
        if (!globalReady) {
            globalReady = callback;
            // 如果config先进行，然后才进行ready,这时候恰好又isAllowReady，代表ready可以直接自动执行
            if (isAllowReady) {
                globalReady && globalReady();
                isAllowReady = false;
            }
        } else {
            errorTips(ejs.globalError.ERROR_TYPE_READYMODIFY.code, ejs.globalError.ERROR_TYPE_READYMODIFY.msg);
        }
    };

    /**
     * 当ejs出现错误时，会通过这个函数回调给开发者，可以拿到里面的提示信息
     * @param {Function} callback 开发者设置的回调(每次会监听一个全局error函数)
     */
    exports.error = function(callback) {
        /**
                    {
                       msg:"错误信息",//msg信息会给出具体的错误提示
                       code:"错误码"
                    }
                **/

        globalError = callback;
    };

    /**
     * 兼容require
     */
    if (typeof module != 'undefined' && module.exports) {
        module.exports = exports;
    } else if (typeof define == 'function' && (define.amd || define.cmd)) {
        define(function() {
            return exports;
        });
    }

    return exports;
})({});
/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/21
 * 版本: [3.0, 2017/06/21 ]
 * 版权: 移动研发部
 * 描述: 甄别系统环境的代码
 */

(function(exports) {
    "use strict";
        
    /**
     * 判断os系统 ,判断是Android还是iOS
     */
    (function() {
        function detect(ua) {
            this.os = {};
            this.os.name = 'browser';
            var funcs = [
                function() {
                    // android
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
                function() {
                    // ios
                    var iphone = ua.match(/(iPhone\sOS)\s([\d_]+)/);
                    if (iphone) {
                        // iphone
                        this.os.ios = this.os.iphone = true;
                        this.os.version = iphone[2].replace(/_/g, '.');
                        this.os.name += '_' + 'iphone';
                        this.os.name += '_' + 'mobile';
                    } else {
                        var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
                        if (ipad) {
                            // ipad
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
     * 判断os系统 ,判断是否是ejs
     */
    (function() {
        function detect(ua) {
            this.os = this.os || {};
            // 比如 EpointEJS/6.1.1  也可以/(EpointEJS)\/([\d\.]+)/i
            var ejs = ua.match(/EpointEJS/i);
            if (ejs) {
                this.os.ejs = true;
                this.os.name += '_' + 'ejs';
            }
            // 阿里的钉钉 DingTalk/3.0.0 
            var dd = ua.match(/DingTalk/i);
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
})(ejs);
/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/19 
 * 版本: [3.0, 2017/05/19 ]
 * 版权: 移动研发部
 * 描述: 封装一些常用方法,主要供内部使用，所以绑在了一个内部对象上
 * 注意，如果在 innerUtil内部使用 this 互相引用，在外界传入临时野指针时，会无法正常使用
 * 比如  tmp = ejs.innerUtil   tmp.extend()  这时候如果内部使用的this  指针指向就会有偏差
 * 所以对我暴露的 Util 就不再使用 this 指针依赖了
 */

(function(exports) {
    "use strict";

    var innerUtil = {
        /**
         * 空函数
         */
        noop: function() {},
        isFunction: function(value) {
            return innerUtil.type(value) === "function";
        },
        isPlainObject: function(obj) {
            return innerUtil.isObject(obj) && !innerUtil.isWindow(obj) && Object.getPrototypeOf(obj) === Object.prototype;
        },
        isArray: Array.isArray ||
            function(object) {
                return object instanceof Array;
            },
        /**
         *  isWindow(需考虑obj为undefined的情况)
         */
        isWindow: function(obj) {
            return obj != null && obj === obj.window;
        },
        isObject: function(obj) {
            return innerUtil.type(obj) === "object";
        },
        type: function(obj) {
            return obj == null ? String(obj) : class2type[{}.toString.call(obj)] || "object";
        },
        /**
         * each遍历操作
         * @param {type} elements
         * @param {type} callback
         * @returns {global}
         */
        each: function(elements, callback, hasOwnProperty) {
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
        },
        /**
         * extend(simple)
         * @param {type} deep 是否递归合并
         * @param {type} target 最终返回的就是target
         * @param {type} source 从左到又，优先级依次提高，最右侧的是最后覆盖的
         * @returns {unresolved}
         */
        extend: function(target, source) {
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
            if (typeof target !== "object" && !innerUtil.isFunction(target)) {
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
                        if (deep && copy && (innerUtil.isPlainObject(copy) || (copyIsArray = innerUtil.isArray(copy)))) {
                            if (copyIsArray) {
                                copyIsArray = false;
                                clone = src && innerUtil.isArray(src) ? src : [];

                            } else {
                                clone = src && innerUtil.isPlainObject(src) ? src : {};
                            }
                            // 递归时需要注意指针
                            target[name] = innerUtil.extend(deep, clone, copy);
                        } else if (copy !== undefined) {
                            target[name] = copy;
                        }
                    }
                }
            }
            return target;
        },
        /**
         * 是否是合法的os，即目标os是否在当前数组中
         * @param {Array} osArray
         * @param {String} name
         * @return {Boolean} 返回当前os是否包含target
         */
        isAvailableOS: function(osArray, name) {
            if (osArray && Array.isArray(osArray)) {
                return osArray.indexOf(name) !== -1;
            } else {
                return false;
            }
        },
        /**
         * 如果version1大于version2，返回1，如果小于，返回-1，否则返回0。
         * @param {string} version1
         * @param {string} version2
         * @return {number}
         */
        compareVersion: function(version1, version2) {
            if (!version1) {
                return -1;
            }
            if (!version2) {
                return 1;
            }
            var verArr1 = version1.split('.');
            var verArr2 = version2.split('.');

            var len = Math.max(verArr1.length, verArr2.length);
            for (var i = 0; i < len; i++) {
                var ver1 = verArr1[i] || 0;
                var ver2 = verArr2[i] || 0;
                ver1 -= 0;
                ver2 -= 0;
                if (ver1 > ver2) {
                    return 1;
                } else if (ver1 < ver2) {
                    return -1;
                }
            }

            return 0;
        },
        /**
         * 得到一个项目的根路径,只适用于混合开发
         * h5模式下例如:http://id:端口/项目名/
         * @param {String} 项目需要读取的基本目录
         * @return {String} 项目的根路径
         */
        getProjectBasePath: function(reg) {
            reg = reg || '/pages/';
            var basePath = '';
            var obj = window.location;
            var patehName = obj.pathname;
            //h5
            var contextPath = '';
            //兼容pages
            //普通浏览器
            contextPath = patehName.substr(0, patehName.lastIndexOf(reg) + 1);
            if (!contextPath || contextPath === '/') {
                //这种获取路径的方法有一个要求,那就是所有的html必须在html文件夹中,并且html文件夹必须在项目的根目录
                contextPath = patehName.substr(0, patehName.lastIndexOf("/html") + 1);
            }
            // 如果还没有找到，直接找到读取项目名称
            if (!contextPath || contextPath === '/') {
                var path = patehName;
                if (patehName.indexOf('/') === 0) {
                    path = path.substring(1);
                }
                contextPath = '/' + path.split('/')[0] + '/';
            }
            //var contextPath = obj.pathname.split("/")[1] + '/';
            // 兼容在网站根路径时的路径问题
            basePath = obj.protocol + "//" + obj.host + (contextPath ? contextPath : '/');
            return basePath;
        },
        /**
         * 将相对路径转为绝对路径 ./ ../ 开头的  为相对路径
         * 会基于对应调用js的html路径去计算
         * @param {Object} path
         */
        changeRelativePathToAbsolute: function(path) {
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
        },
        /**
         * 得到一个全路径
         * @param {String} path
         * @return {String} 返回最终的路径
         */
        getFullPath: function(path) {
            if (!path) {
                return path;
            }
            // 全路径
            if (/^(http|https|ftp|\/\/)/g.test(path)) {
                return path;
            }
            // 是否是相对路径
            var isRelative = path.indexOf('./') != -1 || path.indexOf('../') != -1;
            // 非相对路径，页面路径默认从html目录开始，相对路径有一套页面打开方案
            path = (isRelative ? innerUtil.changeRelativePathToAbsolute(path) : ((innerUtil.getProjectBasePath()) + path));
            return path;
        },
        /**
         * 将json参数拼接到url中
         * @param {String} url
         * @param {Object} data
         * @return {String} 返回最终的url
         */
        getFullUrlByParams: function(url, data) {
            url = url || '';
            url = innerUtil.getFullPath(url);
            //将jsonObj拼接到url上
            var extrasDataStr = '';
            if (data) {
                for (var item in data) {
                    if (extrasDataStr.indexOf('?') == -1 && url.indexOf('?') == -1) {
                        extrasDataStr += '?';
                    } else {
                        extrasDataStr += '&';
                    }
                    extrasDataStr += item + '=' + data[item];
                }
            }
            url = url + extrasDataStr;

            return url;
        },
    };

    var class2type = {};
    innerUtil.each(['Boolean', 'Number', 'String', 'Function', 'Array', 'Date', 'RegExp', 'Object', 'Error'], function(i, name) {
        class2type["[object " + name + "]"] = name.toLowerCase();
    });

    exports.innerUtil = innerUtil;
})(ejs);
/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/19 
 * 版本: [3.0, 2017/05/19 ]
 * 版权: 移动研发部
 * 描述: 全局错误常量
 */

(function(exports) {
    "use strict";
        
    exports.globalError = {

        /**
         * 1001 api os错误
         */
        ERROR_TYPE_APIOS: {
            code: 1001,
            // 这个只是默认的提示，如果没有新的提示，就会采用默认的提示
            msg: '该API无法在当前OS下运行'
        },
        /**
         * 1002 api modify错误
         */
        ERROR_TYPE_APIMODIFY: {
            code: 1002,
            msg: '不允许更改ejs的API'
        },
        /**
         * 1003 module modify错误
         */
        ERROR_TYPE_MODULEMODIFY: {
            code: 1003,
            msg: '不允许更改ejs的模块'
        },
        /**
         * 1004 api 不存在
         */
        ERROR_TYPE_APINOTEXIST: {
            code: 1004,
            msg: '调用了不存在的api'
        },
        /**
         * 1005 组件api对应的proto不存在
         */
        ERROR_TYPE_PROTONOTEXIST: {
            code: 1005,
            msg: '调用错误，该组件api对应的proto不存在'
        },
        /**
         * 1006 非ejs下无法调用自定义组件API
         */
        ERROR_TYPE_CUSTOMEAPINOTEXIST: {
            code: 1006,
            msg: '非ejs下无法调用自定义组件API'
        },
        /**
         * 1007 对应的event事件在该环境下不存在
         */
        ERROR_TYPE_EVENTNOTEXIST: {
            code: 1007,
            msg: '对应的event事件在该环境下不存在'
        },
        /**
         * 1007 对应的event事件在该环境下不存在
         */
        ERROR_TYPE_INITVERSIONERROR: {
            code: 1008,
            msg: '初始化版本号错误，请检查容器api的实现情况'
        },
        /**
         * 2001 ready modify错误-ready回调正常只允许定义一个
         */
        ERROR_TYPE_READYMODIFY: {
            code: 2001,
            msg: 'ready回调不允许多次设置'
        },
        /**
         * 2002 config modify错误-正常一个页面只允许config一次
         */
        ERROR_TYPE_CONFIGMODIFY: {
            code: 2002,
            msg: 'config不允许多次调用'
        },
        /**
         * 2003 config 错误
         */
        ERROR_TYPE_CONFIGERROR: {
            code: 2003,
            msg: 'config校验错误'
        },
        /**
         * 2004 version not support
         */
        ERROR_TYPE_VERSIONNOTSUPPORT: {
            code: 2004,
            msg: '不支持当前ejs容器版本，请使用3.x及以上版本'
        },
        /**
         * 2004 version not support
         */
        ERROR_TYPE_VERSIONNEEDUPGRADE: {
            code: 2005,
            msg: '当前ejs库小于容器版本，请将前端库升级到最新版本'
        },
        /**
         * 3000 原生错误(非API错误)，原生捕获到的错误都会通知J5
         */
        ERROR_TYPE_NATIVE: {
            code: 3000,
            msg: '捕获到一处原生容器错误'
        },
        /**
         * 3001 原生调用h5错误  原生通过JSBridge调用h5错误，可能是参数不对
         */
        ERROR_TYPE_NATIVECALL: {
            code: 3001,
            msg: '原生调用H5时参数不对'
        },
        /**
         * 9999 其它未知错误
         */
        ERROR_TYPE_UNKNOWN: {
            code: 9999,
            msg: '未知错误'
        }
    };

})(ejs);
/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/19 
 * 版本: [3.0, 2017/05/19 ]
 * 版权: 移动研发部
 * 描述: 代理某一个ejs api，主要目的为:
 * 在代理里面进行API的统一预处理，如参数统一url编码，采用默认参数等
 */

(function(exports) {
    /**
     * 一个代理类，调用特定API时，经过代理可以进行统一逻辑预处理
     * @param {Object} api
     * @param {Function} callback
     * @param {Object} target 目标对象，例如ejs
     * @constructor
     */
    function Proxy(api, callback, target) {
        this.api = api;
        this.callback = callback;
        // 当前环境的ejs引用
        this.target = target;
    }
    /**
     * epointjs api内部调用时的观察函数，用来检测api调用是否合法
     * 这个观察者目前可以做很多其它事情(不满足条件。返回错误给代理即可)
     * 因为所有的api调用都会经过代理函数处理的
     */
    Proxy.prototype.walk = function() {
        // 这里在闭包执行完毕后，手动将闭包内的引用置空
        var self = this;
        var api = this.api;
        var callback = this.callback;
        
        // 之所以每次都要返回闭包，是因为要在这里面进行统一预处理，判断参数是否合法等
        return function() {
            // 永远不要试图修改arguments，请单独备份
            var args = [].slice.call(arguments);
            if (args[0] == null) {
                // 给一个空的options，方便使用默认参数
                args[0] = {};
            }
            // 默认参数
            if (api.defaultParams && typeof args[0] === 'object') {
                for (var item in api.defaultParams) {
                    if (args[0][item] == undefined) {
                        args[0][item] = api.defaultParams[item];
                    }

                }
            }
            // 内部决定是否要用 Promise
            var finallyCallback;
            
            if (callback) {
                // 如果回调存在
                // 将this指针修正为proxy内部，方便直接使用一些api关键参数
                finallyCallback = callback;
            } else {
                // 不存在，调用默认处理，条件是-
                // 如果是在ejs环境下，而且没有实现runcode，而且ejs._callProxy存在
                if (ejs._callProxy && self.api && self.api.os.indexOf('ejs') != -1) {
                    finallyCallback = ejs._callProxy;
                }
            }
            
            if (ejs.Promise) {              
                return finallyCallback && new ejs.Promise(function(resolve, reject) {
                    // 拓展 args
                    args = args.concat([resolve, reject]);
                    finallyCallback.apply(self, args);
                });
            } else {
                return finallyCallback && finallyCallback.apply(self, args);
            }
        };
    };
    /**
     * 析构函数
     */
    Proxy.prototype.dispose = function() {
        this.api = null;
        this.callback = null;
    };

    exports.Proxy = Proxy;
})(ejs);
/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/22
 * 版本: [3.0, 2017/05/22 ]
 * 版权: 移动研发部
 * 描述: 拓展一个ejs api，包括
 * 新的模块时，观察整个模块，防止被篡改
 * 新的api时，代理每一个api，进行统一预处理
 * 依赖于: ejs.innerUtil  ejs.globalError  ejs.Proxy
 */
(function(exports) {
    "use strict";
    
    /**
     * 存放所有的代理 api对象
     */
    var proxysApis = {};
    /**
     * 存放所有的代理 module对象
     */
    var proxysModules = {};
    /**
     * 存放所有的os集合(api支持的os环境)
     */
    var osArray = ['ejs', 'dd', 'h5'];

    /**
     * 获取应该api在目标target上应该执行的os环境(这个会用到默认的几个os)
     * @param {Object} target 目标的target
     */
    function getApiOS(target) {
        for (var i = 0, len = osArray.length; i < len; i++) {
            if (target.os[osArray[i]]) {
                return osArray[i];
            }
        }
        // 默认是h5
        return 'h5';
    }
    /**
     * 获取这个模块下对应命名空间的对象
     * @param {Object} module
     * @param {Array} namespaceArr
     * @param {Number} len 这个命名空间的长度
     */
    function getNameSpaceObj(module, namespaceArr, len) {
        // 找到函数的parent
        var obj = module;
        for (var i = 0; i < len; i++) {
            var tmp = namespaceArr[i];
            // 不存在的话要重新创建对象
            obj[tmp] = obj[tmp] || {};
            // parent要向下一级
            obj = obj[tmp];
        }

        return obj;
    }
    /**
     * 拓展某一个方法
     * @param {String} moduleName 模块名
     * @param {Object} api 模块下的api
     * api包括namespace runcode等属性
     */
    function extendApi(moduleName, api) {
        var target = exports;
        
        if (!target || !moduleName || !api || !api.namespace || !target[moduleName]) {
            return;
        }
        // api加上module关键字，方便内部处理
        api.moduleName = moduleName;
        // 先找到目标模块
        var module = target[moduleName];
        // 处理命名空间
        // 例如处理  pulltorefresh.refresh 这种api
        var namespaceArr = api.namespace.split('.'),
            len = namespaceArr.length;

        // 最后一个key就不遍历了，需要得到api的parent对象
        var parent = getNameSpaceObj(module, namespaceArr, len - 1);
        // 得到一个唯一的api命名空间，key是api对应的key值
        var namespace = moduleName + '.' + namespaceArr.join('.'),
            key = namespaceArr[len - 1];
        // 更新新的代理api        
        // 这里防止触发代理，就不用parent[key]了，而是用proxysApis[namespace]
        if (!proxysApis[namespace]) {
            // 如果还没有这个key,代理，只需要设置一次代理即可
            _proxy(target, parent, namespace, key, api);
        }
        // 新的proxy，或者是增加新的os下的api或者是覆盖
        var newProxy = new ejs.Proxy(api, api.runCode, target);
        var oldNameSpace = proxysApis[namespace] || {};

        proxysApis[namespace] = {};
        var isOldUse = false;
        for (var i = 0, len = osArray.length; i < len; i++) {
            var tmp = osArray[i];
            if (ejs.innerUtil.isAvailableOS(api.os, tmp)) {
                // 如果有重新定义这个os
                proxysApis[namespace][tmp] = newProxy;
                proxysApis[namespace]['api'] = api;
            } else {
                isOldUse = true;
                proxysApis[namespace][tmp] = oldNameSpace[tmp];
            }
        }
        // 合并api中的os(主要是提示时用到),注意，要在上面的api定义完毕后再合并，否则会影响判断
        if (oldNameSpace.api && oldNameSpace.api.os && api.os) {
            // 去重，这里就不用Set了，而是直接操作数组
            for (var i = 0, len = oldNameSpace.api.os.length; i < len; i++) {
                if (api.os.indexOf(oldNameSpace.api.os[i]) == -1) {
                    api.os.push(oldNameSpace.api.os[i]);
                }
            }
        }
        // 如果老的代理已经不用了
        if (!isOldUse && oldNameSpace[tmp]) {
            // 释放引用,防止一直持有引用导致无法回收
            oldNameSpace[tmp].dispose();
        }

    }

    /**
     * 代理一个对象
     * 将parent里的方法调用都代理到  Proxy执行，方便在里面进行一些条件判断
     * @param {Object} target 目标对象，例如ejs对象
     * @param {Object} parent
     * @param {String} namespace
     * @param {String} key
     * @param {Object} api
     */
    function _proxy(target, parent, namespace, key, api) {
        // 代理，将parent里的api代理到Proxy执行
        Object.defineProperty(parent, key, {
            configurable: true,
            enumerable: true,
            get: function proxyGetter() {
                // 确保get得到的函数一定是能执行的
                var nameSpace = proxysApis[namespace];
                if (nameSpace) {
                    // 默认是h5版本
                    var proxyObj = nameSpace[getApiOS(target)] || nameSpace['h5'];
                    if (proxyObj) {
                        /**
                         * 返回代理对象，所以所有的api都会通过这个代理函数
                         * 注意引用问题，如果直接返回原型链式的函数对象，由于是在getter中，里面的this会被改写
                         * 所以需要通过walk后主动返回
                         */
                        return proxyObj.walk();
                    } else {
                        // 正常情况下走不到，除非预编译的时候在walk里手动抛出
                        var msg = nameSpace.api.namespace + '要求的os环境为:' + (nameSpace.api.os ? (nameSpace.api.os.join('或')) : '"非法"');
                        target.errorTips(ejs.globalError.ERROR_TYPE_APIOS.code, msg);
                        return ejs.innerUtil.noop;
                    }
                } else {
                    // 如果连 nameSpace 都没有，代表这个api还没有代理，也就是说没有声明
                    // 但正常情况下不会走到这里
                    target.errorTips(ejs.globalError.ERROR_TYPE_APINOTEXIST.code, ejs.globalError.ERROR_TYPE_APINOTEXIST.msg);
                    // 错误提示
                    return ejs.innerUtil.noop;
                }
            },
            set: function proxySetter(val) {
                target.errorTips(ejs.globalError.ERROR_TYPE_APIMODIFY.code, ejs.globalError.ERROR_TYPE_APIMODIFY.msg);
            }
        });
    }
    /**
     * 监听模块，防止被篡改
     * @param {String} moduleName 模块名
     */
    function observeModule(moduleName) {
        var target = exports;
        
        // 监听这个module,防止后续被篡改
        Object.defineProperty(target, moduleName, {
            configurable: true,
            enumerable: true,
            get: function proxyGetter() {
                if (!proxysModules[moduleName]) {
                    proxysModules[moduleName] = {};
                }
                return proxysModules[moduleName];
            },
            set: function proxySetter(val) {
                target.errorTips(ejs.globalError.ERROR_TYPE_MODULEMODIFY.code, ejs.globalError.ERROR_TYPE_MODULEMODIFY.msg);
            }
        });
    }
    /**
     * 拓展整个对象的模块
     * @param {String} moduleName 模块名
     * @param {Array} apis 对应的api
     */
    function extendModule(moduleName, apis) {
        var target = exports;
        
        if (!target[moduleName]) {
            // 如果没有定义模块，监听整个模块，用代理取值，防止重定义
            // 这样，模块只允许初次定义以及之后的赋值，其它操作都会被内部拒绝
            observeModule(moduleName);
        }
        if (!apis || !Array.isArray(apis)) {
            return;
        }
        for (var i = 0, len = apis.length; i < len; i++) {
            extendApi(moduleName, apis[i]);
        }
    }
    
    exports.extendModule = extendModule;
    exports.extendApi = extendApi;
})(ejs);