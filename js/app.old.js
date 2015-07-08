(function($){

    var init = function(){

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

        userConnected = {};
        userConnected.id = 4;
        userConnected.name ="Sergio";
        userConnected.ubicacion = "avila";
        sessionStorage.setItem("session_token",1234);

        var $loading = $("#loading");
        
        $loading.find("[data-title]").addClass("fadeInDown").on("webkitAnimationEnd  animationend",function(e){
            $("<img>",{
                src:"resources/img/mainLoader.gif",
                alt:""
            }).insertAfter(this);

            ModuleManager.loadModules(function(){
                console.log("Los Módulos han sido cargados con éxito");
                $loading.fadeOut(1000);
            });
        });


    }


    $(document).on("DOMContentLoaded",init)

})(jQuery);

/*

    //Obtenemos los id de los contactos.
                var contactsId = self.getContactsIds();
                //Notificamos a los contactos el inicio de sesión
                self.serviceLocator.notifyInitSession(userConnected.id,contactsId)
                    .done(function(){
                        //Compartimos la ubicación del usuario con sus contactos.
                        geoLocationModule.getLocation(function(position){
                            userConnected.currentPosition = {timestamp:new Date().getTime(),detail:position};
                            //obtenemos los identificadores de todos nuestros contactos.
                            //Posición.
                            var users = getContactsIds();
                            geoLocationModule.sharePosition(userConnected.currentPosition,users);
                        },function(error){
                            console.error(error);
                        });
                        deferred.resolve();
                    });


*/