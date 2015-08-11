var LoginActivity = (function(environment,$){

	function LoginActivity(view,modules){

		this.view = view;
		this.modules = modules;

	}

	LoginActivity.prototype.run = function() {
		console.log("Corriendo la Actividad...");

		this.modules["authenticatorFactory"].getAuthenticator("LOCAL_AUTHENTICATOR",function(authenticator){
			var credentials = {nick:"sergio15",password:"FDBBGCDJDJ"}
			//Nos autenticamos con el autenticador obtenido.
			authenticator.login(credentials,function(idUser){
				//En este punto debes obtener el id del usuario
				//y crear la sesión. 
				var sessionManager = environment.getService("SESSION_MANAGER");
				//Creamos la sesión para este usuario.
				sessionManager.createSession(idUser).done(function(){
					//Iniciamos la actividad DASHBOARD.
					var activityManager = environment.getService("ACTIVITY_MANAGER");
					activityManager.startActivity("DASHBOARD_ACTIVITY");
				});

			},function(error){
				console.log("Error");
				console.log(error);
			});

		});
	};



	return LoginActivity;

})(environment,jQuery);