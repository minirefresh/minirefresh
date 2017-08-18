### 文件说明
下拉刷新所有皮肤内部都默认引入了IScroll5，因此如果项目中其它地方有用到IScroll5，无需在引入

`pulltorefresh.skin.default.js` 默认皮肤

`pulltorefresh.skin.native.js` 原生容器下(钉钉，ejs)的皮肤

`pulltorefresh.skin.typexx.js` 某一类别的皮肤，除了type1，其它皮肤，请引入样式文件`pulltorefresh.skin.css`

`pulltorefresh.skin.core.js` 下拉刷新的核心文件，不能单独使用，如果要实现自定义皮肤，需要通过这个文件进行继承