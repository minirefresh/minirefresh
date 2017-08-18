/**
 * 作者: 戴荔春
 * 创建时间: 2016/12/06
 * 版本: [1.0, 2017/05/25 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: ejs 2.1系列API在h5环境下的部分实现
 * 基于mui，目前只实现了部分ui相关的api
 * 请先引入ejsv2核心文件
 * 实现的模块有:
 * nativeUI
 * sql-用localstorage替代
 */
(function(exports) {
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
				if(!this.classList.contains(CLASS_ACTIVE)) {
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
			for(var i = 0; i < length; i++) {
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
				if(popupElement && e.target === popupElement && popupElement.classList.contains(CLASS_POPUP_OUT)) {
					removePopupElement();
				}
			});
			popupElement.style.display = 'block';
			document.body.appendChild(popupElement);
			popupElement.offsetHeight;
			popupElement.classList.add(CLASS_POPUP_IN);

			if(!backdrop.classList.contains(CLASS_ACTIVE)) {
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
					if(popupElement) {
						//如果是input 类型,就回调input内的文字
						//否则回调 btns的index
						var value = input ? input.value : (index || 0);
						callback && callback(value, {
							index: index || 0,
							value: value
						});
						if(animate !== false) {
							popupElement.classList.remove(CLASS_POPUP_IN);
							popupElement.classList.add(CLASS_POPUP_OUT);
						} else {
							removePopupElement();
						}
						popupStack.pop();
						//如果还有其他popup，则不remove backdrop
						if(popupStack.length) {
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
			if(allBtns && allBtns.length > 0) {
				for(var i = 0; i < allBtns.length; i++) {
					allBtns[i].addEventListener('click', handleEvent);
				}
			}
			if(popupStack.length) {
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
			if(!options || typeof options['content'] === 'undefined') {
				return;
			} else {
				if(typeof options === 'function') {
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
			if(!options || typeof options['content'] === 'undefined') {
				return;
			} else {
				if(typeof options === 'function') {
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
			if(!options || typeof options['content'] === 'undefined') {
				return;
			} else {
				if(typeof options === 'function') {
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
			if(popupStack.length) {
				popupStack[popupStack.length - 1]['close']();
				return true;
			} else {
				return false;
			}
		};
		var closePopups = function() {
			while(popupStack.length) {
				popupStack[popupStack.length - 1]['close']();
			}
		};
		obj.toast = function(message) {
			var duration = 2000;
			var toast = document.createElement('div');
			toast.classList.add(('mui-toast-container'));
			toast.innerHTML = '<div class="' + ('mui-toast-message') + '">' + message + '</div>';
			toast.addEventListener('webkitTransitionEnd', function() {
				if(!toast.classList.contains(CLASS_ACTIVE)) {
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
		 * @description 显示waiting对话框
		 * @param {String} title
		 * @param {Object} options
		 */
		exports.showWaiting = function(title, options) {
			if(h5DialogObj == null) {
				h5DialogObj = new H5WaitingDialog(title, options);
			} else {
				h5DialogObj.setTitle(title);
			}
			return h5DialogObj;
		};
		/**
		 * @description 关闭waiting对话框
		 */
		exports.closeWaiting = function() {
			if(h5DialogObj) {
				h5DialogObj.dispose();
				h5DialogObj = null;
			}
		};
		/**
		 * @description h5版本waiting dialog的构造方法
		 * @param {String} title
		 * @param {Object} options
		 * @constructor
		 */
		function H5WaitingDialog(title, options) {
			// h5版本,构造的时候生成一个dialog
			this.loadingDiv = createLoading();
			document.body.appendChild(this.loadingDiv);
			this.setTitle(title);
			if(options && options.padlock == true) {
				// 如果设置了点击自动关闭
				var that = this;
				this.loadingDiv.addEventListener('click', function() {
					that.close();
				});
			}
		};
		/**
		 * @description 设置提示标题方法,重新显示
		 * @param {String} title
		 */
		H5WaitingDialog.prototype.setTitle = function(title) {
			title = title || '';
			if(this.loadingDiv) {
				// 只有存在对象时才能设置
				this.loadingDiv.style.display = 'block';
				this.loadingDiv.querySelector('.tipsContent').innerText = title;
			} else {
				console.error('h5 dialog对象已经销毁,无法再次显示');
			}
		};
		/**
		 * @description 关闭后执行的方法,这里只是为了扩充原型
		 */
		H5WaitingDialog.prototype.onclose = function() {

		};
		/**
		 * @description 设置关闭dialog
		 */
		H5WaitingDialog.prototype.close = function() {
			if(this.loadingDiv) {
				this.loadingDiv.style.display = 'none';
				this.onclose();
			}
		};
		/**
		 * @description 销毁方法
		 */
		H5WaitingDialog.prototype.dispose = function() {
			// 将loadingDiv销毁
			this.loadingDiv && this.loadingDiv.parentNode && this.loadingDiv.parentNode.removeChild(this.loadingDiv);
		};
		/**
		 * @description 通过div和遮罩,创建一个H5版本loading动画(如果已经存在则直接得到)
		 * 基于mui的css
		 */
		function createLoading() {
			var loadingDiv = document.getElementById("MFRAME_LOADING");
			if(!loadingDiv) {
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
			if(options.title) {
				finalHtml += '<ul class="mui-table-view">';
				finalHtml += '<li class="mui-table-view-cell">';
				finalHtml += '<a class="titleActionSheet"><b>' + options.title + '</b></a>';
				finalHtml += '</li>';
				finalHtml += '</ul>';
			}
			finalHtml += '<ul class="mui-table-view">';
			// 添加内容
			if(options.items && Array.isArray(options.items)) {
				for(var i = 0; i < options.items.length; i++) {
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
			if(document.getElementById('actionSheetContent') == null) {
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
				//监听
				mui('body').on('tap', '.mui-popover-action li>a', function(e) {
					var title = this.innerText;

					// console.log('class:' + mClass);
					// console.log('点击,title:' + title + ',value:' + value);
					if(this.className.indexOf('titleActionSheet') == -1) {
						// 排除title的点击
						mui('#' + options.id).popover('toggle');
						if(this.className.indexOf('cancelActionSheet') == -1) {
							// 排除取消按钮,回调函数
							callback && callback(title);
						}
					}
				});
			} else {
				// 直接更改html
				document.getElementById('actionSheetContent').innerHTML = html;
			}
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
		 * @description mui的时间选择单例选择
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
			if(window.mui && window.mui.DtPicker) {
				if(oldDtType !== options.type) {
					//如果两次类别不一样,重新构造
					if(dtPicker) {
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
					if(options.type === 'date') {
						detail.result.date = rs.y.value + '-' + rs.m.value + '-' + rs.d.value;
						chooseCallBack && chooseCallBack(detail.result, detail.msg, detail);
					} else if(options.type === 'time') {
						detail.result.time = rs.h.value + ':' + rs.i.value;
						chooseCallBack && chooseCallBack(detail.result, detail.msg, detail);
					} else if(options.type === 'month') {
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
		 * @description mui的PopPicker,单例显示
		 * @param {options} 配置包括
		 * data 装载的数据
		 * @param {Function} chooseCallBack
		 */
		function showPopPicker(options, chooseCallBack) {
			//依赖于mui.min.css,mui.picker.min.css,mui.poppicker.css,mui.min.js,mui.picker.min.js,mui.poppicker.js
			if(window.mui && window.mui.PopPicker) {
				var layer = options.layer || 1;
				if(lastLayer !== layer) {
					//如果两次类别不一样,重新构造
					if(pPicker) {
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
					for(var i = 0; i < layer; i++) {
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
	 * @description 将小于10的数字前面补齐0,然后变为字符串返回
	 * @param {Number} number
	 * @return {String} 补齐0后的字符串
	 */
	function paddingWith0(number) {
		if(typeof number == 'number' || typeof number == 'string') {
			number = parseInt(number, 10);
			if(number < 10) {
				number = '0' + number;
			}
			return number;
		} else {
			return '';
		}
	}
	/**
	 * 拓展ejs 在h5mui下的api
	 * 所有参数和ejs保持一致就行了
	 * nativeUI 模块
	 */
	ejs.extendFucObj('nativeUI', {
		'toast': function(options) {
			if(!ejs.os.h5) {
				// v2的api中，只有h5中才能使用h5
				return;
			}
			var msg = '';
			options = options || {};
			if(typeof options === 'string') {
				msg = options;
			} else {
				msg = options.message;
			}
			h5MessageDialog.toast(msg);
		},
		'alert': function(options, callback) {
			if(!ejs.os.h5) {
				// v2的api中，只有h5中才能使用h5
				return;
			}
			var title = '',
				msg = '',
				btnName = '';
			options = options || {};
			if(typeof options === 'string') {
				msg = options;
				title = arguments[1] || '';
				btnName = arguments[2] || '确定';
				callback = arguments[3];
				options = {};
			} else {
				msg = options.message;
				title = options.title;
				btnName = options.buttonName || '确定';
			}
			options['content'] = msg;
			options['title'] = title;
			options['buttonValue'] = btnName;
			h5MessageDialog.createAlert(options, callback)
		},
		'confirm': function(options, callback) {
			if(!ejs.os.h5) {
				// v2的api中，只有h5中才能使用h5
				return;
			}
			options = options || {};
			options['title'] = options['title'] || '确认';
			var btnArray = [];
			var btn1 = options.btn1 || '取消';
			var btn2 = options.btn2 || (options.btn2 !== null ? '确定' : '');
			btn1 && btnArray.push(btn1);
			btn2 && btnArray.push(btn2);
			options['buttons'] = btnArray || ['确认', '取消'];
			options['content'] = options['message'];

			h5MessageDialog.createConfirm(options, function(index) {
				//index得转成ejs相应的index
				var index = -1 * (index + 1);
				var res = {
					'code': 1,
					'msg': '',
					'result': {
						"which": index
					}
				};
				callback && callback(res.result, res.msg, res);
			});
		},
		'prompt': function(options, callback) {
			if(!ejs.os.h5) {
				// v2的api中，只有h5中才能使用h5
				return;
			}
			options = options || {};
			options['content'] = options['text'] || '';
			options['title'] = options['title'] || '您好';
			options['tips'] = options['hint'] || '请输入内容';
			//目前只有h5中支持定制button
			options['buttons'] = options['buttons'] || ['确定', '取消'];
			
			h5MessageDialog.createPrompt(options, function(content) {
				//index得转成ejs相应的index
				var index = content? -1 : -2;
				var res = {
					'code': 1,
					'msg': '',
					'result': {
						"which": index,
						"content": content
					}
				};
				callback && callback(res.result, res.msg, res);
			});
			

		},
		/**
		 * @description actionsheet
		 */
		'actionSheet': function(options, callback) {
			if(!ejs.os.h5) {
				// v2的api中，只有h5中才能使用h5
				return;
			}
			options = options || {};
			options.items = options.items || [];
			actionsheet.createActionSheetShow(options, function(title) {
				var index = options.items.indexOf(title);
				var res = {
					'code': 1,
					'msg': '',
					'result': {
						"which": index,
						"content": title
					}
				};
				callback && callback(res.result, res.msg, res);
			});
		},
		/**
		 * @description 显示waiting对话框
		 * ejs下暂时没有title与options属性这个属性
		 * padlock  点击自动关闭--目前只有这个兼容h5版本
		 */
		'showWaiting': function(title, callback) {
			if(!ejs.os.h5) {
				// v2的api中，只有h5中才能使用h5
				return;
			}
			title = title || '';
			waitingDialog.showWaiting(title, {});

			callback && callback();
		},
		'closeWaiting': function() {
			if(!ejs.os.h5) {
				// v2的api中，只有h5中才能使用h5
				return;
			}
			waitingDialog.closeWaiting();
		},
		/**
		 * @description 拓展h5下的日期选择
		 */
		'pickDate': function(options, callback) {
			if(!ejs.os.h5) {
				// v2的api中，只有h5中才能使用h5
				return;
			}
			options = options || {};
			var datetime = options['datetime'];
			if(!datetime) {
				// 如果不存在，默认为当前时间
				var dateNow = new Date();
				datetime = dateNow.getFullYear() + '-' + paddingWith0(dateNow.getMonth() + 1) + '-' + paddingWith0(dateNow.getDate());
			}
			var beginYear = options['beginYear'] || 1900;
			var endYear = options['endYear'] || 2100;
			datePicker.showDtPicter({
				"type": "date",
				"value": datetime,
				'beginYear': beginYear,
				'endYear': endYear
			}, callback);
		},
		/**
		 * @description 拓展h5下的时间选择
		 */
		'pickTime': function(options, callback) {
			options = options || {};
			if(!ejs.os.h5) {
				// v2的api中，只有h5中才能使用h5
				return;
			}
			var datetime = options['datetime'];
			options['title'] = options['title'] || '请选择时间';
			options['is24Hour'] = true;
			var dateNow = new Date();
			var datePrefix = dateNow.getFullYear() + '-' + paddingWith0(dateNow.getMonth() + 1) + '-' + paddingWith0(dateNow.getDate()) + ' ';
			if(!datetime) {
				//如果不存在，默认为当前时间
				datetime = datePrefix + paddingWith0(dateNow.getHours()) + ':' + paddingWith0(dateNow.getMinutes());
			} else {
				datetime = datePrefix + datetime;
			}
			datePicker.showDtPicter({
				"type": "time",
				"value": datetime
			}, callback);

		},
		/**
		 * @description 拓展h5下的日期时间选择
		 */
		'pickDateTime': function(options, callback) {
			options = options || {};
			if(!ejs.os.h5) {
				// v2的api中，只有h5中才能使用h5
				return;
			}
			var datetime = options['datetime'];
			if(!datetime) {
				var dateNow = new Date();
				var datePrefix = dateNow.getFullYear() + '-' + paddingWith0(dateNow.getMonth() + 1) + '-' + paddingWith0(dateNow.getDate()) + ' ';
				// 如果不存在，默认为当前时间
				datetime = datePrefix + paddingWith0(dateNow.getHours()) + ':' + paddingWith0(dateNow.getMinutes());
			}
			var beginYear = options['beginYear'] || 1900;
			var endYear = options['endYear'] || 2100;
			// h5模式,基于mui.picker来实现
			datePicker.showDtPicter({
				"type": null,
				"value": datetime,
				'beginYear': beginYear,
				'endYear': endYear
			}, callback);
		},
		/**
		 * @description 拓展h5下的月份时间选择
		 * 注意: 这个api目前ejs下没有，所以只有h5版本
		 */
		'pickMonth': function(options, callback) {
			options = options || {};
			options['title'] = options['title'] || '请选择时间';
			var datetime = options['datetime'];

			var dateNow = new Date();
			if(!datetime) {
				// 如果不存在，默认为当前时间
				datetime = dateNow.getFullYear() + '-' + paddingWith0(dateNow.getMonth() + 1) + '-' + paddingWith0(dateNow.getDate());
			} else {
				// 否则，只需要加上日期尾缀
				datetime += '-' + paddingWith0(dateNow.getDate());
			}
			var beginYear = options['beginYear'] || 1900;
			var endYear = options['endYear'] || 2100;
			datePicker.showDtPicter({
				"type": "month",
				"value": datetime,
				'beginYear': beginYear,
				'endYear': endYear
			}, callback);
		},
		/**
		 * @description 拓展h5下独有的PopPicker
		 */
		'popPicker': function(options, callback) {
			options = options || {};

			popPicker.showPopPicker(options, callback);
		}
	});

	/**
	 * 拓展  sql 模块
	 * 采用localStorage来替代实现
	 */
	ejs.extendFucObj('sql', {
		/**
		 * @description 获取原生数据库中的键值对
		 * 变为localStorage实现
		 * 异步
		 * @param {String} callback key
		 * @param {Function} callback 回调函数
		 */
		'getConfigValue': function(key, callback) {
			if(ejs.os.ejs) {
				// ejs下不重复
				return;
			}
			key = key || '';
			var items = null;
			try {
				items = localStorage.getItem(key);
			} catch(msg) {
				console.error('localStorage获取值出错:' + key + ',' + JSON.stringify(msg));
			}
			callback && callback({
				code: 1,
				msg: '',
				result: {
					value: items
				}
			});
		},
		/**
		 * @description 设置原生数据库中的键值对
		 * 变为localStorage实现
		 * 异步
		 * @param {String}  key
		 * @param {String}  value
		 * @param {Function} callback 回调函数
		 */
		'setConfigValue': function(key, value, callback) {
			if(ejs.os.ejs) {
				// ejs下不重复
				return;
			}
			key = key || '';
			try {
				localStorage.setItem(key, value);
			} catch(msg) {
				if(msg.name == 'QuotaExceededError') {
					console.error('超出本地存储限额，建议先清除一些无用空间！更多信息:' + JSON.stringify(msg));
				} else {
					console.error('localStorage存储值出错:' + key + ',' + JSON.stringify(msg));
				}
			}
			callback && callback({
				code: 1,
				msg: '',
				result: {}
			});
		}
	});
})(ejs);