//Search User Module
var Searchs = (function(_super,$,environment){

    __extends(Searchs, _super);

    var self,templating,serviceLocator;

    function Searchs(webSpeech,applications,notificator){

        self = this;
        //Obtenemos el template manager.
        templating = environment.getService("TEMPLATE_MANAGER");
        //Obtenemos el localizador de servicios.
        serviceLocator = environment.getService("SERVICE_LOCATOR");
        this.webSpeech = webSpeech;
        //MANEJADOR DE SOLICITUDES.
        this.applications = applications;
        this.notificator = notificator;

            
    }

    /*
        Métodos Privados
        ************************************
    */

    //handlers

    //Configuramos manejador onCreate para la template "searchUsers".
    var onCreate = function(){

        var view = this;
        //Configuramos el micrófono.
        var $microphone = view.getComponent("microphone",true).get();
        //Micrófono.
        $microphone.on("click",function(){
            var $self = $(this);
            //comienza el proceso.
            self.webSpeech.hearSentence(function(result){
                if(Math.round(result.confidence) == 1){
                    // lo insertamos en el campo de búsqueda.
                    $self.prev().val(result.transcript).parents("form").submit();
                }else{
                    this.speak("No te entiendo, inténtalo otra vez");
                }
            },function(error){
                console.log(error);
                ///el usuario ha podido negar el acceso al micrófono o ha ocurrido otro error.
                 switch(error){
                    case "no-speech":
                        this.speak("Dicte el mensaje que quiere enviar");
                        break;
                    default:
                        break;
                }
            });

        });

        if(self.webSpeech.isEnabled()){
            $microphone.addClass("fa-microphone");
        }else{
            $microphone.addClass("fa-microphone-slash");
        }

        self.webSpeech.addEventListener("SpeechEnabled",function(){
            $microphone.removeClass("fa-microphone-slash").addClass("fa-microphone");
        });
            
        self.webSpeech.addEventListener("SpeechDisabled",function(){
            $microphone.removeClass("fa-microphone").addClass("fa-microphone-slash");
        });

        var $container = view.getComponent("container").get();
        //Delegamos la resolución de todas las acciones en el contenedor.
        $container.delegate("[data-action]","click",function(e){
            e.stopPropagation();
            e.preventDefault();
            var $this = $(this);
            //obtenemos el nombre de la acción a realizar.    
            var action = this.dataset.action.toUpperCase();
            if(action == 'SUGGEST_USERS'){
                //Sugerencia de usuarios
                if(userConnected.currentPosition){
                    console.log("Cogiendo posición actual.");
                    var location = userConnected.currentPosition.detail.address_components[3].long_name;
                }else{
                    var location = userConnected.ubicacion;
                }
               
                //Llamamos a un servicio para obtener usuarios que contengan esos caracteres.
                serviceLocator.searchUsers(userConnected.id,"LOCATION",location)
                    .done(function(users){
                        //Mostramos usuarios.
                        if(users && users.length){
                            //Mostramos los nuevos resultados.
                            users.forEach(showUser);
                        }else{
                            hideUsers();
                        }
                    })
                    .fail(function(error){

                    });
                    
            }else if(action == 'TO_ASK_FOR_FRIENDSHIP'){
                //Solicitar amistad.
                var idUser = $this.data("id");
                //Comprobamos si ya tenemos una solicitud de amistad de este usuario.
                if(!self.applications.existeSolicitudDeAmistadPendiente(idUser)){

                    var form = templating.getView("searchUsers").getComponent("container").getComponent(idUser);
                    //Comprobamos si ya existe un formulario para este usuario.
                    if (!form) {
                        //Comprobamos si existe alguna solicitud PENDIENTES O RECHAZADAS con este usuario.
                        self.applications.getApplicationForUser(userConnected.id,idUser).done(function(application){
                            
                            if(!application){
                                //Obtenemos todos los detalles del usuario.
                                serviceLocator.getDetailsOfUser(idUser)
                                    .done(createForm)
                                    .fail(function(error){

                                    });
                            }else{

                                if(application.status == "PENDIENTE"){
                                    var msg = "Ya has enviado una solicitud de amistad a este usuario el " + application.fecha;
                                }else if(application.status == "RECHAZADA"){
                                    var msg = "Este usuario ha rechazado tu solicitud, puedes enviarle otra cuando haya pasado 24 horas";
                                }
                                //Mostramos alerta
                                self.notificator.dialog.alert({
                                    title:"No se puede enviar solicitud",
                                    text:msg,
                                    level:"warning"
                                });
                            }
                        });
                    }else{
                        console.log("Ya existe Formulario");
                    }
                    

                }else{

                    self.notificator.dialog.alert({
                        title:"Tienes una solicitud de amistad pendiente de este usuario, consulta tus solicitudes de amistad pendientes",
                        text:msg,
                        level:"warning"
                    });

                }
                
                    
            }else if(action == 'SEND_APPLICATION'){
                //Enviar Solicitud de amistad
                //obtenemos el mensaje.
                var message = $this.parent().prev().val();
                //Comprobamos que tiene una longitud adecuada.
                if(message && message.length >= 10 && message.length <= 60){
                    //id del usuario.
                    var idUser = $this.parent().data("id");
                    //Consultamos si ha podido entrar una solicitud de amistad del otro usuario
                    if(!self.applications.existeSolicitudDeAmistadPendiente(idUser)){
                        //Mandamos la solicitud
                        self.applications.sendApplication(idUser,message,function(){
                            //Ocultamos form
                            hideForm(idUser);
                            //Quitamos el usuario sugerido.
                            hideUser(idUser);
                        });

                    }else{
                        //Ya existe una solicitud de amistad para este usuario.
                        self.notificator.dialog.alert({
                            title:"Operación Cancelada",
                            text:"Dispones de una solicitud de amistad de este usuario, acude a solicitudes pendientes",
                            level:"warning"
                        });
                        //Ocultamos form
                        hideForm(idUser);
                        //Quitamos el usuario sugerido.
                        hideUser(idUser);
                    }

                }else{
                    //El mensaje no tiene la longitud correcta.
                    self.notificator.dialog.alert({
                        title:"Mensaje no válido",
                        text:"Debes introducir un mensaje de 10 a 60 caracteres",
                        level:"warning"
                    });

                }
                    
                    
            }else if(action == 'CANCEL'){
                //obtenemos id.
                var id = $this.parent().data("id");
                //Ocultamos form
                hideForm(id);

            }
        });


        //Buscador de Usuarios.

        //Mínimo de resultados mostrados;
        var MIN_RESULT_SHOWN = 5;
        var STEPTS = 5;

        var currentFilter;//Filtro actual.
        var currentField = "name";//Campo actual.
        var exclusions = [];//Exclusiones.
        var regExp;//Expresión regular actual.

        //Configuramos el formulario de búsqueda.
        var $searchForm = view.getComponent("searchForm",true).get();
        //Obtenemos una referencia al contenedor de usuarios.
        var $users = view.getComponent("users_found",true).get();
        //Formulario de búsqueda de usuarios por nombre.
        $searchForm.on("submit",function(e){
            e.stopPropagation();
            e.preventDefault();
            //recogemos valor del campo de búsqueda
            currentFilter = this.search.value.toLowerCase().trim().replace(/\s+/,"i");
            //Creamos la expresión regular especificando el valor como una captura.
            regExp = new RegExp("(" + currentFilter + ")","i");
            //Recorremos los usuarios actuales en el DOM si existen.
            $users.children().length && $users.children().each(function(idx,user){
                var $user = $(user);
                if ($user.find("[data-mark]").text().match(regExp)) {
                    $name = $user.find("[data-mark]");
                    $name.html($name.text().replace(regExp,"<mark>$1</mark>"));
                    //Guardamos el identificador del usuario en la lista de exclusiones.
                    exclusions.push($user.data("id"));
                }else{
                    $user.remove();
                }
            });

            if ($users.children().length < MIN_RESULT_SHOWN) {
                //Obtenemos la diferencia.
                var diff = MIN_RESULT_SHOWN - $users.children().length;
                console.log("Exclusiones : " + exclusions);
                //Utilizamos el servicio "searchUsers" para obtener más resultados.
                serviceLocator.searchUsers({
                    value:currentFilter,
                    field:currentField,
                    start:0,
                    count:diff,
                    exclusions:exclusions
                })
                .done(function(users){
                    
                    if(users && users.length){
                        //Mostramos usuarios.
                        users.forEach(showUser);
                        //Destacamos parte coincidente.
                        highlightText(regExp);
                    }else{
                        //Ningún resultado encontrado.
                        !$users.children().length && $("<div>",{class:"msg  warning  animateView"})
                            .append(
                                //icon
                                $("<span>",{class:"fa fa-warning fa-3x"}),
                                //párrafo
                                $("<p>",{text:"Ningún resultado encontrado"})
                            )
                            .addClass("bounceInLeft")
                            .one("webkitAnimationEnd animationend",function(){
                                $this = $(this);
                                $this.addClass("bounceOutRight").one("webkitAnimationEnd animationend",function(){
                                    $this.remove();
                                });
                            }).appendTo($users).end().addClass("active");
                    }
                })
                .fail(function(error){
                    //El servicio falló.

                });     
            };

             
        });
        //Manejador para el evento Scroll sobre la lista de usuarios encontrados.
        $users.on("scroll",function(){
            var $this = $(this);
            if($this.scrollTop() + $this.innerHeight() >= $this.get(0).scrollHeight){
                var start = $users.children().length - exclusions.length;
                //Utilizamos el servicio "searchUsers" para obtener más resultados.
                serviceLocator.searchUsers({
                    value:currentFilter,
                    field:currentField,
                    start:start,
                    count:STEPTS,
                    exclusions:exclusions
                }).done(function(users){
                    if(users && users.length){
                        //Mostramos usuarios.
                        users.forEach(showUser);
                        //Destacamos parte coincidente.
                        highlightText(regExp);
                    }
                });
            }
        });
        
    }
    //Manejador onAfterShow para la template searchUser.
    var onAfterShow = function(){
        var view = this;
        view.getComponent("help",true).get().addClass("active");
    }
    //Manejador onAfterHide para la template searchUser.
    var onAfterHide = function(){
        var view = this;
        view.getComponent("help",true).get().removeClass("active");
    }


    //Crea un nuevo componente usuario.
    var showUser = function(user){
        //Obtenemos una referencia a la vista.
        var view = templating.getView("searchUsers");
        //creamos un nuevo componente.
        view.getComponent("users_found",true).createComponent("userProfile",{
            id:user.id,
            profileBack:"resources/img/prueba.png",
            avatar:user.foto,
            name:user.name,
        },{})
    }

    //Oculta un usuario sugerido.
    var hideUser = function(id){
        templating.getView("searchUsers")
            .getComponent("users_found",true)
                .hideComponent(id,1000,true);
    }

    //Oculta todos los usuarios sugeridos.
    var hideUsers = function(){
        templating.getView("searchUsers")
            .getComponent("users_found",true)
                .hideAllComponents(1000,true);
    
    }

    var highlightText = function(regExp){
        var view = templating.getView("searchUsers");
        var $users = view.getComponent("users_found",true).get();
        //Marcamos el texto coincidente.
        $("[data-mark]",$users).each(function(idx,text){
            $text = $(text);
            $text.html($text.text().replace(regExp,"<mark>$1</mark>"));
        });
    }

    //Crea el formulario para el envío de solicitudes.
    var createForm = function(user){
        
        templating
            .getView("searchUsers")
            .getComponent("container");
            .createComponent("ToAskForFriendship",{
                id:user.id
            },
            {
                onCreate:function(component){

                    component.get().hide().slideDown(1000,function(){

                        component.createComponent("content",{
                            id:user.id,
                            photo:user.foto,
                            name:user.name,
                            age:user.edad + " años",
                            location:user.ubicacion,
                            help:"Escribe un mensaje a " + user.name,
                            textarea:"Hola " + user.name + ", agregame por favor"
                        },{
                            animations:{
                                animationIn:"bounceInLeft",
                                animationOut:"bounceOutRight"
                            }
                            handlers:{
                                onAfterShow:function(component){

                                    setTimeout(function(){
                                        //Activamos la ayuda.
                                        component.getComponent("help").get().addClass("active");
                                        //Ponemos el foco en el TextArea.
                                        component.getComponent("textarea").focus();
                                    },1000);
                                    
                                }
                            }

                        });
                    });
            
                }

            });
 
    }
    //Oculta el formulario de envío de solicitud
    var hideForm = function(id){

        templating.getView("searchUsers")
            .getComponent("container")
                .hideComponent(id,1000,false);

    }

    /*
        Métodos Públicos
        ***********************************
    */

    //Método utilizado para iniciar una búsqueda.
    Searchs.prototype.startSearch = function() {
        templating.loadTemplate({
            name:"searchUsers",
            type:"MODULE_VIEWS",
            handlers:{
                onCreate:onCreate,
                onAfterShow:onAfterShow,
                onAfterHide:onAfterHide
            }
        }).done(function(){
            console.log("La vista cargada");
            console.log(this);
        });
    };


    return Searchs;

})(Component,jQuery,environment);