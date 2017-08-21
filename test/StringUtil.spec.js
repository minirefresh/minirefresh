import {expect} from "chai";
import {StringUtil} from "../src/StringUtil.js";

let Util = {
    string: StringUtil
};

describe('字符串正则校验', function() {
    it('isNum（是否是纯数字）', function() {
        expect(Util.string.isNum()).to.be.equal(false);
        expect(Util.string.isNum('1234')).to.be.equal(true);
        expect(Util.string.isNum('1s34')).to.be.equal(false);
    });

    it('isPhoneNum（是否是手机号码）', function() {
        expect(Util.string.isPhoneNum('18267890876')).to.be.equal(true);
        expect(Util.string.isPhoneNum('8618267890876')).to.be.equal(true);
        expect(Util.string.isPhoneNum('11267890876')).to.be.equal(false);
        expect(Util.string.isPhoneNum('05062322683')).to.be.equal(false);
    });

    it('isTelNum（是否是座机号码）', function() {
        expect(Util.string.isTelNum('18267890876')).to.be.equal(true);
        expect(Util.string.isTelNum('8618267890876')).to.be.equal(true);
        expect(Util.string.isTelNum('11267890876')).to.be.equal(false);
        expect(Util.string.isTelNum('05062322683')).to.be.equal(true);
        expect(Util.string.isTelNum('050-62322-683')).to.be.equal(true);
    });

    it('isEmail（是否是合法的email）', function() {
        expect(Util.string.isEmail('abcd_s.ddf.ff-sss@vip.qq.com')).to.be.equal(true);
        expect(Util.string.isEmail('abc@qq.com')).to.be.equal(true);
        expect(Util.string.isEmail('abc@.com')).to.be.equal(false);
        expect(Util.string.isEmail('-abc@qq.com')).to.be.equal(false);
        expect(Util.string.isEmail('abc.@qq.com')).to.be.equal(false);
        expect(Util.string.isEmail('ab-.c@qq.com')).to.be.equal(false);
        expect(Util.string.isEmail('abc@qq.com1')).to.be.equal(true);
        expect(Util.string.isEmail('abc@qq.com11')).to.be.equal(false);
        expect(Util.string.isEmail('abc@qq11111.com')).to.be.equal(true);
    });

    it('isExternalUrl（是否是外部url）', function() {
        expect(Util.string.isExternalUrl('http://app.epoint.com.cn/ejs/')).to.be.equal(true);
        expect(Util.string.isExternalUrl('https://app.epoint.com.cn/ejs/')).to.be.equal(true);
        expect(Util.string.isExternalUrl('ftp://app.epoint.com.cn/')).to.be.equal(true);
        expect(Util.string.isExternalUrl('//app.epoint.com.cn/')).to.be.equal(true);

        expect(Util.string.isExternalUrl('page/html/api.html')).to.be.equal(false);
        expect(Util.string.isExternalUrl('./page/html/api.html')).to.be.equal(false);
        expect(Util.string.isExternalUrl('../page/html/api.html')).to.be.equal(false);
    });

    it('excludeSpecial（过滤特殊字符）', function() {
        var test = "<>?:？》《《《，<><<<<><<<<<<<<|\\\\}}{{{{{PPOTWWERTYUIOSDFGHJKLXCVBNM<)(887676555433222!!@@@##$$%%<<>>??????;;;;''’‘；，。。、。。、090-=-098776654112234567@@##￥%……&&**（（（）））））））！@#￥%……&*（））（&%￥￥#￥%……&**！@~~！！@#￥%……&*（：“：”；“”：：“《》》？？{}哈哈哈哈()~!@@##$%^^&&**(())___+[`!@#$%^&*()_!@#$%^&*()_!@#$%^&*()_+~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]";

        var result = 'PPOTWWERTYUIOSDFGHJKLXCVBNM887676555433222090--098776654112234567哈哈哈哈______';

        expect(Util.string.excludeSpecial(test)).to.be.equal(result);

        var test2 = "sdfffjh@s#sk%jn";

        var result2 = 'sdfffjhssk%jn';

        expect(Util.string.excludeSpecial(test2, /[@#]/g)).to.be.equal(result2);
        
        expect(Util.string.excludeSpecial('')).to.be.equal('');
    });
});

describe('身份证相关校验', function() {
    it('validate（身份证是否合法）', function() {
        expect(Util.string.idcard.validate('440901197502108337')).to.be.equal(true);
        expect(Util.string.idcard.validate('44090119750210833x')).to.be.equal(false);
        // 篡改了一位
        expect(Util.string.idcard.validate('440901196502108337')).to.be.equal(false);
        

        expect(Util.string.idcard.validate('320311770706001')).to.be.equal(false);
        // 允许15位
        expect(Util.string.idcard.validate('320311770706001', true)).to.be.equal(true);
        
        // 年月日丢失测试
        expect(Util.string.idcard.validate('3203117s0706001', true)).to.be.equal(false);
    });
    
    it('birthExtract（出生日期提取）', function() {
        expect(Util.string.idcard.birthExtract('440901197502108337')).to.be.equal('1975-02-10');
        expect(Util.string.idcard.birthExtract('320311770706001')).to.be.equal('');
        // 允许15位
        expect(Util.string.idcard.birthExtract('320311770706001', true)).to.be.equal('1977-07-06');
        
        expect(Util.string.idcard.birthExtract('32031177070600111')).to.be.equal('');
    });
    
    it('birthEncode（出生日期隐藏）', function() {
        expect(Util.string.idcard.birthEncode('440901197502108337')).to.be.equal('440901********8337');
        expect(Util.string.idcard.birthEncode('320311770706001')).to.be.equal('320311770706001');
        // 允许15位
        expect(Util.string.idcard.birthEncode('320311770706001', true)).to.be.equal('320311******001');
    });
});