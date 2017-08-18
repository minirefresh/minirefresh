/**
 * 作者: 戴荔春
 * 创建时间: 2017/07/03 
 * 版本: [1.0, 2017/07/05 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 与html页面操作相关，包括
 * 富文本，添加详情等等
 */
(function() {
    "use strict";
    var innerUtil = {
        /**
         * 屏蔽字符串中的脚本标签与object标签
         * 一般用于富文本渲染之前
         * @param {String} str
         */
        filterScript: function(str) {
            var reg1 = /<object[^>]*>(\w|\W)*<\/object[^>]*>/gi;
            var reg2 = /<script[^>]*>(\w|\W)*<\/script[^>]*>/gi;          
            
            return str.replace(reg1, '').replace(reg2, '');
        },
        /**
         * 添加富文本到容器中
         * @param {String || HTMLElement} container 
         * @param {String} richText
         */
        appendRichText: function(container, richText) {
            container = Util.selector(container);
            richText = richText || '';
            richText = this.filterScript(richText);

            var dom = Util.parseHtml(richText);

            container.appendChild(dom);
        },
        /**
         * 简化详情的设置
         * @param {Object} options
         * 包括
         * dom, 
         * template, 
         * data
         * richTxtSelector
         * richTxt 富文本数据
         */
        setDetail: function(options) {
            if (!options) {
                return;
            }
            var container = Util.selector(options.container);
            var template = Util.selector(options.template);
            var richTxt = options.richTxt || '';
            var richTxtSelector = options.richTxtSelector || '';
            var data = options.data || {};

            if (!container || !template) {
                return;
            }
            
            // 先清空
            container.innerHTML = '';
            
            
            var result = Mustache.render(template.innerHTML, data);

            var dom = Util.parseHtml(result);

            container.appendChild(dom);

            if (richTxt && richTxtSelector) {
                // 必须添加完毕后再找
                richTxtSelector = Util.selector(options.richTxtSelector);

                // 单独映射富文本，富文本必须单独通过api添加
                this.appendRichText(richTxtSelector, richTxt);
            }
        }
    };

    Util.html = innerUtil;

})();