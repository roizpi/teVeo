/*Módulo de Contactos*/
var Contacts = (function(_super,$,environment){

    __extends(Contacts, _super);
        
    var userContacts = [];
    var self;
    var user;
    var contactsView;

    function Contacts(webSpeech,notificator,geoLocation){

        self = this;
    
        this.webSpeech = webSpeech;
        this.notificator = notificator;
        this.geoLocation = geoLocation;

        userConnected = environment.getService("SESSION_MANAGER").getUser();

        //Reporting the module events .
        this.events = {
            "CONTACTS_AVALIABLE":[],
            "NEW_CONTACT":[],
            "CONTACT_DROPED":[]
        }
        //configuration handlers
        attachHandlers();
        //Obtenemos datos necesarios para el funcionamiento del módulo.
        getData();
    
    }

    /*
        Métodos Privados
        ***************************
    */

    //Configuramos manejador para la template "contacts".
    var onCreateViewContacts = function(view){
        contactsView = view;
        var container = contactsView.getView("container");
        //Utilizamos delegación de evento, porque la lista de contactos puede ser muy amplia.
        container.get().delegate('a[data-action]','click',function(e){
            e.preventDefault();
            var $this = $(this);
            if(!$this.hasClass("active")){
                var action = this.dataset.action;
                var idUser = $this.parent().data("id");
                try{
                        
                    switch(action){
                        case 'conversation':
                            //iniciamos conversación
                            conversationModule.startConversation(idUser);
                            break;
                        case 'videocall':
                            //iniciamos videollamada
                            callingModule.calling(idUser,true);
                            break;
                        case 'call':
                            //iniciamos llamada de voz.
                            callingModule.calling(idUser,false);
                            break;
                        case 'contactDetail':
                            //Mostramos detalles del contacto.
                            showContactDetail(idUser);
                            break;
                                
                    }
                    
                    $("[data-actionsMenu]").find("[data-action].active").removeClass("active");
                    $this.addClass("active");
                    
                }catch(e){

                    //Mostramos alerta con la excepción.
                    self.notificator.dialog.alert({
                        title:e.getTitle(),
                        text:e.getText(),
                        level:e.getLevel()
                    });
                        
                }
                
                
            }
                
        });
            
        var $searchContacts = contactsView.getView("searchContacts").get();
            
        var $microphone = contactsView.getView("microphone").get();
        $microphone.on("click",function(){
            //comienza el proceso.
            self.webSpeech.hearSentence(function(result){
                if(Math.round(result.confidence) == 1){
                    // lo insertamos en el campo de búsqueda.
                    $searchContacts.val(result.transcript);
                    this.speak("Has Dicho " + result.transcript);
                    //filtramos los contactos para ese valor.
                    container.filter(result.transcript);
                }else{
                    this.speak("No te entiendo, inténtalo otra vez");
                }
            },function(error){
                console.log(error);
                ///el usuario ha podido negar el acceso al micrófono o ha ocurrido otro error.
                //cambiamos el icono del micrófono.
                switch(error){
                    case "no-speech":
                        this.speak("Pronuncie el nombre del usuario con el que quiere contactar");
                        break;
                    default:
                        break;
                }

            });
                
        });
            
        //Si la JavaScript Web Speech API está implementada.
        if(self.webSpeech.isEnabled()){
            $microphone.addClass("fa fa-microphone");
        }else{
            $microphone.addClass("fa fa-microphone-slash");
        }
            
            
        self.webSpeech.addEventListener("SpeechEnabled",function(){
            $microphone.removeClass("fa-microphone-slash").addClass("fa-microphone");
        });
            
        self.webSpeech.addEventListener("SpeechDisabled",function(){
            $microphone.removeClass("fa-microphone").addClass("fa-microphone-slash");
        });
            
            
        $searchContacts.on("keyup",function(e){
            var val = this.search.value;
            //filtramos contactos.
            container.filter(val);
        }).focus();

        //mostramos cada contacto.
        userContacts.forEach(showContact);

    };


    
    //Configuramos manejador para la template "contactDetail".
    var onCreateViewContactDetail = function(){

        var view = this;
        var $contactActions = view.getView("contactActions").get();
        $contactActions.on("click",function(e){
            e.preventDefault();
            e.stopPropagation();
            var $this = $(this);
            var contact = getContactById($this.data("id"));
            var $target = $(e.target);
            var action = e.target.dataset.action;
            if(action.toUpperCase() == "DROPCONTACT"){

                self.notificator.dialog.confirm({
                    title:"Borrar a " + contact.data.name,
                    text:"Estás seguro de que quieres dejar de ser amigo de "+contact.data.name+" , todas la conversaciones, llamadas etc.. desaparecerán ¿Estás seguro?"
                },function(){
                    self.serviceLocator.dropContact(userConnected.id,contact.data.idRepresentado)
                        .done(function(){
                            //Mostramos alerta de confirmación.
                            self.notificator.dialog.alert({
                                title:"Contacto borrado correctamente",
                                text:contact.data.name + "deja de pertenecer a tu lista de contactos.",
                                level:"success"
                            });
                            //Borramos contacto.
                            dropContact(contact);
                        })
                        .fail(function(error){

                        });
                });
                
            }else if(action.toUpperCase() == "SAVE"){
                var desc = $this.prev().val();
                if(desc.length >= 10){
                    self.serviceLocator.updateContact(userConnected.id,contact.data.idRepresentado,desc)
                        .done(function(){
                            contact.data.descripcion = desc;
                            //Mostramos alerta de confirmación.
                            self.notificator.dialog.alert({
                                title:"Operación realizada con éxito",
                                text:"La descripción fue guardada correctamente",
                                level:"success"
                            });
                        })
                        .fail(function(error){

                        })
                }else{

                    //Mostramos alerta de confirmación.
                    self.notificator.dialog.alert({
                        title:"La operación no se puede realizar",
                        text:"La descripción del contacto debe tener como mínimo 10 caracteres",
                        level:"warning"
                    });
    
                }
            }
        });
        
    };

    var attachHandlers = function(){

        var serviceLocator = environment.getService("SERVICE_LOCATOR");
        //Manejador para el evento USER_CONNECTED.
        //Un nuevo usuario que pertenece a la lista de contactos de este usuario
        // se ha conectado.
        serviceLocator.addEventListener("USER_CONNECTED",function(user){
            //reproducimos sonido.
            $.ionSound.play("userConnected");
            //lanzamos notificación
            self.notificator.throwNotification({
                title:"Nuevo Usuario conectado",
                icon:user.foto,
                body:user.name + " ha iniciado sesión"
            });
            //Actualizamos contacto.
            setStatus(user.id,"connected");
        });
        
        //Manejador para el evento USER_DISCONNECTED.
        //Un usuario que pertenece a la lista de contactos de este usuario
        // se ha desconectado.
        serviceLocator.addEventListener("USER_DISCONNECTED",function(user){
            //reproducimos sonido.
            $.ionSound.play("userDisconnected");
            //lanzamos notificación
            self.notificator.throwNotification({
                title:"Cierre de Sesión",
                icon:user.foto,
                body:user.name + " ha cerrado sesión"
            });
            //Actualizamos contacto.
            setStatus(user.id,"disconnected");
        });
        
        //Manejador para el evento NEW_USER_STATE
        //Un usuario que pertenece a la lista de contactos de este usuario
        // ha notificado su estado.
        serviceLocator.addEventListener("NEW_USER_STATE",function(user){
            //Actualizamos estado del contacto.
            setStatus(user.id,user.status);
        });

        //Manejador para el evento NEW_CONTACT.
        //Este usuario tiene un nuevo contacto.
        serviceLocator.addEventListener("NEW_CONTACT",function(contact){
            //añadimos el contacto
            addContact(contact);
            //Notificamos nuestra posición.
            self.geoLocation.sharePosition(userConnected.currentPosition,[contact.idRepresentado]);
            //notificamos esta suceso, por si otros módulos están interasados en hacer algo
            triggerEvent("newContact",contact);
        });

        //Manejador para el evento DROP_CONTACT
        //Este evento se dispara cuando un usuario ha eliminado a otro de su lista de contactos.
        serviceLocator.addEventListener("DROP_CONTACT",function(idUser){
            //reproducimos sonido.
            $.ionSound.play("userDisconnected");
            //Obtenemos datos del contacto.
            var contact = getContactById(idUser);
            //lanzamos notificación
            self.notificator.throwNotification({
                title:"Ruptura de Amistad",
                icon:contact.data.foto,
                body:contact.data.name + " te ha eliminado de su lista de contactos"
            });
            //lo eliminamos de nuestra lista de contactos.
            dropContact(contact);      
        });
        //Manejador para el evento USER_SHARE_YOUR_POSITION.
        //Un usuario ha compartido su posición contigo.
        serviceLocator.addEventListener("USER_SHARE_YOUR_POSITION",function(user){
            //Establecemos o actualizamos la posición del usuario.
            console.log(user);
            var contact = getContactById(user.id);
            if(!contact.data.currentPosition || contact.data.currentPosition.timestamp < user.position.timestamp){
                contact.data.currentPosition = user.position;
                //compartimos nuestra ubicación con él
                self.geoLocation.sharePosition(userConnected.currentPosition,[user.id]);
            } 
        });

        /*//Si el usuario establece una llamada,cambiamos el estado a "ocupado" y lo notificamos.
        callingModule.addEventListener("callEstablish",function(call){
            userConnected.status = "ocupado";
            var users = getContactsIds();
            //notificamos nuestro estado.
            self.serviceLocator.notifyStatus(userConnected.id,users,userConnected.status);
        });
        //Cuado la llamada finaliza, notificamos que vuelve a estar disponible
        callingModule.addEventListener("callClose",function(){
            userConnected.status = "disponible";
            var users = getContactsIds();
            //notificamos nuestro estado.
            self.serviceLocator.notifyStatus(userConnected.id,users,userConnected.status);
        });*/
    }

    var getData = function(){
        var serviceLocator = environment.getService("SERVICE_LOCATOR");
        //Obtenemos los contactos del usuario.
        serviceLocator.getAllContacts(userConnected.id)
            .done(function(contacts){
            
                //Guardamos los contactos.
                userContacts = contacts.map(function(contact){
                    //Por defecto todos los contactos desconectados.
                    contact.status = "disconnected";
                    return contact;
                });

                //Notificamos que los contactos, ya están disponibles.
                self.triggerEvent("CONTACTS_AVALIABLE");

            }).fail(function(error){
                console.log(error);
            });
    }

    //Función para añadir contacto a la lista.
    var addContact = function(contact){
        //Añadimos el usuario a la lista de contactos.
        userContacts.push(contact);
        var view = self.templateManager.getView("contacts");
        var container = view.getView("container");
        if(view && container.isVisible()){
            //Mostramos el contacto en el DOM.
            showContact(contact);
            //Colocamos el scroll en el último elemento.
            container.scrollToLast();
        }
        
    }


    //Función para mostrar el contacto en el DOM.
    var showContact= function(contact){
        //solucionar
        //$viewContact.find("[data-photo]").attr({src:contact.foto,alt:"Foto de " + contact.name,title:"Ver detalles de " + contact.name});
        contactsView && contactsView.getView("container").createView("contact",{
            id:contact.idRepresentado,
            photo:contact.foto,
            name:contact.name,
            status:contact.status ? contact.status : "disconnected"
        },{});
        
    
    }

    //Borra un contacto de la lista de contactos.
    var dropContact = function(user){

        var view = self.templateManager.getView("contacts");
        var container = view.getView("container");
        //eliminamos el contacto.
        userContacts.splice(user.idx,1);
        //eliminamos el contacto del DOM.
        container.removeChild(user.data.idRepresentado);
        //Notificamos el evento para que otros módulos puedan realizar alguna
        // acción.
        triggerEvent("CONTACT_DROPED",{id:user.data.idRepresentado});
            
    }

    //Método para mostrar todos los detalles de un contacto.
    var showContactDetail = function(id){
        var contact = self.getContactById(id);
        console.log(contact);
        if(contact.idx >= 0){
            self.templateManager.loadTemplate({
                moduleName:self.constructor.name,
                templateName:"contactDetail"
            },function(){
                var view = this;
                var userView = view.getComponent("container").getSubtemplate("user");
                userView.create({
                    id:contact.data.idRepresentado,
                    photo:contact.data.foto,
                    name:contact.data.name,
                    birthday:contact.edad + "años",
                    location:contact.data.ubicacion,
                    mail:contact.data.email,
                    phone:contact.data.telefono ? contact.data.telefono : "No disponible",
                    status:contact.data.status ? contact.data.status : "desconectado",
                    currentPosition:contact.data.currentPosition && contact.data.currentPosition.detail ? contact.data.currentPosition.detail.address_components[1] + ' - ' + contact.data.currentPosition.detail.address_components[3] : "Ubicación actual no disponible",
                    calls:0,
                    desc:contact.data.descripcion ? contact.data.descripcion : "",
                });
            });
        }else{
            throw new Error("Contacto no encontrado");
        }
    }


    //Función para cambiar el estado de un contacto (Disponible,Desconectado,Ausente,Ocupado).
    var setStatus = function(idUser,status){
        //Actualizamos contacto en la lista de contactos.
        var contact = getContactById(idUser);
        contact.data.status = status;
        var view = self.templateManager.getView("contacts");
        var container = view.getView("container");
        var offset = $contact.offset().top  - $contact.parent().offset().top;
        var contact = container.getChild(idUser)
            if($contactsContainer && $contactsContainer.children().length){
                
            }
        
        }

    /*
        Métodos Públicos
        ***********************
    */

    //Función para obtener la información del Contacto a partir de su de id.
    Contacts.prototype.getContactById = function(idUser) {
        var idx = userContacts.map(function(contact){
            return contact.idRepresentado;
        }).indexOf(idUser);
        return {
            idx:idx,
            data:userContacts[idx]
        }
    };


    //Devuelve los identificadores de todos los contactos.
    Contacts.prototype.getContactsIds = function() {
        if(this.cache && this.cache.length == userContacts.length){
            var ids = this.cache;
        }else{
            var ids = userContacts.map(function(contact){
                return contact.idRepresentado;
            });
            this.cache = ids;
        }
        return ids;
    };


    //Retorna el número de contactos.
    Contacts.prototype.getSizeList = function() {
        return userContacts.length;
    };


    //Función para mostrar todos los contactos.
    Contacts.prototype.showListOfContact = function(callback) {
        
        if(userContacts.length){
            var templateManager = environment.getService("TEMPLATE_MANAGER");
            templateManager.loadTemplate({
                name:"contacts",
                category:"MODULE_VIEWS",
                handlers:{
                    onCreate:onCreateViewContacts
                }
            },function(){
                typeof(callback) == "function" && callback.call(this);
            });
            
        }else{
            throw new Error("Tu lista de Contactos esta vacía");
        }
    };



    return Contacts;

})(Component,jQuery,environment);

    
  
            

    
        
    

        
        
        
        
        /*
        
        var setContactActionActive = function(idUser,action){
            $.each($contactsContainer.children(),function(idx,contact){
                var $contact = $(contact);
                if($contact.data('id') == idUser){
                    var $action = $contact.find("[data-action='"+action.toLowerCase()+"']");
                    if(!$action.hasClass("active")){
                        $("[data-actionsMenu]").find("[data-action].active").removeClass("active");
                        $action.addClass("active");
                        var offset = $contact.offset().top  - $contact.parent().offset().top;
                        $contact.scrollParent().scrollTop(offset);
                    }
                    
                }
            });
        }
        
        
        
    
        
    
        
        
        
        
        
        
        
       
        
        
        
*/