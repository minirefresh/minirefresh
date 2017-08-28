module.exports = {
    // 环境定义了预定义的全局变量。
    "env": {
        // 环境定义了预定义的全局变量。更多在官网查看
        "browser": true,
        "node": true,
        "commonjs": true,
        "amd": true,
        "es6": true,
        "mocha": true
    },
    // 使用推荐的配置
    "extends": "eslint:recommended",

    "globals": {
        "MiniRefreshTools": true,
        "MiniRefresh": true
    },
    // JavaScript 语言选项
    "parserOptions": {
        // ECMAScript 版本
        "ecmaVersion": 6,
        // module script, es6的模块需要module类型
        "sourceType": "module", 
        // 想使用的额外的语言特性:
        "ecmaFeatures": {
            // 允许在全局作用域下使用 return 语句
            "globalReturn": true,
            // impliedStric
            "impliedStrict": true
        }
    },
    /**
     *  "off" 或 0 - 关闭规则
     *  "warn" 或 1 - 开启规则，使用警告级别的错误：warn (不会导致程序退出),
     *  "error" 或 2 - 开启规则，使用错误级别的错误：error (当被触发的时候，程序会退出)
     *  在推荐的配置上覆盖一些自定义的规则
     */
    "rules": {
        /**
         * 基础规则覆盖
         */
        // 禁用 console，目前console变为警告级别
        "no-console": 1,
        
        /**
         * 变量声明
         */
        // 不允许标签与变量同名
        "no-label-var": 2,
        // 禁止覆盖受限制的标识符
        "no-shadow-restricted-names": 2,
        // 禁止将变量初始化为 undefined
        "no-undef-init": 2,


        /**
         * 代码风格
         */
        // 要求使用 JSDoc 注释
        "require-jsdoc": 1,
        // 要求使用有效和一致的JSDoc 注释，只有在有返回值时才需要return 
        "valid-jsdoc": [1, {"requireReturn": false}],
        // 禁用魔术数字(3.14什么的用常量代替)
        "no-magic-numbers": [1, {
            "ignore": [0, -1, 1]
        }],
        // 使用 === 替代 == allow-null允许null和undefined==
        "eqeqeq": [2, "allow-null"],
        //  禁用行尾空格,允许空行使用空白符
        "no-trailing-spaces": [2, {
            "skipBlankLines": true
        }],
        // 要求构造函数首字母大写  （要求调用 new 操作符时有首字母大小的函数，允许调用首字母大写的函数时没有 new 操作符。）
        // 允许  new a.B()形式
        "new-cap": [2, {
            "newIsCap": true,
            "capIsNew": false
        }],
         // 要求在注释周围有空行      ( 要求在块级注释之前有一空行)
        "lines-around-comment": [1, {
            "beforeBlockComment": true
        }],
        // e.g [0,"that"] 指定只能 var that = this. that不能指向其他任何值，this也不能赋值给that以外的其他值
        // that self 不能赋值除this以外的值
        "consistent-this": [1, "that", "self", "me"],
        // 数组和对象键值对最后一个逗号， never参数：不能带末尾的逗号, always参数：必须带末尾的逗号，
        // 不建议使用多余的逗号
        "comma-dangle": [1, {
            "arrays": "never",
            "objects": "never",
            "imports": "never",
            "exports": "never",
            "functions": "never",
        }],
        // 禁止出现空函数.如果一个函数包含了一条注释，它将不会被认为有问题。
        // 这里允许 noop = function() {} 的情况
        "no-empty-function": [2, { "allow": ["functions"] }],
        // 要求或禁止 var 声明语句后有一行空行
        // return 前必须空一行
        "padding-line-between-statements": [1, {
            blankLine: "always",
            prev: ["const", "let", "var"],
            next: "*"
        },{
            blankLine: "always",
            prev: "*",
            next: ["return"]
        }, {
            blankLine: "any",
            prev: ["const", "let", "var"],
            next: ["const", "let", "var"]
        }],
        // 要求 for-in 循环中有一个 if 语句
        // 防止把从原型链继承来的属性也包括进来
        "guard-for-in": 2,
        // 强制在一元操作符前后使用一致的空格，比如typeof 后面加空格
        "space-unary-ops": [2, {
            "words": true,
            "nonwords": false
        }],
        // 限制圈复杂度，也就是类似if else能连续接多少个
        // 警告级别，默认最多20个回路
        "complexity": [1, 20],
        // 强制花括号内换行符的一致性
        // 比如while 后面必须有花括号
        "object-curly-newline": 0,
        // 要求或禁止使用分号而不是 ASI（这个才是控制行尾部分号的，）
        // 确保一定是分号结尾
        "semi": [2, "always"],
        // 强制使用.号取属性
        //    参数： allowKeywords：true 使用保留字做属性名时，只能使用.方式取属性
        //                          false 使用保留字做属性名时, 只能使用[]方式取属性 e.g [2, {"allowKeywords": false}]
        //           allowPattern:  当属性名匹配提供的正则表达式时，允许使用[]方式取值,否则只能用.号取值 e.g [2, {"allowPattern": "^[a-z]+(_[a-z]+)+$"}]
        // 如foo["scroll"]应该换为foo.scroll
        "dot-notation": [2, {
            "allowKeywords": false
        }],
        // 使用一致的反勾号、双引号或单引号
        // 警告级别
        "quotes": [1, "single", {
            "avoidEscape": true
        }],
        // 禁止出现未使用过的变量
        "no-unused-vars": [2, {
            "vars": "all",
            "args": "none"
        }],
        // 要求操作符周围有空格
        "space-infix-ops": 2,
        // 不允许在变量定义之前使用它们
        "no-use-before-define": 2,
        // 禁止所有的tab，必须用空格替换
        "no-tabs": 2,
        // 强制把变量的使用限制在其定义的作用域范围内
        "block-scoped-var": 1,
        //  要求 return 语句要么总是指定返回的值，要么不指定
        "consistent-return": 1,
        // 禁用不必要的标签
        "no-extra-label": 1,
        // 禁止 this 关键字出现在类和类对象之外
        "no-invalid-this": 1,
        // 禁止在非赋值或条件语句中使用 new 操作符
        "no-new": 2,
        // 禁止对 Function 对象使用 new 操作符
        "no-new-func": 1,
        // 禁止使用 javascript: url
        "no-script-url": 1,
        // 禁用 void 操作符
        "no-void": 1,
        // 文件末尾强制换行，目前暂时放弃，考虑到一些Idle的格式化问题
        "eol-last": 0,
        // 强制一行的最大长度
        "max-len": [1, 200],
        // 强制最大行数
        "max-lines": [1, 500],
        // 要求方法链中每个调用都有一个换行符
        "newline-per-chained-call": 1,
        // 强制在花括号中使用一致的空格， 关闭这个功能
        "object-curly-spacing": 0,
        // 强制将对象的属性放在不同的行上
        "object-property-newline": 1,
        // 强制在块之前使用一致的空格
        "space-before-blocks": [2, "always"],
        // 强制在 function的左括号之前使用一致的空格，允许func() 目前运行这种方式-考虑到Idel的格式化问题
        "space-before-function-paren": [0, "always"],
        // 强制在圆括号内使用一致的空格
        "space-in-parens": [2, "never"],
        // 禁止 function 标识符和括号之间出现空格
        "no-spaced-func": 2,
        // 强制在关键字前后使用一致的空格 (前后要一致)
        "keyword-spacing": 2,        
        // 强制 function 定义中最多允许的参数数量
        "max-params": [1, 7],
        // 强制 function 块最多允许的的语句数量
        "max-statements": [1, 200],    
        // 要求调用无参构造函数时有圆括号
        "new-parens": 2,
        // 禁止使用 Array 构造函数
        "no-array-constructor": 2,
        // 禁止在代码行后使用内联注释，禁止级别
        "no-inline-comments": 2,
        // 不允许多个空行
        "no-multiple-empty-lines": [2, {
            "max": 2
        }],
        // 禁止可以在有更简单的可替代的表达式时使用三元操作符
        "no-unneeded-ternary": 2,
        // 强制在注释中 // 或 /* 使用一致的空格
        // 所以注释都必须是 // sss  格式
        "spaced-comment": [2, "always", {
            "markers": ["global", "globals", "eslint", "eslint-disable", "*package", "!"]
        }],
        // 双峰驼命名格式，目前为警告级别
        "camelcase": 1,
        // 控制逗号前后的空格
        "comma-spacing": [2, {
            "before": false,
            "after": true
        }],
        // 控制逗号在行尾出现还是在行首出现 (默认行尾)
        // http://eslint.org/docs/rules/comma-style
        "comma-style": [2, "last"],
        // 禁止或强制在单行代码块中使用空格(禁用)
        "block-spacing": [1, "never"],
        // 指定数组的元素之间要以空格隔开(, 后面)， never参数：[ 之前和 ] 之后不能带空格，always参数：[ 之前和 ] 之后必须带空格
        "array-bracket-spacing": [2, "never"],
        // 以方括号取对象属性时，[ 后面和 ] 前面是否需要空格, 可选参数 never, always
        "computed-property-spacing": [2, "never"],
        //强制使用一致的缩进
        "indent": [2, 4, {
            "SwitchCase": 1
        }],
        // 强制在对象字面量的属性中键和值之间使用一致的间距
        "key-spacing": [2, {
            "beforeColon": false,
            "afterColon": true
        }],
        // 强制使用一致的换行风格
        "linebreak-style": [1, "unix"],
        
        
        /**
         * 最佳实践
         */
        // 定义对象的set存取器属性时，强制定义get
        "accessor-pairs": 2,   
        // 强制所有控制语句使用一致的括号风格
        "curly": [2, "all"],
        // switch 语句强制 default 分支，也可添加 // no default 注释取消此次警告
        "default-case": 2,
        // 强制object.key 中 . 的位置，参数:
        //      property，'.'号应与属性在同一行
        //      object, '.' 号应与对象名在同一行
        "dot-location": [2, "property"],
               
        // 强制操作符使用一致的换行符
        "operator-linebreak": [2, "after"],
         // 要求或禁止在 var 声明周围换行，一般用于多个变量声明时
        "one-var-declaration-per-line": [2, "always"],
 
        // 禁用 alert、confirm 和 prompt
        "no-alert": 2,
        // 禁用 arguments.caller 或 arguments.callee
        "no-caller": 2,
        // 禁止除法操作符显式的出现在正则表达式开始的位置
        "no-div-regex": 2,     
        // 禁止在没有类型检查操作符的情况下与 null 进行比较
        "no-eq-null": 1,
        // 禁用 eval()
        "no-eval": 2,
        // 禁止扩展原生类型
        "no-extend-native": 2,
        // 禁止不必要的 .bind() 调用
        "no-extra-bind": 2,        
        // 禁止数字字面量中使用前导和末尾小数点
        "no-floating-decimal": 2,
        // 禁止在全局范围内使用 var 和命名的 function 声明
        "no-implicit-globals": 1,
        // 禁止使用类似 eval() 的方法
        "no-implied-eval": 2,      
        // 禁用 __iterator__ 属性
        "no-iterator": 2,
        //  禁用标签语句
        "no-labels": 2,
        // 禁用不必要的嵌套块
        "no-lone-blocks": 2,
        // 禁止在循环中出现 function 声明和表达式
        "no-loop-func": 1,
        // 禁止使用多个空格
        "no-multi-spaces": 2,
        // 禁止使用多行字符串，在 JavaScript 中，可以在新行之前使用斜线创建多行字符串
        "no-multi-str": 2,
        // 禁止对原生对象赋值
        "no-native-reassign": 2,          
        // 禁止对 String，Number 和 Boolean 使用 new 操作符
        "no-new-wrappers": 2,
        // 禁止在字符串中使用八进制转义序列
        "no-octal-escape": 2,
        // 禁用 __proto__ 属性
        "no-proto": 2,   
        // 禁止自身比较
        "no-self-compare": 2,
        // 禁用逗号操作符
        "no-sequences": 2,
        // 禁止抛出非异常字面量
        "no-throw-literal": 2,
        // 禁用一成不变的循环条件
        "no-unmodified-loop-condition": 2,
        // 禁用未使用过的标签
        "no-unused-labels": 2,
        // 禁止不必要的 .call() 和 .apply()
        "no-useless-call": 2,
        // 禁止不必要的字符串字面量或模板字面量的连接
        "no-useless-concat": 2,   
        // 禁用 with 语句
        "no-with": 2,
        // 强制在parseInt()使用基数参数
        "radix": 2,
        // 要求 IIFE 使用括号括起来
        "wrap-iife": [2, "any"],
        // 要求或禁止 “Yoda” 条件
        "yoda": [2, "never"],

        
        /**
         * Node.js and CommonJS
         */
        // 要求 require() 出现在顶层模块作用域中
        "global-require": 1,
        // 要求回调函数中有容错处理
        "handle-callback-err": [2, "^(err|error)$"],
        // 禁止调用 require 时使用 new 操作符
        "no-new-require": 2,     
        "max-nested-callbacks": [1, 5],

        /**
         * ES6.相关 
         */
        // 要求箭头函数体使用大括号
        "arrow-body-style": 2,
        // 要求箭头函数的参数使用圆括号
        "arrow-parens": 2,
        "arrow-spacing": [2, {
            "before": true,
            "after": true
        }],
        // 强制 generator 函数中 * 号周围使用一致的空格
        "generator-star-spacing": [2, {
            "before": true,
            "after": true
        }],
        // 禁止修改 const 声明的变量
        "no-const-assign": 2,
 
        // 要求或禁止模板字符串中的嵌入表达式周围空格的使用
        "template-curly-spacing": 1,
        // 强制在 yield* 表达式中 * 周围使用空格
        "yield-star-spacing": 2
    }
}