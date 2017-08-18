/**
 * minirefresh的type1皮肤
 */
(function(innerUtil) {

    var defaultSetting = {

    };

    var MiniRefreshSkin = MiniRefresh.extend({
        sss:'111'
    });
    
    // 挂载皮肤，这样多个皮肤可以并存
    innerUtil.namespace('skin.type1', MiniRefreshSkin);
    
    // 覆盖全局对象，使的全局对象只会指向一个最新的皮肤
    window.MiniRefresh = MiniRefreshSkin;
})(MiniRefreshTools);