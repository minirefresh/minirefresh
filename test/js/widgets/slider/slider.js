/**
 * 作者: 郭天琦
 * 创建时间: 2017/06/29
 * 版本: [1.0, 2017/06/29 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 图片滚动slider
 */

(function (doc, Util) {
	"use strict";

	/**
	 * 使用
	 * @constructor
	 * @param {JSON} options 一些配置
	 * container {HTMLElement} 容器元素 必填
	 * direction {String} 方向 值为：up、right、down、left, 默认为up
	 * height {String} 容器高度
	 */
	function Slider(options) {
		var self = this;

		var existArray = [{
			value: options.container,
			text: '请传入滚动元素容器'
		}];

		// 检测是否存在
		self.isExist(existArray);
		self.intev = parseInt(options.intev) || 50;

		self.container = Util.selector(options.container);
		self.moveEle = self.container.querySelector('[data-slider]');
		
		if(!self.moveEle) {
		    self.moveEle = self.container.children[0];
		}

		// 容器高度
		if (options.height) {
			self.height = parseInt(options.height);
			self.setProperty(self.container, {
				key: 'height',
				value: self.height + 'px'
			});
		} else {
			self.height = self.container.offsetHeight;
		}

		// 获取方向 执行动画
		self._getDirection(options.direction);
	}

	/**
     * 定义原型
     */
	Slider.prototype = {

		/**
		 * 获取方向
		 * @param {String} direction
		 */
		_getDirection: function (direction) {
			var self = this;

			switch (direction) {
				case 'down':
					self._upDownAnimation('down');
					break;

				case 'left':
					self._leftRightAnimation('left');
					break;

				case 'right':
					self._leftRightAnimation('right');
					break;

				default:
					self._upDownAnimation('up');
					break;
			}
		},

		/**
		 * 向上向下动画函数
		 * @param {String} 方向 direction
		 */
		_upDownAnimation: function (direction) {
			var that = this,
				container = this.container,
				moveEle = this.moveEle,
				count = 0,
				transform = this.transform,
				moveFn;

			if (moveEle.scrollHeight > container.offsetHeight) {
				moveEle.innerHTML += moveEle.innerHTML;

				var moveEleHeight = moveEle.scrollHeight / 2;

				if (direction == 'down') {

					moveFn = function () {
						if (Math.floor(count) == 0) {
							count = -moveEleHeight;

							transform(moveEle, 0, -moveEleHeight);
						} else {
							count++;

							transform(moveEle, 0, count);
						}
					};

				} else if (direction == 'up') {

					moveFn = function () {
						if (count <= -moveEleHeight) {
							count = 0;

							transform(moveEle, 0, count);
						} else {
							count--;

							transform(moveEle, 0, count);
						}
					};
				}

				setTimeout(function () {
					that._requestAnimationFrame(moveFn, that.intev);
				}, 0);
			}
		},

		/**
		 * 向左向右动画函数
		 * @param {String} 方向 direction
		 */
		_leftRightAnimation: function (direction) {
			var container = this.container,
				that = this,
				moveEle = this.moveEle,
				transform = this.transform,
				count = 0,
				pageWidth = window.screen.width,
				moveFn;

			if (moveEle.scrollWidth > pageWidth) {
				moveEle.innerHTML += moveEle.innerHTML;

				var moveWidth = moveEle.scrollWidth,
					moveWidthHalf = moveWidth / 2;

				if (direction == 'left') {
					moveFn = function () {

						if (count <= -moveWidthHalf) {
							count = 0;
						} else {
							count--;
						}

						transform(moveEle, count);
					};
				} else if (direction == 'right') {
					moveFn = function () {
						if (Math.floor(count) == 0) {
							count = -moveWidthHalf;
							transform(moveEle, -moveWidthHalf);
						} else {
							count++;
							transform(moveEle, count);
						}
					}
				}

				setTimeout(function () {
					that._requestAnimationFrame(moveFn, that.intev);
				}, 0);
			}
		},

		/**
		 * 过度动画
		 * @param {Function} 回调函数
		 * @param {Number} 几秒执行一次
		 */
		_requestAnimationFrame: function (callback, intev) {
			requestAnimationFrame(function polling() {
				callback();

				setTimeout(function () {
					requestAnimationFrame(polling);
				}, intev);
			});
		},

		/**
		 * 设置css属性
		 * @param {HTMLElement} dom
		 * @param {Object} options
		 * key {String} property
		 * value {String} 属性
		 */
		setProperty: function (dom, options) {
			dom.style[options.key] = options.value;
		},

		/**
		 * 移动transfrom
		 * @param {HTMLElement} dom
		 * @param {String} x x轴
		 * @param {String} y y轴
		 */
		transform: function (dom, x, y) {
			y = y || 0;

			dom.style.transform = "translate3d(" + x + "px, " + y + "px, 0)";
		},

		/**
		 * 判断是否存在
		 * @param {Array Object} array
		 * value {String} 值
		 * text {String} 要抛出的异常
		 */
		isExist: function (existArray) {
			existArray.forEach(function (item) {
				if (item.value == '' || !item.value) {
					throw new Error(item.text);
				}
			});
		}
	};

	window.Slider = Slider;

}(document, window.Util));