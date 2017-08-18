/**
 * 作者: 孙尊路
 * 创建时间: 2017-07-14 13:26:47
 * 版本: [1.0, 2017/7/14]
 * 版权: 江苏国泰新点软件有限公司
 * 描述：日历组件
 */

(function() {
	"use strict";
	
	// TODO(sunzl): 源码需要优化，现在是 bad case
	/**
	 * 全局生效默认设置
	 * 默认设置可以最大程度的减小调用时的代码
	 */
	var defaultOptions = {
		// 默认日历组件容器
		container: "#calendar",
		// 默认显示农历
		isLunar: true,
		// 默认开启水平方向切换月份
		isSwipeH: true,
		// 默认开启垂直方向切换月份
		isSwipeV: true

	};

	/**
	 * 日历的构造函数
	 * @param {Object} options 配置参数，和init以及_initData的一致
	 * @constructor
	 */
	function Calendar(options) {

		options = mui.extend({}, defaultOptions, options);

		this.container = this._selector(options.container);

		this._initData(options);
	}

	Calendar.prototype = {
		/**
		 * 初始化数据单独提取，方便refresh使用
		 * @param {Object} options 配置参数
		 */
		_initData: function(options) {

			this.options = options;
			if(!this._validate()) {
				// 因为验证是强制性的，因此直接抛出错误
				throw new Error('验证错误，日历的传入格式非法，请检查代码');
			}
			this._initParams();
			this._addEvent();

		},
		_initParams: function() {
			var self = this;
			self.newDate = new Date();
			self.nowYear = self.newDate.getFullYear();
			self.nowMonth = self.newDate.getMonth() + 1;
			self.nowDay = self.newDate.getDate();

			self.nowMonth = String(self.nowMonth);
			if(self.nowMonth.length == 1) {
				self.nowMonth = "0" + self.nowMonth;
			}

			// 定义全局变量 计算农历
			self.CalendarData = new Array(100);
			self.madd = new Array(12);
			self.tgString = "甲乙丙丁戊己庚辛壬癸";
			self.dzString = "子丑寅卯辰巳午未申酉戌亥";
			self.numString = "一二三四五六七八九十";
			self.monString = "正二三四五六七八九十冬腊";
			self.weekString = "日一二三四五六";
			self.sx = "鼠牛虎兔龙蛇马羊猴鸡狗猪";
			self.cYear, self.cMonth, self.cDay, self.TheDate;
			self.CalendarData = new Array(0xA4B, 0x5164B, 0x6A5, 0x6D4, 0x415B5, 0x2B6, 0x957, 0x2092F, 0x497, 0x60C96, 0xD4A, 0xEA5, 0x50DA9, 0x5AD, 0x2B6, 0x3126E, 0x92E, 0x7192D, 0xC95, 0xD4A, 0x61B4A, 0xB55, 0x56A, 0x4155B, 0x25D, 0x92D, 0x2192B, 0xA95, 0x71695, 0x6CA, 0xB55, 0x50AB5, 0x4DA, 0xA5B, 0x30A57, 0x52B, 0x8152A, 0xE95, 0x6AA, 0x615AA, 0xAB5, 0x4B6, 0x414AE, 0xA57, 0x526, 0x31D26, 0xD95, 0x70B55, 0x56A, 0x96D, 0x5095D, 0x4AD, 0xA4D, 0x41A4D, 0xD25, 0x81AA5, 0xB54, 0xB6A, 0x612DA, 0x95B, 0x49B, 0x41497, 0xA4B, 0xA164B, 0x6A5, 0x6D4, 0x615B4, 0xAB6, 0x957, 0x5092F, 0x497, 0x64B, 0x30D4A, 0xEA5, 0x80D65, 0x5AC, 0xAB6, 0x5126D, 0x92E, 0xC96, 0x41A95, 0xD4A, 0xDA5, 0x20B55, 0x56A, 0x7155B, 0x25D, 0x92D, 0x5192B, 0xA95, 0xB4A, 0x416AA, 0xAD5, 0x90AB5, 0x4BA, 0xA5B, 0x60A57, 0x52B, 0xA93, 0x40E95);
			self.madd[0] = 0;
			self.madd[1] = 31;
			self.madd[2] = 59;
			self.madd[3] = 90;
			self.madd[4] = 120;
			self.madd[5] = 151;
			self.madd[6] = 181;
			self.madd[7] = 212;
			self.madd[8] = 243;
			self.madd[9] = 273;
			self.madd[10] = 304;
			self.madd[11] = 334;

			// console.log("初始化年月日：" + self.nowYear + "-" + self.nowMonth + "-" + self.nowDay);
			// 刷新生成日历
			this.refresh(self.nowYear, self.nowMonth, self.nowDay);
		},
		/**
		 * 刷新日历，传入日期格式须：2017-07-01 或2017-12-09
		 */
		refresh: function(year, month, day) {
			var self = this;

			self.nowYear = parseInt(year);
			self.nowMonth = parseInt(month);
			self.nowDay = parseInt(day);
			if(parseInt(self.nowMonth) > 9) {
				self.nowMonth = "" + parseInt(self.nowMonth);
			} else {
				self.nowMonth = "0" + parseInt(self.nowMonth);
			}
			if(parseInt(self.nowDay) > 9) {
				self.nowDay = "" + parseInt(self.nowDay) + "";
			} else {
				self.nowDay = "0" + parseInt(self.nowDay) + "";
			}
			var tmptmp = new Date(Date.parse(self.nowYear + '/' + self.nowMonth + '/1'));
			var nowXingQiJi = tmptmp.getDay();
			nowXingQiJi = parseInt(nowXingQiJi);
			if(nowXingQiJi == 0) {
				nowXingQiJi = 7;
			}
			// 根据年份、月份 计算月份中的天数（比如：28、29、30、31等）
			var dayCount = this._judgeDaysByYearMonth(self.nowYear, self.nowMonth);

			var fileInfo = {};
			var preDayCount = this._judgeDaysByYearMonth(self.nowYear, self.nowMonth - 1);
			preDayCount = parseInt(preDayCount);
			for(var index = nowXingQiJi; index > 0; index--) {
				var aa = preDayCount--
					var tmpName = 'day' + index;
				var lunar = 'lunar' + index;
				fileInfo[tmpName] = aa;
				fileInfo[lunar] = this._getLunar(aa, "m-1");
			}

			var daonale = 0;

			if(dayCount == '28') {
				daonale = 28 + nowXingQiJi;
				for(var index = nowXingQiJi + 1, indexindex = 1; index < (28 + nowXingQiJi + 1); index++, indexindex++) {
					var tmpName = 'day' + index;
					var lunar = 'lunar' + index;
					fileInfo[tmpName] = indexindex;
					fileInfo[lunar] = this._getLunar(indexindex);
				}
			}
			if(dayCount == '29') {
				daonale = 29 + nowXingQiJi;
				for(var index = nowXingQiJi + 1, indexindex = 1; index < (29 + nowXingQiJi + 1); index++, indexindex++) {
					var tmpName = 'day' + index;
					var lunar = 'lunar' + index;
					fileInfo[tmpName] = indexindex;
					fileInfo[lunar] = this._getLunar(indexindex);
				}
			}
			if(dayCount == '30') {
				daonale = 30 + nowXingQiJi;
				for(var index = nowXingQiJi + 1, indexindex = 1; index < (30 + nowXingQiJi + 1); index++, indexindex++) {
					var tmpName = 'day' + index;
					var lunar = 'lunar' + index;
					fileInfo[tmpName] = indexindex;
					fileInfo[lunar] = this._getLunar(indexindex);
				}
			}
			if(dayCount == '31') {
				daonale = 31 + nowXingQiJi;
				for(var index = nowXingQiJi + 1, indexindex = 1; index < (31 + nowXingQiJi + 1); index++, indexindex++) {
					var tmpName = 'day' + index;
					var lunar = 'lunar' + index;
					fileInfo[tmpName] = indexindex;
					fileInfo[lunar] = this._getLunar(indexindex);
				}
			}

			for(var index2 = daonale + 1, index3 = 1; index2 <= 42; index2++, index3++) {
				var tmpName = 'day' + index2;
				var lunar = 'lunar' + index2;
				fileInfo[tmpName] = index3;
				fileInfo[lunar] = this._getLunar(index3, "m+1");
			}
			this._render(fileInfo);
		},

		/**
		 * 视图的渲染和数据分离，采用内部的数据
		 */
		_render: function(fileInfo) {
			var self = this;

			// 准备数据
			var tmpArray = [];
			for(var i = 1; i < 43; i++) {
				tmpArray.push({
					"day_index": "{{day" + i + "}}",
					"lunar_index": "{{lunar" + i + "}}",
				});
			}
			// 动态计算生成一个  6*7的二维网格，
			var html = '';
			html += '<table id="dateBorder">';
			// 生成日历第一行（日、一、二、三、四、五、六）
			html += '<tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr>';
			for(var j = 1; j < 7; j++) {
				html += '<tr>';
				var perTD = '<td><div class="dateQuan">{{day_index}}<span class="font12">{{lunar_index}}</span></div></td>';
				var output = '';
				for(var k = 7; k > 0; k--) {
					var index = (j * 7 - k) + 1;
					output += Mustache.render(perTD, tmpArray[index - 1]);
				}
				html += output;
				html += '</tr>';
			}
			html += '</table>';

			var output = Mustache.render(html, fileInfo);
			this._selector(this.options.container).innerHTML = output;

			// 将当前月正着数把第一天之前的日子网格置成灰色
			for(var index8 = 0; index8 <= 41; index8++) {
				if(parseInt(Zepto('td')[index8].innerText) != 1) {
					Zepto(Zepto('td')[index8]).css('color', '#D8D8D8');
					Zepto(Zepto('td')[index8]).find('div.dateQuan').addClass('nouse');
				} else {
					break;
				}
			}
			// 将当前月倒数最后一天之前的日子网格置成灰色
			for(var index9 = 41; index9 >= 0; index9--) {
				if(parseInt(Zepto('td')[index9].innerText) != 1) {
					Zepto(Zepto('td')[index9]).css('color', '#D8D8D8');
					Zepto(Zepto('td')[index9]).find('div.dateQuan').addClass('nouse');
				} else {
					Zepto(Zepto('td')[index9]).css('color', '#D8D8D8');
					Zepto(Zepto('td')[index9]).find('div.dateQuan').addClass('nouse');
					break;
				}
			}

			// 设置今天的日期状态
			var d = new Date();
			var year = d.getFullYear();
			var month = d.getMonth() + 1;

			if(year == self.nowYear && month == self.nowMonth) {
				Zepto(".dateQuan").each(function() {
					if(Zepto(this).hasClass('nouse')) {

					} else {
						var day = Zepto(this).text();
						if(self.nowDay == parseInt(day)) {
							Zepto('.dateQuan').removeClass('clickActive');
							Zepto(this).addClass('clickActive').html("今天<span class='font12'>" + day.substr(-2, 2) + "<span>");
						}
					}
				});
			}

		},
		/**
		 * 增加事件，包括
		 * 日历点击的监听
		 * 日历左滑、右滑切换，等等
		 */
		_addEvent: function() {
			var self = this;
			var itemClick = self.options.itemClick;
			var swipeCallback = self.options.swipeCallback;
			// 给日期增加点击监听事件
			mui(self.options.container).on('tap', '.dateQuan', function() {
				var lunarStr = this.querySelector(".font12").innerText.trim();
				if(Zepto(this).hasClass('nouse')) {} else {
					Zepto('.dateQuan').removeClass('clickActive');
					Zepto(this).addClass('clickActive');
					var day = Zepto(this).text();
					if(parseInt(day) > 9) {
						day = "" + parseInt(day) + "";
					} else {
						day = "0" + parseInt(day) + "";
					}
					var dateStr = self.nowYear + "-" + self.nowMonth + "-" + day;
					itemClick && itemClick({
						date: dateStr, //日期
						lunar: lunarStr //农历
					});
				}

			});

			// 默认true，日历向左相应、向右滑动
			if(self.options.isSwipeH) {
				// 开启日历组件右滑
				self._selector(self.options.container).addEventListener("swiperight", function() {
					if(self.options.isDebug) {
						console.log("你正在向右滑动");
					}
					self.nowMonth = parseInt(self.nowMonth) - parseInt(1);
					if(self.nowMonth == 0) {
						self.nowYear = self.nowYear - 1;
						self.nowMonth = 12;
					}
					if(parseInt(self.nowMonth) > 9) {
						self.nowMonth = "" + parseInt(self.nowMonth);
					} else {
						self.nowMonth = "0" + parseInt(self.nowMonth);
					}
					if(parseInt(self.nowDay) > 9) {
						self.nowDay = "" + parseInt(self.nowDay) + "";
					} else {
						self.nowDay = "0" + parseInt(self.nowDay) + "";
					}
					// 刷新
					self.refresh(self.nowYear, self.nowMonth, self.nowDay);
					// 滑动回调
					swipeCallback && swipeCallback({
						year: self.nowYear,
						month: self.nowMonth,
						day: self.nowDay
					});
				});
				// 开启日历组件左滑
				self._selector(self.options.container).addEventListener("swipeleft", function() {
					if(self.options.isDebug) {
						console.log("你正在向左滑动");
					}
					self.nowMonth = parseInt(self.nowMonth) + parseInt(1);
					if(self.nowMonth == 13) {
						self.nowYear = self.nowYear + 1;
						self.nowMonth = 1;
					}

					if(parseInt(self.nowMonth) > 9) {
						self.nowMonth = "" + parseInt(self.nowMonth);
					} else {
						self.nowMonth = "0" + parseInt(self.nowMonth);
					}
					if(parseInt(self.nowDay) > 9) {
						self.nowDay = "" + parseInt(self.nowDay) + "";
					} else {
						self.nowDay = "0" + parseInt(self.nowDay) + "";
					}
					// 刷新
					self.refresh(self.nowYear, self.nowMonth, self.nowDay);
					// 滑动回调
					swipeCallback && swipeCallback({
						year: self.nowYear,
						month: self.nowMonth,
						day: self.nowDay
					});
				});
			}
			// 默认true，日历向上、向下滑动
			if(self.options.isSwipeV) {
				// TODO 后期遇到需求扩展
			}

		},
		/**
		 * 获取当前农历
		 * @param {Object} currentday
		 * @param {Object} month
		 * @return {String} 
		 */
		_getLunar: function(currentday, month) {
			var self = this;
			// 获取当前农历
			var yy = self.nowYear;
			var mm = self.nowMonth;
			mm = parseInt(mm);
			if(month === "m+1") {
				mm = 1 + mm;
				if(mm == 13) {
					mm = 1
				};
			}
			if(month === "m-1") {
				mm = -1 + mm;
				if(mm == 0) {
					mm = 1
				};
			}
			var dd = currentday;
			var ww = new Date(Date.parse(yy + '/' + mm + '/' + dd)).getDay();
			return this._getLunarDay(yy, mm, dd);
		},
		/**
		 * 根据年月计算当月的天数
		 * @param {Object} y
		 * @param {Object} m
		 */
		_judgeDaysByYearMonth: function(y, m) {
			var self = this;
			if(y == undefined || y == null) {
				throw "=====获取当前月份天数时，缺少y参数，未定义！=======";
			}
			if(m == undefined || m == null) {
				throw "=====获取当前月份天数时，缺少m参数，未定义！=======";
			}
			var y = parseInt(y);
			var m = parseInt(m);
			if(m == 0) {
				y--;
				m = 12;
			}
			if(m == 2) {
				if((y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)) {
					return '29';
				} else {
					return '28';
				}
			} else {
				if(self._inArray(m, [1, 3, 5, 7, 8, 10, 12])) {
					return '31';
				} else {
					return '30';
				}
			}

		},

		/**
		 * 进行一次全局验证，验证输入的合法性
		 * 这个验证是强制性的
		 */
		_validate: function() {
			var flag = true;
			if(!this.options.container) {
				flag = false;
			}
			return flag;
		},
		_selector: function(el) {
			// 减少耦合
			return document.querySelector(el);
		},
		/**
		 *  判断元素在数组中是否存在
		 * @param {Object} str 数字或者字符串元素
		 * @param {Object} arr 有效数组
		 */
		_inArray: function(str, arr) {
			// 不是数组则抛出异常 
			if(!Array.isArray(arr)) {
				throw "arguments is not Array";
			}
			// 遍历是否在数组中 
			for(var i = 0, k = arr.length; i < k; i++) {
				if(str == arr[i]) {
					return true;
				}
			}
			// 如果不在数组中就会返回false 
			return false;
		},
		// 遍历查找同级元素
		_sibling: function(elem, forCB) {
			var r = [];
			var n = elem.parentNode.firstChild;
			for(; n; n = n.nextSibling) {
				if(n.nodeType === 1 && n !== elem) {
					if(forCB && typeof(forCB) == "function") {
						forCB(n);
					}
				}
			}
		},
		_getBit: function(m, n) {
			var self = this;
			// 农历转换 
			return(m >> n) & 1;
		},
		_e2c: function() {
			var self = this;
			self.TheDate = (arguments.length != 3) ? new Date() : new Date(arguments[0], arguments[1], arguments[2]);
			var total, m, n, k;
			var isEnd = false;
			var tmp = self.TheDate.getYear();
			if(tmp < 1900) {
				tmp += 1900;
			}
			total = (tmp - 1921) * 365 + Math.floor((tmp - 1921) / 4) + self.madd[self.TheDate.getMonth()] + self.TheDate.getDate() - 38;

			if(self.TheDate.getYear() % 4 == 0 && self.TheDate.getMonth() > 1) {
				total++;
			}
			for(m = 0;; m++) {
				k = (self.CalendarData[m] < 0xfff) ? 11 : 12;
				for(n = k; n >= 0; n--) {
					if(total <= 29 + self._getBit(self.CalendarData[m], n)) {
						isEnd = true;
						break;
					}
					total = total - 29 - self._getBit(self.CalendarData[m], n);
				}
				if(isEnd) break;
			}
			self.cYear = 1921 + m;
			self.cMonth = k - n + 1;
			self.cDay = total;
			if(k == 12) {
				if(self.cMonth == Math.floor(self.CalendarData[m] / 0x10000) + 1) {
					self.cMonth = 1 - self.cMonth;
				}
				if(self.cMonth > Math.floor(self.CalendarData[m] / 0x10000) + 1) {
					self.cMonth--;
				}
			}

		},

		_getcDateString: function() {
			var self = this;
			var tmp = "";
			/*显示农历年：（ 如：甲午(马)年 ）*/
			if(self.cMonth < 1) {
				// tmp += "(闰)";
				// tmp += self.monString.charAt(-self.cMonth - 1);
			} else {
				// tmp += self.monString.charAt(self.cMonth - 1);
			}
			//tmp += "月";
			tmp += (self.cDay < 11) ? "初" : ((self.cDay < 20) ? "十" : ((self.cDay < 30) ? "廿" : "三十"));
			if(self.cDay % 10 != 0 || self.cDay == 10) {
				tmp += self.numString.charAt((self.cDay - 1) % 10);
			}
			return tmp;

		},
		_getLunarDay: function(solarYear, solarMonth, solarDay) {
			var self = this;
			//solarYear = solarYear<1900?(1900+solarYear):solarYear; 
			if(solarYear < 1921 || solarYear > 2080) {
				return "";
			} else {
				solarMonth = (parseInt(solarMonth) > 0) ? (solarMonth - 1) : 11;
				self._e2c(solarYear, solarMonth, solarDay);
				return self._getcDateString();
			}

		},

	};

	window.Calendar = Calendar;
})();