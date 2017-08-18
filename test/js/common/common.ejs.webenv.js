/**
 * 作者: 戴荔春
 * 创建时间: 2017/07/27
 * 版本: [1.0, 2017/07/27 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 对于ejs在 web环境下的兼容
 * 比如代理token
 * 比如设置默认的键值对值
 */

(function() {
    
    /**
     * 默认的一些键值对
     */
    var defaultStore = Config.webEjsEnvStore;
    
    defaultStore && Util.each(defaultStore, function(key, value) {
        key && localStorage.setItem(key, localStorage.getItem(key) || value);
    });

})();