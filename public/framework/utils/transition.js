define('framework/utils/transition', ['framework/seed'], function () {

    var ALL_CLASSES = 'page-on-center page-on-left page-on-right page-on-bottom', Transition = FW.extend('page_transition', FW.Base, {

        defaults: {
            transitionTimeout: 400
        },


        transition: function (node, dir, fn) {
            node.removeClass(ALL_CLASSES).addClass('sliding');
            var transition = Transition.transitions[dir];
            if (!transition) {
                throw new Error('transition ' + dir + ' not found!');
            }
            var self = this;

            transition.call(self, self, node, fn);
        },

        doTransition: function (timeout, fn) {
            var self = this;


            var wrap = (function (context, fn) {
                return function () {
                    fn.call(context);
                };
            })(self, fn);

            self.timeout = setTimeout(wrap, timeout);
        }

    });

    Transition.transitions = {

        centerToLeft: function (instance, node, fn) {
            node.addClass('center-to-left');
            var timeout = instance.get('transitionTimeout');
            instance.doTransition(timeout, function () {
                node.addClass('page-on-left').removeClass('center-to-left sliding');
                fn && fn();
            });


        },
        leftToCenter: function (instance, node, fn) {
            node.addClass('left-to-center');
            var timeout = instance.get('transitionTimeout');
            instance.doTransition(timeout, function () {
                node.addClass('page-on-center').removeClass('left-to-center sliding');
                fn && fn();
            });

        },
        centerToRight: function (instance, node, fn) {
            node.addClass('center-to-right');
            var timeout = instance.get('transitionTimeout');
            instance.doTransition(timeout, function () {
                node.addClass('page-on-right').removeClass('center-to-right sliding');
                fn && fn();
            });
        },
        rightToCenter: function (instance, node, fn) {
            node.addClass('right-to-center');
            var timeout = instance.get('transitionTimeout');
            instance.doTransition(timeout, function () {
                node.addClass('page-on-center').removeClass('right-to-center sliding');
                fn && fn();

            });
        },

        bottomToCenter: function (instance, node, fn) {
            node.addClass('bottom-to-center');
            var timeout = instance.get('transitionTimeout');
            instance.doTransition(timeout, function () {
                node.addClass('page-on-center').removeClass('bottom-to-center sliding');
                fn && fn();

            });
        },
        centerToBottom: function (instance, node, fn) {
            node.addClass('center-to-bottom');
            var timeout = instance.get('transitionTimeout');
            instance.doTransition(timeout, function () {
                node.addClass('page-on-bottom').removeClass('center-to-bottom sliding');
                fn && fn();
            });
        }
    };

    FW.Transition = Transition;
});
