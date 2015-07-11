
var Environment = (function(){

	var self;
	var services = {

		DEPENDENCES_MANAGER:{
			name:"dependencesManager",
			className:"DependencesManager",
			file:"DependencesManager.js",
			type:"system",
			loaded:false,
			instance:null
		},
		TEMPLATE_MANAGER:{
			name:"templateManager",
			className:"TemplateManager",
			file:"templateManager.js",
			type:"application",
			loaded:false,
			instance:null
		},
		MODULE_MANAGER:{
			name:"moduleManager",
			className:"ModuleManager",
			file:"ModuleManager.js",
			type:"application",
			dependences:null,
			loaded:false,
			instance:null
		},
		SESSION_MANAGER:{
			name:"sessionManager",
			className:"SessionManager",
			file:"SessionManager.js",
			type:"application",
			dependences:null,
			loaded:false,
			instance:null
		},
		ACTIVITY_MANAGER:{
			name:"activityManager",
			className:"ActivityManager",
			file:"ActivityManager.js",
			type:"application",
			dependences:["TEMPLATE_MANAGER","MODULE_MANAGER","SESSION_MANAGER"],
			loaded:false,
			instance:null
		},
		HISTORY_MANAGER:{
			name:"historyManager",
			className:"HistoryManager",
			file:"HistoryManager.js",
			type:"application",
			dependences:null,
			loaded:false,
			instance:null
		}
		

	};

	function Environment () {

		//Directorio donde se encuentran los modulos
		this.MODULES_BASE_PATH = "js/modules/";
		//Directorio donde se encuentran las actividades.
		this.ACTIVITIES_BASE_PATH = "js/activities/";
		//Directorio de los servicios
		this.SERVICES_BASE_PATH = "js/services/";
		this.ACTIVITY_VIEWS_BASE_PATH = "resources/templates/activities/";
		//Wallpapers folder.
		this.WALLPAPERS_FOLDER = "resources/img/wallpaper/";
		//themes folder
		this.THEMES_FOLDER = "css/themes/";
		
	}

	var getSystemServices = function(){

		var systemServices = [];
		for(var service in services){
			if(services[service].type.toUpperCase() == "SYSTEM")
				systemServices.push(services[service]);
		}
		return systemServices;
	}

	var getApplicationServices = function(){

		var applicationServices = {};
		for(var service in services){
			if(services[service].type.toUpperCase() == "APPLICATION")
				applicationServices[services[service].name] = services[service];
		}
		return applicationServices;
	
	}

	var downloadModules = function(){
		console.log("Descargando Servicios .....");
		var deferred = $.Deferred();
		for (var service in services)
			(function(currentService){

				self.loadResource("script",self.SERVICES_BASE_PATH + currentService.file).done(function(){
					console.log("Servicio : " + currentService.className + " cargado");
					currentService.loaded = true;
					Object.keys(services).map(function(s){
						return services[s].loaded;
					}).indexOf(false) == -1 && deferred.resolve();  
				}).fail(function(jqxhr, settings, exception){
					deferred.reject();
					console.log(exception);
					console.error("ERROR al cargar servicio : " + service.className)
				})

			})(services[service]);

		return deferred.promise();

	}


	/*
		Métodos Públicos
		=====================
	*/

	var create = function() {
		self = new Environment();
		console.log("Creando entorno .....");
		var deferred = $.Deferred();
		//Descargamos todos los servicios.
		downloadModules().done(function(){
			//Instanciamos servicios del sistema
			var systemServices = getSystemServices();
			for (var i = 0; i < systemServices.length; i++) {
				systemServices[i].instance = new window[systemServices[i].className]();
				delete window[systemServices[i].className];
			};
			//Instanciamos servicios de la aplicación.
			var applicationServices = getApplicationServices();
			services["DEPENDENCES_MANAGER"].instance.getInstances(applicationServices);
			console.log("Estos son los servicios");
			console.log(services);
			deferred.resolve(self);
		});
	

		return deferred.promise();
	};

	Environment.prototype.loadResource = function(type,src,options) {

		// Allow user to set any option except for dataType, cache, and url
		options = $.extend( options || {}, {
		   dataType: type,
		   cache: true,
		   url: src
		});
	 
		// Use $.ajax() since it is more flexible than $.getScript
		// Return the jqXHR object so we can chain callbacks
		return jQuery.ajax( options ).promise();
	};

	Environment.prototype.getService = function(name) {
		return services[name] && services[name].instance;
	};



	return {

		create:create

	};

})();