
var GUI = (function(_super,$){
    
	__extends(GUI, _super);

    var self;
	var $viewPanelMenu = $("#viewPanelMenu");
    var $viewPanelAction = $("#viewPanelAction");
    var $theme = $("#currentTheme");
    var currentTheme;
    var visibilityState;
    var themesPath = "css/themes/";
    var wallpapersFolder = "resources/img/wallpaper/";
    var timerChangeWallpaper;



	function GUI(serviceLocator,searchs,contacts,applicationsManager,notificator,preferences){
		
		self = this;
        
		this.serviceLocator = serviceLocator;
		this.searchs = searchs;
		this.contacts = contacts;
		this.applicationsManager = applicationsManager;
		this.notificator = notificator;
        this.preferences = preferences;
        //Aplicamos la preferencias.
        applyPreferences();
        timerWallpaper();
		//Configuramos manejadores
		attachHandlers();
		//Comprobamos actividad del usuario, para notificar a otros 
        //usuarios si este está asente.
        checkStatus();
	}

	/*
		Métodos Privados.
		*****************
	*/

    var applyPreferences = function(){

        currentTheme = self.preferences.getPreference('theme');
        console.log("Este es el tema");
        console.log(currentTheme);
        //Aplicamos el tema seleccionado
        $theme.attr("href",themesPath+currentTheme.name);
    }

    var timerWallpaper = function(){
        
        clearTimeout(timerChangeWallpaper);
        var $main = $("#main").children("img.wallpaper:eq(0)").remove().end();
        var currentWallpaper;

        //Obtiene wallpaper aleatorio.
        var getRandomWallpaper = function(currentWallpaper,callback){

            do{

                var wallpaper = currentTheme.wallpapers[Math.floor((Math.random() * currentTheme.wallpapers.length))];

            }while(currentWallpaper == wallpaper);
            
            $("<img>",{class:'wallpaper changeWallpaper',src:wallpapersFolder+wallpaper}).on('load',function(){
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
                },25000);
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

	var attachHandlers = function(){

        $(document).on("visibilitychange webkitvisibilitychange",function(){
            if(document[visibilityState] == "hidden")
                document.title = "TeVeo! | (" + self.notificator.getNumOfNotifications() + ") notificaciones pendientes";
            else if(document[visibilityState] == "visible")
                document.title = "TeVeo!";
                
        });
        //Manejador para el evento PREFERENCE_CHANGED.
        //El usuario ha editado alguna preferencia
        self.preferences.addEventListener("PREFERENCE_CHANGED",function(preference){

            if(preference.name == "theme"){
                currentTheme = preference.value;
                //Aplicamos el tema seleccionado
                $theme.attr("href",themesPath+preference.value.name);

                timerWallpaper();
                //Notificamos que se ha producido el cambio.
                self.notificator.dialog.alert({
                    title:"Preferencia cambiada",
                    text:"El tema de la aplicación ha sido cambiado con éxito",
                    level:"info"
                });
            }

        })
        //Manejador para el evento NEW_NOTIFICATION.
        //Se ha lanzado una notificación y esta ha quedado como pendiente.
        self.notificator.addEventListener("NEW_NOTIFICATION",function(){
            //Si la pestaña está oculta, actualizamos título con el número de notificaciones pendientes.
            if(document[visibilityState] == "hidden")
                document.title = "TeVeo! | (" + self.notificator.getNumOfNotifications() + ") notificaciones pendientes";
            //Actualizamos pestaña.
            $("#task").find("[data-notifications]").text(self.notificator.getNumOfNotifications());
        });

		//Manejador para el evento USER_CONNECTED.
        //Un nuevo usuario que pertenece a la lista de contactos de este usuario
        // se ha conectado.
        self.serviceLocator.addEventListener("USER_CONNECTED",function(user){
        	//notificamos nuestro estado.
            this.notifyStatus(userConnected.id,user.id,userConnected.status);
        });

        //Manejador para el evento NEW_CONTACT.
        //Este usuario tiene un nuevo contacto.
        self.serviceLocator.addEventListener("NEW_CONTACT",function(contact){
        	//notificamos nuestro estado.
            this.notifyStatus(userConnected.id,contact.idRepresentado,userConnected.status);
        });

        self.contacts.addEventListener("CONTACTS_AVALIABLE",function(){
            //habilitamos botón de contactos.
            console.log("Contactos Disponibles");
        });

        self.applicationsManager.addEventListener("APPLICATIONS_AVALIABLE",function(){
            $("#task").find("[data-applications]").text(this.getNumOfApplications());
        });

        /*self.caller.addEventListener("CALL_FINISHED",function(){
            $("#task").find("[data-action='goHome']").trigger("click");
        });*/

    
		/*conversationModule.addEventListener("anyConversationFound",function(){
            $("#task").find("[data-action='goHome']").trigger("click");
        });
        
        
        
        callingModule.addEventListener("callEstablish",function(call){
            //Mostramos la lista de contactos.
            if(userConnected.id != call.idUser) 
                contactsModule.showListOfContact(function(){
                    $("#actions").find("a[data-action].active").removeClass("active").end().find("[data-action='showAllContacts']").addClass("active");
                    this.setContactActionActive(call.idUser,call.type);
                });
        });

        conversationModule.addEventListener("startConversation",function(conversation){
            //Mostramos la lista de contactos.
            if(userConnected.id != conversation.idUser) 
                contactsModule.showListOfContact(function(){
                    $("#actions").find("a[data-action].active").removeClass("active").end().find("[data-action='showAllContacts']").addClass("active");
                    this.setContactActionActive(conversation.idUser,"conversation");
                });
        });*/

        

        /*
        
            Barra de Tareas de la cabecera
            ==============================
        
        */
        

		/*
            
            Opciones del Panel Menú
            ================================
        
        */
        
        $("#actions").delegate("a[data-action]","click",function(e){
            
            e.preventDefault();
            e.stopPropagation();
            var $this = $(this);
            if(!$this.hasClass("active")){ 

                var action = this.dataset.action;
                
                try{
                    
                    switch(action){
                        case 'showAllContacts':
                            //Mostramos la lista de contactos.
                            self.contacts.showListOfContact();
                            break;
                        case 'showCalls':
                            //Mostramos todas la llamadas que ha realizado.
                            self.caller.showListOfCall();
                            break;
                    }

                    $this.parents("#actions").find("a[data-action].active").removeClass("active");
                    $this.addClass("active");
                    
                }catch(e){

                    self.notificator.dialog.alert({
                    	title:"Operación no realizada",
                    	text:e.message,
                        level:"info"
                    });
                }
            }
            
        });

		/*$viewPanelAction.on("noApplicationFound  noNotifications",function(){
            $("#task").find("[data-action='goHome']").trigger("click");
        });*/


	}

	//Monitorea la actividad del usuario.
    var checkStatus = function(){
        
        userConnected.status = "disponible";
        var checkStatusTimer;
        var check = function(){

            checkStatusTimer = setTimeout(function(){
                
                if(userConnected.status != "ocupado"){
                    userConnected.status = "ausente";

                    var users = self.contacts.getContactsIds();
                    //notificamos nuestro estado.
                    self.serviceLocator.notifyStatus(userConnected.id,users,userConnected.status);
                }
                    
            },50000);
        }

        $("body").on("mouseover",function(){
                
            clearTimeout(checkStatusTimer);
            if(userConnected.status == "ausente" ){
                //cambiamos el estado
                userConnected.status = "disponible";

                var users = self.contacts.getContactsIds();
                //notificamos nuestro estado.
                self.serviceLocator.notifyStatus(userConnected.id,users,userConnected.status);
            }

            check();
        });

        check();
            
    }
       

	return GUI;

})(BaseModule,jQuery);