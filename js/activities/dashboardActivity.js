
var DashboardActivity = (function(){


	function DashboardActivity (environment,view,modules) {

		this.environment = environment;
		this.view = view;
		this.modules = modules;
	}

	DashboardActivity.prototype.run = function() {
		console.log("Corriendo Actividad");
		console.log("Estos son los módulos");
		console.log(this.modules);
	};


	return DashboardActivity;

})();
