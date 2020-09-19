define(
    'framework/ui/loader',
    ['framework/base'],
    function () {

        var loader, body = $(document.body);

        var Loader = function () {

            var self = this;

            self.node = $('<div class="ui-loader-mask"><div class="ui-loader"><div class="ui-icon-loading"></div></div></div>');
        };

        Loader.prototype = {

            render: function (parent) {

                if (!parent) {
                    parent = FW.ui.node;
                }

                var self = this;

                parent.append(self.node);
                self.node.show();

            },
            hide: function () {
                this.node.hide();
            },
            destroy: function () {
                this.node.remove();
                if (loader === this) {
                    loader = undefined;
                }
            }

        };

        var UI = FW.namespace('ui');

        UI.Loader = Loader;

        UI.showMask = function (parent) {


            if (parent) {
                var current = parent.data('fw-loader');
                if (!current) {
                    current = new UI.Loader();
                    current.render(parent);
                    parent.data('fw-loader', current);
                }
                parent.addClass('fw-loading');

            } else {
                if (!loader) {
                    loader = new UI.Loader();
                }
                loader.render(body);
            }


        };

        UI.hideMask = function (parent) {


            if (parent) {
                var current = parent.data('fw-loader');
                if (current) {
                    current.destroy();
                    parent.removeData('fw-loader', undefined);
                }

                parent.removeClass('fw-loading');
            } else {
                if (loader) {
                    loader.hide();
                    body.append(loader.node);
                }
            }


        };

    });