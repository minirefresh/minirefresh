/**
 * 作者: 戴荔春
 * 创建时间: 2017/07/04
 * 版本: [1.0, 2017/07/04 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 拓展ajax中的文件上传功能
 * 作为插拔式存在
 */
(function(exports) {
    "use strict";
    
    var noop = exports.noop,
        serialize = exports.ajax.serialize,
        $extend = exports.extend;
    
    /**
     * 默认的default设置
     */
    var defaultSetting = {
         // 可以传一个context，成功回调和失败回调中都可以用this指向它
        context: null,
        data: {},
        // 下面是文件上传的相关配置
        // 选择的文件对象,[{name:***,file:***}]
        files: null,
        uploading: noop,
        // 默认每5%监听一次上传进度
        ListenerProgressStep: 5
    };
    
    /**
     * 上传文件时和普通的数据序列化不一样，单独处理
     * @param {Object} settings
     */
    var serializeFilesData = function(settings) {
        // 初始化表单数据
        var formdata = new FormData();
        // 处理文件数据之外的额外数据
        if (typeof settings.data === 'object') {
            // 遍历参数-额外的参数，为 object或数组时都要序列化，但是换一种序列化的方式
            var serializeData = {};
            var params = {
                add: function(k, v) {
                    serializeData[k] = v;
                }
            };
            serialize(params, settings.data, settings.traditional);

            for (var key in serializeData) {
                formdata.append(key, serializeData[key]);
            }
        } else {
            // 传入的是字符串，直接添加到body中
            formdata.append(settings.data, '');
        }

        // 处理文件，也是放入表单中
        var files = settings.files;
        if (files) {
            if (Array.isArray(files)) {
                for (var i = 0, len = files.length; i < len; i++) {
                    formdata.append(files[i].name, files[i].file);
                }
            } else {
                formdata.append(files.name, files.file);
            }
        }

        settings.data = formdata;

        // 由于 FormData 对象无法手动控制 boundary 所以以下代码手动更改boundary会出错
        // 将这个设为false，代表不会手动设置 contentType ,而是由 xhr对象自动添加(默认就是表单格式确保表单的boundary一致)
        settings.isFileUpload = true;
        // 手动设置boundary时，请确保 form 中的也一致，否则会报错
        //      var boundary = '----WebKitFormBoundary' + exports.uuid({
        //          type: 'noline',
        //          len: 16
        //      });
        //      settings.contentType = 'multipart/form-data; boundary=' + boundary;
    };
    
    /**
     * upload时，会用到这个来获取进度
     * @param {Number} percent 当前的进度,最大为100.00
     * @param {String} speed 当前的速度，例如 100kb/s
     * @param {Object} xhr 
     * @param {Object} settings 
     */
    var ajaxUploading = function(percent, speed, xhr, settings) {
        settings.uploading.call(settings.context, percent, speed, 'uploading', xhr, settings);
    };
    
    /**
     * 添加文件上传的支持
     * @param {Object} xhr
     * @param {Object} settings
     */
    var appendUpload = function(xhr, settings) {
        // 初始化一些参数-如上传速度
        // 前面加载完毕的为0
        var previousLoadedBytes = 0,
            // 前面加载的时间戳
            previousTimeStamp = (new Date()).valueOf(),
            // 当前速度
            speedStr = 0,
            // 监听步长
            step = 0;

        xhr.upload.addEventListener("progress", function(e) {
            var nowTimeStamp = (new Date()).valueOf();
            if (nowTimeStamp - previousTimeStamp > 1000) {
                // 1秒更新一次速度
                var iDiff = e.loaded - previousLoadedBytes;
                var speed = (iDiff) * 1000 / (nowTimeStamp - previousTimeStamp);
                previousLoadedBytes = e.loaded;
                previousTimeStamp = nowTimeStamp;
                speedStr = speed.toString() + 'B/s';
                if (speed > 1024 * 1024) {
                    speedStr = (Math.round(speed / (1024 * 1024))).toString() + 'MB/s';
                } else if (speed > 1024) {
                    speedStr = (Math.round(speed / 1024)).toString() + 'KB/s';
                }
            }
            var percent = (e.loaded / e.total * 100).toFixed(2);
            if (percent - step >= settings.ListenerProgressStep) {
                step = percent;

                ajaxUploading(percent, speedStr, xhr, settings);

            }

        }, false);
    };

    /**
     * 对ajax的一次拓展，拓展了文件上传功能
     * @param {Object} options
     */
    var upload = function(options) {
        var settings = $extend({}, defaultSetting, options);

        // 写死一些配置，避免用户修改导致报错
        // 表单数据不需要ajax单独处理
        settings.processData = false;
        settings.contentType = false;
        
        // 将文件上传的相关数据序列化
        serializeFilesData(settings);
              
        // 拓展的hook，会回调 xhr和settings作为参数
        settings.extendHook = {
            'upload': appendUpload
        };
        
        return exports.ajax(settings);
    };
    
    
    exports.upload = upload;
})(Util);