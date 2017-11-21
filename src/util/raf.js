const DEFAULT_INTERVAL = 1000 / 60;

// 立即执行
export const requestAnimationFrame = (() => (
    window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.oRequestAnimationFrame
    // if all else fails, use setTimeout
    || function requestAnimationFrameTimeOut(callback) {
        // make interval as precise as possible.
        return window.setTimeout(callback, (callback.interval || DEFAULT_INTERVAL) / 2);
    }))();

export const cancelAnimationFrame = (() => (
    window.cancelAnimationFrame
    || window.webkitCancelAnimationFrame
    || window.mozCancelAnimationFrame
    || window.oCancelAnimationFrame
    // if all else fails, use setTimeout
    || function cancelAnimationFrameClearTimeOut(id) {
        window.clearTimeout(id);
    }))();
