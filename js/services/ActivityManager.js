var ActivityManager = (function(){
	//Actividades de la aplicación
	var activities = {
		
		DASHBOARD_ACTIVITY:{
			name:"dashboard",
			className:"DashboardActivity",
			file:"dashboardActivity.js",
			status:"",
			auth:"required",
			tokenExpiration:null,
			pitcher:true,
			modules:[
				"templateManager",
				"preferences",
				"logger",
				"webSpeech",
				"utils",
				"serviceLocator",
				"geoLocation",
				"notificator",
				"applicationsManager",
				"searchs",
				"contacts",
				"gui"
			],
			views:{
				main:"dashboard.html",
				uploadpage:"uploadpage.html",
				error:""
			}
		}
	}

	function ActivityManager(environment){

		this.environment = environment;


	}

 
	var getPitcherActivity = function(){

		for(var activity in activities){
			if (activities[activity].pitcher)
				return activities[activity];
		}


	}

	//Informa sobre el tiempo de sesión permitido para una actividad.
	ActivityManager.prototype.getSessionTimeAllowed = function(activity) {
		// body...
	};

	//Informa si una actividad es protegida.
	ActivityManager.prototype.isProtectedActivity = function(activity) {
		// body...
	};

	ActivityManager.prototype.startActivity = function(name) {
			
			var activity = name ? activities[name] : getPitcherActivity();
			//Descargar y muestra la pantalla de carga.
			var uploadpagePath = this.environment.ACTIVITY_VIEWS_BASE_PATH + activity.name + "/" + activity.views.uploadpage;
			this.environment.loadResource("html",uploadpagePath).done(function(html){
				console.log(html);
			});
			/*//Descarga actividad.
			var path = this.enviroment.ACTIVITIES_BASE_PATH + activities[name].file;
			this.enviroment.loadResource(path,function(activity){

				//Descarga interfaz y la muestra.

				//Descarga Módulos.

				//Instacia actividad,inyectándole los módulos y la vista.

				var instance =  new activities[name].className();
				activities[name].instance = instance;
				delete window[activities[name].className];
				//ejecutamos la actividad
				instance.run();
			});

			//Descarga Interfaz.

			//Descarga Módulos.

			//Descarga act*/
		
	};

	return ActivityManager;

})();