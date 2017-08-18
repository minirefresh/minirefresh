/*! iScroll v5.2.0-snapshot ~ (c) 2008-2017 Matteo Spinelli ~ http://cubiq.org/license */
/*
 * 这个是IScroll的实现，下拉刷新是基于这个文件的
 * 下拉刷新中使用的type是 probeType(因为到了3就不能用css动画了，影响性能)
 * 注意，自定义了几个地方:
 * 1.将requestAnimationFrame暴露出去了
 * 2.增加了一个自定义事件 touchEnd,方便下拉刷新使用
 * 3.增加一个minScrollY，这样可以动态更改IScroll的头部位置（这个值与外部的offset有关）
 * 4.增加了cmd引入支持
 */

(function(window, document, Math) {
	var rAF = window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function(callback) { window.setTimeout(callback, 1000 / 60); };

	//自定义: 暴露出去
	window.requestAnimationFrame = rAF;

	var utils = (function() {
		var me = {};

		var _elementStyle = document.createElement('div').style;
		var _vendor = (function() {
			var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
				transform,
				i = 0,
				l = vendors.length;

			for(; i < l; i++) {
				transform = vendors[i] + 'ransform';
				if(transform in _elementStyle) return vendors[i].substr(0, vendors[i].length - 1);
			}

			return false;
		})();

		function _prefixStyle(style) {
			if(_vendor === false) return false;
			if(_vendor === '') return style;
			return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
		}

		me.getTime = Date.now || function getTime() { return new Date().getTime(); };

		me.extend = function(target, obj) {
			for(var i in obj) {
				target[i] = obj[i];
			}
		};

		me.addEvent = function(el, type, fn, capture) {
			el.addEventListener(type, fn, !!capture);
		};

		me.removeEvent = function(el, type, fn, capture) {
			el.removeEventListener(type, fn, !!capture);
		};

		me.prefixPointerEvent = function(pointerEvent) {
			return window.MSPointerEvent ?
				'MSPointer' + pointerEvent.charAt(7).toUpperCase() + pointerEvent.substr(8) :
				pointerEvent;
		};

		me.momentum = function(current, start, time, lowerMargin, wrapperSize, deceleration) {
			var distance = current - start,
				speed = Math.abs(distance) / time,
				destination,
				duration;

			deceleration = deceleration === undefined ? 0.0006 : deceleration;

			destination = current + (speed * speed) / (2 * deceleration) * (distance < 0 ? -1 : 1);
			duration = speed / deceleration;

			if(destination < lowerMargin) {
				destination = wrapperSize ? lowerMargin - (wrapperSize / 2.5 * (speed / 8)) : lowerMargin;
				distance = Math.abs(destination - current);
				duration = distance / speed;
			} else if(destination > 0) {
				destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0;
				distance = Math.abs(current) + destination;
				duration = distance / speed;
			}

			return {
				destination: Math.round(destination),
				duration: duration
			};
		};

		var _transform = _prefixStyle('transform');
		var _transition = _prefixStyle('transition');

		me.extend(me, {
			hasTransform: _transform !== false,
			hasPerspective: _prefixStyle('perspective') in _elementStyle,
			hasTouch: 'ontouchstart' in window,
			hasPointer: !!(window.PointerEvent || window.MSPointerEvent), // IE10 is prefixed
			hasTransition: _prefixStyle('transition') in _elementStyle
		});

		/*
	This should find all Android browsers lower than build 535.19 (both stock browser and webview)
	- galaxy S2 is ok
    - 2.3.6 : `AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1`
    - 4.0.4 : `AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`
   - galaxy S3 is badAndroid (stock brower, webview)
     `AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`
   - galaxy S4 is badAndroid (stock brower, webview)
     `AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30`
   - galaxy S5 is OK
     `AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 (Chrome/)`
   - galaxy S6 is OK
     `AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 (Chrome/)`
  */
		me.isBadAndroid = (function() {
			var appVersion = window.navigator.appVersion;
			// Android browser is not a chrome browser.
			if(/Android/.test(appVersion) && !(/Chrome\/\d/.test(appVersion))) {
				var safariVersion = appVersion.match(/Safari\/(\d+.\d)/);
				if(safariVersion && typeof safariVersion === "object" && safariVersion.length >= 2) {
					return parseFloat(safariVersion[1]) < 535.19;
				} else {
					return true;
				}
			} else {
				return false;
			}
		})();

		me.extend(me.style = {}, {
			transform: _transform,
			transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
			transitionDuration: _prefixStyle('transitionDuration'),
			transitionDelay: _prefixStyle('transitionDelay'),
			transformOrigin: _prefixStyle('transformOrigin'),
			touchAction: _prefixStyle('touchAction')
		});

		me.hasClass = function(e, c) {
			var re = new RegExp("(^|\\s)" + c + "(\\s|$)");
			return re.test(e.className);
		};

		me.addClass = function(e, c) {
			if(me.hasClass(e, c)) {
				return;
			}

			var newclass = e.className.split(' ');
			newclass.push(c);
			e.className = newclass.join(' ');
		};

		me.removeClass = function(e, c) {
			if(!me.hasClass(e, c)) {
				return;
			}

			var re = new RegExp("(^|\\s)" + c + "(\\s|$)", 'g');
			e.className = e.className.replace(re, ' ');
		};

		me.offset = function(el) {
			var left = -el.offsetLeft,
				top = -el.offsetTop;

			// jshint -W084
			while(el = el.offsetParent) {
				left -= el.offsetLeft;
				top -= el.offsetTop;
			}
			// jshint +W084

			return {
				left: left,
				top: top
			};
		};

		me.preventDefaultException = function(el, exceptions) {
			for(var i in exceptions) {
				if(exceptions[i].test(el[i])) {
					return true;
				}
			}

			return false;
		};

		me.extend(me.eventType = {}, {
			touchstart: 1,
			touchmove: 1,
			touchend: 1,

			mousedown: 2,
			mousemove: 2,
			mouseup: 2,

			pointerdown: 3,
			pointermove: 3,
			pointerup: 3,

			MSPointerDown: 3,
			MSPointerMove: 3,
			MSPointerUp: 3
		});

		me.extend(me.ease = {}, {
			quadratic: {
				style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				fn: function(k) {
					return k * (2 - k);
				}
			},
			circular: {
				style: 'cubic-bezier(0.1, 0.57, 0.1, 1)', // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
				fn: function(k) {
					return Math.sqrt(1 - (--k * k));
				}
			},
			back: {
				style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
				fn: function(k) {
					var b = 4;
					return(k = k - 1) * k * ((b + 1) * k + b) + 1;
				}
			},
			bounce: {
				style: '',
				fn: function(k) {
					if((k /= 1) < (1 / 2.75)) {
						return 7.5625 * k * k;
					} else if(k < (2 / 2.75)) {
						return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
					} else if(k < (2.5 / 2.75)) {
						return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
					} else {
						return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
					}
				}
			},
			elastic: {
				style: '',
				fn: function(k) {
					var f = 0.22,
						e = 0.4;

					if(k === 0) { return 0; }
					if(k == 1) { return 1; }

					return(e * Math.pow(2, -10 * k) * Math.sin((k - f / 4) * (2 * Math.PI) / f) + 1);
				}
			}
		});

		me.tap = function(e, eventName) {
			var ev = document.createEvent('Event');
			ev.initEvent(eventName, true, true);
			ev.pageX = e.pageX;
			ev.pageY = e.pageY;
			e.target.dispatchEvent(ev);
		};

		me.click = function(e) {
			var target = e.target,
				ev;

			if(!(/(SELECT|INPUT|TEXTAREA)/i).test(target.tagName)) {
				// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/initMouseEvent
				// initMouseEvent is deprecated.
				ev = document.createEvent(window.MouseEvent ? 'MouseEvents' : 'Event');
				ev.initEvent('click', true, true);
				ev.view = e.view || window;
				ev.detail = 1;
				ev.screenX = target.screenX || 0;
				ev.screenY = target.screenY || 0;
				ev.clientX = target.clientX || 0;
				ev.clientY = target.clientY || 0;
				ev.ctrlKey = !!e.ctrlKey;
				ev.altKey = !!e.altKey;
				ev.shiftKey = !!e.shiftKey;
				ev.metaKey = !!e.metaKey;
				ev.button = 0;
				ev.relatedTarget = null;
				ev._constructed = true;
				target.dispatchEvent(ev);
			}
		};

		me.getTouchAction = function(eventPassthrough, addPinch) {
			var touchAction = 'none';
			if(eventPassthrough === 'vertical') {
				touchAction = 'pan-y';
			} else if(eventPassthrough === 'horizontal') {
				touchAction = 'pan-x';
			}
			if(addPinch && touchAction != 'none') {
				// add pinch-zoom support if the browser supports it, but if not (eg. Chrome <55) do nothing
				touchAction += ' pinch-zoom';
			}
			return touchAction;
		};

		me.getRect = function(el) {
			if(el instanceof SVGElement) {
				var rect = el.getBoundingClientRect();
				return {
					top: rect.top,
					left: rect.left,
					width: rect.width,
					height: rect.height
				};
			} else {
				return {
					top: el.offsetTop,
					left: el.offsetLeft,
					width: el.offsetWidth,
					height: el.offsetHeight
				};
			}
		};

		return me;
	})();

	function IScroll(el, options) {
		this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
		this.scroller = this.wrapper.children[0];
		this.scrollerStyle = this.scroller.style; // cache style for better performance

		this.options = {

			resizeScrollbars: true,

			mouseWheelSpeed: 20,

			snapThreshold: 0.334,

			// INSERT POINT: OPTIONS
			disablePointer: !utils.hasPointer,
			disableTouch: utils.hasPointer || !utils.hasTouch,
			disableMouse: utils.hasPointer || utils.hasTouch,
			startX: 0,
			startY: 0,
			scrollY: true,
			directionLockThreshold: 5,
			momentum: true,

			bounce: true,
			bounceTime: 600,
			bounceEasing: '',

			preventDefault: true,
			preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/ },

			HWCompositing: true,
			useTransition: true,
			useTransform: true,
			bindToWrapper: typeof window.onmousedown === "undefined"
		};

		for(var i in options) {
			this.options[i] = options[i];
		}

		// Normalize options
		this.translateZ = this.options.HWCompositing && utils.hasPerspective ? ' translateZ(0)' : '';

		this.options.useTransition = utils.hasTransition && this.options.useTransition;

		this.options.useTransform = utils.hasTransform && this.options.useTransform;

		this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
		this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;

		// If you want eventPassthrough I have to lock one of the axes
		this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
		this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;

		// With eventPassthrough we also need lockDirection mechanism
		this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough;
		this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;
		this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? utils.ease[this.options.bounceEasing] || utils.ease.circular : this.options.bounceEasing;

		this.options.resizePolling = this.options.resizePolling === undefined ? 60 : this.options.resizePolling;

		if(this.options.tap === true) {
			this.options.tap = 'tap';
		}

		// https://github.com/cubiq/iscroll/issues/1029
		if(!this.options.useTransition && !this.options.useTransform) {
			if(!(/relative|absolute/i).test(this.scrollerStyle.position)) {
				this.scrollerStyle.position = "relative";
			}
		}

		if(this.options.shrinkScrollbars == 'scale') {
			this.options.useTransition = false;
		}

		this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1;

		if(this.options.probeType == 3) {
			this.options.useTransition = false;
		}

		// INSERT POINT: NORMALIZATION

		// Some defaults
		this.x = 0;
		this.y = 0;
		this.directionX = 0;
		this.directionY = 0;
		this._events = {};

		// INSERT POINT: DEFAULTS

		this._init();
		this.refresh();

		this.scrollTo(this.options.startX, this.options.startY);
		this.enable();
	}

	IScroll.prototype = {
		version: '5.2.0-snapshot',

		_init: function() {
			this._initEvents();

			if(this.options.scrollbars || this.options.indicators) {
				this._initIndicators();
			}

			if(this.options.mouseWheel) {
				this._initWheel();
			}

			if(this.options.snap) {
				this._initSnap();
			}

			if(this.options.keyBindings) {
				this._initKeys();
			}

			// INSERT POINT: _init

		},

		destroy: function() {
			this._initEvents(true);
			clearTimeout(this.resizeTimeout);
			this.resizeTimeout = null;
			this._execEvent('destroy');
		},

		_transitionEnd: function(e) {
			if(e.target != this.scroller || !this.isInTransition) {
				return;
			}

			this._transitionTime();
			if(!this.resetPosition(this.options.bounceTime)) {
				this.isInTransition = false;
				this._execEvent('scrollEnd');
			}
		},

		_start: function(e) {
			// React to left mouse button only
			if(utils.eventType[e.type] != 1) {
				// for button property
				// http://unixpapa.com/js/mouse.html
				var button;
				if(!e.which) {
					/* IE case */
					button = (e.button < 2) ? 0 :
						((e.button == 4) ? 1 : 2);
				} else {
					/* All others */
					button = e.button;
				}
				if(button !== 0) {
					return;
				}
			}

			if(!this.enabled || (this.initiated && utils.eventType[e.type] !== this.initiated)) {
				return;
			}

			if(this.options.preventDefault && !utils.isBadAndroid && !utils.preventDefaultException(e.target, this.options.preventDefaultException)) {
				e.preventDefault();
			}

			var point = e.touches ? e.touches[0] : e,
				pos;

			this.initiated = utils.eventType[e.type];
			this.moved = false;
			this.distX = 0;
			this.distY = 0;
			this.directionX = 0;
			this.directionY = 0;
			this.directionLocked = 0;

			this.startTime = utils.getTime();

			if(this.options.useTransition && this.isInTransition) {
				this._transitionTime();
				this.isInTransition = false;
				pos = this.getComputedPosition();
				this._translate(Math.round(pos.x), Math.round(pos.y));
				this._execEvent('scrollEnd');
			} else if(!this.options.useTransition && this.isAnimating) {
				this.isAnimating = false;
				this._execEvent('scrollEnd');
			}

			this.startX = this.x;
			this.startY = this.y;
			this.absStartX = this.x;
			this.absStartY = this.y;
			this.pointX = point.pageX;
			this.pointY = point.pageY;

			this._execEvent('beforeScrollStart');
		},

		_move: function(e) {
			if(!this.enabled || utils.eventType[e.type] !== this.initiated) {
				return;
			}
			if(this.options.preventDefault) { // increases performance on Android? TODO: check!
				e.preventDefault();
			}

			var point = e.touches ? e.touches[0] : e,
				deltaX = point.pageX - this.pointX,
				deltaY = point.pageY - this.pointY,
				timestamp = utils.getTime(),
				newX, newY,
				absDistX, absDistY;

			this.pointX = point.pageX;
			this.pointY = point.pageY;

			this.distX += deltaX;
			this.distY += deltaY;
			absDistX = Math.abs(this.distX);
			absDistY = Math.abs(this.distY);

			// We need to move at least 10 pixels for the scrolling to initiate
			if(timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10)) {
				return;
			}
			// If you are scrolling in one direction lock the other
			if(!this.directionLocked && !this.options.freeScroll) {
				if(absDistX > absDistY + this.options.directionLockThreshold) {
					this.directionLocked = 'h'; // lock horizontally
				} else if(absDistY >= absDistX + this.options.directionLockThreshold) {
					this.directionLocked = 'v'; // lock vertically
				} else {
					this.directionLocked = 'n'; // no lock
				}
			}
			if(this.directionLocked == 'h') {
				if(this.options.eventPassthrough == 'vertical') {
					e.preventDefault();
				} else if(this.options.eventPassthrough == 'horizontal') {
					this.initiated = false;
					return;
				}

				deltaY = 0;
			} else if(this.directionLocked == 'v') {
				if(this.options.eventPassthrough == 'horizontal') {
					e.preventDefault();
				} else if(this.options.eventPassthrough == 'vertical') {
					this.initiated = false;
					return;
				}

				deltaX = 0;
			}

			deltaX = this.hasHorizontalScroll ? deltaX : 0;
			deltaY = this.hasVerticalScroll ? deltaY : 0;

			newX = this.x + deltaX;
			newY = this.y + deltaY;

			// Slow down if outside of the boundaries
			if(newX > this.minScrollY || newX < this.maxScrollX) {
				newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
			}
			if(newY > this.minScrollY || newY < this.maxScrollY) {
				newY = this.options.bounce ? this.y + deltaY / 3 : newY > this.minScrollY ? this.minScrollY : this.maxScrollY;
			}

			this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
			this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

			if(!this.moved) {
				this._execEvent('scrollStart');
			}

			this.moved = true;

			this._translate(newX, newY);

			/* REPLACE START: _move */
			if(timestamp - this.startTime > 300) {
				this.startTime = timestamp;
				this.startX = this.x;
				this.startY = this.y;

				if(this.options.probeType == 1) {
					this._execEvent('scroll');
				}
			}

			if(this.options.probeType > 1) {
				this._execEvent('scroll');
			}
			/* REPLACE END: _move */
		},

		_end: function(e) {
			if(!this.enabled || utils.eventType[e.type] !== this.initiated) {
				return;
			}

			if(this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException)) {
				e.preventDefault();
			}
			//自定义: 增加一个自定义事件
			this._execEvent('touchEnd');
			var point = e.changedTouches ? e.changedTouches[0] : e,
				momentumX,
				momentumY,
				duration = utils.getTime() - this.startTime,
				newX = Math.round(this.x),
				newY = Math.round(this.y),
				distanceX = Math.abs(newX - this.startX),
				distanceY = Math.abs(newY - this.startY),
				time = 0,
				easing = '';

			this.isInTransition = 0;
			this.initiated = 0;
			this.endTime = utils.getTime();
			// reset if we are outside of the boundaries
			if(this.resetPosition(this.options.bounceTime)) {
				return;
			}

			this.scrollTo(newX, newY); // ensures that the last position is rounded

			// we scrolled less than 10 pixels
			if(!this.moved) {
				if(this.options.tap) {
					utils.tap(e, this.options.tap);
				}

				if(this.options.click) {
					utils.click(e);
				}

				this._execEvent('scrollCancel');
				return;
			}

			if(this._events.flick && duration < 200 && distanceX < 100 && distanceY < 100) {
				this._execEvent('flick');
				return;
			}

			// start momentum animation if needed
			if(this.options.momentum && duration < 300) {
				momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : { destination: newX, duration: 0 };
				momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : { destination: newY, duration: 0 };
				newX = momentumX.destination;
				newY = momentumY.destination;
				time = Math.max(momentumX.duration, momentumY.duration);
				this.isInTransition = 1;
			}

			if(this.options.snap) {
				var snap = this._nearestSnap(newX, newY);
				this.currentPage = snap;
				time = this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(newX - snap.x), 1000),
						Math.min(Math.abs(newY - snap.y), 1000)
					), 300);
				newX = snap.x;
				newY = snap.y;

				this.directionX = 0;
				this.directionY = 0;
				easing = this.options.bounceEasing;
			}

			// INSERT POINT: _end

			if(newX != this.x || newY != this.y) {
				// change easing function when scroller goes out of the boundaries
				if(newX > 0 || newX < this.maxScrollX || newY > this.minScrollY || newY < this.maxScrollY) {
					easing = utils.ease.quadratic;
				}

				this.scrollTo(newX, newY, time, easing);
				return;
			}

			this._execEvent('scrollEnd');
		},

		_resize: function() {
			var that = this;

			clearTimeout(this.resizeTimeout);

			this.resizeTimeout = setTimeout(function() {
				that.refresh();
			}, this.options.resizePolling);
		},

		resetPosition: function(time) {
			var x = this.x,
				y = this.y;

			time = time || 0;

			if(!this.hasHorizontalScroll || this.x > 0) {
				x = 0;
			} else if(this.x < this.maxScrollX) {
				x = this.maxScrollX;
			}

			if(!this.hasVerticalScroll || this.y > this.minScrollY) {
				y = this.minScrollY;
			} else if(this.y < this.maxScrollY) {
				y = this.maxScrollY;
			}

			if(x == this.x && y == this.y) {
				return false;
			}
			this.scrollTo(x, y, time, this.options.bounceEasing);

			return true;
		},

		disable: function() {
			this.enabled = false;
		},

		enable: function() {
			this.enabled = true;
		},

		refresh: function() {
			utils.getRect(this.wrapper); // Force reflow

			this.wrapperWidth = this.wrapper.clientWidth;
			this.wrapperHeight = this.wrapper.clientHeight;

			var rect = utils.getRect(this.scroller);
			/* REPLACE START: refresh */

			this.scrollerWidth = rect.width;
			this.scrollerHeight = rect.height;

			this.maxScrollX = this.wrapperWidth - this.scrollerWidth;
			this.maxScrollY = this.wrapperHeight - this.scrollerHeight;
			//默认是0
			this.minScrollY = this.minScrollY || 0;
			/* REPLACE END: refresh */
			if(this.maxScrollY>this.minScrollY) {
				this.maxScrollY = this.minScrollY;
			}
			this.hasHorizontalScroll = this.options.scrollX && this.maxScrollX < 0;
			this.hasVerticalScroll = this.options.scrollY && this.maxScrollY < 0;

			if(!this.hasHorizontalScroll) {
				this.maxScrollX = 0;
				this.scrollerWidth = this.wrapperWidth;
			}

			if(!this.hasVerticalScroll) {
				this.maxScrollY = 0;
				this.scrollerHeight = this.wrapperHeight;
			}

			this.endTime = 0;
			this.directionX = 0;
			this.directionY = 0;

			if(utils.hasPointer && !this.options.disablePointer) {
				// The wrapper should have `touchAction` property for using pointerEvent.
				this.wrapper.style[utils.style.touchAction] = utils.getTouchAction(this.options.eventPassthrough, true);

				// case. not support 'pinch-zoom'
				// https://github.com/cubiq/iscroll/issues/1118#issuecomment-270057583
				if(!this.wrapper.style[utils.style.touchAction]) {
					this.wrapper.style[utils.style.touchAction] = utils.getTouchAction(this.options.eventPassthrough, false);
				}
			}
			this.wrapperOffset = utils.offset(this.wrapper);

			this._execEvent('refresh');

			this.resetPosition();

			// INSERT POINT: _refresh

		},

		on: function(type, fn) {
			if(!this._events[type]) {
				this._events[type] = [];
			}

			this._events[type].push(fn);
		},

		off: function(type, fn) {
			if(!this._events[type]) {
				return;
			}

			var index = this._events[type].indexOf(fn);

			if(index > -1) {
				this._events[type].splice(index, 1);
			}
		},

		_execEvent: function(type) {
			if(!this._events[type]) {
				return;
			}

			var i = 0,
				l = this._events[type].length;

			if(!l) {
				return;
			}

			for(; i < l; i++) {
				this._events[type][i].apply(this, [].slice.call(arguments, 1));
			}
		},

		scrollBy: function(x, y, time, easing) {
			x = this.x + x;
			y = this.y + y;
			time = time || 0;

			this.scrollTo(x, y, time, easing);
		},

		scrollTo: function(x, y, time, easing) {
			easing = easing || utils.ease.circular;
			this.isInTransition = this.options.useTransition && time > 0;
			var transitionType = this.options.useTransition && easing.style;
			if(!time || transitionType) {
				if(transitionType) {
					this._transitionTimingFunction(easing.style);
					this._transitionTime(time);
				}

				this._translate(x, y);
			} else {
				this._animate(x, y, time, easing.fn);
			}
		},

		scrollToElement: function(el, time, offsetX, offsetY, easing) {
			el = el.nodeType ? el : this.scroller.querySelector(el);

			if(!el) {
				return;
			}

			var pos = utils.offset(el);

			pos.left -= this.wrapperOffset.left;
			pos.top -= this.wrapperOffset.top;

			// if offsetX/Y are true we center the element to the screen
			var elRect = utils.getRect(el);
			var wrapperRect = utils.getRect(this.wrapper);
			if(offsetX === true) {
				offsetX = Math.round(elRect.width / 2 - wrapperRect.width / 2);
			}
			if(offsetY === true) {
				offsetY = Math.round(elRect.height / 2 - wrapperRect.height / 2);
			}

			pos.left -= offsetX || 0;
			pos.top -= offsetY || 0;

			pos.left = pos.left > 0 ? 0 : pos.left < this.maxScrollX ? this.maxScrollX : pos.left;
			pos.top = pos.top > 0 ? 0 : pos.top < this.maxScrollY ? this.maxScrollY : pos.top;

			time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(this.x - pos.left), Math.abs(this.y - pos.top)) : time;

			this.scrollTo(pos.left, pos.top, time, easing);
		},

		_transitionTime: function(time) {
			if(!this.options.useTransition) {
				return;
			}
			time = time || 0;
			var durationProp = utils.style.transitionDuration;
			if(!durationProp) {
				return;
			}

			this.scrollerStyle[durationProp] = time + 'ms';

			if(!time && utils.isBadAndroid) {
				this.scrollerStyle[durationProp] = '0.0001ms';
				// remove 0.0001ms
				var self = this;
				rAF(function() {
					if(self.scrollerStyle[durationProp] === '0.0001ms') {
						self.scrollerStyle[durationProp] = '0s';
					}
				});
			}

			if(this.indicators) {
				for(var i = this.indicators.length; i--;) {
					this.indicators[i].transitionTime(time);
				}
			}

			// INSERT POINT: _transitionTime

		},

		_transitionTimingFunction: function(easing) {
			this.scrollerStyle[utils.style.transitionTimingFunction] = easing;

			if(this.indicators) {
				for(var i = this.indicators.length; i--;) {
					this.indicators[i].transitionTimingFunction(easing);
				}
			}

			// INSERT POINT: _transitionTimingFunction

		},

		_translate: function(x, y) {
			if(this.options.useTransform) {

				/* REPLACE START: _translate */

				this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;

				/* REPLACE END: _translate */

			} else {
				x = Math.round(x);
				y = Math.round(y);
				this.scrollerStyle.left = x + 'px';
				this.scrollerStyle.top = y + 'px';
			}

			this.x = x;
			this.y = y;

			if(this.indicators) {
				for(var i = this.indicators.length; i--;) {
					this.indicators[i].updatePosition();
				}
			}

			// INSERT POINT: _translate

		},

		_initEvents: function(remove) {
			var eventType = remove ? utils.removeEvent : utils.addEvent,
				target = this.options.bindToWrapper ? this.wrapper : window;

			eventType(window, 'orientationchange', this);
			eventType(window, 'resize', this);

			if(this.options.click) {
				eventType(this.wrapper, 'click', this, true);
			}

			if(!this.options.disableMouse) {
				eventType(this.wrapper, 'mousedown', this);
				eventType(target, 'mousemove', this);
				eventType(target, 'mousecancel', this);
				eventType(target, 'mouseup', this);
			}

			if(utils.hasPointer && !this.options.disablePointer) {
				eventType(this.wrapper, utils.prefixPointerEvent('pointerdown'), this);
				eventType(target, utils.prefixPointerEvent('pointermove'), this);
				eventType(target, utils.prefixPointerEvent('pointercancel'), this);
				eventType(target, utils.prefixPointerEvent('pointerup'), this);
			}

			if(utils.hasTouch && !this.options.disableTouch) {
				eventType(this.wrapper, 'touchstart', this);
				eventType(target, 'touchmove', this);
				eventType(target, 'touchcancel', this);
				eventType(target, 'touchend', this);
			}

			eventType(this.scroller, 'transitionend', this);
			eventType(this.scroller, 'webkitTransitionEnd', this);
			eventType(this.scroller, 'oTransitionEnd', this);
			eventType(this.scroller, 'MSTransitionEnd', this);
		},

		getComputedPosition: function() {
			var matrix = window.getComputedStyle(this.scroller, null),
				x, y;

			if(this.options.useTransform) {
				matrix = matrix[utils.style.transform].split(')')[0].split(', ');
				x = +(matrix[12] || matrix[4]);
				y = +(matrix[13] || matrix[5]);
			} else {
				x = +matrix.left.replace(/[^-\d.]/g, '');
				y = +matrix.top.replace(/[^-\d.]/g, '');
			}

			return { x: x, y: y };
		},
		_initIndicators: function() {
			var interactive = this.options.interactiveScrollbars,
				customStyle = typeof this.options.scrollbars != 'string',
				indicators = [],
				indicator;

			var that = this;

			this.indicators = [];

			if(this.options.scrollbars) {
				// Vertical scrollbar
				if(this.options.scrollY) {
					indicator = {
						el: createDefaultScrollbar('v', interactive, this.options.scrollbars),
						interactive: interactive,
						defaultScrollbars: true,
						customStyle: customStyle,
						resize: this.options.resizeScrollbars,
						shrink: this.options.shrinkScrollbars,
						fade: this.options.fadeScrollbars,
						listenX: false
					};

					this.wrapper.appendChild(indicator.el);
					indicators.push(indicator);
				}

				// Horizontal scrollbar
				if(this.options.scrollX) {
					indicator = {
						el: createDefaultScrollbar('h', interactive, this.options.scrollbars),
						interactive: interactive,
						defaultScrollbars: true,
						customStyle: customStyle,
						resize: this.options.resizeScrollbars,
						shrink: this.options.shrinkScrollbars,
						fade: this.options.fadeScrollbars,
						listenY: false
					};

					this.wrapper.appendChild(indicator.el);
					indicators.push(indicator);
				}
			}

			if(this.options.indicators) {
				// TODO: check concat compatibility
				indicators = indicators.concat(this.options.indicators);
			}

			for(var i = indicators.length; i--;) {
				this.indicators.push(new Indicator(this, indicators[i]));
			}

			// TODO: check if we can use array.map (wide compatibility and performance issues)
			function _indicatorsMap(fn) {
				if(that.indicators) {
					for(var i = that.indicators.length; i--;) {
						fn.call(that.indicators[i]);
					}
				}
			}

			if(this.options.fadeScrollbars) {
				this.on('scrollEnd', function() {
					_indicatorsMap(function() {
						this.fade();
					});
				});

				this.on('scrollCancel', function() {
					_indicatorsMap(function() {
						this.fade();
					});
				});

				this.on('scrollStart', function() {
					_indicatorsMap(function() {
						this.fade(1);
					});
				});

				this.on('beforeScrollStart', function() {
					_indicatorsMap(function() {
						this.fade(1, true);
					});
				});
			}

			this.on('refresh', function() {
				_indicatorsMap(function() {
					this.refresh();
				});
			});

			this.on('destroy', function() {
				_indicatorsMap(function() {
					this.destroy();
				});

				delete this.indicators;
			});
		},

		_initWheel: function() {
			utils.addEvent(this.wrapper, 'wheel', this);
			utils.addEvent(this.wrapper, 'mousewheel', this);
			utils.addEvent(this.wrapper, 'DOMMouseScroll', this);

			this.on('destroy', function() {
				clearTimeout(this.wheelTimeout);
				this.wheelTimeout = null;
				utils.removeEvent(this.wrapper, 'wheel', this);
				utils.removeEvent(this.wrapper, 'mousewheel', this);
				utils.removeEvent(this.wrapper, 'DOMMouseScroll', this);
			});
		},

		_wheel: function(e) {
			if(!this.enabled) {
				return;
			}

			e.preventDefault();

			var wheelDeltaX, wheelDeltaY,
				newX, newY,
				that = this;

			if(this.wheelTimeout === undefined) {
				that._execEvent('scrollStart');
			}

			// Execute the scrollEnd event after 400ms the wheel stopped scrolling
			clearTimeout(this.wheelTimeout);
			this.wheelTimeout = setTimeout(function() {
				if(!that.options.snap) {
					that._execEvent('scrollEnd');
				}
				that.wheelTimeout = undefined;
			}, 400);

			if('deltaX' in e) {
				if(e.deltaMode === 1) {
					wheelDeltaX = -e.deltaX * this.options.mouseWheelSpeed;
					wheelDeltaY = -e.deltaY * this.options.mouseWheelSpeed;
				} else {
					wheelDeltaX = -e.deltaX;
					wheelDeltaY = -e.deltaY;
				}
			} else if('wheelDeltaX' in e) {
				wheelDeltaX = e.wheelDeltaX / 120 * this.options.mouseWheelSpeed;
				wheelDeltaY = e.wheelDeltaY / 120 * this.options.mouseWheelSpeed;
			} else if('wheelDelta' in e) {
				wheelDeltaX = wheelDeltaY = e.wheelDelta / 120 * this.options.mouseWheelSpeed;
			} else if('detail' in e) {
				wheelDeltaX = wheelDeltaY = -e.detail / 3 * this.options.mouseWheelSpeed;
			} else {
				return;
			}

			wheelDeltaX *= this.options.invertWheelDirection;
			wheelDeltaY *= this.options.invertWheelDirection;

			if(!this.hasVerticalScroll) {
				wheelDeltaX = wheelDeltaY;
				wheelDeltaY = 0;
			}

			if(this.options.snap) {
				newX = this.currentPage.pageX;
				newY = this.currentPage.pageY;

				if(wheelDeltaX > 0) {
					newX--;
				} else if(wheelDeltaX < 0) {
					newX++;
				}

				if(wheelDeltaY > 0) {
					newY--;
				} else if(wheelDeltaY < 0) {
					newY++;
				}

				this.goToPage(newX, newY);

				return;
			}

			newX = this.x + Math.round(this.hasHorizontalScroll ? wheelDeltaX : 0);
			newY = this.y + Math.round(this.hasVerticalScroll ? wheelDeltaY : 0);

			this.directionX = wheelDeltaX > 0 ? -1 : wheelDeltaX < 0 ? 1 : 0;
			this.directionY = wheelDeltaY > 0 ? -1 : wheelDeltaY < 0 ? 1 : 0;

			if(newX > 0) {
				newX = 0;
			} else if(newX < this.maxScrollX) {
				newX = this.maxScrollX;
			}

			if(newY > this.minScrollY) {
				newY = this.minScrollY;
			} else if(newY < this.maxScrollY) {
				newY = this.maxScrollY;
			}

			this.scrollTo(newX, newY, 0);

			if(this.options.probeType > 1) {
				this._execEvent('scroll');
			}

			// INSERT POINT: _wheel
		},

		_initSnap: function() {
			this.currentPage = {};

			if(typeof this.options.snap == 'string') {
				this.options.snap = this.scroller.querySelectorAll(this.options.snap);
			}

			this.on('refresh', function() {
				var i = 0,
					l,
					m = 0,
					n,
					cx, cy,
					x = 0,
					y,
					stepX = this.options.snapStepX || this.wrapperWidth,
					stepY = this.options.snapStepY || this.wrapperHeight,
					el,
					rect;

				this.pages = [];

				if(!this.wrapperWidth || !this.wrapperHeight || !this.scrollerWidth || !this.scrollerHeight) {
					return;
				}

				if(this.options.snap === true) {
					cx = Math.round(stepX / 2);
					cy = Math.round(stepY / 2);

					while(x > -this.scrollerWidth) {
						this.pages[i] = [];
						l = 0;
						y = 0;

						while(y > -this.scrollerHeight) {
							this.pages[i][l] = {
								x: Math.max(x, this.maxScrollX),
								y: Math.max(y, this.maxScrollY),
								width: stepX,
								height: stepY,
								cx: x - cx,
								cy: y - cy
							};

							y -= stepY;
							l++;
						}

						x -= stepX;
						i++;
					}
				} else {
					el = this.options.snap;
					l = el.length;
					n = -1;

					for(; i < l; i++) {
						rect = utils.getRect(el[i]);
						if(i === 0 || rect.left <= utils.getRect(el[i - 1]).left) {
							m = 0;
							n++;
						}

						if(!this.pages[m]) {
							this.pages[m] = [];
						}

						x = Math.max(-rect.left, this.maxScrollX);
						y = Math.max(-rect.top, this.maxScrollY);
						cx = x - Math.round(rect.width / 2);
						cy = y - Math.round(rect.height / 2);

						this.pages[m][n] = {
							x: x,
							y: y,
							width: rect.width,
							height: rect.height,
							cx: cx,
							cy: cy
						};

						if(x > this.maxScrollX) {
							m++;
						}
					}
				}

				this.goToPage(this.currentPage.pageX || 0, this.currentPage.pageY || 0, 0);

				// Update snap threshold if needed
				if(this.options.snapThreshold % 1 === 0) {
					this.snapThresholdX = this.options.snapThreshold;
					this.snapThresholdY = this.options.snapThreshold;
				} else {
					this.snapThresholdX = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].width * this.options.snapThreshold);
					this.snapThresholdY = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].height * this.options.snapThreshold);
				}
			});

			this.on('flick', function() {
				var time = this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(this.x - this.startX), 1000),
						Math.min(Math.abs(this.y - this.startY), 1000)
					), 300);

				this.goToPage(
					this.currentPage.pageX + this.directionX,
					this.currentPage.pageY + this.directionY,
					time
				);
			});
		},

		_nearestSnap: function(x, y) {
			if(!this.pages.length) {
				return { x: 0, y: 0, pageX: 0, pageY: 0 };
			}

			var i = 0,
				l = this.pages.length,
				m = 0;

			// Check if we exceeded the snap threshold
			if(Math.abs(x - this.absStartX) < this.snapThresholdX &&
				Math.abs(y - this.absStartY) < this.snapThresholdY) {
				return this.currentPage;
			}

			if(x > 0) {
				x = 0;
			} else if(x < this.maxScrollX) {
				x = this.maxScrollX;
			}

			if(y > this.minScrollY) {
				y = this.minScrollY;
			} else if(y < this.maxScrollY) {
				y = this.maxScrollY;
			}

			for(; i < l; i++) {
				if(x >= this.pages[i][0].cx) {
					x = this.pages[i][0].x;
					break;
				}
			}

			l = this.pages[i].length;

			for(; m < l; m++) {
				if(y >= this.pages[0][m].cy) {
					y = this.pages[0][m].y;
					break;
				}
			}

			if(i == this.currentPage.pageX) {
				i += this.directionX;

				if(i < 0) {
					i = 0;
				} else if(i >= this.pages.length) {
					i = this.pages.length - 1;
				}

				x = this.pages[i][0].x;
			}

			if(m == this.currentPage.pageY) {
				m += this.directionY;

				if(m < 0) {
					m = 0;
				} else if(m >= this.pages[0].length) {
					m = this.pages[0].length - 1;
				}

				y = this.pages[0][m].y;
			}

			return {
				x: x,
				y: y,
				pageX: i,
				pageY: m
			};
		},

		goToPage: function(x, y, time, easing) {
			easing = easing || this.options.bounceEasing;

			if(x >= this.pages.length) {
				x = this.pages.length - 1;
			} else if(x < 0) {
				x = 0;
			}

			if(y >= this.pages[x].length) {
				y = this.pages[x].length - 1;
			} else if(y < 0) {
				y = 0;
			}

			var posX = this.pages[x][y].x,
				posY = this.pages[x][y].y;

			time = time === undefined ? this.options.snapSpeed || Math.max(
				Math.max(
					Math.min(Math.abs(posX - this.x), 1000),
					Math.min(Math.abs(posY - this.y), 1000)
				), 300) : time;

			this.currentPage = {
				x: posX,
				y: posY,
				pageX: x,
				pageY: y
			};

			this.scrollTo(posX, posY, time, easing);
		},

		next: function(time, easing) {
			var x = this.currentPage.pageX,
				y = this.currentPage.pageY;

			x++;

			if(x >= this.pages.length && this.hasVerticalScroll) {
				x = 0;
				y++;
			}

			this.goToPage(x, y, time, easing);
		},

		prev: function(time, easing) {
			var x = this.currentPage.pageX,
				y = this.currentPage.pageY;

			x--;

			if(x < 0 && this.hasVerticalScroll) {
				x = 0;
				y--;
			}

			this.goToPage(x, y, time, easing);
		},

		_initKeys: function(e) {
			// default key bindings
			var keys = {
				pageUp: 33,
				pageDown: 34,
				end: 35,
				home: 36,
				left: 37,
				up: 38,
				right: 39,
				down: 40
			};
			var i;

			// if you give me characters I give you keycode
			if(typeof this.options.keyBindings == 'object') {
				for(i in this.options.keyBindings) {
					if(typeof this.options.keyBindings[i] == 'string') {
						this.options.keyBindings[i] = this.options.keyBindings[i].toUpperCase().charCodeAt(0);
					}
				}
			} else {
				this.options.keyBindings = {};
			}

			for(i in keys) {
				this.options.keyBindings[i] = this.options.keyBindings[i] || keys[i];
			}

			utils.addEvent(window, 'keydown', this);

			this.on('destroy', function() {
				utils.removeEvent(window, 'keydown', this);
			});
		},

		_key: function(e) {
			if(!this.enabled) {
				return;
			}

			var snap = this.options.snap, // we are using this alot, better to cache it
				newX = snap ? this.currentPage.pageX : this.x,
				newY = snap ? this.currentPage.pageY : this.y,
				now = utils.getTime(),
				prevTime = this.keyTime || 0,
				acceleration = 0.250,
				pos;

			if(this.options.useTransition && this.isInTransition) {
				pos = this.getComputedPosition();

				this._translate(Math.round(pos.x), Math.round(pos.y));
				this.isInTransition = false;
			}

			this.keyAcceleration = now - prevTime < 200 ? Math.min(this.keyAcceleration + acceleration, 50) : 0;

			switch(e.keyCode) {
				case this.options.keyBindings.pageUp:
					if(this.hasHorizontalScroll && !this.hasVerticalScroll) {
						newX += snap ? 1 : this.wrapperWidth;
					} else {
						newY += snap ? 1 : this.wrapperHeight;
					}
					break;
				case this.options.keyBindings.pageDown:
					if(this.hasHorizontalScroll && !this.hasVerticalScroll) {
						newX -= snap ? 1 : this.wrapperWidth;
					} else {
						newY -= snap ? 1 : this.wrapperHeight;
					}
					break;
				case this.options.keyBindings.end:
					newX = snap ? this.pages.length - 1 : this.maxScrollX;
					newY = snap ? this.pages[0].length - 1 : this.maxScrollY;
					break;
				case this.options.keyBindings.home:
					newX = 0;
					newY = 0;
					break;
				case this.options.keyBindings.left:
					newX += snap ? -1 : 5 + this.keyAcceleration >> 0;
					break;
				case this.options.keyBindings.up:
					newY += snap ? 1 : 5 + this.keyAcceleration >> 0;
					break;
				case this.options.keyBindings.right:
					newX -= snap ? -1 : 5 + this.keyAcceleration >> 0;
					break;
				case this.options.keyBindings.down:
					newY -= snap ? 1 : 5 + this.keyAcceleration >> 0;
					break;
				default:
					return;
			}

			if(snap) {
				this.goToPage(newX, newY);
				return;
			}

			if(newX > 0) {
				newX = 0;
				this.keyAcceleration = 0;
			} else if(newX < this.maxScrollX) {
				newX = this.maxScrollX;
				this.keyAcceleration = 0;
			}

			if(newY > this.minScrollY) {
				newY = this.minScrollY;
				this.keyAcceleration = 0;
			} else if(newY < this.maxScrollY) {
				newY = this.maxScrollY;
				this.keyAcceleration = 0;
			}

			this.scrollTo(newX, newY, 0);

			this.keyTime = now;
		},

		_animate: function(destX, destY, duration, easingFn) {
			var that = this,
				startX = this.x,
				startY = this.y,
				startTime = utils.getTime(),
				destTime = startTime + duration;

			function step() {
				var now = utils.getTime(),
					newX, newY,
					easing;

				if(now >= destTime) {
					that.isAnimating = false;
					that._translate(destX, destY);

					if(!that.resetPosition(that.options.bounceTime)) {
						that._execEvent('scrollEnd');
					}

					return;
				}

				now = (now - startTime) / duration;
				easing = easingFn(now);
				newX = (destX - startX) * easing + startX;
				newY = (destY - startY) * easing + startY;
				that._translate(newX, newY);

				if(that.isAnimating) {
					rAF(step);
				}

				if(that.options.probeType == 3) {
					that._execEvent('scroll');
				}
			}

			this.isAnimating = true;
			step();
		},

		handleEvent: function(e) {
			switch(e.type) {
				case 'touchstart':
				case 'pointerdown':
				case 'MSPointerDown':
				case 'mousedown':
					this._start(e);
					break;
				case 'touchmove':
				case 'pointermove':
				case 'MSPointerMove':
				case 'mousemove':
					this._move(e);
					break;
				case 'touchend':
				case 'pointerup':
				case 'MSPointerUp':
				case 'mouseup':
				case 'touchcancel':
				case 'pointercancel':
				case 'MSPointerCancel':
				case 'mousecancel':
					this._end(e);
					break;
				case 'orientationchange':
				case 'resize':
					this._resize();
					break;
				case 'transitionend':
				case 'webkitTransitionEnd':
				case 'oTransitionEnd':
				case 'MSTransitionEnd':
					this._transitionEnd(e);
					break;
				case 'wheel':
				case 'DOMMouseScroll':
				case 'mousewheel':
					this._wheel(e);
					break;
				case 'keydown':
					this._key(e);
					break;
				case 'click':
					if(this.enabled && !e._constructed) {
						e.preventDefault();
						e.stopPropagation();
					}
					break;
			}
		}
	};

	function createDefaultScrollbar(direction, interactive, type) {
		var scrollbar = document.createElement('div'),
			indicator = document.createElement('div');

		if(type === true) {
			scrollbar.style.cssText = 'position:absolute;z-index:9999';
			indicator.style.cssText = '-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:absolute;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);border-radius:3px';
		}

		indicator.className = 'iScrollIndicator';

		if(direction == 'h') {
			if(type === true) {
				scrollbar.style.cssText += ';height:7px;left:2px;right:2px;bottom:0';
				indicator.style.height = '100%';
			}
			scrollbar.className = 'iScrollHorizontalScrollbar';
		} else {
			if(type === true) {
				scrollbar.style.cssText += ';width:7px;bottom:2px;top:2px;right:1px';
				indicator.style.width = '100%';
			}
			scrollbar.className = 'iScrollVerticalScrollbar';
		}

		scrollbar.style.cssText += ';overflow:hidden';

		if(!interactive) {
			scrollbar.style.pointerEvents = 'none';
		}

		scrollbar.appendChild(indicator);

		return scrollbar;
	}

	function Indicator(scroller, options) {
		this.wrapper = typeof options.el == 'string' ? document.querySelector(options.el) : options.el;
		this.wrapperStyle = this.wrapper.style;
		this.indicator = this.wrapper.children[0];
		this.indicatorStyle = this.indicator.style;
		this.scroller = scroller;

		this.options = {
			listenX: true,
			listenY: true,
			interactive: false,
			resize: true,
			defaultScrollbars: false,
			shrink: false,
			fade: false,
			speedRatioX: 0,
			speedRatioY: 0
		};

		for(var i in options) {
			this.options[i] = options[i];
		}

		this.sizeRatioX = 1;
		this.sizeRatioY = 1;
		this.maxPosX = 0;
		this.maxPosY = 0;

		if(this.options.interactive) {
			if(!this.options.disableTouch) {
				utils.addEvent(this.indicator, 'touchstart', this);
				utils.addEvent(window, 'touchend', this);
			}
			if(!this.options.disablePointer) {
				utils.addEvent(this.indicator, utils.prefixPointerEvent('pointerdown'), this);
				utils.addEvent(window, utils.prefixPointerEvent('pointerup'), this);
			}
			if(!this.options.disableMouse) {
				utils.addEvent(this.indicator, 'mousedown', this);
				utils.addEvent(window, 'mouseup', this);
			}
		}

		if(this.options.fade) {
			this.wrapperStyle[utils.style.transform] = this.scroller.translateZ;
			var durationProp = utils.style.transitionDuration;
			if(!durationProp) {
				return;
			}
			this.wrapperStyle[durationProp] = utils.isBadAndroid ? '0.0001ms' : '0ms';
			// remove 0.0001ms
			var self = this;
			if(utils.isBadAndroid) {
				rAF(function() {
					if(self.wrapperStyle[durationProp] === '0.0001ms') {
						self.wrapperStyle[durationProp] = '0s';
					}
				});
			}
			this.wrapperStyle.opacity = '0';
		}
	}

	Indicator.prototype = {
		handleEvent: function(e) {
			switch(e.type) {
				case 'touchstart':
				case 'pointerdown':
				case 'MSPointerDown':
				case 'mousedown':
					this._start(e);
					break;
				case 'touchmove':
				case 'pointermove':
				case 'MSPointerMove':
				case 'mousemove':
					this._move(e);
					break;
				case 'touchend':
				case 'pointerup':
				case 'MSPointerUp':
				case 'mouseup':
				case 'touchcancel':
				case 'pointercancel':
				case 'MSPointerCancel':
				case 'mousecancel':
					this._end(e);
					break;
			}
		},

		destroy: function() {
			if(this.options.fadeScrollbars) {
				clearTimeout(this.fadeTimeout);
				this.fadeTimeout = null;
			}
			if(this.options.interactive) {
				utils.removeEvent(this.indicator, 'touchstart', this);
				utils.removeEvent(this.indicator, utils.prefixPointerEvent('pointerdown'), this);
				utils.removeEvent(this.indicator, 'mousedown', this);

				utils.removeEvent(window, 'touchmove', this);
				utils.removeEvent(window, utils.prefixPointerEvent('pointermove'), this);
				utils.removeEvent(window, 'mousemove', this);

				utils.removeEvent(window, 'touchend', this);
				utils.removeEvent(window, utils.prefixPointerEvent('pointerup'), this);
				utils.removeEvent(window, 'mouseup', this);
			}

			if(this.options.defaultScrollbars && this.wrapper.parentNode) {
				this.wrapper.parentNode.removeChild(this.wrapper);
			}
		},

		_start: function(e) {
			var point = e.touches ? e.touches[0] : e;

			e.preventDefault();
			e.stopPropagation();

			this.transitionTime();

			this.initiated = true;
			this.moved = false;
			this.lastPointX = point.pageX;
			this.lastPointY = point.pageY;

			this.startTime = utils.getTime();

			if(!this.options.disableTouch) {
				utils.addEvent(window, 'touchmove', this);
			}
			if(!this.options.disablePointer) {
				utils.addEvent(window, utils.prefixPointerEvent('pointermove'), this);
			}
			if(!this.options.disableMouse) {
				utils.addEvent(window, 'mousemove', this);
			}

			this.scroller._execEvent('beforeScrollStart');
		},

		_move: function(e) {
			var point = e.touches ? e.touches[0] : e,
				deltaX, deltaY,
				newX, newY,
				timestamp = utils.getTime();
			if(!this.moved) {
				this.scroller._execEvent('scrollStart');
			}

			this.moved = true;

			deltaX = point.pageX - this.lastPointX;
			this.lastPointX = point.pageX;

			deltaY = point.pageY - this.lastPointY;
			this.lastPointY = point.pageY;

			newX = this.x + deltaX;
			newY = this.y + deltaY;

			this._pos(newX, newY);

			if(this.scroller.options.probeType == 1 && timestamp - this.startTime > 300) {
				this.startTime = timestamp;
				this.scroller._execEvent('scroll');
			} else if(this.scroller.options.probeType > 1) {
				this.scroller._execEvent('scroll');
			}

			// INSERT POINT: indicator._move

			e.preventDefault();
			e.stopPropagation();
		},

		_end: function(e) {
			if(!this.initiated) {
				return;
			}

			this.initiated = false;

			e.preventDefault();
			e.stopPropagation();

			utils.removeEvent(window, 'touchmove', this);
			utils.removeEvent(window, utils.prefixPointerEvent('pointermove'), this);
			utils.removeEvent(window, 'mousemove', this);

			if(this.scroller.options.snap) {
				var snap = this.scroller._nearestSnap(this.scroller.x, this.scroller.y);

				var time = this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(this.scroller.x - snap.x), 1000),
						Math.min(Math.abs(this.scroller.y - snap.y), 1000)
					), 300);

				if(this.scroller.x != snap.x || this.scroller.y != snap.y) {
					this.scroller.directionX = 0;
					this.scroller.directionY = 0;
					this.scroller.currentPage = snap;
					this.scroller.scrollTo(snap.x, snap.y, time, this.scroller.options.bounceEasing);
				}
			}

			if(this.moved) {
				this.scroller._execEvent('scrollEnd');
			}
		},

		transitionTime: function(time) {
			time = time || 0;
			var durationProp = utils.style.transitionDuration;
			if(!durationProp) {
				return;
			}

			this.indicatorStyle[durationProp] = time + 'ms';

			if(!time && utils.isBadAndroid) {
				this.indicatorStyle[durationProp] = '0.0001ms';
				// remove 0.0001ms
				var self = this;
				rAF(function() {
					if(self.indicatorStyle[durationProp] === '0.0001ms') {
						self.indicatorStyle[durationProp] = '0s';
					}
				});
			}
		},

		transitionTimingFunction: function(easing) {
			this.indicatorStyle[utils.style.transitionTimingFunction] = easing;
		},

		refresh: function() {
			this.transitionTime();

			if(this.options.listenX && !this.options.listenY) {
				this.indicatorStyle.display = this.scroller.hasHorizontalScroll ? 'block' : 'none';
			} else if(this.options.listenY && !this.options.listenX) {
				this.indicatorStyle.display = this.scroller.hasVerticalScroll ? 'block' : 'none';
			} else {
				this.indicatorStyle.display = this.scroller.hasHorizontalScroll || this.scroller.hasVerticalScroll ? 'block' : 'none';
			}

			if(this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll) {
				utils.addClass(this.wrapper, 'iScrollBothScrollbars');
				utils.removeClass(this.wrapper, 'iScrollLoneScrollbar');

				if(this.options.defaultScrollbars && this.options.customStyle) {
					if(this.options.listenX) {
						this.wrapper.style.right = '8px';
					} else {
						this.wrapper.style.bottom = '8px';
					}
				}
			} else {
				utils.removeClass(this.wrapper, 'iScrollBothScrollbars');
				utils.addClass(this.wrapper, 'iScrollLoneScrollbar');

				if(this.options.defaultScrollbars && this.options.customStyle) {
					if(this.options.listenX) {
						this.wrapper.style.right = '2px';
					} else {
						this.wrapper.style.bottom = '2px';
					}
				}
			}

			utils.getRect(this.wrapper); // force refresh

			if(this.options.listenX) {
				this.wrapperWidth = this.wrapper.clientWidth;
				if(this.options.resize) {
					this.indicatorWidth = Math.max(Math.round(this.wrapperWidth * this.wrapperWidth / (this.scroller.scrollerWidth || this.wrapperWidth || 1)), 8);
					this.indicatorStyle.width = this.indicatorWidth + 'px';
				} else {
					this.indicatorWidth = this.indicator.clientWidth;
				}

				this.maxPosX = this.wrapperWidth - this.indicatorWidth;

				if(this.options.shrink == 'clip') {
					this.minBoundaryX = -this.indicatorWidth + 8;
					this.maxBoundaryX = this.wrapperWidth - 8;
				} else {
					this.minBoundaryX = 0;
					this.maxBoundaryX = this.maxPosX;
				}

				this.sizeRatioX = this.options.speedRatioX || (this.scroller.maxScrollX && (this.maxPosX / this.scroller.maxScrollX));
			}

			if(this.options.listenY) {
				this.wrapperHeight = this.wrapper.clientHeight;
				if(this.options.resize) {
					this.indicatorHeight = Math.max(Math.round(this.wrapperHeight * this.wrapperHeight / (this.scroller.scrollerHeight || this.wrapperHeight || 1)), 8);
					this.indicatorStyle.height = this.indicatorHeight + 'px';
				} else {
					this.indicatorHeight = this.indicator.clientHeight;
				}

				this.maxPosY = this.wrapperHeight - this.indicatorHeight;

				if(this.options.shrink == 'clip') {
					this.minBoundaryY = -this.indicatorHeight + 8;
					this.maxBoundaryY = this.wrapperHeight - 8;
				} else {
					this.minBoundaryY = 0;
					this.maxBoundaryY = this.maxPosY;
				}

				this.maxPosY = this.wrapperHeight - this.indicatorHeight;
				this.sizeRatioY = this.options.speedRatioY || (this.scroller.maxScrollY && (this.maxPosY / this.scroller.maxScrollY));
			}

			this.updatePosition();
		},

		updatePosition: function() {
			var x = this.options.listenX && Math.round(this.sizeRatioX * this.scroller.x) || 0,
				y = this.options.listenY && Math.round(this.sizeRatioY * this.scroller.y) || 0;

			if(!this.options.ignoreBoundaries) {
				if(x < this.minBoundaryX) {
					if(this.options.shrink == 'scale') {
						this.width = Math.max(this.indicatorWidth + x, 8);
						this.indicatorStyle.width = this.width + 'px';
					}
					x = this.minBoundaryX;
				} else if(x > this.maxBoundaryX) {
					if(this.options.shrink == 'scale') {
						this.width = Math.max(this.indicatorWidth - (x - this.maxPosX), 8);
						this.indicatorStyle.width = this.width + 'px';
						x = this.maxPosX + this.indicatorWidth - this.width;
					} else {
						x = this.maxBoundaryX;
					}
				} else if(this.options.shrink == 'scale' && this.width != this.indicatorWidth) {
					this.width = this.indicatorWidth;
					this.indicatorStyle.width = this.width + 'px';
				}

				if(y < this.minBoundaryY) {
					if(this.options.shrink == 'scale') {
						this.height = Math.max(this.indicatorHeight + y * 3, 8);
						this.indicatorStyle.height = this.height + 'px';
					}
					y = this.minBoundaryY;
				} else if(y > this.maxBoundaryY) {
					if(this.options.shrink == 'scale') {
						this.height = Math.max(this.indicatorHeight - (y - this.maxPosY) * 3, 8);
						this.indicatorStyle.height = this.height + 'px';
						y = this.maxPosY + this.indicatorHeight - this.height;
					} else {
						y = this.maxBoundaryY;
					}
				} else if(this.options.shrink == 'scale' && this.height != this.indicatorHeight) {
					this.height = this.indicatorHeight;
					this.indicatorStyle.height = this.height + 'px';
				}
			}

			this.x = x;
			this.y = y;

			if(this.scroller.options.useTransform) {
				this.indicatorStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.scroller.translateZ;
			} else {
				this.indicatorStyle.left = x + 'px';
				this.indicatorStyle.top = y + 'px';
			}
		},

		_pos: function(x, y) {
			if(x < 0) {
				x = 0;
			} else if(x > this.maxPosX) {
				x = this.maxPosX;
			}

			if(y < 0) {
				y = 0;
			} else if(y > this.maxPosY) {
				y = this.maxPosY;
			}

			x = this.options.listenX ? Math.round(x / this.sizeRatioX) : this.scroller.x;
			y = this.options.listenY ? Math.round(y / this.sizeRatioY) : this.scroller.y;

			this.scroller.scrollTo(x, y);
		},

		fade: function(val, hold) {
			if(hold && !this.visible) {
				return;
			}

			clearTimeout(this.fadeTimeout);
			this.fadeTimeout = null;

			var time = val ? 250 : 500,
				delay = val ? 0 : 300;

			val = val ? '1' : '0';

			this.wrapperStyle[utils.style.transitionDuration] = time + 'ms';

			this.fadeTimeout = setTimeout((function(val) {
				this.wrapperStyle.opacity = val;
				this.visible = +val;
			}).bind(this, val), delay);
		}
	};

	IScroll.utils = utils;

	window.IScroll = IScroll;

})(window, document, Math);
/**
 * 作者: dailc
 * 创建时间: 2017-03-28
 * 版本: [1.0, 2017/05/26 ]
 * 版权: dailc
 * 描述: 这个工具类都是一些最基本的工具函数
 */
