(function () {
    var storage = window.localStorage ||localStorage,
        queue = [],
        pending = false,
        ajax = $.ajax;


    var tokenCache;

    var TokenStore = {

        name: 'X-AUTH-TOKEN',
        init: function (config) {
            TokenStore.name = config.name;
            TokenStore.refreshUrl = config.refreshUrl;

        },

        get: function (cb) {
            var token = tokenCache ? tokenCache : storage.getItem(TokenStore.name);
            tokenCache = token;
            if (pending) {
                queue.push(cb);
            } else {
                if (token) {


                    if (typeof token === 'string') {
                        token = JSON.parse(token);
                    }

                    if (token.expireTime <= Date.now()) {
                        pending = true;
                        queue.push(cb);
                        ajax({
                            url: TokenStore.refreshUrl,
                            method: 'post',
                            headers: {
                                'X-AUTH-TOKEN': JSON.stringify(token)
                            },
                            success: function (data) {
                                if (data.access_token) {
                                    token = data;
                                    TokenStore.set(token);
                                } else {
                                    TokenStore.remove();
                                    token = undefined;
                                }


                            },
                            complete: function () {
                                pending = false;
                                TokenStore._execute(token);
                            }
                        });
                    } else {
                        cb(token);
                    }

                } else {
                    cb(token);
                }
            }


        },

        _execute: function (token) {


            while (queue.length > 0) {
                queue.pop()(token);
            }


        },

        set: function (token) {

            tokenCache = token;
            if (token === undefined || token === null) {
                this.remove();
            } else {

                if (typeof token !== 'string') {
                    token = JSON.stringify(token);
                }

                try {
                    storage.setItem(TokenStore.name, token);

                } catch (err) {
                    storage.clear();
                    storage.setItem(TokenStore.name, token);
                }
            }

        },
        remove: function () {
            storage.removeItem(TokenStore.name);
            tokenCache = undefined;
        }

    };

    window.TokenStore = TokenStore;


})();