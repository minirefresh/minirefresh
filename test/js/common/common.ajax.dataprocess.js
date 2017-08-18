/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/13 
 * 版本: [1.0, 2017/06/13 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 统一前端框架
 * 对 ajax的一次二次业务封装，方便使用，主要是进行了一次返回数据的自定义路径处理
 * 目前针对ajax和upload都可以进行
 */
(function(exports) {
    var defaultSetting = {
        dataPath: null,
        delay: 0
    };
    var oldAjax = exports.ajax;
    var oldUpload = exports.upload;

    /**
     * 将对象代理，增加一个dataFilter方法
     * 代理时 对外不允许改变内部的 deferred模块
     * @param {Object} oldObj 例如ajax或者upload
     */
    function proxy(oldObj) {
        return function(options) {
            var newOptions = exports.extend({}, defaultSetting, options);

            // 兼容requestData这种统一的API调用
            newOptions.data = newOptions.data || newOptions.dataRequest;

            // 数据处理
            newOptions.dataFilter = function(response, dataType, resolve, reject) {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    return response;
                }
                // 永远不要试图修改arguments，请单独备份，否则在严格模式和非严格模式下容易出现错误
                var args = [].slice.call(arguments);

                var result = exports.dataProcess(response, {
                    isDebug: true,
                    dataPath: newOptions.dataPath
                });

                if (result.code == 0) {
                    // 错误回调，抛出错误即可，内部或捕获
                    throw new Error(JSON.stringify(result));
                } else {
                    return result;
                }

            };

            // 默认的错误回调
            var errorFun = function(error) {
                console.error('请求错误，详情:');
                console.error(error);
                // 如果自己抛出去的错误存在信息
                var errorMsg = error.type;

                if (error.error && error.error.message) {
                    try {
                        error.error.message = JSON.parse(error.error.message);
                        errorMsg = error.error.message.message;
                    } catch (e) {}
                }

                exports.ejs.ui.toast(errorMsg);
            };

            // 链式调用中没有默认回调
            if (newOptions.error === undefined) {
                newOptions.error = errorFun;
            }

            return oldObj(newOptions);
        };
    }

    exports.ajax = proxy(oldAjax);
    exports.upload = proxy(oldUpload);

})(Util);