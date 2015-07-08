
var Environment = (function(){

	var self;
	var services = {

		MODULE_MANAGER:{
			className:"ModuleManager",
			file:"ModuleManager.js",
			loaded:false,
			instance:null
		},
		ACTIVITY_MANAGER:{
			className:"ActivityManager",
			file:"ActivityManager.js",
			loaded:false,
			instance:null
		},
		SESSION_MANAGER:{
			className:"SessionManager",
			file:"SessionManager.js",
			loaded:false,
			instance:null
		},
		HISTORY_MANAGER:{
			className:"HistoryManager",
			file:"HistoryManager.js",
			loaded:false,
			instance:null
		}

	};

	function Environment () {
		self = this;
		//Directorio donde se encuentran los modulos
		this.MODULES_BASE_PATH = "js/modules/";
		//Directorio donde se encuentran las actividades.
		this.ACTIVITIES_BASE_PATH = "js/activities/";
		//Directorio de los servicios
		this.SERVICES_BASE_PATH = "js/services/";
		this.ACTIVITY_VIEWS_BASE_PATH = "resources/templates/activities/";
		
	}


	/*
		Métodos Públicos
		=====================
	*/

	Environment.prototype.init = function() {

		var deferred = $.Deferred();
		for (var service in services)
			(function(currentService){

				self.loadResource("script",self.SERVICES_BASE_PATH + currentService.file).done(function(){
					console.log("Servicio : " + currentService.className + " cargado");
					currentService.loaded = true;
					currentService.instance = new window[currentService.className](self);
					delete window[currentService.className];
					 Object.keys(services).map(function(s){
						return services[s].loaded;
					}).indexOf(false) == -1 && deferred.resolve(self);  
				}).fail(function(jqxhr, settings, exception){
					deferred.reject();
					console.log(exception);
					console.error("ERROR al cargar servicio : " + service.className)
				})

			})(services[service]);

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
		return jQuery.ajax( options );
	};

	Environment.prototype.getService = function(name) {
		return services[name] && services[name].instance;
	};

	return Environment;

})();