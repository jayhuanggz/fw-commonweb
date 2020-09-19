define('framework/ui/ui', ['framework/ui/loader', 'framework/ui/view', 'framework/utils'], function () {

    var activeView = undefined, ui = FW.namespace('ui'), currentHeader, defaultHeader, headers = {}, currentFooter, defaultFooter, footers = {}, headerTitleAttr = 'title', headerIdAttr = 'data-header';

    footerIdAttr = 'data-footer', none = 'none', content = FW.select('#content');

    var headerNodes = FW.select('#fwui > header');

    if (headerNodes.length > 0) {
        headerNodes.each(function (i) {
            var node = $(this), id = node[0].id;
            headers[id] = node;
            if (i === 0) {
                defaultHeader = node;
                currentHeader = node;
                node.show();

            }

        });
    }

    var footerNodes = FW.select('#fwui > footer');

    if (footerNodes.length > 0) {
        footerNodes.each(function (i) {
            var node = $(this), id = node[0].id;
            footers[id] = node;
            if (i === 0) {
                defaultFooter = node;
                currentFooter = node;
                node.show();
            }

        });
    }

    ui.getHeader = function (id) {

        if (id) {
            return headers[id];
        } else {
            return currentHeader;
        }

    };

    ui.showHeader = function (id) {
        var header;

        if (id) {
            header = headers[id];

            if (!header) {

                if (id === none) {
                    if (currentHeader) {
                        currentHeader.hide();
                        currentHeader = undefined;
                    }

                } else {
                    throw new Error('Header ' + id + ' was not found!');
                }
            }

        } else {
            header = defaultHeader;
        }

        if (header !== currentHeader) {

            if (currentHeader) {
                currentHeader.hide();
            }
            header.show();

            currentHeader = header;

        }

        return header;

    };

    ui.showFooter = function (id) {
        var footer;

        if (id) {
            footer = footers[id];

            if (!footer) {

                if (id === none) {

                    if (currentFooter) {
                        currentFooter.hide();
                        currentFooter = undefined;
                    }

                } else {
                    throw new Error('Footer ' + id + ' was not found!');
                }
            }

        } else {
            footer = defaultFooter;
        }

        if (footer !== currentFooter) {

            if (currentFooter) {
                currentFooter.hide();
            }
            footer.show();

            currentFooter = footer;

        }

        return footer;

    };

    ui.showView = function (id) {

        var target = FW.select('#' + id), headerTitle = target.attr(headerTitleAttr), headerId = target.attr(headerIdAttr), header, footerId = target.attr(footerIdAttr);

        if (!target.hasClass('ui-subview')) {

            header = ui.showHeader(headerId);

            if (headerTitle) {
                var title = header.find('h1');
                if (title.length > 0) {
                    title.html(headerTitle);
                }
            }

            ui.showFooter(footerId);

            ui.slide(activeView ? activeView : undefined, target);

            activeView = target;
        }


    };

    ui.slide = function (curNode, nextNode) {
        if (curNode === nextNode) {
            return;
        }

        if (curNode) {
            curNode.hide();

        }

        nextNode.show();
    };

    ui.setTitle = function (title) {

        currentHeader.find('h1').html(title);
    };

    ui.fixIOSCursor = function () {

        var activeElement = document.activeElement;
        var initialValue;
        if (activeElement && (activeElement.tagName == "INPUT" || activeElement.tagName == "TEXTAREA")) {
            initialValue = activeElement.value;
            if (activeElement.type == "number" || activeElement.type == "week") {
                if (initialValue) {
                    activeElement.value = activeElement.value + 1;
                } else {
                    activeElement.value = (activeElement.type == "week") ? "2013-W10" : 1;
                }
                activeElement.value = initialValue;
            } else {
                activeElement.value = activeElement.value + " ";
                activeElement.value = initialValue;
            }
        }

    };

    ui.getContent = function () {
        return content;
    };

    if (window.Modernizr && Modernizr.ios) {

        $(window).resize(FW.Utils.throttle(FW.ui.fixIOSCursor, 600));

    }

    FW.UI_ID = "fwui";

    ui.node = FW.select('#' + FW.UI_ID);
    document.addEventListener("touchstart", function () {
    }, true);

});
