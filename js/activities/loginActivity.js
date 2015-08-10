var LoginActivity = (function(environment,$){

	function LoginActivity(view,modules){

		this.view = view;
		this.modules = modules;

	}

	LoginActivity.prototype.run = function() {
		console.log("Corriendo la Actividad...");
		this.modules["authenticatorFactory"].getAuthenticator("FACEBOOK_AUTHENTICATOR").done(function(authenticator){
			//Nos autenticamos con el autenticador obtenido.
			authenticator.login(function(idUser){
				//En este punto debes obtener el id del usuario
				//y crear la sesión. 
				var sessionManager = environment.getService("SESSION_MANAGER");
				//Creamos la sesión.
				//
				sessionManager.createSession({

				});

			},function(error){
				console.log("Error");
				console.log(error);
			});

		}).fail(function(error){
			console.log("ERROR 2!!!!");
			console.log(error);
		});
	};



	return LoginActivity;

})(environment,jQuery);