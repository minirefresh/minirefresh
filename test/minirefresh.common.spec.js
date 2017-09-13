import {expect} from 'chai';
// 引入核心工具类，帮助全局变量上
import MiniRefreshTools from '../src/minirefresh.js';

describe('extend', function() {
    let obj1,
        obj2,
        obj3;
        
    before(function() {
        // 在本区块的所有测试用例之前执行
        obj1 = {
            company: 'epoint',
            product: {
                ejs: 'ejs混合开发方案'
            }
        };

        obj2 = {
            company: 'epoint2',
            city: 'suzhou',
            product: {
                m7: 'm7移动框架'
            }
        };

        obj3 = {
            name: 'zhangsan',
            product: {
                group: 'mobile',
                m7: 'm7移动框架2'
            }
        };
    });

    it('拓展单个（浅层拓展）', function() {
        let result = MiniRefreshTools.extend({}, obj1, obj2);

        expect(result).to.have.deep.property('company', obj2.company);
        expect(result).to.have.deep.property('product', obj2.product);

    });

    it('拓展多个（浅层拓展）', function() {
        let result = MiniRefreshTools.extend({}, obj1, obj2, obj3);

        expect(result).to.have.deep.property('company', obj2.company);
        expect(result).to.have.deep.property('product', obj3.product);
        expect(result).to.have.deep.property('name', obj3.name);
    });

    it('拓展多个（递归拓展）', function() {
        let result = MiniRefreshTools.extend(true, {}, obj1, obj2, obj3);

        expect(result).to.have.deep.property('company', obj2.company);
        expect(result).to.have.deep.nested.property('product.ejs', obj1.product.ejs);
        expect(result).to.have.deep.nested.property('product.m7', obj3.product.m7);
        expect(result).to.have.deep.nested.property('product.group', obj3.product.group);
    });
});