const rollup = require('rollup');
const build = require('./build.js');

const buildOptions = build.buildOptions;
const watcher = rollup.watch(buildOptions);

watcher.on('event', (event) => {
    // 监听内部自动会build，无需手动build
    // 如果无法自动build，很可能是传入配置错误
    // 譬如输出或输入文件的format没有填写
    console.log(`code${event.code}`);
});