define('framework/ui/fields/qiniu_field', ['framework/ui/form', 'lib/qiniu'], function () {


    FW.ui.Form.Fields.add('qiniu', {

        init: function (form, node, attr, value) {

            var self = this, id = node.attr('id');

            if (!id || id.length === 0) {
                id = FW.Utils.addRandom();
                self.randomId = id;
                node.attr('id', id);
            }


            var filters, filtersConfig = node.attr('data-filters');

            if (filtersConfig && filtersConfig.length > 0) {
                filters = JSON.parse(filtersConfig);
            }

            node.html('<span class="preview"></span><a href="#">上传</a>');


            self.uploader = new Qiniu().uploader({
                runtimes: 'html5,flash,html4',    //上传模式,依次退化
                browse_button: id,     //上传选择的点选按钮，**必需**
                uptoken_url: node.attr('data-uptoken-url'),
                unique_names: true,
                domain: node.attr('data-qiniu-url'),
                max_file_size: '5mb',
                flash_swf_url: node.attr('data-flash-url'),  //引入flash,相对路径
                max_retries: 3,
                auto_start: true,
                multi_selection: true,
                filters: {
                    max_file_size: '1mb',
                    mime_types: [
                        {title: "图片", extensions: "jpg,gif,png"}
                    ]
                },
                init: {
                    'FileUploaded': function (up, file, info) {
                        var info = JSON.parse(info), key = info.key, name = file.name;
                        $.ajax({
                            contentType: 'application/json',
                            type: 'post',
                            url: node.attr('data-upload-url'),
                            data: JSON.stringify({
                                externalUrl: node.attr('data-qiniu-url') + key,
                                fileName: name,
                                key: key,
                                size: file.size,
                                mimeType: file.type
                            }), success: function (data) {
                                self.data = {
                                    id: data.id,
                                    externalUrl: node.attr('data-qiniu-url') + key
                                };
                                self.get('model').set(attr, self.data);


                            }
                        });
                    },
                    'Error': function (up, err, errTip) {
                    }
                }
            });


        },


        updateView: function (form, node, attr, value) {

            if (value) {
                node.find('.preview').html('<img src="' + value.externalUrl + '"/>');
            }


        },
        getData: function () {
            return this.data;

        },
        destroy: function () {

            var self = this;
            if (self.uploader) {
                self.uploader.destroy();
            }

            if (self.randomId) {
                FW.Utils.removeRandom(self.randomId);
            }

        }
    });


});