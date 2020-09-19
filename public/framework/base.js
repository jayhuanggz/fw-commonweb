define('framework/base', [], function () {

    var win = window;
    if (!win.FW) {
        win.FW = {};
    }

    FW.namespace = function (ns) {
        if (!ns || typeof ns !== 'string') {
            throw new Error('cannot create empty namespace or namespace name is not a string!');
        }

        var pieces = ns.split('.'), i, packageName, cur = FW;
        for (i = 0; i < pieces.length; i++) {
            packageName = pieces[i];

            if (!cur.hasOwnProperty(packageName)) {
                cur[packageName] = {};
            }

            cur = cur[packageName];
        }

        return cur;

    };

    FW.select = function (selector, context) {
        if (typeof selector === 'string') {
            if (context) {
                var cont;
                if (context.jquery) {
                    cont = context[0];
                    if (!cont) {
                        return context;
                    }
                } else {
                    cont = context;
                }
                return $(cont.querySelectorAll(selector));
            }

            return $(document.querySelectorAll(selector));
        }

        return $(selector, context);
    };

    if (win.Modernizr) {
        Modernizr.addTest('ipad', function () {
            return !!navigator.userAgent.match(/iPad/i);
        });

        Modernizr.addTest('iphone', function () {
            return !!navigator.userAgent.match(/iPhone/i);
        });

        Modernizr.addTest('ipod', function () {
            return !!navigator.userAgent.match(/iPod/i);
        });

        Modernizr.addTest('ios', function () {
            return (Modernizr.ipad || Modernizr.ipod || Modernizr.iphone);
        });
    }

    FW.extend = function (moduleName, superClass, configs) {

        if (!moduleName) {
            throw 'Must specify a module name!';
        }

        var extended = superClass.extend(configs);

        extended.superclass = superClass;
        extended._type = moduleName;

        return extended;
    };

    var headers = {};

    FW.ajax = {

        addHeaders: function (newHeaders) {

            var key;

            for (key in newHeaders) {

                if (newHeaders.hasOwnProperty(key)) {
                    headers[key] = newHeaders[key];
                }
            }

            $.ajaxSetup({
                headers: headers
            });


        }


    };


    $.ajaxSetup({
        cache: false,
        headers: headers
    });


    return FW;


});
