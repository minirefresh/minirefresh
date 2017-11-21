export function getNow() {
    return window.performance &&
        (window.performance.now ?
            (window.performance.now() +
                window.performance.timing.navigationStart) :
            +new Date());
}

export const noop = () => {};

export function isArray(object) {
    if (Array.isArray) {
        return Array.isArray(object);
    }
    
    return object instanceof Array;
}

export function isObject(object) {
    const classType = Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];

    return classType !== 'String' &&
        classType !== 'Number' &&
        classType !== 'Boolean' &&
        classType !== 'Undefined' &&
        classType !== 'Null';
}

export function isWindow(object) {
    return object && object === window;
}

export function isPlainObject(obj) {
    return isObject(obj)
        && !isWindow(obj)
        // 如果不是普通的object,Object.prototype需要通过链回溯才能得到
        && Object.getPrototypeOf(obj) === Object.prototype;
}

export function extend(...rest) {
    const len = rest.length;
    let target = rest[0] || {};
    let sourceIndex = 1;
    let isDeep = false;

    if (typeof target === 'boolean') {
        // 深赋值或false
        isDeep = target;
        target = rest[sourceIndex] || {};
        sourceIndex++;
    }

    if (!isObject(target)) {
        // 确保拓展的一定是object
        target = {};
    }

    for (; sourceIndex < len; sourceIndex++) {
        // source的拓展
        const source = rest[sourceIndex];

        if (source && isObject(source)) {
            // for-of打包过大
            Object.keys(source).forEach((name) => {
                const src = target[name];
                const copy = source[name];
                const copyIsPlainObject = isPlainObject(copy);
                let copyIsArray = isArray(copy);
                let clone;

                if (target === copy) {
                    // 防止环形引用
                    return;
                }

                if (isDeep &&
                    copy &&
                    (copyIsArray || copyIsPlainObject)) {
                    // 这里必须用isPlainObject,只有同样是普通的object才会复制继承
                    // 如果是FormData之流的，会走后面的覆盖路线
                    if (copyIsArray) {
                        copyIsArray = false;
                        clone = src && isArray(src) ? src : [];
                    } else {
                        clone = src && isPlainObject(src) ? src : {};
                    }
                    
                    target[name] = extend(isDeep, clone, copy);
                } else if (copy !== undefined) {
                    // 如果非深赋值
                    // 或者不是普通的object，直接覆盖，例如FormData之类的也会覆盖
                    target[name] = copy;
                }
            });
        }
    }

    return target;
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