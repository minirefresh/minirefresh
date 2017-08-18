/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/22
 * 版本: [1.0, 2017/06/22 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 页面或者项目根路径的处理相关
 * 直接复用cssboot中的配置，但是需要注意内部的this指针
 * 慎用 this，所以 cssboot内部都没有用 this了
 */

(function(exports) {
    /**
     * 得到一个项目的根路径,只适用于混合开发
     * h5模式下例如:http://id:端口/项目名/
     * @param {String} 项目需要读取的基本目录
     * @return {String} 项目的根路径
     */
    exports.getProjectBasePath = SrcBoot.getProjectBasePath;
    /**
     * 得到一个全路径
     * @param {String} path
     */
    exports.getFullPath = SrcBoot.getFullPath;
    /**
     * 根据config中的开发态和部署态
     * 切换对应的path
     * 如部署态非排除目录下的文件切换为.min文件
     * @param {String} path
     * @return 返回转换后的路径
     */
    exports.changePathByConfig = SrcBoot.changePathByConfig;
    /**
     * 得到文件的后缀
     * @param {String} path
     */
    exports.getPathSuffix = SrcBoot.getPathSuffix;
    /**
     * 将json参数拼接到url中
     * @param {String} url
     * @param {Object} data
     * @return {String} 返回最终的url
     */
    exports.getFullUrlByParams = function(url, jsonObj) {
        url = url || '';
        url = exports.getFullPath(url);
        // 将jsonObj拼接到url上
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
    };
    
})(Util);