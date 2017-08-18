(function() {
	"use strict";
	var e = {},
		a = navigator.userAgent,
		n = a.match(/AliApp\(\w+\/([a-zA-Z0-9.-]+)\)/);
	null === n && (n = a.match(/DingTalk\/([a-zA-Z0-9.-]+)/));
	var i = n && n[1];
	e.ios = /iPhone|iPad|iPod/i.test(a), e.android = /Android/i.test(a), e.version = i, e.cfg = {}, e.extend = function(e, a) {
		if(a)
			for(var n in a) e[n] = a[n];
		return e
	}, e.type = function(e) {
		return Object.prototype.toString.call(e).match(/^\[object\s(.*)\]$/)[1]
	}, "object" == typeof module && module && "object" == typeof module.exports ? module.exports = e : "function" == typeof define && (define.amd || define.cmd) && define(function() {
		return e
	}), "undefined" == typeof this.dd && (this.dd = e), this.__dd = e
}).call(window),
	function(e) {
		"use strict";
		var a = ["backbutton", "online", "offline", "pause", "resume", "swipeRefresh", "appLinkResponse", "internalPageLinkResponse", "networkEvent", "hostTaskEvent", "autoCheckIn"];
		e.extend(e, {
			events: a
		})
	}(__dd),
	function(e) {
		"use strict";
		var a = "0.9.7",
			n = {
				device: [{
					namespace: "device.notification.alert",
					name: "弹窗alert",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						title: "",
						buttonName: "确定"
					}
				}, {
					namespace: "device.notification.confirm",
					name: "弹窗confirm",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						title: "",
						buttonLabels: ["确定", "取消"]
					}
				}, {
					namespace: "device.notification.prompt",
					name: "弹窗prompt",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						title: "",
						buttonLabels: ["确定", "取消"]
					}
				}, {
					namespace: "device.notification.vibrate",
					name: "震动",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						duration: 300
					}
				}, {
					namespace: "device.accelerometer.watchShake",
					name: "启动摇一摇",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						watch: !0
					},
					paramsCallback: function(a) {
						e.ios && (a.sensitivity = 3.2)
					}
				}, {
					namespace: "device.accelerometer.clearShake",
					name: "停止摇一摇",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {},
					paramsCallback: function(e) {}
				}, {
					namespace: "device.notification.toast",
					name: "Toast",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						text: "toast",
						duration: 3,
						delay: 0
					}
				}, {
					namespace: "device.notification.showPreloader",
					name: "显示浮层",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						text: "加载中...",
						showIcon: !0
					}
				}, {
					namespace: "device.notification.hidePreloader",
					name: "隐藏浮层",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "device.geolocation.get",
					name: "获取经纬度",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "device.notification.actionSheet",
					name: "ActionSheet控件",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "device.connection.getNetworkType",
					name: "获取当前网络类型",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "device.base.getUUID",
					name: "获取通用唯一识别码（卸载重新安装会改变）",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "device.base.getInterface",
					name: "获取热点接入信息",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "device.launcher.checkInstalledApps",
					name: "检测应用是否安装",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "device.launcher.launchApp",
					name: "启动第三方app",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "device.notification.modal",
					name: "弹浮层",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "device.geolocation.openGps",
					name: "打开设置，只有android有效",
					ios: "2.5.0",
					android: "2.5.0"
				}, {
					namespace: "device.notification.extendModal",
					name: "弹层，支持多张图片",
					ios: "2.5.0",
					android: "2.5.0"
				}, {
					namespace: "device.base.getSettings",
					name: "获取手机设置（目前只有ios支持）",
					ios: "2.6.0",
					android: "2.6.0",
					release: !1
				}, {
					namespace: "device.audio.download",
					name: "下载音频",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "device.audio.play",
					name: "播放音频",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "device.audio.onPlayEnd",
					name: "监听播放音频停止的事件接口",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "device.audio.resume",
					name: "暂停之后继续播放音频",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "device.audio.pause",
					name: "暂停播放音频",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "device.audio.stop",
					name: "停止播放音频",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "device.audio.startRecord",
					name: "开始录制音频",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "device.audio.stopRecord",
					name: "停止录制音频",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "device.audio.onRecordEnd",
					name: "监听录音自动停止",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "device.audio.upload",
					name: "上传已录制的音频",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "device.audio.translateVoice",
					name: "音频转文字",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "device.base.getScanWifiList",
					name: "获取wifi列表",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "device.base.getWifiStatus",
					name: "获取wifi是否打开",
					ios: "2.11.0",
					android: "2.11.0",
					release: !1
				}, {
					namespace: "device.nfc.nfcRead",
					name: "nfc读取接口",
					ios: "2.11.0",
					android: "2.11.0",
					release: !1
				}, {
					namespace: "device.nfc.nfcWrite",
					name: "nfc写接口",
					ios: "2.11.0",
					android: "2.11.0",
					release: !1
				}, {
					namespace: "device.health.stepCount",
					name: "健康步数",
					ios: "2.11.0",
					android: "2.11.0",
					release: !1
				}, {
					namespace: "device.health.dayStepCount",
					name: "健康每日数据",
					ios: "2.11.0",
					android: "2.11.0",
					release: !1
				}, {
					namespace: "device.base.enableBluetooth",
					name: "开启蓝牙",
					ios: "3.3.0",
					android: "3.3.0",
					release: !1
				}, {
					namespace: "device.base.enableLocation",
					name: "开启定位",
					ios: "3.3.0",
					android: "3.3.0",
					release: !1
				}, {
					namespace: "device.base.startBindDevice",
					name: "跳转到硬件绑定页面",
					ios: "3.3.0",
					android: "3.3.0",
					release: !1
				}, {
					namespace: "device.base.unBindDevice",
					name: "硬件解绑",
					ios: "3.3.0",
					android: "3.3.0",
					release: !1
				}, {
					namespace: "device.base.getScanWifiListAsync",
					name: "获取WIFI",
					ios: "3.3.0",
					android: "3.3.0",
					release: !1
				}],
				biz: [{
					namespace: "biz.util.open",
					name: "打开应用内页面",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {}
				}, {
					namespace: "biz.util.openLink",
					name: "新开页面",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						credible: !0,
						showMenuBar: !0
					}
				}, {
					namespace: "biz.util.share",
					name: "分享",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						title: "",
						buttonName: "确定"
					}
				}, {
					namespace: "biz.util.ut",
					name: "上报埋点",
					ios: "2.4.0",
					android: "2.4.0",
					paramsCallback: function(a) {
						var n = a.value,
							i = [];
						if(n && "Object" == e.type(n))
							if(e.ios) n = JSON.stringify(n);
							else if(e.android) {
							for(var o in n) i.push(o + "=" + n[o]);
							n = i.join(",")
						}
						a.value = n
					}
				}, {
					namespace: "biz.util.datepicker",
					name: "日期选择器",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.util.timepicker",
					name: "弹窗alert",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.user.get",
					name: "获取当前登录用户信息",
					ios: "2.4.0",
					android: "2.4.0",
					offline: !0
				}, {
					namespace: "biz.navigation.setLeft",
					name: "设置导航左侧按钮",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						watch: !0,
						show: !0,
						control: !1,
						showIcon: !0,
						text: ""
					}
				}, {
					namespace: "biz.navigation.setRight",
					name: "设置导航右侧按钮",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						watch: !0,
						show: !0,
						control: !1,
						showIcon: !0,
						text: ""
					}
				}, {
					namespace: "biz.navigation.setTitle",
					name: "弹窗alert",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.navigation.back",
					name: "弹窗alert",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.util.uploadImage",
					name: "弹窗alert",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						multiple: !1
					}
				}, {
					namespace: "biz.util.previewImage",
					name: "弹窗alert",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.util.qrcode",
					name: "弹窗alert",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.ding.post",
					name: "发钉",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.telephone.call",
					name: "打电话",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.chat.chooseConversation",
					name: "选会话",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.contact.createGroup",
					name: "创建群",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.util.datetimepicker",
					name: "日期时间控件",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.util.chosen",
					name: "下拉控件",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.chat.getConversationInfo",
					name: "查询会话信息",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.map.search",
					name: "地图搜索",
					ios: "2.4.0",
					android: "2.4.0",
					release: !1,
					defaultParams: {
						scope: 500
					}
				}, {
					namespace: "biz.map.locate",
					name: "地图定位",
					ios: "2.4.0",
					android: "2.4.0",
					release: !1
				}, {
					namespace: "biz.map.view",
					name: "查看定位",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "biz.util.scan",
					name: "扫码(支持二维码和条形码)",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						type: "qrCode"
					}
				}, {
					namespace: "biz.contact.choose",
					name: "修改企业通讯录选人",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						multiple: !0,
						startWithDepartmentId: 0,
						users: []
					},
					paramsCallback: function(a) {
						e.cfg && e.cfg.corpId && (a.corpId = e.cfg.corpId)
					}
				}, {
					namespace: "biz.contact.complexChoose",
					name: "企业通讯录同时选人，选部门",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						startWithDepartmentId: 0,
						selectedUsers: [],
						selectedDepartments: []
					},
					paramsCallback: function(a) {
						e.cfg && e.cfg.corpId && (a.corpId = e.cfg.corpId)
					}
				}, {
					namespace: "biz.navigation.createEditor",
					name: "创建通用组件",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.navigation.finishEditor",
					name: "销毁通用组件",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.chat.pickConversation",
					name: "选群组",
					ios: "2.4.2",
					android: "2.4.2"
				}, {
					namespace: "biz.contact.complexChoose",
					name: "企业通讯录同时选人，选部门",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.navigation.setIcon",
					name: "设置导航icon",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						watch: !0,
						showIcon: !0,
						iconIndex: 1
					}
				}, {
					namespace: "biz.navigation.close",
					name: "关闭webview",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.util.uploadImageFromCamera",
					name: "上传图片",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "biz.user.secretID",
					name: "获取用户登录唯一标识",
					ios: "2.5.2",
					android: "2.5.2"
				}, {
					namespace: "biz.customContact.choose",
					name: "自定义选人组件",
					ios: "2.5.2",
					android: "2.5.2",
					defaultParams: {
						isShowCompanyName: !1,
						max: 50
					},
					paramsCallback: function(a) {
						e.cfg && e.cfg.corpId && (a.corpId = e.cfg.corpId)
					}
				}, {
					namespace: "biz.customContact.multipleChoose",
					name: "自定义选人组件（多选）",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						isShowCompanyName: !1,
						max: 50
					},
					paramsCallback: function(a) {
						e.cfg && e.cfg.corpId && (a.corpId = e.cfg.corpId)
					}
				}, {
					namespace: "biz.util.pageClick",
					name: "页面打点",
					ios: "2.5.2",
					android: "2.5.2"
				}, {
					namespace: "biz.chat.chooseConversationByCorpId",
					name: "选择企业会话",
					ios: "2.6.0",
					android: "2.6.0",
					defaultParams: {
						max: 50
					},
					paramsCallback: function(a) {
						e.cfg && e.cfg.corpId && (a.corpId = e.cfg.corpId)
					}
				}, {
					namespace: "biz.chat.toConversation",
					name: "跳转会话",
					ios: "2.6.0",
					android: "2.6.0",
					paramsCallback: function(a) {
						e.cfg && e.cfg.corpId && (a.corpId = e.cfg.corpId)
					}
				}, {
					namespace: "biz.navigation.goBack",
					name: "",
					ios: "2.6.0",
					android: "2.6.0"
				}, {
					namespace: "biz.navigation.setMenu",
					name: "设置导航左侧按钮",
					ios: "2.6.0",
					android: "2.6.0",
					defaultParams: {
						watch: !0
					}
				}, {
					namespace: "biz.util.uploadAttachment",
					name: "附件上传",
					ios: "2.7.0",
					release: !1,
					android: "2.7.0"
				}, {
					namespace: "biz.cspace.preview",
					name: "附件预览",
					ios: "2.7.0",
					android: "2.7.0",
					release: !1,
					defaultParams: {}
				}, {
					namespace: "biz.cspace.saveFile",
					name: "转存附件",
					ios: "2.7.6",
					android: "2.7.6"
				}, {
					namespace: "biz.cspace.chooseSpaceDir",
					name: "选择钉盘目录",
					ios: "2.7.6",
					android: "2.7.6"
				}, {
					namespace: "biz.clipboardData.setData",
					name: "添加到黏贴板",
					ios: "2.7.0",
					android: "2.7.0",
					release: !1
				}, {
					namespace: "biz.intent.fetchData",
					name: "选择图片",
					ios: "2.7.6",
					android: "2.7.6",
					release: !1
				}, {
					namespace: "biz.chat.locationChatMessage",
					name: "未知",
					ios: "2.7.6",
					android: "2.7.6",
					release: !1
				}, {
					namespace: "biz.navigation.popGesture",
					name: "未知",
					ios: "2.7.6",
					android: "2.7.6",
					release: !1
				}, {
					namespace: "biz.util.warn",
					name: "报警接口",
					ios: "2.7.6",
					android: "2.7.6",
					release: !1,
					paramsCallback: function(e) {
						var a = e.logName || "h5_common_error",
							n = "url=" + location.href,
							i = [],
							o = e.obj || {};
						for(var s in o) i.push(s + "=" + o[s]);
						e.message = {
							msg: a + " " + n + " " + i.join(" ")
						}
					}
				}, {
					namespace: "biz.util.multiSelect",
					name: "下拉多选",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "biz.contact.getMobileContact",
					name: "查询手机联系人",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "biz.telephone.showCallMenu",
					name: "打电话选择面板",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "biz.util.presentWindow",
					name: "打开窗口",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "biz.contact.changeCustomerFollower",
					name: "企业通讯录选人，加入微应用权限过滤",
					ios: "2.8.0",
					android: "2.8.0",
					paramsCallback: function(a) {
						e.cfg && e.cfg.corpId && (a.corpId = e.cfg.corpId)
					}
				}, {
					namespace: "biz.notify.send",
					name: "消息通知H5到Native",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "biz.alipay.pay",
					name: "支付宝移动支付SDK，订单支付JS-API封装",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "biz.alipay.auth",
					name: "支付宝移动支付SDK，授权JS-API封装",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "biz.util.fetchImageData",
					name: "在相册中拾取某张图片，对图片数据base64编码后返回给js",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "biz.util.scanCard",
					name: "名片扫描",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "biz.util.addDesktopShortcuts",
					name: "添加桌面快捷方式",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "biz.util.timestamp",
					name: "获取服务器时间",
					ios: "2.9.0",
					android: "2.9.0",
					release: !1
				}, {
					namespace: "biz.contact.complexPicker",
					name: "选人",
					ios: "2.9.0",
					android: "2.9.0",
					release: !1
				}, {
					namespace: "biz.util.encrypt",
					name: "加密",
					ios: "2.9.1",
					android: "2.9.1",
					release: !1
				}, {
					namespace: "biz.util.decrypt",
					name: "解密",
					ios: "2.9.1",
					android: "2.9.1",
					release: !1
				}, {
					namespace: "biz.contact.pickCustomer",
					name: "选择客户",
					ios: "2.11",
					android: "2.11",
					release: !1
				}, {
					namespace: "biz.map.searchRoute",
					name: "查询路线",
					ios: "2.11",
					android: "2.11",
					release: !1
				}, {
					namespace: "biz.contact.setRule",
					name: "设置规则",
					ios: "2.15",
					android: "2.15",
					release: !1
				}, {
					namespace: "biz.auth.requestAuthCode",
					name: "JS免登",
					ios: "2.15",
					android: "2.15",
					release: !1
				}, {
					namespace: "biz.redenvelop.sendNormalRedEnvelop",
					name: "x",
					ios: "2.13",
					android: "2.13",
					release: !1
				}, {
					namespace: "biz.redenvelop.sendEnterpriseRedEnvelop",
					name: "x",
					ios: "2.15",
					android: "2.15",
					release: !1
				}, {
					namespace: "biz.contact.departmentsPicker",
					name: "选部门",
					ios: "3.0",
					android: "3.0",
					release: !1
				}, {
					namespace: "biz.contact.externalComplexPicker",
					name: "选外部通信录",
					ios: "3.0",
					android: "3.0",
					release: !1
				}, {
					namespace: "biz.contact.addFromManual",
					name: "选企业通信录的人",
					ios: "3.0",
					android: "3.0",
					release: !1
				}, {
					namespace: "biz.contact.addFromContact",
					name: "选手机联系人",
					ios: "3.0",
					android: "3.0",
					release: !1
				}, {
					namespace: "biz.contact.externalEditForm",
					name: "编辑联系人",
					ios: "3.0",
					android: "3.0",
					release: !1
				}, {
					namespace: "biz.contact.addUserForm",
					name: "添加联系人",
					ios: "3.1",
					android: "3.1",
					release: !1
				}, {
					namespace: "biz.contact.chooseMobileContacts",
					name: "选择手机联系人",
					ios: "3.1",
					android: "3.1",
					release: !1
				}, {
					namespace: "biz.util.openFloatWindow",
					name: "打开浮层窗口",
					ios: "3.2",
					android: "3.2",
					release: !1
				}, {
					namespace: "biz.data.getAvatar",
					name: "获取头像URL",
					ios: "3.3",
					android: "3.3",
					release: !1
				}],
				ui: [{
					namespace: "ui.input.plain",
					name: "输入框（单行）",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "ui.progressBar.setColors",
					name: "设置顶部进度条颜色",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "ui.pullToRefresh.enable",
					name: "启用下拉刷新功能",
					ios: "2.4.0",
					android: "2.4.0",
					defaultParams: {
						watch: !0
					}
				}, {
					namespace: "ui.pullToRefresh.stop",
					name: "收起下拉刷新控件",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "ui.pullToRefresh.disable",
					name: "禁用下拉刷新功能",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "ui.webViewBounce.enable",
					name: "启用webview下拉弹性效果",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "ui.webViewBounce.disable",
					name: "禁用webview下拉弹性效果",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "ui.nav.preload",
					name: "",
					ios: "2.6.0",
					android: "2.6.0",
					release: !1
				}, {
					namespace: "ui.nav.go",
					name: "",
					ios: "2.6.0",
					android: "2.6.0",
					release: !1
				}, {
					namespace: "ui.nav.recycle",
					name: "",
					ios: "2.6.0",
					android: "2.6.0",
					release: !1
				}, {
					namespace: "ui.nav.push",
					name: "",
					ios: "2.10.0",
					android: "2.11.0",
					release: !1
				}, {
					namespace: "ui.nav.pop",
					name: "",
					ios: "2.10.0",
					android: "2.11.0",
					release: !1
				}, {
					namespace: "ui.nav.quit",
					name: "",
					ios: "2.10.0",
					android: "2.11.0",
					release: !1
				}, {
					namespace: "ui.nav.close",
					name: "",
					ios: "2.6.0",
					android: "2.6.0",
					release: !1
				}, {
					namespace: "ui.nav.getCurrentId",
					name: "",
					ios: "2.6.0",
					android: "2.6.0",
					release: !1
				}, {
					namespace: "ui.drawer.init",
					name: "",
					ios: "2.6.0",
					android: "2.6.0",
					release: !1
				}, {
					namespace: "ui.drawer.config",
					name: "",
					ios: "2.6.0",
					android: "2.6.0",
					release: !1
				}, {
					namespace: "ui.drawer.enable",
					name: "",
					ios: "2.6.0",
					android: "2.6.0",
					release: !1
				}, {
					namespace: "ui.drawer.disable",
					name: "",
					ios: "2.6.0",
					android: "2.6.0",
					release: !1
				}, {
					namespace: "ui.drawer.open",
					name: "",
					ios: "2.6.0",
					android: "2.6.0",
					release: !1
				}, {
					namespace: "ui.drawer.close",
					name: "",
					ios: "2.6.0",
					android: "2.6.0",
					release: !1
				}, {
					namespace: "ui.tab.init",
					name: "初始化tab",
					android: "2.7.6"
				}, {
					namespace: "ui.tab.start",
					name: "唤起tab",
					android: "2.7.6"
				}, {
					namespace: "ui.tab.config",
					name: "配置tab",
					android: "2.7.6"
				}, {
					namespace: "ui.tab.select",
					name: "tab选择",
					android: "2.7.6"
				}, {
					namespace: "ui.tab.add",
					name: "增加tab",
					android: "2.7.6"
				}, {
					namespace: "ui.tab.remove",
					name: "移除tab",
					android: "2.7.6"
				}, {
					namespace: "ui.appLink.open",
					name: "应用跳转",
					ios: "2.7.0",
					android: "2.7.0",
					release: !1
				}, {
					namespace: "ui.appLink.request",
					name: "发送消息",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "ui.appLink.response",
					name: "返回消息",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "ui.appLink.fetch",
					name: "获取请求页面（sourceApp）的数据",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "ui.nav.push",
					name: "往路径堆栈中push路径",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "ui.nav.pop",
					name: "路径堆栈中删除view 路径",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}],
				runtime: [{
					namespace: "runtime.info",
					name: "获取容器信息",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "runtime.permission.requestAuthCode",
					name: "请求授权码，免登改造用",
					ios: "2.4.0",
					android: "2.4.0"
				}, {
					namespace: "runtime.permission.requestJsApis",
					name: "权限校验jsapi，隐藏方法，只限sdk内部调用",
					ios: "2.4.0",
					android: "2.4.0",
					release: !1
				}, {
					namespace: "runtime.message.post",
					name: "",
					ios: "2.6.0",
					android: "2.6.0",
					release: !1
				}, {
					namespace: "runtime.message.fetch",
					name: "",
					ios: "2.6.0",
					android: "2.6.0",
					release: !1
				}, {
					namespace: "runtime.permission.requestOperateAuthCode",
					name: "",
					ios: "3.3.0",
					android: "3.3.0",
					release: !1
				}],
				internal: [{
					namespace: "internal.lwp.call",
					name: "lwp接口(目前只有套件使用)",
					ios: "2.5.0",
					android: "2.5.0",
					offline: !0
				}, {
					namespace: "internal.microapp.checkInstalled",
					name: "检测微应用是否安装",
					ios: "2.5.0",
					android: "2.5.0"
				}, {
					namespace: "internal.user.getRole",
					name: "获取角色",
					ios: "2.5.0",
					android: "2.5.0"
				}, {
					namespace: "internal.request.lwp",
					name: "lwp通道",
					ios: "2.5.1",
					android: "2.5.1",
					paramsCallback: function(e) {
						var a = e.body;
						a = JSON.stringify(a), e.body = a
					}
				}, {
					namespace: "internal.util.encryData",
					name: "参数加密生成key",
					ios: "2.5.2",
					android: "2.5.2"
				}, {
					namespace: "internal.log.upload",
					name: "上报日志到服务端",
					ios: "2.6.0",
					android: "2.6.0"
				}, {
					namespace: "internal.hpm.get",
					name: "获取hpm配置信息（暂未开发）",
					ios: "2.7.0",
					android: "2.7.0"
				}, {
					namespace: "internal.hpm.update",
					name: "更新hpm",
					ios: "2.7.0",
					android: "2.7.0"
				}, {
					namespace: "internal.request.getSecurityToken",
					name: "获取securityToken",
					ios: "2.7.0",
					android: "2.7.0"
				}, {
					namespace: "internal.phoneContact.add",
					name: "添加号码到手机通信录",
					ios: "2.7.6",
					android: "2.7.6"
				}, {
					namespace: "internal.log.add",
					name: "日志写入到客户端",
					ios: "2.7.6",
					android: "2.7.6",
					paramsCallback: function(e) {
						var a = "h5_log=1";
						e.text = a + e.text
					}
				}, {
					namespace: "internal.pageLink.request",
					name: "发送消息",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "internal.pageLink.response",
					name: "返回消息",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "internal.pageLink.fetch",
					name: "获取请求页面（sourceApp）的数据",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "internal.util.getCorpIdByOrgId",
					name: "orgId换corpId",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "internal.util.getOrgIdByCorpId",
					name: "corpId换orgId",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "internal.request.httpOverLWP",
					name: "http转lwp",
					ios: "2.8.0",
					android: "2.8.0"
				}, {
					namespace: "internal.notify.send",
					name: "消息通知H5到Native",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "internal.schema.open",
					name: "内部页面跳转",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "internal.contact.chooseMobileContact",
					name: "手机通讯录选人（单选）",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "internal.util.isSimulator",
					name: "模拟器",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "internal.util.getWua",
					name: "人机识别",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "internal.beacon.detectBeacons",
					name: "beacon",
					ios: "2.9.0",
					android: "2.9.0",
					release: !1
				}, {
					namespace: "internal.host.lwp",
					name: "离线托管的lwp请求",
					ios: "2.9.0",
					android: "2.9.0",
					release: !1
				}, {
					namespace: "internal.host.query",
					name: "查询离线托管任务",
					ios: "2.9.0",
					android: "2.9.0",
					release: !1
				}, {
					namespace: "internal.host.cancel",
					name: "取消离线托管任务",
					ios: "2.9.0",
					android: "2.9.0",
					release: !1
				}, {
					namespace: "internal.schema.openWifiSetting",
					name: "跳转到wifi设置（Android）",
					ios: "2.9.0",
					android: "2.9.0",
					release: !1
				}, {
					namespace: "internal.createOrg.industryInfo",
					name: "获取创建团队之后的行业信息",
					ios: "2.9.0",
					android: "2.9.0",
					release: !1
				}, {
					namespace: "internal.createOrg.successJump",
					name: "创建团队之后跳转",
					ios: "2.9.0",
					android: "2.9.0",
					release: !1
				}, {
					namespace: "internal.beacon.detectStart",
					name: "detectStart",
					ios: "3.1.0",
					android: "3.1.0",
					release: !1
				}, {
					namespace: "internal.beacon.detectStop",
					name: "detectStop",
					ios: "3.1.0",
					android: "3.1.0",
					release: !1
				}, {
					namespace: "internal.attend.assistant",
					name: "上班助手",
					ios: "2.11.0",
					android: "2.11.0",
					release: !1
				}, {
					namespace: "internal.certify.step",
					name: "查询活体认证状态",
					ios: "2.12.0",
					android: "2.12.0",
					release: !1
				}, {
					namespace: "internal.certify.biometric",
					name: "调用活体拍照",
					ios: "2.12.0",
					android: "2.12.0",
					release: !1
				}, {
					namespace: "internal.certify.takePhoto",
					name: "拍照",
					ios: "2.12.0",
					android: "2.12.0",
					release: !1
				}, {
					namespace: "internal.certify.submit",
					name: "上班助手",
					ios: "2.12.0",
					android: "2.12.0",
					release: !1
				}, {
					namespace: "internal.hpm.queryInfo",
					name: "hpm查询",
					ios: "2.15.0",
					android: "2.15.0",
					release: !1,
					defaultParams: {
						appId: "-8"
					}
				}, {
					namespace: "internal.hpm.delete",
					name: "hpm删除",
					ios: "2.15.0",
					android: "2.15.0",
					release: !1,
					defaultParams: {
						appId: "-8"
					}
				}, {
					namespace: "internal.beacon.bind",
					name: "beancon绑定",
					ios: "3.1.0",
					android: "3.1.0",
					release: !1,
					defaultParams: {}
				}, {
					namespace: "internal.channel.infoExist",
					name: "检查客户端上服务窗是否已开通",
					ios: "3.2.0",
					android: "3.2.0",
					release: !1,
					defaultParams: {}
				}, {
					namespace: "internal.channel.openPage",
					name: "打开指定企业服务窗相关页面",
					ios: "3.2.0",
					android: "3.2.0",
					release: !1,
					defaultParams: {}
				}, {
					namespace: "internal.notify.add",
					name: "添加消息",
					ios: "3.3.0",
					android: "3.3.0",
					release: !1,
					defaultParams: {}
				}],
				util: [{
					namespace: "util.localStorage.getItem",
					name: "本地存储读",
					ios: "2.4.2",
					android: "2.4.2",
					release: !1
				}, {
					namespace: "util.localStorage.setItem",
					name: "本地存储写",
					ios: "2.4.2",
					android: "2.4.2",
					release: !1
				}, {
					namespace: "util.localStorage.removeItem",
					name: "本地存储移除操作",
					ios: "2.4.2",
					android: "2.4.2",
					release: !1
				}, {
					namespace: "util.domainStorage.getItem",
					name: "本地存储（区分域名）读",
					ios: "2.9.0",
					android: "2.9.0",
					release: !1
				}, {
					namespace: "util.domainStorage.setItem",
					name: "本地存储（区分域名）写",
					ios: "2.9.0",
					android: "2.9.0",
					release: !1
				}, {
					namespace: "util.domainStorage.removeItem",
					name: "本地存储（区分域名）删除",
					ios: "2.9.0",
					android: "2.9.0",
					release: !1
				}, {
					namespace: "util.domainStorage.clearItems",
					name: "本地存储（区分域名）清空",
					ios: "2.9.0",
					android: "2.9.0",
					release: !1
				}, {
					namespace: "biz.util.vip",
					name: "vip监控",
					ios: "3.3.0",
					android: "3.3.0",
					release: !1
				}],
				preRelease: [{
					namespace: "preRelease.appLink.open",
					name: "应用跳转",
					ios: "2.7.0",
					android: "2.7.0",
					release: !1
				}, {
					namespace: "preRelease.appLink.request",
					name: "发送消息",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "preRelease.appLink.response",
					name: "返回消息",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}, {
					namespace: "preRelease.appLink.fetch",
					name: "获取请求页面（sourceApp）的数据",
					ios: "2.8.0",
					android: "2.8.0",
					release: !1
				}],
				channel: [{
					namespace: "channel.permission.requestAuthCode",
					name: "服务窗请求授权码，免登改造用",
					ios: "3.0.0",
					android: "3.0.0"
				}, {
					namespace: "channel.open.profile",
					name: "服务窗打开个人profile页面",
					ios: "3.0.0",
					android: "3.0.0"
				}]
			};
		e.extend(e, {
			sdk_version: a
		}), e.extend(e, {
			methods: n
		})
	}(__dd),
	function(e, a) {
		"use strict";

		function n(a, n, i) {
			"undefined" == typeof WebViewJavascriptBridge, e.__getMockName && (a = e.__getMockName(a));
			var o = {};
			o = e.extend(o, i && i.defaultParams), e.extend(o, n), i && i.paramsCallback && i.paramsCallback(o);
			var s = function(e) {
					console.log("默认成功回调", a, e)
				},
				r = function(e) {
					console.log("默认失败回调", a, e)
				},
				d = function() {};
			o.onSuccess && (s = o.onSuccess, delete o.onSuccess), o.onFail && (r = o.onFail, delete o.onFail), o.onCancel && (d = o.onCancel, delete o.onCancel);
			var t = function(e) {
					var a = e || {},
						n = a.errorCode,
						i = a.result;
					"0" === n ? s && s.call(null, i) : "-1" === n ? d && d.call(null, i) : r && r.call(null, i, n)
				},
				c = o.watch;
			if(e.android) {
				var m = a.split("."),
					l = m.pop(),
					p = m.join(".");
				window.WebViewJavascriptBridgeAndroid && WebViewJavascriptBridgeAndroid(s, r, p, l, o)
			} else e.ios && (c ? (window.WebViewJavascriptBridge && WebViewJavascriptBridge.registerHandler(a, function(e, a) {
				t({
					errorCode: "0",
					errorMessage: "成功",
					result: e
				}), a && a({
					errorCode: "0",
					errorMessage: "成功"
				})
			}), window.WebViewJavascriptBridge && WebViewJavascriptBridge.callHandler(a, o)) : window.WebViewJavascriptBridge && WebViewJavascriptBridge.callHandler(a, o, t))
		}
		var i, o = !1,
			s = null,
			r = "runtime.permission.requestJsApis",
			d = null,
			t = !1,
			c = !1;
		window.ES6Promise ? (ES6Promise.polyfill(), c = !0) : window.Promise || (window.Promise = function() {});
		e.extend(e, {
			ability: "",
			config: function(a) {
				a && (s = {
					corpId: a.corpId,
					appId: a.appId || -1,
					timeStamp: a.timeStamp,
					nonceStr: a.nonceStr,
					signature: a.signature,
					jsApiList: a.jsApiList,
					type: a.type || -1
				}, e.cfg = s, a.agentId && (s.agentId = a.agentId))
			},
			error: function(e) {
				d = e
			},
			ready: function(n) {
				var i = function(a) {
					if(!a) return console.log("bridge初始化失败");
					if(null === s) console.log("没有配置dd.config"), n(a);
					else if(e.ios) a.callHandler(r, s, function(e) {
						var i = e || {},
							o = i.errorCode,
							s = i.errorMessage || "";
						i.result;
						"0" === o ? n(a) : setTimeout(function() {
							d && d({
								message: "权限校验失败 " + s,
								errorCode: 3
							})
						})
					});
					else if(e.android) {
						var i = r.split("."),
							t = i.pop(),
							c = i.join(".");
						a(function() {
							n(a)
						}, function(e) {
							setTimeout(function() {
								var a = e && e.errorMessage || "";
								d && d({
									message: "权限校验失败 " + a,
									errorCode: 3
								})
							})
						}, c, t, s)
					}
					if(o === !1 && (o = !0, e.events.forEach(function(n) {
							e.ios && a.registerHandler(n, function(e, a) {
								var i = document.createEvent("HTMLEvents");
								i.data = e, i.detail = e, i.initEvent(n), document.dispatchEvent(i), a && a({
									errorCode: "0",
									errorMessage: "成功"
								})
							})
						}), null === s)) {
						var m = {
							url: encodeURIComponent(window.location.href),
							js: e.sdk_version,
							cid: s && s.corpId || ""
						};
						e.biz.util.ut({
							key: "dd_open_js_monitor",
							value: JSON.stringify(m),
							onSuccess: function(e) {}
						})
					}
				};
				if(e.ios && a.WebViewJavascriptBridge) {
					try {
						WebViewJavascriptBridge.init(function(e, a) {})
					} catch(c) {
						console.log(c.message)
					}
					return i(WebViewJavascriptBridge)
				}
				if(e.android && a.WebViewJavascriptBridgeAndroid) return i(WebViewJavascriptBridgeAndroid);
				if(e.ios) document.addEventListener("WebViewJavascriptBridgeReady", function() {
					if("undefined" == typeof WebViewJavascriptBridge) return console.log("请在钉钉App打开此页面");
					try {
						WebViewJavascriptBridge.init(function(e, a) {})
					} catch(e) {
						console.log(e.message)
					}
					t = !0, i(WebViewJavascriptBridge)
				}, !1);
				else {
					if(!e.android) return console.log("请在钉钉App打开此页面");
					var m = function() {
						try {
							a.WebViewJavascriptBridgeAndroid = a.nuva.require(), t = !0, i(WebViewJavascriptBridgeAndroid)
						} catch(e) {
							console.log("window.nuva.require出错", e.message), i(null)
						}
					};
					a.nuva && (void 0 === a.nuva.isReady || a.nuva.isReady) ? m() : document.addEventListener("runtimeready", function() {
						m()
					}, !1)
				}
			},
			compareVersion: function(e, a, n) {
				if("string" != typeof e || "string" != typeof a) return !1;
				for(var i, o, s = e.split("."), r = a.split("."); i === o && r.length > 0;) i = s.shift(), o = r.shift();
				return n ? (0 | o) >= (0 | i) : (0 | o) > (0 | i)
			}
		});
		var m = function(a, n) {
				for(var i = a.split("."), o = e, s = 0, r = i.length; r > s; s++) s === r - 1 && (o[i[s]] = n), "undefined" == typeof o[i[s]] && (o[i[s]] = {}), o = o[i[s]]
			},
			l = function(a, o, s) {
				return c ? new Promise(function(r, d) {
					o = o || {}, o._onSuccess = o.onSuccess || function() {}, o._onFail = o.onFail || function() {}, o._onCancel = o.onCancel || function() {}, o.onSuccess = function() {
						o._onSuccess.apply(this, arguments), r.apply(this, arguments)
					}, o.onFail = function() {
						o._onFail.apply(this, arguments), d.apply(this, arguments)
					}, o.onCancel = function() {
						o._onCancel.apply(this, arguments), d.apply(this, arguments)
					}, i = new Promise(function(a, n) {
						e.ready(function(e) {
							a(e)
						})
					}), Promise.all([i]).then(function(i) {
						o = o || {}, e.cfg && e.cfg.corpId && (o.corpId = e.cfg.corpId), n(a, o, s)
					})
				}) : (o = o || {}, e.cfg && e.cfg.corpId && (o.corpId = e.cfg.corpId), n(a, o, s), void 0)
			};
		for(var p in e.methods) e.methods[p].forEach(function(e) {
			m(e.namespace, function(a) {
				return l(e.namespace, a, e)
			})
		});
		e._invoke = function(e) {
			m(e.namespace, function(a) {
				return l(e.namespace, a, e)
			})
		}, e.biz.util.pageClick = function(a) {
			var n = "open_micro_log_record_client",
				i = +new Date,
				o = a.corpId,
				r = a.agentId;
			o || (o = s && s.corpId || ""), r || (r = s && s.agentId || "");
			var d = {
				visitTime: i,
				clickType: 2,
				clickButton: a.clickButton || "",
				url: location.href,
				corpId: o,
				agentId: r
			};
			return e.biz.util.ut({
				key: n,
				value: d
			}), c ? new Promise(function(e) {
				e()
			}) : void 0
		}
	}(__dd, window);