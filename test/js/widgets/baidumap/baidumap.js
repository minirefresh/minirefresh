/**
 * 作者: 戴荔春
 * 创建时间: 2017/05/23
 * 版本: [1.0, 2017/07/10 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: 百度map操作相关，主要是利用获取到定位，然后将对应的定位显示到百度地图上 
 * 需要依赖于百度地图sdk-forjs
 */
(function() {
    "use strict";

    var ishttps = 'https:' == document.location.protocol ? true : false;

    var defaultSetting = {
        container: '#baidumap',
        isSupportGeolocation: false,
        isForceDD: false,
        longitude: 120.61990712,
        latitude: 31.31798737
    };

    /**
     * 组件的构造函数
     * @param {Object} options 配置参数，和init以及initData的一致
     * @constructor
     */
    function BaiduMap(options) {

        options = Util.extend({}, defaultSetting, options);

        this.container = Util.selector(options.container);
        this.options = options;

        this._render();
        // 定位，然后更新地图坐标
        this.update();
    }

    /**
     * 定义原型
     */
    BaiduMap.prototype = {
        /**
         * 视图的渲染和数据分离，采用内部的数据
         */
        _render: function() {
            var point = new BMap.Point(this.options.longitude, this.options.latitude);

            this.currPoint = point;
            // 创建地址解析实例
            this.myGeo = new BMap.Geocoder();
            this.map = new BMap.Map(this.container);
            this.map.centerAndZoom(point, 12);
        },
        /**
         * 根据传入的最新点坐标，更新地图
         * @param {Object} point
         */
        _updateLocation: function(point) {
            // 地图初始化
            var bm = this.map;
            // 层级越高越精确
            bm.centerAndZoom(point, 16);
            bm.enableScrollWheelZoom(true);
            // 暂时不需要导航栏控件
            // bm.addControl(new BMap.NavigationControl());
            // 地图上添加点
            var localmark = new BMap.Marker(point);
            bm.addOverlay(localmark);
            bm.panTo(point);
            this.currPoint = point;
        },
        /**
         * 通过已经获取到的谷歌经纬度(或原始坐标)转换为百度左边
         * @param {String} longitude
         * @param {String} latitude
         * @param {Function} success 成功回调 (point)
         * @param {Boolean} 是否是原始坐标，原始坐标和谷歌坐标有些偏差
         */
        _changeBDPointByGeolocationLocation: function(longitude, latitude, success, isOrigin) {
            if (typeof arguments[0] == 'object') {
                // 百度定位，直接返回
                success && success(arguments[0]);
                return ;
            }
            
            // 默认为谷歌坐标
            isOrigin = isOrigin || false;
            // 一个geolocation的point
            var ggpoint = new BMap.Point(longitude, latitude);
            // 百度坐标点转换器
            var convertor = new BMap.Convertor();
            var pointArr = [];
            pointArr.push(ggpoint);
            // 原始坐标为1，谷歌坐标为3
            // 一般钉钉，谷歌定位出来的都是谷歌坐标(标准坐标)
            var type = isOrigin ? 1 : 3;
            // 左边转换，异步进行
            convertor.translate(pointArr, type, 5, function(data) {
                var tmpPoint = ggpoint;
                if (data && data.status === 0 && data.points) {
                    tmpPoint = data.points[0];
                }
                success && success(tmpPoint);
            });
        },

        /**
         * 通过钉钉获取定位
         * @param {Function} success 返回经纬度
         * @param {Function} error
         */
        _getLocationByDD: function(success, error) {
            dd.device.geolocation.get({
                // 误差默认为200 m
                targetAccuracy: 200,
                // 标准坐标，获取后经过百度转换
                coordinate: 0,
                // 由于只需要用到经纬度，所以不需要逆地理编码
                withReGeocode: false,
                onSuccess: function(result) {
                    /* 高德坐标 result 结构
                    {
                        longitude : Number,
                        latitude : Number,
                        accuracy : Number,
                        address : String,
                        province : String,
                        city : String,
                        district : String,
                        road : String,
                        netType : String,
                        operatorType : String,
                        errorMessage : String,
                        errorCode : Number,
                        isWifiEnabled : Boolean,
                        isGpsEnabled : Boolean,
                        isFromMock : Boolean,
                        provider : wifi|lbs|gps,
                        accuracy : Number,
                        isMobileEnabled : Boolean
                    }
                    */
                    success && success(result.longitude, result.latitude);
                },
                onFail: function(err) {
                    error && error('钉钉获取坐标失败');
                }
            });
        },
        /**
         * 根据自带的navigator.geolocation获取经纬度
         * iOS 10 开始必须使用https 否则无法使用
         * @param {Function} success 成功返回的是一个point
         * @param {Function} error
         */
        _getLocationByGeolocation: function(success, error) {
            var self = this;
            navigator.geolocation.getCurrentPosition(function(position) {
                success && success(position.coords.longitude, position.coords.latitude);
            }, function(error) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        error && error("用户拒绝对获取地理位置的请求");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        error && error("位置信息是不可用的。");
                        break;
                    case error.TIMEOUT:
                        error && error("请求用户地理位置超时。");
                        break;
                    case error.UNKNOWN_ERROR:
                        error && error("未知错误。");
                        break;
                }
            });
        },
        /**
         * 通过百度浏览器获取定位
         * @param {Function} success 这里返回的直接就是转换成百度之后的点，和其它有区别
         * @param {Function} error
         */
        _getLocationByBDBrowser: function(success, error) {
            var geolocation = new BMap.Geolocation();
            geolocation.getCurrentPosition(function(r) {
                var map = self.map;
                if (this.getStatus() == BMAP_STATUS_SUCCESS) {
                    success && success(r.point);
                } else {
                    error && error('failed' + this.getStatus());
                }
            }, {
                enableHighAccuracy: true
            })
        },
        /**
         * 先获取坐标点，然后定位
         */
        _location: function() {
            var self = this;
            
            self.getLocation(function(point) {
                 self._updateLocation(point);
                 self.options.success && self.options.success(point);
            }, self.options.error);
        },
        /**
         * 获取地理坐标
         * @param {Function} success 成功回调
         * 成功回调中是一个 百度封装后的point，可以
         * point.lng
         * point.lat
         * @param {Function} error 失败回调，(msg)
         */
        getLocation: function(success, error) {
            var options = this.options,
                self = this;
            
            var callback = function(longitude, latitude) {
                longitude = longitude || options.longitude;
                latitude = latitude || options.latitude;
                
                self._changeBDPointByGeolocationLocation(longitude, latitude, success);
            };
            // 如果强制使用钉钉定位，会使用钉钉获取原始坐标然后再转换为百度点
            if (options.isForceDD && Util.os.dd && window.dd) {
                this._getLocationByDD(callback, error);
            } else if (navigator.geolocation && ishttps && options.isSupportGeolocation) {
                // 如果是https,并且是移动端，采用locationByGeolocation
                this._getLocationByGeolocation(callback, error);
            } else {
                // 否则采用普通的浏览器定位
                this._getLocationByBDBrowser(callback, error);
            }
        },
        /**
         * 更新地图，不能更换容器，可以更换一些普通设置
         * @param {Object} options
         */
        update: function(options) {
            this.options = Util.extend(this.options, options);
            this._location();
        },
        /**
         * 搜索最近热点
         * @param {JSON} options 需要的配置参数
         * 包括success回调
         */
        searchHotPoint: function(setting) {
             var self = this;
            setting = setting || {};
            // 默认搜索1000米内的POI
            setting.poiRadius = setting.poiRadius || 1000;
            // 默认列举个12POI
            setting.numPois = setting.numPois || 12;

            self.myGeo.getLocation(self.currPoint, function(rs) {
                // console.log(JSON.stringify(rs));
                // 获取全部POI（例如该点半径为100米内有6个POI点）
                var allPois = rs.surroundingPois; 
                // 有title，address属性
                setting.success && setting.success(allPois);
            }, setting);
        },

        destroy: function() {
            this.container = null;
            this.options = null;
            this.currPoint = null;
            this.myGeo = null;
            this.map = null;
        }
    };

    window.BaiduMap = BaiduMap;
})();