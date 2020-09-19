(function () {

    var logError = function (url) {
        window.onerror = function (message, file, line, col, error) {


            var http = new XMLHttpRequest();
            var data = JSON.stringify({
                file: file,
                line: line,
                col: col,
                message: message,
                url: location.href,
                appId: 'daily',
                userAgent: navigator.userAgent,
                stack: error ? error.stack : ''
            });
            http.open("POST", url, true);

            http.setRequestHeader("Content-type", "application/json");
            http.setRequestHeader("Content-length", data.length);
            http.setRequestHeader("Connection", "close");
            http.send(data);


        };
    };

    window.logError = logError;


})();