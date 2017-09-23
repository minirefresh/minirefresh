(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('chai')) :
	typeof define === 'function' && define.amd ? define(['chai'], factory) :
	(factory(global.chai));
}(this, (function (chai) { 'use strict';

function getNow() {
    return window.performance &&
        window.performance.now ?
        (window.performance.now() +
            window.performance.timing.navigationStart) :
        +new Date();
}

const noop = () => {};

function extend(target, ...rest) {
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
function selector(element) {
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
function getClientHeightByDom(dom) {
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
function namespace(parent, namespaceStr, target) {
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

describe('extend方法', () => {
    let obj1;
    let obj2;
    let obj3;
        
    before(() => {
        // 在本区块的所有测试用例之前执行
        obj1 = {
            company: 'epoint',
            product: {
                ejs: 'ejs混合开发方案',
            },
        };

        obj2 = {
            company: 'epoint2',
            city: 'suzhou',
            product: {
                m7: 'm7移动框架',
            },
        };

        obj3 = {
            name: 'zhangsan',
            product: {
                group: 'mobile',
                m7: 'm7移动框架2',
            },
        };
    });

    it('拓展单个（浅层拓展）', () => {
        const result = extend({}, obj1, obj2);

        chai.expect(result).to.have.deep.property('company', obj2.company);
        chai.expect(result).to.have.deep.property('product', obj2.product);
    });

    it('拓展多个（浅层拓展）', () => {
        const result = extend({}, obj1, obj2, obj3);

        chai.expect(result).to.have.deep.property('company', obj2.company);
        chai.expect(result).to.have.deep.property('product', obj3.product);
        chai.expect(result).to.have.deep.property('name', obj3.name);
    });
});

describe('noop', () => {
    it('是一个空函数', () => {
        chai.expect(noop).to.be.an('function');
    });
});

describe('getNow', () => {
    it('当前时间', () => {
        chai.expect(getNow()).to.be.an('number');
    });
    
    it('两个now不允许相等', () => {
        chai.expect(getNow()).to.not.equal(getNow());
    });
    
    it('没有performance时', () => {
        const oldPerformance = window.performance;
        
        window.performance = undefined;
        getNow();
        chai.expect(1).to.be.equal(1);
        
        window.performance = oldPerformance;
    });
});

describe('selector', () => {
    const ID = 'testdiv';
    const CLASS = 'testclass';
    const TAG = 'DIV';
    const CONTENT = 'testcontent';
    
    function expectDom(dom) {
        chai.expect(dom).to.be.an.instanceof(HTMLElement);
        chai.expect(dom.id).to.be.equal(ID);
        chai.expect(dom.className).to.be.equal(CLASS);
        chai.expect(dom.className).to.be.equal(CLASS);
        chai.expect(dom.tagName).to.be.equal(TAG);
        chai.expect(dom.innerHTML).to.be.equal(CONTENT);
    }
    
    before(() => {
        const dom = document.createElement(TAG);
        
        dom.id = ID;
        dom.className = CLASS;
        dom.innerHTML = CONTENT;
        
        document.body.appendChild(dom);
    });
    
    it('id选择', () => {
        const dom = selector(`#${ID}`);
        
        expectDom(dom);
    });
    
    it('class选择', () => {
        const dom = selector(`.${CLASS}`);
        
        expectDom(dom);
    });
    
    it('tag选择', () => {
        const dom = selector(TAG);
        
        expectDom(dom);
    });
});

describe('getClientHeightByDom', () => {
    // 确保高度会大于这个阈值
    const INSURANCE_HEIGHT = 10;
    let dom;
    
    before(() => {
        dom = document.createElement('div');
        
        dom.innerHTML = '纯属测试';
        
        document.body.appendChild(dom);
    });
    
    it('body的高度', () => {
        chai.expect(getClientHeightByDom(document.body)).to.be.an('number');
        chai.expect(getClientHeightByDom(dom)).to.be.above(INSURANCE_HEIGHT);
    });
    
    it('元素的高度', () => {
        chai.expect(getClientHeightByDom(dom)).to.be.an('number');
        chai.expect(getClientHeightByDom(dom)).to.be.above(INSURANCE_HEIGHT);
    });
});

describe('namespace', () => {
    const NAMESPACE_STR = 'test';
    const NAMESPACE_STR_MORE = 'test.child';
    const NAMESPACE_EMPTY = '';
    let parent;
    let target;
    
    beforeEach(() => {
        parent = {};
        target = {};
    });
    
    it('empty命名空间挂载', () => {
        const res = namespace(parent, NAMESPACE_EMPTY, target);

        chai.expect(res).to.be.equal(parent);
    });
    
    it('正常单重命名空间挂载', () => {
        const res = namespace(parent, NAMESPACE_STR, target);

        chai.expect(res).to.be.equal(target);
        chai.expect(parent[NAMESPACE_STR]).to.be.equal(target);
    });
    
    it('正常多重命名空间挂载', () => {
        const res = namespace(parent, NAMESPACE_STR_MORE, target);

        chai.expect(res).to.be.equal(target);
    });
});

/**
 * 仅仅用了rollup自动检测eslint
 */

})));
