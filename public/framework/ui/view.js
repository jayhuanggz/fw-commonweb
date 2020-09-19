define('framework/ui/view', ['framework/base'], function() {

	var View = function(node) {

		var self = this;
		self.id = node[0].id;
		self.node = node;

	};

	View.prototype = {

		getId : function() {
			return this.id;
		},

		show : function() {
			this.node.show();
		},

		getNode : function() {
			return this.node;
		},

		hide : function() {

			this.node.hide();

		}

	};

	FW.namespace('ui').View = View;

});