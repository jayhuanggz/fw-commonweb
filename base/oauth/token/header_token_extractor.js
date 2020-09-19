var headerName = 'x-auth-token';

var Extractor = {

    setHeaderName: function (name) {
        headerName = name;
    },


    extract: function (request) {

        var value = request.headers[headerName];

        if (value && value.length > 0) {
            try {
                value = JSON.parse(value);
            } catch (err) {
                value = undefined;
            }
        }
        return value;
    }


};

module.exports = Extractor;




