/**
 * 作者: 戴荔春
 * 创建时间: 2017/07/05
 * 版本: [1.0, 2017/07/05 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 对于一些ejs api的内部兼容
 * 主要是为了屏蔽ejs 2.x 和 3.x对框架的影响
 * 依赖了ejs 2.x和 3.x中的任意一个库
 * 只实现了部分API
 * 调用方法是  3.x 的API调用，兼容了2.x
 */

(function(exports) {

    /**
     * 区别 3.x 和 2.x
     */
    var isV3 = Config.ejsVer === 3;

    /**
     * 内部的一些ejs兼容模块
     * 主要是ui显示相关
     */
    var innerEjs = {
        ui: {
            toast: function(options) {
                if (isV3) {
                    ejs.ui.toast(options)
                } else {
                    ejs.nativeUI.toast(options);
                }
            },
            // alert的调用可能有兼容
            alert: function() {
                var args = [].slice.call(arguments);

                if (isV3) {
                    ejs.ui.alert.apply(null, args);
                } else {
                    // 如果第一个就是 options
                    if (typeof args[0] == 'object') {
                        args[1] = arg[0].success;
                    }
                    ejs.nativeUI.alert.apply(null, args);
                }
            },
            confirm: function(options) {
                options = options || {};
                if (isV3) {
                    ejs.ui.confirm(options);
                } else {
                    if (options.buttonLabels) {
                        options.btn1 = options.buttonLabels[0];
                        options.btn2 = options.buttonLabels[1];
                    }
                    ejs.nativeUI.confirm(options, function(result) {
                        result.which = -1 * (result.which + 1) || 0;
                        options.success && options.success(result);
                    });
                }
            },
            showWaiting: function(options) {
                options = options || {};
                if (isV3) {
                    ejs.ui.showWaiting(options);
                } else {
                    ejs.nativeUI.showWaiting(options, options.success);
                }
            },
            closeWaiting: function(options) {
                options = options || {};
                if (isV3) {
                    ejs.ui.closeWaiting(options);
                } else {
                    ejs.nativeUI.closeWaiting(options, options.success);
                }
            }
        },
        page: {
            open: function(options) {
                if (isV3) {
                    ejs.page.open.apply(null, arguments);
                } else {
                    // V2情况下需要兼容处理下参数
                    var args = [].slice.call(arguments);
                    if (typeof options === 'object') {
                        // 只有标准调用才兼容，快速调用 2.x本身支持
                        args[0] = options.pageUrl;
                        args[1] = options.pageTitle;
                        args[2] = options.data;
                        // options暂时不支持配置
                        args[3] = {};
                        // 回调
                        args[4] = options.success;
                        args[5] = options.error;
                    } else {
                        // 快速调用需要处理第2个参数，V3中没有title的，所以title默认为空
                        args[2] = args[1];
                        args[1] = '';
                    }
                    ejs.page.openPage.apply(null, args);
                }
            }
        }

    };

    exports.ejs = innerEjs;

})(Util);