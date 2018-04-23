# minirefresh

[![](https://img.shields.io/badge/codestyle-eslint-brightgreen.svg)](https://eslint.org/)
[![](https://img.shields.io/circleci/project/minirefresh/minirefresh/master.svg)](https://circleci.com/gh/minirefresh/minirefresh/tree/master)
[![](https://img.shields.io/codecov/c/github/minirefresh/minirefresh/master.svg)](https://codecov.io/github/minirefresh/minirefresh?branch=master)
[![](https://img.shields.io/npm/dm/minirefresh.svg)](https://www.npmjs.com/package/minirefresh)
[![](https://img.shields.io/npm/v/minirefresh.svg)](https://www.npmjs.com/package/minirefresh)
[![](https://img.shields.io/npm/l/minirefresh.svg)](https://www.npmjs.com/package/minirefresh)
[![](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/minirefreshjs/minirefresh)

[![](https://saucelabs.com/browser-matrix/minirefreshs.svg)](https://saucelabs.com/beta/builds/62749d602ec849809265f00ba5259eae)

优雅的H5下拉刷新。零依赖，高性能，多主题，易拓展。

[README in English](READM.en.md)

[Docs in English](https://minirefresh.github.io/minirefresh-doc-en/)

### [http://www.minirefresh.com](http://www.minirefresh.com)

## Notice

__喜欢，你就给一个star!__

## 特点

- 零依赖（原生JS实现，不依赖于任何库）

- 多平台支持。一套代码，多端运行，支持Android，iOS，主流浏览器

- 丰富的主题，官方提供多种主题（包括默认，applet-仿小程序，drawer3d-3d抽屉效果，taobao-仿淘宝等）

- 高性能。动画采用css3+硬件加速，在主流手机上流畅运行

- 良好的兼容性。支持和各种Scroll的嵌套（包括mui-scroll,IScroll,Swipe等），支持Vue环境下的使用

- 易拓展，三层架构，专门抽取UI层面，方便实现各种的主题，实现一套主题非常方便，而且几乎可以实现任何的效果

- 优雅的API和源码，API设计科学，简单，源码严谨，所有源码通过`ESlint`检测

- 完善的文档与示例，提供完善的showcase，以及文档

## 官网与文档

[http://www.minirefresh.com](http://www.minirefresh.com)

[https://minirefresh.github.io/](https://minirefresh.github.io/)

## 安装

### NPM

```js
npm install minirefresh
```

[https://www.npmjs.com/package/minirefresh](https://www.npmjs.com/package/minirefresh)

### GIT

```js
git clone git://github.com/minirefresh/minirefresh.git
```

[https://github.com/minirefresh/minirefresh](https://github.com/minirefresh/minirefresh)

## 引入

```html
<link rel="stylesheet" href="xxx/minirefresh.css" />
<script type="text/javascript" src="xxx/minirefresh.js"></script>
```

### `require`引入

```js
// 同时支持NPM与文件形式引入
var MiniRefreshTools = require('xxx/minirefresh.js');
require('xxx/minirefresh.css');
```

### `import`引入

```js
// debug下是.js dist下是.min.js
import MiniRefreshTools from 'minirefresh';
import 'minirefresh/dist/debug/minirefresh.css'
```

## 页面布局

```html
<!-- minirefresh开头的class请勿修改 -->
<div id="minirefresh" class="minirefresh-wrap">
    <div class="minirefresh-scroll">        
    </div>
</div>
```

## 初始化

```js
// 引入任何一个主题后，都会有一个 MiniRefresh 全局变量
var miniRefresh = new MiniRefresh({
    container: '#minirefresh',
    down: {
        callback: function() {
            // 下拉事件
        }
    },
    up: {

        callback: function() {
            // 上拉事件
        }
    }
});
```

### 结束刷新

```js
// 结束下拉刷新
miniRefresh.endDownLoading();
```

```js
// 结束上拉加载
// 参数为true代表没有更多数据，否则接下来可以继续加载
miniRefresh.endUpLoading(true);
```

### 更多

更多的使用请参考官方文档

## 效果

### 基础示例

__1. 【基础新闻列表】最基本的下拉刷新使用__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/base_default.gif)

__2. 【多列表单容器】每次切换菜单时刷新容器__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/base_single.gif)

__3. 【多列表多容器】多个列表都有一个Minirefresh对象__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/base_multi.gif)

__4. 【Vue支持】支持Vue下的使用__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/base_vue.gif)

### 嵌套示例

__1. 【Mui-Slider】内部嵌套图片轮播__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/nested_slider.gif)

__2. 【Mui-Scroll】嵌套在Mui-Scroll中__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/nested_muiscroll.gif)

__3. 【Swipe】嵌套在Swipe中__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/nested_swipe.gif)

### 主题示例

__1. 【applet】仿微信小程序主题__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/theme_applet.gif)

__2. 【taobao】仿淘宝刷新主题__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/theme_taobao.gif)

__3. 【drawer3d】3D抽屉效果主题__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/theme_drawer3d.gif)

__4. 【drawer-slider】滑动抽屉效果主题__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/theme_drawerslider.gif)

## showcase

可以直接在线体验效果

[https://minirefresh.github.io/minirefresh/examples/](https://minirefresh.github.io/minirefresh/examples/)

![](https://minirefresh.github.io/minirefresh/staticresource/showcase/qrcode.png)

## 贡献

__`minirefresh`需要你!__

来为项目添砖加瓦，新的`Idea`，新的主题，重大Bug发现，新的设计资源（如图标，官网设计等）

都可以通过`Issue`或`PR`的方式提交！

贡献被采纳后会加入贡献者名单，如果有杰出贡献（如持续贡献），可以加入`Manager`小组，共同开发维护`MiniRefresh`

有共同参与项目意愿的，可以申请成为`Member`，成为`Minirefresh`真正的主人！

更多参考：[https://minirefresh.github.io/minirefresh-doc/site/contribute/howtocontributor.html](https://minirefresh.github.io/minirefresh-doc/site/contribute/howtocontributor.html)

## 讨论

- [gitter](https://gitter.im/minirefreshjs/minirefresh)

- QQ群（`601988892`）

_注意，申请加入群时请添加验证信息，例如：minirefresh使用遇到问题等等_

