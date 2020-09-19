define('framework/mvc/model', [ 'framework/base_class'], function () {

    var Model = FW.extend('model', FW.Base, {

        defaults: undefined,

        initializer: function (config) {
            var self = this;

            self.publish('fetch', {
                defaultFn: self._fetch
            });

            self.publish('save', {
                defaultFn: self._save
            });

            self.publish('remove', {
                defaultFn: self._remove
            });

        },

        getUrl: function () {

            var self = this, base = _.result(self, 'url');

            var id = self.get('id');

            return id ? base.replace(/[^\/]$/, '$&/') + encodeURIComponent(id) : base;
        },

        fetch: function (opts) {
            this.fire('fetch', {
                options: opts
            });
        },

        save: function (opts) {
            this.fire('save', {
                options: opts
            });
        },

        _save: function (e) {

            var model = this, data = model.toJSON(), options = e.data.options || {}, success = options.success;

            options.data = JSON.stringify(data);
            options.type = options.type || 'PUT';
            options.dataType = 'json';
            options.contentType = 'application/json';
            model._wrapError(options);
            if (!options.url) {
                options.url = model.getUrl();
            }

            options.success = (function (model, data, options, success) {
                return function (resp) {
                    var serverAttrs = resp;

                    serverAttrs = _.extend(data, serverAttrs);

                    model.set(serverAttrs, options);
                    if (success) {

                        success.call(options.context, resp, options);
                    }
                };
            })(model, data, options, success);
            $.ajax(options);

        },

        _fetch: function (e) {

            var model = this, options = e.data.options || {};
            var success = options.success;

            options.success = (function (model, success, options) {
                return function (resp) {

                    var serverAttrs = resp;

                    var data = options.data;
                    if (!data) {
                        data = {};
                        options.data = data;
                    }

                    data._fetch_ = true;


                    model.set(serverAttrs, options);
                    if (success) {
                        success.call(options.context, resp, options);
                    }
                };
            })(model, success, options);
            options.cache = false;
            model._wrapError(options);
            if (!options.url) {
                options.url = model.getUrl();
            }
            $.ajax(options);

        },

        remove: function (opts) {
            this.fire('remove', {
                options: opts
            });
        },

        _remove: function (e) {

            var model = this, id = model.get('id'), options = e.data.options || {}, success = options.success;

            if (id === undefined || id === null) {
                throw 'cannot remove model when id is not specifieed!';
            }

            options.success = (function (model, options) {
                return function (resp) {

                    if (success) {
                        success.call(options.context, resp, options);
                    }
                    model.destroy();
                };
            })(model, options);

            model._wrapError(options);
            options.type = 'DELETE';
            if (!options.url) {
                options.url = model.getUrl();
            }

            $.ajax(options);

        },


        isChangeEventFromFetch: function (e) {
            return e && e.data && e.data._meta_data && e.data._meta_data._fetch_ === true;

        },
        _wrapError: function (options) {
            var error = options.error, model = this;
            options.error = function (resp) {
                if (error)
                    error.call(options.context, resp, options);
                model.fire('error', {
                    response: resp,
                    options: options
                });
            };
        }
    });

    FW.namespace('mvc').Model = Model;

});
