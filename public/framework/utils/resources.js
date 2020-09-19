define('framework/utils/resources', ['framework/base'], function () {

    var loadedAssets = {}, absolutePattern = /^(https?|file|ftps?|mailto|javascript|data:image\/[^;]{2,9};):/i;

    FW.getUrl = function (uri, local) {

        local = local !== false;


        if (!uri) {
            return '';
        }

        if (FW.isAbsoluteUrl(uri)) {
            return uri;
        }
        uri = FW.config.contextPath + (FW.config.servletPath || '') + uri;
        if (!local && FW.config.resourceDomain) {
            uri = FW.config.resourceDomain + uri;
        }

        return uri;
    };

    FW.getAssets = function (path) {

        if (FW.isAbsoluteUrl(path)) {
            return path;
        }

        var assetsPath = FW.config.assetsPath, url = '';

        if (FW.config.includeContext) {
            url = FW.config.contextPath;

        }

        if (assetsPath && assetsPath.length > 0) {

            url += assetsPath;
        }

        url += '/';
        url += path;

        if (FW.config.resourceDomain) {
            url = FW.config.resourceDomain + url;
        }

        return url;

    };

    FW.loadJs = function (uri, fn) {

        var script = document.createElement("script");
        script.type = "text/javascript";

        if (script.readyState) {//IE
            script.onreadystatechange = function () {
                if (script.readyState == "loaded" || script.readyState == "complete") {
                    script.onreadystatechange = null;
                    fn.call();
                }
            };
        } else {//Others
            script.onload = fn;
        }

        script.src = uri;
        document.getElementsByTagName("head")[0].appendChild(script);

    };

    FW.loadCss = function (uri, fn) {
        var fileref = document.createElement("link");
        fileref.setAttribute("rel", "stylesheet");
        fileref.setAttribute("type", "text/css");
        fileref.setAttribute("href", uri);
        document.getElementsByTagName("head")[0].appendChild(fileref);
        fn.call();
    };

    FW.getResource = function (uri, opts) {

        if (!uri) {
            return '';
        }

        if (!FW.isAbsoluteUrl(uri)) {
            uri = FW.config.resources[uri];
        }

        if (!uri) {
            return '';
        }

        if (opts && opts.length > 0) {
            var dpi, i, length = opts.length, opt;

            for (i = 0; i < length; i++) {
                opt = opts[i];
                dpi = opt.dpi;
                if (window.devicePixelRatio >= dpi) {
                    return FW.getResource(opt.url);
                }
            }

        }
        return uri;

    };

    FW.isAbsoluteUrl = function (url) {

        if (!url) {
            return false;
        }

        return absolutePattern.test(url);
    };


    var cache =

    FW.Resource = {

        checkVersion : function(){

            if (!cache || !localStorage) {
                loadModulesMapping(modulesUrl, undefined, undefined, cb);
                return;
            }

            var key = appId + '-cache', storedKey = localStorage.getItem(key);
            var xhr = new (window.XMLHttpRequest || ActiveXObject)('Microsoft.XMLHTTP');
            xhr.onreadystatechange = function () {
                if (this.readyState == 4) {
                    var result = this.responseText;
                    if (result === storedKey) {
                        var cached = localStorage.getItem('modulesConfig');

                        if (cached) {
                            cached = JSON.parse(cached);
                            modulesConfig = cached;

                            cb();
                        } else {

                            loadModulesMapping(modulesUrl, key, result, cb);
                        }


                    } else {



                        top

                        loadModulesMapping(modulesUrl, key, result, cb);
                    }
                }
            };
            xhr.open('GET', url + '?appId=' + appId + '&' + Math.random(), true);

            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.send();


        },



    };
});
