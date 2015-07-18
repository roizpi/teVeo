var ActivityManager = (function(_super,environment){

	__extends(ActivityManager, _super);

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
			instance:null,
			modules:[
				"preferences",
				"webSpeech",
				"geoLocation",
				"notificator",
				"applicationsManager",
				"searchs",
				"contacts"
			]
		}
	}


	function ActivityManager(templateManager,sessionManager){

		self = this;
		this.templating = templateManager;
		this.session = sessionManager;
	
	}

 
	var getPitcherActivity = function(){

		for(var activity in activities){
			if (activities[activity].pitcher)
				return activities[activity];
		}


	}

	ActivityManager.prototype.getCurrentActivity = function() {
		// body...
	};

	//Informa sobre el tiempo de sesión permitido para una actividad.
	ActivityManager.prototype.getSessionTimeAllowed = function(activity) {
		// body...
	};

	//Informa si una actividad es protegida.
	ActivityManager.prototype.isProtectedActivity = function(activity) {
		// body...
	};
	//Inicia una nueva actividad
	ActivityManager.prototype.startActivity = function(name) {
		//Comprobamos si existe actividad con ese nombre, en caso contrario lanzamos
		// actividad principal.
		var activity = name ? activities[name] : getPitcherActivity();
		//Descargar y muestra la pantalla de carga.
		this.templating.loadUploadPage(activity.name,function(){
			//Ruta de la actividad.
			var activityPath = environment.ACTIVITIES_BASE_PATH + activity.file;
			//Ruta de la interfaz de la actividad.
			var activityInterfacePath = environment.ACTIVITY_VIEWS_BASE_PATH + activity.main.file;
			//Sincronizamos la descarga de la actividad, la interfaz y los módulos.
			$.when(
				environment.loadResource({
					type:"script",
					src:activityPath
				}),
				environment.loadResource({
					type:"html",
					src:activityInterfacePath
				}),
				environment.getModules(activity.modules)
			).then(function(script,view,modules){
				//recogemos el html de la view
				var $view = $(view[0]);
				//lo añadimos al body
				$view.appendTo("body");
				//Instacia actividad,inyectándole el entorno, la vista y los módulos.
				var instance =  new window[activity.className](self.environment,$view,modules);
				//guardamos la instancia.
				activity.instance = instance;
				//eliminamos la clase del contexto global.
				delete window[activity.className];
				//ejecutamos la actividad
				instance.run();
				//Eliminamos pantalla de carga.
				$uploadpage.fadeOut(1000,function(){
					$(this).remove();
				});
			});

		});
		
	};

	return ActivityManager;

})(Component,environment);