/**
 * 作者: 戴荔春
 * 创建时间: 2016/12/06
 * 版本: [1.0, 2017/05/25 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述: ejs 2.1系列API在dd环境下的部分实现
 * 目前只实现了部分api
 * 请先引入ejsv2核心文件
 * 实现的模块有:
 * nativeUI模块
 * navigator部分功能
 * ddComponent 钉钉平台下独特的一些api
 */

/**
 * 拓展ejs在钉钉下的api
 * 所有参数和ejs保持一致就行了
 */
ejs.extendFucObj('nativeUI', {
	'toast': function(options) {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		var msg = '';
		options = options || {};
		if(typeof options === 'string') {
			msg = options;
		} else {
			msg = options.message;
		}
		dd.device.notification.toast({
			icon: '', //icon样式，有success和error，默认为空 0.0.2
			text: msg || '', //提示信息
			duration: 2, //显示持续时间，单位秒，默认按系统规范[android只有两种(<=2s >2s)]
			delay: 0, //延迟显示，单位秒，默认0
			onSuccess: function(result) {
				/*{}*/
			},
			onFail: function(err) {}
		});
	},
	//callback目前只有钉钉中有用
	'alert': function(options, callback) {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		var title = '',
			msg = '',
			btn = '';
		options = options || {};
		if(typeof options === 'string') {
			msg = options;
			title = arguments[1] || '';
			btn = arguments[2] || '';
			callback = arguments[3] || null;
		} else {
			msg = options.message;
			title = options.title;
			btn = options.btn;
		}
		msg = msg || '';
		title = title || "提示";
		btn = btn || '确定';
		dd.device.notification.alert({
			message: msg,
			title: title, //可传空
			buttonName: btn,
			onSuccess: function() {
				//onSuccess将在点击button之后回调
				/*回调*/
				callback && callback();
			},
			onFail: function(err) {
				error && error();
			}
		});
	},
	'confirm': function(options, callback) {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		options = options || {};

		if(typeof options === 'string') {
			options = {
				'message': options
			};
			if(typeof arguments[1] === 'string') {
				options.title = arguments[1];
				if(typeof arguments[2] === 'object') {
					btnArray = arguments[2];
					callback = arguments[3];
				} else {
					callback = arguments[2];
				}

			}
		}
		var msg = options.message || '';
		var title = options.title || "提示";
		var btnArray = [];
		var btn1 = options.btn1 || '取消';
		var btn2 = options.btn2 || (options.btn2 !== null ? '确定' : '');
		btn1 && btnArray.push(btn1);
		btn2 && btnArray.push(btn2);

		dd.device.notification.confirm({
			message: msg,
			title: title,
			buttonLabels: btnArray,
			onSuccess: function(result) {
				//onSuccess将在点击button之后回调
				/*
				{
				    buttonIndex: 0 //被点击按钮的索引值，Number类型，从0开始
				}
				*/
				var index = -1 * (result.buttonIndex + 1);
				var res = {
					'code': 1,
					'msg': '',
					'result': {
						"which": index
					},
					'detail': result
				};
				callback && callback(res.result, res.msg, res);
			},
			onFail: function(err) {}
		});

	},
	//ejs下暂时没有title与options属性这个属性
	//padlock  点击自动关闭--目前只有这个兼容h5版本
	'showWaiting': function(title, options) {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		title = title || '';
		options = options || {};
		dd.device.notification.showPreloader({
			text: title || "等待中...", //loading显示的字符，空表示不显示文字
			showIcon: true, //是否显示icon，默认true
			onSuccess: function() {
				/*{}*/

			},
			onFail: function(err) {

			}
		});
	},
	'closeWaiting': function() {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		dd.device.notification.hidePreloader({
			onSuccess: function(result) {
				/*{}*/
			},
			onFail: function(err) {}
		});

	},
	'actionSheet': function(options, callback) {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		options = options || {};
		options.items = options.items || [];
		var title = options.title || ''
		dd.device.notification.actionSheet({
			title: title, //标题
			cancelButton: '取消', //取消按钮文本
			otherButtons: options.items,
			onSuccess: function(result) {
				//onSuccess将在点击button之后回调
				/*{
				    buttonIndex: 0 //被点击按钮的索引值，Number，从0开始, 取消按钮为-1
				}*/
				var index = result.buttonIndex;
				var content = options.items[index];
				var res = {
					'code': 1,
					'msg': '',
					'result': {
						"which": index,
						"content": content
					}
				};
				callback && callback(res.result, res.msg, res);
			},
			onFail: function(err) {
				error && error();
			}
		});

	},
});

