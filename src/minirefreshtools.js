import * as lang from './util/lang';
import Core from './core/core';

const MiniRefreshTools = {};

Object.keys(lang).forEach((name) => {
    MiniRefreshTools[name] = lang[name];
});

// namespace的特殊把绑定
MiniRefreshTools.namespace = (namespaceStr, target) => {
    lang.namespace(MiniRefreshTools, namespaceStr, target);
};

MiniRefreshTools.Core = Core;
MiniRefreshTools.version = '2.0.0';

// 防止主题和核心一起，并且require模式中，无法全局变量的情况
window.MiniRefreshTools = MiniRefreshTools;

export default MiniRefreshTools;