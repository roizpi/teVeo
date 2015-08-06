/*Applications Manager Module*/
var ApplicationsManager = (function(_super,$,environment){

    __extends(ApplicationsManager, _super);

    //Solicitudes de amistad pendientes.
    var applicationsOfFriendship = [],self,serviceLocator,templating;

    function ApplicationsManager(notificator){
        self = this;
        this.notificator = notificator;
        //Obtenemos el service locator.
        serviceLocator = environment.getService("SERVICE_LOCATOR");
        //Obtenemos el template manager.
        templating = environment.getService("TEMPLATE_MANAGER");
        //Eventos del Módulo
        this.events = {
            "APPLICATIONS_AVALIABLE":[],
            "ACCEPT_APPLICATION":[],
            "REJECT_APPLICATION":[],
            "NO_APPLICATION_FOUND":[]
        }



        //Configuramos manejadores.
        //attachHandlers();
        //Obtenemos la solicitudes de amistad pendientes.
        //getData();   
    }

    /*
        Métodos Privados
        ******************************
    */

    var onCreateViewApplications = function(){

        var view = this;
        //Mostramos en el DOM cada solicitud.
        applicationsOfFriendship.forEach(showApplication);
        //Mostramos número de solicitudes de amistad.
        updateNumApplications();
        //obtenemos el contenedor de solicitudes.
        var $applications = view.getComponent("container").get();
        //Aceptar solicitud de amistad
        $applications.delegate("a[data-action]","click",function(e){

            e.preventDefault();
            e.stopPropagation();
            var action = this.dataset.action;
            var $this = $(this);
            var idSolicitado = userConnected.id;
            var idSolicitador = $this.parent().data("idSolicitador");
                
            var dropApplicationHelper = function(msg,action){
                    
                //Mostramos succes
                this.notificator.dialog.alert({
                    title:"Resultado Operación",
                    text:msg,
                    level:"success"
                });
                //Borramos del DOM la solicitud.
                $this.parents("[data-application]").fadeOut(3000,function(){
                    $(this).remove();
                    //notificamos esta suceso, por si otros módulos están interasados en hacer algo
                    self.triggerEvent(action);
                    //Si no hay más solicitudes de amistad, notificamos este evento
                    if(!applicationsOfFriendship.length)
                        self.triggerEvent("NO_APPLICATION_FOUND");
                });
                //la eliminamos del Array.
                removeApplication(idSolicitador);
            }
                    
            if(action == "addContact"){
                //Solicitud de amistad aceptada.
                //Promise 1
                var acceptApplication = serviceLocator.acceptApplication(idSolicitado,idSolicitador);
                //Promise 2
                var addContact = serviceLocator.addContact(idSolicitado,idSolicitador);
                $.when(acceptApplication,addContact)
                    .done(function(response){
                        dropApplicationHelper(response,"acceptApplication");
                    }).fail(function(response){
                        //Promise reject
                        console.log("Las dos promise deben ser resueltas");
                    });

            }else if(action == "rejectApplication"){
                //Solicitud de amistad rechazada.
                serviceLocator.rejectApplication(idSolicitado,idSolicitador)
                    .done(function(response){
                        dropApplicationHelper(response,"rejectApplication");
                    })
                    .fail(function(error){

                    });
            }

            //Inicializamos plugin mixItUp
            $applications.mixItUp({
                animation: {
                    duration: 300,
                    effects: 'fade translateZ(500px) rotateY(86deg)'
                },
                load:{
                    sort: 'timestamp:desc'
                },
                callbacks: {
                    onMixLoad: function(){
                        var $toOrder = view.getComponent("toOrder").get();
                        //Ordenar solicitudes.
                        $toOrder.delegate("a[data-action]","click",function(e){
                            e.preventDefault();
                            e.stopPropagation();
                            var $this = $(this);
                            var action = this.dataset.action;
                            if(!$this.hasClass("active")){
                                $this.addClass("active").siblings().removeClass("active");
                                if(action == 'shortDesc'){
                                    //Orden Descendente por el Timestamp
                                    $applications.mixItUp('sort', 'timestamp:desc');
                                }else if(action == 'shortAsc'){
                                    //Orden Ascendente por el timestamp
                                    $applications.mixItUp('sort', 'timestamp:asc');
                                }
                            
                            }
                        });
                        //Filtrar solicitudes de amistad.
                        var $searchApplications = view.getComponent("searchApplications").get();
                        $searchApplications.on('submit',function(e){
                            e.preventDefault();
                            e.stopPropagation();
                            var val = $(this).find("input[type=search]").val();
                            //Filtramos la solicitudes de amistad conforme al texto introducido
                            $appliFiltered = $applications.children().filter(function(idx,app){
                                $app = $(app);
                                var pattern = new RegExp(val,"i");
                                if($("[data-name]",$app).text().search(pattern) != -1)
                                    return true;
                                else
                                    return false;
                                
                            });
                            //le pasamos a mixItUp la colección que queremos mostrar.
                            $applications.mixItUp('filter',$appliFiltered);
                        });
                    },
                    onMixFail: function(state){
                        $("<div>",{class:"msg  warning"})
                            .append(
                                //icon
                                $("<span>",{class:"fa fa-warning fa-3x"}),
                                //párrafo
                                $("<p>",{text:"Ningún resultado encontrado"})
                            )
                            .addClass("bounceInRight")
                            .one("webkitAnimationEnd animationend",function(){
                                $this = $(this);
                                $this.addClass("bounceOutLeft").one("webkitAnimationEnd animationend",function(){
                                    $this.remove();
                                    //mostramos todos
                                    $applications.mixItUp('filter','all');
                                })
                            }).appendTo($applications).end().addClass("active");   
                    }
                }
            });
                    
        });

    }


    var attachHandlers = function(){

        //Manejador para el evento NEW_APPLICATION_OF_FRIENDSHIP
        //Este usuario ha recibido una nueva solicitud de amistad.
        serviceLocator.addEventListener("NEW_APPLICATION_OF_FRIENDSHIP",function(application){
            //reproducimos sonido.
            $.ionSound.play("nuevaSolicitudAmistad");
            //lanzamos norificación
            self.notificator.throwNotification({
                title:"Nueva Solicitud de Amistad",
                body:"Tienes una nueva solicitud de amistad de " + application.userName
            });
            //guardamos solicitud.    
            addAplication(application);
        });
        //Manejador para el evento ACCEPT_YOUR_APPLICATION.
        //Un usuario ha aceptado la solicitud de amistad de este usuario.
        serviceLocator.addEventListener("ACCEPT_YOUR_APPLICATION",function(data){
            //Reproducimos sonido
            $.ionSound.play("acceptYourApplication");
            //lanzamos notificación
            self.notificator.throwNotification({
                title:"Solicitud de Amistad Aceptada",
                body:data
            });
            
        });

        //Manejador para el evento REJECT_YOUR_APPLICATION.
        //Un usuario ha rechazado tu solicitud de amistad.
        serviceLocator.addEventListener("REJECT_YOUR_APPLICATION",function(data){
            //Reproducimos sonido
            $.ionSound.play("acceptYourApplication");
            //lanzamos notificación
            self.notificator.throwNotification({
                title:"Solicitud de Amistad Rechazada",
                body:data
            });
           
        });

    }

    var getData = function(){
        //Llamamos a un servicio para obtener las solicitudes de amistad pendientes.
        serviceLocator.getApplicationsOfFriendship(userConnected.id)
            .done(function(applications){
                //Guardamos las solicitudes de amistad pendientes.
                applicationsOfFriendship = applications;
                //Notificamos que ya están disponibles.
                self.triggerEvent("APPLICATIONS_AVALIABLE");            
            }).fail(function(error){
                console.log(error);
            });
    }

    //Muestra en pantalla el número de solicitudes de amistad.
    var updateNumApplications = function(){
        var view = getMainView();
        var $countApplications = view.getComponent("countApplications").get();
        $countApplications.text(applicationsOfFriendship.length);
    }


    //Función para añadir una nueva solicitud de amistad.
    var addAplication = function(application){
        //la agregamos al array
        applicationsOfFriendship.push(application);
        var view = self.templateManager.getView({moduleName:self.constructor.name,templateName:"applications"});
        if(view && view.getComponent("container").isVisible())
            showApplication(application);
        //Mostramos número de applicationes
        updateNumApplications();
    }

    //Elimina una solicitud de amistad pendiente.
    var removeApplication = function(idSolicitador){
        var idx = applicationsOfFriendship.map(function(application){
            return application.idSolicitador;
        }).indexOf(idSolicitador);
        applicationsOfFriendship.splice(idx,1);
        //Actualizamos en pantalla el número de solicitudes.
        updateNumApplications();
    }

    //Función para mostrar solicitudes de amistad.
    var showApplication = function(application){
        var view = getMainView();
        //Consultamos acción actual para saber en que posición insertarla.
        var currentAction = view.getComponent("toOrder").get().find("[data-action].active").get(0).dataset.action;
        var position = currentAction == 'shortDesc' ? 'prepend' : 'append';     
        //Mostramos la solicitud.
        view.getComponent("container").createComponent("application",{
            id:application.idSolicitador,
            photo:application.foto,
            name:application.userName,
            timestamp:application.fecha,
            message:application.mensaje,
            idSolicitador:application.idSolicitador
        },{position:position});
    }

    /*  
        Métodos Públicos
        *******************************
    */

    //Retorna número de solicitudes de amistad pendientes.
    ApplicationsManager.prototype.getNumOfApplications = function() {
        return applicationsOfFriendship.length;
    };

    //Muestra la vista de todas las solicitudes de amistad.
    ApplicationsManager.prototype.showApplications = function() {
        if(applicationsOfFriendship.length){
            templating.loadTemplate({
                name:"applications",
                type:"MODULE_VIEWS",
                handlers:{
                    onCreate:onCreateViewApplications
                }
            }).done(function(){
                console.log("La vista cargada");
                console.log(this);
            });
        }else{
            throw new Error("No tienes ninguna solicitud de amistad pendiente");
        }
    };

    ApplicationsManager.prototype.sendApplication = function(addressee,message,callback) {
        serviceLocator.sendApplication(userConnected.id,addressee,message)
            .done(function(response){
                //Promise resolver
                self.notificator.dialog.alert({
                    title:"Operación Realizada Correctamente",
                    text:response,
                    level:"success"
                });
                //pasamos el testigo a otro función
                callback();
            }).fail(function(error){
                console.log(error);
            });
    };

    ApplicationsManager.prototype.getApplicationForUser = function(usuSolicitador,usuSolicitado) {
        return serviceLocator.getApplicationForUser(usuSolicitador,usuSolicitado);
    };

    ApplicationsManager.prototype.existeSolicitudDeAmistadPendiente = function(usuSolicitador) {
        if(usuSolicitador && !isNaN(parseInt(usuSolicitador)))
            return applicationsOfFriendship.map(function(application){
                return application.idSolicitador;       
            }).indexOf(usuSolicitador) !=  -1 ? true : false; 
    };
   
    return ApplicationsManager;

})(Component,jQuery,environment);
