/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/23 
 * 版本: [1.0, 2017/05/23 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 时间日期操作
 * 针对日期操作重新封装了一个对象，方便进行各种时间相关的计算与操作
 * 参考原作来源: | yDate.js | Copyright (c) 2013 yao.yl | email: redrainyi@126.com | Date: 2012-09-03 | * 
 * 改动说明: 针对yDate进行了一些个性化的修改,以及增加了一些工具函数
 * 注意，由于各地区的时区不同，所以并不适用于所有地区
 * 本工具类采用的时区是东八区(北京时间)-主要影响那些获取绝对时间进行比较的操作
 */
(function(exports) {
	"use strict";
	/**
	 * 采用东八区时间(北京时间)
	 * 修正后适用范围是使用北京时区的地区
	 */
	var TIME_ZONE = 8 * 60 * 60 * 1000;
	var objectPrototypeToString = Object.prototype.toString;
	/**
	 * 日期匹配的正则表达式
	 * Y:年
	 * M:月
	 * D:日
	 * h:小时
	 * m:分钟
	 * s:秒
	 * i:毫秒
	 * w:星期(小写的)
	 * W:星期(大写的)
	 */
	var SIGN_DATE_REG = /([YMDhmsiWw])(\1*)/g;
	/**
	 * 默认的pattern
	 * 'YYYY-MM-DD hh:mm:ss:iii'
	 */
	var DEFAULT_PATTERN = 'YYYY-MM-DD hh:mm:ss:iii';
	/**
	 * @description 判断一个值是否是日期类型
	 * @param {Object} value
	 */
	function isDate(value) {
		return objectPrototypeToString.call(value) === '[object Date]';
	};
	/**
	 * @description 复制一个日期,如果传入的不是日期,会返回一个最新的日期
	 * @param {Date} targetDate
	 */
	function cloneDate(targetDate, callBack) {
		// 绝对时间,从1970.1.1开始的毫秒数
		var absoluteTime = (isDate(targetDate)) ? targetDate.getTime() : undefined;
		var mDate = new Date(absoluteTime);
		var year = mDate.getFullYear(), 
			month = mDate.getMonth(), 
			date = mDate.getDate(), 
			hours = mDate.getHours(), 
			minutes = mDate.getMinutes(), 
			seconds = mDate.getSeconds(); 
		// !! 代表将后面的转为一个布尔表达式   例如 !!a 就相当于 a||false
		(!!callBack) && callBack(mDate, year, month, date, hours, minutes, seconds);
		return mDate;
	};
	/**
	 * @description 日期解析,将日期字符串根据特定的匹配字符串解析为日期格式
	 * 解析失败会返回null,如果传入了奇怪的匹配字符串,会产生奇怪的时间
	 * @param {String} dateString 日期字符串
	 * @param {String} pattern 匹配字符串,可以手动传入,或者采取默认
	 * 手动传入需要和日期字符串保持一致
	 */
	function parseDate(dateString, pattern) {

		try {
			/**
			 * () 是为了提取匹配的字符串。表达式中有几个()就有几个相应的匹配字符串。
			 * (\s*)表示连续空格的字符串。
			 * []是定义匹配的字符范围。比如 [a-zA-Z0-9] 表示相应位置的字符要匹配英文字符和数字。
			 * [\s*]表示空格或者*号。
			 * {}一般用来表示匹配的长度，比如 \s{3} 表示匹配三个空格，\s[1,3]表示匹配一到三个空格。
			 * (\1)是后向引用,代表后面引用前面第一个()中的内容
			 * 根据日期格式来匹配
			 * 普通格式的 dateString 为10,9,或8
			 */
			var matchs1 = (pattern || ((dateString.length === 10 || dateString.length === 9 || dateString.length === 8) ? 'YYYY-MM-DD' : (dateString.length === 19 ? 'YYYY-MM-DD hh:mm:ss' : 'YYYY-MM-DD hh:mm:ss:iii'))).match(SIGN_DATE_REG);
			// 根据整数来匹配,将实际的时间数据提取出来
			var matchs2 = dateString.match(/(\d)+/g);
			if(matchs1.length > 0) {
				// 第一个匹配字符串需要大于0才行
				// 生成一个最原始的时间-1970-01-01年的
				var mDate = new Date(1970, 0, 1);
				// 遍历,分别设置年月日,分秒等等
				for(var i = 0; i < matchs1.length; i++) {
					// 这个分别是  年,月,日  时,分,秒等等
					// 增加默认值0,防止当没有数据时出错
					var mTarget = parseInt(matchs2[i], 10) || 0;
					switch(matchs1[i].charAt(0) || '') {
						// 这个matchs1[i]有可能是  YYYY  所以只去第一个字符
						case 'Y':
							mDate.setFullYear(mTarget);
							break;
						case 'M':
							mDate.setMonth(mTarget - 1);
							break;
						case 'D':
							mDate.setDate(mTarget);
							break;
						case 'h':
							mDate.setHours(mTarget);
							break;
						case 'm':
							mDate.setMinutes(mTarget);
							break;
						case 's':
							mDate.setSeconds(mTarget);
							break;
						case 'i':
							mDate.setMilliseconds(mTarget);
							break;
						default:
							// 默认不操作
					}
				}
				return mDate;
			}
		} catch(e) {

		}
		return null;
	};
	/**
	 * @description 将字符串多余的长度补齐0
	 * @param {String} s
	 * @param {Number} len
	 */
	function paddingFillWith0(s, len) {
		var len = len - (s + "").length;
		for(var i = 0; i < len; i++) {
			s = "0" + s;
		}
		return s;
	}
	/**
	 * @description 格式化时间,返回格式化后的字符串
	 * 如果格式不合要求,返回null
	 * @param {Date} value 目标时间
	 * @param {String} pattern 匹配字符串
	 */
	function formatDateToString(value, pattern) {
		if(!isDate(value)) {
			return '';
		}
		try {
			// 默认为输出所有的
			pattern = pattern || DEFAULT_PATTERN;
			return pattern.replace(SIGN_DATE_REG, function($0) {
				// 如果传入一个yyyy-MM-dd 的表达式
				// 实际上这个函数会分别回调多次 没符合一次匹配就回调一次
				// $0:yyyy  $0:MM $0:dd  依次类推
				// console.log('$0:'+$0);
				switch($0.charAt(0)) {
					case 'Y':
						return paddingFillWith0(value.getFullYear(), $0.length);
					case 'M':
						return paddingFillWith0(value.getMonth() + 1, $0.length);
					case 'D':
						return paddingFillWith0(value.getDate(), $0.length);
					case 'h':
						return paddingFillWith0(value.getHours(), $0.length);
					case 'm':
						return paddingFillWith0(value.getMinutes(), $0.length);
					case 's':
						return paddingFillWith0(value.getSeconds(), $0.length);
					case 'i':
						return paddingFillWith0(value.getMilliseconds(), $0.length);
					case 'w':
						return value.getDay();
					case 'W':
						// 自动将星期转为了大写
						var week = ['日', '一', '二', '三', '四', '五', '六'];
						return paddingFillWith0(week[value.getDay()], $0.length);
					default:
						return '';
				}
			});
		} catch(e) {
			console.log('error:' + e);
			return '';
		}
	};
	/**
	 * @description 得到实际日期最大值
	 * @param {Date} date
	 */
	function getActualMaximum(date) {
		var vDate = new Date(date.getTime());
		vDate.setMonth(vDate.getMonth() + 1);
		vDate.setDate(0);
		return vDate.getDate();
	}
	/**
	 * @description 定义一个自定义日期类的构造方法,
	 * 里面封装日期的常用操作,不通过自带的日期来操作
	 * @constructor 这是一个构造方法
	 */
	function MyDate() {
		var p0 = arguments[0];
		var p1 = arguments[1];
		// isFinite 用于判断是否是无穷大
		// 如果 number 是有限数字（或可转换为有限数字），那么返回 true
		// 如果 number 是 NaN（非数字），或者是正、负无穷大的数，则返回 false
		if(typeof p0 === 'number' && isFinite(value)) {
			this.myDate = new Date(p0); //millis
		} else if(isDate(p0)) {
			this.myDate = new Date(p0.getTime());
		} else if(typeof p0 === 'string') {
			if(typeof p1 !== 'string' && typeof p1 !== 'undefined') {
				p1 = undefined;
			}
			this.myDate = parseDate(p0, p1);
		} else if(arguments.length == 0) {
			this.myDate = new Date();
		} else {
			throw 'MyDate Constructor Error!';
		}
	};
	/**
	 * @description 给一个日期设置年份
	 * @param {Number} finalYear
	 * @param {Date} mDate
	 * @param {MyDate} self
	 */
	function setYearG(finalYear, mDate, self) {
		mDate.setFullYear(finalYear);
	}
	/**
	 * @description 给一个日期设置月份
	 * 之所以要单独将设置月份(年,日,时...)的函数抽取出来,是因为
	 * 在日期时间 加,减操作时,会涉及到一个进位问题: 比如,1月31日的下一天应该是2月1日...
	 * 所以单独封装成函数便于调用
	 * 之所以没有 直接调用plusMonth,plusYear...
	 * 是因为这个操作中间有回调,多个回调嵌套后,无法同步返回最准确的数据
	 * (可以自行测试)
	 * @param {Number} finalYear
	 * @param {Date} mDate
	 * @param {MyDate} self
	 */
	function setMonthG(finalMon, mDate, self) {
		// month 为 0-11
		if(finalMon > 11) {
			finalMon = finalMon - 12;
			setYearG(mDate.getFullYear() + 1, mDate, self);
		} else if(finalMon < 0) {
			finalMon += 12;
			setYearG(mDate.getFullYear() - 1, mDate, self);
		}
		/**
		 * 关于月份顺延的bug
		 * 发现如下规律：只要setMonth()的参数为小于31天的月份时就会变为下一个月。
		 * 原因是：因为当前月份是31天，而设置的月份小于31天，就会把日期顺延。在setMonth的说明是这样的：
		 * dateObj.setMonth(numMonth[, dateVal])
		 * dateVal可选项。一个代表日期的数值。
		 * 如果没有提供此参数，那么将使用通过调用 getDate 方法而得到的数值。
		 * 所以，从对dataVal参数的说明可以看出，在设置月份的同时
		 * 使用getDate获取日期，并使用得到的日期值设置了日期。
		 * 于是就会发生月份顺延的情况。
		 * 解决方法：
		 * 1、设置月份时，将日期设为1，记setMonth(month, 1)，
		 * 当然可以在setMonth之前先调用setDate()设置日期；
		 * 2、也可以在初始化Date对象时，就指定一个日期，也就是使用：
		 * dateObj = new Date(year, month, date[, hours[, minutes[, seconds[,ms]]]]) 的形式。
		 * 3、也可以使用setFullYear()同时设置年、月、日，即setFullYear(numYear[, numMonth[, numDate]])。 
		 * 
		 * bug简单说明:
		 * 如果当前是10月31日,然后设置月份为11,由于11月没有31天,所以月份会顺延
		 * 自动变为12月,所以解决方法是要在设置月份前先把日期设置下,然后之后再继续设置日期
		 * (因为日期肯定是需要改变的)
		 */
		mDate.setMonth(finalMon, 1);
	}
	/**
	 * @description 给一个日期设置日期
	 * @param {Number} finalYear
	 * @param {Date} mDate
	 * @param {MyDate} self
	 */
	function setDateG(finalDay, mDate, self) {
		var month = mDate.getMonth();
		var monthDays = self.getMonthDays(month + 1);
		if(finalDay > monthDays) {
			finalDay -= monthDays;
			setMonthG(mDate.getMonth() + 1, mDate, self);
		} else if(finalDay <= 0) {
			var lastMonthDay = month > 0 ? self.getMonthDays((month + 1 - 1)) : self.getMonthDays(12);
			finalDay += lastMonthDay;
			setMonthG(mDate.getMonth() - 1, mDate, self);
		}
		mDate.setDate(finalDay);
	}
	/**
	 * @description 给一个日期设置小时
	 * @param {Number} finalYear
	 * @param {Date} mDate
	 * @param {MyDate} self
	 */
	function setHourG(finalHour, mDate, self) {
		if(finalHour >= 24) {
			finalHour -= 24;
			setDateG(mDate.getDate() + 1, mDate, self);
		} else if(finalHour < 0) {
			finalHour += 24;
			setDateG(mDate.getDate() - 1, mDate, self);
		}
		mDate.setHours(finalHour);
	}
	/**
	 * @description 给一个日期设置分钟
	 * @param {Number} finalYear
	 * @param {Date} mDate
	 * @param {MyDate} self
	 */
	function setMinG(finalMin, mDate, self) {
		if(finalMin >= 60) {
			finalMin -= 60;
			setHourG(mDate.getHours() + 1, mDate, self);
		} else if(finalHour < 0) {
			finalMin += 60;
			setHourG(mDate.getHours() - 1, mDate, self);
		}
		mDate.setMinutes(finalMin);
	}
	/**
	 * @description 给一个日期设置秒
	 * @param {Number} finalYear
	 * @param {Date} mDate
	 * @param {MyDate} self
	 */
	function setSecG(finalSec, mDate, self) {
		if(finalSec >= 60) {
			finalSec -= 60;
			setMinG(mDate.getMinutes() + 1, mDate, self);
		} else if(finalSec < 0) {
			finalSec += 60;
			setMinG(mDate.getMinutes() - 1, mDate, self);
		}
		mDate.setSeconds(finalSec);
	}
	/**
	 * @description 通过扩充原型添加方法
	 */
	MyDate.prototype = {
		/**
		 * @description 得到一个月有多少天
		 * @param {Number} month 对应的月份
		 */
		getMonthDays: function(month) {
			switch(month) {
				case 1:
				case 3:
				case 5:
				case 7:
				case 8:
				case 10:
				case 12:
					return 31;
					break;
				case 4:
				case 6:
				case 9:
				case 11:
					return 30;
					break;
				case 2:
					if(this.isLeapYear()) {
						return 29;
					} else {
						return 28;
					}
					break;
				default:
					return 0;
					break;
			}
		},
		/**
		 * @description 年份相加,返回一个新的日期
		 * @param {Object} value
		 */
		plusYear: function(value) {
			var self = this;
			return new MyDate(cloneDate(this.myDate, function(mDate, year, month, date, hours, minutes, seconds) {
				setYearG(year + value, mDate, self);
			}));
		},
		plusMonth: function(value) {
			var self = this;
			return new MyDate(cloneDate(this.myDate, function(mDate, year, month, date, hours, minutes, seconds) {
				var dateValue = mDate.getDate();
				setMonthG(month + value, mDate, self);
				setDateG(dateValue, mDate, self);
			}));
		},
		plusDate: function(value) {
			var self = this;
			return new MyDate(cloneDate(this.myDate, function(mDate, year, month, date, hours, minutes, seconds) {
				var finalDay = date + value;
				setDateG(finalDay, mDate, self);
			}));
		},
		plusHours: function(value) {
			var self = this;
			return new MyDate(cloneDate(this.myDate, function(mDate, year, month, date, hours, minutes, seconds) {
				var finalHour = hours + value;
				setHourG(finalHour, mDate, self);
			}));
		},
		plusMinutes: function(value) {
			var self = this;
			return new MyDate(cloneDate(this.myDate, function(mDate, year, month, date, hours, minutes, seconds) {
				var finalMin = minutes + value;
				setMinG(finalMin, mDate, self);
			}));
		},
		plusSeconds: function(value) {
			var self = this;
			return new MyDate(cloneDate(this.myDate, function(mDate, year, month, date, hours, minutes, seconds) {
				var finalSec = seconds + value;
				setSecG(finalSec, mDate, self);
			}));
		},
		minusYear: function(value) {
			return this.plusYear(-value);
		},
		minusMonth: function(value) {
			return this.plusMonth(-value);
		},
		minusDate: function(value) {
			return this.plusDate(-value);
		},
		minusHours: function(value) {
			return this.plusHours(-value);
		},
		minusMinutes: function(value) {
			return this.plusMinutes(-value);
		},
		minusSeconds: function(value) {
			return this.plusSeconds(-value);
		},
		setYear: function(value) {
			this.myDate.setFullYear(value);
		},
		setMonth: function(value) {
			this.myDate.setMonth(value - 1);
		},
		setDate: function(value) {
			this.myDate.setDate(value);
		},
		setHours: function(value) {
			this.myDate.setHours(value);
		},
		setMinutes: function(value) {
			this.myDate.setMinutes(value);
		},
		setSeconds: function(value) {
			this.myDate.setSeconds(value);
		},
		setMilliseconds: function(value) {
			this.myDate.setMilliseconds(value);
		},
		getYear: function() {
			return this.myDate.getFullYear();
		},
		getMonth: function() {
			// 比普通月份小1
			return this.myDate.getMonth();
		},
		getDate: function() {
			return this.myDate.getDate();
		},
		getHours: function() {
			return this.myDate.getHours();
		},
		getMinutes: function() {
			return this.myDate.getMinutes();
		},
		getSeconds: function() {
			return this.myDate.getSeconds();
		},
		getMilliseconds: function() {
			return this.myDate.getMilliseconds();
		},
		/**
		 * @description 得到从1970至今多少年
		 */
		getAbsoluteYear: function() {
			return this.myDate.getFullYear() - 1970;
		},
		getAbsoluteMonth: function() {
			return this.getAbsoluteYear() * 12 + this.myDate.getMonth();
		},
		/**
		 * @description 获得绝对日期
		 * 这里采取的方法为 得到从1970至今的毫秒数,然后转为天
		 */
		getAbsoluteDate: function() {
			var absoluteMillons = this.getAbsoluteMillonsTime();
			// 毫秒-秒-分-时-天
			return parseInt(absoluteMillons / 1000 / 60 / 60 / 24, 10);
		},
		getAbsoluteHours: function() {
			return this.getAbsoluteDate() * 24 + this.myDate.getHours();
		},
		getAbsoluteMinutes: function() {
			return this.getAbsoluteHours() * 60 + this.myDate.getMinutes();
		},
		getAbsoluteSeconds: function() {
			return this.getAbsoluteMinutes() * 60 + this.myDate.getSeconds();
		},
		/**
		 * @description 得到从1970年开始到现在的毫秒数
		 * 单位是毫秒
		 */
		getAbsoluteMillonsTime: function() {
			// 默认是GMT时间，实际使用要转换为对应地区的时间
			// TIME_ZONE 是各地区时区个GMT的差值
			return this.myDate.getTime() + TIME_ZONE;
		},
		getDayOfWeek: function(pattern) {
			// 0（周日） 到 6（周六
			// var week = ['日','一','二','三','四','五','六'];
			return this.myDate.getDay();
		},
		isLeapYear: function() {
			return(0 == this.myDate.getYear() % 4 && ((this.myDate.getYear() % 100 != 0) || (this.myDate.getYear() % 400 == 0)));
		},
		toDate: function() {
			return cloneDate(this.myDate);
		},
		clone: function() {
			return new MyDate(cloneDate(this.myDate));
		},
		/**
		 * @description 得到一个日期的最小时间
		 * @param {String}method = [YYYY|MM|DD|hh|mm|ss] field 分别代表年,月,日,时,分,秒的抉择
		 */
		getBegin: function(field) {
			return new MyDate(cloneDate(this.myDate, function(mDate, year, month, date, hours, minutes, seconds) {
				switch(field) {
					// year
					case 'YYYY': 
						mDate.setMonth(0);
						mDate.setDate(1);
						mDate.setHours(0);
						mDate.setMinutes(0);
						mDate.setSeconds(0);
						mDate.setMilliseconds(0);
						break;
					// month
					case 'MM': 
						mDate.setDate(1);
						mDate.setHours(0);
						mDate.setMinutes(0);
						mDate.setSeconds(0);
						mDate.setMilliseconds(0);
					// date
					case 'DD': 
						mDate.setHours(0);
						mDate.setMinutes(0);
						mDate.setSeconds(0);
						mDate.setMilliseconds(0);
						break;
					// hour
					case 'hh': 
						mDate.setMinutes(0);
						mDate.setSeconds(0);
						mDate.setMilliseconds(0);
						break;
					// minute
					case 'mm': 
						mDate.setSeconds(0);
						mDate.setMilliseconds(0);
						break;
					// seconds
					case 'ss': 
						mDate.setMilliseconds(0);
						break;
					// Ignore
					default:
						
				}
			}));
		},
		/**
		 * @description 得到一个日期的最大时间
		 * @param {String}method = [YYYY|MM|DD|hh|mm|ss] field 分别代表年,月,日,时,分,秒的抉择
		 */
		getEnd: function(field) {
			return new MyDate(cloneDate(this.myDate, function(mDate, year, month, date, hours, minutes, seconds) {
				switch(field) {
					// year
					case 'YYYY': 
						mDate.setMonth(11);
						mDate.setDate(31);
						mDate.setHours(23);
						mDate.setMinutes(59);
						mDate.setSeconds(59);
						mDate.setMilliseconds(999);
						break;
					// month
					case 'MM': 
						mDate.setDate(getActualMaximum(mDate));
						mDate.setHours(23);
						mDate.setMinutes(59);
						mDate.setSeconds(59);
						mDate.setMilliseconds(999);
					// date
					case 'DD': 
						mDate.setHours(23);
						mDate.setMinutes(59);
						mDate.setSeconds(59);
						mDate.setMilliseconds(999);
						break;
					// hour
					case 'hh': 
						mDate.setMinutes(59);
						mDate.setSeconds(59);
						mDate.setMilliseconds(999);
						break;
					// minute
					case 'mm': 
						mDate.setSeconds(59);
						mDate.setMilliseconds(999);
						break;
					// seconds
					case 'ss': 
						mDate.setMilliseconds(999);
						break;
					// Ignore
					default:
						
				}
			}));
		},
		/**
		 * @description 和另一个日期比较,另一个日期必须为MyDate型
		 * @param {Date} targetDate 目标日期,MyDate型
		 * @param {String} method = [YYYY|MM|DD|hh|mm|ss|iii] pettern 选择字符串,目前支持 yyyy,MM,dd,HH,mm,ss以及iii
		 * 分别代表比较到某一个层次,默认为比较到毫秒
		 * @return {Number} 返回结果
		 * -1:比较字符对象不合法
		 * 0:两个日期相等
		 * 1:本日期大于目标日期
		 * 2:本日期小于目标日期
		 */
		compare: function(targetDate, pattern) {
			// 如果不是时间类型,而且不是MyDate类型
			if(!isDate(targetDate) && !(targetDate instanceof MyDate)) {
				return -1;
			}
			// 默认为毫秒
			pattern = pattern || 'iii';
			if(pattern === 'YYYY') {
				if(this.getAbsoluteYear() == targetDate.getAbsoluteYear()) {
					return 0;
				} else if(this.getAbsoluteYear() > targetDate.getAbsoluteYear()) {
					return 1;
				} else {
					return 2;
				}
			} else if(pattern === 'MM') {
				if(this.getAbsoluteMonth() == targetDate.getAbsoluteMonth()) {
					return 0;
				} else if(this.getAbsoluteMonth() > targetDate.getAbsoluteMonth()) {
					return 1;
				} else {
					return 2;
				}
			} else if(pattern === 'DD') {
				if(this.getAbsoluteDate() == targetDate.getAbsoluteDate()) {
					return 0;
				} else if(this.getAbsoluteDate() > targetDate.getAbsoluteDate()) {
					return 1;
				} else {
					return 2;
				}
			} else if(pattern === 'hh') {
				if(this.getAbsoluteHours() == targetDate.getAbsoluteHours()) {
					return 0;
				} else if(this.getAbsoluteHours() > targetDate.getAbsoluteHours()) {
					return 1;
				} else {
					return 2;
				}
			} else if(pattern === 'mm') {
				if(this.getAbsoluteMinutes() == targetDate.getAbsoluteMinutes()) {
					return 0;
				} else if(this.getAbsoluteMinutes() > targetDate.getAbsoluteMinutes()) {
					return 1;
				} else {
					return 2;
				}
			} else if(pattern === 'ss') {
				if(this.getAbsoluteSeconds() == targetDate.getAbsoluteSeconds()) {
					return 0;
				} else if(this.getAbsoluteSeconds() > targetDate.getAbsoluteSeconds()) {
					return 1;
				} else {
					return 2;
				}
			} else {
				if(this.getAbsoluteMillonsTime() == targetDate.getAbsoluteMillonsTime()) {
					return 0;
				} else if(this.getAbsoluteMillonsTime() > targetDate.getAbsoluteMillonsTime()) {
					return 1;
				} else {
					return 2;
				}
			}
		},
		isMoreThan: function(targetDate, pattern) {
			return this.compare(targetDate, pattern) == 1 ? true : false;
		},
		isLessThan: function(targetDate, pattern) {
			return this.compare(targetDate, pattern) == 2 ? true : false;
		},
		isEqual: function(targetDate, pattern) {
			return this.compare(targetDate, pattern) == 0 ? true : false;
		},
		toString: function(pattern) {
			return formatDateToString(this.myDate, pattern);
		}
	};
	exports.MyDate = MyDate;
	
	Util.namespace('date', exports);
	
})({});