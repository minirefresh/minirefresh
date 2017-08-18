/**
 * 作者: 戴荔春
 * 创建时间: 2017/06/16
 * 版本: [1.0, 2017/06/16 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: mui的图片轮播的二次封装，简化使用
 * 类似于下拉刷新一样的封装，自动处理业务数据
 */
(function() {
    "use strict";

    /**
     * 全局生效默认设置
     * 默认设置可以最大程度的减小调用时的代码
     */
    var defaultSetting = {
        container: '#gallery',
        isLoop: true,
        isAuto: false,
        autoTime: 3000,
        // 默认为每一行显示2个item,只有每一个item多张图时有效,也就是每一个item为数组时有效
        perLineItem: 2,
        // 最大的高度，100%代表自适应，可以是绝对数字，例如100px
        maxImgHeight: '100%',
        // 同上，只不过为null代表不设置
        minImgHeight: null,
        // 是否显示轮播的小点
        isShowIndicator: true,
        // 是否显示下面的翻页设置，如果显示了，会有上一页，下一页的选项
        isShowPageIndicator: false
    };

    /**
     * 图片轮播的构造函数
     * @param {Object} options 配置参数，和init以及_initData的一致
     * @constructor
     */
    function Gallery(options) {

        options = Util.extend({}, defaultSetting, options);

        this.container = Util.selector(options.container);

        this._initData(options);
    }

    Gallery.prototype = {
        /**
         * 初始化数据单独提取，方便refresh使用
         * @param {Object} options 配置参数
         */
        _initData: function(options) {
            options.data = options.data || [];
            this.options = options;

            if (!this._validate()) {
                // 因为验证是强制性的，因此直接抛出错误
                throw new Error('验证错误，图片轮播的传入格式非法，请检查代码');
            }

            this._render();
            this._addEvent();
            this._dealUrl();
        },
        /**
         * 如果传入数据有url，需要对url进行处理
         */
        _dealUrl: function() {
            var self = this,
                options = this.options;

            if (options.url) {
                options.success = function(response) {
                    var data;
                    
                    if (options.dataChange) {
                        data = options.dataChange(response);
                    } else {
                        data = Util.dataProcess(response, {
                            dataPath: 'custom.gallery'
                        }).data;
                    }

                    if (data) {
                        options.data = data;
                        // 重新渲染,这时候数据已经改变
                        self._render();
                        self._addEvent();
                    }
                };
                
                // ajax设置有一些特别的处理，目前是为了防止gallery中的data和ajax中的data的冲突
                var ajaxOptions = Util.extend({}, options);

                ajaxOptions.data = ajaxOptions.dataRequest;

                Util.ajax(ajaxOptions);
            }
        },
        /**
         * 进行一次全局验证，验证输入的合法性
         * 这个验证是强制性的
         */
        _validate: function() {
            var data = this.options.data,
                flag = true;

            if (!this.container) {
                flag = false;
            } else if (!data || !Array.isArray(data)) {
                flag = false;
            }

            return flag;
        },
        /**
         * 视图的渲染和数据分离，采用内部的数据
         */
        _render: function() {
            // 目前暂时需要经过一次转换
            this.options.data = changeStruct(this.options.data);

            var container = this.container;

            var html = this._renderGenHtml();

            // 将html解析成dom
            var content = Util.parseHtml(html);

            container.innerHTML = '';
            content && container.appendChild(content);
        },
        /**
         * 将视图渲染中的生成html单独抽取出来
         */
        _renderGenHtml: function() {
            var options = this.options,
                data = options.data,
                len = data.length,
                html = '';

            // TODO(dailc): html的具体生成还有优化余地，比如拼接方式的改变，比如one和array函数的复用

            // 生成 单个的轮播图片 tmpinfo是数据，isduplicate是是否重复
            var generateOneItemImg = function(tmpinfo, isduplicate) {
                var html = '';
                if (isduplicate) {
                    html += '<div class="mui-slider-item mui-slider-item-duplicate" >'
                } else {
                    html += '<div class="mui-slider-item">'
                }
                var idStr = tmpinfo.id ? ('id=' + tmpinfo.id) : '';
                var maxHeightStr = options['maxImgHeight'] ? ('max-height:' + options['maxImgHeight'] + ';') : '';
                var minHeightStr = options['minImgHeight'] ? ('min-height:' + options['minImgHeight'] + ';') : '';
                html += '<a class="slider-img-item"' + idStr + '>';
                html += '<img src="' + tmpinfo.url + '" style="' + maxHeightStr + minHeightStr + '">';
                if (tmpinfo.title) {
                    html += '<p class="mui-slider-title">' + tmpinfo.title + '</p>';
                }
                html += '</a>';
                html += '</div>';
                return html;
            };

            // 生成多个的轮播图片 tmpArray是数据，isduplicate是是否重复
            var generateArrayItemsImg = function(tmpArray, isduplicate) {
                var html = '';
                if (isduplicate) {
                    html += '<div class="mui-slider-item mui-slider-item-duplicate" >'
                } else {
                    html += '<div class="mui-slider-item">'
                }
                // 默认是grid-view
                html += '<ul class="mui-table-view mui-grid-view">';
                var len = tmpArray.length;
                var widthClass = 'mui-col-xs-' + 12 / options['perLineItem'];
                // 每一个item的宽度由外部option控制,只有1/2 1/3  1/4 这三种
                for (var i = 0; i < len; i++) {
                    var idStr = tmpArray[i].id ? ('id=' + tmpArray[i].id) : '';
                    var maxHeightStr = options['maxImgHeight'] ? ('max-height:' + options['maxImgHeight'] + ';') : '';
                    var minHeightStr = options['minImgHeight'] ? ('min-height:' + options['minImgHeight'] + ';') : '';
                    html += ' <li class="mui-table-view-cell mui-media slider-img-item ' + widthClass + '" ' + idStr + '>';
                    html += '<a> ';
                    html += '<img class="mui-media-object" src="' + tmpArray[i].url + '" style="' + maxHeightStr + minHeightStr + '">';
                    if (tmpArray[i].title) {
                        html += '<div class="mui-media-body">' + tmpArray[i].title + '</div>';
                    }
                    html += '</a>';
                    html += '</li>';
                }
                html += '</ul>';
                html += '</div>';
                return html;
            };

            // 轮播的头部
            html += '<div class="mui-slider">';
            // 增加 mui-slider-loop
            if (options['isLoop']) {
                // 如果开启loop
                // 需要注意的是,如果开启了loop,需要额外增加两个节点,循环轮播：
                // 第一个节点是最后一张轮播,最后一个节点是第一张轮播
                html += '<div class="mui-slider-group mui-slider-loop">';
            } else {
                html += '<div class="mui-slider-group">';
            }
            // 内容
            if (options['isLoop']) {
                var tmpI = len - 1;
                // 开启循环额外增加的节点,第一个节点是最后一张轮播
                if (Array.isArray(data[(tmpI)])) {
                    // 数组对象
                    html += generateArrayItemsImg(data[(tmpI)], true);
                } else if (data[tmpI]) {
                    // 普通的对象
                    html += generateOneItemImg(data[(tmpI)], true);
                }
            }
            for (var i = 0; i < len; i++) {
                if (Array.isArray(data[(i)])) {
                    // 数组对象
                    html += generateArrayItemsImg(data[(i)], false);
                } else if (data[tmpI]) {
                    // 普通的对象
                    html += generateOneItemImg(data[(i)], false);
                }
            }
            if (options['isLoop']) {
                // 开启循环额外增加的节点,最后一个节点是第一张轮播
                var tmpI = 0;
                if (Array.isArray(data[(tmpI)])) {
                    // 数组对象
                    html += generateArrayItemsImg(data[(tmpI)], true);
                } else if (data[tmpI]) {
                    // 普通的对象
                    html += generateOneItemImg(data[(tmpI)], true);
                }
            }

            // 补齐mui-slider-group
            html += '</div>';

            if (options['isShowIndicator']) {
                // 动态添加 indicator
                html += '<div class="mui-slider-indicator">';
                for (var i = 0; i < len; i++) {
                    if (i == 0) {
                        html += '<div class="mui-indicator mui-active"></div>'; //默认从0开始
                    } else {
                        html += '<div class = "mui-indicator"></div>';
                    }
                }
                // 补齐indicator
                html += '</div>';
            }
            if (options['isShowPageIndicator']) {
                // 动态添加 indicator
                html += '<div class="mui-slider-indicator">';
                html += '<span class="mui-action mui-action-previous mui-icon mui-icon-back"></span>';
                html += '<div class="mui-number">';

                html += '<span id="curr-gallery-index">1</span> / <span id="gallery-length">' + len + '</span>';

                html += '</div>';
                html += '<span class="mui-action mui-action-next mui-icon mui-icon-forward"></span>';
                // 补齐indicator
                html += '</div>';
            }
            // 补齐mui-slider
            html += '</div>';

            return html;
        },
        /**
         * 增加事件，包括
         * 轮播图片的监听
         * 图片滑动的监听，等等
         */
        _addEvent: function() {
            var container = this.container,
                options = this.options,
                itemClick = options.itemClick;

            /**
             * 图片轮播初始化（不可缺少，否则无法正常显示）
             * 这里由于 mui-slider是mui的特定空间,所以需要mui()特定的选择器才行
             * 用zepto或者原生都不行
             */
            var gallery = mui(container);
            var autoTime = options.autoTime;

            if (!options.isAuto) {
                autoTime = 0;
            }
            gallery.slider({
                // 轮播周期，默认为0：不轮播
                interval: autoTime
            });

            // 先取消轮播上的所有事件
            mui(container).off();

            // item绑定
            mui(container).on('tap', '.slider-img-item', function(e) {
                var id = this.getAttribute("id");

                // ios阻止事件冒泡
                e.preventDefault();
                itemClick && itemClick(e, id);

                return false;
            });

            // 如果显示小点，对它进行监听
            if (options.isShowIndicator) {
                mui(container).on('tap', '.mui-slider-indicator .mui-indicator', function(e) {
                    var index = [].indexOf.call(this.parentNode.childNodes, this);

                    gallery.slider().gotoItem(index);
                    e.preventDefault();

                    return false;
                });
            }

            // 如果显示翻页
            if (options.isShowPageIndicator) {
                mui(container).on('tap', '.mui-slider-indicator .mui-action-previous', function(e) {
                    gallery.slider().prevItem();
                    e.preventDefault();

                    return false;
                });
                mui(container).on('tap', '.mui-slider-indicator .mui-action-next', function(e) {
                    gallery.slider().nextItem();
                    e.preventDefault();

                    return false;
                });
            }

            // 最后将slider绑定到this上
            this.gallery = gallery;
        },
        /**
         * 重新刷新轮播,可以修改配置，相当于重新渲染一遍,但是不允许修改dom元素
         * @param {Object} options
         */
        update: function(options) {
            options = Util.extend({}, this.options, options);
            this._initData(options);

        },
        gotoItem: function(index, time) {
            this.gallery && this.gallery.slider().gotoItem(index, time);
        },
        nextItem: function() {
            this.gallery && this.gallery.slider().nextItem();
        },
        prevItem: function() {
            this.gallery && this.gallery.slider().prevItem();
        },
        getSlideNumber: function() {
            return this.gallery && this.gallery.slider().getSlideNumber();
        },
        destroy: function() {
            this.gallery && this.gallery.slider().destroy();

            // 同时回收整个轮播
            mui(container).off();
            // TODO: 一些其它工作

            return null;
        }
    };

    function changeStruct(data) {
        if (!data) {
            throw new Error('错误，数据为空！');
        }
        // TODO: 渲染时还需要优化，这一层转换其实是没有必要的，只不过现在复用的以前代码时临时需要这样监听

        var len = data.length,
            newData = [];

        for (var i = 0; i < len; i++) {
            var tmp = data[i];

            if (Array.isArray(tmp)) {
                // 不进行转换
                newData[i] = changeStruct(tmp);
            } else {
                newData[i] = {
                    id: tmp.guid || tmp.id,
                    title: tmp.title,
                    url: tmp.pic || tmp.url
                };
            }

        }

        return newData;
    }

    window.Gallery = Gallery;
})();