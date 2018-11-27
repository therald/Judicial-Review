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
		d3.csv("./data/case_data.csv", function (error, cases) {
			var precedent = new Precedent("#precedent", cases);
			var constitutional = new Constitutional("#constitutional", cases);
			var ideology = new Ideology("#ideology_vis", cases, constitutional, precedent);
		});
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