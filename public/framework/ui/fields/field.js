define('framework/ui/fields/field', ['framework/seed'], function () {

    FW.namespace('ui').Field = FW.extend('ui_field', FW.Base, {

        initializer: function () {
            var self = this, field = self.get('field'), node = self.get('node'), model = self.get('form').get('model');
            var attr = node.attr('data-attr');
            if (!attr || attr.length === 0) {
                attr = node.attr('name');
            }

            if (field.init) {
                field.init.call(self, self.get('form'), node, attr, model ? model.get(attr) : undefined);
            }


            if (attr) {
                self.set('attr', attr, {
                    silent: true
                });

                if (model) {
                    model.on(attr + 'Change', self.updateView, self);
                }
            }

            self.updateView();

        },
        updateView: function () {

            var self = this, model = self.get('form').get('model'), field = self.get('field'), attr = self.get('attr');

            if (field.updateView) {
                field.updateView.call(self, self.get('form'), self.get('node'), attr, model.get(attr));
            }
        },
        getData: function () {
            var self = this, data = {}, value = self.get('field').getData.call(self, self.get('form'), self.get('node'));

            if (!self.get('attr') && typeof value === 'object') {

                var key;
                for (key in value) {
                    if (value.hasOwnProperty(key)) {
                        data[key] = value[key];
                    }
                }

            } else {
                data[self.get('attr')] = value;
            }

            return data;

        },
        destructor: function () {
            var self = this, field = self.get('field');
            if (field.destroy) {
                field.destroy.call(self);
            }
        }
    });


});