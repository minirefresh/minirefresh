# 需要遵循的代码规则

## `eslint`

代码采用`eslint`校验

### 默认规则

```js
eslint:recommended
```

默认开启了`eslint`的默认校验规则

其中如下规则被重新覆盖：

```js
// 目前console变为警告级别
"no-console": 1,

```

### 代码风格

`eslint`配置中增加了一些其它规则，详情参考`.eslint.js`文件
