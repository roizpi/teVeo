var LoaderDataManager = (function(_super,$,environment){

	__extends(LoaderDataManager, _super);

	var services;
	var loaders = [];

	function LoaderDataManager(serviceLocator){
		services = serviceLocator;
	}


	var LoaderData = (function(_super){

		__extends(LoaderData, _super);

		var self;

		function LoaderData(config){
			self = this;
			this.lastRequest = {};
			this.countData = 0;
			this.minResultShown = config.minResultShown;
			this.dataStepts = config.dataStepts;
			this.service = config.service;	
		}

		var getData = function(request){

			return services[self.service]({
				idConv:request.idConv,
				type:request.filterType,
				field:request.filterField,
				value:request.filterValue,
                start:request.start,
                count:request.count,  
                exclusions:request.exclusions
            });
		}

		LoaderData.prototype.createRequest = function(config) {
			
			var request = {};

			if(config.idConv){
                request.idConv = config.idConv;
            }else{
            	request.idConv = this.lastRequest.idConv;
            }

            if(config.filter){
            	//Tipo de filtro
            	request.filterType = config.filter.type;
            	//Field por el que filtrar.
            	request.filterField = config.filter.field;
            	//Value por el que filtrar
            	request.filterValue = config.filter.value;

            	this.countData = 0;
				request.start = 0;
				if (config.limit) {
					request.count = config.limit.count;
				}else{
					request.count = this.minResultShown;
				}
                
            }else{
            	//No se ha proporcionado filtro utilizamos el de la request anterior.
            	request.filterType = this.lastRequest.filterType;
            	request.filterField = this.lastRequest.filterField;
            	request.filterValue = this.lastRequest.filterValue;

            	request.start = this.countData;
				if (config.limit) {
					request.count = config.limit.count;
				}else{
					request.count = this.dataStepts;
				}
            }

			if (config.exclusions) {
				request.exclusions = config.exclusions;
			}else{
				request.exclusions = this.lastRequest.exclusions;
			}

            request.callbacks = {};
            if (config.callbacks) {
            	if(typeof(config.callbacks.onDataLoaded) == "function"){
            		request.callbacks.onDataLoaded = config.callbacks.onDataLoaded;
            	}
            	if(typeof(config.callbacks.onNoDataFound) == "function"){
            		request.callbacks.onNoDataFound = config.callbacks.onNoDataFound;
            	}
            };

            this.lastRequest = request;
			return request;
		}


		/*API Pública*/

		LoaderData.prototype.load = function(config) {
			var request = this.createRequest(config);
			var self = this;
			//Resolvemos la petición
			getData(request).done(function(data){
				
				if($.isPlainObject(request.callbacks) && !$.isEmptyObject(request.callbacks)){
                    
                    if (data && data.length) {
                    	self.countData += data.length;
                    	request.callbacks.onDataLoaded.apply(self,[data]);
                    }else{
                    	//Ningún resultado encontrado.
                    	request.callbacks.onNoDataFound();
                    }
                }
			});
			

		};

		LoaderData.prototype.resetTo = function(val) {
			this.countData = val;
		};

		LoaderData.prototype.increaseAmount = function(quantity) {
			if(!isNaN(parseInt(quantity))) this.countData += quantity;
		};

		LoaderData.prototype.decrementAmount = function(quantity) {
			if(!isNaN(parseInt(quantity))) this.countData -= quantity;
		};

		LoaderData.prototype.getFilter = function() {
			return this.lastRequest.filterValue;
		};


		return LoaderData

	})(_super);

	LoaderDataManager.prototype.createLoader = function(id,config) {
		var loader = null;
		if (id && $.isPlainObject(config) && !$.isEmptyObject(config)) {
			loader =  new LoaderData(config);
			loaders[id] = loader;
		};

		return loader;
		
	};

	LoaderDataManager.prototype.existsLoader = function(id) {
		return loaders[id] ? true :false;
	};

	LoaderDataManager.prototype.getLoader = function(id) {
		return loaders && loaders[id];
	};

	LoaderDataManager.prototype.removeLoader = function(id) {
		if(loaders && loaders[id]){
			delete loaders[id];
		}
	};

	LoaderDataManager.prototype.resetLoaderTo = function(id,val) {
		if (loaders && loaders[id]) {
			loaders[id].resetTo(val);
		};
	};


	return LoaderDataManager;

})(Component,jQuery,environment);