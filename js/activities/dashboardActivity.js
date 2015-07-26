
var DashboardActivity = (function(environment,$){

	var visibilityState;
    var modules;
    var gui;
    var envir;
    var timerChangeWallpaper;
    var $theme;
    var currentTheme;

	function DashboardActivity (view,mods) {

		envir = environment;
		gui = view;
		modules = mods;
		$theme = $("#currentTheme"); 
		visibilityState = document.visibilityState ? "visibilityState" : "webkitVisibilityState";
		console.log("Estos son los módulos cargados.");
        console.log(mods);
        //aplicamos preferencias
		//applyPreferences();
		//Configuramos manejadores
		//attachHandlers();
		
	}

	var attachHandlers = function(){

		$(document).on("visibilitychange webkitvisibilitychange",function(){
            if(document[visibilityState] == "hidden")
                document.title = "TeVeo! | (" + modules["notificator"].getNumOfNotifications() + ") notificaciones pendientes";
            else if(document[visibilityState] == "visible")
                document.title = "TeVeo!";
                
        });

        //Icono para ocultar menú de acceso rápido.
        $("#navIcon").on("click",function(){
            var $navicon = $(this).find("span.fa");
            var $panelMenu = $("#panelMenu");
            if($navicon.hasClass("fa-navicon")){
                $navicon.removeClass("fa-navicon").addClass("fa-close");
                $panelMenu.show("drop",{direction:"left"},700);
            }else{
                $navicon.removeClass("fa-close").addClass("fa-navicon");
                $panelMenu.hide("drop",{direction:"left"},700);
            }
        });

        //Menú principal de tareas.
        $("#task").delegate("[data-action]","click",function(e){
            
            e.preventDefault();
            e.stopPropagation();
            var $this = $(this);
            if(!$this.hasClass("active")){
                //recogemos la acción.
                var action = this.dataset.action;
                try{
                    switch(action){
                        case 'goHome':
                            /*loadHomeTemplate(function(){
                                //mostramos panel de estadisticas.
                                setTimeout(function(){
                                    $("[data-summary]").addClass("visible");
                                },500);
                                setTimeout(function(){
                                    // lo ocultamos al cabo de 3 segundos
                                    $("[data-summary]").removeClass("visible");
                                },3000);
                            });*/
                            break;
                        case 'preferences':
                            //Mostramos plantilla para la edición de algunas de las preferencias.
                            self.preferences.editPreferences();
                            break;
                        case 'searchUsers':
                            //Inicializamos Módulo de Búsquedas
                            self.searchs.initSearch();
                            break;
                        case 'viewApplications':
                            //Mostramos solicitudes de amistad.
                            self.applicationsManager.showApplications();
                            break;
                        case 'showNotifications':
                            //Mostramos la notificaciones pendientes.
                            self.notificator.showNotifications();
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
                    
                    self.notificator.dialog.alert({
                    	title:"Operación no realizada",
                    	text:e.message,
                        level:"info"
                    });
                }
            }
                
        });


	}

	var applyPreferences = function(){

        currentTheme = modules['preferences'].getPreference('theme');
        //Aplicamos el tema seleccionado
        $theme.attr("href",environment.THEMES_FOLDER + currentTheme.name);
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


	DashboardActivity.prototype.run = function() {

		//timerWallpaper();
		//Comprobamos actividad del usuario, para notificar a otros 
        //usuarios si este está asente.
        //checkStatus();
		console.log("Corriendo Actividad");
		console.log("Esta es la vista");
		console.log(gui);
	};


	return DashboardActivity;

})(environment,jQuery);
