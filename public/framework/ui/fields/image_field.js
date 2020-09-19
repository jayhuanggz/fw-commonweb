define('framework/ui/fields/image_field', ['framework/ui/form', 'lib/plupload.full.min.js'], function () {


    FW.ui.Form.Fields.add('image', {

        init: function (form, node, attr) {

            var self = this,
                headers = {}, id = node.attr('id');

            if (!id || id.length === 0) {
                id = FW.Utils.addRandom();
                self.randomId = id;
                node.attr('id', 'upload-' + id);
            }


            var filters, filtersConfig = node.attr('data-filters');

            if (filtersConfig && filtersConfig.length > 0) {
                filters = JSON.parse(filtersConfig);
            }

            node.html('<span class="preview"></span><a href="#">上传</a>');


            headers[FW.csrf.header] = FW.csrf.token;
            var uploader = new plupload.Uploader({
                runtimes: 'html5,flash,html4',    //上传模式,依次退化
                browse_button: 'upload-' + id,     //上传选择的点选按钮，**必需**
                unique_names: true,
                max_file_size: '5mb',
                flash_swf_url: node.attr('data-flash-url'),  //引入flash,相对路径
                max_retries: 3,
                url: node.attr('data-url'),
                auto_start: true,
                multi_selection: true,
                headers: headers,
                filters: {
                    max_file_size: '5mb',
                    mime_types: [
                        {title: "图片", extensions: "jpg,gif,png"}
                    ]
                },
                init: {
                    FilesAdded: function (up, files) {
                        uploader.start();
                    },

                    UploadProgress: function (up, file) {

                    },

                    Error: function (up, err) {
                    },
                    FileUploaded: function (up, file, response) {
                        var data = JSON.parse(response.response);
                        self.data = data;
                        node.find('.preview').html('<img src="' + data.externalUrl + '"/>');
                    }
                }
            });

            uploader.init();
            self.fileUploader = uploader;
        },


        getData: function () {
            return this.data;

        },
        destroy: function () {

            var self = this;
            if (self.fileUploader) {
                self.fileUploader.destroy();
            }

            if (self.randomId) {
                FW.Utils.removeRandom(self.randomId);
            }

            if (self.input) {
                self.input.remove();
            }

        }
    });


});