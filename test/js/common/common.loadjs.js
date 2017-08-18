/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/22
 * 版本: [1.0, 2017/06/22 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 动态加载文件相关
 */

(function(exports) {
    /**
     * 使用cssboot中暴露出来的时间戳，如果没有，先勉强采用默认值
     */
    var defaultStamp = '_t=20170523';
    var TIME_STAMP = window.Config ? (window.Config.TIME_STAMP || defaultStamp) : defaultStamp;

    /**
     * 动态引入文件-如引入css或js
     * 目前是采用并联+递归的方式加载，串联看似用不上，但依然保留这个方法
     * @param {Array||String} pathArray 路径，一个数组-用来并联加载，或者字符串用来串联加载
     * 会将这个参数中的不同子数组之间进行串联加载，同一个子数组之间进行并联加载
     * -串联加载一般用到前后依赖性较强的对方
     * -并联加载更快
     * @param {Function} callback 成功加载后的回调
     * @example 调用方式前面的路径可以是无限多的，例如
     * path1,path2,...,pathn,callback
     */
    exports.loadJs = function() {

        // 递归调用，可以依次获取
        loadJsRecurse.apply(this, arguments);

    };

    /**
     * 递归加载脚本
     * 参数中分别是
     * path1,...,pathn,callback
     * 需要依次取出并进行加载
     */
    function loadJsRecurse() {

        // 永远不要试图修改arguments，请单独备份
        var args = [].slice.call(arguments);
        if (typeof args[0] === 'function') {
            // 如果已经加载到最后一个了，并且是回调
            args[0]();
        } else if (args[0] == null) {
            // 如果已经加载到最后一个了，但是没有回调，什么都不做
            return;
        } else {
            var self = this;
            if (Array.isArray(args[0]) || exports.getPathSuffix(args[0]) == 'js') {
                // js则链式回调
                // 并联加载当前元素-可能是一个，也可能是数组
                parallelLoadFiles(args[0], function() {
                    // 需要去除当前已经加载完毕的参数
                    loadJsRecurse.apply(self, args.slice(1));
                });
            } else {
                // 其它如css则直接加载，不管回调
                parallelLoadFiles(args[0]);
                loadJsRecurse.apply(self, args.slice(1));
            }

        }
    }

    /**
     * 并联加载指定的脚本,css
     * 并联加载[同步]同时加载，不管上个是否加载完成，直接加载全部
     * 全部加载完成后执行回调
     * @param array|string 指定的脚本们
     * @param function 成功后回调的函数
     * @return array 所有生成的脚本元素对象数组
     */

    function parallelLoadFiles(scripts, callback) {
        if (typeof(scripts) != "object") {
            scripts = [scripts];
        }
        if (scripts[0] === undefined) {
            // 过滤空数组
            callback && callback();
        }
        var HEAD = document.getElementsByTagName("head").item(0) || document.documentElement,
            s = new Array(),
            loaded = 0,
            fragment = document.createDocumentFragment();
        for (var i = 0; i < scripts.length; i++) {
            var path = scripts[i];

            if (!path) {
                loaded++;
                continue;
            }
            path = exports.changePathByConfig(path);
            path = exports.getFullPath(path);

            var suffix = exports.getPathSuffix(path);
            path += ('?' + TIME_STAMP);
            if (suffix == 'js') {
                // js
                s[i] = document.createElement("script");
                s[i].setAttribute("type", "text/javascript");
            } else {
                // css
                s[i] = document.createElement("link");
                s[i].setAttribute("type", "text/css");
                s[i].setAttribute("rel", "stylesheet");
            }
            s[i].suffix = suffix;
            // css在某些版本的浏览器中不会触发onreadystatechange,所以直接默认css已经加载好
            if (suffix.toLowerCase() === 'css') {
                // 判断时默认css加载完毕,因为css并不会影响程序操作
                loaded++;
            } else if (suffix.toLowerCase() === 'js') {
                // 只有js才监听onload和onerror
                s[i].onload = s[i].onreadystatechange = function() { //Attach handlers for all browsers
                    if (! /*@cc_on!@*/ 0 || this.readyState == "loaded" || this.readyState == "complete") {
                        loaded++;
                        this.onload = this.onreadystatechange = null;
                        if (this.suffix === 'js') {
                            // 只移除脚本,css如果移除就没效果了
                            // 暂时不移除脚本,移除了无法进行判断
                            // this.parentNode.removeChild(this);
                        }
                        if (loaded == scripts.length && typeof(callback) == "function") {
                            callback();
                        }
                    }
                };
                s[i].onerror = function() {
                    console.error("加载js文件出错,路径:" + this.getAttribute('src'));
                    // 加载出错也要继续加载其它文件
                    loaded++;
                    if (loaded == scripts.length && typeof(callback) == "function") {
                        callback();
                    }
                };
            }

            // 这里设置两边charset 是因为有时候charset设置前面会有bug
            // 目前设置到后面
            // s[i].charset = 'UTF-8';
            //s[i].setAttribute('async', true);
            if (suffix == 'js') {
                s[i].setAttribute("src", path);
            } else {
                s[i].setAttribute("href", path);
            }
            s[i].charset = 'UTF-8';
            fragment.appendChild(s[i]);           
        }
        HEAD.appendChild(fragment);
    }
    /**
     * 移动已经加载过的js/css
     * @param {String} filename
     * @param {String} filetype
     */
    function removejscssfile(filename, filetype) {
        var targetelement = (filetype == "js") ? "script" : (filetype == "css") ? "link" : "none"
        var targetattr = (filetype == "js") ? "src" : (filetype == "css") ? "href" : "none"
        var allsuspects = document.getElementsByTagName(targetelement)
        for (var i = allsuspects.length; i >= 0; i--) {
            if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr).indexOf(filename) != -1)
                allsuspects[i].parentNode.removeChild(allsuspects[i])
        }
    }
    /**
     * 移除css或者js
     * @param {String} fileName 文件名
     * 例如 mui.min.css  mui.min.js
     */
    exports.removeFile = function(fileName) {
        if (!fileName) {
            return;
        }
        // 后缀-默认为js
        var dotIndex = fileName.lastIndexOf(".");
        var suffix = fileName.substring(dotIndex + 1, fileName.length) || 'js';
        var name = fileName.substring(0, dotIndex);
        removejscssfile(name, suffix);
    };
})(Util);