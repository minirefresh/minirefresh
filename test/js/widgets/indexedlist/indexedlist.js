/**
 * 作者: 孙尊路
 * 创建时间: 2017/06/16 13:27:09
 * 版本: [1.0, 2017/6/16]
 * 版权: 江苏国泰新点软件有限公司
 * 描述：mui的索引的二次封装，简化使用，自动处理业务数据
 * 场景: 社区选择、通讯、选择城市、地区等
 * 效果: 打开手机OA-扩展功能-二维码扫描（ejs应用测试）可看到效果
 */

(function() {
	"use strict";
	// TODO(sunzl): 源码需要优化，现在是 bad case

	/**
	 * 全局生效默认设置
	 * 默认设置可以最大程度的减小调用时的代码
	 */
	var defaultOptions = {
		// 默认索引组件容器
		container: "#indexlist",
	};

	/**
	 * 索引列表的构造函数
	 * @param {Object} options 配置参数，和init以及_initData的一致
	 * @constructor
	 */
	function IndexedList(options) {

		options = Util.extend({}, defaultOptions, options);

		this.container = Util.selector(options.container);

		this._initData(options);
	}

	IndexedList.prototype = {
		/**
		 * 初始化数据单独提取，方便refresh使用
		 * @param {Object} options 配置参数
		 */
		_initData: function(options) {

			options.data = options.data || [];
			this.options = options;

			if(!this._validate()) {
				// 因为验证是强制性的，因此直接抛出错误
				throw new Error('验证错误，索引列表的传入格式非法，请检查代码');
			}

			this._render();
			this._addEvent();
			this._dealUrl();

		},
		/**
		 * 视图的渲染和数据分离，采用内部的数据
		 */
		_render: function() {
			
			// 设置页面索引高度
			this._selector("body").style.height="100%";
			this._selector("html").style.height="100%";
			// 渲染最外层
			var template = this._getTemplate();
			this._selector(this.options.container).innerHTML = template;

			// 渲染最里层，此时和业务数据绑定
			var tmpInfo = this.options.data;
			var litemplate = this._renderGenHtml(tmpInfo);
			this._selector("#indexedListData").innerHTML = litemplate;

			var indexedList = this._selector("#indexedList");
			// 加载搜索功能以及计算索引列表indexlist 高度hieght
			indexedList.style.height = (document.body.offsetHeight) + 'px';
			// 实例化索引
			new mui.IndexedList(indexedList);

		},
		/**
		 * 增加事件，包括
		 * 索引列表的监听
		 * 索引支持多选，等等
		 */
		_addEvent: function() {

			var itemClick = this.options.itemClick;
			mui(this.options.container).on('tap', 'li', function(e) {
			    
				if(this.classList.contains('mui-indexed-list-item')) {
					var resObj={
						text: this.innerText,
						value: this.id
					};
					itemClick && itemClick.call(this, resObj);
				}
			});

		},
		/**
		 * 如果传入数据有url，需要对url进行处理
		 */
		_dealUrl: function() {
			var self = this,
				options = this.options;
			if(options.url) {
				options.success = function(response) {
					var data;

					if(options.dataChange) {
						data = options.dataChange(response);
					} else {
						data = Util.dataProcess(response, {
							dataPath: ['custom.infolist', 'custom.infoList']
						}).data;
					}

					if(data) {
						options.data = data;
						// 重新渲染,这时候数据已经改变
						self._render();
					}
				};

				// ajax设置有一些特别的处理，目前是为了防止gallery中的data和ajax中的data的冲突
				var ajaxOptions = Util.extend({}, options);

				ajaxOptions.data = ajaxOptions.dataRequest;

				Util.ajax(ajaxOptions);
			}
		},
		/**
		 * 先获取模板，后渲染
		 */
		_getTemplate: function() {
			var self = this;
			// 自定义模板
			var template = '<div id="indexedList" class="mui-indexed-list">\
				<div class="mui-indexed-list-search mui-input-row mui-search">\
					<input type="search" class="mui-input-clear mui-indexed-list-search-input" placeholder="按字母搜索关键字">\
				</div>\
				<div class="mui-indexed-list-bar">\
					<a>A</a>\
					<a>B</a>\
					<a>C</a>\
					<a>D</a>\
					<a>E</a>\
					<a>F</a>\
					<a>G</a>\
					<a>H</a>\
					<a>I</a>\
					<a>J</a>\
					<a>K</a>\
					<a>L</a>\
					<a>M</a>\
					<a>N</a>\
					<a>O</a>\
					<a>P</a>\
					<a>Q</a>\
					<a>R</a>\
					<a>S</a>\
					<a>T</a>\
					<a>U</a>\
					<a>V</a>\
					<a>W</a>\
					<a>X</a>\
					<a>Y</a>\
					<a>Z</a>\
				</div>\
				<div class="mui-indexed-list-alert"></div>\
				<div class="mui-indexed-list-inner">\
					<div class="mui-indexed-list-empty-alert">没有数据</div>\
					<ul class="mui-table-view community-list" id="indexedListData">\
					</ul>\
				</div>\
			</div>';

			return template;
		},
		/**
		 * 将视图渲染中的生成html单独抽取出来
		 */
		_renderGenHtml: function(data) {
			var html = '';
			if(data && Array.isArray(data)) {

				mui.each(data, function(key, value) {
					value.firstletter = (value.firstletter).toUpperCase()
					html += '<li data-group="' + value.firstletter + '" class="mui-table-view-divider mui-indexed-list-group">' + value.firstletter + '</li>';
					if(value.category && Array.isArray(value.category)) {
						var litemplate = '<li class="mui-table-view-cell mui-indexed-list-item" id="{{value}}">{{text}}</li>';
						var tmpInfo = value.category;
						mui.each(tmpInfo, function(key, value) {
							html += Mustache.render(litemplate, value);
						});
					} else {
						throw new Error("传入IndexedList参数必须是数组且不为空！");
					}
				});

			} else {
				throw new Error("传入data参数必须是JSON数组且不为空！");
			}
			return html;
		},

		/**
		 * 进行一次全局验证，验证输入的合法性
		 * 这个验证是强制性的
		 */
		_validate: function() {
			var data = this.options.data,
				flag = true;

			if(!this.container) {
				flag = false;
			} else if(!data || !Array.isArray(data)) {
				flag = false;
			}

			return flag;
		},
		_selector: function(el) {
			// 减少耦合
			return document.querySelector(el);
		}
	};

	window.IndexedList = IndexedList;
})();



