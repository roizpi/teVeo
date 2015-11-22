//Search User Module
var Searchs = (function(_super,$,environment){

    __extends(Searchs, _super);

    var self,templating,serviceLocator,searchUserView,userConnected;

    //Mínimo de resultados mostrados;
    const MIN_RESULT_SHOWN = 5;
    const STEPTS = 5;

    function Searchs(webSpeech,applications,notificator,geoLocation){

        self = this;
        //Obtenemos el template manager.
        templating = environment.getService("TEMPLATE_MANAGER");
        //Obtenemos el localizador de servicios.
        serviceLocator = environment.getService("SERVICE_LOCATOR");
        this.webSpeech = webSpeech;
        //MANEJADOR DE SOLICITUDES.
        this.applications = applications;
        this.notificator = notificator;
        this.geoLocation = geoLocation;
        userConnected = environment.getService("SESSION_MANAGER").getUser();
        console.log("userConnected");
        console.log(userConnected);
            
    }

    /*
        Métodos Privados
        ************************************
    */
    //Método para destacar texto.
    var highlightText = function(filter){
        var $users = searchUserView.getView("users_found").get();
        var regExp = new RegExp("(" + filter.value + ")","ig");
        //Marcamos el texto coincidente.
        $("[data-"+filter.field.toLowerCase()+"]",$users).each(function(idx,text){
            $text = $(text);
            $text.html($text.text().replace(regExp,"<mark>$1</mark>"));
        });
    }

    //Método para la carga de nuevos usuarios.
    var loadUsers = function(config){
        var self = this;
        
        //Obtenemos una referencia al contenedor de usuarios.
        var usersFound = searchUserView.getView("users_found");
    
        if (config.type.toUpperCase() === "FILTER") {

            this.exclusions = [];

            //Obtenemos el valor del filtro.
            if(config.filter && config.filter.value){
                this.filterValue = config.filter.value;
            }
            //Obtenemos el campo para el filtro.
            if(config.filter && config.filter.field){
                this.filterField = config.filter.field;
            }
            //Creamos la expresión regular especificando el valor como una captura.
            var regExp = new RegExp("(" + this.filterValue + ")","i");
            //Recorremos los usuarios actuales en el DOM si existen.
            usersFound.hideChildsByFilter(true,function(user){
                console.log("HOLA");
                console.log(user);
                if (user.get().find("[data-"+self.filterField.toLowerCase()+"]").text().match(regExp)) {
                    self.exclusions.push(user.get().data("id"));
                    return false; 
                }else{
                    return true;
                }
            });

            console.log("SIZE");
            console.log(usersFound.size());
            console.log("EXCLUSIONES");
            console.log(self.exclusions);

            if (usersFound.size() < MIN_RESULT_SHOWN) {
                //Obtenemos la diferencia.
                var diff = MIN_RESULT_SHOWN - usersFound.size();
            
                serviceLocator.searchUsers({
                    value:self.filterValue,
                    field:self.filterField,
                    start:0,
                    count:diff,
                    exclusions:self.exclusions
                }).done(function(users){
                    
                    if(users && users.length){
                        console.log("Voy a mostrar a los usuarios");
                        //Mostramos usuarios.
                        users.forEach(showUser);
                    }else{
                        //Ningún resultado encontrado.
                        !usersFound.size() && typeof(config.callbacks.onNoDataFound) == "function" && config.callbacks.onNoDataFound();
                    }

                    //Destacamos parte coincidente.
                    highlightText(config.filter);
                });

            }

        }else if(config.type.toUpperCase() === "APPEND"){
            //Tipo de Carga "APPEND", se añadirán STEPTS usuarios al conjunto actual.
            var start = usersFound.size() - self.exclusions.length;
            //Utilizamos el servicio "searchUsers" para obtener más resultados.
            serviceLocator.searchUsers({
                value:self.filterValue,
                field:self.filterField,
                start:start,
                count:STEPTS,
                exclusions:self.exclusions
            }).done(function(users){
                if(users && users.length){
                    //Mostramos usuarios.
                    users.forEach(showUser);
                    //Destacamos parte coincidente.
                    highlightText({
                        field:self.filterField,
                        value:self.filterValue
                    });
                }
            });

        }
    
        
    }

    //handlers

    //Configuramos manejador onCreate para la template "searchUsers".
    var onCreate = function(view){

        searchUserView = view;
        //Configuramos el micrófono.
        var $microphone = searchUserView.getView("microphone").get();
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

        //Buscador de Usuarios.
        var currentValue;//Valor de filtro actual.
        var currentField = "name";//Campo actual.

        //Configuramos el formulario de búsqueda.
        var $searchForm = searchUserView.getView("searchForm").get();
        //Obtenemos una referencia al contenedor de usuarios.
        var $users = searchUserView.getView("users_found").get();
        //Formulario de búsqueda de usuarios por nombre.
        $searchForm.on("submit",function(e){
            e.stopPropagation();
            e.preventDefault();
            console.log("Inciándo búsqueda");
            //recogemos valor del campo de búsqueda
            currentValue = this.search.value.toLowerCase().trim().replace(/\s+/,"i");
            //Cargamos los resultados.
            loadUsers({
                type:"FILTER",
                filter:{
                    field:currentField,
                    value:currentValue
                },
                callbacks:{
                    onDataFound:function(){

                    },
                    onNoDataFound:function(){
                        //Mostramos advertencia.
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
                }
            });
        
        });
        //Manejador para el evento Scroll sobre la lista de usuarios encontrados.
        $users.on("scroll",function(){
            var $this = $(this);
            console.log("Evento Scroll");
            if($this.scrollTop() + $this.innerHeight() >= $this.get(0).scrollHeight){
                console.log("Cargando más resultados");
                //Cargamos más resultados.
                loadUsers({
                    type:"APPEND"
                });
            }
        });

        var $container = searchUserView.getView("container").get();
        //Delegamos la resolución de todas las acciones en el contenedor.
        $container.delegate("[data-action]","click",function(e){
            e.stopPropagation();
            e.preventDefault();
            var $this = $(this);
            //obtenemos el nombre de la acción a realizar.    
            var action = this.dataset.action.toUpperCase();
            if(action == 'SUGGEST_USERS'){
                //Obtenemos la ubicación del usuario.
                self.geoLocation.getLocation().done(function(location){

                    console.log("POSICIÓN OBTENIDA");
                    console.log(location);
                    //Obtenemos el nombre de la ciudad.
                    var town = location.address_components.town;
                    //Cargamos resultados.
                    loadUsers({
                        type:"FILTER",
                        filter:{
                            field:"location",
                            value:town
                        },
                        callbacks:{
                            onNoDataFound:function(){
                                //Mostramos advertencia.
                                $("<div>",{class:"msg  warning  animateView"})
                                    .append(
                                        //icon
                                        $("<span>",{class:"fa fa-warning fa-3x"}),
                                        //párrafo
                                        $("<p>",{text:"No hemos encontrado usuarios cerca de tí"})
                                    )
                                    .addClass("bounceInLeft")
                                    .one("webkitAnimationEnd animationend",function(){
                                        $this = $(this);
                                        $this.addClass("bounceOutRight").one("webkitAnimationEnd animationend",function(){
                                            $this.remove();
                                        });
                                    }).appendTo($users).end().addClass("active");
                            }
                        }
                    });

                }).fail(function(error){

                    self.notificator.dialog.alert({
                        title:"Ubicación no disponible",
                        text:"Tu ubicación no pudo obtenerse",
                        level:"info"
                    });
                    console.log("LA POSICIÓN NO PUDO OBTENERSE");
                    console.log(error);


                });
        
                        
            }else if(action == 'TO_ASK_FOR_FRIENDSHIP'){
                //Solicitar amistad.
                var idUser = $this.data("id");
                //Comprobamos si ya tenemos una solicitud de amistad de este usuario.
                if(!self.applications.existeSolicitudDeAmistadPendiente(idUser)){
                    var form = searchUserView.getView("form"+idUser);
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
                        form.show();
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
                hideForm("form"+id);

            }
        });


        
        
    }
    //Manejador onAfterShow para la template searchUser.
    var onAfterShow = function(view){
        view.getView("help").get().addClass("active");
    }
    //Manejador onAfterHide para la template searchUser.
    var onAfterHide = function(view){
        view.getView("help").get().removeClass("active");
    }


    //Crea un nuevo componente usuario.
    var showUser = function(user){
        //creamos un nuevo componente.
        searchUserView.getView("users_found").createView("userProfile",{
            id:user.id,
            profileBack:"resources/img/prueba.png",
            avatar:user.foto,
            name:user.name,
            location:user.ubicacion
        },{
            animations:{
                animationIn:"zoomIn",
                animationOut:"zoomOut"
            }
        })
    }

    //Oculta un usuario sugerido.
    var hideUser = function(id){
        searchUserView
            .getView("users_found")
                .hideChild(id,true);
    }

    //Oculta todos los usuarios sugeridos.
    var hideUsers = function(){
        searchUserView
            .getView("users_found")
                .hideAllComponents(true);
    
    }

    //Crea el formulario para el envío de solicitudes.
    var createForm = function(user){

        searchUserView
            .getView("container")
            .createView("ToAskForFriendship",{
                id:"form"+user.id
            },
            {

                animations:{
                    animationIn:"bounceInLeft",
                    animationOut:"bounceOutRight"
                },
                handlers:{

                    onAfterShow:function(view){

                        view.createView("content",{
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
                            },
                            handlers:{
                                onAfterShow:function(view){

                                    setTimeout(function(){
                                        //Activamos la ayuda.
                                        view.getView("help").get().addClass("active");
                                        //Ponemos el foco en el TextArea.
                                        view.getView("textarea").get().focus();
                                    },1000);
                                        
                                }
                            }

                        });

                    }
                }
                
            });

        }
    //Oculta el formulario de envío de solicitud
    var hideForm = function(id){

        searchUserView
            .getView("container")
                .hideChild(id,false);

    }

    /*
        Métodos Públicos
        ***********************************
    */

    //Método utilizado para iniciar una búsqueda.
    Searchs.prototype.startSearch = function() {
        templating.loadTemplate({
            name:"searchUsers",
            category:"MODULE_VIEWS",
            handlers:{
                onCreate:onCreate,
                onAfterShow:onAfterShow,
                onAfterHide:onAfterHide
            }
        }).done(function(view){
            console.log("La vista cargada");
            console.log(view);
        });
    };


    return Searchs;

})(Component,jQuery,environment);