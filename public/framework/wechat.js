define('framework/wechat', ['framework/seed', 'wechat'], function () {

    var wechatApiReady = false, apiQueue = [];


    var jsApiList = ['checkJsApi', 'onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'hideMenuItems', 'showMenuItems', 'hideAllNonBaseMenuItem', 'showAllNonBaseMenuItem', 'translateVoice', 'startRecord', 'stopRecord', 'onRecordEnd', 'playVoice', 'pauseVoice', 'stopVoice', 'uploadVoice', 'downloadVoice', 'chooseImage', 'previewImage', 'uploadImage', 'downloadImage', 'getNetworkType', 'openLocation', 'getLocation', 'hideOptionMenu', 'showOptionMenu', 'closeWindow', 'scanQRCode', 'chooseWXPay', 'openProductSpecificView', 'addCard', 'chooseCard', 'openCard'];


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

    var tryCount = 0;

    wx.error(function (res) {
        if (tryCount <= 3) {
            tryCount++;
            FW.Wechat.init(true);
        } else {
            throw new Error(res.errMsg || res.err_msg);

        }


    });

    FW.Wechat = {

        isReady: function () {
            return wechatApiReady;
        },

        ready: function (fn, context) {

            var self = this;

            if (self.isReady()) {
                fn.call(context);
            } else {
                FW.once('wechatReady', fn, context);
            }

        },

        init: function (url, force) {
            force = force === true;

            $.ajax({
                    url: url,
                    method: 'post',
                    data: {
                        url: location.href.split('#')[0],
                        force: force
                    },
                    success: function (data) {
                        wx.config({
                            debug: data.debug === undefined ? true : data.debug,
                            appId: data.appId,
                            timestamp: data.timestamp,
                            nonceStr: data.nonceStr,
                            signature: data.signature,
                            jsApiList: jsApiList
                        });


                        wx.ready(function () {
                            wechatApiReady = true;
                            FW.fire('wechatReady');
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
                    }
                }
            )
            ;
        },

        hideWechatOptionMenu: function () {

            addFn(function () {
                wx.hideOptionMenu();

            });

        }
        ,

        showWechatOptionMenu: function () {

            addFn(function () {

                wx.showOptionMenu();

            });

        }
        ,

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
    }
    ;

})
;
