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

    self.name = 'fwJwt';
    self.verify = verify;


};

util.inherits(Authenticator, passport.Strategy);

Authenticator.prototype.authenticate = function (req, opts) {
    var self = this;


    return new Promise(function (resolve, reject) {


            self.jwtAuthenticator.authenticate(req, req.res, function (data) {
                self.verify(data, verified(self));
            }, function () {
                var username = opts.username, password = opts.password;
                self.jwtAuthenticator.accessToken(username, password, opts.params, function (data) {

                    self.verify(data, verified(self));

                }, self.fail);
            });


            resolve();
        }
    );

};


module.exports = Authenticator;
