/**
 * 作者: 戴荔春
 * 创建时间: 2017/07/04
 * 版本: [1.0, 2017/07/04 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: ajax的实现，同时拓展了文件上传的支持
 * 作为核心类库存在
 */
(function(exports) {
    "use strict";

    var jsonType = 'application/json';
    var htmlType = 'text/html';
    var rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    var scriptTypeRE = /^(?:text|application)\/javascript/i;
    var xmlTypeRE = /^(?:text|application)\/xml/i;
    var blankRE = /^\s*$/;

    /**
     * noop
     */
    var noop = exports.noop,
        $isArray = exports.isArray,
        $isPlainObject = exports.isPlainObject,
        $type = exports.type,
        $each = exports.each,
        $extend = exports.extend;

    var now = Date.now || function() {
        return +new Date();
    };

    /**
     * 默认的default设置
     */
    var defaultSetting = {
        url: '',
        type: 'POST',
        beforeSend: noop,
        success: noop,
        error: noop,
        complete: noop,
        extendHook: {},
        // 可以传一个context，成功回调和失败回调中都可以用this指向它
        context: null,
        xhr: function(protocol) {
            return new window.XMLHttpRequest();
        },
        // MIME 类别映射，对应的是 dataType属性的值 ，MIME值需要固定
        // dataType 默认不做设置，会优先使用  mimeType 或者response中的 content-type
        accepts: {
            script: 'text/javascript, application/javascript, application/x-javascript',
            json: jsonType,
            xml: 'application/xml, text/xml',
            html: htmlType,
            text: 'text/plain'
        },
        // 0代表不会进行超时处理
        timeout: 0,
        // 是否将数据序列化成字符串
        processData: true,
        // 为true是，GET请求会自动进行缓存
        cache: true,
        // 为true时，会自动给请求加上  X-Requested-With 头部
        xRequestedWith: false,
        // 延迟请求，默认为0
        delay: 0,
        // 是否对原始的返回数据进行过滤处理
        // 可以传用户自定义的函数，处理最返回的 response 数据
        dataFilter: noop
    };

    /**
     * 正式开始ajax时，会回调一次，
     * 如果用户实现了这个函数，并且返回false，则会终止ajax
     * @param {Object} xhr 
     * @param {Object} settings 
     */
    var ajaxBeforeSend = function(xhr, settings) {
        if (settings.beforeSend.call(settings.context, xhr, settings) === false) {
            return false;
        }
    };

    /**
     * ajax成功会走入的回调
     * @param {Object} data 最终的数据
     * @param {Object} xhr 
     * @param {Object} settings 
     */
    var ajaxSuccess = function(data, xhr, settings, resolve, reject) {
        var context = settings.context,
            status = 'success';
        settings.success && settings.success.call(context, data);
        // call传一个数组其实只是一个参数 因为promise只会接收一个参数，apply数组才是多个参数
        resolve && resolve.call(context, data);
        ajaxComplete('success', xhr, settings);
    };

    /**
     * ajax错误会走入的回调
     * @param {String} error 错误提示文字
     * @param {String} type "timeout", "error", "abort", "parsererror"
     * @param {Object} xhr 完整的xhr
     * @param {Object} settings 当前的设置
     */
    var ajaxError = function(error, type, xhr, settings, resolve, reject) {
        var context = settings.context;
        var errorObj = {
            xhr: xhr,
            type: type,
            error: error
        }
        settings.error && settings.error.call(context, errorObj);
        reject && reject.call(context, errorObj);
        ajaxComplete(type, xhr, settings);
    };

    /**
     * 不管是成功还是失败，都会走这个回调
     * @param {String} status "success", "notmodified", "error", "timeout", "abort", "parsererror"
     * @param {Object} xhr 
     * @param {Object} settings 
     */
    var ajaxComplete = function(status, xhr, settings) {
        settings.complete.call(settings.context, xhr, status);
    };

    /**
     * ajax的数据过滤器，用来方便统一处理数据
     * @param {Object} data
     * @param {String} dataType 请求的数据类型
     * @param {Object} settings
     */
    var ajaxDataFilter = function(data, dataType, settings, resolve, reject) {
        if (settings.dataFilter == noop) {
            return data;
        }
        var context = settings.context
        return settings.dataFilter.call(context, data, dataType, resolve, reject);
    };

    /**
     * 将数据添加url中
     * @param {String} url
     * @param {String} query
     */
    var appendQuery = function(url, query) {
        if (query === '') {
            return url;
        }
        // 很聪明的正则替换
        return (url + '&' + query).replace(/[&?]{1,2}/, '?');
    };
    /**
     * 序列化参数，如果是object，会递归
     * 序列化成
     * params[guid]:12345
     * 这种格式
     * @param {Object} params
     * @param {Object} obj
     * @param {Object} traditional 一般不开启，如果开启，则序列化方式会很奇怪
     * @param {Object} scope
     */
    var serialize = function(params, obj, traditional, scope) {
        var type, array = $isArray(obj),
            hash = $isPlainObject(obj);
        $each(obj, function(key, value) {
            type = $type(value);
            if (scope) {
                key = traditional ? scope :
                    scope + '[' + (hash || type === 'object' || type === 'array' ? key : '') + ']';
            }
            // handle data in serializeArray() format
            if (!scope && array) {
                params.add(value.name, value.value);
            }
            // recurse into nested objects
            else if (type === "array" || (!traditional && type === "object")) {
                serialize(params, value, traditional, key);
            } else {
                params.add(key, value);
            }
        });
    };
    /**
     * 讲一个对象数据序列化成 form 形式
     * 这里会构建一个param对象 然后开始序列化
     * @param {Object} obj
     * @param {Object} traditional
     */
    var param = function(obj, traditional) {
        var params = [];
        params.add = function(k, v) {
            this.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
        };
        serialize(params, obj, traditional);
        return params.join('&').replace(/%20/g, '+');
    };
    /**
     * 序列化ajax的数据
     * 这里面要分别处理 普通的ajax数据以及文件数据
     * @param {Object} settings
     */
    var serializeData = function(settings) {
        if (settings.processData && settings.data && typeof settings.data !== "string") {
            var contentType = settings.contentType;
            if (!contentType && settings.headers) {
                contentType = settings.headers['Content-Type'];
            }
            if (contentType && ~contentType.indexOf(jsonType)) {
                // application/json
                settings.data = JSON.stringify(settings.data);
            } else {
                // 非 application/json形式，需要form表单序列化
                settings.data = param(settings.data, settings.traditional);
            }
        }
        if (settings.data && (!settings.type || settings.type.toUpperCase() === 'GET')) {
            // GET方式，拼接url
            settings.url = appendQuery(settings.url, settings.data);
            settings.data = undefined;
        }
    };

    /**
     * 将 MIME 转为 dataType 方便成功请求时处理数据
     * 基本顺序是  settings 的
     * dataType  mimeType getResponseHeader中的content-type
     * @param {Object} mime
     */
    var mimeToDataType = function(mime) {
        if (mime) {
            mime = mime.split(';', 2)[0];
        }
        return mime && (mime === htmlType ? 'html' :
            mime === jsonType ? 'json' :
            scriptTypeRE.test(mime) ? 'script' :
            xmlTypeRE.test(mime) && 'xml') || 'text';
    };

    /**
     * 处理ajax的头部设置，过长，所以就抽取出来了
     * @param {Object} xhr
     * @param {Object} settings
     * @param {String} dataType
     */
    var dealAjaxHeaders = function(xhr, settings, dataType) {
        if (settings.cache === false || ((!settings || settings.cache !== true) && ('script' === dataType))) {
            settings.url = appendQuery(settings.url, '_=' + now());
        }

        // 处理头部
        var mime = settings.accepts[dataType && dataType.toLowerCase()];
        var headers = {};
        var setHeader = function(name, value) {
            headers[name.toLowerCase()] = [name, value];
        };

        // 正式设置头部的 Accept
        setHeader('Accept', mime || '*/*');

        // 这个头部可以通过配置项选择是否配置
        if (settings.xRequestedWith) {
            setHeader('X-Requested-With', 'XMLHttpRequest');
        }

        // 如果 MIME 存在，重写它
        if (!!(mime = settings.mimeType || mime)) {
            if (mime.indexOf(',') > -1) {
                mime = mime.split(',', 2)[0];
            }
            xhr.overrideMimeType && xhr.overrideMimeType(mime);
        }

        // Content-Type 的设置，为false时是不会设置的
        if ((settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() !== 'GET'))) {
            setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded');
        }

        // 头部的设置
        if (settings.headers) {
            for (var name in settings.headers) {
                setHeader(name, settings.headers[name]);
            }
        }
        xhr.setRequestHeader = setHeader;

        return headers;
    };

    var ajax = function(options) {
        var Promise = window.Promise;

        var func = function(resolve, reject) {
            var settings = $extend(true, {}, defaultSetting, options);

            // 防止被覆盖时出问题
            settings.error = settings.error || noop;

            // 序列化数据，包括普通数据以及文件数据都会序列化
            serializeData(settings);

            // 检查 url的 protocol
            var protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol;
            var xhr = settings.xhr(settings);
            var nativeSetHeader = xhr.setRequestHeader;
            var abortTimeout;
            var dataType = settings.dataType;

            // 处理ajax的 headers contenttype mime 等设置
            var headers = dealAjaxHeaders(xhr, settings, dataType);

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    xhr.onreadystatechange = noop;
                    clearTimeout(abortTimeout);
                    var result, error = false;
                    var isLocal = protocol === 'file:';
                    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || (xhr.status == 0 && isLocal && xhr.responseText)) {
                        dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'));

                        dataType = dataType.toLowerCase();

                        if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob') {
                            result = xhr.response
                        } else {
                            result = xhr.responseText;
                        }

                        try {
                            result = ajaxDataFilter(result, dataType, settings, resolve, reject);
                            if (dataType === 'script') {
                                (1, eval)(result);
                            } else if (dataType === 'xml') {
                                result = xhr.responseXML;
                            } else if (dataType === 'json' && typeof result === 'string') {
                                result = blankRE.test(result) ? null : JSON.parse(result);
                            }
                        } catch (e) {
                            error = e;
                        }
                        if (error) {
                            ajaxError(error, 'parsererror', xhr, settings, resolve, reject);
                        } else {
                            ajaxSuccess(result, xhr, settings, resolve, reject);
                        }
                    } else {
                        // 终止或失败都可能进入
                        var status = xhr.status ? 'error' : 'abort';
                        var statusText = xhr.statusText || null;
                        if (isLocal) {
                            status = 'error';
                            statusText = '404';
                        }
                        ajaxError(statusText, status, xhr, settings, resolve, reject);
                    }
                }
            };
            
            if (settings.extendHook) {
                // 如果存在拓展的 Hook程序，比如用来拓展 upload
                for (var key in settings.extendHook) {
                    var item = settings.extendHook[key];
                    item && item(xhr, settings);
                }
            }
            
            if (ajaxBeforeSend(xhr, settings) === false) {
                xhr.abort();
                ajaxError('before send error', 'abort', xhr, settings, resolve, reject);
                return xhr;
            }

            // 额外的xhr配置
            if (settings.xhrFields) {
                for (var name in settings.xhrFields) {
                    xhr[name] = settings.xhrFields[name];
                }
            }
            // 是否异步，默认为true
            var async = 'async' in settings ? settings.async : true;

            xhr.open(settings.type.toUpperCase(), settings.url, async, settings.username, settings.password);

            // 处理超时请求
            if (settings.timeout > 0) {
                abortTimeout = setTimeout(function() {
                    xhr.onreadystatechange = noop;
                    // 请求超时中止
                    xhr.abort();
                    ajaxError('请求超时，自动终止', 'timeout', xhr, settings, resolve, reject);
                }, settings.timeout);
            }

            // 头部设置，这时候将设置好的头部真正的添加到 xhr中
            for (var name in headers) {
                if (headers.hasOwnProperty(name)) {
                    nativeSetHeader.apply(xhr, headers[name]);
                }
            }

            setTimeout(function() {
                xhr.send(settings.data ? settings.data : null);
            }, settings.delay);
            
            return xhr;
        };

        return Promise && new Promise(func) || (func.call(this));
    };

    ajax.serialize = serialize;

    exports.ajax = ajax;

})(Util);