/**
 * 拓展  navigator 模块
 */
ejs.extendFucObj('navigator', {
	'setTitle': function(title) {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		title = title || '';
		dd.biz.navigation.setTitle({
			title: title, //控制标题文本，空字符串表示显示默认文本
			onSuccess: function(result) {

			},
			onFail: function(err) {}
		});
	},
	'setRightTextBtn': function(title, callback) {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		title = title || '';
		dd.biz.navigation.setRight({
			show: title ? true : false, //控制按钮显示， true 显示， false 隐藏， 默认true
			control: callback ? true : false, //是否控制点击事件，true 控制，false 不控制， 默认false
			text: title || '', //控制显示文本，空字符串表示显示默认文本
			onSuccess: function(result) {
				//如果control为true，则onSuccess将在发生按钮点击事件被回调
				/*
				{}
				*/
				callback && callback(result);
			},
			onFail: function(err) {
				//设置按钮失败，可以提示
			}
		});
	},
	// ejs中是用popwindow来实现
	'setRightMenu': function(backgroundColor, items, callback) {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		dd.biz.navigation.setMenu({
			backgroundColor: backgroundColor,
			items: items,
			onSuccess: function(data) {
				callback && callback(data);
			},
			onFail: function(err) {}
		});
	}
});

/**
 * 拓展dd特有的api
 * 这种API只适合与钉钉平台 
 */
