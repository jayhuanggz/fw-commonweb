define('framework/utils/chain', ['framework/base'], function() {
	var Chain = function() {
		this.methods = [];
	};

	Chain.prototype = {

		fn : function() {

			var self = this, args = arguments, context, params, fn;

			if (!args || args.length === 0) {
				throw new Error('no arguments are specified!');
			}

			fn = args[0];

			if (args.length > 1) {
				context = args[1];
			}

			if (args.length > 2) {

				params = [];

				var i;
				for (i = 2; i < args.length; i++) {
					params.push(args[i]);
				}
			}

			self.methods.push(new Method(fn, context, params));

			return self;

		},

		delay : function(timeout) {

			if (timeout > 0) {

				var self = this;

				self.methods.push(new Method(timeout));

				return self;

			} else {
				new Error("must specify a timeout greater than 0!");
			}
		},

		run : function() {
			var self = this, i, methods = self.methods, fn;

			if (methods.length > 0) {
				for (i = methods.length - 1; i >= 0; i--) {

					fn = methods[i].wrap(fn);

				}

				fn.call();

			}
			self.methods = undefined;
		}

	};

	var Method = function(fn, context, args) {
		var self = this;

		self.fn = fn;
		self.context = context;
		self.args = args;

	};

	Method.prototype = {

		wrap : function(fn) {

			var self = this;

			if (typeof self.fn === 'number') {

				return function() {
					setTimeout(fn, self.fn);
				};

			} else {

				return function() {

					self.fn.apply(self.context, self.args);
					if (fn) {
						fn.call();
					}
				};

			}

		}

	};
	FW.Chain = Chain;

});