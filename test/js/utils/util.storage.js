/**
 * 作者: 戴荔春
 * 创建时间: 2017/07/11
 * 版本: [1.0, 2017/07/11 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: localStorage操作相关，二次封装可以处理一些错误
 */
(function() {
    "use strict";

    var innerUtil = {
        /**
         * setStorage,存入相应的键值
         * @param {String} id 存入的key值
         * @param {Object} data 存入的值,可以为字符串或者是JSON对象
         */
        setItem: function(id, data) {
            data = data || '';
            if (typeof(data) === 'object') {
                data = JSON.stringify(data);
            }
            try {
                localStorage.setItem(id, data);
            } catch (msg) {
                if (msg.name == 'QuotaExceededError') {
                    console.error('超出本地存储限额，建议先清除一些无用空间！更多信息:' + JSON.stringify(msg));
                } else {
                    console.error('localStorage存储值出错:' + id + ',' + JSON.stringify(msg));
                }
            }
        },
        /**
         * getStorage,得到相应的键值
         * @param {String} id key值
         * @param {Boolean} isJson 是否是JSON,默认为true,
         * 如果选择否,则返回普通字符串,否则转换为JSON后再返回
         * @return {String||JSON} 得到的是缓存的字符串数据或JSON数据
         */
        getItem: function(id, isJson) {
            isJson = typeof(isJson) == 'boolean' ? isJson : true;

            var items = null;

            try {
                items = localStorage.getItem(id);
            } catch (msg) {
                console.error('localStorage获取值出错:' + id + ',' + JSON.stringify(msg));
            }
            if (items != null && isJson) {
                try {
                    items = JSON.parse(items);
                } catch (e) {}
                items = items || {};
            }
            return items;
        },
        /**
         * 移除对应的StorageItem
         * @param {String} id key值
         */
        removeItem: function(id) {
            if (id != null && id != '') {
                try {
                    localStorage.removeItem(id);
                } catch (e) {
                    console.error('localStorage删除值出错:' + id + ',' + JSON.stringify(msg));
                }
            }
        },
        /**
         * 清除所有的Storage的缓存(慎用,使用后所有的缓存都没了)
         */
        clear: function() {
            try {
                localStorage.clear();
            } catch (e) {
                console.error('localStorage清空时出错:' + ',' + JSON.stringify(msg));
            }
        },
        /**
         * 判断一个 key 字符串匹配一个正则数组
         * @param {Object} regs 必须是正则表达式或者数组
         * @param {Object} key
         */
        _isMatch: function(regs, key) {
            if (!regs || !key) {
                return false;
            }

            if (!Array.isArray(regs)) {
                regs = [regs];
            }

            var len = regs.length;

            for (var i = 0; i < len; i++) {
                if (regs[i].test(key)) {
                    return true;
                }
            }

            return false;
        },
        /**
         * 遍历所有的localstorage
         */
        each: function(callback, options) {
            options = options || {};

            for (var i = localStorage.length - 1; i >= 0; i--) {
                var key = localStorage.key(i)
                if　 ((options.include && !innerUtil._isMatch(options.include, key)) ||
                    (options.exclude && innerUtil._isMatch(options.exclude, key))) {
                    // 如果被过滤了或被排除了
                    continue;
                }
                callback && callback(key, innerUtil.getItem(key, options.isJson));
            }
        }
    };

    Util.storage = innerUtil;
})();