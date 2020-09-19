define('framework/ui/form', ['framework/ui', 'framework/ui/fields/field', 'framework/mvc/view', 'framework/seed', 'lib/jquery.serialize-object'], function () {

    FW.namespace('ui').Form = FW.extend('ui-form', FW.Base, {
        initializer: function (config) {
            var self = this;

            self.publish('validate', {
                defaultFn: self._validate
            });

            self.bindings = config.bindings;
            self.validation = config.validation;


        },
        render: function () {

            var self = this, bindings = self.get('bindings'), node = self.get('node');

            self.validator = node.validate(self.get('validation'));
            self.node = node;
            self.model = self.get('model');

            self.valid = true;


            node.on('submit', function (e) {
                self._onNativeFormSubmit(e);
            });

            self.initBasicFields();
            self.initCustomFields();

        },

        initCustomFields: function () {
            var self = this, node = self.get('node'), nodes = FW.select('.field', node), fields = self.fields || [];
            nodes.each(function () {

                var target = $(this), type = target.attr('data-field');

                if (type) {
                    var field = self._createField(target, type);
                    if (field) {
                        fields.push(field);
                    }
                }
            });

            self.fields = fields;
        },

        initBasicFields: function () {
            var self = this, node = self.get('node'), nodes, fields = self.fields || [];


            nodes = FW.select('input[type="checkbox"]', node);

            nodes.each(function () {

                var target = $(this);

                var field = self._createField(target, 'boolean');
                if (field) {
                    fields.push(field);
                }

            });
            self.fields = fields;
        },

        _createField: function (target, type) {

            var self = this;
            var field = FW.ui.Form.Fields.get(type);
            if (field) {
                field = new FW.ui.Field({
                    field: field,
                    node: target,
                    model: self.model,
                    form: self
                });
                return field;

            }

        },

        _onNativeFormSubmit: function (e) {
            var self = this;

            if (self.isValid()) {
                var event = self.fire('submit');
                if (event.isDefaultPrevented()) {
                    e.preventDefault();
                }

            }
        },

        _validate: function () {
            this.valid = this.get('node').valid();
        },

        validate: function () {
            this.fire('validate');
            return this.valid;

        },

        isValid: function () {
            return this.validate();
        },

        submit: function () {
            var self = this;

            if (self.validate()) {
                self.get('node').submit();
            }
        },

        ajaxSubmit: function (fn) {
            var self = this;

            if (self.validate()) {
                self.get('node').ajaxSubmit(fn);
            }
        },

        getData: function () {
            var data = this.get('node').serializeObject(), fields = this.fields;

            if (fields && fields.length > 0) {
                $.each(fields, function (i, field) {
                    var fieldData = field.getData(), key;
                    if (fieldData) {
                        for (key in fieldData) {
                            if (fieldData.hasOwnProperty(key)) {
                                data[key] = fieldData[key];
                            }
                        }
                    }
                });
            }
            return data;


        },
        destructor: function () {
            var self = this, fields = self.fields;
            if (fields && fields.length > 0) {
                $.each(fields, function (i, field) {
                    field.destroy();
                });
            }

            self.fields = undefined;
            self.get('node').off();
        }
    });


    var _fields = {};

    FW.ui.Form.Fields = {

        add: function (type, field) {
            _fields[type] = field;

        },

        get: function (type) {
            return _fields [type];
        }


    };


    FW.ui.Form.Fields.add('boolean', {


        updateView: function (form, node, attr, value) {

            var self = this;
            if (value === true) {
                self.get('node').prop('checked', true);
            } else {
                self.get('node').prop('checked', false);
            }

        },
        getData: function () {
            var self = this;

            return self.get('node').prop('checked');

        }
    });
});
