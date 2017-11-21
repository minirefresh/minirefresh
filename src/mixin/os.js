/**
 * 加入系统判断功能
 */
export default function osMixin(hybrid) {
    const hybridJs = hybrid;
    const detect = function detect(ua) {
        this.os = {};
        
        const android = ua.match(/(Android);?[\s/]+([\d.]+)?/);

        if (android) {
            this.os.android = true;
            this.os.version = android[2];
            this.os.isBadAndroid = !(/Chrome\/\d/.test(window.navigator.appVersion));
        }

        const iphone = ua.match(/(iPhone\sOS)\s([\d_]+)/);

        if (iphone) {
            this.os.ios = true;
            this.os.iphone = true;
            this.os.version = iphone[2].replace(/_/g, '.');
        }

        const ipad = ua.match(/(iPad).*OS\s([\d_]+)/);

        if (ipad) {
            this.os.ios = true;
            this.os.ipad = true;
            this.os.version = ipad[2].replace(/_/g, '.');
        }
        
        // quickhybrid的容器
        const quick = ua.match(/QuickHybrid/i);

        if (quick) {
            this.os.quick = true;
        }
        
        // epoint的容器
        const ejs = ua.match(/EpointEJS/i);

        if (ejs) {
            this.os.ejs = true;
        }

        const dd = ua.match(/DingTalk/i);

        if (dd) {
            this.os.dd = true;
        }

        // 如果ejs和钉钉以及quick都不是，则默认为h5
        if (!ejs && !dd && !quick) {
            this.os.h5 = true;
        }
    };

    detect.call(hybridJs, navigator.userAgent);
}