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
			this.countData;
			this.filterValue;
			this.filterField;
			this.minResultShown = config.minResultShown;
			this.dataStepts = config.dataStepts;
			this.service = config.service;
		}

		var getData = function(request){

			return services[self.service]({
				id:request.id,
				value:request.filterText,
                field:request.filterField,
                start:request.start,
                count:request.count,  
                exclusions:request.exclusions
            });
		}

		LoaderData.prototype.createRequest = function(config) {
			
			var request = {};
			var isUpdateRequired = false;

			if(config.id){
                request.id = config.id;
            }

            if(config.filter){
            	request.filterText = config.filter.value;
            	this.filterValue = config.filter.value;
            	request.filterField = config.filter.field;
                this.filterField = config.filter.field;
                isUpdateRequired = true;
            }else{
            	request.filterText = this.filterValue;
            	request.filterField = this.filterField;
            }

            if(isUpdateRequired){
				this.countData = 0;
				request.start = 0;
				request.count = this.minResultShown;
				
			}else{
				request.start = this.countData ;
				if (config.limit) {
					request.count = config.limit.count;
				}else{
					request.count = this.dataStepts;
				}
				
			}

			if (config.exclusions) {
				request.exclusions = config.exclusions;
			}else{
				request.exclusions = [];
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