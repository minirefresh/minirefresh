/**
 * 作者: 戴荔春
 * 创建时间: 2017/07/25
 * 版本: [1.0, 2017/07/25 ]
 * 版权: 江苏国泰新点软件有限公司
 * 描述:  promise实现 ES6标准
 * 支持标准的then catch all race resolve reject
 * 拓展了 done finally delay try stop
 * 基于标准: https://promisesaplus.com/
 * 参考: https://zhuanlan.zhihu.com/p/21834559
 * 测试工具（测试是否符合标准）: https://github.com/promises-aplus/promises-tests
 */
var Promise = (function() {
    /**
     * 三个状态
     * 这里统一采用 FULFILLED与REJECTED
     */
    var PENDING = undefined,
        FULFILLED = 1,
        REJECTED = 2;

    var isFunction = function(obj) {
        return 'function' === typeof obj;
    };
    var isArray = function(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    };

    /**
     * 只允许 PENING状态进行转换
     * @param {Object} promise
     * @param {Object} status
     * @param {Object} value
     */
    var transition = function(promise, status, value) {
        if (promise._status !== PENDING) {
            return;
        }
        // 所以的执行都是异步调用，保证then是先执行的
        setTimeout(function() {
            promise._status = status;
            publish(promise, value);
        });
    };

    /**
     * 状态转换后，执行回调池中的回调
     * @param {Object} promise
     * @param {Object} val
     */
    var publish = function(promise, val) {
        var fn,
            st = promise._status === FULFILLED,
            queue = promise[st ? '_resolves' : '_rejects'];

        fn = queue && queue.shift();
        while (fn) {
            fn.call(promise, val);
            fn = queue.shift();
        }
        // 记录一个全局状态，用来穿透
        promise[st ? '_value' : '_reason'] = val;
        // 清空回调池
        promise['_resolves'] = undefined;
        promise['_rejects'] = undefined;
    };

    /**
     * 构造promise
     * @param {Function} resolver
     * @constructor
     */
    function Promise(resolver) {
        if (!isFunction(resolver)) {
            throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
        }
        if (!(this instanceof Promise)) {
            return new Promise(resolver);
        }

        var promise = this;
        promise._value;
        promise._reason;
        promise._status = PENDING;
        promise._resolves = [];
        promise._rejects = [];

        var resolve = function(value) {
            if (value instanceof Promise) {
                // 考虑状态转换时 value直接是一个promise对象
                return value.then(resolve, reject)
            }
            transition(promise, FULFILLED, value);
        }
        var reject = function(reason) {
            transition(promise, REJECTED, reason);
        }

        try {
            resolver(resolve, reject);
        } catch (e) {
            reject(e);
        }
    }

    /**
     * 主要用来实现不同Promise的交互
     * 根据x的值来决定promise2的状态(也就是这里的proimse形参)
     * x为`promise2 = promise1.then(onFulfilled, onRejected)`里`onFulfilled/onRejected`的返回值
     * `resolve`和`reject`实际上是`promise2`的`executor`的两个实参，因为很难挂在其它的地方，所以一并传进来。
     * @param {Object} promise
     * @param {Object} x
     * @param {Object} resolve
     * @param {Object} reject
     */
    function resolvePromise(promise, x, resolve, reject) {
        var then,
            thenCalledOrThrow = false;

        if (promise === x) {
            // 标准 2.3.1
            return reject(new TypeError('Chaining cycle detected for promise!'));
        }

        if (x instanceof Promise) {
            // 标准2.3.2

            // 如果x的状态还没有确定，那么它是有可能被一个thenable决定最终状态和值的
            // 所以这里需要做一下处理，而不能一概的以为它会被一个“正常”的值resolve
            if (x._status === PENDING) {
                x.then(function(v) {
                    return resolvePromise(promise, v, resolve, reject);
                }, reject);
            } else {
                // 但如果这个Promise的状态已经确定了，那么它肯定有一个“正常”的值，而不是一个thenable，所以这里直接取它的状态
                x.then(resolve, reject);
            }
            return;
        }

        if ((x !== null) && ((typeof x === 'object') || (isFunction(x)))) {
            // 标准2.3.3
            try {
                // 2.3.3.1 因为x.then有可能是一个getter，这种情况下多次读取就有可能产生副作用
                // 即要判断它的类型，又要调用它，这就是两次读取，所以不要用 isThenable判断
                then = x.then;
                if (isFunction(then)) {
                    // 2.3.3.3
                    then.call(x, function rs(y) {
                        // 2.3.3.3.1
                        if (thenCalledOrThrow) {
                            // 2.3.3.3.3 即这三处谁选执行就以谁的结果为准
                            return;
                        }
                        thenCalledOrThrow = true;
                        // 2.3.3.3.1
                        return resolvePromise(promise, y, resolve, reject);
                    }, function rj(r) {
                        // 2.3.3.3.2
                        if (thenCalledOrThrow) {
                            // 2.3.3.3.3 即这三处谁选执行就以谁的结果为准
                            return;
                        }
                        thenCalledOrThrow = true;
                        return reject(r);
                    })
                } else {
                    // 2.3.3.4
                    return resolve(x);
                }
            } catch (e) {
                // 2.3.3.2
                if (thenCalledOrThrow) {
                    // 2.3.3.3.3 即这三处谁选执行就以谁的结果为准
                    return;
                }
                thenCalledOrThrow = true;
                return reject(e);
            }
        } else {
            // 标准 2.3.4
            return resolve(x);
        }
    }

    Promise.prototype.then = function(onFulfilled, onRejected) {
        // 根据标准，如果then的参数不是function，则我们需要忽略它，此处以如下方式处理，这样处理是做了下值得穿透传递
        onFulfilled = isFunction(onFulfilled) ? onFulfilled : function(value) {
            return value;
        };
        onRejected = isFunction(onRejected) ? onRejected : function(reason) {
            throw reason;
        };

        var promise = this,
            promise2;

        // 每次返回一个promise，保证是可thenable的
        return promise2 = new Promise(function(resolve, reject) {
            function callback(value) {
                // 如果promise1(此处即为this/self)的状态已经确定并且是resolved，我们调用 onFulfilled
                // 因为考虑到有可能throw，所以我们将其包在try/catch块里
                try {
                    var value = onFulfilled(value);
                    resolvePromise(promise2, value, resolve, reject);
                } catch (e) {
                    // 如果出错，以捕获到的错误做为promise2的结果
                    return reject(e);
                }
            }

            function errback(reason) {
                // 注意，如果没有catch，就冒泡，否则，返回一个新的then
                try {
                    reason = onRejected(reason);
                    resolvePromise(promise2, reason, resolve, reject);

                } catch (e) {
                    // 没有catch，就会走到这里
                    return reject(e);
                }

            }
            if (promise._status === PENDING) {
                // 添加时采用同步
                promise._resolves.push(callback);
                promise._rejects.push(errback);
            } else if (promise._status === FULFILLED) {
                setTimeout(function() {
                    // 状态改变后的then操作，立刻执行
                    callback(promise._value);
                });

            } else if (promise._status === REJECTED) {
                setTimeout(function() {
                    errback(promise._reason);
                });
            }
        });

    };

    Promise.prototype.valueOf = function() {
        return this[(promise._status === FULFILLED) ? '_value' : '_reason'];
    };

    Promise.prototype.catch = function(onRejected) {
        return this.then(null, onRejected)
    };

    Promise.prototype.done = function(onFulfilled, onRejected) {
        this.then(onFulfilled, onRejected)
            .catch(function(reason) {
                // 抛出一个全局错误
                setTimeout(function() {
                    throw reason;
                }, 0);
            });
    };
    
    /**
     * 这里实现的finally内部如果有错误，不会抛出来
     * 而是在下一个链式调用时触发 onRejected 如Promise.all里
     * 只有done里的错误才会往外抛
     * 另外finally不会影响原版的状态
     * 另外 then中需要返回才能确保状态传递
     */
    Promise.prototype.finally = function(callback) {
        var Promise = this.constructor;
        return this.then(
            function(value) {
                return Promise.resolve(callback()).then(function() {
                    return value;
                });
            },
            function(reason) {                
                return Promise.resolve(callback()).then(function() {
                    throw reason;
                });
            }
        );
    };

    /**
     * 将参数分数 如([a,b,c]) 变为 (a,b,c)
     * @param {Function} callback
     * @param {Function} onRejected
     */
    Promise.prototype.spread = function(callback) {
        return this.then(function(values) {
            values = isArray(values) ? values : [values];
            
            return callback.apply(null, values);
        });
    }

    Promise.prototype.delay = function(duration) {
        return this.then(function(value) {
            return Promise.delay(duration, value);
        }, function(reason) {
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    reject(reason);
                }, duration);
            })
        })
    };

    Promise.delay = function(duration, value) {
        return Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve(value);
            }, duration);
        })
    };

    Promise.resolve = function(value) {
        return new Promise(function(resolve) {
            resolve(value);
        })
    };

    Promise.reject = function(reason) {
        return new Promise(function(resolve, reject) {
            reject(reason);
        })
    };

    /**
     * 管理同步和异步错误，同步运行的也可用try捕获（不过错误捕获后的代码仍然是在本次循环结尾才会执行）
     */
    Promise.try = function(resolver) {
        return new Promise(function(resolve, reject) {
            resolve(resolver());
        });
    };

    Promise.all = function(promises) {
        if (!isArray(promises)) {
            throw new TypeError('You must pass an array to all.');
        }
        return Promise(function(resolve, reject) {
            var i = 0,
                result = [],
                len = promises.length,
                count = len

            function resolver(index) {
                return function(value) {
                    return resolveAll(index, value);
                };
            }

            function rejecter(reason) {
                return reject(reason);
            }

            function resolveAll(index, value) {
                result[index] = value;
                if (--count == 0) {

                    return resolve(result)
                }
            }

            for (; i < len; i++) {
                Promise.resolve(promises[i]).then(resolver(i), rejecter);
            }
        });
    };

    Promise.race = function(promises) {
        if (!isArray(promises)) {
            throw new TypeError('You must pass an array to race.');
        }
        return Promise(function(resolve, reject) {
            var i = 0,
                len = promises.length;

            function resolver(value) {
                return resolve(value);
            }

            function rejecter(reason) {
                return reject(reason);
            }

            for (; i < len; i++) {
                Promise.resolve(promises[i]).then(resolver, rejecter);
            }
        });
    };

    /**
     * 用来进行测试
     * promises-aplus-tests
     */
    Promise.deferred = function() {
        var dfd = {}
        dfd.promise = new Promise(function(resolve, reject) {
            dfd.resolve = resolve;
            dfd.reject = reject;
        })
        return dfd;
    };

    try {
        // CommonJS compliance
        module.exports = Promise
    } catch (e) {}

    return Promise;
})();

/**
 * stop的实现，重新了then 所以单独提取出来了
 */
(function() {
    //只要外界无法“===”这个对象就可以了
    var STOP_VALUE = {};
    var STOPPER_PROMISE = Promise.resolve(STOP_VALUE);

    Promise.prototype._then = Promise.prototype.then;

    Promise.stop = function(resolver) {
        
        if (typeof resolver === 'function') {
            // 执行stop回调
            setTimeout(function() {
                resolver();
            });
        }
        
        //不是每次返回一个新的Promise，可以节省内存;
        return STOPPER_PROMISE;
    };

    Promise.prototype.then = function(onFulfilled, onRejected) {
        return this._then(function(value) {
            // 考虑catch catch时  onFulfilled为null
            if (value === STOP_VALUE) {
                return STOP_VALUE;
            } else if (typeof onFulfilled === 'function') {
                return onFulfilled(value);
            } else {
                return value;
            }
        }, onRejected);
    };

}());