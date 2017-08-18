/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/25
 * 版本: [3.0, 2017/05/25 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 基于mui的h5的 ui 模块 
 */
(function() {
    var h5MessageDialog = {};
    /**
     * h5 普通消息框模块、
     * 包括:alert,confirm,prompt
     */
    (function(obj) {
        //基于mui.css
        var CLASS_POPUP = 'mui-popup';
        var CLASS_POPUP_BACKDROP = 'mui-popup-backdrop';
        var CLASS_POPUP_IN = 'mui-popup-in';
        var CLASS_POPUP_OUT = 'mui-popup-out';
        var CLASS_POPUP_INNER = 'mui-popup-inner';
        var CLASS_POPUP_TITLE = 'mui-popup-title';
        var CLASS_POPUP_TEXT = 'mui-popup-text';
        var CLASS_POPUP_INPUT = 'mui-popup-input';
        var CLASS_POPUP_BUTTONS = 'mui-popup-buttons';
        var CLASS_POPUP_BUTTON = 'mui-popup-button';
        var CLASS_POPUP_BUTTON_BOLD = 'mui-popup-button-bold';
        var CLASS_POPUP_BACKDROP = 'mui-popup-backdrop';
        var CLASS_ACTIVE = 'mui-active';

        var popupStack = [];
        var backdrop = (function() {
            var element = document.createElement('div');
            element.classList.add(CLASS_POPUP_BACKDROP);
            element.addEventListener('webkitTransitionEnd', function() {
                if (!this.classList.contains(CLASS_ACTIVE)) {
                    element.parentNode && element.parentNode.removeChild(element);
                }
            });
            return element;
        }());
        var createInput = function(placeholder) {
            return '<div class="' + CLASS_POPUP_INPUT + '"><input type="text" autofocus placeholder="' + (placeholder || '') + '"/></div>';
        };
        var createInner = function(message, title, extra) {
            return '<div class="' + CLASS_POPUP_INNER + '"><div class="' + CLASS_POPUP_TITLE + '">' + title + '</div><div class="' + CLASS_POPUP_TEXT + '">' + message + '</div>' + (extra || '') + '</div>';
        };
        var createButtons = function(btnArray) {
            var length = btnArray.length;
            var btns = [];
            for (var i = 0; i < length; i++) {
                btns.push('<span class="' + CLASS_POPUP_BUTTON + (i === length - 1 ? (' ' + CLASS_POPUP_BUTTON_BOLD) : '') + '">' + btnArray[i] + '</span>');
            }
            return '<div class="' + CLASS_POPUP_BUTTONS + '">' + btns.join('') + '</div>';
        };
        var createPopup = function(html, callback) {
            //将所有的\n替换为  <br>
            html = html.replace(/\n/g, "<BR \/>");
            var popupElement = document.createElement('div');
            popupElement.className = CLASS_POPUP;
            popupElement.innerHTML = html;
            var removePopupElement = function() {
                popupElement.parentNode && popupElement.parentNode.removeChild(popupElement);
                popupElement = null;
            };

            popupElement.addEventListener('webkitTransitionEnd', function(e) {
                if (popupElement && e.target === popupElement && popupElement.classList.contains(CLASS_POPUP_OUT)) {
                    removePopupElement();
                }
            });
            popupElement.style.display = 'block';
            document.body.appendChild(popupElement);
            popupElement.offsetHeight;
            popupElement.classList.add(CLASS_POPUP_IN);

            if (!backdrop.classList.contains(CLASS_ACTIVE)) {
                backdrop.style.display = 'block';
                document.body.appendChild(backdrop);
                backdrop.offsetHeight;
                backdrop.classList.add(CLASS_ACTIVE);
            }
            var btns = popupElement.querySelectorAll('.' + CLASS_POPUP_BUTTON);
            var input = popupElement.querySelector('.' + CLASS_POPUP_INPUT + ' input');
            var popup = {
                element: popupElement,
                close: function(index, animate) {
                    if (popupElement) {
                        //如果是input 类型,就回调input内的文字
                        //否则回调 btns的index
                        var value = input ? input.value : (index || 0);
                        callback && callback(value, {
                            index: index || 0,
                            value: value
                        });
                        if (animate !== false) {
                            popupElement.classList.remove(CLASS_POPUP_IN);
                            popupElement.classList.add(CLASS_POPUP_OUT);
                        } else {
                            removePopupElement();
                        }
                        popupStack.pop();
                        //如果还有其他popup，则不remove backdrop
                        if (popupStack.length) {
                            popupStack[popupStack.length - 1]['show'](animate);
                        } else {
                            backdrop.classList.remove(CLASS_ACTIVE);
                        }
                    }
                }
            };
            var handleEvent = function(e) {
                popup.close([].slice.call(btns).indexOf(e.target));
            };
            var allBtns = document.querySelectorAll('.' + CLASS_POPUP_BUTTON);
            if (allBtns && allBtns.length > 0) {
                for (var i = 0; i < allBtns.length; i++) {
                    allBtns[i].addEventListener('click', handleEvent);
                }
            }
            if (popupStack.length) {
                popupStack[popupStack.length - 1]['hide']();
            }
            popupStack.push({
                close: popup.close,
                show: function(animate) {
                    popupElement.style.display = 'block';
                    popupElement.offsetHeight;
                    popupElement.classList.add(CLASS_POPUP_IN);
                },
                hide: function() {
                    popupElement.style.display = 'none';
                    popupElement.classList.remove(CLASS_POPUP_IN);
                }
            });
            return popup;
        };
        obj.createAlert = function(options, callback) {
            //buttonValue content title
            if (!options || typeof options['content'] === 'undefined') {
                return;
            } else {
                if (typeof options === 'function') {
                    callback = options;
                    options = {};
                }
                options['title'] = options['title'] || '提示';
                options['buttonValue'] = options['buttonValue'] || '确定';
            }
            return createPopup(createInner(options['content'], options['title']) + createButtons([options['buttonValue']]), callback);
        };
        obj.createConfirm = function(options, callback) {
            //content, title, buttons
            if (!options || typeof options['content'] === 'undefined') {
                return;
            } else {
                if (typeof options === 'function') {
                    callback = options;
                    options = {};
                }
                options['title'] = options['title'] || '提示';
                options['buttons'] = options['buttons'] || ['确认', '取消'];
            }
            return createPopup(createInner(options['content'], options['title']) + createButtons(options['buttons']), callback);
        };
        obj.createPrompt = function(options, callback) {
            //content, tips, title, buttons
            if (!options || typeof options['content'] === 'undefined') {
                return;
            } else {
                if (typeof options === 'function') {
                    callback = options;
                    options = {};
                }
                options['content'] = options['content'] || '请输入内容';
                options['title'] = options['title'] || '您好';
                options['tips'] = options['tips'] || '请输入内容';
                options['buttons'] = options['buttons'] || ['确定', '取消'];
            }
            return createPopup(createInner(options['content'], options['title'], createInput(options['tips'])) + createButtons(options['buttons']), callback);
        };
        var closePopup = function() {
            if (popupStack.length) {
                popupStack[popupStack.length - 1]['close']();
                return true;
            } else {
                return false;
            }
        };
        var closePopups = function() {
            while (popupStack.length) {
                popupStack[popupStack.length - 1]['close']();
            }
        };
        obj.toast = function(message) {
            var duration = 2000;
            var toast = document.createElement('div');
            toast.classList.add(('mui-toast-container'));
            toast.innerHTML = '<div class="' + ('mui-toast-message') + '">' + message + '</div>';
            toast.addEventListener('webkitTransitionEnd', function() {
                if (!toast.classList.contains(CLASS_ACTIVE)) {
                    toast.parentNode.removeChild(toast);
                    toast = null;
                }
            });
            //点击则自动消失
            toast.addEventListener('click', function() {
                toast.parentNode.removeChild(toast);
                toast = null;
            });
            document.body.appendChild(toast);
            toast.offsetHeight;
            toast.classList.add(CLASS_ACTIVE);
            setTimeout(function() {
                toast && toast.classList.remove(CLASS_ACTIVE);
            }, duration);
        };
    })(h5MessageDialog);

    /**
     * 单例对话框对象 h5情况
     * 用来实现h5版本的showwaiting
     */
    var waitingDialog = {};
    /**
     * h5的 waiting dialog模块
     * @module
     */
    (function(exports) {
        var h5DialogObj;
        /**
         * 显示waiting对话框
         * @param {String} title
         * @param {Object} options
         */
        exports.showWaiting = function(title, options) {
            if (h5DialogObj == null) {
                h5DialogObj = new H5WaitingDialog(title, options);
            } else {
                h5DialogObj.setTitle(title);
            }
            return h5DialogObj;
        };
        /**
         * 关闭waiting对话框
         */
        exports.closeWaiting = function() {
            if (h5DialogObj) {
                h5DialogObj.dispose();
                h5DialogObj = null;
            }
        };
        /**
         * h5版本waiting dialog的构造方法
         * @param {String} title
         * @param {Object} options
         * @constructor
         */
        function H5WaitingDialog(title, options) {
            // h5版本,构造的时候生成一个dialog
            this.loadingDiv = createLoading();
            document.body.appendChild(this.loadingDiv);
            this.setTitle(title);
            if (options && options.padlock == true) {
                // 如果设置了点击自动关闭
                var that = this;
                this.loadingDiv.addEventListener('click', function() {
                    that.close();
                });
            }
        };
        /**
         * 设置提示标题方法,重新显示
         * @param {String} title
         */
        H5WaitingDialog.prototype.setTitle = function(title) {
            title = title || '';
            if (this.loadingDiv) {
                // 只有存在对象时才能设置
                this.loadingDiv.style.display = 'block';
                this.loadingDiv.querySelector('.tipsContent').innerText = title;
            } else {
                console.error('h5 dialog对象已经销毁,无法再次显示');
            }
        };
        /**
         * 关闭后执行的方法,这里只是为了扩充原型
         */
        H5WaitingDialog.prototype.onclose = function() {

        };
        /**
         * 设置关闭dialog
         */
        H5WaitingDialog.prototype.close = function() {
            if (this.loadingDiv) {
                this.loadingDiv.style.display = 'none';
                this.onclose();
            }
        };
        /**
         * 销毁方法
         */
        H5WaitingDialog.prototype.dispose = function() {
            // 将loadingDiv销毁
            this.loadingDiv && this.loadingDiv.parentNode && this.loadingDiv.parentNode.removeChild(this.loadingDiv);
        };
        /**
         * 通过div和遮罩,创建一个H5版本loading动画(如果已经存在则直接得到)
         * 基于mui的css
         */
        function createLoading() {
            var loadingDiv = document.getElementById("MFRAME_LOADING");
            if (!loadingDiv) {
                // 如果不存在,则创建
                loadingDiv = document.createElement("div");
                loadingDiv.id = 'MFRAME_LOADING';
                loadingDiv.className = "mui-backdrop mui-loading";
                // 自己加了些样式,让loading能够有所自适应,并且居中
                loadingDiv.innerHTML = '<span class=" mui-spinner mui-spinner-white" style=" width: 20%;height: 20%;max-width:46px;max-height: 46px;position:absolute;top:46%;left:46%;"></span><span class="tipsContent" style="position:absolute;font-size: 14px;top:54%;left:46%;text-align: center;">加载中...</span>';
            }
            return loadingDiv;
        };
    })(waitingDialog);

    var actionsheet = {};
    /**
     * actionsheet的h5模拟实现
     * @module
     */
    (function(exports) {
        function createActionSheetH5(options) {
            options = options || {};
            var finalHtml = '';
            var idStr = options.id ? 'id="' + options.id + '"' : '';
            finalHtml += '<div ' + idStr + ' class="mui-popover mui-popover-action mui-popover-bottom">';
            // 加上title
            if (options.title) {
                finalHtml += '<ul class="mui-table-view">';
                finalHtml += '<li class="mui-table-view-cell">';
                finalHtml += '<a class="titleActionSheet"><b>' + options.title + '</b></a>';
                finalHtml += '</li>';
                finalHtml += '</ul>';
            }
            finalHtml += '<ul class="mui-table-view">';
            // 添加内容
            if (options.items && Array.isArray(options.items)) {
                for (var i = 0; i < options.items.length; i++) {
                    var title = options.items[i] || '';
                    finalHtml += '<li class="mui-table-view-cell">';

                    finalHtml += '<a >' + title + '</a>';

                    finalHtml += '</li>';
                }
            }
            finalHtml += '</ul>';
            // 加上最后的取消
            finalHtml += '<ul class="mui-table-view">';
            finalHtml += '<li class="mui-table-view-cell">';
            finalHtml += '<a class="cancelActionSheet"><b>取消</b></a>';
            finalHtml += '</li>';
            finalHtml += '</ul>';

            // 补齐mui-popover
            finalHtml += '</div>';
            return finalHtml;
        };
        // 基于options 创建h5 actionsheet
        exports.createActionSheetShow = function(options, callback) {
            options.id = options.id || 'defaultActionSheetId';
            var html = createActionSheetH5(options);
            // console.log('添加html:'+html);
            if (document.getElementById('actionSheetContent') == null) {
                // 不重复添加
                var wrapper = document.createElement('div');
                wrapper.id = 'actionSheetContent';
                wrapper.innerHTML = html;
                document.body.appendChild(wrapper);
                mui('body').on('shown', '.mui-popover', function(e) {
                    // console.log('shown:'+e.detail.id, e.detail.id); //detail为当前popover元素
                });
                mui('body').on('hidden', '.mui-popover', function(e) {
                    // console.log('hidden:'+e.detail.id, e.detail.id); //detail为当前popover元素
                });
            } else {
                // 直接更改html
                document.getElementById('actionSheetContent').innerHTML = html;
            }

            // 每次都需要监听，否则引用对象会出错，注意每次都生成新生成出来的dom，免得重复
            mui('#actionSheetContent').off();
            mui('#actionSheetContent').on('tap', 'li>a', function(e) {
                var title = this.innerText;

                // console.log('class:' + mClass);
                // console.log('点击,title:' + title + ',value:' + value);
                if (this.className.indexOf('titleActionSheet') == -1) {
                    // 排除title的点击
                    mui('#' + options.id).popover('toggle');
                    if (this.className.indexOf('cancelActionSheet') == -1) {
                        // 排除取消按钮,回调函数
                        callback && callback(title);
                    }
                }
            });
            // 显示actionsheet
            mui('#' + options.id).popover('toggle');
        };
    })(actionsheet);

    /**
     * 日期时间选择相关
     * 基于mui.picker插件
     */
    var datePicker = {};

    (function(exports) {
        var dtPicker = null;
        var oldDtType = null;
        /**
         * mui的时间选择单例选择
         * 如果当前类别和以前类别是同一个,则使用同一个对象,
         * 否则销毁当前,重新构造
         * @param {JSON} options 传入的构造参数
         * @param {Function} chooseCallBack(rs) 选择后的回调
         * rs.value 拼合后的 value
         * rs.text 拼合后的 text
         * rs.y 年，可以通过 rs.y.vaue 和 rs.y.text 获取值和文本
         * rs.m 月，用法同年
         * rs.d 日，用法同年
         * rs.h 时，用法同年
         * rs.i 分（minutes 的第二个字母），用法同年
         */
        function showDtPicter(options, chooseCallBack) {
            options = options || {};
            // 依赖于 mui.min.css,mui.picker.min.css,mui.min.js,mui.picker.min.js
            if (window.mui && window.mui.DtPicker) {
                if (oldDtType !== options.type) {
                    //如果两次类别不一样,重新构造
                    if (dtPicker) {
                        //如果存在,先dispose
                        dtPicker.dispose();
                        dtPicker = null;
                    }
                    oldDtType = options.type;
                }
                dtPicker = dtPicker || new mui.DtPicker(options);
                dtPicker.show(function(rs) {
                    var detail = {
                        code: '1',
                        msg: '',
                        result: {}
                    }
                    if (options.type === 'date') {
                        detail.result.date = rs.y.value + '-' + rs.m.value + '-' + rs.d.value;
                        chooseCallBack && chooseCallBack(detail.result, detail.msg, detail);
                    } else if (options.type === 'time') {
                        detail.result.time = rs.h.value + ':' + rs.i.value;
                        chooseCallBack && chooseCallBack(detail.result, detail.msg, detail);
                    } else if (options.type === 'month') {
                        detail.result.month = rs.y.value + '-' + rs.m.value;
                        chooseCallBack && chooseCallBack(detail.result, detail.msg, detail);
                    } else {
                        //日期时间
                        detail.result.datetime = rs.y.value + '-' + rs.m.value + '-' + rs.d.value + ' ' + rs.h.value + ':' + rs.i.value;
                        chooseCallBack && chooseCallBack(detail.result, detail.msg, detail);
                    }

                });
            } else {
                console.error('错误,缺少引用的css或js,无法使用mui的dtpicker')
            }
        };
        exports.showDtPicter = showDtPicter;
    })(datePicker);

    /**
     * pop操作相关
     * 基于,ui.pop
     */
    var popPicker = {};
    (function(exports) {
        var pPicker = null;
        //上一次的layer,如果layer换了,也需要重新换一个
        var lastLayer = null;
        /**
         * mui的PopPicker,单例显示
         * @param {options} 配置包括
         * data 装载的数据
         * @param {Function} chooseCallBack
         */
        function showPopPicker(options, chooseCallBack) {
            //依赖于mui.min.css,mui.picker.min.css,mui.poppicker.css,mui.min.js,mui.picker.min.js,mui.poppicker.js
            if (window.mui && window.mui.PopPicker) {
                var layer = options.layer || 1;
                if (lastLayer !== layer) {
                    //如果两次类别不一样,重新构造
                    if (pPicker) {
                        //如果存在,先dispose
                        pPicker.dispose();
                        pPicker = null;
                    }
                    lastLayer = layer;
                }
                pPicker = pPicker || new mui.PopPicker({
                    'layer': layer
                });
                var data = options.data || [];
                pPicker.setData(data);
                pPicker.show(function(items) {
                    var detail = {
                        code: '1',
                        msg: '',
                        result: {}
                    }
                    detail.result.items = [];
                    for (var i = 0; i < layer; i++) {
                        detail.result.items.push({
                            text: items[i].text,
                            value: items[i].value,
                        })
                    }
                    chooseCallBack && chooseCallBack(detail.result, detail.msg, detail);

                });
            } else {
                console.error('未引入mui pop相关js(css)');
            }
        }
        exports.showPopPicker = showPopPicker;
    })(popPicker);

    /**
     * 将小于10的数字前面补齐0,然后变为字符串返回
     * @param {Number} number
     * @return {String} 补齐0后的字符串
     */
    function paddingWith0(number) {
        if (typeof number == 'number' || typeof number == 'string') {
            number = parseInt(number, 10);
            if (number < 10) {
                number = '0' + number;
            }
            return number;
        } else {
            return '';
        }
    }

    /**
     * ui模块
     */
    ejs.extendModule('ui', [{
        namespace: "toast",
        // 必填，只有在特定的os下才会实现，不填则不会实现
        // 另外，填了相应的os后，会覆盖原来os下相应的func
        // 每一个os下可以有一个相应的api提示
        os: ['h5'],
        defaultParams: {
            message: ""
        },
        runCode: function(options, resolve, reject) {
            var title = '',
                msg = '';
            options = options || {};
            if (typeof options !== 'object') {
                msg = options;
            } else {
                msg = options.message;
            }
            h5MessageDialog.toast(msg);
            options.success && options.success();
            resolve && resolve();

        }
    }, {
        namespace: "showDebugDialog",
        os: ['h5'],
        defaultParams: {
            debugInfo: "",
        },
        runCode: function(options, resolve, reject) {
            if (typeof options === 'string') {
                options = {
                    debugInfo: options
                };
            }
            ejs.ui.alert({
                title: "",
                message: options.debugInfo,
                buttonName: "确定",
                success: options.success
            }, resolve, reject);
        }
    }, {
        namespace: "alert",
        os: ['h5'],
        // 默认参数只有当第一个参数是options时才会生效
        defaultParams: {
            title: "",
            message: "",
            buttonName: "确定"
        },
        runCode: function(options, resolve, reject) {
            // 支持简单的调用，alert(msg, title, btn)              
            if (typeof options !== 'object') {
                options = {
                    message: arguments[0],
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
            }

            options['content'] = options.message;
            options['title'] = options.title;
            options['buttonValue'] = options.buttonName;

            h5MessageDialog.createAlert(options, function() {
                options.success && options.success({});
                resolve && resolve({});
            });
        }
    }, {
        namespace: "confirm",
        os: ['h5'],
        // 默认参数只有当第一个参数是options时才会生效
        defaultParams: {
            // 这是默认参数，API的每一个参数都应该有一个默认值
            title: "",
            message: "",
            buttonLabels: ['取消', '确定']
        },
        runCode: function(options, resolve, reject) {
            var success = options.success;

            options['buttons'] = options['buttonLabels'];
            options['content'] = options['message'];

            h5MessageDialog.createConfirm(options, function(index) {
                var result = {
                    "which": index
                };
                success && success(result);
                resolve && resolve(result);
            });
        }
    }, {
        namespace: "prompt",
        os: ['h5'],
        // 默认参数只有当第一个参数是options时才会生效
        defaultParams: {
            title: "",
            hint: "",
            text: "",
            buttonLabels: ['取消', '确定']
        },
        runCode: function(options, resolve, reject) {

            options['content'] = options['text'] || '';
            options['title'] = options['title'] || '您好';
            options['tips'] = options['hint'] || '请输入内容';
            options['buttons'] = options['buttonLabels'];
            h5MessageDialog.createPrompt(options, function(content) {
                //index得转成ejs相应的index
                var index = content ? 0 : 1;
                var result = {
                    "which": index,
                    "content": content
                };
                options.success && options.success(result);
                resolve && resolve(result);
            });
        }
    }, {
        namespace: "actionSheet",
        os: ['h5'],
        // 默认参数只有当第一个参数是options时才会生效
        defaultParams: {
            items: []
        },
        runCode: function(options, resolve, reject) {

            actionsheet.createActionSheetShow(options, function(title) {
                var index = options.items.indexOf(title);
                var result = {
                    "which": index,
                    "content": title
                };
                options.success && options.success(result);
                resolve && resolve(result);
            });
        }
    }, {
        namespace: "pickDate",
        os: ['h5'],
        // 默认参数只有当第一个参数是options时才会生效
        defaultParams: {
            // h5中的开始年份
            beginYear: 1900,
            // h5中的结束年份
            endYear: 2100,
            // 默认为空为使用当前时间
            // 格式为 yyyy-MM-dd。
            datetime: ''
        },
        runCode: function(options, resolve, reject) {
            var datetime = options['datetime'];
            if (!datetime) {
                // 如果不存在，默认为当前时间
                var dateNow = new Date();
                datetime = dateNow.getFullYear() + '-' + paddingWith0(dateNow.getMonth() + 1) + '-' + paddingWith0(dateNow.getDate());
            }
            datePicker.showDtPicter({
                "type": "date",
                "value": datetime,
                'beginYear': options.beginYear,
                'endYear': options.endYear
            }, function(result) {
                options.success && options.success(result);
                resolve && resolve(result);
            });
        }
    }, {
        namespace: "pickTime",
        os: ['h5'],
        // 默认参数只有当第一个参数是options时才会生效
        defaultParams: {
            // 默认为空为使用当前时间
            // 格式为 yyyy-MM-dd。
            datetime: ''
        },
        runCode: function(options, resolve, reject) {
            var datetime = options['datetime'];
            var dateNow = new Date();
            var datePrefix = dateNow.getFullYear() + '-' + paddingWith0(dateNow.getMonth() + 1) + '-' + paddingWith0(dateNow.getDate()) + ' ';
            if (!datetime) {
                // 如果不存在，默认为当前时间
                datetime = datePrefix + paddingWith0(dateNow.getHours()) + ':' + paddingWith0(dateNow.getMinutes());
            } else {
                datetime = datePrefix + datetime;
            }
            datePicker.showDtPicter({
                "type": "time",
                "value": datetime
            }, function(result) {
                options.success && options.success(result);
                resolve && resolve(result);
            });
        }
    }, {
        namespace: "pickDateTime",
        os: ['h5'],
        // 默认参数只有当第一个参数是options时才会生效
        defaultParams: {
            // 默认为空为使用当前时间
            // 格式为 yyyy-MM-dd。
            datetime: '',
            // h5中的开始年份
            beginYear: 1900,
            // h5中的结束年份
            endYear: 2100,
        },
        runCode: function(options, resolve, reject) {
            var datetime = options['datetime'];
            if (!datetime) {
                var dateNow = new Date();
                var datePrefix = dateNow.getFullYear() + '-' + paddingWith0(dateNow.getMonth() + 1) + '-' + paddingWith0(dateNow.getDate()) + ' ';
                // 如果不存在，默认为当前时间
                datetime = datePrefix + paddingWith0(dateNow.getHours()) + ':' + paddingWith0(dateNow.getMinutes());
            }
            // h5模式,基于mui.picker来实现
            datePicker.showDtPicter({
                "type": null,
                "value": datetime,
                'beginYear': options.beginYear,
                'endYear': options.endYear
            }, function(result) {
                options.success && options.success(result);
                resolve && resolve(result);
            });
        }
    }, {
        namespace: "pickMonth",
        os: ['h5'],
        defaultParams: {
            // 默认为空为使用当前时间
            // 格式为 yyyy-MM-dd。
            datetime: '',
            // h5中的开始年份
            beginYear: 1900,
            // h5中的结束年份
            endYear: 2100,
        },
        runCode: function(options, resolve, reject) {
            var datetime = options['datetime'];
            var dateNow = new Date();
            if (!datetime) {
                // 如果不存在，默认为当前时间
                datetime = dateNow.getFullYear() + '-' + paddingWith0(dateNow.getMonth() + 1) + '-' + paddingWith0(dateNow.getDate());
            } else {
                // 否则，只需要加上日期尾缀
                datetime += '-' + paddingWith0(dateNow.getDate());
            }
            datePicker.showDtPicter({
                "type": "month",
                "value": datetime,
                'beginYear': options.beginYear,
                'endYear': options.endYear
            }, function(result) {
                options.success && options.success(result);
                resolve && resolve(result);
            });
        }
    }, {
        namespace: "popPicker",
        os: ['h5'],
        defaultParams: {
            // 层级，默认为1
            layer: 1,
            data: []
        },
        runCode: function(options, resolve, reject) {
            popPicker.showPopPicker(options, function(result) {
                options.success && options.success(result);
                resolve && resolve(result);
            });
        }
    }, {
        namespace: "showWaiting",
        os: ['h5'],
        defaultParams: {
            title: ''
        },
        runCode: function(options, resolve, reject) {
            waitingDialog.showWaiting(options.title, {});

            options.success && options.success();
            resolve && resolve();
        }
    }, {
        namespace: "closeWaiting",
        os: ['h5'],
        runCode: function(options, resolve, reject) {
            waitingDialog.closeWaiting();

            options.success && options.success();
            resolve && resolve();
        }
    }]);
})();
/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/05
 * 版本: [3.0, 2017/06/05 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: h5的 page 模块 
 */
(function() {
    /**
     * ui模块
     */
    ejs.extendModule('page', [{
        namespace: "open",
        os: ['h5'],
        defaultParams: {
            pageUrl: "",
            // 额外数据
            data: {}
        },
        runCode: function(options) {
            if (typeof options !== 'object') {
                // 兼容open(url,data)的做法
                options = ejs.innerUtil.extend({
                    pageUrl: arguments[0],
                    data: arguments[1]
                }, options);
            }
            // 将额外数据拼接到url中
            options.pageUrl = ejs.innerUtil.getFullUrlByParams(options.pageUrl, options.data);

            //普通
            document.location.href = options.pageUrl;
        }
    }, {
        namespace: "close",
        os: ['h5'],
        runCode: function(options) {
            // 浏览器退出
            if (window.history.length > 1) {
                window.history.back();
                return true;
            }
        }
    }, {
        namespace: "reload",
        os: ['h5'],
        runCode: function(options) {
            window.location.reload();
        }
    }]);
})();
/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/05
 * 版本: [3.0, 2017/06/05 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: h5的 storage 模块 
 */
(function() {
    /**
     * ui模块
     */
    ejs.extendModule('storage', [{
        namespace: "getItem",
        os: ['h5'],
        defaultParams: {
            // 对应的key
            key: '',
        },
        runCode: function(options, resolve, reject) {
            var keys = options.key,
                values = {},
                success = options.success,
                error = options.error;

            if (typeof keys === 'string') {
                keys = [keys];
            }

            try {
                for (var i = 0, len = keys.length; i < len; i++) {
                    var value = localStorage.getItem(keys[i]);
                    
                    values[keys[i]] = value;
                }
            } catch (msg) {
                var err = {
                    code: 0,
                    msg: 'localStorage获取值出错:' + JSON.stringify(keys),
                    result: msg
                };
                error && error(err);
                reject && reject(err);
                return;
            }

            var result = values;
            
            success && success(result);
            resolve && resolve(result)
        }
    }, {
        namespace: "setItem",
        os: ['h5'],
        runCode: function(options, resolve, reject) {
            var items = {},
                success = options.success,
                error = options.error;
            
            for (var key in options) {
                if (key == 'success' || key == 'error') {
                    continue;
                }
                items[key] = options[key];
            }
            
            try {
                for (var key in items) {
                    var value = items[key];
                    
                    localStorage.setItem(key, value);
                }
            } catch (msg) {
                var errorMsg = '';
                if (msg.name == 'QuotaExceededError') {
                    errorMsg = '超出本地存储限额，建议先清除一些无用空间!';
                } else {
                    errorMsg = 'localStorage存储值出错:' + JSON.stringify(items);
                }
                var err = {
                    code: 0,
                    msg: errorMsg,
                    result: msg
                };
                error && error(err);
                reject && reject(err);
                return;
            }          
            
            var result = {};
            
            success && success(result);
            resolve && resolve(result);
        }
    }, {
        namespace: "removeItem",
        os: ['h5'],
        defaultParams: {
            // 对应的key
            key: '',
        },
        runCode: function(options, resolve, reject) {
            var keys = options.key,
                values = {},
                success = options.success,
                error = options.error;

            if (typeof keys === 'string') {
                keys = [keys];
            }
            
            try {
                for (var i = 0, len = keys.length; i < len; i++) {
                    localStorage.removeItem(keys[i]);
                }
            } catch (msg) {
                var err = {
                    code: 0,
                    msg: 'localStorage移除值出错:' + JSON.stringify(keys),
                    result: msg
                };
                error && error(err);
                reject && reject(err);
                return;
            }

            var result = {};
            
            success && success(result);
            resolve && resolve(result);
        }
    }]);
})();