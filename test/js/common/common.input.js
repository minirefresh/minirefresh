/**
 * 作者: 郭天琦
 * 创建时间: 2017年07月25日
 * 版本: [1.0, 2017/07/25 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 初始化搜索框
 */

(function(doc) {
    "use strict";
    
    try {
        var srhInputEle = Util.selector('.em-srhbar-input'),
            iconClearEle = Util.selector('.em-srhbar-icon-clear'),
            srhbarEle = Util.selector('.em-srhbar');
            
    } catch(e) {
        return;
    }

    var method = {

        tap: function() {
            srhbarEle.classList.add('active');
            srhbarEle.classList.remove('blur');
        },

        blur: function() {
            if(this.value == '' || this.value.length == 0) {
                srhbarEle.classList.remove('active');
                srhbarEle.classList.add('blur');
                iconClearEle.classList.add('hidden');
            }
        },

        input: function() {
            if(this.value == '' || this.value.length == 0) {
                iconClearEle.classList.add('hidden');
            } else {
                iconClearEle.classList.remove('hidden');
            }
        },

        clear: function() {
            srhInputEle.value = '';
            this.classList.add('hidden');
        },

        execute: function() {
            var self = this;

            if(iconClearEle && iconClearEle.nodeType == 1) {
                srhInputEle.addEventListener('tap', self.tap);
                srhInputEle.addEventListener('blur', self.blur);
                srhInputEle.addEventListener('input', self.input);
                iconClearEle.addEventListener('tap', self.clear);
            }
        }

    };

    window.addEventListener('DOMContentLoaded', function() {
        method.execute();
    });
}(document));