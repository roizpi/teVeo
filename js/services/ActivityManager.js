var ActivityManager = (function(){

	var self;
	//Actividades de la aplicación
	var activities = {
		
		DASHBOARD_ACTIVITY:{
			name:"DASHBOARD",
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
			]
		}
	}


	function ActivityManager(templateManager,moduleManager,sessionManager){

		self = this;
		this.templating = templateManager;
		this.moduleManager = moduleManager;
		this.session = sessionManager;
	
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
		templating.loadUploadPage(activity.name,function(){

			var moduleManager = self.environment.getService("MODULE_MANAGER");
			//Ruta de la actividad.
			var activityPath = self.environment.ACTIVITIES_BASE_PATH + activity.file;
			//Ruta de la interfaz de la actividad.
			var activityInterfacePath = self.environment.ACTIVITY_VIEWS_BASE_PATH + activity.views.main;
			//Sincronizamos la descarga de la actividad, la interfaz y los módulos.
			$.when(
				self.environment.loadResource("script",activityPath),
				self.environment.loadResource("html",activityInterfacePath),
				moduleManager.loadModules(activity.modules)
			).then(function(script,view,modules){
				var $view = $(view[0]);
				$view.appendTo("body");
				//Instacia actividad,inyectándole el entorno, la vista y los módulos.
				var instance =  new window[activity.className](self.environment,$view,modules);
				activity.instance = instance;
				delete window[activity.className];
				//ejecutamos la actividad
				instance.run();
				//Eliminamos pantalla de carga.
				$uploadpage.fadeOut(1000,function(){
					$(this).remove();
				});
			});

		})
		var uploadpagePath = self.environment.ACTIVITY_VIEWS_BASE_PATH + activity.views.uploadpage;
		
	};

	return ActivityManager;

})();