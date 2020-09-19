define('framework/ui/fields/ckeditor_field', ['framework/ui/form'], function () {


    FW.ui.Form.Fields.add('ckeditor', {

        init: function (form, node) {

            var self = this, config = {
                language: 'zh-cn',
                fontSize_sizes: '小/85%;正常/100%;大/150%;超大/200%',
                line_height: '1;1.5;1.75;2;3;4;5;',

                qiniu: {
                    uptoken_url: FW.getUrl('/uptoken', true),
                    domain: FW.config.extras.qiniuDomain,
                    multi_selection: true,
                    postUploadUrl: FW.getUrl('/upload', true),
                    flash_swf_url: FW.getAssets('lib/Moxie.swf')
                },

                height: 480

            };


            var removePlugins = node.attr('data-removeplugins');
            if (removePlugins) {
                config.removePlugins = removePlugins;
            }

            self.editor = window.CKEDITOR.replace(node[0], config);

        },

        updateView: function (form, node, attr, value) {

            this.editor.setData(value);

        },
        getData: function () {
            return this.editor.getData();

        },
        destroy: function () {
            this.editor.destroy();
        }
    });


});