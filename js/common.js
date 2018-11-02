document.addEventListener("DOMContentLoaded", function(){
	begin();
});

/**
 * Handles preliminary data loading and creation of the other classes
 */
function begin() {
	var instance = null;

	/**
	 * Load any necessary data, then create instances of every class
	 */
	function init() {
		var precedent = new Precedent("#precedent");
		var ideology = new Ideology("#ideology");
		var constitutional = new Constitutional("#constitutional");
	}

	/**
	 * Checks for invalid instance creation
	 * @constructor
	 */
	function Main() {
		if (instance !== null) {
			throw new Error("Cannot instantiate more than one instance of the controlling class");
		}
	}

	Main.getInstance = function() {
		var self = this;
		if (self.instance == null) {
			self.instance = new Main();

			init();
		}
		return instance;
	}

	Main.getInstance();
}