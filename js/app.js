(function($){

	userConnected = {};
    userConnected.id = 4;
    userConnected.name ="Sergio";
    userConnected.ubicacion = "avila";
    sessionStorage.setItem("session_token",1234);

	$(function(){

		$.getScript("js/Environment.js").done(function(){

			Environment.create().done(function(environment){
				//Accedemos al administrador de actividades.
				var activityManager = environment.getService("ACTIVITY_MANAGER");
				//Accedemos al historial de actividades
				var history = environment.getService("HISTORY_MANAGER");
				//Comprobamos si existe una última actividad
				var activity = history.hasLastActivity() ? history.getLatestActivity() : "";
				try{
					//Arrancamos la actividad.
					activityManager.startActivity(activity);
				}catch(e){
					console.log(e);
					console.log("EXCEPCIÓN PRODUCIDA");
					console.log(e.name);
				}

			});
				
				
		}).fail(function(){
			console.log("Error al descargar Environment...");
		})

	});

})(jQuery);