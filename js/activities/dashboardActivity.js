var DashboardActivity = (function(environment,$){

    var self;
    var sessionManager;
	var visibilityState;
    var timerChangeWallpaper;
    var $theme;
    var currentTheme;

	function DashboardActivity (view,modules) {

        self = this;
		this.view = view;
		this.modules = modules;
        sessionManager = environment.getService("SESSION_MANAGER");
		$theme = $("#currentTheme"); 
		visibilityState = document.visibilityState ? "visibilityState" : "webkitVisibilityState";
        //aplicamos preferencias
		applyPreferences();
		//Configuramos manejadores
		attachHandlers();
        //Configuramos la vista.
        configureView();
		
	}

    var configureView = function(){

        var notifications = self.modules["notificator"].getNumOfNotifications();
        if (notifications) {
            $("#tasks").find("[data-notifications]").text(notifications);
        };
        
    }


    var applyPreferences = function(){

        currentTheme = self.modules['preferences'].getPreference('theme');
        //Aplicamos el tema seleccionado
        $theme.attr("href",environment.THEMES_FOLDER + currentTheme.name);
    }

	var attachHandlers = function(){

        //Controlamos si la pestaña cambia a estado no visible.
		$(document).on("visibilitychange webkitvisibilitychange",function(){
            if(document[visibilityState] == "hidden")
                document.title = "TeVeo! | (" + self.modules["notificator"].getNumOfNotifications() + ") notificaciones pendientes";
            else if(document[visibilityState] == "visible")
                document.title = "TeVeo!";
                
        });/*.delegate("[data-action]","click",function(e){
            $("[data-action]").removeClass("active");
            $(this).addClass("active");
        });*/


        var $el = $("[data-notifications]","#tasks");
        //Implementamos manejador para el evento "NOTIFICATION_ELIMINATED".
        self.modules["notificator"].addEventListener("VIEWS_NOTICES",function(){
            $el.text("");
        });

        //Implementamos manejador para el evento "NEW_NOTIFICATION".
        self.modules["notificator"].addEventListener("NEW_NOTIFICATION",function(){
            var count = this.getNumOfNotifications();
            $el.text(count);
        });
        
        //Implementamos manejador para el evento "NOT_FOUND_NOTIFICATIONS".
        self.modules["notificator"].addEventListener("NOT_FOUND_NOTIFICATIONS",function(){
            self.modules['metro'].showApps();
        });

        var $panelMenu = self.view.getView("panelMenu").get();
        //Icono para ocultar menú de acceso rápido.
        $("#navIcon").on("click",function(){
            var $navicon = $(this).find("span.fa");
            if($navicon.hasClass("fa-navicon")){
                $navicon.removeClass("fa-navicon").addClass("fa-close");
                $panelMenu.removeClass("slideOutLeft").addClass("slideInLeft");
            }else{
                $navicon.removeClass("fa-close").addClass("fa-navicon");
                $panelMenu.removeClass("slideInLeft").addClass("slideOutLeft");
                
            }
        });

        //Menú principal de tareas.
        $("#tasks").delegate("[data-action]","click",function(e){
            
            e.preventDefault();
            e.stopPropagation();
            console.log("Realizando acción...");
            var $this = $(this);
            if(!$this.hasClass("active")){
                //recogemos la acción.
                var action = this.dataset.action;
                try{
                    switch(action){
                        case 'goHome':
                            self.modules['metro'].showApps();
                            break;
                        case 'preferences':
                            //Mostramos plantilla para la edición de algunas de las preferencias.
                            self.preferences.editPreferences();
                            break;
                        case 'searchUsers':
                            //Inicializamos Módulo de Búsquedas
                            self.modules['searchs'].startSearch();
                            break;
                        case 'viewApplications':
                            //Mostramos solicitudes de amistad.
                            self.applicationsManager.showApplications();
                            break;
                        case 'showNotifications':
                            //Mostramos la notificaciones pendientes.
                            self.modules['notificator'].showNotifications();
                            break;
                        case 'logout':
                            self.serviceLocator.logout()
                            .done(function(){
                                //cerramos socket
                                self.serviceLocator.closeConnection();
                                //limpimos el sessionStorage
                                sessionStorage.clear();
                                //Redirigimos la página de inicio
                                window.location = "index.html";
                            })
                            .fail()
                            break;
                    }
                        
                    $("[data-actionsMenu]").find("[data-action].active").removeClass("active");
                    //Marcamos como activo al elemento actual.
                    $this.addClass("active");
                    
                }catch(e){
                    
                    self.modules["notificator"].dialog.alert({
                    	title:"Operación no realizada",
                    	text:e.message,
                        level:"info"
                    });
                }
            }
                
        });

        /*
            
            Opciones del Panel Menú
            ================================
        
        */
        
        $("#actions").delegate("a[data-action]","click",function(e){
            console.log("Acción pulsada..");
            e.preventDefault();
            e.stopPropagation();
            var $this = $(this).parent();
            if(!$this.hasClass("active")){ 

                var action = this.dataset.action;
                
                try{
                    
                    switch(action){
                        case 'showAllContacts':
                            //Mostramos la lista de contactos.
                            self.modules['contacts'].showListOfContact();
                            break;
                        case 'showCalls':
                            //Mostramos todas la llamadas que ha realizado.
                            self.caller.showListOfCall();
                            break;
                    }

                    $this.addClass("active").siblings().removeClass("active");
                    
                }catch(e){

                    self.modules['notificator'].dialog.alert({
                        title:"Operación no realizada",
                        text:e.message,
                        level:"info"
                    });
                }
            }
            
        });


	}

    //Inicia el configurador de wallpapers.
	var startWallpaperConfigurator = function(){
        
        clearTimeout(timerChangeWallpaper);
        var $main = $("#main").children("img.wallpaper:eq(0)").remove().end();
        var currentWallpaper;

        //Obtiene wallpaper aleatorio.
        var getRandomWallpaper = function(currentWallpaper,callback){

            do{

                var wallpaper = currentTheme.wallpapers[Math.floor((Math.random() * currentTheme.wallpapers.length))];

            }while(currentWallpaper == wallpaper);
            console.log("Environment");
            console.log(environment);
            
            $("<img>",{class:'wallpaper changeWallpaper',src:environment.WALLPAPERS_FOLDER + wallpaper}).on('load',function(){
                callback({
                    fileName:wallpaper,
                    el:this
                })
            });
        }
        
        //Configuramos timer para el cambio de wallpaper.
        var changeWallpaper = function(){
            //Obtenemos un wallpaper aleatorio.
            getRandomWallpaper(currentWallpaper.fileName,function(wallpaper){

                timerChangeWallpaper = setTimeout(function(){
                    currentWallpaper = wallpaper;
                    $main.children("img.wallpaper:eq(0)").replaceWith(wallpaper.el);
                    changeWallpaper();
                },55000);
            })

        }

        //Obtenemos un primer wallpaper aleatorio.
        getRandomWallpaper(null,function(wallpaper){

            currentWallpaper = wallpaper;
            //introducimos un primer wallpaper.
            $main.append(wallpaper.el);
            changeWallpaper();
                
        })
        

    }

	DashboardActivity.prototype.onResume = function() {
        //Obtenemos la información del usuario.
        var user = sessionManager.getUser();
        //Aplicamos animaciones.
        var panelMenu = self.view.getView("panelMenu");
        panelMenu.get().removeClass("slideOutLeft").addClass("slideInLeft").one("Webkitanimationend animationend",function(){
            panelMenu.getView("userImage").get().attr("src",user.foto).addClass("cutEffect-visible");
        });

        //Notificamos el inicio de sesión a todos nuestro contactos.
        var ids = this.modules["contacts"].getContactsIds();
        sessionManager.notifyInitSession(ids);
        //Solicitamos permiso para mostrar notificaciones.
        this.modules["notificator"].requestPermission();
        //Compartimos nuestra ubicación.
        this.modules["geoLocation"].sharePosition(ids).fail(function(error){
            self.modules["notificator"].dialog.alert({
                title:"Ubicación no disponible",
                text:"Tu ubicación no pudo obtenerse",
                level:"info"
            });
        });
        //Iniciamos el configurador de wallpapers.
        startWallpaperConfigurator();

        //Notifica al usuario la existencia de mensajes que no ha leído
        this.modules["conversation"].getPendingMessages().done(function(messages){
            if(messages.length){
                $.ionSound.play("acceptYourApplication");
                //lanzamos notificación
                self.modules["notificator"].dialog.alert({
                    title:"Tienes " + messages.length + " nuevos mensajes",
                    text:"Acuda a mensajes pendientes para verlos",
                    level:"info"
                });
            }
        });
        

		//Comprobamos actividad del usuario, para notificar a otros 
        //usuarios si este está asente.
        //checkStatus();
	
	};


	return DashboardActivity;

})(environment,jQuery);
