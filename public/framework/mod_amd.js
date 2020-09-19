(function () {
    var cssInline = false, require, define, modulesMap = {}, exports = {}, appId, cache, modulesConfig = {}, comboPath, loadedResource = {}, maxUrlLength = 3000, localStorage = window.localStorage;


    define = function (id, deps, factory) {

        if (typeof id === 'function') {
            factory = id;
            deps = [];
            id = undefined;
        } else if (typeof deps === 'function') {
            factory = deps;
            deps = [];

        }

        if (!deps) {
            deps = [];
        }

        if (id) {
            modulesMap[id] = {
                deps: deps,
                factory: factory
            };

        } else if (!modulesMap.hasOwnProperty(id)) {

            factory.call(window, window);

        }

    };

    require = function (id, cb) {
        var toLoad;

        if (typeof id === 'object') {
            toLoad = id;
        } else {
            toLoad = [id];
        }

        var i, result = [];
        for (i = 0; i < toLoad.length; i++) {
            result.push(doRequire(toLoad[i]));
        }

        if (cb && typeof cb === 'function') {
            return cb.apply(this, result);
        } else {

            if (result.length >= 1) {

                return result[0];
            }

        }

    };

    var doRequire = function (id) {

        var exported = exports[id];

        if (exported) {
            return exported.result;
        }

        if (id === 'require' || id === 'exports' || id === 'module') {

            return require;
        }

        var mod = modulesMap[id];

        if (!mod) {
            return;
        }

        loadedResource[id] = true;
        var deps = mod.deps, applyArgs = [], i;

        for (i = 0; i < deps.length; i++) {
            applyArgs.push(require(deps[i]));
        }

        exported = mod.factory.apply(this, applyArgs);

        exports[id] = {
            result: exported
        };

        return exported;
    };

    var asyncRequire = function (id, cb) {

        var toLoad;

        if (typeof id === 'object') {
            toLoad = id;
        } else {
            toLoad = [id];
        }

        var urls = loadModuleUrls(toLoad);

        cb = (function (id, cb) {
            return function () {
                require(id, cb);
            };
        })(toLoad, cb);
        loadResource(urls, cb);

    };

    function loadModuleUrls(modules) {
        var i, jsUrls = [], cssUrls = [], jsUrl = [], cssUrl = [], currentJsLength = 0, currentCssLength = 0, firstJs = true, firstCss = true, mod;

        modules = findAllModules(modules, {});


        for (i = 0; i < modules.length; i++) {
            mod = modules[i];

            if (mod.uri.indexOf('.js') !== -1) {
                if (firstJs) {
                    firstJs = false;
                    jsUrl.push(comboPath);

                } else {
                    jsUrl.push('~');
                }
                if (mod.uri.length + currentJsLength <= maxUrlLength) {
                    jsUrl.push(mod.uri);

                } else {
                    jsUrls.push({
                        js: true,
                        url: jsUrl.join('')
                    });
                    jsUrl = [];

                    currentJsLength = 0;
                    jsUrl.push(comboPath);

                    jsUrl.push(mod.uri);
                }
                currentJsLength += mod.uri.length;


            } else {

                if (firstCss) {
                    firstCss = false;
                    cssUrl.push(comboPath);


                } else {
                    cssUrl.push('~');
                }
                if (mod.uri.length + currentCssLength <= maxUrlLength) {
                    cssUrl.push(mod.uri);
                } else {
                    cssUrls.push({
                        js: false,
                        url: cssUrl.join('')
                    });
                    cssUrl = [];
                    cssUrl.push(comboPath);

                    cssUrl.push(mod.uri);
                    currentCssLength = 0;
                }

                currentCssLength += mod.uri.length;

            }

        }

        if (cssUrl.length > 0) {
            cssUrls.push({
                js: false,
                url: cssUrl.join('')
            });
        }


        if (jsUrl.length > 0) {
            jsUrls.push({
                js: true,
                url: jsUrl.join('')
            });
        }


        return cssUrls.concat(jsUrls);

    }

    function loadResource(urls, cb) {

        var i, wrap = cb;

        for (i = urls.length - 1; i >= 0; i--) {
            wrap = (function (url, cb) {

                return function () {
                    if (url.js) {
                        loadJs(url.url, cb);
                    } else {
                        loadCss(url.url, cb);
                    }

                };
            })(urls[i], wrap);
        }

        wrap();

    }

    function findAllModules(modules, visited) {

        var i, mod, result = [], deps, j;

        for (i = 0; i < modules.length; i++) {

            if (visited[modules[i]] === true) {
                continue;

            }

            if (loadedResource[modules[i]] === true) {
                continue;
            }
            mod = modulesConfig[modules[i]];

            if (!mod) {
                throw 'module config for ' + modules[i] + ' not found!';
            }

            deps = mod.deps;

            if (deps && deps.length > 0) {

                for (j = 0; j < deps.length; j++) {
                    arrayAddAll(result, findAllModules([deps[j]], visited));
                }
            }

            result.push(mod);
            visited[modules[i]] = true;

        }

        return result;

    }

    function arrayAddAll(source, toAdd) {

        var i;

        for (i = 0; i < toAdd.length; i++) {
            source.push(toAdd[i]);
        }
    }

    var head = document.head, doc = document;
    var loadJs = function (url, cb) {
        var cached;
        if (cache) {
            cached = localStorage.getItem(url);
            if (cached) {

                window.eval(cached);

                cb();

                return;
            }
        }

        if (cache) {
            ajax(url, function (text) {
                window.eval(text);
                var cacheKey = url;
                try {
                    localStorage.removeItem(cacheKey);
                    localStorage.setItem(cacheKey, text);
                } catch (err) {
                }
                cb();

            });
        } else {

            var wrap = (function (url, cb) {

                var loaded = false;
                return function () {

                    if (!loaded && (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete')) {
                        loaded = true;
                        cb();
                    }
                };

            })(url, cb), onerror = function () {
                throw new Error('Can\'t load ' + url);
            };
            var script = document.createElement('script');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('crossorigin', 'anonymous');
            script.setAttribute('async', '');
            script.onload = script.onreadystatechange = wrap;
            script.onerror = onerror;
            script.setAttribute('src', url);

            head.appendChild(script);
        }


    };

    function ajax(url, cb) {
        var xhr = new (window.XMLHttpRequest || ActiveXObject)('Microsoft.XMLHTTP');
        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {
                cb(this.responseText);
            }
        };
        xhr.open('GET', url, true);

        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.send();
    }

    var loadCss = function (url, cb) {


        var cached, cacheKey;


        if (cache) {
            cacheKey = url;
            cached = localStorage.getItem(cacheKey);
            if (cached) {
                var style = document.createElement('style');
                head.appendChild(style);
                if (style.styleSheet) {
                    style.styleSheet.cssText = cached;
                } else {
                    style.insertBefore(doc.createTextNode(cached), style.firstChild);
                }

                cb();
                return;
            }
        }


        if (cssInline) {

            var wrap = (function (url, cacheKey, cb) {

                return function (text) {


                    var s = document.createElement('style');
                    s.setAttribute('type', 'text/css');
                    if (s.styleSheet) {   // IE
                        s.styleSheet.cssText = text;
                    } else {                // the world
                        s.appendChild(document.createTextNode(text));
                    }
                    head.appendChild(s);

                    if (cache) {
                        if (cacheKey) {
                            try {
                                localStorage.removeItem(cacheKey);
                                localStorage.setItem(cacheKey, text);
                            } catch (err) {

                            }
                        }
                    }
                    cb();
                };

            })(url, cacheKey, cb);

            ajax(url, wrap);

        } else {
            var link = document.createElement("link");
            link.setAttribute("rel", "stylesheet");
            link.setAttribute("type", "text/css");
            link.setAttribute("href", url);
            head.appendChild(link);
            cb();
        }


    };


    window.configureModules = function (config) {
        comboPath = config.comboPath;
        cache = config.cache && localStorage;

        cssInline = config.cssInline === true;

    };


    var loadModulesMapping = function (url, key, value, cb) {

        ajax(url + '?' + Math.random(), (function (key, value, cb) {
            return function (text) {
                modulesConfig = JSON.parse(text);


                if (value === null || value === undefined) {
                    localStorage.removeItem(key);
                } else {
                    try {
                        localStorage.setItem(key, value);
                    } catch (err) {
                        localStorage.clear();
                        localStorage.setItem(key, value);

                    }

                }

                if (cache) {
                    try {
                        localStorage.setItem('modulesConfig', text);
                    } catch (err) {

                    }
                }
                cb();
            };
        })(key, value, cb));

    };


    var checkVersion = function (appId, url, modulesUrl, cb) {


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

                    loadModulesMapping(modulesUrl, key, result, cb);
                }
            }
        };
        xhr.open('GET', url + '?appId=' + appId + '&' + Math.random(), true);

        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.send();
    };


    window.require = require;
    window.define = define;
    window.asyncRequire = asyncRequire;
    window.checkVersion = checkVersion;

    window.__uri = function (uri) {
        return uri;
    };


})();
