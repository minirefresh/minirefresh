/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/23
 * 版本: [1.0, 2017/05/23 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: cssboot，用来初始化加载css
 */
"use strict";

/**
 * 全局config命名空间
 */
(function(exports) {
    /**
     * 开发态和部署态的切换
     * 1为开发态，0为部署态
     * 开发态时自动引入源文件
     * 部署态时，除了排除的目录，其它目录都会自动将文件引用切换为.min后缀的压缩文件
     */
    exports.isDebug = 1;

    /**
     * 是否开启 调试面板， 开启可以在移动端捕获log
     * 仅在debug模式下有效
     */
    exports.isDebugPanel = 0;

    /**
     * 时间戳
     */

    exports.TIME_STAMP = '_=' + (exports.isDebug ? '20170706' : '20170607');

    /**
     * 开发环境常量，分别为：h5（wechat）、ejs、dingtalk
     */
    var ENV_H5 = 'h5',
        // ejs 环境
        ENV_EJS = 'ejs',
        // dingtalk 环境
        ENV_DD = 'dd',
        // 同时支持ejs与h5
        ENV_EJS_H5 = 'ejs_h5',
        // 同时支持dd与h5
        ENV_DD_H5 = 'dd_h5',
        // 会引入h5、dd和native全部的库
        ENV_ALL = 'ejs_dd_h5';

    exports.env = ENV_EJS_H5;

    /**
     * 当前框架使用的ejs版本
     * 2 代表 2.x 版本的 ejs
     * 3 代表 3.x
     */
    exports.ejsVer = 2;

    /**
     * 需要排除的目录或者文件数组，文件请以.css或者.js结尾，否则会默认认为是目录
     * 被排除的目录在发布态下不会切换为.min
     * 会根据引入的实际路径计算，并且或默认排除网络路径
     */
    exports.exclude = [
        /js\/_dist\//,
        /js\/libs/,
        // 可以是 showcase/ 或 showcasexxx/ 但不能是 showcase//
        /showcase[^\/]*/,
        /test[^\/]*/
    ];

    /**
     * commondto的配置
     * 用于适配基于f9的业务action
     */
    var comdto = {
        // 是否使用配置，使用的话使用配置里的rootUrl，否则使用f9默认的
        isUseConfig: true,
        isRestFul: true,
        rootUrl: './',
        isMock: true,   //是否模拟数据
        requestMethod: ''   // ajax请求方式，'post'/'get'
    };

    if (comdto.isRestFul) {
        comdto.rootUrl += 'rest/';
    }

    // comdto通过配置项决定是否自动引入
    exports.isComdto = 0;
    exports.comdto = comdto;


    /**
     * 业务相关的配置
     */
    var bizlogic = {
        // 是否是正式
        isFormal: true,
        // 正式的接口地址
        serverUrlFormal: '//115.29.151.25:8012/',
        // 测试的接口地址
        serverUrlTest: '//192.168.114.35:8016/webUploaderServer/'
    };

    exports.serverUrl = bizlogic.isFormal ? bizlogic.serverUrlFormal : bizlogic.serverUrlTest;
    
    /**
     * token相关配置，包括
     * 在H5环境下会进行token兼容
     * EJS环境下仍然是容器的token
     * ajax的token自动注入
     */
    exports.token = {
        // 是否在ajax时自动发送token，会根据不同的规则进行不同处理
        // 也可以选择0，自行进行token设置
        isAutoSend: 1,
        // request_head request_body request_body_pairs
        // 各自发送类别请参考文档
        sendType: 'request_body',
        // token的过期时间，防止页面的token过期，单位为秒
        // H5下动态获取时才会有缓存
        duration: 7200,
        // token的键，比如 access_token，自动注入时有效
        name: 'token', 
        // 可以是字符串，也可以是方法
        // 字符串的话直接可以使用，函数的话 通过success回调返回
        // 只是H5下有效，ejs下默认就是容器的token，不容改变
        getToken: function(success) {
            success('RXBvaW50X1dlYlNlcml2Y2VfKiojIzA2MDE=');
        }
    };
    
    /**
     * 设置在非EJS容器环境下
     * EJS的配置项的一些默认值，存在localStorage中
     * 通过ejs.storage.getItem获取的
     * 用来方便开发
     */
    exports.webEjsEnvStore = {
        MOA_KEY_OUName: "移动研发部"
    };

    if (!exports.isDebug) {
        // 关闭log
        //console.log = function() {};
    }

})(this && (this.Config = {}) || (global.Config = {}));

(function(exports) {

    var TIME_STAMP = exports.Config.TIME_STAMP;

    /**
     * 文件写入
     */
    var SrcBoot = {
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
            // h5
            var contextPath = '';
            // 兼容pages
            // 普通浏览器
            contextPath = patehName.substr(0, patehName.lastIndexOf(reg) + 1);
            // 暂时放一个兼容列表，兼容一些固定的目录获取
            var pathCompatibles = ['/html/', '/showcase/', '/showcase_pending/', '/runnner/', '/test/', '/'];

            for (var i = 0, len = pathCompatibles.length; i < len && (!contextPath || contextPath === '/'); i++) {
                var regI = pathCompatibles[i];
                // 这种获取路径的方法有一个要求,那就是所有的html必须在regI文件夹中,并且regI文件夹中不允许再出现regI目录
                contextPath = patehName.substr(0, patehName.lastIndexOf(regI) + 1);

                if (regI == '/') {
                    // 最后的根目录单独算
                    var path = patehName;
                    if (/^\//.test(path)) {
                        // 如果是/开头
                        path = path.substring(1);
                    }
                    contextPath = '/' + path.split('/')[0] + '/';
                }
            }
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
         * @return 返回全路径
         */
        getFullPath: function(path) {
            // 全路径
            if (/^(http|https|ftp|\/\/)/g.test(path)) {
                return path;
            }
            // 是否是相对路径
            var isRelative = /^(\.\/|\.\.\/)/.test(path);
            // 非相对路径，页面路径默认从html目录开始
            path = (isRelative ? path : ((SrcBoot.getProjectBasePath()) + path));
            return path;
        },
        /**
         * 根据config中的开发态和部署态
         * 切换对应的path
         * 如部署态非排除目录下的文件切换为.min文件
         * @param {String} path
         * @return 返回转换后的路径
         */
        changePathByConfig: function(path) {
            if (Config.isDebug || !path || /\.min\./.test(path) || /^(http|https|ftp|\/\/)/g.test(path)) {
                return path;
            }
            // 考虑相对路径的存在
            var isRelative = /^(\.\/|\.\.\/)/.test(path);

            // 转为绝对路径，方便判断
            if (isRelative) {
                path = SrcBoot.changeRelativePathToAbsolute(path);
            } else {
                path = SrcBoot.getFullPath(path);
            }
            // 排除目录
            var exclude = Config.exclude;
            // 默认就用indexOf去判断了
            for (var i = 0, len = exclude.length; i < len; i++) {
                if (exclude[i].test(path)) {
                    return path;
                }
            }
            // 替换.min
            var suffix = SrcBoot.getPathSuffix(path);
            path = path.replace('.' + suffix, '');
            path += '.min.' + suffix;
            return path;
        },
        /**
         * 得到文件的后缀
         * @param {String} path
         * @return 返回后缀
         */
        getPathSuffix: function(path) {
            var dotPos = path.lastIndexOf('.'),
                suffix = path.substring(dotPos + 1);
            return suffix;
        },
        /**
         * 批量输出css|js
         * @param {Array} arr
         */
        output: function(arr) {
            var i = 0,
                len = arr.length,
                path,
                ext;

            for (; i < len; i++) {
                path = arr[i];
                if (!path) {
                    continue;
                }

                path = SrcBoot.changePathByConfig(path);
                path = SrcBoot.getFullPath(path);

                ext = SrcBoot.getPathSuffix(path);

                // 统一加上时间戳缓存
                if (path.indexOf('?') === -1) {
                    // 没有?,加上？
                    path += '?';
                } else {
                    // 有了?,加上&
                    path += '&';
                }
                path += TIME_STAMP;

                if (ext == 'js') {
                    document.writeln('<script src="' + path + '"></sc' + 'ript>');
                } else {
                    document.writeln('<link rel="stylesheet" href="' + path + '">');
                }
            }
        },
    };

    exports.SrcBoot = SrcBoot;

})(this || global);

var paths = [
    // 写入每个页面必备的css文件
    'js/mui/mui.css',
    'js/mui/mui.extend.css',
];

if (typeof Config != 'undefined') {
    var arr = [];

    if (Config.isDebug) {
        arr = paths;
    } else {
        // 正式模式下的，比较简单
        arr.push('js/_dist/core.min.css');
    }

    // 可以在这加入项目自定义的全局css

    SrcBoot.output(arr);
}

if (typeof module != 'undefined' && module.exports) {
    // 暴露给gulpfile自动构建
    module.exports = {
        paths: paths
    };
}
