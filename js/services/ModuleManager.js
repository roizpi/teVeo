
var ModuleManager = (function(){

    var self;
    //modules
    var modules = {
        
        templateManager:{
            className:"TemplateManager",
            fileName:"templateManagerModule.js",
            order:1,
            loaded:false,
            dependences:null,
            instance:null
        },
        preferences:{
            className:"Preferences",
            fileName:"preferencesModule.js",
            order:1,
            loaded:false,
            dependences:["templateManager"],
            instance:null
        },
        logger:{
            className:"Logger",
            fileName:"logModule.js",
            order:2,
            loaded:false,
            dependences:null,
            instance:null
        },
        webSpeech:{
            className:"WebSpeech",
            fileName:"webSpeechModule.js",
            order:3,
            loaded:false,
            dependences:null,
            instance:null
        },
        utils:{
            className:"Utils",
            fileName:"utils.js",
            order:4,
            loaded:false,
            dependences:null,
            instance:null
        },
        serviceLocator:{
            className:"ServiceLocator",
            fileName:"serviceLocatorModule.js",
            order:3,
            loaded:false,
            dependences:["logger","utils"],
            instance:null
        },
        geoLocation:{
            className:"GeoLocation",
            fileName:"geolocationModule.js",
            order:4,
            loaded:false,
            dependences:["serviceLocator"],
            instance:null
        },
        notificator:{
            className:"Notificator",
            fileName:"notificationsModule.js",
            order:5,
            loaded:false,
            dependences:["templateManager"],
            instance:null
        },
        applicationsManager:{
            className:"ApplicationsManager",
            fileName:"applicationsModule.js",
            order:6,
            loaded:false,
            dependences:["templateManager","serviceLocator","notificator"],
            instance:null
        },
        searchs:{
            className:"Searchs",
            fileName:"searchsModule.js",
            order:7,
            loaded:false,
            dependences:["templateManager","serviceLocator","webSpeech","applicationsManager","notificator"],
            instance:null
        },
        contacts:{
            className:"Contacts",
            fileName:"contactsModule.js",
            order:8,
            loaded:false,
            dependences:["templateManager","serviceLocator","webSpeech","notificator","geoLocation"],
            instance:null
        },
        "gui":{
            "className":"GUI",
            "fileName":"guiModule.js",
            "order":9,
            "loaded":false,
            "dependences":["serviceLocator","searchs","contacts","applicationsManager","notificator"],
            "instance":null
        }
    };


	function ModuleManager(){
        self = this;
	}

    


    //Comprueba si todos los módulos especificados están cargados.
    var allLoadedModules = function(modulesRequired){
        return Object.keys(modules).filter(function(module){
            return modulesRequired.indexOf(module) >= 0;
        }).map(function(module){
            return modules[module].loaded;
        }).indexOf(false) == -1; 
    }
    
    
    var downloadModules = function(modulesRequired,callback){
        for (var i = 0; i < modulesRequired.length; i++) {
        	if(modules[modulesRequired[i]]){
        	 	if(!modules[modulesRequired[i]].loaded){
        	 		(function(currentModule){
                        var modulePath = self.environment.MODULES_BASE_PATH + currentModule.fileName;
                        self.environment.loadResource("script",modulePath).done(function(){
                            currentModule.loaded = true;
                            console.log("Módulo : " + currentModule.className + " ha sido descargado");
                            //Si todos los módulos se han cargado pasamos el testigo a la siguiente función.
                            allLoadedModules(modulesRequired) && typeof(callback) == "function" && callback(); 
                        }).fail(function(jqxhr, settings, exception){
                            console.log(exception);
                            console.error("ERROR al cargar Módulo : " + currentModule.className)
                        })
		            })(modules[modulesRequired[i]]);
		        }
        	}else{
        		console.err(modulesRequired[i] + " NOT FOUND")
        	}
        };
            
    }

    /*
		
		API Pública
		===============================

    */

    //Cargador de Módulos
    ModuleManager.prototype.loadModules = function(modulesRequired){

        var deferred = $.Deferred();
    	if (modulesRequired.constructor.toString().match(/array/i)) {
    		//Descargamos los módulos
            console.log("Descargando Módulos");
    		downloadModules(modulesRequired,function(){
                console.log("Instanciando módulos...");
                var instances = dependencesManager.getInstances(modules,modulesRequired)
                //resolvemos la promise pasando instancias de módulos.
                deferred.resolve(instances);
        	}); 

    	};

        return deferred.promise();
                  
    }
    
	return ModuleManager;

})();