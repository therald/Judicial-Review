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
			var precedent = new Precedent("#precedent_vis", cases);
			var constitutional = new Constitutional("#constitutional", cases);
			var ideology = new Ideology("#ideology_vis", "#justices_vis", cases);
			var filters = new Filters("#time_filter", "#issue_area_filter", cases, ideology, constitutional, precedent);
		});

		window.addEventListener("scroll", function() {
			var distanceFromTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop;
	        if (distanceFromTop >= document.getElementById('header').offsetHeight)
	        {
	            document.getElementById("filters").classList.add('fixed');
	            document.getElementById("hidden-filters").classList.add('displayed');
	        }
	        else
	        {
	            document.getElementById("filters").classList.remove('fixed');
	            document.getElementById("hidden-filters").classList.remove('displayed');
	        }
		})
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