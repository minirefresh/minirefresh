/**
 * 一些通用方法
 */
(function(exports) {
    /**
     * 将string字符串转为html对象,默认创一个div填充
     * 因为很常用，所以单独提取出来了
     * @param {String} strHtml 目标字符串
     * @return {HTMLElement} 返回处理好后的html对象,如果字符串非法,返回null
     */
    exports.parseHtml = function(strHtml) {
        if (typeof strHtml !== 'string') {
            return strHtml;
        }
        // 创一个灵活的div
        var i,
            a = document.createElement('div');
        var b = document.createDocumentFragment();

        a.innerHTML = strHtml;

        while ((i = a.firstChild)) {
            b.appendChild(i);
        }

        return b;
    };

    /**
     * 将对象渲染到模板
     * @param {String} template 对应的目标
     * @param {Object} obj 目标对象
     */
    exports.renderTemplate = function(template, obj) {
        return template.replace(/[{]{2}([^}]+)[}]{2}/g, function($0, $1) {
            return obj[$1] || '';
        });
    };

    // 定义一个计数器
    var counter = 0;

    /**
     * 添加测试数据
     * @param {String||HTMLElement} dom 目标dom
     * @param {Number} count 需要添加的数量
     * @param {Boolean} isReset 是否需要重置，下拉刷新的时候需要
     */
    exports.appendTestData = function(dom, count, isReset) {
        if (typeof dom === 'string') {
            dom = document.querySelector(dom);
        }
        
        if (isReset) {
            dom.innerHTML = '';
            counter = 0;
        }

        var template = '<li class="list-item"><h3 class="msg-title">{{title}}</h3><span class="msg-fs14 msg-date">{{date}}</span></li>';

        var html = '',
            dateStr = (new Date()).toLocaleString();

        for (var i = 0; i < count; i++) {
            counter++;
            html += exports.renderTemplate(template, {
                title: '测试第【' + counter + '】条新闻标题',
                date: dateStr
            });
        }

        var child = exports.parseHtml(html);
        
        

        dom.appendChild(child);
    };
})(window.Common = {});