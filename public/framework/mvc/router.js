define('framework/mvc/router', ['framework/seed', 'framework/mvc/history'], function () {

    var optionalParam = /\((.*?)\)/g, namedParam = /(\(\?)?:\w+/g, splatParam = /\*\w+/g, escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g, Router = FW.extend('router', FW.Base, {

        initializer: function (options) {

            var self = this;

            options || ( options = {});
            if (options.routes)
                self.routes = options.routes;
            self._bindRoutes();

            self.publish('route', {
                defaultFn: self._onRoute,
                context: self
            });
        },

        applySecurity: function (fragment) {
            var valid = false, security = this.security, i, rule, self = this;


            if (security) {

                for (i = 0; i < security.length; i++) {

                    rule = security[i];

                    if (rule.pattern.test(fragment)) {

                        if (rule.test(fragment)) {
                            return true;
                        } else {
                            if (rule.fail && typeof rule.fail === 'function') {
                                rule.fail.call(self);
                            }
                            return false;
                        }

                    }
                }

                return true;
            } else {
                return true;
            }
        },

        _onRoute: function (e) {
            var self = this, data = e.data;

            self.execute(data.callback, data.args);

        },

        route: function (route, name, callback) {

            var type = typeof name;
            if (!(type === 'object' && typeof name.test === 'function'))
                route = this._routeToRegExp(route);
            if (type === 'function') {
                callback = name;
                name = '';
            }
            if (!callback)
                callback = this[name];
            var router = this;
            FW.mvc.history.route(route, function (fragment) {
                var args = router._extractParameters(route, fragment);
                router.fire('route', {
                    route: route,
                    name: name,
                    fragment: fragment,
                    args: args,
                    callback: callback,
                    currentFragment: currentFragment
                });

                router.fire('route:' + name, {
                    params: args
                });

                FW.mvc.history.fire('route', {
                    router: router,
                    name: name,
                    params: args
                });

            });
            return this;
        },
        execute: function (callback, args) {
            if (callback)
                callback.apply(this, args);
        },

        // Simple proxy to `FW.mvc.history` to save a fragment into the history.
        navigate: function (fragment, options) {
            FW.mvc.history.navigate(fragment, options);
            return this;
        },

        // Bind all defined routes to `FW.mvc.history`. We have to reverse the
        // order of the routes here to support behavior where the most general
        // routes can be defined at the bottom of the route map.
        _bindRoutes: function () {
            if (!this.routes)
                return;
            this.routes = this.routes;
            var route, routes = this.routes, key;

            for (key in routes) {
                if (routes.hasOwnProperty(key)) {
                    this.route(key, this.routes[key]);
                }
            }

        },


        // Convert a route string into a regular expression, suitable for matching
        // against the current location hash.
        _routeToRegExp: function (route) {
            route = route.replace(escapeRegExp, '\\$&').replace(optionalParam, '(?:$1)?').replace(namedParam, function (match, optional) {
                return optional ? match : '([^/?]+)';
            }).replace(splatParam, '([^?]*?)');
            return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
        },

        // Given a route, and a URL fragment that it matches, return the array of
        // extracted decoded parameters. Empty or unmatched parameters will be
        // treated as `null` to normalize cross-browser behavior.
        _extractParameters: function (route, fragment) {
            var params = route.exec(fragment).slice(1);

            if (params && params.length > 0) {
                var param, length = params.length;
                for (var i = 0; i < params.length; i++) {
                    param = params[i];
                    if (i === length - 1)
                        params[i] = param || null;
                    params[i] = param ? decodeURIComponent(param) : null;
                }
            }

            return params;


        }
    });

    Router.buildUrl = function (uri, params) {

        if (params && params.length > 0) {

            var first = /\/$/.test(uri), i;
            for (i = 0; i < params.length; i++) {
                if (first) {
                    first = false;
                } else {
                    uri += '/';
                }

                uri += params[i];

            }

        }

        return uri;

    };
    var mvc = FW.namespace('mvc');
    mvc.Router = Router;
});
