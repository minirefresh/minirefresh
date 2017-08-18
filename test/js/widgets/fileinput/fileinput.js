/**
 * 作者: 戴荔春
 * 创建时间: 2017/07/11
 * 版本: [1.0, 2017/07/11 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: h5 fileinput api操作相关
 * 由于需要配合HTML，所以封装成了组件
 */
(function() {
    "use strict";

    /**
     * 全局生效默认设置
     * 默认设置可以最大程度的减小调用时的代码
     */
    var defaultSetting = {
        // 可选参数  File Image Camera Image_Camera Image_File Camera_File Text All
        type: 'ALL',
        isMulti: false,
        container: ''
    };

    /**
     * 从一个file对象,加载对应的数据
     * FileReader的方法
     * 方法名              参数              描述
     * readAsBinaryString   file            将文件读取为二进制编码
     * readAsText           file,[encoding] 将文件读取为文本
     * readAsDataURL        file            将文件读取为DataURL
     * abort                (none)          终端读取操作
     * @param {FileReader} oFReader 对应的加载器
     * @param {File} file 文件对象,选择的是img类型
     * @param {Function} success 成功加载完毕后的回调,回调result(不同的加载方式result类型不同)
     * @param {Function} error 失败回调
     * @return {FileReader} 返回文件加载器对象
     * @param {String} type 类型,DataUrl还是Text还是Binary
     */
    function loadDataFromFile(oFReader, file, success, error, type) {
        if (window.FileReader || !oFReader || !(oFReader instanceof FileReader)) {
            oFReader.onload = function(oFREvent) {
                // 解决DataUrl模式下的b64字符串不正确问题
                var b64 = oFREvent.target.result;
                if (type === 'DataUrl') {
                    // 正常的图片应该是data:image/gif;data:image/png;;data:image/jpeg;data:image/x-icon;
                    // 而在Android的一些5.0系统以下(如4.0)的设备中,有些返回的b64字符串缺少关键image/gif标识,所以需要手动加上
                    if (b64 && b64.indexOf('data:base64,') !== -1) {
                        // 去除旧有的错误头部
                        b64 = b64.replace('data:base64,', '');
                        var dataType = '';
                        // 文件名字
                        var name = file.name;
                        if (name && name.toLowerCase().indexOf('.jpg') !== -1) {
                            // jpeg
                            dataType = 'image/jpeg';
                        } else if (name && name.toLowerCase().indexOf('.png') !== -1) {
                            // png
                            dataType = 'image/png';
                        } else if (name && name.toLowerCase().indexOf('.gif') !== -1) {
                            // gif
                            dataType = 'image/gif';
                        } else if (name && name.toLowerCase().indexOf('.icon') !== -1) {
                            // x-icon
                            dataType = 'image/x-icon';
                        }
                        b64 = 'data:' + dataType + ';base64,' + b64;
                    }
                }
                success && success(b64);
            };
            oFReader.onerror = function(error) {
                error && error(error);
            };
            if (type === 'DataUrl') {
                oFReader.readAsDataURL(file);
            } else if (type === 'Text') {
                oFReader.readAsText(file);
            } else {
                oFReader.readAsBinaryString(file);
            }
            return oFReader;
        } else {
            error && error('错误:FileReader不存在!');
        }
    }

    /**
     * 构造一个 FileInpput 对象
     * @param {Object} options 配置参数
     * @constructor
     */
    function FileInput(options) {

        options = Util.extend({}, defaultSetting, options);

        this.container = Util.selector(options.container);
        this.options = options;
        
        this._init();
        this._addEvent();

    }

    FileInput.prototype = {
        /**
         * 初始化 type isMulti filter等
         */
        _init: function() {
            var isEjs = Util.os.ejs,
                options = this.options,
                container = this.container;

            // 设置单个文件选择需要的 属性
            container.setAttribute('type', 'file');
            
            if (options.isMulti) {
                container.setAttribute('multiple', 'multiple');
            } else {
                container.removeAttribute('multiple');
            }
            
            var accept = options.accept || container.getAttribute('accept');
            var type = options.type || 'File';
            var filter;
            if (type === 'Image') {
                filter = 'image/*';
                type = 'DataUrl';
            } else if (type === 'Camera') {
                if (isEjs) {
                    filter = 'camera/*';
                } else {
                    filter = 'image/*';
                }
                type = 'DataUrl';
            } else if (type === 'Image_Camera') {
                if (isEjs) {
                    filter = 'image_camera/*';
                } else {
                    filter = 'image/*';
                }
                type = 'DataUrl';
            } else if (type === 'Image_File') {
                if (isEjs) {
                    filter = 'image_file/*';
                } else {
                    filter = '*';
                }
                type = 'DataUrl';
            } else if (type === 'Camera_File') {
                if (isEjs) {
                    filter = 'camera_file/*';
                } else {
                    filter = '*';
                }
                type = 'DataUrl';
            } else if (type === 'Text') {
                if (isEjs) {
                    filter = 'text/*';
                } else {
                    filter = 'file/*';
                }
                type = 'Text';

            } else if (type === 'File') {
                if (isEjs) {
                    filter = 'file/*';
                    type = 'DataUrl';
                } else {
                    filter = '*';
                    type = 'File';
                }

            } else if (type === 'All') {
                if (isEjs) {
                    filter = '*/*';
                    type = 'DataUrl';
                } else {
                    filter = '*';
                    type = 'DataUrl';
                }
            } else {
                filter = '*';
                type = 'File';
            }
            this.dataType = type;
            filter = accept || filter;
            container.setAttribute('accept', filter);
        },
        /**
         * 增加事件，包括
         * 轮播图片的监听
         * 图片滑动的监听，等等
         */
        _addEvent: function() {
            var container = this.container,
                options = this.options,
                success = options.success,
                error = options.error,
                self = this;         
            
            // 选择的回调中进行预处理
            var changeHandle = function() {
                var aFiles = container.files;
                var len = aFiles.length;
                if (len === 0) {
                    return;
                }
                // 定义文件读取器和后缀类型过滤器
                var oFReader = new window.FileReader();
                var index = 0;

                var chainCall = function() {
                    if (index >= len) {
                        return;
                    }
                    loadDataFromFile(oFReader, aFiles[index], function(b64Src) {
                        success && success(b64Src, aFiles[index], {
                            index: index,
                            len: len,
                            isEnd: (index >= len - 1)
                        });
                        index++;
                        chainCall();
                    }, error, self.dataType);
                };
                chainCall();
            };

            container.addEventListener('change', changeHandle);
            
            // 注册一个委托对象，方便取消
            this.delegatesHandle = changeHandle;
        },
        /**
         * 将需要暴露的destroy绑定到了 原型链上
         */
        destroy: function() {

            this.container.removeEventListener('change', this.delegatesHandle);

            this.container = null;
            this.options = null;
        }
    };

    window.FileInput = FileInput;
})();