"use strict";

var PullToRefreshTools = window.PullToRefreshTools || (function(exports, undefined) {
    /**
     * 通用代码
     */
    (function() {
        /**
         * 产生一个 唯一uuid-guid
         * @param {Number} len
         * @param {Number} radix 基数
         * @return {String} 返回一个随机性的唯一uuid
         */
        exports.uuid = function(len, radix) {
            var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''),
                uuid = [],
                i;
            radix = radix || chars.length;

            if (len) {
                for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
            } else {
                var r;

                uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
                uuid[14] = '4';

                for (i = 0; i < 36; i++) {
                    if (!uuid[i]) {
                        r = 0 | Math.random() * 16;
                        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                    }
                }
            }
            return uuid.join('');
        };
        /**
         * 空函数
         */
        exports.noop = function() {};
        /**
         * extend(simple)
         * @param {type} target
         * @param {type} source
         * @param {type} deep
         * @returns {unresolved}
         */
        exports.extend = function() { //from jquery2
            // from jquery2
            var options, name, src, copy, copyIsArray, clone,
                target = arguments[0] || {},
                i = 1,
                length = arguments.length,
                deep = false;

            if (typeof target === "boolean") {
                deep = target;
                target = arguments[i] || {};
                i++;
            }
            if (typeof target !== "object" && !exports.isFunction(target)) {
                target = {};
            }
            if (i === length) {
                target = this;
                i--;
            }
            for (; i < length; i++) {
                if ((options = arguments[i]) != null) {
                    for (name in options) {
                        src = target[name];
                        copy = options[name];
                        if (target === copy) {
                            continue;
                        }
                        if (deep && copy && (exports.isPlainObject(copy) || (copyIsArray = exports.isArray(copy)))) {
                            if (copyIsArray) {
                                copyIsArray = false;
                                clone = src && exports.isArray(src) ? src : [];

                            } else {
                                clone = src && exports.isPlainObject(src) ? src : {};
                            }

                            target[name] = exports.extend(deep, clone, copy);
                        } else if (copy !== undefined) {
                            target[name] = copy;
                        }
                    }
                }
            }
            return target;
        };
        /**
         *  isFunction
         */
        exports.isFunction = function(value) {
            return exports.type(value) === "function";
        };
        /**
         *  isPlainObject
         */
        exports.isPlainObject = function(obj) {
            return exports.isObject(obj) && !exports.isWindow(obj) && Object.getPrototypeOf(obj) === Object.prototype;
        };
        exports.isArray = Array.isArray ||
            function(object) {
                return object instanceof Array;
            };
        /**
         *  isWindow(需考虑obj为undefined的情况)
         */
        exports.isWindow = function(obj) {
            return obj != null && obj === obj.window;
        };
        /**
         *  isObject
         */
        exports.isObject = function(obj) {
            return exports.type(obj) === "object";
        };
        exports.type = function(obj) {
            return obj == null ? String(obj) : class2type[{}.toString.call(obj)] || "object";
        };
        /**
         * each遍历操作
         * @param {type} elements
         * @param {type} callback
         * @returns {global}
         */
        exports.each = function(elements, callback, hasOwnProperty) {
            if (!elements) {
                return this;
            }
            if (typeof elements.length === 'number') {
                [].every.call(elements, function(el, idx) {
                    return callback.call(el, idx, el) !== false;
                });
            } else {
                for (var key in elements) {
                    if (hasOwnProperty) {
                        if (elements.hasOwnProperty(key)) {
                            if (callback.call(elements[key], key, elements[key]) === false) return elements;
                        }
                    } else {
                        if (callback.call(elements[key], key, elements[key]) === false) return elements;
                    }
                }
            }
            return this;
        };
        /**
         * 选择这段代码用到的太多了，因此抽取封装出来
         * @param {Object} element dom元素或者selector
         */
        exports.selector = function(element) {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }

            return element;
        };
        var class2type = {};
        exports.each(['Boolean', 'Number', 'String', 'Function', 'Array', 'Date', 'RegExp', 'Object', 'Error'], function(i, name) {
            class2type["[object " + name + "]"] = name.toLowerCase();
        });
        (function() {
            function detect(ua) {
                this.os = {};
                this.os.name = 'browser';
                var funcs = [
                    function() { //android
                        var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
                        if (android) {
                            this.os.android = true;
                            this.os.version = android[2];
                            this.os.isBadAndroid = !(/Chrome\/\d/.test(window.navigator.appVersion));
                            this.os.name += '_' + 'Android';
                            this.os.name += '_' + 'mobile';
                        }
                        return this.os.android === true;
                    },
                    function() { //ios
                        var iphone = ua.match(/(iPhone\sOS)\s([\d_]+)/);
                        if (iphone) { //iphone
                            this.os.ios = this.os.iphone = true;
                            this.os.version = iphone[2].replace(/_/g, '.');
                            this.os.name += '_' + 'iphone';
                            this.os.name += '_' + 'mobile';
                        } else {
                            var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
                            if (ipad) { //ipad
                                this.os.ios = this.os.ipad = true;
                                this.os.version = ipad[2].replace(/_/g, '.');
                                this.os.name += '_' + 'iOS';
                                this.os.name += '_' + 'mobile';
                            }

                        }
                        return this.os.ios === true;
                    }
                ];
                [].every.call(funcs, function(func) {
                    return !func.call(exports);
                });
            }
            detect.call(exports, navigator.userAgent);
        })();
        /**
         * 判断os系统 ,判断是否是ejs
         * ejs.os
         * @param {type} 
         * @returns {undefined}
         */
        (function() {
            function detect(ua) {
                this.os = this.os || {};
                //比如 EpointEJS/6.1.1  也可以/(EpointEJS)\/([\d\.]+)/i
                var ejs = ua.match(/EpointEJS/i);
                if (ejs) {
                    this.os.ejs = true;
                    this.os.name += '_' + 'ejs';
                }
                //阿里的钉钉 DingTalk/3.0.0 
                var dd = ua.match(/DingTalk/i);
                if (dd) {
                    this.os.dd = true;
                    this.os.name += '_' + 'dd';
                }
            }
            detect.call(exports, navigator.userAgent);
        })();

    })();
    /**
     * 模拟Class的基类,以便模拟Class进行继承等
     * 仿照mui写的
     */
    (function() {
        //同时声明多个变量,用,分开要好那么一点点
        var initializing = false,
            //通过正则检查是否是函数
            fnTest = /xyz/.test(function() {
                xyz;
            }) ? /\b_super\b/ : /.*/;
        var Clazz = function() {};
        //很灵活的一种写法,直接重写Class的extend,模拟继承
        Clazz.extend = function(prop) {
            var _super = this.prototype;
            initializing = true;
            //可以这样理解:这个prototype将this中的方法和属性全部都复制了一遍
            var prototype = new this();
            initializing = false;
            for (var name in prop) {
                //这一些列操作逻辑并不简单，得清楚运算符优先级
                //逻辑与的优先级是高于三元条件运算符的,得注意下
                //只有继承的函数存在_super时才会触发(哪怕注释也一样进入)
                //所以梳理后其实一系列的操作就是判断是否父对象也有相同对象
                //如果有,则对应函数存在_super这个东西
                prototype[name] = typeof prop[name] == "function" &&
                    typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                    (function(name, fn) {
                        return function() {
                            var tmp = this._super;
                            this._super = _super[name];
                            var ret = fn.apply(this, arguments);
                            this._super = tmp;
                            return ret;
                        };
                    })(name, prop[name]) :
                    prop[name];
            }
            /**
             * Clss的构造,默认会执行init方法
             */
            function Clazz() {
                if (!initializing && this.init) {
                    this.init.apply(this, arguments);
                }
            }
            Clazz.prototype = prototype;
            Clazz.prototype.constructor = Clazz;
            //callee 的作用是返回当前执行函数的自身
            //这里其实就是this.extend,不过严格模式下禁止使用
            //Clazz.extend = arguments.callee;
            //替代callee 返回本身
            Clazz.extend = this.extend;
            return Clazz;
        };
        exports.Clazz = Clazz;
    })();

    /**
     * 方便的生成对象下的命名空间
     */
    (function() {
        /**
         * 设置一个Util对象下的命名空间
         * @param {String} namespace
         * @param {Object} obj 需要赋值的目标对象
         */
        exports.namespace = function(namespace, obj) {
            var parent = window.PullToRefreshTools;

            if (!namespace) {
                return parent;
            }

            var namespaceArr = namespace.split('.'),
                len = namespaceArr.length;

            for (var i = 0; i < len - 1; i++) {
                var tmp = namespaceArr[i];
                // 不存在的话要重新创建对象
                parent[tmp] = parent[tmp] || {};
                // parent要向下一级
                parent = parent[tmp];

            }
            parent[namespaceArr[len - 1]] = obj;

            return parent[namespaceArr[len - 1]];
        };
        /**
         * 获取这个模块下对应命名空间的对象
         * 如果不存在，则返回null，这个api只要是供内部获取接口数据时调用
         * @param {Object} module
         * @param {Array} namespace
         */
        exports.getNameSpaceObj = function(module, namespace) {
            if (!namespace) {
                return null;
            }
            var namespaceArr = namespace.split('.'),
                len = namespaceArr.length;
            for (var i = 0; i < len; i++) {
                module && (module = module[namespaceArr[i]]);
            }
            return module;
        };
    })();

    /**
     * 兼容require
     */
    if (typeof module != 'undefined' && module.exports) {
        module.exports = exports;
    } else if (typeof define == 'function' && (define.amd || define.cmd)) {
        define(function() {
            return exports;
        });
    }

    return exports;
})({});
/**
 * 作者: dailc
 * 创建时间: 2017-03-28
 * 版本: [1.0, 2017/05/26 ]
 * 版权: dailc
 * 描述: 基于IScroll实现(hasVerticalScroll强行将这个设为true,修正不会下拉问题，同时需要设置对应的maxScrollY)
 * 注意:prototype 状态用2   这时候scroll只会在手动拉时才会触发
 * 如果为3则会自动触发，不好计算
 * 并且为3是不会使用transition动画，用到的是cpu计算，性能低
 * 注意需要处理好和横向滑动之间的关系
 * 所有下拉刷新皮肤都需要提供以下api:(所有下拉刷新都需要实现的给外部使用的api)
 * refresh	重置状态。譬如上拉加载关闭后需要手动refresh重置
 * pulldownLoading	开始触发下拉刷新动画
 * pullupLoading	开始触发上拉加载更多
 * endPullDownToRefresh	关闭下拉刷新动画
 * endPullUpToRefresh(finished) 	关闭上拉加载动画
 * 需要有以下属性:
 * finished(判断上拉加载是否显示没有更多数据)
 * 
 * 以下是UI实现类可以实现的hook函数(方便各大实现类继承,不想实现可以设为null，主要是进行一些UI实现)
 * _initPullToRefreshTipsHook 初始化生成下拉刷新与上拉加载的提示
 * _pullingHook(deltaY,thresholdHeight) 下拉过程中的钩子函数，方便实现一些渐变动画
 * _pulldownLoaingAnimationHook 下拉刷新的动画
 * _pulldownLoaingAnimationSuccessHook(done,isSuccess) 下拉刷新的成功动画-动画完毕后可能的成功提示
 * _pulldownLoaingAnimationEndHook 下拉刷新的动画完成后的回调，可以用来重置状态
 * _pullupLoaingAnimationHook(isFinished) 上拉加载的动画
 * _pullupLoaingAnimationSuccessHook(isFinished) 上拉加载的成功动画-动画完毕后可能的成功提示，或者重置状态
 * _scrollEndHook 滑动完毕后的end回调
 * _enablePullUpHook 允许pullup后的回调
 * _disablePullUpHook 禁止pullup后的回调
 */

