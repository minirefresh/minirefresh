/**
 * 作者: 戴荔春
 * 创建时间: 2017/07/03
 * 版本: [2.0, 2017/07/03 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 字符串操作相关，例如邮箱验证，身份证验证等
 */
(function() {
    "use strict";

    /**
     * 正则表达式验证
     */
    function checkReg(reg, str) {
        if (!str) {
            return false;
        }
        if (reg.test(str) == true) {
            return true;
        }
        return false;
    };
    /**
     * 验证码集合
     */
    var Wi = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1];
    var ValideCode = [1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2];

    /**
     * 15位的身份验证
     */
    var idcard15 = {
        /**
         * 验证身份证的出生日期是否合法日期
         * 可以去除一些  1098-13-23 等一些非法格式
         * @param {String} idcard
         */
        birthValidate: function(idcard) {
            // 18位生日认证为  6, 10 10, 12  12, 14
            var year = idcard.substring(6, 8);
            var month = idcard.substring(8, 10);
            var day = idcard.substring(10, 12);
            var tempDate = new Date(year, parseFloat(month) - 1, parseFloat(day));

            if (tempDate.getYear() !== parseFloat(year) || tempDate.getMonth() !== parseFloat(month) - 1 || tempDate.getDate() !== parseFloat(day)) {
                return false;
            } else {
                return true;
            }
        },
        /**
         * 获取身份证中的出生日期
         * 以 - 隔开
         * @param {String} idcard
         * @example 2017-07-03
         */
        birthExtract: function(idcard) {
           
            var year = idcard.substring(6, 8);
            var month = idcard.substring(8, 10);
            var day = idcard.substring(10, 12);
            return '19' + year + '-' + month + '-' + day;
        }
    };

    /**
     * 18位的身份验证
     */
    var idcard18 = {
        /**
         * 验证身份证是否合法
         * 采用了关键特征值进行校验
         * @param {String} idcard
         */
        validate: function(idcard) {
            var sum = 0,
                arr = idcard.split("");

            if (arr[17].toLowerCase() == 'x') {
                arr[17] = 10;
            }
            for (var i = 0; i < 17; i++) {
                sum += Wi[i] * arr[i];
            }

            var valCodePosition = sum % 11;

            if (arr[17] == ValideCode[valCodePosition]) {
                return true;
            } else {
                return false;
            }
        },
        /**
         * 获取身份证中的出生日期
         * 以 - 隔开
         * @param {String} idcard
         * @example 2017-07-03
         */
        birthExtract: function(idcard) {
            var year = idcard.substring(6, 10);
            var month = idcard.substring(10, 12);
            var day = idcard.substring(12, 14);
            return year + '-' + month + '-' + day;
        }
    };

    var innerUtil = {
        /**
         * 检查字符串是否是数字
         * @param {String} str
         * @return {Boolean} true or false
         */
        isNum: function(str) {
            var reg = /^[0-9]*$/;
            return checkReg(reg, str);
        },
        /**
         * 判断是否为手机
         * @param {String} str
         * @return {Boolean} true or false
         */
        isPhoneNum: function(str) {
            var reg = /^(0|86|17951)?(13[0-9]|15[012356789]|17[0-9]|18[0-9]|14[57])[0-9]{8}$/;
            return checkReg(reg, str);
        },
        /**
         * 验证是否是手机号或电话号
         * @param {String} str
         * @return {Boolean} true or false
         */
        isTelNum: function(str) {
            /**
             * 这是固定电话的正则
             * 区号 前面一个0，后面跟2-3位数字，区号后面可以加 - 也可以不加
             * 电话号 5-8位数字，不以0开头
             * 分机号 一般都是3位数字，我们认为大于等于3位，小于8位
             */
            var reg = /^(0\d{2,3}-?|\(0\d{2,3}\))?[1-9]\d{4,7}(-\d{3,8})?$/;
            return checkReg(reg, str) || this.isPhoneNum(str);
        },
        /**
         * 判断是否为邮箱
         * @param {String} str
         * @return {Boolean} true or false
         */
        isEmail: function(str) {
            // 验证一般的邮件即可，域名最多为  自定义+三级子域名
            var reg = /^(\w)+([-.]\w+)*@(\w)+((\.\w{2,4}){1,3})$/;
            return checkReg(reg, str);
        },
         /**
         * 判断是否为外部url
         * @param {String} str
         * @return {Boolean} true or false
         */
        isExternalUrl: function(str) {
            // http s ftp等
            var reg = /^(\/\/|http|https|ftp|file)/;
            return checkReg(reg, str);
        },
        /**
         * 过滤非法字符，过滤特殊字符与转义字符
         * @param {string} str 需要过滤的字符串
         * @return {String} 返回过滤后的结果
         */
        excludeSpecial: function(str, reg) {
            if (!str) {
                return str;
            }
                       
            // 去掉转义字符 与特殊字符  ，其实有另一种思路就是只提取合法的
            reg = reg || /[\\\/\b\f\n\r\t`~!@#$^&%*()=\|{}+《》':;',\[\].<>\/?~！@#￥……&*（）——【】‘’；：”“'。，、？]/g;
            str = str.replace(reg, '');
            
            return str;
        },
        /**
         * 身份证验证相关
         */
        idcard: {
            /**
             * 验证身份证是否合法
             * @param {String} idcard
             * @param {Boolean} isAllow15 是否支持15位验证，默认为false
             */
            validate: function(idcard, isAllow15) {
                idcard = idcard || '';
                idcard = idcard.replace(/\s*/g, "");
                isAllow15 = isAllow15 || false;

                if (isAllow15 && idcard.length === 15) {
                    // 仅仅验证出生日期
                    return idcard15.birthValidate(idcard);
                } else if (idcard.length === 18) {
                    // 18位进行关键之校验以及出生日期校验
                    return idcard18.validate(idcard);
                }

                return false;
            },
            /**
             * 获取身份证中的出生日期
             * 以 - 隔开，如果身份证非法，返回 空字符串
             * @param {String} idcard
             * @param {Boolean} isAllow15 是否支持15位验证，默认为false
             * @example 2017-07-03
             */
            birthExtract: function(idcard, isAllow15) {
                if (!this.validate(idcard, isAllow15)) {
                    console.error("Illegal IdCard");
                    return '';
                }
                idcard = idcard.replace(/\s*/g, "");

                if (isAllow15 && idcard.length === 15) {
                    return idcard15.birthExtract(idcard);
                } else if (idcard.length === 18) {
                    return idcard18.birthExtract(idcard);
                }
            },
            /**
             * 处理身份证号,隐藏中间四位
             * @param {String} idcard
             * @param {Boolean} isAllow15 是否支持15位验证，默认为false
             * @return {String} 隐藏关键信息后的身份证
             */
            birthEncode: function(idcard, isAllow15) {
                if (!this.validate(idcard, isAllow15)) {
                    console.error("Illegal IdCard");
                    return idcard;
                }
                idcard = idcard.replace(/\s*/g, "");
                var result = "";
                
                // 先判断是15为身份证还是1
                if (isAllow15 && idcard.length == 15) {
                    result += idcard.substring(0, 6);
                    // 隐藏日期格式 8位 7-12位为 日期
                    for (var i = 6; i < 12; i++) {
                        result += "*";
                    }
                    result += idcard.substring(12);
                } else if (idcard.length == 18) {
                    // 隐藏日期格式 6位 10-14位为 年-月-日
                    result += idcard.substring(0, 6);
                    // 隐藏日期格式 8位 10-12位为 日期
                    for (var i = 6; i < 14; i++) {
                        result += "*";
                    }
                    result += idcard.substring(14);
                }

                return result;
            }
        }

    };
    
    Util.string = innerUtil;

})();