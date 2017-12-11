const BaseTheme = MiniRefreshTools.theme.defaults;
const version = MiniRefreshTools.version;
const extend = MiniRefreshTools.extend;
const namespace = MiniRefreshTools.namespace;

const defaultSetting = {
    down: {
        isLock: true,
    },
    // 强行使用body滚动
    isUseBodyScroll: true,
};

class MiniRefreshTheme extends BaseTheme {
    constructor(options) {
        const newOptions = extend(true, {}, defaultSetting, options);

        super(newOptions);
    }

    /**
     * 重写下拉刷新初始化
     */
    _initDownWrap() {
        if (this.os.dd) {
            // 钉钉环境
            dd.ui.pullToRefresh.enable({
                onSuccess: () => {
                    this.options.down.callback && this.options.down.callback();
                },
                onFail: () => {
                    dd.ui.pullToRefresh.stop();
                },
            });
        } else if (this.os.ejs) {
            // ejs环境
            if (ejs.nativeUI) {
                // 2.x
                ejs.nativeUI.pullToRefresh.enable(() => {
                    this.options.down.callback && this.options.down.callback();
                });
            } else if (ejs.ui) {
                // 3.x
                ejs.ui.pullToRefresh.enable({
                    success: () => {
                        this.options.down.callback && this.options.down.callback();
                    },
                    error: () => {
                        ejs.ui.pullToRefresh.stop();
                    },
                });
            }
        }
    }

    endDownLoading() {
        if (this.os.dd) {
            dd.ui.pullToRefresh.stop();
        } else if (this.os.ejs) {
            if (ejs.nativeUI) {
                ejs.nativeUI.pullToRefresh.stop();
            } else {
                ejs.ui.pullToRefresh.stop();
            }
        }

        // 同时恢复上拉加载的状态，注意，此时没有传isShowUpLoading，所以这个值不会生效
        if (this.options.down.isAutoResetUpLoading) {
            this.resetUpLoading();
        }
    }
    // 将所有下拉相关都重写
    _pullHook() {}
    _downLoaingHook() {}
    _downLoaingSuccessHook() {}
    _downLoaingEndHook() {}
    _cancelLoaingHook() {}
    _lockDownLoadingHook() {}
}

MiniRefreshTheme.sign = 'native';
MiniRefreshTheme.version = version;
namespace('theme.natives', MiniRefreshTheme);

export default MiniRefreshTheme;