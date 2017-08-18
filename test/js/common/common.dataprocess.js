/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/22
 * 版本: [1.0, 2017/06/22 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 处理通用数据
 */

(function(exports) {
    // 处理数据的函数池
    exports.dataProcessFn = [];

    /**
     * 统一处理返回数据,返回数据必须符合标准才行,否则会返回错误提示
     * @param {JSON} response 接口返回的数据
     * @param {Object} options 配置信息，包括
     * dataPath 手动指定处理数据的路径，遇到一些其它数据格式可以手动指定
     * 可以传入数组，传入数组代表回一次找path，直到找到为止或者一直到最后都没找到
     * isDebug 是否是调试模式，调试模式会返回一个debugInfo节点包含着原数据
     * 其它:无法处理的数据,会返回对应错误信息
     * @return {JSON} 返回的数据,包括多个成功数据,错误提示等等
     */
    exports.dataProcess = function(response, options) {
        options = options || {};       

        // 永远不要试图修改arguments，请单独备份，否则在严格模式和非严格模式下容易出现错误
        var args = [].slice.call(arguments);
        var result = {
            // code默认为0代表失败，1为成功
            code: 0,
            // 描述默认为空
            message: '',
            // 数据默认为空
            data: null,
            // v7接口中的status字段，放在第一层方便判断
            status: 0,
            // 一些数据详情,可以协助调试用
            debugInfo: {
                type: '未知数据格式'
            }
        };
        
        if (options.dataPath == null) {
            // 不需要处理
            
            return response;
        }
        
        if (typeof options.dataPath === 'string') {
            options.dataPath = [options.dataPath];
        }
        
        
        // 默认为详情
        var isDebug = options.isDebug || false,
            paths = options.dataPath,
            processFns = exports.dataProcessFn,
            len = processFns.length,
            num = paths.length,
            isFound = false;

        if (!response) {
            result.message = '接口返回数据为空!';
            return result;
        }
        // 添加一个result，将返回接口给子函数
        args.push(result);
        for (var k = 0; !isFound && k < num; k++) {
            // 每次动态修改path参数
            args[1] = paths[k];

            for (var i = 0; !isFound && i < len; i++) {
                var fn = processFns[i];
                var returnValue = fn.apply(this, args);

                if (returnValue != null) {
                    // 找到了或者到了最后一个就退出
                    if (returnValue.code == 1 || k == num - 1) {
                        isFound = true;
                        result = returnValue;
                        break;
                    }
                }
            }
        }

        if (!isFound) {
            // 没有找到数据需要使用默认
            // 如果没有数据处理函数或数据格式不符合任何一个函数的要求
            result.message = '没有数据处理函数或者接口数据返回格式不符合要求!';
            // 装载数据可以调试
            result.debugInfo.data = response;
        }

        // 非null代表已经找到格式了，这个是通过约定越好的
        if (!isDebug) {
            result.debugInfo = undefined;
        }
        return result;
    };
})(Util);