export function setNavigatorProp(name, value) {
    if (window.navigator[name] !== value) {
        const prop = {
            get: () => value,
        };

        try {
            Object.defineProperty(window.navigator, name, prop);
        } catch (e) {
            const newObj = {};

            newObj[name] = prop;

            window.navigator = Object.create(navigator, newObj);
        }
    }
}

/**
 * hack修改userAgent，只用在单元测试中
 * @param {Object} userAgent
 * navigator.userAgent是只读，需要hack才能临时修改
 */
export function setUserAgent(userAgent) {
    setNavigatorProp('userAgent', userAgent);
}

export function setAppVersion(appVersion) {
    setNavigatorProp('appVersion', appVersion);
}