var ManagerModule = (function(_super,$,environment){

    __extends(ManagerModule, _super);

    var self,modules,utilitis;

	function ManagerModule(utils){
        self = this;
        utilitis = utils;
        
	}


    //Comprueba si todos los módulos especificados están cargados.
  

    var downloadModules = function(modulesRequired,callback){
        var deferred = $.Deferred();
        var modulesLoaded = {};
        for (var i = 0; i < modulesRequired.length; i++) {
        	if(modules[modulesRequired[i]]){
        	 	if(!modules[modulesRequired[i]].loaded){
        	 		(function(currentModule){
                        var path = environment.MODULES_BASE_PATH + currentModule.file;
                        environment.loadResource({
                            type:"script",
                            src:path
                        }).done(function(){
                            currentModule.loaded = true;
                            modulesLoaded[currentModule.name] = currentModule;
                            console.log("Módulo : " + currentModule.className + " ha sido descargado");
                            //Si todos los módulos se han cargado pasamos el testigo a la siguiente función.
                            Object.keys(modules).filter(function(module){
                                return modulesRequired.indexOf(module) >= 0;
                            }).map(function(module){
                                return modules[module].loaded;
                            }).indexOf(undefined) == -1; 
                            //Antes del Orden.
                            console.log("Antes del Orden");
                            console.log(modulesLoaded);
                            console.log("Después del Orden");
                            console.log(utilitis.orderByInsercionBinariaAsc(modulesLoaded,"order"));// && deferred.resolve(modulesLoaded);
                        }).fail(function(jqxhr, settings, exception){
                            console.log(exception);
                            console.error("ERROR al cargar Módulo : " + currentModule.className);
                            deferred.reject();
                        })
		            })(modules[modulesRequired[i]]);
		        }
        	}else{
        		console.err(modulesRequired[i] + " NOT FOUND")
        	}
        };

        return deferred.promise();
            
    }

    /*
		
		API Pública
		===============================

    */
    //Carga todos los módulos configurados.
    ManagerModule.prototype.loadModules = function() {

        //Obtenemos los módulos configuradas.
        return $.getJSON(environment.RESOURCES_BASE_PATH+"modules.json").done(function(modulesLoaded){
            modules = modulesLoaded;
        });
    };

    //Cargador de Módulos

    ManagerModule.prototype.getModules = function(names) {
        var deferred = $.Deferred();
        if (names.constructor.toString().match(/array/i)) {
            //Descargamos los módulos
            console.log("Descargando Módulos");
            downloadModules(names).done(function(modules){
                console.log("Instanciando módulos...");
                console.log("INSTANCIAS");
                console.log(modules);
                var dependencesManager = environment.getService("DEPENDENCES_MANAGER");
                var instances = dependencesManager.getInstances(modules);

                //resolvemos la promise pasando instancias de módulos.
                deferred.resolve(instances);
            }); 

        };

        return deferred.promise();
    };
   
    
	return ManagerModule;

})(Component,jQuery,environment);