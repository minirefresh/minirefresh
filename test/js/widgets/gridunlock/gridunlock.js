/**
 * 作者: 郭天琦
 * 创建时间: 2017/06/01
 * 版本: [1.0, 2017/06/01 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 九宫格解锁
 */

(function (doc, Util) {
	"use strict";

	var defaultSetting = {
		r: 26,
		cw: doc.body.offsetWidth,
		ch: 320,
		offsetX: 15,
		offsetY: 15,
		outRoundBorderColor: '#666',
		lineWidth: '7',
		lineColor: '#f00',
		outRoundColor: '#fff',
		innerRoundColor: '#008080',
		itemClick: function (result) {}
	};

	/**
	 * 使用
	 * @constructor
	 * @param {JSON} options 一些配置
	 * container  canvas画布
	 * r - 直径
	 * cw - 画布宽度
	 * ch - 画布高度
	 * offsetX - 距离画布的x轴距离
	 * offsetY - 距离画布的Y轴距离
	 * outRoundBorderColor - 外圆的边框颜色
	 * lineWidth - 连线宽度
	 * lineColor - 连线颜色
	 * outRoundColor - 外圆背景颜色
	 * innerRoundColor - 内圆背景颜色
	 * itemClick - 回调函数
	 */
	function GridUnlock(options) {
		var self = this;

		// 检测环境
		var optionsArray = [{
			key: options.container,
			value: '请传入canvas元素id'
		}];

		self.environment(optionsArray);
		self.container = Util.selector(options.container);

		self = Util.extend({}, defaultSetting, options, self);

		var container = self.container;

		var cxt = container.getContext("2d");
		container.width = self.cw;
		container.height = self.ch;

		self.offsetTop = container.offsetTop;

		var x = (self.cw - 2 * self.offsetX - self.r * 2 * 3) / 2;
		var y = (self.ch - 2 * self.offsetY - self.r * 2 * 3) / 2;

		self.pointArr = self._drawLocalPoint(x, y);
		// 初始化事件监听
		self._initListeners(container, cxt, options.itemClick);

		self._draw(self.pointArr, [], null, cxt);
	}

	/**
     * 定义原型
     */
	GridUnlock.prototype = {

		/**
		 * 计算画布9个点
		 * @param {Number} x
		 * @param {Number} y
		 */
		_drawLocalPoint: function (x, y) {
			var data = [],
				self = this,
				offsetX = self.offsetX,
				offsetY = self.offsetY,
				r = self.r;

			for (var row = 0; row < 3; row++) {
				for (var col = 0; col < 3; col++) {
					var ninePoint = {
						x: (offsetX + col * x + (col * 2 + 1) * r),
						y: (offsetY + row * y + (row * 2 + 1) * r)
					};
					data.push(ninePoint);
				}
			}

			return data;
		},

		/**
		 * 检测是否引入了必要的库与options
		 * @param {Array Object} options 要检测的项
		 */
		environment: function (options) {
			for (var i = 0, len = options.length; i < len; i++) {

				if (!options[i].key) {
					throw new Error(options[i].value);
				}

			}
		},

		/**
		 * 初始化事件监听
		 * @param {HTMLElement} dom
		 * @param {Object} cxt canvas画笔 
		 * @param {function} callback 
		 */
		_initListeners: function (canvasDom, cxt, callback) {
			var linePoint = [],
				that = this;

			// 触摸开始
			canvasDom.addEventListener('touchstart', function (e) {
				that._selectPoint(e.touches[0], linePoint);
			});

			// 移动选点
			canvasDom.addEventListener('touchmove', function (e) {
				e.preventDefault();

				var touches = e.touches[0];
				that._selectPoint(touches, linePoint);

				cxt.clearRect(0, 0, that.cw, that.ch);

				that._draw(that.pointArr, linePoint, {
					x: touches.pageX,
					y: touches.pageY - that.offsetTop
				}, cxt);
			});

			// 手势结束获取点
			canvasDom.addEventListener('touchend', function (e) {
				cxt.clearRect(0, 0, that.cw, that.ch);
				that._draw(that.pointArr, linePoint, null, cxt);
				// 回调函数
				callback.call(that, linePoint);
				linePoint = [];
			});
		},

		/**
		 * 选点
		 * @param {event} event.touches
		 * @param {Array} LinePoint 已选择的点
		 */
		_selectPoint: function (touches, LinePoint) {
			var pointArr = this.pointArr;

			for (var i = 0, len = pointArr.length; i < len; i++) {
				var curPoint = pointArr[i],
					xDiff = Math.abs(curPoint.x - touches.pageX),
					yDiff = Math.abs(curPoint.y - (touches.pageY - this.offsetTop)),
					dir = Math.pow((xDiff * xDiff + yDiff * yDiff), 0.5);

				if (dir < this.r) {

					if (LinePoint.indexOf(i) < 0) {
						LinePoint.push(i);
					}
					break;
				}
			}
		},

		/**
		 * 绘制圆点
		 * @param {Array} pointArr 画布9个点
		 * @param {Array} linePointArr 存储已连点
		 * @param {Object} touchPoint 触摸点
		 * @param {Object} cxt canvas画笔
		 */
		_draw: function (pointArr, linePointArr, touchPoint, cxt) {
			var self = this,
				r = self.r,
				pI_2 = Math.PI * 2;

			if (linePointArr.length > 0) {
				cxt.beginPath();
				for (var i = 0, len = linePointArr.length; i < len; i++) {
					var index = linePointArr[i];
					cxt.lineTo(pointArr[index].x, pointArr[index].y);
				}

				cxt.lineWidth = self.lineWidth;
				cxt.strokeStyle = self.lineColor;
				cxt.stroke();
				cxt.closePath();

				if (touchPoint != null) {
					var lastIndex = linePointArr[linePointArr.length - 1],
						lastPoint = pointArr[lastIndex];

					cxt.beginPath();
					cxt.moveTo(lastPoint.x, lastPoint.y);
					cxt.lineTo(touchPoint.x, touchPoint.y);
					cxt.stroke();
					cxt.closePath();
				}
			}

			for (var i = 0, len = pointArr.length; i < len; i++) {
				var point = pointArr[i];

				cxt.fillStyle = self.outRoundBorderColor;
				cxt.beginPath();
				cxt.arc(point.x, point.y, r, 0, pI_2, true);
				cxt.closePath();

				cxt.fill();
				cxt.fillStyle = self.outRoundColor;

				cxt.beginPath();
				cxt.arc(point.x, point.y, r - 3, 0, pI_2, true);
				cxt.closePath();
				cxt.fill();

				if (linePointArr.indexOf(i) >= 0) {
					cxt.fillStyle = self.innerRoundColor;
					cxt.beginPath();
					cxt.arc(point.x, point.y, r - 16, 0, pI_2, true);
					cxt.closePath();
					cxt.fill();
				}
			}
		}
	};

	window.GridUnlock = GridUnlock;
}(document, window.Util));