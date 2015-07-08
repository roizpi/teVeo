
var ModuleManager = (function(){

    //Directorio donde se encuentran los modulos
    const BASE_PATH = "js/modules/";
    
    //modules
    var modules = {
        "templateManager":{
            "className":"TemplateManager",
            "fileName":"templateManagerModule.js",
            "order":1,
            "loaded":false,
            "dependences":null,
            "instance":null
        },
        "preferences":{
            "className":"Preferences",
            "fileName":"preferencesModule.js",
            "order":1,
            "loaded":false,
            "dependences":["templateManager"],
            "instance":null
        },
        "logger":{
            "className":"Logger",
            "fileName":"logModule.js",
            "order":2,
            "loaded":false,
            "dependences":null,
            "instance":null
        },
        "webSpeech":{
            "className":"WebSpeech",
            "fileName":"webSpeechModule.js",
            "order":3,
            "loaded":false,
            "dependences":null,
            "instance":null
        },
        "utils":{
            "className":"Utils",
            "fileName":"utils.js",
            "order":4,
            "loaded":false,
            "dependences":null,
            "instance":null
        },
        "serviceLocator":{
            "className":"ServiceLocator",
            "fileName":"serviceLocatorModule.js",
            "order":3,
            "loaded":false,
            "dependences":["logger","utils"],
            "instance":null
        },
        "geoLocation":{
            "className":"GeoLocation",
            "fileName":"geolocationModule.js",
            "order":4,
            "loaded":false,
            "dependences":["serviceLocator"],
            "instance":null
        },
        "notificator":{
            "className":"Notificator",
            "fileName":"notificationsModule.js",
            "order":5,
            "loaded":false,
            "dependences":["templateManager"],
            "instance":null
        },
        "applicationsManager":{
            "className":"ApplicationsManager",
            "fileName":"applicationsModule.js",
            "order":6,
            "loaded":false,
            "dependences":["templateManager","serviceLocator","notificator"],
            "instance":null
        },
        "searchs":{
            "className":"Searchs",
            "fileName":"searchsModule.js",
            "order":7,
            "loaded":false,
            "dependences":["templateManager","serviceLocator","webSpeech","applicationsManager","notificator"],
            "instance":null
        },
        "contacts":{
            "className":"Contacts",
            "fileName":"contactsModule.js",
            "order":8,
            "loaded":false,
            "dependences":["templateManager","serviceLocator","webSpeech","notificator","geoLocation"],
            "instance":null
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
    
    /**
    * Devuelve las dependencias a partir de los nombres.
    * 
    * @param  {Array} arr: names of the dependencies
    * @return {Array} dependencies to bind
    */
    var getDependencies = function(arr) {
        return arr instanceof Array && arr.length ? arr.map(function (value) {
            var o = modules[value] && modules[value].instance;
            if (!o) {
                throw new Error('Dependency ' + value + ' not found');
            }else{
                return o;
            }
        }) : false;
    }
    
    /**
    * Extrae los nombres de las dependencias a inyectar.
    * 
    * @param  {Function} target: function to process
    * @return {Array} 
    */
    var getArgs = function(target) {

        if (!target instanceof Function) {
            throw new TypeError('Target to process should be a Function');
        }else{
    
            var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
            var COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            var SPACES = /[\s|\t|\n|\r]+/mg;
    
            var result = target.toString().match(FN_ARGS);
            //Comprobamos si existe alguna dependencia a inyectar
            if(result && result[1])
                var args = result[1].replace(COMMENTS,'').replace(SPACES,'').split(',');
            else
                var args = false;

            return args;
        }
    }
    
    /**
    * Crea el objeto con las dependencias previamente inyectadas.
    * 
    * @param  {Function} constructor: function to call as constructor
    * @return {Object} object created from its constructor
    */
    var create = function(constructor) {
        var args = getArgs(constructor);
        if (args) {
            var args = [null].concat(getDependencies(args));
            var o = new (Function.prototype.bind.apply(constructor, args))();
        }else{
            var o = new (Function.prototype.bind.apply(constructor))();
        }
        
        return o;
    }
    
    var loadScript = function(src, callback) {
        var s,r,t;
        r = false ;
        s = document. createElement ('script' );
        s.type = 'text/javascript' ;
        s.src = src;
        s.onload = s.onreadystatechange = function () {
            if ( !r && (!this .readyState || this .readyState == 'complete' )){
                r = true ;
                typeof(callback) == "function" && callback();
            }
        };
        t = document.getElementsByTagName ('script')[0];
        t.parentNode.insertBefore (s, t);
    }
    
    var downloadModules = function(callback){
        console.log(modules);
        for(var module in modules)
            (function(currentModule){
                loadScript(BASE_PATH+currentModule.fileName,function(){
                    currentModule.loaded = true;
                    Object.keys(modules).map(function(key){
                        return modules[key].loaded;
                    }).indexOf(false) == -1 && typeof(callback) == "function" && callback(); 
                });
            })(modules[module]);
    }
    
    var loadModules = function(callback){
        downloadModules(function(){
            for(var module in modules){
                console.log("Cargando Módulo : " + modules[module].className);
                modules[module].instance = create(window[modules[module].className]);
                delete window[modules[module].className];

            }
            typeof(callback) == "function" && callback();
        });           
    }


    //API pública
    return{
        loadModules:loadModules
    }

})();