(function(exports, CommonTools) {
    //基于IScroll 暂时单独剥离IScroll
    
    /**
     * 默认的设置参数
     */
    var defaultSetting = {
        // 下拉有关
        down: {
            // 下拉要大于多少长度后再下拉刷新
            height: 75,
            // 可选，在下拉可刷新状态时，下拉刷新控件上显示的标题内容
            contentdown: '下拉可以刷新', 
            // 可选，在释放可刷新状态时，下拉刷新控件上显示的标题内容
            contentover: '释放立即刷新', 
            // 可选，正在刷新状态时，下拉刷新控件上显示的标题内容
            contentrefresh: '正在刷新', 
            // 可选，刷新成功的提示
            contentrefreshsuccess: '刷新成功', 
            // 可选，刷新失败的提示-错误回调用到
            contentrefresherror: '刷新失败', 
            isSuccessTips: true,
            callback: CommonTools.noop
        },
        // 上拉有关
        up: {
            // 是否自动上拉加载-初始化是是否自动
            auto: true,
            // 距离底部高度(到达该高度即触发)
            offset: 100,
            // 配置了这个属性，只要停下来时到达了底部也会触发刷新
            isFastLoading: false,
            contentdown: '上拉显示更多',
            contentrefresh: '正在加载...',
            contentnomore: '没有更多数据了',
            callback: CommonTools.noop

        },
        // IScroll配置相关
        scroll: {
            // 回弹动画时间
            bounceTime: 500, 
            // 下拉刷新和上拉加载成功动画的时间
            successAnimationTime: 500,
            // 是否允许嵌套，设为true代表外层仍然有一个横向嵌套
            eventPassthrough: false
        },
        // 注意,传给Mui时可以传 #id形式或者是  原生dom对象
        container: '#pullrefresh'
    };

    //创建一个Class对象
    var PullToRefresh = CommonTools.Clazz.extend({
        /**
         * Class构造时会自动执行对象的init函数
         * @param {JSON} options 传入参数,包括
         * container 下拉刷新对象,对应scroll的dom结构对象
         */
        init: function(options) {
            options = CommonTools.extend(true, {}, defaultSetting, options);
            
            this.container = CommonTools.selector(options.container);
            this.options = options;       
            // wrapper兼容以前的内部调用法
            this.wrapper = this.container;
            // scroll的dom-wrapper下的第一个节点
            this.scrollWrap = this.container.children[0];
            // 生成一个IScroll对象 ，默认不启用tap(会和其它tap库冲突)
            this.scroller = new IScroll(this.container, {
                probeType: 2,
                tap: false,
                mouseWheel: true,
                eventPassthrough: this.options.scroll.eventPassthrough
            });

            this._initParams();
            // 对应的hook函数
            this._initPullToRefreshTipsHook && this._initPullToRefreshTipsHook(this.enablePullDown, this.enablePullUp);
            this._initEvent();

            if(options.down && options.down.auto) { 
                // 如果设置了auto，则自动下拉一次
                this.pulldownLoading();
            } else if(options.up && options.up.auto) { 
                // 如果设置了auto，则自动上拉一次
                this.pullupLoading();
            }
        },
        /**
         * 初始化参数
         */
        _initParams: function() {
            // 是否支持下拉刷新-只有在顶部才代表可以允许下拉刷新
            this.enablePullDown = this.options.down ? true : false;
            this.enablePullUp = this.options.up ? true : false;
            this.finished = false;
            // 实际的下拉刷新距离y轴的距离(这个一般会被下拉刷新动画页面占据)
            this.offsetY = this.offsetY || 0;
            this.topHeiht = (this.options.down && this.options.down.height) ? this.options.down.height : 0;

        },

        /**
         * 初始化事件
         */
        _initEvent: function() {
            /**
             * 可以获取的:
             * myScroll.x/y, current position
             * myScroll.directionX/Y, last direction (-1 down/right, 0 still, 1 up/left)
             * myScroll.currentPage, current snap point info
             */
            var self = this;
            
            this.scroller.on('scrollStart', function() {
                self._handleScrollStart(this);
            });
            
            this.scroller.on('scroll', function() {
                self._handleScroll(this);
            });
            
            // 本来是用scrollEnd，但是发现prototype为3时性能很低，所以用了为2的状态
            // 而这个状态scrollend没什么用，所以自定义了一个touchEnd事件
            this.scroller.on('touchEnd', function() {
                self._handleTouchEnd(this);
            });
            
            // scrollEnd的新作用就是用来修正可能的滑动
            this.scroller.on('scrollEnd', function() {
                self._handleScrollEnd(this);
            });
            
            /**
             * 监听refresh事件，进行修正
             * IScroll的this.hasVerticalScroll这个值当元素没有填充满时是会为false的
             * 而下拉刷新中是肯定为true的，所以我们需要修正
             * 其中maxScrollY当内容小于wrapper时是0，而这时候如果用了offsetY，我们需要重新修正
             */
            this.scroller.on('refresh', function() {
                self.scroller.hasVerticalScroll = true;
                if(self.scroller.maxScrollY == 0) {
                    self.scroller.maxScrollY = -self.offsetY;
                }
            });
            
            // 刷新
            this.refresh();
        },

        /**
         * 处理事件 scrollStart
         */
        _handleScrollStart: function(that) {
            // 重置一些状态
            // 是否允许下拉刷新
            this.allowPullDownLoading = false;
            // 开始的Y坐标
            this.startY = that.y;
            // X
            this.startX = that.x;
            // 记录lastY来判断方向
            this.lastY = that.y;
            var nowtime = (new Date()).getTime();
            // 记录滑动开始的时间
            this.startTime = nowtime;

            // 默认不是下拉刷新
            this.pulldown = false;

        },
        /**
         * 处理事件 Scroll
         */
        _handleScroll: function(that) {
            // 如果是快速滑动
            if(this._isFastScroll()) {
                return;
            }

            // 计算滑动偏移量
            // 左右移动的距离
            var deltaX = Math.abs(that.x - this.startX);
            // 上下偏移量
            var deltaY = Math.abs(that.y - this.startY);
            var originalDeltaY = that.y + this.offsetY;
            this.lastY = that.y;
            if(Math.abs(that.distX) > Math.abs(that.distY)) {
                // 不满足条件时要暂时禁止滑动，因为可能外面还包裹着横向滑动条，要为他服务
                // this.scroller.disable();
                return;
            }
            // 偏移量要满足条件才行
            if(!(deltaY > 5 && deltaY > deltaX) || this.loading || this.allowPullDownSuccessLoading) {

                return;
            }
            // 高度阈值
            var thresholdHeight = (this.options.down && this.options.down.height) ? this.options.down.height : 0;
            // 如果允许下拉刷新
            if(this.enablePullDown) {

                if(!this.pulldown && !this.loading && that.directionY == -1 && that.y + this.offsetY >= 0) {
                    // 如果没有初始化下拉刷新，并且是下拉，进行初始化
                    this.pulldown = true;
                }
                
                if(that.y + this.offsetY >= thresholdHeight && that.directionY == -1) {
                    // -1代表方向向下，所以松开的时候是不会触发的
                    // 做一些下拉刷新的操作
                    if(!this.loading) {
                        // 如果没有在loading,才允许重置状态，否则可能是loading导致了高度符合条件
                        this.allowPullDownLoading = true;
                    }

                } else if(that.y + this.offsetY < thresholdHeight && that.y + this.offsetY >= 0) {
                    // 注意:只有手动下拉时才会触发
                    // 如果没到达到指定下拉距离的时候
                    if(that.directionY === 1) {
                        // 如果用户取消上拉加载（实际操作：先拉上去然后手指不松开又拉下来）
                        this.allowPullDownLoading = false;
                    }
                }
                
                // 对应可能需要进行pull动画
                this.pulldown && this._pullingHook && this._pullingHook(originalDeltaY, thresholdHeight);
            }

            // 如果允许上拉加载
            if(this.enablePullUp && this.options.up) {
                // 这里要求y的绝对值要大于   阈值和maxY
                // 因为它们都为负，所以就变为小于了
                // 允许上拉加载的情况 
                if((that.y - this.offsetY - this.options.up.offset) <= (this.scroller.maxScrollY - thresholdHeight) && that.directionY == 1) {

                    // 方向向上，并且达到了触发位置，默认为到底部了
                    this._scrollbottom();
                }
            }

        },
        /**
         * 设置偏移
         * @param {Number} offsetY 顶部提示的间距(如果是absolute布局，传0)
         */
        _setOffsetY: function(offsetY, done) {
            var self = this;
            
            self.offsetY = offsetY || 0;
            // 设置IScroll里新增的offset
            self.scroller.minScrollY = -offsetY;
            // 设置了offsetY后需要移动到相应地方
            self.scroller.scrollTo(0, -self.offsetY);
            done && done();
        },
        /**
         * 处理事件 scrollStart
         */
        _handleTouchEnd: function(that) {
            var self = this;
            
            // 下拉刷新动画以及触发回调
            if(self.allowPullDownLoading) {
                self.pulldownLoading(undefined, self.options.scroll.bounceTime);
            } else {
                self.enablePullDown && self._pulldownLoaingAnimationEndHook && self._pulldownLoaingAnimationEndHook();
            }
        },
        /**
         * 滑动结束，可以用来修正位置
         * @param {Object} that
         */
        _handleScrollEnd: function(that) {
            var self = this;
            var thresholdHeight = (self.options.down && self.options.down.height) ? self.options.down.height : 0;

            self._scrollEndHook && self._scrollEndHook();
            if(self.enablePullUp && self.options.up) {
                if(!self.loading && self.options.up.isFastLoading) {

                    if((that.y - self.offsetY - self.options.up.offset) <= (self.scroller.maxScrollY - thresholdHeight)) {
                        self._scrollbottom();
                    }
                }
            }

        },
        /**
         * 是否快速滑动
         */
        _isFastScroll: function() {
            var isFast = false;
            var nowtime = (new Date()).getTime();
            var dsTime = nowtime - this.startTime;
            
            // 如果拉动的时间小于200ms 则判断为快速刷新
            if(dsTime > 100) {
                isFast = false;
            } else {
                isFast = true;
            }
            return isFast;
        },

        /**
         * 滑动到底了
         */
        _scrollbottom: function() {
            if(!this.enablePullUp || this.finished) {
                return;
            }
            if(!this.loading) {
                this.pulldown = false;
                this.pullupLoading();
            }
        },

        /**
         * 结束下拉刷新
         * @param {Boolean} isSuccess 是否请求成功
         */
        _endPulldownToRefresh: function(isSuccess) {
            var self = this;
            
            if(!this.options.down) {
                return;
            }
            if(self.loading) {
                // 状态需要重置
                self.allowPullDownLoading = false;
                // 控制scroller的高度  self.options.scroll.bounceTime 
                self.loading = false;
                // 接下来会默认触发一个成功回调的动画
                self.allowPullDownSuccessLoading = true;
                
                var timer;
                
                // success里done 或者过一段时间都是动画可以结束的标识
                self._pulldownLoaingAnimationSuccessHook && self._pulldownLoaingAnimationSuccessHook(function() {
                    timer && clearTimeout(timer);
                    self.allowPullDownSuccessLoading = false;
                    self._checkPullDownLoadingEnd();
                }, isSuccess);
                
                timer = setTimeout(function() {
                    timer && clearTimeout(timer);
                    self.allowPullDownSuccessLoading = false;
                    self._checkPullDownLoadingEnd();
                }, self.options.scroll.successAnimationTime);       
            }
        },
        /**
         * 检查下拉刷新动画是否可以结束
         */
        _checkPullDownLoadingEnd: function() {
            var self = this;
            
            if(self.allowPullDownSuccessLoading) {
                // 必须结束了success后才行
                return;
            }
            self._pulldownLoaingAnimationEndHook && self._pulldownLoaingAnimationEndHook();
            self.scroller.scrollTo(0, -self.offsetY, self.options.scroll.bounceTime);

            setTimeout(function() {
                // 恢复回滚,结束完动画后要刷新容器
                self.scroller.minScrollY = -self.offsetY;
                self.scroller.refresh();
            }, self.options.scroll.bounceTime);

        },
        /**
         * 结束上拉加载更多
         * @param {Boolean} finished
         */
        _endPullupToRefresh: function(finished) {
            var self = this;

            if(!self.pulldown) {
                self.loading = false;
                // 刷新容器
                self.scroller.refresh();
                if(finished) {
                    self.finished = true;
                }
                // 执行的是成功动画，成功动画里面自然会去end正常动画
                self._pullupLoaingAnimationSuccessHook && self._pullupLoaingAnimationSuccessHook(finished);

            }
        },


        /**
         * 下拉刷新中,注意是通过持续的 scrollto 将这个定位到对应位置
         * @param {Number} y
         * @param {Number} time
         */
        pulldownLoading: function(y, time) {
            var self = this;
            
            if(!this.options.down) {
                return;
            }
            if(self.loading) {
                return;
            }
            
            //默认高度
            typeof y === 'undefined' && (y = this.options.down.height - this.offsetY); 
            
            // 需要设置一个延时，因为IScroll有一个默认的回滚，这个要在它之后
            // 暂时禁止它的回滚 这里的高度要计算好
            self.scroller.minScrollY = self.topHeiht - self.offsetY;
            setTimeout(function() {
                self.scroller.scrollTo(0, y, time || 0);
                self._pulldownLoaingAnimationHook && self._pulldownLoaingAnimationHook();
                self.loading = true;
                var callback = self.options.down.callback;
                callback && callback.call(self);
            }, 0);
        },

        /**
         * 触发上拉加载
         * @param {Object} callback
         * @param {Object} x
         * @param {Object} time
         */
        pullupLoading: function(callback, x, time) {
            if(this.enablePullUp && this.options.up) {
                if(this.finished) {
                    // 如果已经结束,刷新
                    this.refresh(true);
                }
                x = x || 0;

                if(this.loading) {
                    return;
                }
                this.scroller.scrollTo(x, this.scroller.maxScrollY, time);
                this.pulldown = false;
                // 上拉动画
                this._pullupLoaingAnimationHook && this._pullupLoaingAnimationHook(false);

                this.loading = true;
                callback = callback || this.options.up.callback;
                callback && callback.call(this);
            }

        },

        /**
         * 禁止上拉加载
         */
        disablePullupToRefresh: function() {
            this.enablePullUp = false;
            this._disablePullUpHook && this._disablePullUpHook();
        },
        /**
         * 允许上拉加载
         */
        enablePullupToRefresh: function() {
            this.enablePullUp = true;
            this._enablePullUpHook && this._enablePullUpHook();
        },
        /**
         * 刷新方法
         * @param {Boolean} isReset
         */
        refresh: function(isReset) {
            if(isReset && this.finished) {
                this.enablePullupToRefresh();
                this.finished = false;
            }
            this.scroller.refresh();

        },
        /**
         * 刷新loading状态，便于使用
         * @param {Boolean} isPullDown
         * @param {Boolean} isNoMoreData
         * @param {Boolean} isSuccess 是否请求成功
         */
        resetLoadingState: function(isPullDown, isNoMoreData, isSuccess) {
            var that = this;
            if(isPullDown) {
                // 如果是恢复下拉刷新状态--这个状态只有下拉刷新时才恢复
                this._endPulldownToRefresh(isSuccess);
            }
            // 接下拉不管是下拉刷新,还是上拉加载,都得刷新上拉加载的状态
            if(isNoMoreData) {
                // 如果没有更多数据了-注意两个变量的差异
                this._endPullupToRefresh(true);
            } else {
                this._endPullupToRefresh(false);
            }
        },
        /**
         * 结束下拉刷新
         * @param {Boolean} isSuccess 是否请求成功
         */
        endPullDownToRefresh: function(isSuccess) {
            if(isSuccess == null) {
                isSuccess = true;
            }
            this.resetLoadingState(true, false, isSuccess);
        },
        /**
         * 结束上拉加载
         * @param {Object} finished
         * @param {Boolean} isSuccess 是否请求成功
         */
        endPullUpToRefresh: function(finished, isSuccess) {
            if(isSuccess == null) {
                isSuccess = true;
            }
            this.resetLoadingState(false, finished, isSuccess);
        },
        /**
         * 设置成功提示
         * @param {String} tips
         */
        setSuccessTips: function(tips) {
            this.successTips = tips;
        },
    });
    
    CommonTools.namespace('core', PullToRefresh);
})({}, PullToRefreshTools);
/**
 * 作者: dailc
 * 创建时间: 2017/03/28
 * 版本: [1.0, 2017/05/26 ]
 * 版权: dailc
 * 描述: 皮肤类只会实现UI相关的hook函数
 * 默认皮肤default，最简单的下拉刷新
 * 依赖mui的css
 */
