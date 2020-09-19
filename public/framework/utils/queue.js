define('framework/utils/queue', function () {
    var Queue = function (config) {
        var self = this;
        self.task = [];
        //正在执行的任务数量
        self.currentlyRunningTasks = 0;
        self.baseSize = config.baseSize || 2;
        self.complete = config.complete;
        self.start = config.start;

        self.started = false;
    };

    Queue.prototype = {
        addTask: function (fn, sync) {
            this.task.unshift(new Task(this, fn, sync));
        },
        next: function () {
            var self = this;
            if (this.currentlyRunningTasks > 0) {
                this.currentlyRunningTasks--;
            }
            if (this.task.length <= 0) {

                if (self.currentlyRunningTasks <= 0 && self.started) {
                    if (self.complete) {
                        self.complete.call(self);
                        self.started = false;

                    }
                }
            } else {

                if (!self.started) {
                    self.started = true;
                    if (self.start) {
                        self.start.call(self);
                    }

                }


                if (this.currentlyRunningTasks === 0) {
                    var count = Math.min(this.task.length, this.baseSize);
                    this.currentlyRunningTasks = count;

                    if (count > 0) {
                        for (var i = 0; i < count; i++) {
                            var task = this.task.pop();
                            task.execute();
                        }
                    }
                }

            }
        }
    };

    var Task = function (queue, fn, sync) {
        var self = this;
        self.fn = fn;
        self.queue = queue;
        self.sync = sync !== false;
    };

    Task.prototype = {
        execute: function () {
            var fn = this.fn;
            if (fn && typeof fn === 'function') {
                if (this.sync) {
                    fn();
                    this.queue.next();
                } else {
                    fn(this.queue);
                }
            }
        }
    };


    FW.Utils.Queue = Queue;

});
