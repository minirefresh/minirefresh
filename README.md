# minirefresh

[![](https://img.shields.io/npm/dm/minirefresh.svg)](https://www.npmjs.com/package/minirefresh)
[![](https://img.shields.io/npm/v/minirefresh.svg)](https://www.npmjs.com/package/minirefresh)
[![](https://img.shields.io/npm/l/minirefresh.svg)](https://www.npmjs.com/package/minirefresh)
[![](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/minirefreshjs/minirefresh)

__内测中...__

__喜欢，你就给一个star!__

极简主义的下拉刷新，H5环境使用

## 官网

[//www.minirefresh.com](//www.minirefresh.com)

## 安装

### NPM

```js
npm install minirefresh
```

### GIT

```js
git clone git://github.com/minirefresh/minirefresh.git
```

## 引入

```html
<link rel="stylesheet" href="xxx/minirefresh.css" />
<script type="text/javascript" src="xxx/minirefresh.js"></script>
```

### `require`引入

```js
// npm安装情况
var MiniRefresh = require('minirefresh');
```

```js
// 直接通过路径引入
var MiniRefresh = require('xxx/minirefresh.js');
```

## 页面布局

```html
<div id="minirefresh" class="minirefresh-wrap">
    <div class="minirefresh-scroll">        
    </div>
</div>
```

## 初始化

```js
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

### 功能

下拉刷新，支持主流浏览器，支持移动端和PC


### 特点

- 零依赖，与依赖其它任何代码

- 多端支持，Android，iOS，手机各浏览器，PC端主流浏览器

- 高性能，底层使用CSS3动画和硬件加速，在低端机上也流畅运行

- 多种皮肤可供选择，官方提供各式各样的皮肤可供选择

- 易拓展，可拓展自定义皮肤。且底层源码解耦分层，拓展皮肤只需要少量代码

- 简单，易用。完善的文档，简洁的API，轻松写出优雅的代码。

## 贡献指南

- [代码规范](coderule.md)

- [贡献者](contributor.md)

## 讨论

` [gitter/minirefreshjs/minirefresh](https://gitter.im/minirefreshjs/minirefresh)

- QQ群（`601988892`）