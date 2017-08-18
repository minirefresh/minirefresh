/**
 * 作者: 郭心宇、戴荔春
 * 创建时间: 2017/05/27
 * 版本: [1.0, 2017/05/27 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 图形验证码工具类，使用canvas实现
 */
(function() {
    "use strict";

    var defaultSetting = {
        container: '#verifycode',
        // 验证码的长度
        len: 4,
        // 最小的字体大小
        minfontsize: 20,
        // 最大的字体大小
        maxfontsize: 35,
        // 内部干扰元素的半径
        radius: 1,
        // 下面的控制上移和下移不建议改变
        // 默认相等代表没有额外的差
        top: 0.92,
        bottom: 0.92   
    };

    /**
     * 图形验证码的构造函数
     * @param {JSON} options
     * @constructor
     */
    function VerifyCode(options) {
        options = Util.extend({}, defaultSetting, options);
        
        this.options = options;
        this.container = Util.selector(options.container);
        this.width = this.container.width;
        this.height = this.container.height;
        this.ctx = this.container.getContext("2d");
        this.ctx.textBaseline = "bottom";

        this.update();
        this._addEvent();
    };

    VerifyCode.prototype = {
        _render: function() {
            this.ctx.fillStyle = this._changeColor(this.options.bgColor) || this._randomColor(200, 240);
            this.ctx.fillRect(0, 0, this.width, this.height);
            this._createCode();
            this._draw();
        },
        _addEvent: function() {
            var self = this;
            self.clickFunc = function() {
                self.update.call(self);
            };
            self.container.addEventListener("click", self.clickFunc);
        },
        _createCode: function() {
            this.code = this._randStr(this.options.len);
        },
        _draw: function() {
            if (!this.container) {
                return;
            }
            // 绘制code
            for (var i = 0; i < this.options.len; i++) {
                var x = (this.width - 20) / this.options.len * i + 15;
                // 最小值控制上移距离，最大值控制下移距离
                var y = this._randomNum(this.height * this.options.top, this.height * this.options.bottom);
                var deg = this._randomNum(-45, 45);
                // 每次用一个code
                var txt = this.code.charAt(i);
                this.ctx.fillStyle = this._changeColor(this.options.colors && this.options.colors[i]) || this._randomColor(10, 100);
                this.ctx.font = this._randomNum(this.options.minfontsize, this.options.maxfontsize) + "px SimHei";
                this.ctx.translate(x, y);
                this.ctx.rotate(deg * Math.PI / 180);
                this.ctx.fillText(txt, 0, 0);
                this.ctx.rotate(-deg * Math.PI / 180);
                this.ctx.translate(-x, -y);
            }
            // 绘制线
            for (var i = 0; i < this.options.len; i++) {
                this.ctx.strokeStyle = this._randomColor(90, 180);
                this.ctx.beginPath();
                this.ctx.moveTo(this._randomNum(0, this.width), this._randomNum(0, this.height));
                this.ctx.lineTo(this._randomNum(0, this.width), this._randomNum(0, this.height));
                this.ctx.stroke();
            }
            // 绘制弧
            for (var i = 0; i < this.options.len * 10; i++) {
                this.ctx.fillStyle = this._randomColor(0, 255);
                this.ctx.beginPath();
                this.ctx.arc(this._randomNum(0, this.width), this._randomNum(0, this.height), this.options.radius, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        },
        /**
         * 将16进制颜色转为rgb类型
         * @param {String} colorhex 16进制的字符串
         */
        _changeColor: function(colorhex) {
            if (!colorhex) {
                return ;
            }
            if (/^#/.test(colorhex)) {
                colorhex = colorhex.substr(1);
            }
            var _r = colorhex.substr(0, 2);
            var _g = colorhex.substr(2, 2);
            var _b = colorhex.substr(4, 2);
            var _a = 1;
            
            if (_r && _g && _b) {
                return "rgba(" + parseInt(_r, 16) + "," + parseInt(_g, 16) + "," + parseInt(_b, 16) +"," + 1 + ")";
            }
        },
        /**
         * 随机颜色
         * @param {Number} min
         * @param {Number} max
         */
        _randomColor: function(min, max) {
            var _r = this._randomNum(min, max);
            var _g = this._randomNum(min, max);
            var _b = this._randomNum(min, max);
            return "rgba(" + _r + "," + _g + "," + _b +"," + 1 + ")";
        },
        /**
         * 随机数
         * @param {Number} min
         * @param {Number} max
         */
        _randomNum: function(min, max) {
            return Math.floor(Math.random() * (max - min) + min);
        },
        /**
         * 随机产生固定长度的验证码字符串
         * @param {Number} length 字符串长度
         * @return {String} 返回随即字符串
         */
        _randStr: function(length) {
            // 采用uuid的方法，减少代码量
            return Util.uuid({
                type: 'noline',
                len: length
            });
        },
        update: function() {
            if (!this.container) {
                return;
            }
            this._render();
        },
        /**
         * 验证规则是忽略大小写
         * @param {String} code
         */
        validate: function(code) {
            return this.code.toLowerCase() === code;
        },
        destroy: function() {
            this.container.removeEventListener('click', this.clickFunc);
            this.clickFunc = null;
            this.options = null;
            this.container = null;
            this.width = null;
            this.height = null;
            this.ctx = null;
            this.code = null;
        }
    };

    window.VerifyCode = VerifyCode;

})();