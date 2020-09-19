define('framework/mvc/view', ['framework/mvc/model'], function() {

    var View = FW.extend('view', FW.Base, {

        initializer : function(config) {

            if (!config) {
                config = {};
            }
            var self = this, model = config.model, node = config.node;

            if (!model) {
                model = self.model;

                if (!model) {
                    model = new FW.mvc.Model();
                }
            }
            self.model = model;

            if (!node) {
                node = self.node;
            }

            if (node) {

                if ( typeof node === 'string') {
                    node = FW.select(node);
                }

            } else {
                node = $('<div></div>');
            }
            self.node = node;
            self.publish('render', {
                defaultFn : self._render
            });

        },

        render : function(parent) {

            if (!this.rendered) {
                this.fire('render', {
                    parent : parent
                });

            }

        },

        getNode : function() {
            return this.node;
        },

        _render : function(e) {

            var self = this, node = self.node, parent = e.data.parent;

            if (parent) {
                parent.append(node);
            }

            if (self.class) {
                node.addClass(self.class);
            }

            if (self.id) {
                node[0].id = self.id;
            }

            self.renderUI();

            var events = self.events;

            if (events) {
                self._bindNodeEvents(events);

            }
            self.rendered = true;

        },

        isRendered : function() {
            return this.rendered === true;
        },

        _bindNodeEvents : function(events) {

            if (events) {
                var self = this, selector, event, node = self.node, fn, i, length;

                for (selector in events) {
                    event = events[selector];
                    if ( event instanceof Array) {
                        length = event.length;

                        for ( i = 0; i < length; i++) {
                            self._bindEventConfig(selector, event[i]);
                        }

                    } else {
                        self._bindEventConfig(selector, event);
                    }

                }
            }

        },

        _bindEventConfig : function(selector, event) {
            var self = this, node = self.node, fn;
            if (event.fn && typeof self[event.fn] === 'function') {

                fn = (function(context, callback) {

                    return function(e) {
                        callback.call(context, e);
                    };

                })(self, self[event.fn]);
                node.on(event.type, selector, fn);
            } else {
                throw 'cannot bind node events: event config must specify a callback function!';
            }
        },

        renderUI : function() {
        },

        destructor : function(remove) {
            var self = this;
            if (self.model) {
                self.model.destroy();
            }

            if (remove === true) {
                self.node.remove();
            }

        }
    });

    FW.namespace('mvc').View = View;

});
