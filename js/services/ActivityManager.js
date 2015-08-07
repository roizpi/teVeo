var ActivityManager = (function(_super,$,environment){

	__extends(ActivityManager, _super);

	//Actividades de la aplicación
	var self,activities;
	

	function ActivityManager(templateManager,managerModule,sessionManager){

		self = this;
		this.templating = templateManager;
		this.managerModule = managerModule;
		this.session = sessionManager;
	
	}

 
	var getPitcherActivity = function(){

		for(var activity in activities){
			if (activities[activity].pitcher)
				return activities[activity];
		}


	}

	ActivityManager.prototype.loadActivities = function() {
		//Obtenemos las actividades configuradas.
		return $.getJSON(environment.RESOURCES_BASE_PATH+"activities.json").done(function(activitiesLoaded){
			activities = activitiesLoaded;
		});
	};

	//Devuelve la actividad actual.
	ActivityManager.prototype.getCurrentActivity = function() {
		for (activity in activities) {
			if (activities[activity].active)
				return activities[activity];
		};
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
		//marcamos la actividad como activa.
		activity.active = true;
		//Descargar y muestra la pantalla de carga.
		this.templating.loadTemplate({
			name:"uploadPage",
			type:"ACTIVITY_UPLOADPAGE_VIEWS",
			handlers:{
				onAfterShow:function(){

					var uploadpage = this;
					//aplicamos animaciones a la página de carga.
					uploadpage.getView("title").get().addClass("fadeInDown").on("webkitAnimationEnd  animationend",function(e){
			            $("<img>",{
			                src:"resources/img/mainLoader.gif",
			                alt:""
			            }).insertAfter(this);
					});
				}
			}
		}).done(function(uploadpage){

			//Ruta de la actividad.
			var activityPath = environment.ACTIVITIES_BASE_PATH + activity.file;
			//Sincronizamos la descarga de la actividad, la interfaz y los módulos.
			$.when(
				environment.loadResource({
					type:"script",
					src:activityPath
				}),
				self.templating.loadTemplate({
					name:"GUI",
					type:"ACTIVITY_VIEWS"
				}),
				self.managerModule.getModules(activity["modules"])
			).done(function(script,view,modules){
				//recogemos el html de la view
				//Instacia actividad inyectándola la vista y los módulos.
				var instance =  new window[activity.className](view,modules);
				//guardamos la instancia.
				activity.instance = instance;
				//eliminamos la clase del contexto global.
				delete window[activity.className];
				uploadpage.detach();
				//ejecutamos la actividad
				instance.run();
				
			});

		});
		
	};

	return ActivityManager;

})(Component,jQuery,environment);