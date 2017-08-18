/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/25
 * 版本: [3.0, 2017/05/25 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: dd的 ui 模块 
 */
(function() {
    ejs.extendModule('ui', [{
        namespace: "alert",
        //必填，只有在特定的os下才会实现，不填则不会实现
        //另外，填了相应的os后，会覆盖原来os下相应的func
        //每一个os下可以有一个相应的api提示
        os: ['dd'],
        defaultParams: {
            title: "",
            message: "",
            buttonName: "确定"
        },
        runCode: function(options, resolve, reject) {
            if (typeof options !== 'object') {
                options = {
                    message: options,
                    title: '',
                    buttonName: '确定'
                };
                // 处理快速调用时的 resolve 与参数关系
                if (typeof arguments[1] === 'string') {
                    options.title = arguments[1];
                    if (typeof arguments[2] === 'string') {
                        options.buttonName = arguments[2];
                        resolve = arguments[3];
                        reject = arguments[4];
                    } else {
                        resolve = arguments[2];
                        reject = arguments[3];
                    }
                }
            } else {
                options.buttonName = options.buttonName;
            }
            
            options.onSuccess = function(result) {
                options.success && options.success(result);
                resolve && resolve(result);
            };
            options.onFail = function(error) {
                options.error && options.error(error);
                reject && reject(error);
            };
            
            dd.device.notification.alert(options);
        }
    }]);
})();