var ManagerModule = (function(_super,$,environment){

    __extends(ManagerModule, _super);

    var self,modules,utilitis;

	function ManagerModule(utils,debug){
        self = this;
        utilitis = utils;
        this.debug = debug;

        
	}

    /*
        //Si todos los módulos se han cargado pasamos el testigo a la siguiente función.
                            Object.keys(modules).filter(function(module){
                                return modulesRequired.indexOf(module) >= 0;
                            }).map(function(module){
                                return modules[module].loaded;
                            }).indexOf(undefined) == -1; 
    
    */


    var extractingModules = function(names){
        //Retornamos los módulos que corresponden con los nombres.
        var extractedModules =  names.map(function(module){
            return modules[module];
        }).filter(function(module){
            //Eliminamos los módulos que no existen y los que ya están cargados.
            return module != undefined && !module.loaded;
        });
        //Ordenamos los módulos ascendentemente 
        return utilitis.orderByInsercionBinariaAsc(extractedModules,"order");
    }

    //Descarga un módulo concreto.
    var downloadModule = function(module){
        //Obtenemos el path del archivo del módulo.
        var path = environment.MODULES_BASE_PATH + module.file;
        
        return environment.loadResource({
            type:"script",
            src:path
        }).done(function(){

            //Módulo Descargado.
            module.loaded = true;
            self.debug.log("MÓDULO: " + module.className + " ha sido descargado","LOG");
            //Antes del Orden.
            //console.log("Antes del Orden");
            //console.log(modulesLoaded);
            //console.log("Después del Orden");
            //console.log(utilitis.orderByInsercionBinariaAsc(modulesLoaded,"order"));// && deferred.resolve(modulesLoaded);
                                                
        }).fail(function(jqxhr, settings, exception){
                console.log(exception);
                self.debug.log("ERROR al cargar Módulo : " + module.className,"ERROR");
                deferred.reject();
        })
    }


    //Descarga un grupo de Módulos especificados en el parámetro modulesRequired.
    var downloadModules = function(modulesRequired){
        
        var promises = [];
        for (var i = 0; i < modulesRequired.length; i++) {
            promises.push(downloadModule(modulesRequired[i]));
        };
        //Sincronizamos todas las promises.
        return $.when.apply($, promises).done(function(){
            self.debug.log("ALL MODULES DOWNLOADED.....","LOG");
        });
            
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
            var modules = extractingModules(names);
            console.log("Modulos Solicitados");
            console.log(names);
            console.log("Módulos mapeados");
            console.log(modules);
            
            //Descargamos los módulos
            console.log("DESCARGANDO MÓDULOS.........");
            console.log("==============================");
            //Descargamos los Módulos que requiere la actividad.
            downloadModules(modules).done(function(){
                console.log("INSTANCIANDO MÓDULOS ...");
                var dependencesManager = environment.getService("DEPENDENCES_MANAGER");
                var instances = dependencesManager.getInstances(modules);
                //resolvemos la promise pasando instancias de módulos.
                deferred.resolve(instances);
            }); 

        };

        return deferred.promise();
    };

    ManagerModule.prototype.getModuleTemplates = function(name) {

        var keyFinded = Object.keys(modules).filter(function(key){
            return modules[key].name.toLowerCase() == name.toLowerCase();
        });

        return keyFinded.length ? modules[keyFinded]["templates"] : null;

    };
   
    
	return ManagerModule;

})(Component,jQuery,environment);