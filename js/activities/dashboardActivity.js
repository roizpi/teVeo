
var DashboardActivity = (function(){


	function DashboardActivity (environment,view,modules) {

		this.environment = environment;
		this.view = view;
		this.modules = modules;
	}

	DashboardActivity.prototype.run = function() {
		Alert("Corriendo la Actividad!!!");
	};


})();
