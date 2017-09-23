const DEFAULT_INTERVAL = 1000 / 60;

export function requestAnimationFrame() {
    return window.requestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.oRequestAnimationFrame
        // if all else fails, use setTimeout
        || function requestAnimationFrameTimeOut(callback) {
            // make interval as precise as possible.
            return window.setTimeout(callback, (callback.interval || DEFAULT_INTERVAL) / 2);
        };
}

export function cancelAnimationFrame() {
    return window.cancelAnimationFrame
        || window.webkitCancelAnimationFrame
        || window.mozCancelAnimationFrame
        || window.oCancelAnimationFrame
        // if all else fails, use setTimeout
        || function cancelAnimationFrameClearTimeOut(id) {
            window.clearTimeout(id);
        };
}
