/**
 * 作者: 郭天琦
 * 创建时间: 2017/06/19
 * 版本: [1.0, 2017/06/19 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 地区选择
 */

(function(doc, Util) {
    "use strict";

    // 外层模板
    var outerListTempl =
        '<div class="em-province-area mui-scroll-wrapper">' +
        '<ul class="em-province-list mui-scroll" data-type="province">' +
        '</ul>' +
        '</div>' +
        '<div class="em-city-area mui-scroll-wrapper">' +
        '<ul class="em-city-list cur mui-scroll" data-type="city">' +
        '</ul>' +
        '</div>';

    var defaultSetting = {
        top: 0,
        province: [],
        city: [],
        provinceValue: '',
        cityValue: '',
        areaCode: '',
        litemplate: '<li class="em-list-item" data-areacode="{{value}}" data-index="{{index}}">{{{text}}}</li>',
        proviceActiveCls: 'cur',
        cityActiveCls: 'cur',
        isClose: true,
        provinceIndex: 0,
        cityIndex: 0,
        isMask: true
    };

    /**
     * 使用
     * @constructor
     * @param {options} 一些配置参数
     * container {HTMLElement} 父级元素、容器元素 必填
     * proviceActiveCls {String} 省份高亮样式 默认为cur
     * cityActiveCls {String} 城市高亮样式 默认为cur
     * isClose {Boolean} true or false true为关闭，false为不关闭 默认为true
     * isMask {Boolean} true or false 是否启用遮罩 true为启用遮罩
     * itemClick {Function} 回掉函数 必填
     */
    function AddrSelect(options) {
        var self = this;
        // 检测环境
        var optionsArray = [{
            key: window.cityData3,
            value: '请引入city.data-3.js'
        }, {
            key: options,
            value: '请传入配置项!'
        }, {
            key: options.container,
            value: '请传入容器'
        }];

        self.environment(optionsArray);

        var parent = Util.selector(options.container);

        options.container = parent;

        if(!options.itemClick && !(typeof options.itemClick == 'function')) {
            throw new Error('请传入回调函数itemClick');
        }

        self.itemClick = options.itemClick;

        // 预先插入外层模板
        self._insertTempl(parent, outerListTempl);
        self = Util.extend(self, defaultSetting, options);

        // 设置顶部高度
        parent.style.top = parseInt(self.top) + 'px';

        if(self.isMask) {
            self._makeMask();
        }

        self.domArray = {
            provinceList: parent.querySelector('[data-type=province]'),
            cityList: parent.querySelector('[data-type=city]')
        };

        // 解析城市地区
        self._analysisCityData(cityData3);
        self._showCity();
        self._initListeners();
    }

    /**
     * 定义原型
     */
    AddrSelect.prototype = {

        /**
         * 显示组件
         */
        show: function() {
            this.container.style.display = 'block';
            this.maskEle.style.display = 'block';
        },

        /**
         * 隐藏组件
         */
        hide: function() {
            this.container.style.display = 'none';
            this.maskEle.style.display = 'none';
        },
        
        /**
         * 如果当前是显示状态则隐藏组件
         */
        toggle: function() {
            var container = this.container,
                maskEle = this.maskEle;
                
            if(container.style.display == 'block') {
                container.style.display = 'none';
                maskEle.style.display = 'none';
            }
            else {
                container.style.display = 'block';
                maskEle.style.display = 'block';
            }
        },

        /**
         * 插入外层模板
         * @param {HTMLElement} container
         * @param {String} templ
         */
        _insertTempl: function(container, templ) {
            container.innerHTML = templ;

            // 优化滚动条
            mui('.mui-scroll-wrapper').scroll({
                scrollY: true,
                scrollX: false
            });
        },

        /**
         * 检测是否引入了必要的库与options
         * @param {Array Object} options 要检测的项
         */
        environment: function(options) {
            for(var i = 0, len = options.length; i < len; i++) {

                if(!options[i].key) {
                    throw new Error(options[i].value);
                }

            }
        },

        /**
         * 解析城市地区
         * @param {JSON} cityData 城市地区json
         */
        _analysisCityData: function(cityData) {
            var self = this,
                province = self.province = [],
                domArray = self.domArray;

            cityData.forEach(function(item, index) {

                province.push({
                    text: item.text,
                    value: item.value,
                    index: index
                });

            });

            self._ergodic(province, domArray.provinceList);
        },

        /**
         * 遍历渲染html结构
         * @param {Array} array 数组
         * @param {HTMLElement} dom 要插入的元素
         * @param {Number} cityIndex 下标 默认显示
         */
        _ergodic: function(array, dom, cityIndex) {
            var htmlItem = '',
                cityListChild = this.domArray.cityList.children,
                templList = this.litemplate;

            array.forEach(function(item) {
                htmlItem += Mustache.render(templList, item);
            });

            dom.innerHTML = htmlItem;

            // 选中默认城市
            if(cityIndex != undefined) {
                cityListChild[cityIndex].classList.add('cur');
            }
        },

        _initListeners: function() {
            var that = this,
                maskEle = that.maskEle,
                parentDom = that.container,
                isClose = that.isClose,
                provinceList = that.domArray.provinceList,
                provinceActiveCls = that.proviceActiveCls,
                cityList = that.domArray.cityList,
                cityActiveCls = that.cityActiveCls;

            that.provinceName = provinceList.children[0].innerHTML;
            that.cityName = cityList.children[0].innerHTML;
            that.areaCode = cityList.children[0].dataset.areacode;

            // 点击省份列表
            that._addEvent(provinceList, 'li', function() {
                var _self = this,
                    index = _self.dataset.index,
                    children = cityData3[index].children[0].children,
                    curSiblings = that.siblings(_self);

                that.provinceIndex = index;
                that.provinceName = _self.innerHTML;

                _self.classList.add(provinceActiveCls);

                curSiblings.forEach(function(item, index) {
                    item.classList.remove(provinceActiveCls);
                });

                // 添加城市
                that._ergodic(children, cityList);
            });

            // 点击城市列表
            that._addEvent(cityList, 'li', function() {
                var _self = this,
                    curSiblings = that.siblings(_self);

                _self.classList.add(cityActiveCls);
                cityList.classList.remove('cur');

                curSiblings.forEach(function(item) {
                    item.classList.remove(cityActiveCls);
                });

                [].slice.call(cityList.children).forEach(function(item, index) {
                    if(item.classList.contains(cityActiveCls)) {
                        that.cityIndex = index;
                    }
                });

                // 关闭组件
                if(isClose == true) {
                    parentDom.style.display = 'none';
                }

                var result = {
                    areaCode: _self.dataset.areacode,
                    cityName: _self.innerHTML,
                    provinceName: that.provinceName
                };

                maskEle.style.display = 'none';

                that.itemClick.call(_self, result);
            });

            // 遮罩点击
            that._addEvent(maskEle, '', function() {
                this.style.display = 'none';
                parentDom.style.display = 'none';
            });
        },

        /**
         * 重写下addEventListener
         * @param {HTMLElement} parentEle要绑定的元素
         * @param {HTMLElement} childEle 指向的元素
         * @param {Function} callback回掉函数
         */
        _addEvent: function(parentEle, childEle, callback) {
            childEle = childEle.toUpperCase();
            parentEle.addEventListener('tap', function(evt) {
                var target = evt.target

                while(childEle && (target.tagName != childEle)) {
                    target = target.parentNode;
                }

                callback.call(target);
            });
        },

        /**
         * 获取同级节点
         * @param {HTMLElement} 当前元素
         */
        siblings: function(dom) {
            var data = [],
                parent = dom.parentNode.children;

            for(var i = 0, len = parent.length; i < len; i++) {
                if(dom != parent[i]) {
                    data.push(parent[i]);
                }
            }

            return data;
        },

        /**
         * 默认显示城市
         * @param {Array} array 要遍历的数组
         * @param {Function} callback 回调函数
         */
        _showCity: function(provinceIndex, cityIndex) {
            provinceIndex = provinceIndex || 0;
            cityIndex = cityIndex || 0;

            var self = this,
                children = cityData3[provinceIndex].children[0].children,
                domArray = self.domArray,
                provinceList = domArray.provinceList,
                cityList = domArray.cityList;

            provinceList.children[provinceIndex].classList.add('cur');

            this._ergodic(children, cityList, cityIndex);
        },

        /**
         * 创建遮罩
         */
        _makeMask: function() {
            var elMask = doc.createElement('div');

            elMask.id = 'em-mask';
            elMask.style.cssText = 'display: none; position: fixed; left: 0; right: 0; bottom: 0; background-color: #666; z-index: 10;';
            elMask.style.top = this.top;

            doc.body.appendChild(elMask);

            this.maskEle = doc.getElementById('em-mask');
        }
    };

    window.AddrSelect = AddrSelect;

}(document, window.Util));