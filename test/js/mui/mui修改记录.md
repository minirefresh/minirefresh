### mui重新编译修改记录

在集成到`hybrid`框架时，mui中有很多功能可以进行删除或者独立提取，以此来减少核心代码的体积，以下是修改记录

项目svn: `svn://192.168.0.51/2014/T10/新点微门户平台/trunk/dcloud/跨平台框架/code/mui`

#### 删除的文件

| 文件名| 功能 | 删除原因|
| :------------- |:-------------:| -----:|
| xxx.5+.js | 5+相关的js文件 | 遗弃5+ |
| mui.dialog.xxx.js | mui的弹窗 | 采用ejs的弹窗 |
| mui.popup.js | mui模拟弹窗的实现 | 采用ejs的弹窗 |
| mui.pullrefresh.js | mui的下拉刷新 | 采用框架基于IScroll5的下拉刷新 |
| mui.class.scroll.pullrefresh.js | iscroll里的下拉刷新实现 | 遗弃mui下拉刷新 |
| mui.init.pullrefresh.js | 下拉刷新初始化相关 | 遗弃mui下拉刷新 |
| mui.jsonp.js | mui ajax的jsonp实现 | 采用CROS方法 |
| mui.transparent.js | mui 头部渐变功能 | 采用原生导航栏 |
| mui.ajax.js | ajax请求 | 改用了Zepto的ajax |

#### 提取的文件

将一些不常用的组件提取出去，单独按需引入

| 文件名| 功能 | 提取原因|
| :------------- |:-------------:| -----:|
| mui.offcanvas.js | 侧滑相关 | 侧滑很少用到 |

#### 修改的文件

| 文件名| 功能 | 修改原因|
| :------------- |:-------------:| -----:|
| mui.class.js | mui的基础类 | 修改严格模式下的calllee报错 |
| tableviews.js | 包括一些列表ui等操作 | 兼容严格模式 |
| mui.js | mui核心代码 | 在es6下暴露mui全局变量 |
| mui.class.scroll.js | mui的iscroll4代码 | 兼容严格模式 |
| mui.init.js | mui的init文件 | 删除iframe创建代码 |
| input.plugin.js | input的插件 | 删除5+相关的语言插件功能 |


### 更新记录

* 2017/06/06
    * 重新编译mui.js
    * 去除了5+代码
    * 去除了下拉刷新，去除了弹窗相关
    * 将offcanvas等单独提取
    * 兼容严格模式，修改mui.class、scroll、tableview、ajax等文件
* 2017/06/16
    * init文件删除iframe代码