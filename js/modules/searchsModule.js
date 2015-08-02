//Search User Module
var Searchs = (function(_super,$,environment){

    __extends(Searchs, _super);

    var self,templating,serviceLocator;

    function Searchs(webSpeech,applications,notificator){

        self = this;
        templating = environment.getService("TEMPLATE_MANAGER");
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
        //Configuramos el formulario de búsqueda.
        var $searchForm = view.getComponent("searchForm",true).get();
        //Formulario de búsqueda de usuarios por nombre.
        $searchForm.on("keyup submit",function(e){

            e.stopPropagation();
            e.preventDefault();
            //recogemos valor del campo de búsqueda
            var val = this.search.value;
            //Si ha escrito 4 o más caracteres.
            if(val.length >= 4){
                //obtenemos usuarios que contengan esos caracteres.
                serviceLocator.searchUsers(userConnected.id,"NAME",val)
                    .done(function(users){
                        //Mostramos usuarios.
                        if(users && users.length){
                            showUsers(users);
                            //Destacamos parte coincidente.
                            highlightText(val);
                        }else{
                            hideUsers();
                        }
                    })
                    .fail(function(error){


                    });
            }
                
        });
        
        var $container = view.getComponent("container").get();
        //Delegamos el evento click producido en los hijo en el padre.
        $container.delegate("[data-action]","click",function(e){
            e.stopPropagation();
            e.preventDefault();
            var $this = $(this);    
            var action = this.dataset.action;
            if(action == 'sugerirUsuarios'){
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
                    
            }else if(action == 'toAskForFriendship'){
        
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
                
                    
            }else if(action == 'sendApplication'){
                //Enviar Solicitud de amistad
                //obtenemos el mensaje.
                var message = $this.parent().prev().val();
                if(message && message.length >= 10 && message.length <= 60){
                    //id del usuario
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

                    self.notificator.dialog.alert({
                        title:"Dato no válido",
                        text:"Debes introducir un mensaje de 10 a 60 caracteres",
                        level:"warning"
                    });

                }
                    
                    
            }else if(action == 'cancel'){
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
        var view = getMainView("searchUsers");
        view.getComponent("usuariosSugeridos",true).createComponent("user",{
            id:user.id,
            photo:user.foto,
            name:user.name,
        },{})
    }

    //Oculta un usuario sugerido.
    var hideUser = function(id){
        getMainView("searchUsers")
            .getComponent("usuariosSugeridos",true)
                .hideComponent(id,1000,true);
    }

    //Oculta todos los usuarios sugeridos.
    var hideUsers = function(){
        getMainView("searchUsers")
            .getComponent("usuariosSugeridos",true)
                .hideAllComponents(1000,true);
    
    }

    //Muestra todos los usuarios recibidos de una consulta,
    //comprueba que usuario no está presente y lo inserta,
    // y los no presentes en el resultado los elimina si estos 
    // ya estuvieran visibles debido a una consulta anterior.
    var showUsers = function(users){

        var view = getMainView("searchUsers");
        var $usuariosSugeridos = view.getComponent("usuariosSugeridos",true).get();
        
        $.each($usuariosSugeridos.children(),function(idx,usuario){
            var $usuario = $(usuario);
            var idx = users.map(function(user){
                return user.id;
            }).indexOf($usuario.data("id"));
            if(idx == -1){
                //El usuario ya no está presente en el nuevo resultado
                // por tanto le ocultamos.
                $usuario.fadeOut(1000,function(){
                    $(this).remove();
                });
            }else{
                //El usuario sigue estando presente en el resultado
                //le eliminamos del array.
                users.splice(idx,1);
            }
                            
        });
        //Mostramos los nuevos resultados.
        users.forEach(showUser);
        
    }

    var highlightText = function(val){
        var view = getMainView("searchUsers");
        var $usuariosSugeridos = view.getComponent("usuariosSugeridos",true).get();
        //Marcamos el texto coincidente.
        $("[data-mark]",$usuariosSugeridos).each(function(idx,text){
            $text = $(text);
            $text.html($text.text().replace(new RegExp("("+val+")","i"),"<mark>$1</mark>"))
        });
    }

    //Muestra un formulario para enviar una solicitud de amistad.
    var showForm = function(user){
        
        getMainView("searchUsers")
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

        getMainView("searchUsers")
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
            type:"MODULE_VIEWS",
            module:"SEARCHS",
            template:"searchUsers",
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