import {
    requestAnimationFrame,
} from './util/raf';

import {
    noop,
} from './util/lang';

class MiniRefresh {
    /**
     * 构造函数
     * @param {Object} options 配置信息
     * @constructor
     */
    constructor(options) {
        this.options = options;
    }
}

/**
 * 静态属性es6没有，需要es7
 * 因此es6手动绑定
 */
MiniRefresh.version = '3.0.0';

export default MiniRefresh;