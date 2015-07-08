var Loader = (function(){

	function Loader () {
		
	}

	Loader.prototype.loadEnvironment = function() {
		
		var deferred = $.Deferred();

		$.getScript("js/Environment.js",function(){

			var environment = new Environment();
			environment.init().done(function(){
				deferred.resolve(environment);
			});

		});

		return deferred.promise();


	};

	return Loader;

})();