ejs.extendFucObj('ddComponent', {
	/**
	 * @description 选择通讯录,将一些逻辑都封装起来,简化使用
	 * @param {JSON} options 选项
	 * @param {Function} callback 回调函数
	 */
	'chooseContactPerson': function(options, callback) {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		ejs.nativeUI.actionSheet({
			'title': '打开类别',
			'items': ['整个公司选择', '本部门选择']
		}, function(result) {
			var index = result.which;
			if(index === -1) {
				return;
			}
			//默认为整个公司选择
			var type = 0;
			if(index === 1) {
				//部门选择
				type = -1;
			}
			dd.biz.contact.choose({
				//默认要整个公司进行选择
				startWithDepartmentId: type, //-1表示打开的通讯录从自己所在部门开始展示, 0表示从企业最上层开始，(其他数字表示从该部门开始:暂时不支持)
				multiple: true, //是否多选： true多选 false单选； 默认true
				users: options.userGuidList, //默认选中的用户列表，userid；成功回调中应包含该信息
				corpId: options.corpId, //企业id
				max: options.currMaxChooseCount, //人数限制，当multiple为true才生效，可选范围1-1500
				onSuccess: function(data) {
					//onSuccess将在选人结束，点击确定按钮的时候被回调
					/* data结构
					  [{
					    "name": "张三", //姓名
					    "avatar": "http://g.alicdn.com/avatar/zhangsan.png" //头像图片url，可能为空
					    "emplId": '0573', //userid
					   },
					   ...
					  ]
					*/
					callback && callback(data);

				},
				onFail: function(err) {}
			});
		});
	},
	/**
	 * @description 将文件转存到钉盘
	 * @param {JSON} options 选项
	 * @param {Function} callback 回调函数
	 */
	'saveFileToDP': function(options, callback) {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		options = options || {};
		dd.biz.cspace.saveFile({
			corpId: options.corpId,
			url: options.url,
			name: options.name || '匿名文件',
			onSuccess: function(data) {
				/* data结构
				{"data":
				   [
				   {
				   "corpId": "", //公司id
				   "spaceId": "" //空间id
				   "fileId": "", //文件id
				   "fileName": "", //文件名
				   "fileSize": 111111, //文件大小
				   "fileType": "", //文件类型
				   }
				   ]
				}
				*/
				ejs.nativeUI.toast('转到钉盘成功');
				callback && callback(data);
			},
			onFail: function(err) {
				ejs.nativeUI.toast('转到钉盘失败...');
			}
		});
	},
	/**
	 * @description 钉住,发钉,不是钉盘
	 * @param {JSON} options
	 * @param {Function} callback
	 */
	'postDing': function(options, callback) {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		options = options || {};
		dd.biz.ding.post({
			//用户列表，默认为用户自己
			users: options.users,
			corpId: options.corpId, //企业id
			type: options.type, //钉类型 1：image  2：link
			alertType: options.alertType || 2,
			alertDate: options.alertDate,
			attachment: options.attachment,
			text: options.text, //消息
			onSuccess: function() {
				callback && callback();
			},
			onFail: function() {}
		});
	},
	/**
	 * @description 上传拍照图片，可以得到照片
	 * @param {JSON} options
	 * @param {Function} callback
	 */
	'uploadImageFromCamera': function(options, callback) {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		options = options || {};
		dd.biz.util.uploadImageFromCamera({
			compression: options.compression, //(是否压缩，默认为true)
			onSuccess: function(result) {
				callback && callback(result);
				//onSuccess将在图片上传成功之后调用
				/*
				[
				  'http://gtms03.alicdn.com/tps/i3/TB1VF6uGFXXXXalaXXXmh5R_VXX-237-236.png'
				]
				*/
			},
			onFail: function() {}
		});
	},
	/**
	 * @description 上传相册，可以得到照片
	 * @param {JSON} options
	 * @param {Function} callback
	 */
	'uploadImage': function(options, callback) {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		options = options || {};
		dd.biz.util.uploadImage({
			multiple: options.multiple, //是否多选，默认false
			max: options.max, //最多可选个数
			onSuccess: function(result) {
				callback && callback(result);
				//onSuccess将在图片上传成功之后调用
				/*
				[
				  'http://gtms03.alicdn.com/tps/i3/TB1VF6uGFXXXXalaXXXmh5R_VXX-237-236.png'
				]
				*/
			},
			onFail: function() {}
		});
	},
	/**
	 * @description 处理附件，是决定用钉盘还是下载
	 * @param {JSON} options 参数
	 */
	dealWithAttachFile: function(options) {
		if(!ejs.os.dd) {
			// 只有dd中才能使用
			return;
		}
		options = options || {};
		var url = options.url || '';
		var name = options.name || '';
		var corpId = options.corpId || '';
		var itemsArray = ['转到钉盘', '直接下载'];
		if(CommonTools.os.ios) {
			//iOS下只支持rar,zip的下载
			if(url.toLowerCase().indexOf('.zip') === -1 &&
				url.toLowerCase().indexOf('.rar') === -1) {
				itemsArray.splice(1, 1);
			}
		}
		ejs.nativeUI.actionSheet({
			'title': '选择',
			'items': itemsArray
		}, function(result) {
			var index = result.which;
			if(index === 0) {
				//url = 'http://218.4.136.114:7009/EpointMobilePlatform6/test.xlsx';
				ejs.ddComponent.saveFileToDP({
					corpId: corpId,
					url: url,
					name: name
				});
			} else if(index === 1) {
				window.location.href = url;
			}
		});
	},
});

/**
 * 单独覆盖一些已有的esj api 和拓展模式有区别
 * 比如openPage需要重新改写逻辑
 * 目前只支持单个覆盖
 * 目前不会自动暴露出去，只会覆盖已有
 */
(function() {
	var oldOpenPage = ejs.page.openPage;
	// 覆盖openPage,默认关闭钉钉中的分享
	ejs.extendFuc('page', 'openPage', function(url, title, jsonObj, options, callback, error) {
		jsonObj = jsonObj || {};
		options = options || {};
		url = ejs.app.appendParams(url, jsonObj);
		if(ejs.os.dd) {
			if(url.indexOf('?') === -1) {
				url += '?';
			} else {
				url += '&';
			}
			url += 'dd_share=false';
			console.log("url:" + url);
			document.location.href = url;
		} else {
			oldOpenPage(url, title, jsonObj, options, callback, error);
		}
	}, true);
})();