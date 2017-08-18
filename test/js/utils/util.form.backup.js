/**
 * 作者: 郭天琦
 * 创建时间: 2017/07/14
 * 版本: [1.0, 2017/07/14 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 表单验证器
 */

(function(doc, Util, stringTools) {
    "use strict";

    /*
     * 兼容统一用法，兼容Util.string.idcard， 也可以通过namespace来拓展
     */
    var compatible = {
        idcard: stringTools.idcard.validate,
        num: stringTools.isNum,
        phone: stringTools.isPhoneNum,
        tel: stringTools.isTelNum,
        email: stringTools.isEmail,
        externalUrl: stringTools.isExternalUrl
    };

    /*
     * 默认参数
     */
    var defaultSetting = {
        tag: 'input',
        isShowErr: true,
        message: {
            requiredMsg: '未满足非空判断',
            minLenMsg: '未满足最小长度验证',
            maxLenMsg: '未满足最大长度验证',
            idcardMsg: '身份证号码验证不正确'
        }
    };

    /**
     * 表单验证
     * @constructor
     * @param {Object String} options
     * container {HTMLElement} 容器id
     * tag {String} 标签名
     * isShowErr {Boolean} 是否启用弹出框
     */
    function Form(options) {
        var self = this;

        if(!(options || options.container)) {
            throw new Error('请传入容器id');
        }

        if(typeof options == 'string') {
            self.container = Util.selector(options);
            self = Util.extend(self, defaultSetting);
        } else if(typeof options == 'object') {
            self.container = Util.selector(options.container);
            self = Util.extend(self, defaultSetting, options);
        }

        // 得到需要验证的元素
        self.serializeArray = self._serialize(self.tag);
    }

    /*
     * 原型
     */
    Form.prototype = {

        /**
         * 开始启用验证
         * @return {Boolean} true or false
         */
        validate: function() {
            // 解析规则，并且返回是否验证成功          
            return this._resolveRule(this.serializeArray);
        },

        /**
         * 获取成功后的数据 
         * @return {Object} 返回数据
         */
        getData: function() {
            return this._resolveJSON(this.serializeArray);
        },

        /**
         * 获取错误数据
         * @return {Object} 返回错误数据
         */
        getError: function() {
            return this.errMsg;
        },

        /**
         * 获取需要验证表单 -- 集合
         * @param {String} tag 类型
         * @param {String} tagType 自定义类型
         * return {Array} 返回纯数组
         */
        _serialize: function(tag, tagType) {
            tag = tag || tagType;

            return [].slice.call(this.container.querySelectorAll(tag));
        },

        /**
         * 解析规则 如果无data-reg只做简单的非空操作
         * @param {Array} 集合
         */
        _resolveRule: function(serializeArray) {
            var i = 0,
                len = serializeArray.length,
                self = this,
                item = null;

            // 初始化错误结果
            self.errMsg = {};

            for(; i < len; i++) {
                item = serializeArray[i];

                // 处理必填项
                if(item.required && !self.isRequired(item)) {
                    return false;
                }
                // 处理minlength与maxlength
                else if((item.getAttribute('minlength') || item.getAttribute('maxlength')) && !self._resolveMaxMin(item)) {
                    return false;
                }
                // 处理 正则类型 基于Util.string
                else if(item.dataset.ruleRegtype && !self._resolveRegType(item)) {
                    return false;
                }
                // 处理 自定义正则
                else if(item.dataset.ruleRegexp && !self._resolveRegExp(item)) {
                    return false;
                }
                // 处理mate
                else if(item.dataset.ruleMate && !self._resolveMate(item)) {
                    return false;
                }
            }

            return true;
        },

        /**
         * 处理数据 -- JSON
         * @param {Array} 集合
         * return {Object} 数据集合
         */
        _resolveJSON: function(serializeArray) {
            var self = this,
                i = 0,
                len = serializeArray.length,
                data = {};

            for(; i < len; i++) {
                var item = serializeArray[i],
                    name = item.name;

                if(name) {
                    data[name] = item.value;
                }
            }

            return data;
        },

        /*
         * 验证是否为必填
         * @param {HTMLElement} dom 要验证的dom对象
         * @return {Boolean} true为已填写，false为未填写
         */
        isRequired: function(dom) {
            var value = dom.value;

            if(value == '' || value.length == 0) {
                this.errMsg = {
                    message: this.message.requiredMsg,
                    dom: dom,
                    data: dom.value
                };

                this.toast(dom);

                return false;
            }

            return true;
        },

        /*
         * 处理maxLength、minLength
         * @param {HTMLElement} dom 要验证的dom对象
         * @return {Boolean} 是否验证通过
         */
        _resolveMaxMin: function(dom) {
            var maxLength = dom.maxLength,
                minLength = dom.minLength,
                value = dom.value,
                self = this;

            if(minLength) {
                if(!(value.length >= minLength)) {
                    var minLenMsg = self.message.minLenMsg;

                    self.errMsg = {
                        message: minLenMsg,
                        dom: dom,
                        data: dom.value
                    };

                    self.toast(dom);

                    return false;
                }
            }

            if(maxLength) {
                if(!(value.length <= maxLength)) {
                    var maxLenMsg = self.message.maxLenMsg;

                    self.errMsg = {
                        message: maxLenMsg,
                        dom: dom,
                        data: dom.value
                    };

                    self.toast(dom);

                    return false;
                }
            }

            return true;
        },

        /*
         * 处理rule-type
         * @param {HTMLElement} dom 要验证的dom对象
         * @return {Boolean} 是否验证通过
         */
        _resolveRegType: function(dom) {
            var regType = dom.dataset.ruleType,
                self = this;

            if(dom.required || dom.value.length > 0) {
                // 兼容idcard
                if(regType == 'idcard') {
                    var idcardMsg = self.message.idcardMsg;

                    if(!compatible.idcard(dom.value)) {
                        self.errMsg = {
                            message: idcardMsg,
                            dom: dom,
                            data: dom.value
                        };

                        self.toast(dom);

                        return false;
                    } else {
                        return true;
                    }
                }

                // 常规类型
                if(compatible[regType]) {
                    if(!(compatible[regType](dom.value))) {
                        self.errMsg = {
                            message: '输入内容未满足正则匹配' + regType,
                            dom: dom,
                            data: dom.value
                        };

                        self.toast(dom);

                        return false;
                    } else {
                        return true;
                    }
                }

                throw new Error('该正则类型非所属类型，详见在线文档');
            }
            
            return true;
        },

        /*
         * 处理自定义正则regexp 
         * @param {HTMLElement} dom 要验证的dom对象
         * @return {Boolean} 是否验证通过
         */
        _resolveRegExp: function(dom) {
            var regExp = dom.dataset.ruleRegexp,
                self = this;

            if(dom.required || dom.value.length > 0) {
                try {
                    regExp = eval(regExp);
                } catch(e) {
                    throw new Error('自定义正则表达式有误');
                }

                if(!regExp.test(dom.value)) {
                    self.errMsg = {
                        message: '输入内容未满足正则匹配',
                        dom: dom,
                        data: dom.value
                    };

                    self.toast(dom);

                    return false;
                } else {
                    return true;
                }
            }
            
            return true;
        },

        /*
         * 处理、分析mate，互相匹配
         * @param {HTMLElement} dom 要验证的dom对象
         * @return {Boolean} 是否验证通过
         */
        _resolveMate: function(dom) {
            var self = this,
                mateName = dom.dataset.ruleMate,
                value = dom.value;

            // 查找符合mate条件的dom
            var hasNameDomArray = self._serialize("input[name='" + mateName + "']");

            for(var i = 0, len = hasNameDomArray.length; i < len; i++) {
                var item = hasNameDomArray[i];

                if(item.value != value) {
                    self.errMsg = {
                        message: '输入内容不一致',
                        dom: item,
                        data: item.value
                    };

                    self.toast(dom, '输入内容不一致');

                    return false;
                }
            }

            return true;
        },

        /**
         * 输出提示内容
         * @param {HTMLElement} dom元素
         * @param {String} expandMsg 拓展提示
         */
        toast: function(dom, expandMsg) {
            if(!this.isShowErr) {
                return;
            }

            var errMsg = dom.dataset.ruleErrmsg || dom.dataset.ruleMatemsg || expandMsg;

            Util.ejs.ui.toast(errMsg || dom.placeholder || '');
        }
    };

    Util.form = {
        getInstance: function(options) {
            return new Form(options);
        }
    };

}(document, window.Util, window.Util.string));