var LoaderDataManager = (function(_super,$,environment){

	__extends(LoaderDataManager, _super);

	var manager;

	function LoaderDataManager(serviceLocator){
		manager = this;
		this.serviceLocator = serviceLocator;
	}


	var LoaderData = (function(_super){

		__extends(LoaderData, _super);

		var self,exclusions = [],filterValue,filterField,id;

		function LoaderData(config){
			self = this;
			this.minResultShown = config.minResultShown;
			this.dataStepts = config.dataStepts;
			this.container = config.container || null;
			this.service = config.service;
		}

		var getData = function(config){

			return manager.serviceLocator[self.service]({
				id:config.id,
				value:config.filterValue,
                field:config.filterField,
                start:config.start,
                count:config.count,  
                exclusions:self.exclusions
            })
			.done(function(data){
				console.log("Esta es la data obtenida");
				console.log(data);
			})
			.fail(function(){

			});
		}

		var filter = function(){
			
            //Creamos la expresión regular especificando el valor como una captura.
            var regExp = new RegExp("(" + filterValue + ")","i");
            //Recorremos los mensajes actuales en el DOM si existen.
            self.container.hideChildsByFilter(true,function(element){
                if (element.get().find("[data-"+filterField.toLowerCase()+"]").text().match(regExp)) {
                    self.exclusions.push(element.get().data("id"));
                    return false; 
                }else{
                    return true;
                }
            });

                        console.log("SIZE");
            console.log(self.container.size());
            console.log("EXCLUSIONES");
            console.log(self.exclusions);
            //Devolvemos la diferencia
            return self.minResultShown - self.container.size();

		}

		var configureLoad = function(config){

			if(config.id){
                id = config.id;
            }


			//Obtenemos el valor del filtro.
            if(config.filter && config.filter.value){
                filterValue = config.filter.value;
            }
            //Obtenemos el campo para el filtro.
            if(config.filter && config.filter.field){
                filterField = config.filter.field;
            }

            var callbacks = {};
            if (config.callbacks) {
            	if(typeof(config.callbacks.onDataLoaded) == "function"){
            		callbacks.onDataLoaded = config.callbacks.onDataLoaded;
            	}
            	if(typeof(config.callbacks.onNoDataFound) == "function"){
            		callbacks.onNoDataFound = config.callbacks.onNoDataFound;
            	}

            };

            return {
            	type:config.type.toUpperCase(),
            	id:id,
            	filterValue:filterValue,
            	filterField:filterField,
            	callbacks:callbacks
            }
		}

		/*API Pública*/

		LoaderData.prototype.setContainer = function(container) {
			this.container = container;
		};

		LoaderData.prototype.load = function(config) {
			
			var config = configureLoad(config);

			var promise = null;

			if (config.type === "FILTER_AND_LOAD") {
				var diff = filter();
				if (diff > 0) {
					promise = getData({
						id:config.id,
						filterValue:config.filterValue,
						filterField:config.filterField,
	                	start:0,
	                    count:diff
                	});
				};
				
			}else{
				promise = getData({
					id:config.id,
					filterValue:config.filterValue,
					filterField:config.filterField,
					start:0,
                    count:self.minResultShown
				});
			}

			promise.done(function(data){
				if(data && data.length){
                    config.callbacks && config.callbacks.onDataLoaded(data);
                }else{
                    //Ningún resultado encontrado.
                    !self.container.size() &&  config.callbacks.onNoDataFound();
                }
			});

		};


		return LoaderData

	})(_super);

	LoaderDataManager.prototype.createLoader = function(config) {
		return new LoaderData(config);
	};


	return LoaderDataManager;

})(Component,jQuery,environment);