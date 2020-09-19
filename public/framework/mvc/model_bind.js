define('framework/mvc/model_bind', ['framework/mvc/view'], function () {

    var ModelBind = {};

    FW.mvc.ModelBind = ModelBind;

    ModelBind._handlers = [];

    ModelBind.addHandler = function (handlers) {

        handlers = _.map(_.flatten([handlers]), function (handler) {
            return _.defaults({}, handler, {
                updateModel: true,
                updateView: true,
                updateMethod: 'text'
            });
        });
        this._handlers = this._handlers.concat(handlers);
    };

    ModelBind.ViewMixin = {

        // Collection of model event bindings.
        //   [{model,event,fn,config}, ...]
        _modelBindings: null,

        // Unbind the model and event bindings from `this._modelBindings` and
        // `this.node`. If the optional `model` parameter is defined, then only
        // delete bindings for the given `model` and its corresponding view events.
        unbind: function (model, bindingSelector) {

            // Support passing a bindings hash in place of bindingSelector.
            if (_.isObject(bindingSelector)) {
                _.each(bindingSelector, function (v, selector) {
                    this.unbind(model, selector);
                }, this);
                return;
            }

            var models = [], destroyFns = [];
            this._modelBindings = _.reject(this._modelBindings, function (binding) {
                if (model && binding.model !== model)
                    return;
                if (bindingSelector && binding.config.selector != bindingSelector)
                    return;

                binding.model.off(binding.event, binding.fn);
                destroyFns.push(binding.config._destroy);
                models.push(binding.model);
                return true;
            });

            // Call `_destroy` on a unique list of the binding callbacks.
            _.each(_.uniq(destroyFns), function (fn) {
                fn.call(this);
            }, this);

            this.node.off('.stickit', bindingSelector);

            this.off('destroy', this.unbind);
        },

        // Initilize Stickit bindings for the view. Subsequent binding additions
        // can either call `stickit` with the new bindings, or add them directly
        // with `addBinding`. Both arguments to `stickit` are optional.
        bind: function (optionalBindingsConfig) {
            var bindings = optionalBindingsConfig || _.result(this, "bindings") || {};

            this.bindings = bindings;

            this._modelBindings || (this._modelBindings = []);

            // Add bindings in bulk using `addBinding`.

            this.once('destroy', this.unbind, this);

            this.addBinding(this.bindings);

        },

        // Add a single Stickit binding or a hash of bindings to the model. If
        // `optionalModel` is ommitted, will default to the view's `model` property.
        addBinding: function (selector, binding) {
            var model = this.model, namespace = '.stickit';

            binding = binding || {};

            // Support jQuery-style {key: val} event maps.
            if (_.isObject(selector)) {

                var bindings = selector;
                _.each(bindings, function (val, key) {
                    this.addBinding(key, val);
                }, this);
                return;
            }

            // Special case the ':el' selector to use the view's this.$el.
            var $el = selector === ':el' ? this.node : $(selector);

            // Clear any previous matching bindings.
            this.unbind(model, selector);

            // Fail fast if the selector didn't match an element.
            if (!$el.length)
                return;

            // Allow shorthand setting of model attributes - `'selector':'observe'`.
            if (_.isString(binding))
                binding = {
                    observe: binding
                };

            // Handle case where `observe` is in the form of a function.
            if (_.isFunction(binding.observe))
                binding.observe = binding.observe.call(this);

            // Find all matching Stickit handlers that could apply to this element
            // and store in a config object.
            var config = getConfiguration($el, binding);

            // The attribute we're observing in our config.
            var modelAttr = config.observe;

            // Store needed properties for later.
            config.selector = selector;
            config.view = this;

            // Create the model set options with a unique `bindId` so that we
            // can avoid double-binding in the `attributeChange` event handler.
            var bindId = config.bindId = _.uniqueId();

            // Add a reference to the view for handlers of stickitChange events
            var options = _.extend({
                stickitChange: config
            }, config.setOptions);

            // Add a `_destroy` callback to the configuration, in case `destroy`
            // is a named function and we need a unique function when unsticking.
            config._destroy = function () {
                applyViewFn.call(this, config.destroy, $el, model, config);
            };

            initializeAttributes($el, config, model, modelAttr);
            initializeVisible($el, config, model, modelAttr);
            initializeClasses($el, config, model, modelAttr);

            if (modelAttr) {
                // Setup one-way (input element -> model) bindings.
                _.each(config.events, function (type) {
                    var eventName = type + namespace;
                    var listener = function (event) {
                        var val = applyViewFn.call(this, config.getVal, $el, event, config, slice.call(arguments, 1));

                        // Don't update the model if false is returned from the `updateModel` configuration.
                        var currentVal = evaluateBoolean(config.updateModel, val, event, config);
                        if (currentVal)
                            setAttr(model, modelAttr, val, options, config);
                    };
                    var sel = selector === ':el' ? '' : selector;
                    this.node.on(eventName, sel, _.bind(listener, this));
                }, this);

                // Setup a `modelAttrChange` observer to keep the view element in sync.
                // `modelAttr` may be an array of attributes or a single string value.
                _.each(_.flatten([modelAttr]), function (attr) {
                    observeModelEvent(model, attr + 'Change', config, function (m, val, options) {
                        var changeId = options && options.stickitChange && options.stickitChange.bindId;
                        if (changeId !== bindId) {
                            var currentVal = getAttr(model, modelAttr, config);
                            updateViewBindEl($el, config, currentVal, model, false, m);
                        }
                    });
                });

                var currentVal = getAttr(model, modelAttr, config);
                updateViewBindEl($el, config, currentVal, model, true);
            }

            // After each binding is setup, call the `initialize` callback.
            applyViewFn.call(this, config.initialize, $el, model, config);
        }
    };

    // Helpers
    // -------

    var slice = [].slice;

    // Evaluates the given `path` (in object/dot-notation) relative to the given
    // `obj`. If the path is null/undefined, then the given `obj` is returned.
    var evaluatePath = function (obj, path) {
        var parts = (path || '').split('.');
        var result = _.reduce(parts, function (memo, i) {
            return memo[i];
        }, obj);
        return result == null ? obj : result;
    };

    // If the given `fn` is a string, then view[fn] is called, otherwise it is
    // a function that should be executed.
    var applyViewFn = function (fn) {
        fn = _.isString(fn) ? evaluatePath(this, fn) : fn;
        if (fn)
            return (fn).apply(this, slice.call(arguments, 1));
    };

    // Given a function, string (view function reference), or a boolean
    // value, returns the truthy result. Any other types evaluate as false.
    // The first argument must be `reference` and the last must be `config`, but
    // middle arguments can be variadic.
    var evaluateBoolean = function (reference, val, config) {
        if (_.isBoolean(reference)) {
            return reference;
        } else if (_.isFunction(reference) || _.isString(reference)) {
            var view = _.last(arguments).view;
            return applyViewFn.apply(view, arguments);
        }
        return false;
    };

    // Setup a model event binding with the given function, and track the event
    // in the view's _modelBindings.
    var observeModelEvent = function (model, event, config, fn) {
        var view = config.view;
        model.on(event, fn, view);
        view._modelBindings.push({
            model: model,
            event: event,
            fn: fn,
            config: config
        });
    };

    // Prepares the given `val`ue and sets it into the `model`.
    var setAttr = function (model, attr, val, options, config) {
        var value = {}, view = config.view;
        if (config.onSet) {
            val = applyViewFn.call(view, config.onSet, val, config);
        }

        if (config.set) {
            applyViewFn.call(view, config.set, attr, val, options, config);
        } else {
            value[attr] = val;
            // If `observe` is defined as an array and `onSet` returned
            // an array, then map attributes to their values.
            if (_.isArray(attr) && _.isArray(val)) {
                value = _.reduce(attr, function (memo, attribute, index) {
                    memo[attribute] = _.has(val, index) ? val[index] : null;
                    return memo;
                }, {});
            }
            options.data = {fromInput: true};
            model.set(value, options);
        }
    };

    // Returns the given `attr`'s value from the `model`, escaping and
    // formatting if necessary. If `attr` is an array, then an array of
    // respective values will be returned.
    var getAttr = function (model, attr, config) {
        var view = config.view;
        var retrieveVal = function (field) {
            return model.get(field);
        };
        var sanitizeVal = function (val) {
            return val == null ? '' : val;
        };
        var val = _.isArray(attr) ? _.map(attr, retrieveVal) : retrieveVal(attr);
        if (config.onGet)
            val = applyViewFn.call(view, config.onGet, val, config);
        return _.isArray(val) ? _.map(val, sanitizeVal) : sanitizeVal(val);
    };

    // Find handlers in `ModelBind._handlers` with selectors that match
    // `$el` and generate a configuration by mixing them in the order that they
    // were found with the given `binding`.
    var getConfiguration = ModelBind.getConfiguration = function ($el, binding) {
        var handlers = [{
            updateModel: false,
            updateMethod: 'text',
            update: function ($el, val, m, opts) {
                if ($el[opts.updateMethod])
                    $el[opts.updateMethod](val);
            },
            getVal: function ($el, e, opts) {
                return $el[opts.updateMethod]();
            }
        }];
        handlers = handlers.concat(_.filter(ModelBind._handlers, function (handler) {
            return $el.is(handler.selector);
        }));
        handlers.push(binding);

        // Merge handlers into a single config object. Last props in wins.
        var config = _.extend.apply(_, handlers);

        // `updateView` is defaulted to false for configutrations with
        // `visible`; otherwise, `updateView` is defaulted to true.
        if (!_.has(config, 'updateView'))
            config.updateView = !config.visible;
        return config;
    };

    // Setup the attributes configuration - a list that maps an attribute or
    // property `name`, to an `observe`d model attribute, using an optional
    // `onGet` formatter.
    //
    //     attributes: [{
    //       name: 'attributeOrPropertyName',
    //       observe: 'modelAttrName'
    //       onGet: function(modelAttrVal, modelAttrName) { ... }
    //     }, ...]
    //
    var initializeAttributes = function ($el, config, model, modelAttr) {
        var props = ['autofocus', 'autoplay', 'async', 'checked', 'controls', 'defer', 'disabled', 'hidden', 'indeterminate', 'loop', 'multiple', 'open', 'readonly', 'required', 'scoped', 'selected'];

        var view = config.view;

        _.each(config.attributes || [], function (attrConfig) {
            attrConfig = _.clone(attrConfig);
            attrConfig.view = view;

            var lastClass = '';
            var observed = attrConfig.observe || (attrConfig.observe = modelAttr);
            var updateAttr = function () {
                var updateType = _.contains(props, attrConfig.name) ? 'prop' : 'attr', val = getAttr(model, observed, attrConfig);

                // If it is a class then we need to remove the last value and add the new.
                if (attrConfig.name === 'class') {
                    $el.removeClass(lastClass).addClass(val);
                    lastClass = val;
                } else {
                    $el[updateType](attrConfig.name, val);
                }
            };

            _.each(_.flatten([observed]), function (attr) {
                observeModelEvent(model, attr + 'Change', config, updateAttr);
            });

            // Initialize the matched element's state.
            updateAttr();
        });
    };

    var initializeClasses = function ($el, config, model, modelAttr) {
        _.each(config.classes || [], function (classConfig, name) {
            if (_.isString(classConfig))
                classConfig = {
                    observe: classConfig
                };
            classConfig.view = config.view;

            var observed = classConfig.observe;
            var updateClass = function () {
                var val = getAttr(model, observed, classConfig);
                $el.toggleClass(name, !!val);
            };

            _.each(_.flatten([observed]), function (attr) {
                observeModelEvent(model, attr + 'Change', config, updateClass);
            });
            updateClass();
        });
    };

    // If `visible` is configured, then the view element will be shown/hidden
    // based on the truthiness of the modelattr's value or the result of the
    // given callback. If a `visibleFn` is also supplied, then that callback
    // will be executed to manually handle showing/hiding the view element.
    //
    //     observe: 'isRight',
    //     visible: true, // or function(val, options) {}
    //     visibleFn: function($el, isVisible, options) {} // optional handler
    //
    var initializeVisible = function ($el, config, model, modelAttr) {
        if (config.visible == null)
            return;
        var view = config.view;

        var visibleCb = function () {
            var visible = config.visible, visibleFn = config.visibleFn, val = getAttr(model, modelAttr, config), isVisible = !!val;

            // If `visible` is a function then it should return a boolean result to show/hide.
            if (_.isFunction(visible) || _.isString(visible)) {
                isVisible = !!applyViewFn.call(view, visible, val, config);
            }

            // Either use the custom `visibleFn`, if provided, or execute the standard show/hide.
            if (visibleFn) {
                applyViewFn.call(view, visibleFn, $el, isVisible, config);
            } else {
                $el.toggle(isVisible);
            }
        };

        _.each(_.flatten([modelAttr]), function (attr) {
            observeModelEvent(model, attr + 'Change', config, visibleCb);
        });

        visibleCb();
    };

    // Update the value of `$el` using the given configuration and trigger the
    // `afterUpdate` callback. This action may be blocked by `config.updateView`.
    //
    //     update: function($el, val, model, options) {},  // handler for updating
    //     updateView: true, // defaults to true
    //     afterUpdate: function($el, val, options) {} // optional callback
    //
    var updateViewBindEl = function ($el, config, val, model, isInitializing, e) {
        var view = config.view;
        if (!evaluateBoolean(config.updateView, val, config))
            return;
        if (!e || !e.data._meta_data || !e.data._meta_data.fromInput) {
            applyViewFn.call(view, config.update, $el, val, model, config, e);
            if (!isInitializing)
                applyViewFn.call(view, config.afterUpdate, $el, val, config, e);
        }

    };

    // Default Handlers
    // ----------------

    ModelBind.addHandler([{
        selector: '[contenteditable="true"]',
        updateMethod: 'html',
        events: ['input', 'change', 'blur']
    }, {
        selector: 'input',
        events: ['input', 'change', 'blur'],
        update: function ($el, val, config, e) {


            $el.val(val);


        },
        getVal: function ($el) {
            var type = $el.attr('type'), val = $el.val();

            if (type) {

                if (type.toLowerCase() === 'number') {
                    val = parseFloat(val);
                    if (isNaN(val)) {
                        return '';
                    }
                    return val;
                } else if (type.toLowerCase() === 'integer') {
                    val = parseInt(val, 10);
                    if (isNaN(val)) {
                        return '';
                    }
                    return val;
                } else {
                    return val;
                }

            } else {
                return val;
            }

        }
    }, {
        selector: 'textarea',
        events: ['input', 'change', 'blur'],
        update: function ($el, val, config, e) {


            $el.val(val);
        },
        getVal: function ($el) {
            return $el.val();
        }
    }, {
        selector: 'input[type="radio"]',
        events: ['change'],
        update: function ($el, val) {
            $el.filter('[value="' + val + '"]').prop('checked', true);
        },
        getVal: function ($el) {
            return $el.filter(':checked').val();
        }
    }, {
        selector: 'input[type="checkbox"]',
        events: ['change'],
        update: function ($el, val, model, options) {
            if ($el.length > 1) {
                // There are multiple checkboxes so we need to go through them and check
                // any that have value attributes that match what's in the array of `val`s.
                val || ( val = []);
                $el.each(function (i, el) {
                    var checkbox = $(el);
                    var checked = _.contains(val, checkbox.val());
                    checkbox.prop('checked', checked);
                });
            } else {
                var checked = _.isBoolean(val) ? val : val === $el.val();
                $el.prop('checked', checked);
            }
        },
        getVal: function ($el) {
            var val;
            if ($el.length > 1) {
                val = _.reduce($el, function (memo, el) {
                    var checkbox = $(el);
                    if (checkbox.prop('checked'))
                        memo.push(checkbox.val());
                    return memo;
                }, []);
            } else {
                val = $el.prop('checked');
                // If the checkbox has a value attribute defined, then
                // use that value. Most browsers use "on" as a default.
                var boxval = $el.val();
                if (boxval !== 'on' && boxval != null) {
                    val = val ? $el.val() : null;
                }
            }
            return val;
        }
    }, {
        selector: 'select',
        events: ['change', 'blur'],
        update: function ($el, val, model, options) {
            var optList, selectConfig = options.selectOptions, list = selectConfig && selectConfig.collection || undefined, isMultiple = $el.prop('multiple');

            // If there are no `selectOptions` then we assume that the `<select>`
            // is pre-rendered and that we need to generate the collection.
            if (!selectConfig) {
                selectConfig = {};
                var getList = function ($el) {
                    return $el.map(function (index, option) {
                        // Retrieve the text and value of the option, preferring "stickit-bind-val"
                        // data attribute over value property.
                        var dataVal = $(option).data('stickit-bind-val');
                        return {
                            value: dataVal !== undefined ? dataVal : option.value,
                            label: option.text
                        };
                    }).get();
                };
                if ($el.find('optgroup').length) {
                    list = {
                        opt_labels: []
                    };
                    // Search for options without optgroup
                    if ($el.find('> option').length) {
                        list.opt_labels.push(undefined);
                        _.each($el.find('> option'), function (el) {
                            list[undefined] = getList($(el));
                        });
                    }
                    _.each($el.find('optgroup'), function (el) {
                        var label = $(el).attr('label');
                        list.opt_labels.push(label);
                        list[label] = getList($(el).find('option'));
                    });
                } else {
                    list = getList($el.find('option'));
                }
            }

            // Fill in default label and path values.
            selectConfig.valuePath = selectConfig.valuePath || 'value';
            selectConfig.labelPath = selectConfig.labelPath || 'label';

            var addSelectOptions = function (optList, $el, fieldVal) {
                _.each(optList, function (obj) {
                    var option = $('<option/>'), optionVal = obj;

                    var fillOption = function (text, val) {
                        option.text(text);
                        optionVal = val;
                        // Save the option value as data so that we can reference it later.
                        option.data('stickit-bind-val', optionVal);
                        if (!_.isArray(optionVal) && !_.isObject(optionVal))
                            option.val(optionVal);
                    };

                    var text, val;
                    if (obj === '__default__') {
                        text = fieldVal.label, val = fieldVal.value;
                    } else {
                        text = evaluatePath(obj, selectConfig.labelPath), val = evaluatePath(obj, selectConfig.valuePath);
                    }
                    fillOption(text, val);

                    // Determine if this option is selected.
                    var isSelected = function () {
                        if (!isMultiple && optionVal != null && fieldVal != null && optionVal === fieldVal) {
                            return true;
                        } else if (_.isObject(fieldVal) && _.isEqual(optionVal, fieldVal)) {
                            return true;
                        }
                        return false;
                    };

                    if (isSelected()) {
                        option.prop('selected', true);
                    } else if (isMultiple && _.isArray(fieldVal)) {
                        _.each(fieldVal, function (val) {
                            if (_.isObject(val))
                                val = evaluatePath(val, selectConfig.valuePath);
                            if (val === optionVal || (_.isObject(val) && _.isEqual(optionVal, val)))
                                option.prop('selected', true);
                        });
                    }

                    $el.append(option);
                });
            };

            $el.find('*').remove();

            // The `list` configuration is a function that returns the options list or a string
            // which represents the path to the list relative to `window` or the view/`this`.
            if (_.isString(list)) {
                var context = window;
                if (list.indexOf('this.') === 0)
                    context = this;
                list = list.replace(/^[a-z]*\.(.+)$/, '$1');
                optList = evaluatePath(context, list);
            } else if (_.isFunction(list)) {
                optList = applyViewFn.call(this, list, $el, options);
            } else {
                optList = list;
            }

            if (selectConfig.defaultOption) {
                var option = _.isFunction(selectConfig.defaultOption) ? selectConfig.defaultOption.call(this, $el, options) : selectConfig.defaultOption;
                addSelectOptions(["__default__"], $el, option);
            }

            if (_.isArray(optList)) {
                addSelectOptions(optList, $el, val);
            } else if (optList.opt_labels) {
                // To define a select with optgroups, format selectOptions.collection as an object
                // with an 'opt_labels' property, as in the following:
                //
                //     {
                //       'opt_labels': ['Looney Tunes', 'Three Stooges'],
                //       'Looney Tunes': [{id: 1, name: 'Bugs Bunny'}, {id: 2, name: 'Donald Duck'}],
                //       'Three Stooges': [{id: 3, name : 'moe'}, {id: 4, name : 'larry'}, {id: 5, name : 'curly'}]
                //     }
                //
                _.each(optList.opt_labels, function (label) {
                    var $group = $('<optgroup/>').attr('label', label);
                    addSelectOptions(optList[label], $group, val);
                    $el.append($group);
                });
                // With no 'opt_labels' parameter, the object is assumed to be a simple value-label map.
                // Pass a selectOptions.comparator to override the default order of alphabetical by label.
            } else {
                var opts = [], opt;
                for (var i in optList) {
                    opt = {};
                    opt[selectConfig.valuePath] = i;
                    opt[selectConfig.labelPath] = optList[i];
                    opts.push(opt);
                }
                opts = _.sortBy(opts, selectConfig.comparator || selectConfig.labelPath);
                addSelectOptions(opts, $el, val);
            }
        },
        getVal: function ($el) {
            var selected = $el.find('option:selected');

            if ($el.prop('multiple')) {
                return _.map(selected, function (el) {
                    return $(el).data('stickit-bind-val');
                });
            } else {
                return selected.data('stickit-bind-val');
            }
        }
    }]);

});
