define('framework/attributes', [ 'framework/event/event'], function () {

    var Attributes = FW.Event.EventTarget.extend(function () {
    }).methods({

        defaults: undefined,

        initialize: function (config) {
            var self = this, _attrs, defaults = self.defaults;
            FW.Event.EventTarget.prototype.initialize.call(this);

            if (self.defaults) {
                defaults = JSON.parse(JSON.stringify(defaults));
            } else {
                defaults = {};
            }


            _attrs = $.extend({}, config, defaults);
            self._defaultAttrs = _attrs;

            self._attrs = _attrs;

        },

        restore: function () {

            this.set(this._defaultAttrs);

        },

        getAttributes: function () {
            return this._attrs;
        },

        get: function (attr) {
            return this._attrs[attr];
        },

        set: function (key, val, opts) {
            var self = this, attrs = {};

            if (typeof key === 'object') {
                attrs = key;
                opts = val;
            } else {
                attrs[key] = val;
            }

            var curVal, changed, newVal, sholdFireChange = false, changeEvents = [];
            var metaData = opts ? opts.data : undefined;
            for (key in attrs) {
                if (attrs.hasOwnProperty(key)) {
                    curVal = self._attrs[key];
                    newVal = attrs[key];

                    if (curVal !== newVal) {

                        self._attrs[key] = newVal;

                        if (!opts || opts.silent !== true) {
                            changeEvents.push({
                                type: key + 'Change',
                                prevVal: curVal,
                                newVal: newVal
                            });

                            if (!changed) {
                                changed = {};
                            }

                            sholdFireChange = true;

                            changed[key] = {

                                newVal: newVal,
                                prevVal: curVal
                            };
                        }
                    }
                }
            }

            if (sholdFireChange) {

                if (changeEvents.length > 0) {
                    var i, event;
                    for (i = 0; i < changeEvents.length; i++) {
                        event = changeEvents[i];
                        self.fire(event.type, {
                            prevVal: event.prevVal,
                            newVal: event.newVal,
                            _meta_data: metaData
                        });
                    }

                }
                changed._meta_data = metaData;
                self.fire('change', changed);
            }
        },

        unset: function (attr, opts) {
            this.set(attr, undefined, opts);

        },

        clear: function (opts) {
            var key, attrs = {}, self = this;
            for (key in self._attrs) {
                if (self._attrs.hasOwnProperty(key)) {
                    attrs[key] = undefined;
                }

            }
            this.set(attrs, opts);
        },

        toJSON: function () {
            return this._attrs;
        }
    });

    FW.Attributes = Attributes;

});
