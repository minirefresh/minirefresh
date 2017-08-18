(function() {
    // 当前模式，默认是all，加载所有模块
    var TEST_MODULE_KEY = 'TEST_MODULE_KEY';
    var DEFAULT_MODULE = 'all';

    var currModule;

    function initPage() {
        initParams();
        ajaxTests().then(function(response) {
            // 额外处理options
            var moduleSelect = document.getElementById('module-select');

            for (var key in response) {
                var op = document.createElement("option");
                op.value = key;
                op.text = key;

                if (key === currModule) {
                    op.selected = true;
                }
                moduleSelect.add(op);
            }

            return response;
        }).then(function(response) {
            var testFiles = [];

            // 获取到的测试文件              
            if (currModule == DEFAULT_MODULE) {

                // 加载所有模块
                for (var key in response) {

                    if (response[key]) {
                        testFiles = testFiles.concat(response[key]);
                    }
                }
            } else {
                testFiles = testFiles.concat(response[currModule] || []);
            }

            var unitFiles = [];

            // 自动根据文件后缀补全unit中的测试文件  只会补全非unit开头的
            for (var i = 0, len = testFiles.length; i < len; i++) {
                var fileName = testFiles[i].match(/[^\/]+$/);
                fileName && !(/.*\/unit\/.*/.test(testFiles[i])) && unitFiles.push('../unit/' + fileName[0]);
            }

            testFiles = testFiles.concat(unitFiles);

            return testFiles;
        }).then(function(testFiles) {
            //console.log(testFiles);
            Util.loadJs(testFiles, function() {
                console.log("success");
                mocha.run();
            });
        }).catch(function(error) {
            console.error(error);
            alert('初始化单元测试错误');
        });
        initListeners();

    }

    function initParams() {
        currModule = localStorage.getItem(TEST_MODULE_KEY) || DEFAULT_MODULE;
        window.expect = chai.expect;
    }

    function initListeners() {
        document.getElementById('module-select').addEventListener('change', function(e) {
            var index = this.selectedIndex;

            var value = this.options[index].value;

            localStorage.setItem(TEST_MODULE_KEY, value || DEFAULT_MODULE);

            window.location.reload();
        });
    }

    function ajaxTests() {
        return Util.ajax({
            url: './test.json',
            type: 'GET',
            error: null
        }).then(function(response) {
            return response;
        }).catch(function(error) {
            throw error;
        })
    }

    initPage();
})();