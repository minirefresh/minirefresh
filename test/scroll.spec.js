import { expect } from 'chai';
import Scroll from '../src/core/scroll';

const defaultSetting = {
    // 下拉有关
    down: {
        // 默认没有锁定，可以通过API动态设置
        isLock: false,
        // 是否自动下拉刷新
        isAuto: false,
        // 设置isAuto=true时生效，是否在初始化的下拉刷新触发事件中显示动画，如果是false，初始化的加载只会触发回调，不会触发动画
        isAllowAutoLoading: true,
        // 是否不管任何情况下都能触发下拉刷新，为false的话当上拉时不会触发下拉
        isAways: false,
        // 是否scroll在下拉时会进行移动(css3)，通过关闭它可以实现自定义动画
        isScrollTranslate: true,
        // 下拉要大于多少长度后再下拉刷新
        offset: 75,
        // 阻尼系数，下拉小于offset时的阻尼系数，值越接近0,高度变化越小,表现为越往下越难拉
        dampRateBegin: 1,
        // 阻尼系数，下拉的距离大于offset时,改变下拉区域高度比例;值越接近0,高度变化越小,表现为越往下越难拉
        dampRate: 0.3,
        // 回弹动画时间
        bounceTime: 300,
    },
    // 上拉有关
    up: {
        // 默认没有锁定，可以通过API动态设置
        isLock: false,
        // 是否自动上拉加载-初始化是是否自动
        isAuto: true,
        // 是否默认显示上拉进度条，可以通过API改变
        isShowUpLoading: true,
        // 距离底部高度(到达该高度即触发)
        offset: 100,
        loadFull: {
            // 开启配置后，只要没满屏幕，就会自动加载
            isEnable: true,
            delay: 300,
        },
    },
    // 是否锁定横向滑动，如果锁定则原生滚动条无法滑动
    isLockX: true,
    // 是否使用body对象的scroll而不是minirefresh-scroll对象的scroll
    // 开启后一个页面只能有一个下拉刷新，否则会有冲突
    isUseBodyScroll: false,
};

const container = document.createElement('div');
const content = document.createElement('div');

content.innerHTML = '纯属测试';
container.appendChild(content);
document.body.appendChild(container);

const minirefresh = {};

minirefresh.options = defaultSetting;
minirefresh.container = container;
// scroll的dom-wrapper下的第一个节点，作用是down动画时的操作
minirefresh.contentWrap = minirefresh.container.children[0];
minirefresh.scrollWrap = minirefresh.options.isUseBodyScroll
    ? document.body
    : minirefresh.container;

describe('创建Scroll', () => {
    beforeEach(() => {
        minirefresh.options = defaultSetting;
    });
    
    it('监听initScroll', (done) => {
        const scroll = new Scroll(minirefresh);
        
        scroll.on('initScroll', () => {
            done();
        });
    });
    
    it('创建自动下拉，带动画', (done) => {
        minirefresh.options.down.isAuto = true;
     
        const scroll = new Scroll(minirefresh);
        
        scroll.on('downLoading', () => {
            done();
        });
    });
    
    it('创建自动下拉，带动画，但不允许移动', (done) => {
        minirefresh.options.down.isAuto = true;
        minirefresh.options.down.isScrollTranslate = false;
        
        const scroll = new Scroll(minirefresh);
        
        scroll.on('downLoading', () => {
            done();
        });
    });
    
    it('创建自动下拉，带动画，hook合法', (done) => {
        minirefresh.options.down.isAuto = true;
        
        const scroll = new Scroll(minirefresh);
        
        scroll.hook('beforeDownLoading', () => true);
        
        scroll.on('downLoading', () => {
            done();
        });
    });
    
    it('创建自动下拉，不带动画', (done) => {
        minirefresh.options.down.isAuto = true;
        minirefresh.options.down.isAllowAutoLoading = false;
        
        const scroll = new Scroll(minirefresh);
        
        scroll.on('downLoading', () => {
            done();
        });
    });
    
    it('创建自动上拉', (done) => {
        minirefresh.options.down.isAuto = false;
        minirefresh.options.up.isAuto = true;
        
        const scroll = new Scroll(minirefresh);
        
        scroll.on('upLoading', () => {
            done();
        });
    });
});

describe('上拉逻辑', () => {
    let scroll;
    
    beforeEach(() => {
        minirefresh.options = defaultSetting;
        minirefresh.options.up.isAuto = false;
        scroll = new Scroll(minirefresh);
    });
    
    it('主动触发上拉', (done) => {
        scroll.on('upLoading', () => {
            done();
        });
        scroll.triggerUpLoading();
    });
    
    it('主动触发并结束上拉，可以继续上拉', (done) => {
        scroll.on('upLoading', () => {
            scroll.endUpLoading();
            expect(scroll.isFinishUp).to.be.equal(false);
            done();
        });
        scroll.triggerUpLoading();
    });
    
    it('上拉结束为没有更多数据', (done) => {
        scroll.on('upLoading', () => {
            scroll.endUpLoading(true);
            expect(scroll.isFinishUp).to.be.equal(true);
            done();
        });
        scroll.triggerUpLoading();
    });
    
    it('重置上拉', (done) => {
        scroll.on('resetUpLoading', () => {
            done();
        });
        scroll.triggerUpLoading();
        scroll.endUpLoading(true);
        scroll.resetUpLoading();
    });
    
    it('loadFull检测', (done) => {
        scroll.options.up.loadFull.isEnable = true;
        scroll.options.up.loadFull.delay = 0;
        
        let count = 0;
        
        scroll.on('upLoading', () => {
            count += 1;
            // 第一次是trigger的，第二次才是loadFull的
            if (count === 2) {
                // 防止重复无限加载
                scroll.options.up.loadFull.isEnable = false;
                done();
            }
        });
        scroll.triggerUpLoading();
        scroll.scrollWrap.scrollTop = '10';
        
        // 强行改变高度,这样才能在测试环境中让scrollHeight和clientHeight一样
        scroll.scrollWrap.style.height = '40px';
        scroll.endUpLoading();
    });
});