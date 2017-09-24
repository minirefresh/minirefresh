export function getNow() {
    return window.performance
        && (window.performance.now
            ? (window.performance.now()
                + window.performance.timing.navigationStart)
            : +new Date());
}

export const noop = () => {};

export function extend(target, ...rest) {
    const finalTarget = target;

    rest.forEach((source) => {
        Object.keys(source).forEach((key) => {
            finalTarget[key] = source[key];
        });
    });

    return finalTarget;
}

/**
 * 选择这段代码用到的太多了，因此抽取封装出来
 * @param {Object} element dom元素或者selector
 * @return {HTMLElement} 返回选择的Dom对象，无果没有符合要求的，则返回null
 */
export function selector(element) {
    let target = element;

    if (typeof target === 'string') {
        target = document.querySelector(target);
    }

    return target;
}

/**
 * 获取DOM的可视区高度，兼容PC上的body高度获取
 * 因为在通过body获取时，在PC上会有CSS1Compat形式，所以需要兼容
 * @param {HTMLElement} dom 需要获取可视区高度的dom,对body对象有特殊的兼容方案
 * @return {Number} 返回最终的高度
 */
export function getClientHeightByDom(dom) {
    let height = dom.clientHeight;

    if (dom === document.body && document.compatMode === 'CSS1Compat') {
        // PC上body的可视区的特殊处理
        height = document.documentElement.clientHeight;
    }

    return height;
}

/**
 * 设置一个Util对象下的命名空间
 * @param {Object} parent 需要绑定到哪一个对象上
 * @param {String} namespace 需要绑定的命名空间名
 * @param {Object} target 需要绑定的目标对象
 * @return {Object} 返回最终的对象
 */
export function namespace(parent, namespaceStr, target) {
    if (!namespaceStr) {
        return parent;
    }

    const namespaceArr = namespaceStr.split('.');
    const len = namespaceArr.length;
    let res = parent;

    for (let i = 0; i < len - 1; i += 1) {
        const tmp = namespaceArr[i];

        // 不存在的话要重新创建对象
        res[tmp] = res[tmp] || {};
        // parent要向下一级
        res = res[tmp];
    }
    res[namespaceArr[len - 1]] = target;

    return target;
}