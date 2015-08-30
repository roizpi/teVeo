var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

var Component = (function (){
    
    function Component(){}
   
    Component.prototype.addEventListener = function(events,callback){
        if((events && isNaN(parseInt(events))) && typeof(callback) == "function"){
            var events = events.trim().replace(/\s+/g,' ').split(" ");
            for(var i = 0,len = events.length; i < len; i++)
                this.events[events[i]] && this.events[events[i]].push(callback);
        }
    }
        
    Component.prototype.triggerEvent = function(event,data){
        if(this.events[event])
            for(var i = 0,len = this.events[event].length; i < len; i++ )
                this.events[event][i].apply(this,[data]);
    }

    Component.prototype.onCreate = function() {};

    return Component;
})();


var Environment = (function(){

	var self;
	var services = {

		DEPENDENCES_MANAGER:{
			name:"dependencesManager",
			className:"DependencesManager",
			file:"DependencesManager.js",
			type:"system",
			loaded:false,
			auto:true,
			instance:null
		},
		DEBUG:{
			name:"debug",
			className:"Debug",
			file:"debug.js",
			type:"application",
			loaded:false,
			auto:true,
			instance:null
		},
		UTILS:{
			name:"utils",
			className:"Utils",
			file:"utils.js",
			type:"application",
			loaded:false,
			auto:true,
			instance:null
		},
		MANAGER_MODULE:{
			name:"managerModule",
			className:"ManagerModule",
			file:"managerModule.js",
			type:"application",
			dependences:["UTILS","DEBUG"],
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
		SESSION_MANAGER:{
			name:"sessionManager",
			className:"SessionManager",
			file:"SessionManager.js",
			type:"application",
			dependences:["DEBUG"],
			loaded:false,
			auto:true,
			instance:null
		},
		HISTORY_MANAGER:{
			name:"historyManager",
			className:"HistoryManager",
			file:"HistoryManager.js",
			type:"application",
			dependences:null,
			loaded:false,
			auto:true,
			instance:null
		},
		ACTIVITY_MANAGER:{
			name:"activityManager",
			className:"ActivityManager",
			file:"ActivityManager.js",
			type:"application",
			dependences:["TEMPLATE_MANAGER","MANAGER_MODULE","SESSION_MANAGER","HISTORY_MANAGER"],
			loaded:false,
			auto:true,
			instance:null
		},
		SERVICE_LOCATOR:{
			name:"serviceLocator",
			className:"ServiceLocator",
			file:"serviceLocator.js",
			type:"application",
			dependences:["UTILS","DEBUG"],
			loaded:false,
			auto:true,
			instance:null
		},
		LOADER_DATA_MANAGER:{
			name:"loaderDataManager",
			className:"LoaderDataManager",
			file:"loaderDataManager.js",
			type:"application",
			dependences:["SERVICE_LOCATOR"],
			loaded:false,
			auto:true,
			instance:null
		}
		

	};

	function Environment () {

		//Directorio de Recursos.
		this.RESOURCES_BASE_PATH = "resources/";
		//Directorio donde se encuentran los modulos
		this.MODULES_BASE_PATH = "js/modules/";
		//Directorio donde se encuentran las actividades.
		this.ACTIVITIES_BASE_PATH = "js/activities/";
		//Directorio de los servicios
		this.SERVICES_BASE_PATH = "js/services/";
		this.ACTIVITY_TEMPLATES_BASE_PATH = "resources/templates/activities/";
		this.MODULES_TEMPLATES_BASE_PATH = "resources/templates/modules/";
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

		var applicationServices = [];
		for(var service in services){
			if(services[service].type.toUpperCase() == "APPLICATION")
				applicationServices.push(services[service]);
		}
		return applicationServices;
	
	}

    var downloadComponents = function(type,componentsRequired){

    	var deferred = $.Deferred();
    	console.log("Descargando Componentes .....");
    	console.log(componentsRequired.join())
    	//Obtenemos la ruta base de los componentes.
    	var basePath = type.toUpperCase() == "SERVICES" ? self.SERVICES_BASE_PATH : self.MODULES_BASE_PATH;
    	var components = type.toUpperCase() == "SERVICES" ? services : modules;
    	for (var i = 0; i < componentsRequired.length; i++) {

    		if(components[componentsRequired[i]]){

    			if(!components[componentsRequired[i]].loaded){
        	 		(function(currentComponent){
                        var componentPath = basePath + currentComponent.file;
                        self.loadResource({
                        	type:"script",
                        	src:componentPath
                        }).done(function(){
                            currentComponent.loaded = true;
                            console.log("Componente : " + currentComponent.className + " ha sido descargado");
                            //Si todos los componentes se han cargado resolvemos la promise.
                            Object.keys(components).filter(function(component){
					            return componentsRequired.indexOf(component) >= 0;
					        }).map(function(component){
					            return components[component].loaded;
					        }).indexOf(false) == -1 && deferred.resolve();
                      
                        }).fail(function(jqxhr, settings, exception){
                        	deferred.reject()
                            console.log(exception);
                            console.error("ERROR al cargar Componente : " + currentComponent.className)
                        });

		            })(components[componentsRequired[i]]);
		        }
    		}
    	}

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
		window.environment = self;
		//Descargamos todos los servicios.
		downloadComponents("SERVICES",Object.keys(services)).done(function(){
			//Instanciamos servicios del sistema
			console.log("Instanciando Servicios");
			var systemServices = getSystemServices();
			for (var i = 0; i < systemServices.length; i++) {
				systemServices[i].instance = new window[systemServices[i].className]();
				delete window[systemServices[i].className];
			};
			//Instanciamos servicios de la aplicación.
			var applicationServices = getApplicationServices();
			services["DEPENDENCES_MANAGER"].instance.getInstances(applicationServices);
			//delete window["environment"];
			$.when(
				services["MANAGER_MODULE"].instance.loadModules(),
				services["ACTIVITY_MANAGER"].instance.loadActivities()
			).done(function(){
				console.log("Actividades y Modulos descargados");
				deferred.resolve(self);
			})
		});
		

		return deferred.promise();
	};

	Environment.prototype.loadResource = function(data) {

		// Allow user to set any option except for dataType, cache, and url
		options = $.extend( data.options || {}, {
		   dataType: data.type || "script",
		   cache: true,
		   url: data.src
		});
	 
		// Use $.ajax() since it is more flexible than $.getScript
		// Return the jqXHR object so we can chain callbacks
		return jQuery.ajax(options).promise();
	};

	Environment.prototype.getService = function(name) {
		return services[name] && services[name].instance;
	};

	Environment.prototype.getContext = function() {
		return services["ACTIVITY_MANAGER"].instance.getCurrentActivity();
	};

	
	return {

		create:create

	};

})();