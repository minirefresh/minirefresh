/**
 * 作者: 戴荔春
 * 创建时间: 2017/08/03
 * 版本: [1.0, 2017/08/03 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: ejs token的处理，包括
 * h5下的代理
 * ajax请求时的自动注入
 */

(function(Config) {
    // 每个页面默认只会请求一次token
    var globalToken,
        // token自动过期的定时器
        timer,
        tokenDuration = Config.token.duration || 7200;

    var durationTimer = function() {
        clearTimeout(timer);

        timer = setTimeout(function() {
            globalToken = undefined;
        }, tokenDuration * 1000);
    };
    /**
     * 获取token，通过回调传值
     * @param {Function} success
     * @param {Function} error
     */
    var getTokenH5 = function(success) {
        if (globalToken) {
            success(globalToken);
        } else {
            if (typeof Config.token.getToken === 'string') {
                globalToken = Config.token.getToken;
                success(globalToken);
            } else if (typeof Config.token.getToken === 'function') {
                Config.token.getToken(function(token) {
                    globalToken = token;
                    success(globalToken);
                    durationTimer();
                });
            }
        }

    };

    if (Config.ejsVer == 3) {
        ejs.extendApi('auth', {
            namespace: "getToken",
            os: ['h5'],
            runCode: function(options, resolve, reject) {
                getTokenH5(function(token) {
                    var result = {
                        token: token || ''
                    };
                    options.success && options.success(result);
                    resolve && resolve(result);
                });
            }
        });
    } else if (Config.ejsVer == 2) {
        var oldToken = ejs.oauth.getToken;

        ejs.oauth.getToken = function(callback, defaultValue) {
            if (Util.os.ejs) {
                oldToken.apply(this, arguments);
            } else {
                getTokenH5(function(token) {
                    var result = {
                        token: token || ''
                    };
                    callback && callback(result);
                });
            }
        };
    }

    if (Config.token.isAutoSend) {
        // 如果自动发送，需要截取ajax
        var oldAjax = Util.ajax;

        // 通过不同的规则，对请求的token做不同处理
        var analysisRule = function(options, token) {
            var rule = Config.token.sendType,
                name = Config.token.name,
                data = options.data;

            if (rule === 'request_head') {
                var headers = options.headers || {};

                headers[name] = token;

                options.headers = headers;
            } else if (rule === 'request_body') {

                // 先反解析body字符串，然后再插入字段
                if (typeof data === 'string') {
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        if (Config.isDebug) {
                            console.error("错误，ajax的发送数据不为body字符串，与token解析规则不一样");
                        }
                    }
                }
                if (typeof data === 'object') {
                    data[name] = token;
                    options.data = JSON.stringify(data);
                }
            } else if (rule === 'request_body_pairs') {
                if (typeof data === 'object') {
                    data[name] = token;
                }
            }

            return options;
        };

        // token的缓存已经改成API内部进行了
        var getTokenByCach = function(callback) {

            if (Config.ejsVer === 3) {
                ejs.auth.getToken({
                    success: function(result) {
                        callback(result.token);
                    }
                });
            } else if (Config.ejsVer === 2) {
                ejs.oauth.getToken(function(result) {
                    callback(result.token);
                });
            }
        };

        Util.ajax = function(options) {
            var newPromise = new Promise(function(resolve, reject) {
                var newOptions = Util.extend({}, options);

                getTokenByCach(function(token) {
                    resolve(analysisRule(newOptions, token));
                }, options);

            });

            return newPromise.then(function(val) {
                return oldAjax(val);
            }).catch(function(error) {
                // 目前不实现错误的情况，直接抛出，防止冲突
                throw error;
            });
        };
    }

})(window.Config);