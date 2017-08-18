/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/08
 * 版本: [1.0, 2017/06/08 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 统一js引用的控制，根据是否是debug，不同的系统环境以及不同的ejs版本进行切换
 */
(function() {
    var arr = [];

    var paths = {
        // base层会最先加载，作为框架的基石，base层之后是ejs层再然后才是core层
        base: [
            'js/libs/promise.js', 
            'js/mui/mui.js',
            'js/libs/zepto.min.js',                
            'js/libs/mustache.min.js'
        ],
        // core层会在base层和ejs层加载完毕后再加载
        core: [
            'js/common/common.js',
            'js/common/common.ajax.js',
            'js/common/common.ajax.upload.js',
            // 这个会对 ajax 和 upload都进行一次数据请求的代理
            'js/common/common.ajax.dataprocess.js',
            'js/common/common.clazz.js',
            'js/common/common.dataprocess.js',
            'js/common/common.dataprocess.v6path.js',
            'js/common/common.dataprocess.v7path.js',
            'js/common/common.loadjs.js',
            'js/common/common.os.js',
            'js/common/common.path.js',
            'js/common/common.input.js',
            'js/common/common.ejs.webenv.js',
            // 依赖了下面的 ejs 类库，以3.x的用法 来兼容部分2.x的 api
            'js/common/common.ejs.compatible.js',
            'js/common/common.token.compatible.js'
        ],
        ejsv2: {
            base: [
                'js/ejs/v2/epoint.moapi.v2.js'
            ],
            h5: [
                'js/ejs/v2/epoint.moapi.v2.h5mui.js'
            ],
            dd: [
                'js/ejs/dingtalk.js',
                'js/ejs/v2/epoint.moapi.v2.dd.js'
            ]
        },
        ejsv3: {
            base: [
                'js/ejs/v3/ejs.core.js'
            ],
            h5: [
                'js/ejs/v3/ejs.api.v3.h5mui.js'
            ],
            dd: [
                'js/ejs/dingtalk.js',
                'js/ejs/v3/ejs.api.v3.dd.js'
            ],
            ejs: [
                'js/ejs/v3/ejs.api.v3.native.js'
            ]
        }
    };

    function createPathArr(paths, ejsVer, env) {
        var arr = [],
            envs = env.split('_');
        
        // base 层
        arr = arr.concat(paths.base);
        
        // ejs 层
        var correctPaths = paths['ejsv' + ejsVer];

        arr = arr.concat(correctPaths.base);

        for (var i = 0, len = envs.length; i < len; i++) {
            arr = arr.concat(correctPaths[envs[i]] || []);
        }
        
        // core 层
        arr = arr.concat(paths.core);

        return arr;
    }

    if (typeof Config != 'undefined') {
        if (Config.isDebug) {
            // debug模式下的资源，通过版本号和环境，自动读取配置，生成最终的文件
            arr = createPathArr(paths, Config.ejsVer, Config.env);
            
            if (Config.isDebugPanel) {
                // 用来捕获移动端的 log
                arr.push('js/libs/vconsole.min.js');           
            }
        } else {
            // 正式模式下的，比较简单
            arr.push('js/_dist/core.v' + Config.ejsVer + '.' + Config.env + '.min.js');
        }
        
        if (Config.isComdto) {
            // comdto通过配置项引入
            arr.push('js/comdto/comdto.' + (Config.isDebug ? 'js' : 'min.js'));           
        }
              
        // 可以在这加入项目自定义的全局js
        
        SrcBoot.output(arr);
    }    

    if (typeof module != 'undefined' && module.exports) {
        // 暴露给gulpfile自动构建
        module.exports = {
            paths: paths,
            createPathArr: createPathArr
        };
    }
}());