(function(exports, CommonTools) {
    
	// 默认的全局参数-主要用来配置下拉刷新提示的一些css class
	var NAMESPACE = 'mui-';
	var CLASS_PULL_TOP_POCKET = NAMESPACE + 'pull-top-pocket';
	var CLASS_PULL_BOTTOM_POCKET = NAMESPACE + 'pull-bottom-pocket';
	var CLASS_PULL = NAMESPACE + 'pull';
	var CLASS_PULL_LOADING = NAMESPACE + 'pull-loading';
	var CLASS_PULL_CAPTION = NAMESPACE + 'pull-caption';
	var CLASS_PULL_CAPTION_DOWN = NAMESPACE + 'pull-caption-down';
	var CLASS_PULL_CAPTION_REFRESH = NAMESPACE + 'pull-caption-refresh';
	var CLASS_PULL_CAPTION_NOMORE = NAMESPACE + 'pull-caption-nomore';

	var CLASS_ICON = NAMESPACE + 'icon';
	var CLASS_SPINNER = NAMESPACE + 'spinner';
	var CLASS_ICON_PULLDOWN = NAMESPACE + 'icon-pulldown';
	var CLASS_ICON_SUCCESS = NAMESPACE + 'icon-checkmarkempty';
	var CLASS_ICON_ERROR = NAMESPACE + 'icon-info';

	var CLASS_BLOCK = NAMESPACE + 'block';
	var CLASS_HIDDEN = NAMESPACE + 'hidden';
	var CLASS_VISIBILITY = NAMESPACE + 'visibility';

	var CLASS_LOADING_UP = CLASS_PULL_LOADING + ' ' + CLASS_ICON + ' ' + CLASS_ICON_PULLDOWN;
	var CLASS_LOADING_DOWN = CLASS_PULL_LOADING + ' ' + CLASS_ICON + ' ' + CLASS_ICON_PULLDOWN;
	var CLASS_LOADING = CLASS_PULL_LOADING + ' ' + CLASS_ICON + ' ' + CLASS_SPINNER;

	var CLASS_LOADING_SUCCESS = CLASS_PULL_LOADING + ' ' + CLASS_ICON + ' ' + CLASS_ICON_SUCCESS;

	var CLASS_LOADING_ERROR = CLASS_PULL_LOADING + ' ' + CLASS_ICON + ' ' + CLASS_ICON_ERROR;
	var pocketHtml = ['<div class="' + CLASS_PULL + '">', '<div class="{icon}"></div>', '<div class="' + CLASS_PULL_CAPTION + '">{contentrefresh}</div>', '</div>'].join('');
	

	/**
	 * 创建一个Class对象
	 * 只需要关注默认的UI实现即可
	 * UI只需要实现需要实现的函数
	 */
	var PullToRefresh = CommonTools.core.extend({

		/**
		 * 生成下拉刷新提示，这个需要被具体实现
		 * 这个默认实现就直接在一个函数里面同时生成下拉和上拉提示了
		 */
		_initPullToRefreshTipsHook: function(enablePullDown, enablePullUp) {
			this._initPocket();
			if(!enablePullUp) {
				this.bottomPocket && this.bottomPocket.classList.add(CLASS_HIDDEN);
			}
			if(!enablePullDown) {
				this.topPocket && this.topPocket.classList.add(CLASS_HIDDEN);
			}
		},
		/**
		 * 初始化下拉刷新
		 */
		_initPulldownRefreshState: function() {
			this.pullPocket = this.topPocket;
			this.pullPocket.classList.add(CLASS_BLOCK);
			this.pullPocket.classList.add(CLASS_VISIBILITY);
			this.pullCaption = this.topCaption;
			this.pullLoading = this.topLoading;
		},
		/**
		 * 初始化上拉加载
		 */
		_initPullupRefreshState: function() {
			this.pullPocket = this.bottomPocket;
			this.pullPocket.classList.add(CLASS_BLOCK);
			this.pullPocket.classList.add(CLASS_VISIBILITY);
			this.pullCaption = this.bottomCaption;
			this.pullLoading = this.bottomLoading;
		},
		/**
		 * 下拉过程中的钩子函数
		 * @param {Number} deltaY
		 * @param {Number} thresholdHeight 对应的高度阈值
		 */
		_pullingHook: function(deltaY, thresholdHeight) {
			// 高度阈值
			if(deltaY >= thresholdHeight) {
				this._setCaption(true, this.options.down.contentover);
			} else if(deltaY < thresholdHeight) {
				this._setCaption(true, this.options.down.contentdown);
			}
		},
		/**
		 * 下拉刷新的成功动画，每次确保触发一次
		 */
		_pulldownLoaingAnimationHook: function() {
			this._setCaption(true, this.options.down.contentrefresh);
		},
		/**
		 * 下拉刷新的成功动画-动画完毕后可能的成功提示，每次确保触发一次
		 * 比如在成功里面提示加载了多少条数据，如果不需要可以传null，会直接走到end事件里
		 * @param {Function} done 这个可以提前结束动画-如果不想要的话
		 * @param {Boolean} isSuccess 是否请求成功
		 */
		_pulldownLoaingAnimationSuccessHook: function(done, isSuccess) {
			if(this.options.down.isSuccessTips) {
				this._setCaption(true, isSuccess ? this.options.down.contentrefreshsuccess : this.options.down.contentrefresherror);
			} else {
				// 否则直接没有成功提示
				done();
			}

		},
		/**
		 * 下拉刷新的动画完成后的回调，可以用来重置状态
		 */
		_pulldownLoaingAnimationEndHook: function() {
			this._setCaption(true, this.options.down.contentdown, true);
			this.topPocket.classList.remove(CLASS_VISIBILITY);
		},
		/**
		 * 上拉加载的成功动画，每次确保触发一次
		 */
		_pullupLoaingAnimationHook: function(isFinished) {
			if(this.options.up) {
				this._setCaption(false, this.options.up.contentrefresh);
			}

		},
		/**
		 * 上拉加载的成功动画-动画完毕后可能的成功提示，每次确保触发一次
		 */
		_pullupLoaingAnimationSuccessHook: function(isFinished) {
			if(this.options.up) {
				if(isFinished) {
					this._setCaption(false, this.options.up.contentnomore);
				} else {
					this._setCaption(false, this.options.up.contentdown);
				}
				//this.bottomPocket.classList.remove(CLASS_VISIBILITY);
			}

		},
		/**
		 * _disablePullUpHook
		 */
		_disablePullUpHook: function() {
			this.bottomPocket.className = 'mui-pull-bottom-pocket' + ' ' + CLASS_HIDDEN;
		},
		/**
		 * disablePullUpHook
		 */
		_enablePullUpHook: function() {
			if(!this.options.up) {
				return;
			}
			this.bottomPocket.classList.remove(CLASS_HIDDEN);
			this._setCaption(false, this.options.up.contentdown);
		},
		/**
		 * 创建上拉提示或下拉提示
		 * @param {Object} clazz
		 * @param {Object} options
		 * @param {Object} iconClass
		 */
		_createPocket: function(clazz, options, iconClass) {
			var pocket = document.createElement('div');
			pocket.className = clazz;
			pocket.innerHTML = pocketHtml.replace('{contentrefresh}', options.contentinit).replace('{icon}', iconClass);
			return pocket;
		},
		/**
		 * 初始化下拉刷新和上拉加载提示
		 */
		_initPocket: function() {
			var options = this.options;
			if(options.down && options.down.hasOwnProperty('callback')) {
				this.topPocket = this.wrapper.querySelector('.' + CLASS_PULL_TOP_POCKET);
				if(!this.topPocket) {
					this.topPocket = this._createPocket(CLASS_PULL_TOP_POCKET, options.down, CLASS_LOADING_DOWN);
					this.wrapper.insertBefore(this.topPocket, this.wrapper.firstChild);
				}
				this.topLoading = this.topPocket.querySelector('.' + CLASS_PULL_LOADING);
				this.topCaption = this.topPocket.querySelector('.' + CLASS_PULL_CAPTION);
			}
			if(options.up && options.up.hasOwnProperty('callback')) {
				this.bottomPocket = this.scrollWrap.querySelector('.' + CLASS_PULL_BOTTOM_POCKET);
				if(!this.bottomPocket) {
					this.bottomPocket = this._createPocket(CLASS_PULL_BOTTOM_POCKET, options.up, CLASS_LOADING);
					this.scrollWrap.appendChild(this.bottomPocket);
				}
				this.bottomLoading = this.bottomPocket.querySelector('.' + CLASS_PULL_LOADING);
				this.bottomCaption = this.bottomPocket.querySelector('.' + CLASS_PULL_CAPTION);
			}

		},

		/**
		 * 设置提示的class
		 * @param {Object} isPulldown
		 * @param {Object} caption
		 * @param {Object} title
		 */
		_setCaptionClass: function(isPulldown, caption, title) {
			if(!this.options.up) {
				return;
			}
			if(!isPulldown) {

				switch(title) {
					case this.options.up.contentdown:
						caption.className = CLASS_PULL_CAPTION + ' ' + CLASS_PULL_CAPTION_DOWN;
						break;
					case this.options.up.contentrefresh:
						caption.className = CLASS_PULL_CAPTION + ' ' + CLASS_PULL_CAPTION_REFRESH
						break;
					case this.options.up.contentnomore:
						caption.className = CLASS_PULL_CAPTION + ' ' + CLASS_PULL_CAPTION_NOMORE;
						break;
				}
			}
		},
		/**
		 * 设置caption
		 * @param {Object} isPulldown
		 * @param {Object} title
		 * @param {Object} reset
		 */
		_setCaption: function(isPulldown, title, reset) {
			if(this.loading) {
				return;
			}
			if(isPulldown) {
				this._initPulldownRefreshState();
			} else {
				this._initPullupRefreshState();
			}
			var options = this.options;
			var pocket = this.pullPocket;
			var caption = this.pullCaption;
			var loading = this.pullLoading;
			var isPulldown = this.pulldown;
			var self = this;
			if(pocket) {
				if(reset) {
					setTimeout(function() {
						caption.innerHTML = self.lastTitle = title;
						if(isPulldown) {
							loading.className = CLASS_LOADING_DOWN;
						} else {
							self._setCaptionClass(false, caption, title);
							loading.className = CLASS_LOADING;
						}
						loading.style.webkitAnimation = "";
						loading.style.webkitTransition = "";
						loading.style.webkitTransform = "";
					}, 100);
				} else {
					if(title !== this.lastTitle) {
						caption.innerHTML = title;
						if(isPulldown) {
							if(title === options.down.contentrefresh) {
								loading.className = CLASS_LOADING;
								loading.style.webkitAnimation = "spinner-spin 1s step-end infinite";
							} else if(title === options.down.contentover) {
								loading.className = CLASS_LOADING_UP;
								loading.style.webkitTransition = "-webkit-transform 0.3s ease-in";
								loading.style.webkitTransform = "rotate(180deg)";
							} else if(title === options.down.contentdown) {
								loading.className = CLASS_LOADING_DOWN;
								loading.style.webkitTransition = "-webkit-transform 0.3s ease-in";
								loading.style.webkitTransform = "rotate(0deg)";
							} else if(title === options.down.contentrefreshsuccess) {
								//隐藏loading先
								loading.className = CLASS_LOADING_SUCCESS;
								loading.style.webkitTransition = "-webkit-transform 0.3s ease-in";
								loading.style.webkitTransform = "scale(1.2,1.2)";
								loading.style.webkitAnimation = "none";
								//优先显示tips
								caption.innerHTML = self.successTips || title;
							} else if(title === options.down.contentrefresherror) {
								loading.className = CLASS_LOADING_ERROR;
								loading.style.webkitTransition = "-webkit-transform 0.3s ease-in";
								loading.style.webkitTransform = "scale(1.2,1.2)";
								loading.style.webkitAnimation = "none";
							}
						} else {
							if(options.up) {
								if(title === options.up.contentrefresh) {
									loading.className = CLASS_LOADING + ' ' + CLASS_VISIBILITY;
								} else {
									loading.className = CLASS_LOADING + ' ' + CLASS_HIDDEN;
								}
								self._setCaptionClass(false, caption, title);
							}

						}
						this.lastTitle = title;
					}
				}

			}
		},

	});

	/**
	 * 初始化下拉刷新组件，init是兼容工厂的调用方式
	 * @param {JSON} options 传入的参数
	 * @return 返回的是一个下拉刷新对象
	 */
	PullToRefresh.init = function(options) {	
		return new PullToRefresh(options);
	};

    
    CommonTools.namespace('skin.defaults', PullToRefresh);
    
})({}, PullToRefreshTools);