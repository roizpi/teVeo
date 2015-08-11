var ActivityManager = (function(_super,$,environment){

	__extends(ActivityManager, _super);

	//Actividades de la aplicación
	var self,activities,exceptions;

	

	function ActivityManager(templateManager,managerModule,sessionManager){

		self = this;
		this.templating = templateManager;
		this.managerModule = managerModule;
		this.session = sessionManager;
		exceptions = {
			ACTIVIDAD_NO_PERMITIDAD:{
				name:"ACCESO NO AUTORIZADO A ESTA ACTIVIDAD",
				desc:"sadasdsad"
			},
			ACTIVIDAD_NO_ENCONTRADA:{
				name:"ACCESO NO AUTORIZADO A ESTA ACTIVIDAD",
				desc:"sadasdsad"
			}
		}
	
	}

 
	var getPitcherActivity = function(){

		for(var activity in activities){
			if (activities[activity].pitcher)
				return activities[activity];
		}


	}

	var createActivity = function(activity){
		//Comprobamos si hay otra actividad activa.
		var currentActivity = self.getCurrentActivity();
		if (currentActivity) {
			currentActivity.active = false;
		}
		//marcamos la actividad a crear como activa.
		activity.active = true;
		//Descargar y muestra la pantalla de carga.
		self.templating.loadTemplate({
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
		//Comprobamos si existe la actividad solicitada.
		var activity;

		if (name) {

			if(activities[name]){
				activity = activities[name];
			}else{
				throw new exceptions["ACTIVIDAD_NO_ENCONTRADA"];
			}
			
		}else{
			activity = getPitcherActivity();
		}

		//Comprobamos si la actividad requiere autenticación.
		if (this.isProtectedActivity(activity)){
			//Comprobamos si hay una sessión activa y si el token no ha expirado.
			if (this.session.hasSessionAlive() && this.session.getSessionLife() < this.getSessionTimeAllowed(activity)) {
				//La actividad requiere autenticación y hay una sesión activa.
				createActivity(activity);
			}else{
				//No hay sesión activa, o sí la hay pero el token ha expirado para esta activadad.
				//No es posible iniciarla.
				throw new exceptions["ACTIVIDAD_NO_PERMITIDAD"];
			}
		}else{
			//La actividad no requiere autenticación.
			createActivity(activity);
		
		} 
		
		
	};

	return ActivityManager;

})(Component,jQuery,environment);