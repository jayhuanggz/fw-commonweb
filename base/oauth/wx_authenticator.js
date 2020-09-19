var TokenClient = require('./token/token_client');

var Authenticator = function (config) {
    var self = this;

    var tokenClient = new TokenClient({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        accessTokenUrl: config.accessTokenUrl
    });

    self.tokenClient = tokenClient;
    self.clientId = config.clientId;

    self.authorizeUrl = config.authorizeUrl;
    self.scope = config.scope || 'snsapi_userinfo';
    self.redirectUrl = config.redirectUrl;
    self.defaultClient = config.defaultClient;


};


Authenticator.prototype.accessToken = function (req, code, cb, fail) {
    var self = this;

    var data = {
        code: code,
        redirect_uri: self.getRedirectUrl(req)
    };

    self.tokenClient.authorizationCode(data, cb, fail);

};

Authenticator.prototype.authenticate = function (req, res, cb, fail) {
    var self = this;

    return new Promise(function (resolve, reject) {

            var code = req.query.code;

            if (!code) {
                code = req.body.code;
            }

            if (code && code.length > 0) {
                self.accessToken(req, code, cb, function () {
                    fail({
                        redirect: self.redirectOAuth(req, res)
                    });
                });
            } else {
                fail({
                    redirect: self.redirectOAuth(req, res)
                });
            }

            resolve();
        }
    );

};

Authenticator.prototype.getRedirectUrl = function (req) {
    var redirect = req.query.redirect;

    if (!redirect) {
        redirect = req.body.redirect;
    }

    if (!redirect) {
        redirect = this.redirectUrl;
    }

    return redirect;

};


Authenticator.prototype.getClient = function (req) {
    var client = req.query.client;

    if (!client) {
        client = req.body.client;
    }

    if (!client) {
        client = this.defaultClient;
    }

    return client;

};


Authenticator.prototype.redirectOAuth = function (req, res) {

    var self = this;
    var redirect_uri = self.authorizeUrl + '?client_id=' + self.clientId + '&client=' + self.getClient(req) + '&scope=' + self.scope + '&redirect_uri=' + encodeURIComponent(self.getRedirectUrl(req));
    return redirect_uri;
};


module.exports = Authenticator;
