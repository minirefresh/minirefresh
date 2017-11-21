import { expect } from 'chai';
import {
    extend,
    noop,
    getNow,
    selector,
    getClientHeightByDom,
    namespace,
} from '../src/util/lang';

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

        expect(result).to.have.deep.property('company', obj2.company);
        expect(result).to.have.deep.property('product', obj2.product);
    });

    it('拓展多个（浅层拓展）', () => {
        const result = extend({}, obj1, obj2, obj3);

        expect(result).to.have.deep.property('company', obj2.company);
        expect(result).to.have.deep.property('product', obj3.product);
        expect(result).to.have.deep.property('name', obj3.name);
    });
    
    it('拓展多个（递归拓展）', () => {
        const result = extend(true, {}, obj1, obj2, obj3);

        expect(result).to.have.deep.property('company', obj2.company);
        expect(result).to.have.deep.nested.property('product.ejs', obj1.product.ejs);
        expect(result).to.have.deep.nested.property('product.m7', obj3.product.m7);
        expect(result).to.have.deep.nested.property('product.group', obj3.product.group);
    });
});

describe('noop', () => {
    it('是一个空函数', () => {
        noop();
        expect(noop).to.be.an('function');
    });
});

describe('getNow', () => {
    it('当前时间', () => {
        expect(getNow()).to.be.an('number');
    });
    
    it('两个now不允许相等', () => {
        expect(getNow()).to.not.equal(getNow());
    });
    
    it('没有performance时', () => {
        const oldPerformance = window.performance;
        
        window.performance = undefined;
        getNow();
        expect(1).to.be.equal(1);
        
        window.performance = oldPerformance;
    });
});

describe('selector', () => {
    const ID = 'testdiv';
    const CLASS = 'testclass';
    const TAG = 'DIV';
    const CONTENT = 'testcontent';
    
    function expectDom(dom) {
        expect(dom).to.be.an.instanceof(HTMLElement);
        expect(dom.id).to.be.equal(ID);
        expect(dom.className).to.be.equal(CLASS);
        expect(dom.className).to.be.equal(CLASS);
        expect(dom.tagName).to.be.equal(TAG);
        expect(dom.innerHTML).to.be.equal(CONTENT);
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
        expect(getClientHeightByDom(document.body)).to.be.an('number');
        expect(getClientHeightByDom(dom)).to.be.above(INSURANCE_HEIGHT);
    });
    
    it('元素的高度', () => {
        expect(getClientHeightByDom(dom)).to.be.an('number');
        expect(getClientHeightByDom(dom)).to.be.above(INSURANCE_HEIGHT);
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

        expect(res).to.be.equal(parent);
    });
    
    it('正常单重命名空间挂载', () => {
        const res = namespace(parent, NAMESPACE_STR, target);

        expect(res).to.be.equal(target);
        expect(parent[NAMESPACE_STR]).to.be.equal(target);
    });
    
    it('正常多重命名空间挂载', () => {
        const res = namespace(parent, NAMESPACE_STR_MORE, target);

        expect(res).to.be.equal(target);
    });
});