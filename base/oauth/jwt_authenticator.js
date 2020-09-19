var fs = require("fs");
var path = require("path");
var jwt = require('jsonwebtoken');

var logger = require('log4js').getLogger();
var defaultTokenExtractor = require('./token/header_token_extractor');


var request = require('request');

var Authenticator = function(config) {
    var self = this;

    self.clientId = config.clientId;
    self.clientSecret = config.clientSecret;
    self.accessTokenUrl = config.accessTokenUrl;

    self.refreshFactor = config.refreshFactor = 0.9;

    if (config.tokenExtractor) {
        this.tokenExtractor = config.tokenExtractor;
    } else {
        this.tokenExtractor = defaultTokenExtractor;
    }
    self.cert = config.cert;

    self.name = 'fwjwt';


};

Authenticator.prototype.accessToken = function(username, password, params, success, fail) {
    var self = this,
        data = {
            grant_type: 'password',
            password: password,
            username: username
        };

    for (var key in params) {
        if (params.hasOwnProperty(key)) {

            if (params[key] !== null && params[key] !== undefined) {

                data[key] = params[key];
            }

        }
    }


    request.post({
        url: self.accessTokenUrl + '?client_id=' + self.clientId + '&client_secret=' + self.clientSecret,
        form: data
    }, function(err, httpResponse, body) {
        if (err) {
            console.log('错误：', err)
            console.log('请求参数：', {
                url: self.accessTokenUrl + '?client_id=' + self.clientId + '&client_secret=' + self.clientSecret,
                form: data
            })
            console.log('返回body:', body)
            fail(err)
            return
        }
        var data = JSON.parse(body);

        if (data.error) {
            fail(data);
        } else {
            self.appendExpireTime(data);


            success(data);
        }


    });

};

Authenticator.prototype.authenticate = function(req, res, success, fail) {
    var self = this;

    return new Promise(function(resolve, reject) {


        var token = self.tokenExtractor.extract(req);


        if (token) {

            if (self.isExpired(token)) {
                self.refresh(token).then(function(token) {


                    success(token);

                });
            } else {
                success(token);

            }
        } else {
            fail();
        }


        resolve();
    });

};


Authenticator.prototype.isExpired = function(token) {

    return token.expireTime <= Date.now();

};
Authenticator.prototype.appendExpireTime = function(token) {
    var expires = token.expires_in;
    token.expireTime = Date.now() + expires * 1000 * this.refreshFactor;
};

Authenticator.prototype.decodeJwt = function(token, cb) {


    jwt.verify(token, this.cert, {
        algorithms: ['RS256'],
        ignoreExpiration: true
    }, function(err, decoded) {
        cb(decoded);
    });


};


Authenticator.prototype.refresh = function(token) {
    var self = this;
    return new Promise(function(resolve) {

        request.post({
            url: self.accessTokenUrl,
            form: {
                client_id: self.clientId,
                client_secret: self.clientSecret,
                refresh_token: token.refresh_token,
                grant_type: 'refresh_token'
            }

        }, function(err, response, body) {

            if (err) {
                logger.warn(err);
                resolve(err);
            } else {
                var data = JSON.parse(body);

                self.appendExpireTime(data);
                resolve(data);
            }


        });

    });

};


module.exports = Authenticator;
