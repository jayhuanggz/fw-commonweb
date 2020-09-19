var apiUrl;
var request = require('request');

var Log = {

    init: function (url) {
        apiUrl = url;
    },

    log: function (data) {

        request.post({
            url: apiUrl,
            json: true,
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        });


    }

};

module.exports = Log;