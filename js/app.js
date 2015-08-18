(function($){

	userConnected = {};
    userConnected.id = 4;
    userConnected.name ="Sergio";
    userConnected.ubicacion = "avila";
    sessionStorage.setItem("session_token",1234);

    //Inicializamos plugin ionSound.
    $.ionSound({
        sounds: [
            {name:"userConnected"},
            {name:"userDisconnected"},
            {name:"nuevaSolicitudAmistad"},
            {name:"acceptYourApplication"},
            {name:"Ring01",loop:3,ended_callback:null},
            {name:"Ring02",loop:3,ended_callback:null},
            {name:"Ring03",loop:3,ended_callback:null},
            {name:"Ring04",loop:3,ended_callback:null},
            {name:"Ring07",loop:3,ended_callback:null},
            {name:"Ring08",loop:3,ended_callback:null}
        ],
        path: "resources/sonidos/",
        multiPlay: true,
        volume: "1.0"
    });

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