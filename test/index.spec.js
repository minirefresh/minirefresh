//var expect = require('chai').expect;
import {expect} from "chai";
import {isNum, isNum2} from "../src/index";

describe("测试", () => {
  it("hello", () => {
    expect('hello').to.be.equal('hello');
  });
  
  it('isNum() should work fine.', () => {
    expect(isNum(1)).to.be.equal(true);
    expect(isNum('1')).to.be.equal(false);
    expect(isNum2('2')).to.be.equal(true);
  });
});