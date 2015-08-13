var LoginActivity = (function(environment,$){

	var self;

	function LoginActivity(view,modules){

		self = this;
		this.view = view;
		this.modules = modules;
		//Configuramos manejadores
		attachHandlers();

	}


	var attachHandlers = function(){

		//Autenticación Local.
		self.view.getView("login").get().on("submit",function(e){
			e.preventDefault();
			var $this = $(this);
			var credentials = {};
			//Obtenemos las credenciales.
			$.each($this.serializeArray(),function(idx,control){
				credentials[control.name] = control.value;
			});
			//Obtenemos el autenticador.
			self.modules["authenticatorFactory"].getAuthenticator("LOCAL_AUTHENTICATOR",function(authenticator){
	
				//Nos autenticamos con el autenticador obtenido.
				authenticator.login(credentials,function(idUser){
					//En este punto debes obtener el id del usuario
					//y crear la sesión. 
					console.log("LOGEADO CORRECTAMENTE...");
					console.log(idUser);
					var sessionManager = environment.getService("SESSION_MANAGER");
					//Creamos la sesión para este usuario.
					sessionManager.createSession(idUser).done(function(){
						//Iniciamos la actividad DASHBOARD.
						//var activityManager = environment.getService("ACTIVITY_MANAGER");
						//activityManager.startActivity("DASHBOARD_ACTIVITY");
						
					});
				},function(error){
					//Fallo de autenticación.
					console.log("Error de autenticación");
					console.log(error);
				});

			});
		});
		//Autenticación externa.
		var socialAuthenticators = {facebookauth:"FACEBOOK_AUTHENTICATOR"};
		//delegamos las acciones en el contenedor socialAuth.
		self.view.getView("socialAuth").get().delegate("[data-action]","click",function(e){
			e.preventDefault();
			//Obtenemos acción
			var action = this.dataset.action.toLowerCase();
			if(socialAuthenticators[action]){
				//Si el autenticador existe lo creamos a través del autenticatorFactory.
				self.modules["authenticatorFactory"].getAuthenticator(socialAuthenticators[action],function(authenticator){
					//Nos autenticamos con el autenticador obtenido.
					authenticator.login(function(idUser){
						console.log("ID OBTENIDO");
						console.log(idUser);
						
					},function(error){
						//Fallo de autenticación.
						console.log("Error de autenticación");
						console.log(error);
					});

				});
			}
		});

	}

	LoginActivity.prototype.run = function() {
		console.log("Corriendo la Actividad...");

	};



	return LoginActivity;

})(environment,jQuery);