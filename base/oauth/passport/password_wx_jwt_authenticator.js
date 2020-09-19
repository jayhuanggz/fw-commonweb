var path = require("path");


var request = require('request');

var passport = require('passport');


var util = require('util');

var verified = function (context) {

    return function (err, user, info) {
        if (err) {
            return self.error(err);
        }
        if (!user) {
            if (typeof info == 'string') {
                info = {message: info}
            }
            info = info || {};
            return self.fail();
        }
        context.success(user, info);
    }

};


var Authenticator = function (config, verify) {
    var self = this;
    passport.Strategy.call(this, config, verify);
    self.jwtAuthenticator = config.jwtAuthenticator;
    self.wxAuthenticator = config.wxAuthenticator;

    self.name = 'fwWxJwt';
    self.verify = verify;


};

util.inherits(Authenticator, passport.Strategy);

Authenticator.prototype.authenticate = function (req, opts) {
    var self = this;

    return new Promise(function (resolve, reject) {


            self.jwtAuthenticator.authenticate(req, req.res, function (data) {
                self.verify(data, verified(self));
            }, function () {

                self.wxAuthenticator.authenticate(req, req.res, function (data) {

                    var client = req.query.client;

                    if (!client) {
                        client = req.body.client;
                    }


                    self.jwtAuthenticator.accessToken(data.id, data.id, {
                        client: client
                    }, function (data) {


                        self.verify(data, verified(self));

                    }, self.fail);

                }, function (redirect) {
                    self.fail(redirect);
                });

            });


            resolve();
        }
    );

};


module.exports = Authenticator;
