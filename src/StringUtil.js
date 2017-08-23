/**
 * 作者: 戴荔春
 * 创建时间: 2017/07/03
 * 版本: [2.0, 2017/07/03 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 字符串操作相关，例如邮箱验证，身份证验证等
 */
(function() {
    'use strict';

    /**
     * 正则表达式验证
     * @param {RegExp} reg 表达式
     * @param {String} str 目标字符串
     * @return {Boolean} 返回true或false
     */
    function checkReg(reg, str) {
        if (!str) {
            return false;
        }
        if (reg.test(str) === true) {
            return true;
        }
        
        return false;
    }

    /**
     * 验证码集合
     */
    var Wi = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1],
        ValideCode = [1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2];
        
    /**
     * 定义一些常量
     */
    var LEN_IDCARD_15 = 15,
        LEN_IDCARD_18 = 18,
        // 18为身份证中x的值
        VAL_IDCARD_X = 10,
        // 关键值校验需要的除余值
        VAL_CODE_POSITION_EXCEPT = 11,
        // 以下是身份证年月日操作相关
        IDX_IDCARD_15_YEAR_START = 6,
        IDX_IDCARD_15_YEAR_END = 8,
        IDX_IDCARD_15_MONTH_START = 8,
        IDX_IDCARD_15_MONTH_END = 10,
        IDX_IDCARD_15_DAY_START = 10,
        IDX_IDCARD_15_DAY_END = 12,
        IDX_IDCARD_18_YEAR_START = 6,
        IDX_IDCARD_18_YEAR_END = 10,
        IDX_IDCARD_18_MONTH_START = 10,
        IDX_IDCARD_18_MONTH_END = 12,
        IDX_IDCARD_18_DAY_START = 12,
        IDX_IDCARD_18_DAY_END = 14,
        ILLEGAL_IDCARD_TIPS = 'Illegal IdCard',
        // 身份证隐藏的值
        VAL_IDCARD_HIDDEN = '*';
    

    /**
     * 15位的身份验证
     */
    var idcard15 = {
        
        /**
         * 验证身份证的出生日期是否合法日期
         * 可以去除一些  1098-13-23 等一些非法格式
         * @param {String} idcard 身份证
         * @return {Boolean} 返回true或false
         */
        birthValidate: function(idcard) {
            var year = idcard.substring(IDX_IDCARD_15_YEAR_START, IDX_IDCARD_15_YEAR_END),
                month = idcard.substring(IDX_IDCARD_15_MONTH_START, IDX_IDCARD_15_MONTH_END),
                day = idcard.substring(IDX_IDCARD_15_DAY_START, IDX_IDCARD_15_DAY_END),
                tempDate = new Date(year, parseFloat(month) - 1, parseFloat(day));

            if (tempDate.getYear() !== parseFloat(year) || tempDate.getMonth() !== parseFloat(month) - 1 || tempDate.getDate() !== parseFloat(day)) {
                return false;
            } else {
                return true;
            }
        },
        
        /**
         * 获取身份证中的出生日期
         * 以 - 隔开
         * @param {String} idcard 身份证
         * @return {Boolean} 返回目标字符串
         * @example 2017-07-03
         */
        birthExtract: function(idcard) {
            var year = idcard.substring(IDX_IDCARD_15_YEAR_START, IDX_IDCARD_15_YEAR_END),
                month = idcard.substring(IDX_IDCARD_15_MONTH_START, IDX_IDCARD_15_MONTH_END),
                day = idcard.substring(IDX_IDCARD_15_DAY_START, IDX_IDCARD_15_DAY_END);

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
         * @param {String} idcard 身份证
         * @return {Boolean} 返回true或false
         */
        validate: function(idcard) {
            var sum = 0,
                arr = idcard.split('');

            if (arr[LEN_IDCARD_18 - 1].toLowerCase() === 'x') {
                arr[LEN_IDCARD_18 - 1] = VAL_IDCARD_X;
            }
            for (var i = 0; i < LEN_IDCARD_18 - 1; i++) {
                sum += Wi[i] * arr[i];
            }
            
            var valCodePosition = sum % VAL_CODE_POSITION_EXCEPT;

            if (arr[LEN_IDCARD_18 - 1] === ValideCode[valCodePosition]) {
                return true;
            } else {
                return false;
            }
        },
        
        /**
         * 获取身份证中的出生日期
         * 以 - 隔开
         * @param {String} idcard 身份证
         * @return {Boolean} 返回年份
         * @example 2017-07-03
         */
        birthExtract: function(idcard) {
            var year = idcard.substring(IDX_IDCARD_18_YEAR_START, IDX_IDCARD_18_YEAR_END),
                month = idcard.substring(IDX_IDCARD_18_MONTH_START, IDX_IDCARD_18_MONTH_END),
                day = idcard.substring(IDX_IDCARD_18_DAY_START, IDX_IDCARD_18_DAY_END);

            return year + '-' + month + '-' + day;
        }
    };

    var innerUtil = {
        
        /**
         * 检查字符串是否是数字
         * @param {String} str 目标字符串
         * @return {Boolean} true or false
         */
        isNum: function(str) {
            var reg = /^[0-9]*$/;
            
            return checkReg(reg, str);
        },
        
        /**
         * 判断是否为手机
         * @param {String} str 目标字符串
         * @return {Boolean} true or false
         */
        isPhoneNum: function(str) {
            var reg = /^(0|86|17951)?(13[0-9]|15[012356789]|17[0-9]|18[0-9]|14[57])[0-9]{8}$/;
            
            return checkReg(reg, str);
        },
        
        /**
         * 验证是否是手机号或电话号
         * @param {String} str 目标字符串
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
         * @param {String} str 目标字符串
         * @return {Boolean} true or false
         */
        isEmail: function(str) {
            // 验证一般的邮件即可，域名最多为  自定义+三级子域名
            var reg = /^(\w)+([-.]\w+)*@(\w)+((\.\w{2,4}){1,3})$/;
            
            return checkReg(reg, str);
        },
        
        /**
         * 判断是否为外部url
         * @param {String} str 目标字符串
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
         * @param {RegExp} reg 对应的正则表达式
         * @return {String} 返回过滤后的结果
         */
        excludeSpecial: function(str, reg) {
            if (!str) {
                return str;
            }

            // 去掉转义字符 与特殊字符  ，其实有另一种思路就是只提取合法的
            reg = reg || /[\\/|[\]\b\f\n\r\t`~!@#$^&%*()={}+《》':;',.<>?~！@#￥……&*（）——【】‘’；：”“'。，、？]/g;
            str = str.replace(reg, '');

            return str;
        },
        
        /**
         * 身份证验证相关
         */
        idcard: {
            
            /**
             * 验证身份证是否合法
             * @param {String} idcard 身份证
             * @param {Boolean} isAllow15 是否支持15位验证，默认为false
             * @return {Boolean} true or false
             */
            validate: function(idcard, isAllow15) {
                idcard = idcard || '';
                idcard = idcard.replace(/\s*/g, '');
                isAllow15 = isAllow15 || false;

                if (isAllow15 && idcard.length === LEN_IDCARD_15) {
                    // 仅仅验证出生日期
                    return idcard15.birthValidate(idcard);
                } else if (idcard.length === LEN_IDCARD_18) {
                    // 18位进行关键之校验以及出生日期校验
                    return idcard18.validate(idcard);
                }

                return false;
            },
            
            /**
             * 获取身份证中的出生日期
             * 以 - 隔开，如果身份证非法，返回 空字符串
             * @param {String} idcard 身份证
             * @param {Boolean} isAllow15 是否支持15位验证，默认为false
             * @return {String} 提取后的出生日期
             * @example 2017-07-03
             */
            birthExtract: function(idcard, isAllow15) {
                if (!this.validate(idcard, isAllow15)) {
                    console.error(ILLEGAL_IDCARD_TIPS);
                    
                    return '';
                }
                idcard = idcard.replace(/\s*/g, '');

                if (isAllow15 && idcard.length === LEN_IDCARD_15) {
                    return idcard15.birthExtract(idcard);
                } else if (idcard.length === LEN_IDCARD_18) {
                    return idcard18.birthExtract(idcard);
                } else {
                    return '';
                }
            },
            
            /**
             * 处理身份证号,隐藏中间四位
             * @param {String} idcard 身份证
             * @param {Boolean} isAllow15 是否支持15位验证，默认为false
             * @return {String} 隐藏关键信息后的身份证
             */
            birthEncode: function(idcard, isAllow15) {
                if (!this.validate(idcard, isAllow15)) {
                    console.error(ILLEGAL_IDCARD_TIPS);
                    
                    return idcard;
                }
                idcard = idcard.replace(/\s*/g, '');
                var result = '',
                    startIndex = 0,
                    endIndex = 0;

                // 先判断是15为身份证还是1
                if (isAllow15 && idcard.length === LEN_IDCARD_15) {
                    startIndex = IDX_IDCARD_15_YEAR_START;
                    endIndex = IDX_IDCARD_15_DAY_END;
                } else if (idcard.length === LEN_IDCARD_18) {
                    startIndex = IDX_IDCARD_18_YEAR_START;
                    endIndex = IDX_IDCARD_18_DAY_END;
                }

                // 隐藏日期格式 6位 10-14位为 年-月-日
                result += idcard.substring(0, startIndex);
                // 隐藏日期格式  6-idLen位为 日期
                for (var i = startIndex; i < endIndex; i++) {
                    result += VAL_IDCARD_HIDDEN;
                }
                result += idcard.substring(endIndex);

                return result;
            }
        }

    };
    
    exports.StringUtil = innerUtil;
})();
