define('framework/wx', ['framework/seed', 'lib/jweixin-1.0.0'], function () {

    var wechatApiReady = false, apiQueue = [];


    var jsApiList = ['checkJsApi', 'onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'hideMenuItems', 'showMenuItems', 'hideAllNonBaseMenuItem', 'showAllNonBaseMenuItem', 'translateVoice', 'startRecord', 'stopRecord', 'onRecordEnd', 'playVoice', 'pauseVoice', 'stopVoice', 'uploadVoice', 'downloadVoice', 'chooseImage', 'previewImage', 'uploadImage', 'downloadImage', 'getNetworkType', 'openLocation', 'getLocation', 'hideOptionMenu', 'showOptionMenu', 'closeWindow', 'scanQRCode', 'chooseWXPay', 'openProductSpecificView', 'addCard', 'chooseCard', 'openCard'];


    wx.ready(function () {
        wechatApiReady = true;

        if (apiQueue.length > 0) {
            var i;
            for (i = 0; i < apiQueue.length; i++) {
                try {
                    apiQueue[i].fn.apply(wx, apiQueue[i].args || []);
                } catch (error) {
                    console.log(error);
                }

            }
            apiQueue = [];
        }

    });

    function addFn(fn, args) {

        if (wechatApiReady) {
            try {
                fn.apply(wx, args || []);
            } catch (error) {
                console.log(error);
            }
        } else {
            apiQueue.push({
                fn: fn,
                args: args
            });
        }

    }


    FW.Wechat = {

        config: function (config) {

            config = config || {};
            config.jsApiList = jsApiList;


            wx.config({
                debug: config.debug === undefined ? true : config.debug,
                appId: config.appId,
                timestamp: config.timestamp,
                nonceStr: config.nonceStr,
                signature: config.signature,
                jsApiList: config.jsApiList
            });


        },

        requestPay: function (data, success, error) {

            var wrap = (function (data, success, error) {
                return function () {

                    WeixinJSBridge.invoke(
                        'getBrandWCPayRequest', {
                            "appId": data.appId,     //公众号名称，由商户传入
                            "timeStamp": data.timeStamp,         //时间戳，自1970年以来的秒数
                            "nonceStr": data.nonceStr, //随机串
                            "package": data.package,
                            "signType": data.signType,         //微信签名方式：
                            "paySign": data.sign //微信签名
                        },
                        function (res) {

                            if (res.err_msg == "get_brand_wcpay_request:ok") {
                                success(res);
                            } else {
                                error(res);
                            }
                        });
                };

            })(data, success, error);

            if (typeof WeixinJSBridge == "undefined") {
                if (document.addEventListener) {
                    document.addEventListener('WeixinJSBridgeReady', wrap, false);
                } else if (document.attachEvent) {
                    document.attachEvent('WeixinJSBridgeReady', wrap);
                    document.attachEvent('onWeixinJSBridgeReady', wrap);
                }
            } else {
                wrap();
            }


        },

        hideWechatOptionMenu: function () {

            addFn(function () {
                wx.hideOptionMenu();

            });

        },

        showWechatOptionMenu: function () {

            addFn(function () {

                wx.showOptionMenu();

            });

        },

        previewImage: function (mainUrl, urls) {

            wx.previewImage({
                current: mainUrl,
                urls: urls || []
            });

        },


        shareTimeline: function (imageUrl, url, title, desc, callback) {
            var config = {
                title: title,
                desc: desc,
                link: url,
                imgUrl: imageUrl,
                success: callback,
                cancel: callback
            }, attachEvents = function () {
                wx.onMenuShareTimeline(config);
            };

            addFn(attachEvents);

        },


        shareFriend: function (imageUrl, url, title, desc, callback) {
            var config = {
                title: title,
                desc: desc,
                link: url,
                imgUrl: imageUrl,
                success: callback,
                cancel: callback
            }, attachEvents = function () {
                wx.onMenuShareAppMessage(config);
            };

            addFn(attachEvents);

        },


        initWechatShare: function (imageUrl, url, title, desc, callback) {

            var config = {
                title: title,
                desc: desc,
                link: url,
                imgUrl: imageUrl,
                success: callback,
                cancel: callback
            }, attachEvents = function () {

                wx.onMenuShareTimeline(config);
                wx.onMenuShareAppMessage(config);
                wx.onMenuShareQQ(config);
                wx.onMenuShareWeibo(config);

            };

            addFn(attachEvents);

        }
    };

});
