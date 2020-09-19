define('framework/utils/utils', ['framework/utils/lang', 'framework/utils/chain', 'framework/utils/resources', 'framework/utils/cache_manager'], function () {
    var charSet = 'abcdefghijklmnopqrstuvwxyz0123456789', UNIQUE_IDS = {}, Utils = {

        addRandom: function () {
            var result = '', i;

            while (true) {
                for (i = 0; i < 12; i += 1) {
                    result += charSet.charAt(Math.floor(Math.random() * 36));
                }

                if (!UNIQUE_IDS.hasOwnProperty(result)) {
                    UNIQUE_IDS[result] = result;
                    return result;
                }

            }
        },

        removeRandom: function (id) {
            delete UNIQUE_IDS[id];
        },
        throttle: function (func, delay) {
            var timer = null;

            return function () {
                var context = this, args = arguments;

                if (timer == null) {
                    timer = setTimeout(function () {
                        func.apply(context, args);
                        timer = null;
                    }, delay);
                }
            };
        },
        debounce: function (func, delay, immediate) {
            immediate = immediate !== false;

            var timeout, result;
            return function () {
                var context = this, args = arguments;
                var later = function () {
                    timeout = null;
                    if (!immediate) {
                        result = func.apply(context, args);
                    }
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, delay);
                if (callNow) {
                    result = func.apply(context, args);
                }
                return result;
            };
        },
        getRequestParams: function () {

            var url = decodeURI(location.search); //获取url中"?"符后的字串

            var theRequest = {}, strs;
            if (url.indexOf("?") != -1) {
                var str = url.substr(1);
                strs = str.split("&");
                for (var i = 0; i < strs.length; i++) {
                    theRequest[strs[i].split("=")[0]] = (strs[i].split("=")[1]);
                }
            }
            return theRequest;
        },
        parseParams: function (query) {
            var query_string = {};
            var vars = query.split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                pair[0] = decodeURIComponent(pair[0]);
                pair[1] = decodeURIComponent(pair[1]);
                // If first entry with this name
                if (typeof query_string[pair[0]] === "undefined") {
                    query_string[pair[0]] = pair[1];
                    // If second entry with this name
                } else if (typeof query_string[pair[0]] === "string") {
                    var arr = [query_string[pair[0]], pair[1]];
                    query_string[pair[0]] = arr;
                    // If third or later entry with this name
                } else {
                    query_string[pair[0]].push(pair[1]);
                }
            }
            return query_string;
        }
    };

    FW.Utils = Utils;

});
