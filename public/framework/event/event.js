define('framework/event/event', ['framework/event/event_target'], function () {

    var globalEventTarget = new FW.Event.EventTarget();

    FW.on = function () {
        return globalEventTarget.on.apply(globalEventTarget, arguments);
    };

    FW.off = function () {
        return globalEventTarget.off.apply(globalEventTarget, arguments);
    };

    FW.fire = function () {
        return globalEventTarget.fire.apply(globalEventTarget, arguments);
    };

    FW.before = function () {
        return globalEventTarget.before.apply(globalEventTarget, arguments);
    };

    FW.after = function () {
        return globalEventTarget.after.apply(globalEventTarget, arguments);
    };

    FW.publish = function () {
        return globalEventTarget.publish.apply(globalEventTarget, arguments);
    };

    FW.once = function () {
        return globalEventTarget.once.apply(globalEventTarget, arguments);
    };

}); 