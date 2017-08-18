/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/16
 * 版本: [1.0, 2017/06/16 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 作为dataProcess的一个插拔式功能
 * 通过指定路径(v6格式下)，来获取对应的数据
 */

(function(exports) {

    /**
     * 通过指定路径，来获取对应的数据
     * 如果不符合数据要求的，请返回null，这样就会进入下一个函数处理了
     * @param {JSON} response 接口返回的数据
     * @param {String} path 一个自定义路径，以点分割，用来找数据
     * @param {JSON} returnValue 返回数据
     * 1:返回列表
     * 其它:返回详情
     * @return {JSON} 返回的数据,包括多个成功数据,错误提示等等
     * */
    function handleDataByPathV6(response, path, returnValue) {
        if (!(path && response && response.ReturnInfo && response.BusinessInfo)) {
            return null;
        }
        var debugInfo = {
            type: 'v6数据格式:' + path
        };
        var returnInfo = response.ReturnInfo,
            businessInfo = response.BusinessInfo,
            userArea = response.UserArea;

        if (returnInfo.Code == '1') {
            if (businessInfo.Code == '1') {
                returnValue.code = 1;
                
                var data = exports.getNameSpaceObj(response, path);

                if (data) {
                    returnValue.data = data;
                } else {
                    returnValue.message = returnValue.message || '指定路径下没有找到数据';
                    returnValue.data = null;
                    // 3代表业务数据错误
                    debugInfo.errorType = '3';
                }
            } else {
                // 2代表业务错误
                debugInfo.errorType = '2';
                returnValue.code = 0;
                returnValue.message = businessInfo.Description || '接口请求错误,后台业务逻辑处理出错!';
            }
        } else {
            // v6中的程序错误
            // 1代表程序错误
            debugInfo.errorType = '1';
            returnValue.code = 0;
            returnValue.message = returnInfo.Description || '接口请求错误,后台程序处理出错!';
        }

        returnValue.debugInfo = debugInfo;
        return returnValue;
    }

    exports.dataProcessFn.push(handleDataByPathV6);
})(Util);