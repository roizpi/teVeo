var Preferences = (function(_super,$){
    
    __extends(Preferences, _super);


    var self;
    //Sonidos disponibles para los avisos de llamada.
    var soundsCallAlert = ["Ring01","Ring02","Ring03","Ring04","Ring07","Ring08"];
    //Temas disponibles
    var themes = {
        "blueSky":{
            alias:"Blue Sky",
            name:"themeDefault.css",
            type:"sky",
            thumbnail:"resources/img/themeSky.png",
            wallpapers:[
                "marvelous_ocean.jpg",
                "KokneseCastle.jpg",
                "SnowGooseMigration.jpg",
                "VieuxPort.jpg",
                "MarinaBaySingapore.jpg",
                "HouseBoats.jpg",
                "CraterLakeRainbow.jpg"
            ]
        },
        "redRuby":{
            alias:"Red Ruby",
            name:"themeRuby.css",
            type:"ruby",
            thumbnail:"resources/img/themeRuby.png",
            wallpapers:[
                "beautiful-sunset.jpg",
                "DadesValley_ROW.jpg",
                "FeatherHeaddress.jpg",
                "MSHNVM.jpg",
                "ColoradoRiver.jpg"
            ]
        },
        "greenForest":{
            alias:"Green Forest",
            name:"themeGreen.css",
            type:"green",
            thumbnail:"resources/img/themeGreen.png",
            wallpapers:[
                "naturaleza.jpg",
                "LostCity_ROW.jpg",
                "CanisLupus.jpg",
                "TatuamunhaRiver.jpg",
                "KatmaiNP.jpg",
                "TasmaniaWaterfall.jpg",
                "RedEaredSlider.jpg"
            ]
        }
    };
    
    var timerChangeWallpaper = null;
    
    

    function Preferences(templateManager){

        self = this;
        this.templateManager = templateManager;
        //Eventos que notifica el módulo.
        this.eventsModule = {
            "PREFERENCE_CHANGED":[]
        }
        //Configuramos manejadores.
        attachHandlers();

        

    }


    /*
        Métodos públicos
        =======================
    */

    Preferences.prototype.getPreference = function(name) {

        var value = localStorage.getItem(name + "_" + userConnected.id + "_" + userConnected.name.substr(0,3));
        switch(name){

            case 'theme':

                return value ? themes[value] : themes["blueSky"];
    
            case 'sound':

                //Configuramos tono de llamada.
                return value ? value : "Ring08";

            default:
                break;
        }
        
    };


    Preferences.prototype.savePreference = function(name,value) {
        // body...
    };

    Preferences.prototype.editPreferences = function() {
        this.templateManager.loadTemplate({
            moduleName:this.constructor.name,
            templateName:"preferences"
        });
    };

    /*
    
        Métodos Privados
        ========================
    
    */

    var attachHandlers = function(){

        self.templateManager.implementHandler({
            moduleName:self.constructor.name,
            templateName:"preferences",
            handler:"onCreate"
        },function(){

            var view = this;

            var container = view.getComponent("container");
            var themesContainer = container.getComponent("themes",true);
            //Mostramos tono actual.
            var soundCallList = container.getComponent("callSound").getComponent("soundCallList");

            container.get().delegate('[data-action]','click',function(e){
                e.preventDefault();
                e.stopPropagation();
                var $this = $(this);
                //recogemos la acción
                var action = this.dataset.action.toUpperCase();
                
                if (action == 'EDIT') {
                    
                    $this.parents("[data-preference]")
                        .addClass("active")
                        .parent()
                        .addClass("overlay");

                }else if(action == 'SAVE' || action == 'CANCEL'){

                    //Obtenemos la preferencia activa.
                    var preference = container.getComponentByClass("active");

                    preference.get()
                        .removeClass("active")
                        .parent()
                        .removeClass("overlay");

                    if (action == 'SAVE') {

                        switch(preference.name.toUpperCase()){

                            case 'APARIENCIA':

                                //Obtenemos el tema activo.
                                var val = themesContainer.getComponentByClass("active").get().data("id");
                                //Formamos la preferencia.
                                var preference = {
                                    name:"theme",
                                    value:themes[val]
                                }
                            
                                break;
                            case 'CALLSOUND':

                                var val = soundCallList.getComponent("currentSound").get().text();
                                //Formamos la preferencia.
                                var preference = {
                                    name:"sound",
                                    value:val
                                }
                                break;
                        }

                        //persistimos el cambio en el cliente.
                        localStorage.setItem(
                            preference.name + "_" + userConnected.id + "_" + userConnected.name.substr(0,3),
                            val
                        );
                        //Notificamos que la preferencia ha cambiado.
                        self.triggerEvent("PREFERENCE_CHANGED",preference);

                        
                    };


                }
                
            });
            
            
            $.each(themes,function(idx,theme){

                themesContainer.createComponent("theme",{
                    id:idx,
                    thumbnail:theme.thumbnail,
                    alias:theme.alias
                },{
                    onCreate:function(theme){
                        console.log("Hola");
                        console.log(theme);
                    }
                });

            });

            themesContainer.get().delegate('[data-theme]','click',function(e){
                e.preventDefault();
                e.stopPropagation();
                var $this = $(this);
                
                if(!$this.hasClass("active")){
                    
                    $this.addClass("active").siblings().removeClass("active");
                    
                }

            });

            //Tono de llamada.
            var currentSound = self.getPreference("sound");
            var $current = soundCallList.getComponent("currentSound").get();
            $current.text(currentSound);
            var options = view.getComponent("options",true);
            $.each(soundsCallAlert,function(idx,sound){

                options.createComponent("option",{
                    id:idx,
                    soundName:sound
                },{})

            });

            //Lista de tonos de llamada.          
            soundCallList.get().children(":not(.options)").on("mouseenter click",function(e){
                e.preventDefault();
                soundCallList.getComponent("options").get().toggleClass("visible");
            }).end().find(".options").on("mouseleave",function(){
                $(this).removeClass("visible");
            }).delegate(".option","click",function(e){
                e.stopPropagation();
                var $this = $(this);
                currentSound = soundsCallAlert[$this.data("id")];
                $current.text(currentSound);
                $current.next().trigger("click");
            });

            //Acciones para tono de llamada.
            view.getComponent("soundCallActions",true).get().delegate("[data-action]","click",function(e){
                e.preventDefault();
                e.stopPropagation();
                var $this = $(this);
                var action = this.dataset.action;
                var currentSound = $current.text();
                if(action == "playSound" && !$this.hasClass("active")){
                    $this.addClass("active");
                    $.ionSound.play(currentSound,{loop:1,ended_callback:function(){
                        $this.removeClass("active");
                    }});
                }else if(action == "saveSound"){
                    //Persistimos el cambio.
                    localStorage.setItem("sound_" + userConnected.id + "_" + userConnected.name.substr(0,3),currentSound);
                    //Notificamos que la preferencia ha cambiado.
                    self.triggerEvent("PREFERENCE_CHANGED",{
                        name:"sound",
                        value:currentSound
                    });
                }
            });
        
       
        
    
        /*
        
        
        
        
        var $onoffswitch = $("#onoffswitch");
        if(SpeechModuleStatus == "enabled"){
            $onoffswitch.prop("checked",true);
        }else{
            $onoffswitch.prop("checked",false);
        }
        $onoffswitch.on("change",function(){
            var $switch = $(this);
            if($switch.prop("checked")){
                //Activamos teVeo talk
                webSpeechModule.enable(function(){
                    this.speak("Has activado teVeo! talk");
                    localStorage.setItem(userConnected.id + "_" + userConnected.name.substr(0,3) + "_" + "SpeechModuleStatus","enabled");
                },function(error){
                    Alertify.dialog.alert(error);
                    $switch.prop("checked", false);
                });
            }else{
                //lo desactivamos.
                webSpeechModule.disable();
                localStorage.setItem(userConnected.id + "_" + userConnected.name.substr(0,3) + "_" + "SpeechModuleStatus","disabled");
            }
        })*/

        });

        self.templateManager.implementHandler({
            moduleName:self.constructor.name,
            templateName:"preferences",
            handler:"onAfterShow"
        },function(){

            var view = this;
            //Activamos la ayuda.
            view.getComponent("help",true).get().addClass("active");

        });

        self.templateManager.implementHandler({
            moduleName:self.constructor.name,
            templateName:"preferences",
            handler:"onAfterHide"
        },function(){

            var view = this;
            //Activamos la ayuda.
            view.getComponent("help",true).get().removeClass("active");

        });

    };

    return Preferences;

})(Component,jQuery);