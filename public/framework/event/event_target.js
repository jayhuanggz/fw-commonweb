define('framework/event/event_target', ['lib/klass', 'framework/event/sub', 'framework/event/event_facade', 'framework/event/event_dispatcher'], function (klass) {

    var EventTarget = klass(function () {

    }).methods({
        initialize: function () {
            var self = this;
            self.targets = [];
            self.onSubscribers = {};
            self.beforeSubscribers = {};
            self.afterSubscribers = {};
            self.eventConfigs = {};
        },

        on: function (eventName, fn, context, priority, once) {

            eventName = this._getEventType(eventName);

            var self = this, subs = self.onSubscribers[eventName];

            if (!subs) {
                subs = [];
                self.onSubscribers[eventName] = subs;
            }

            var sub = new FW.Event.EventSubscriber(eventName, context, fn, self, priority, once);

            subs.push(sub);

            self.sortSubscriptions(subs);

            return sub;
        },

        _getEventType: function (type) {

            var _type = this.constructor._type;

            if (_type && type.indexOf(':') === -1) {
                return _type + ':' + type;

            }
            return type;

        },

        once: function (eventName, fn, context, priority, once) {
            return this.on(eventName, fn, context, priority, true);
        },

        sortSubscriptions: function (subs) {
            subs.sort(function (a, b) {

                if (a.getPriority() > b.getPriority()) {
                    return -1
                }

                if (a.getPriority() < b.getPriority()) {
                    return 1;
                }

                return 0;

            });
        },

        before: function (eventName, fn, context, priority) {
            eventName = this._getEventType(eventName);

            var self = this, subs = self.beforeSubscribers[eventName];

            if (!subs) {
                subs = [];
                self.beforeSubscribers[eventName] = subs;
            }

            var sub = new FW.Event.EventSubscriber(eventName, context, fn, self, priority);
            subs.push(sub);
            self.sortSubscriptions(subs);

            return sub;
        },

        after: function (eventName, fn, context, priority) {
            eventName = this._getEventType(eventName);
            var self = this, subs = self.afterSubscribers[eventName];

            if (!subs) {
                subs = [];
                self.afterSubscribers[eventName] = subs;
            }
            var sub = new FW.Event.EventSubscriber(eventName, context, fn, self, priority);
            subs.push(sub);
            self.sortSubscriptions(subs);
            return sub;
        },

        publish: function (name, config) {

            var self = this;

            self.eventConfigs[self._getEventType(name)] = config;

        },

        fire: function (name, data) {

            name = this._getEventType(name);

            var self = this, event = new FW.Event.EventFacade(name, self, data);
            FW.Event.EventDispatcher.getInstance().dispatch(event);
            return event;

        },

        getEventConfig: function (name) {
            return this.eventConfigs[name];
        },

        getOnSubscribers: function (name) {
            return this.onSubscribers[name];
        },

        getBeforeSubscribers: function (name) {
            return this.beforeSubscribers[name];
        },
        getAfterSubscribers: function (name) {
            return this.afterSubscribers[name];
        },

        removeTargets: function () {

            this.targets = [];
        },

        removeTarget: function (target) {
            var self = this, index = self.getTargetIndex(target);

            if (index !== -1) {
                self.targets.splice(index, 1);
            }
        },

        getTargetIndex: function (target) {

            var i, self = this;
            if (typeof self.targets.indexOf === 'function') {
                return self.targets.indexOf(target);
            } else {
                for (i = 0; i < self.targets.length; i += 1) {
                    if (self.targets[i] === target) {
                        return i;

                    }
                }
            }
            return -1;
        },

        getTargets: function () {
            return this.targets;
        },

        addTarget: function (target) {

            if (!target instanceof EventTarget) {
                throw new Error('Not an instance of EventTarget!');
            }
            var self = this, index = self.getTargetIndex(target);

            if (index === -1) {
                self.targets.push(target);
            }

        },
        off: function (type, fn) {

            var self = this;

            self._detachSubscribers(self.beforeSubscribers, type, fn);
            self._detachSubscribers(self.onSubscribers, type, fn);
            self._detachSubscribers(self.afterSubscribers, type, fn);
        },

        _detachSubscribers: function (subs, type, fn) {

            if (type == null || type == undefined) {
                var key;
                for (key in subs) {
                    if (key && subs.hasOwnProperty(key)) {
                        this._detachSubscribers(subs, key);
                    }
                }

            } else {
                type = this._getEventType(type);
                var targets = subs[type];

                if (targets) {
                    var i, removed = 0;
                    for (i = 0; i < targets.length; i++) {

                        if (!fn || targets[i].fn === fn) {
                            targets[i].destroy();
                            removed++;
                        }

                    }

                    if (removed >= targets.length) {
                        delete subs[type];

                    } else {

                        var loop = true;
                        while (loop) {
                            for (i = 0; i < targets.length; i++) {

                                if (!targets[i].active) {
                                    targets.splice(i, 1);
                                    loop = targets.length > 0;
                                    break;
                                }

                                loop = false;

                            }
                        }

                    }

                }

            }

        }
    });

    FW.namespace('Event').EventTarget = EventTarget;
    return EventTarget;

});
