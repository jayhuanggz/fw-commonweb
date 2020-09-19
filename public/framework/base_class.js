define('framework/base_class', ['framework/attributes', 'framework/base'], function() {
    FW.Base = FW.Attributes.extend(function() {
    }).methods({

        initialize : function() {
            FW.Attributes.prototype.initialize.apply(this, arguments);
            var self = this, i, initializer, classes = self._getClassChain();
            self.destroyed = false;
            self.publish('destroy', {
                defaultFn : self._destroy,
                context : self
            });

            var key, prototype, constructor, called = {}, last;

            for ( i = classes.length - 1; i >= 0; i--) {
                constructor = classes[i];
                prototype = classes[i].prototype;
                initializer = prototype.initializer;

                for (key in constructor) {
                    if ( typeof constructor[key] !== 'function') {
                        if (!self.hasOwnProperty(key)) {
                            self[key] = constructor[key];
                        }
                    }
                }

                if (initializer && typeof initializer === 'function' && last !== initializer) {
                    initializer.apply(self, arguments);
                    last = initializer;
                }
            }

            self._type = self.constructor._type;

            self.fire('init');

        },

        destroy : function() {
            var self = this;
            if (!self.destroyed) {
                self.fire('destroy', {
                    args : arguments
                });

            }
        },
        _destroy : function(e) {

            var self = this, classes = self._getClassChain(), i, destructor, last;

            for ( i = 0; i < classes.length; i++) {
                destructor = classes[i].prototype.destructor;

                if (destructor && typeof destructor === 'function' && last != destructor) {
                    destructor.apply(self, e.data.args);
                    last = destructor;
                }
            }
            self.off();
            self.removeTargets();
            self.destroyed = true;

        },
        _getClassChain : function() {
            var self = this, clazz = self.constructor, classes = [];
            while (clazz) {
                classes.push(clazz);
                clazz = clazz.superclass;
            }
            return classes;
        }
    });

});
