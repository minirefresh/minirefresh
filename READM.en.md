# minirefresh

[![](https://img.shields.io/badge/codestyle-eslint-brightgreen.svg)](https://eslint.org/)
[![](https://img.shields.io/circleci/project/minirefresh/minirefresh/master.svg)](https://circleci.com/gh/minirefresh/minirefresh/tree/master)
[![](https://img.shields.io/codecov/c/github/minirefresh/minirefresh/master.svg)](https://codecov.io/github/minirefresh/minirefresh?branch=master)
[![](https://img.shields.io/npm/dm/minirefresh.svg)](https://www.npmjs.com/package/minirefresh)
[![](https://img.shields.io/npm/v/minirefresh.svg)](https://www.npmjs.com/package/minirefresh)
[![](https://img.shields.io/npm/l/minirefresh.svg)](https://www.npmjs.com/package/minirefresh)
[![](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/minirefreshjs/minirefresh)

[![](https://saucelabs.com/browser-matrix/minirefreshs.svg)](https://saucelabs.com/beta/builds/62749d602ec849809265f00ba5259eae)

A Graceful HTML5 Drop-Down-Refresh Plugin. 

No Dependency. High Performance. Multi Themes. Easy To Expand.

[README in Chinese](READM.md)

[Docs in English](https://minirefresh.github.io/minirefresh-doc-en/)

### [https://minirefresh.github.io](https://minirefresh.github.io)

## Notice

__You Can Star It!__

## Features

- No Dependency(do not depend on any library)

- Multi Platform Support(Android, iOS, Browser)

- Multi Themes(default, applet, taobao, drawer3d, drawerslider)

- High Performance(CSS3 hardware speedup)

- Good Compatibility(scroll-nested, support Vue)

- Easy To Expand(by implementing the UI hooks)

- Graceful API(detected by `ESlint`)

- Documentation And Examples(Introduction, API, Tutorial)

## Website

[http://www.minirefresh.com](http://www.minirefresh.com)

[https://minirefresh.github.io/](https://minirefresh.github.io/)

## Install

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

## Import

```html
<link rel="stylesheet" href="xxx/minirefresh.css" />
<script type="text/javascript" src="xxx/minirefresh.js"></script>
```

### `require`引入

```js
// support NPM and UMD
var MiniRefreshTools = require('xxx/minirefresh.js');
require('xxx/minirefresh.css');
```

### `import`引入

```js
// debug:.js   dist:.min.js
import MiniRefreshTools from 'minirefresh';
import 'minirefresh/dist/debug/minirefresh.css'
```

## HTML Layout

```html
<!-- do not modify "minirefresh-xxx" -->
<div id="minirefresh" class="minirefresh-wrap">
    <div class="minirefresh-scroll">        
    </div>
</div>
```

## Initial

```js
// MiniRefresh is a global variable
var miniRefresh = new MiniRefresh({
    container: '#minirefresh',
    down: {
        callback: function() {
            // pulldown event
        }
    },
    up: {

        callback: function() {
            // pullup event
        }
    }
});
```

### End Refresh

```js
// end pulldown
miniRefresh.endDownLoading();
```

```js
// end pullup
// true: no more data
// false: can still load more
miniRefresh.endUpLoading(true);
```

### More

For more detail, refer to the official documentation

## Effect

### Base Showcase

__1. 【Base List】basic usage__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/base_default.gif)

__2. 【Multi List Single Container】refresh the container when the list is switched__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/base_single.gif)

__3. 【Multi List Multi Container】there are miltiple containers at the same time__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/base_multi.gif)

__4. 【Vue Support】support Vue__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/base_vue.gif)

### Nested Showcase

__1. 【Mui-Slider】nested gallery carousel__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/nested_slider.gif)

__2. 【Mui-Scroll】nested in Mui-Scroll__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/nested_muiscroll.gif)

__3. 【Swipe】nested in Swipe__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/nested_swipe.gif)

### Themes Showcase

__1. 【applet】imitate weichat aplet__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/theme_applet.gif)

__2. 【taobao】imitate taobao refresh__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/theme_taobao.gif)

__3. 【drawer3d】3D slidingdrawer__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/theme_drawer3d.gif)

__4. 【drawer-slider】slidingdrawer__

![](https://minirefresh.github.io/minirefresh/staticresource/screenshoot/theme_drawerslider.gif)

## showcase

[https://minirefresh.github.io/minirefresh/examples/](https://minirefresh.github.io/minirefresh/examples/)

![](https://minirefresh.github.io/minirefresh/staticresource/showcase/qrcode.png)

## Contribute

__`minirefresh` Need You!__

new `Idea`,new Themes,Fix bugs,new design(icon, pages)

by `Issue`or`Pull Request`!

__You Can Apply To Be An Owner Of This Project__

- first, to be a `Contributor`(contribute your code or ideas)

- second, to be a `Manager`(the permissions of read and modify)- brilliant contribution

- finally, to be a `Member`(the member of the `MiniRefresh Organization`, the real master!)- collaborative participate in this project

reference：[https://minirefresh.github.io/minirefresh-doc/site/contribute/howtocontributor.html](https://minirefresh.github.io/minirefresh-doc/site/contribute/howtocontributor.html)

## Discuss

- [gitter](https://gitter.im/minirefreshjs/minirefresh)
