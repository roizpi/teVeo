var DependencesManager = (function(){

    var source;

	function DependencesManager(){


	}

	/**
    * Devuelve las dependencias a partir de los nombres.
    * 
    * @param  {Array} arr: names of the dependencies
    * @return {Array} dependencies to bind
    */
    var getDependencies = function(arr) {
        return arr instanceof Array && arr.length ? arr.map(function (value) {
            var o = source[value] && source[value].instance;
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

    DependencesManager.prototype.getInstances = function(components) {
    	source = components;
        console.log("Componentes a instanciar....");
        console.log(components);
        for(var component in components){
            var currentComponent = components[component];
            console.log("Cargando Componente : " + currentComponent.className);
            if (!currentComponent.instance) {
                currentComponent.instance = create(window[currentComponent.className]);
            };
            delete window[currentComponent.className];

        }
    
    };


	return DependencesManager;


})();