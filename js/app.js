(function($){

	var init = function(){

		userConnected = {};
        userConnected.id = 4;
        userConnected.name ="Sergio";
        userConnected.ubicacion = "avila";
        sessionStorage.setItem("session_token",1234);

		$.getScript("js/Environment.js").done(function(){

			Environment.create().done(function(environment){
				//Accedemos al administrador de actividades.
				var activityManager = environment.getService("ACTIVITY_MANAGER");
				//Accedemos al historial de actividades
				var history = environment.getService("HISTORY_MANAGER");
				//Comprobamos si existe una última actividad
				if (history.hasLastActivity()) {
					//Obtenemos la última actividad.
					var lastActivity = history.getLatestActivity();
					//Comprobamos si la actividad requiere autenticación.
					if (activityManager.isProtectedActivity(lastActivity.name)){
						//Accedemos al administrador de sesiones.
						var session = environment.getService("SESSION_MANAGER");
						//Comprobamos si hay una sessión activa y si el token no ha expirado.
						if (session.hasSessionAlive() && session.getSessionLife() < activityManager.getSessionTimeAllowed(lastActivity.name)) {
							//Arrancamos la actividad.
							activityManager.startActivity(lastActivity);
						}else{
							//Arrancamos la actividad por defecto.
							activityManager.startActivity();
						}

					}else{
						//Arrancamos la actividad.
						activityManager.startActivity(lastActivity);
					} 

				}else{
					//Arrancamos la actividad por defecto.
					activityManager.startActivity();
				}

			});
				
				
		}).fail(function(){
			console.log("Error al descargar Environment...");
		})

		
	}

	$(document).ready(init);


})(jQuery);