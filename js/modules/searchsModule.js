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
        //this.applicationsManager = applicationsManager;
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

        //Mínimo de resultados mostrados;
        var minResultsShown = 10;

        //Configuramos el formulario de búsqueda.
        var $searchForm = view.getComponent("searchForm",true).get();
        //Formulario de búsqueda de usuarios por nombre.
        $searchForm.on("submit",function(e){
            e.stopPropagation();
            e.preventDefault();
            //obtenemos el texto.
            var val = this.search.value;
            //recogemos valor del campo de búsqueda
            var regExp = new RegExp("(" + val + ")","i");
            //Obtenemos una referencia al contenedor de usuarios.
            var $users = view.getComponent("users_found",true).get();
            //Recorremos los usuarios.
            $users.children().length && $users.children().each(function(idx,user){
                var $user = $(user);
                console.log("Usuario actual...");
                console.log(user);
                var name = $user.find("[data-mark]").text();
                if (name.match(regExp)) {
                    $name = $(name);
                    $name.html($name.text().replace(regExp,"<mark>$1</mark>"))
                }else{
                    $user.remove();
                }
            });

            if ($users.children().length < minResultsShown) {

                var diff = minResultsShown - $users.children().length;
                //obtenemos usuarios que contengan esos caracteres.
                serviceLocator.searchUsers({
                    value:val,
                    field:"name",
                    count:diff
                })
                .done(function(users){
                    //Mostramos usuarios.
                    if(users && users.length){
                        showUsers(users);
                        //Destacamos parte coincidente.
                        highlightText(regExp);
                    }else{

                        $("<div>",{class:"msg  warning  animateView"})
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


                });     
            };

             
        });
        
        var $container = view.getComponent("container").get();
        //Delegamos el evento click producido en los hijo en el padre.
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
                            showUsers(users);
                        }else{
                            hideUsers();
                        }
                    })
                    .fail(function(error){

                    });
                    
            }else if(action == 'TO_ASK_FOR_FRIENDSHIP'){
        
                var idUser = $this.data("id");
                //Comprobamos si ya tenemos una solicitud de amistad de este usuario.
                if(!self.applicationsManager.existeSolicitudDeAmistadPendiente(idUser)){
                    //Comprobamos si existe alguna solicitud PENDIENTES O RECHAZADAS con este usuario.
                    self.applicationsManager.getApplicationForUser(userConnected.id,idUser,function(application){
                        console.log(application);
                        if(!application){
                            //Obtenemos todos los detalles del usuario.
                            serviceLocator.getDetailsOfUser(idUser)
                                .done(function(user){
                                    showForm(user);
                                })
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
                    if(!self.applicationsManager.existeSolicitudDeAmistadPendiente(idUser)){
                        //Mandamos la solicitud
                        self.applicationsManager.sendApplication(idUser,message,function(){
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


    //Función para mostrar usuarios.
    var showUser = function(user){
        //Obtenemos una referencia a la vista.
        var view = templating.getView("searchUsers");
        view.getComponent("users_found",true).createComponent("user",{
            id:user.id,
            photo:user.foto,
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

    //Muestra todos los usuarios recibidos de una consulta,
    //comprueba que usuario no está presente y lo inserta,
    // y los no presentes en el resultado los elimina si estos 
    // ya estuvieran visibles debido a una consulta anterior.
    var showUsers = function(users){

        var view = templating.getView("searchUsers");
        var $users = view.getComponent("users_found",true).get();
        
        $users.children().each(function(idx,user){
            var $user = $(user);
            var idx = users.map(function(user){
                return user.id;
            }).indexOf($user.data("id"));
            if(idx == -1){
                //El usuario ya no está presente en el nuevo resultado
                //por tanto le ocultamos.
                $user.fadeOut(1000,function(){
                    $(this).remove();
                });
            }else{
                //El usuario sigue estando presente en el resultado
                //le eliminamos del array.
                users.splice(idx,1);
            }
        })
        //Mostramos los nuevos resultados.
        users.forEach(showUser);
        
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

    //Muestra un formulario para enviar una solicitud de amistad.
    var showForm = function(user){
        
        templating.getView("searchUsers")
            .getComponent("container")
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

                                animate:"fadeInDown",
                                onCreate:function(component){

                                    setTimeout(function(){
                                        //Activamos la ayuda.
                                        component.getComponent("help").get().addClass("active");
                                        //Ponemos el foco en el TextArea.
                                        component.getComponent("textarea").focus();
                                    },1000)
                                    
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
                .hideComponent(id,1000,true);

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