var request = require('request');

var TokenClient = function (config) {
    this.refreshFactor = config.refreshFactor || 0.9;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.accessTokenUrl = config.accessTokenUrl;
};

TokenClient.prototype = {

    password: function (params, success, fail) {
        var self = this;

        params.grant_type = 'password';
        request.post({
            url: self.accessTokenUrl + '?client_id=' + self.clientId + '&client_secret=' + self.clientSecret,
            form: params
        }, self._handleTokenResponse.bind(self, success, fail, params));
    },


    authorizationCode: function (params, success, fail) {
        var self = this;

        params.grant_type = 'authorization_code';
        request.post({
            url: self.accessTokenUrl + '?client_id=' + self.clientId + '&client_secret=' + self.clientSecret,
            form: params
        }, self._handleTokenResponse.bind(self, success, fail, params));
    },


    _handleTokenResponse: function (success, fail, params, err, httpResponse, body) {
        var self = this;
        if (err) {
            fail(err);
            return;
        }

        try {
            var data = JSON.parse(body);
            if (data.error) {
                fail(data);
            } else {
                self.appendExpireTime(data);
                success(data);
            }
        } catch (ex) {
            console.log('request token failed.......', JSON.stringify(params), body);
            fail(ex);
        }


    },

    isExpired: function (token) {
        return token.expireTime <= Date.now();
    },
    appendExpireTime: function (token) {
        var expires = token.expires_in;
        token.expireTime = Date.now() + expires * 1000 * this.refreshFactor;
    },

    refresh: function (token, success, fail) {
        var self = this;
        var params = {
            client_id: self.clientId,
            client_secret: self.clientSecret,
            refresh_token: token.refresh_token,
            grant_type: 'refresh_token'
        };
        request.post({
            url: self.accessTokenUrl,
            form: params

        }, self._handleTokenResponse.bind(self, success, fail, params));


    }

};


module.exports = TokenClient;