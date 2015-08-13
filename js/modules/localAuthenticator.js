var LocalAuthenticator = (function(_super,$,environment){


	function LocalAuthenticator(){

	}

	LocalAuthenticator.prototype.login = function(credentials,callbackSuccess,callbackError) {

		if (credentials) {
			//Obtenemos el servicio de localización de servicios remotos.
			var serviceLocator = environment.getService("SERVICE_LOCATOR");
			//Autenticamos al usuario.
			serviceLocator.authenticate(credentials).done(function(result){
				if (result && !isNaN(result.id)) {
					typeof(callbackSuccess) == "function" && callbackSuccess(result.id);
				};
			}).fail(function(error){
				typeof(callbackError) == "function" && callbackError(error);
			});

		};
		
	};


	return LocalAuthenticator;

})(Component,jQuery,environment);