/**
 * 为了引用简单,合并IndexedList,无需关注具体实现,维护时可与mui版本同步更新
 * 类似联系人应用中的联系人列表，可以按首字母分组
 * 右侧的字母定位工具条，可以快速定位列表位置
 **/

(function($, window, document) {

	var classSelector = function(name) {
		return '.' + $.className(name);
	}

	var IndexedList = $.IndexedList = $.Class.extend({
		/**
		 * 通过 element 和 options 构造 IndexedList 实例
		 **/
		init: function(holder, options) {
			var self = this;
			self.options = options || {};
			self.box = holder;
			if(!self.box) {
				throw "实例 IndexedList 时需要指定 element";
			}
			self.createDom();
			self.findElements();
			self.caleLayout();
			self.bindEvent();
		},
		createDom: function() {
			var self = this;
			self.el = self.el || {};
			//styleForSearch 用于搜索，此方式能在数据较多时获取很好的性能
			self.el.styleForSearch = document.createElement('style');
			(document.head || document.body).appendChild(self.el.styleForSearch);
		},
		findElements: function() {
			var self = this;
			self.el = self.el || {};
			self.el.search = self.box.querySelector(classSelector('indexed-list-search'));
			self.el.searchInput = self.box.querySelector(classSelector('indexed-list-search-input'));
			self.el.searchClear = self.box.querySelector(classSelector('indexed-list-search') + ' ' + classSelector('icon-clear'));
			self.el.bar = self.box.querySelector(classSelector('indexed-list-bar'));
			self.el.barItems = [].slice.call(self.box.querySelectorAll(classSelector('indexed-list-bar') + ' a'));
			self.el.inner = self.box.querySelector(classSelector('indexed-list-inner'));
			self.el.items = [].slice.call(self.box.querySelectorAll(classSelector('indexed-list-item')));
			self.el.liArray = [].slice.call(self.box.querySelectorAll(classSelector('indexed-list-inner') + ' li'));
			self.el.alert = self.box.querySelector(classSelector('indexed-list-alert'));
		},
		caleLayout: function() {
			var self = this;
			var withoutSearchHeight = (self.box.offsetHeight - self.el.search.offsetHeight) + 'px';
			self.el.bar.style.height = withoutSearchHeight;
			self.el.inner.style.height = withoutSearchHeight;
			var barItemHeight = ((self.el.bar.offsetHeight - 40) / self.el.barItems.length) + 'px';
			self.el.barItems.forEach(function(item) {
				item.style.height = barItemHeight;
				item.style.lineHeight = barItemHeight;
			});
		},
		scrollTo: function(group) {
			var self = this;
			var groupElement = self.el.inner.querySelector('[data-group="' + group + '"]');
			if(!groupElement || (self.hiddenGroups && self.hiddenGroups.indexOf(groupElement) > -1)) {
				return;
			}
			self.el.inner.scrollTop = groupElement.offsetTop;
		},
		bindBarEvent: function() {
			var self = this;
			var pointElement = null;
			var findStart = function(event) {
				if(pointElement) {
					pointElement.classList.remove('active');
					pointElement = null;
				}
				self.el.bar.classList.add('active');
				var point = event.changedTouches ? event.changedTouches[0] : event;
				pointElement = document.elementFromPoint(point.pageX, point.pageY);
				if(pointElement) {
					var group = pointElement.innerText;
					if(group && group.length == 1) {
						pointElement.classList.add('active');
						self.el.alert.innerText = group;
						self.el.alert.classList.add('active');
						self.scrollTo(group);
					}
				}
				event.preventDefault();
			};
			var findEnd = function(event) {
				self.el.alert.classList.remove('active');
				self.el.bar.classList.remove('active');
				if(pointElement) {
					pointElement.classList.remove('active');
					pointElement = null;
				}
			};
			self.el.bar.addEventListener($.EVENT_MOVE, function(event) {
				findStart(event);
			}, false);
			self.el.bar.addEventListener($.EVENT_START, function(event) {
				findStart(event);
			}, false);
			document.body.addEventListener($.EVENT_END, function(event) {
				findEnd(event);
			}, false);
			document.body.addEventListener($.EVENT_CANCEL, function(event) {
				findEnd(event);
			}, false);
		},
		search: function(keyword) {
			var self = this;
			keyword = (keyword || '').toLowerCase();
			var selectorBuffer = [];
			var groupIndex = -1;
			var itemCount = 0;
			var liArray = self.el.liArray;
			var itemTotal = liArray.length;
			self.hiddenGroups = [];
			var checkGroup = function(currentIndex, last) {
				if(itemCount >= currentIndex - groupIndex - (last ? 0 : 1)) {
					selectorBuffer.push(classSelector('indexed-list-inner li') + ':nth-child(' + (groupIndex + 1) + ')');
					self.hiddenGroups.push(liArray[groupIndex]);
				};
				groupIndex = currentIndex;
				itemCount = 0;
			}
			liArray.forEach(function(item) {
				var currentIndex = liArray.indexOf(item);
				if(item.classList.contains($.className('indexed-list-group'))) {
					checkGroup(currentIndex, false);
				} else {
					var text = (item.innerText || '').toLowerCase();
					var value = (item.getAttribute('data-value') || '').toLowerCase();
					var tags = (item.getAttribute('data-tags') || '').toLowerCase();
					if(keyword && text.indexOf(keyword) < 0 &&
						value.indexOf(keyword) < 0 &&
						tags.indexOf(keyword) < 0) {
						selectorBuffer.push(classSelector('indexed-list-inner li') + ':nth-child(' + (currentIndex + 1) + ')');
						itemCount++;
					}
					if(currentIndex >= itemTotal - 1) {
						checkGroup(currentIndex, true);
					}
				}
			});
			if(selectorBuffer.length >= itemTotal) {
				self.el.inner.classList.add('empty');
			} else if(selectorBuffer.length > 0) {
				self.el.inner.classList.remove('empty');
				self.el.styleForSearch.innerText = selectorBuffer.join(', ') + "{display:none;}";
			} else {
				self.el.inner.classList.remove('empty');
				self.el.styleForSearch.innerText = "";
			}
		},
		bindSearchEvent: function() {
			var self = this;
			self.el.searchInput.addEventListener('input', function() {
				var keyword = this.value;
				self.search(keyword);
			}, false);
			$(self.el.search).on('tap', classSelector('icon-clear'), function() {
				self.search('');
			}, false);
		},
		bindEvent: function() {
			var self = this;
			self.bindBarEvent();
			self.bindSearchEvent();
		}
	});

	//mui(selector).indexedList 方式
	$.fn.indexedList = function(options) {
		//遍历选择的元素
		this.each(function(i, element) {
			if(element.indexedList) return;
			element.indexedList = new IndexedList(element, options);
		});
		return this[0] ? this[0].indexedList : null;
	};

})(mui, window, document);