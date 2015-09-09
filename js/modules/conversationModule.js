
var Conversation = (function(_super,$,environment){

    __extends(Conversation, _super);

    //Número máximo de mensajes por conversación
    const MAX_MESSAGES_BY_CONV = 20;
    const MIN_MESSAGES_BY_CONV = 10;
    const MESSAGES_STEPS = 5;

    var self;
    //Mensajes pendientes.
    var pendingMessages = [];
    var templating;
    var serviceLocator;
    var loaderManager;
    var viewConversations;
    var viewPendingMessages;
    var userConnected;
    var utils;
    var currentConv;
    var title;

    function Conversation(webSpeech,notificator,contacts){

        self = this;
    
        this.webSpeech = webSpeech;
        this.notificator = notificator;
        this.contacts = contacts;
        templating = environment.getService("TEMPLATE_MANAGER");
        serviceLocator = environment.getService("SERVICE_LOCATOR");
        loaderManager = environment.getService("LOADER_DATA_MANAGER");
        utils = environment.getService("UTILS");
        userConnected = environment.getService("SESSION_MANAGER").getUser();
        //Reporting the module events.
        this.events = {
            "ANY_CONVERSATION_FOUND":[],
            "MENSAJES_BORRADOS":[],
            "NEW_PENDING_MESSAGE":[],
            "VIEWED_POST":[],
            "START_CONVERSATION":[]
        }

    }

    var attachHandlers = function(){

        //Manejador para el evento NEW_MESSAGE
        serviceLocator.addEventListener("NEW_MESSAGE",function(message){
            //Reproducimos sonido
            $.ionSound.play("acceptYourApplication");
            var photo = self.contacts.getContactPhoto(message.userId);
            if (currentConv && currentConv.id == message.idConv) {
                //El mensaje pertenece a la conversación actual que está manteniendo con este usuario,
                //por lo que mostramos su texto.
                //lanzamos notificación
                self.notificator.throwNotification({
                    title:"Nuevo mensaje Recibido",
                    icon:photo,
                    body:message.text
                });

                //Como el mensaje pertenece a la conversación actual,damos por hecho que lo ha visto.
                serviceLocator.updateMessagesStatus(userConnected.id,[
                    {
                        id:message.id,
                        emisor:message.userId,
                        idConv:message.idConv
                    }
                ]);

            }else{

                //Guardamos el mensajes
                pendingMessages.push(message);

                //lanzamos notificación
                self.notificator.throwNotification({
                    title:"Nuevo mensaje Recibido",
                    icon:photo,
                    body:"Acuda al tema " + utils.urldecode(message.convName)
                });

                //Notificamos que hay un nuevo mensaje no visto.
                self.triggerEvent("NEW_PENDING_MESSAGE");
                    
            }

            showMessage(message);
            //Actualizamos número de mensajes para la conversación
            updateNumberMessages(message.idConv,message.userId,false);
            var container = viewConversations.getView("conversationContainer");
            container.scrollToLast();
           
        });

        //Manejador para el evento NEW_MESSAGE.
        //Este Evento se produce cuando un usuario ha visto un mensaje escrito
        // por este usuario.
        serviceLocator.addEventListener("MENSAJES_LEIDOS",function(response){
            if(viewConversations){
                var container = viewConversations.getView("conversationContainer");
                for(var i = 0,len = response.convs.length; i < len; i++){
                    var conv = container.getView(response.convs[i]);
                    console.log(conv);
                    if (conv) {
                        //Obtenemos todos los mensajes no vistos.
                        var mensajes = conv.findChildsWhere("status","fa-eye-slash");;
                        $.each(mensajes,function(idx,message){
                            //Si es un mensaje escrito por este usuario, lo marcamos como leído.
                            if (message.get().hasClass("emisor")) {
                                 message.getView("status").get().removeClass("fa-eye-slash").addClass("fa-eye");
                            };
                           
                        });
                    };
                }
            }
            
        });
            

    }


    var onCreateViewConversations = function(view){
        viewConversations = view;

        //Obtenemos la vista searchFormMessages.
        var searchMessages = viewConversations.getView("searchFormMessages");
        searchMessages.get().on("submit",function(e){
            e.preventDefault();
            var text = this.query.value.trim().replace(/\s+/ig,"");
            if (currentConv) {
                //Obtenemos una referencia al contenedor de conversaciones.
                var container = viewConversations.getView("conversationContainer");
                //obtenemos una referencia a la conversación actual.
                var conv =  container.getView(currentConv.id);
                var exclusions = [];
                //Creamos la expresión regular especificando el valor como una captura.
                var regExp = new RegExp("(" + text + ")","i");
                //Recorremos los mensajes actuales en el DOM si existen.
                conv.hideChildsByFilter(true,function(message){
                    if (message.getView("text").get().text().match(regExp)) {
                        exclusions.push(message.getId());
                        return false; 
                    }else{
                        return true;
                    }
                });
                console.log("Estas son las exclusiones");
                console.log(exclusions);

                if (conv.size() < MIN_MESSAGES_BY_CONV) {
                    //Obtenemos la diferencia.
                    var diff = MIN_MESSAGES_BY_CONV - conv.size();
                    //Obtenemos el loader de la conversacion actual.
                    var loaderData = loaderManager.getLoader(currentConv.id);

                    loaderData.load({
                        id:currentConv.id,
                        filter:{
                            value:text
                        },
                        limit:{
                            count:diff
                        },
                        exclusions:exclusions,
                        callbacks:{
                            onDataLoaded:function(messages){
                                //Mostramos cada mensaje.
                                messages.forEach(function(message){
                                    showMessage(message,{
                                        direction:"asc"
                                    });
                                    container.scrollAt(view.getHeight());
                                });
                            },
                            onNoDataFound:function(){
                                self.notificator.dialog.alert({
                                    title:"Ningún mensaje encontrado",
                                    text:"Esta conversación no tiene mensajes",
                                    level:"info"
                                });
                            }
                        }
                    });
                }
                
                //Colocamos el scroll en el primer resultado.
                container.scrollToTop();
            };
        });

        var searchConversations = viewConversations.getView("searchConversations");
        searchConversations.get().on("submit",function(e){
            e.preventDefault();
            var text = this.search.value.trim().replace(/\s+/ig,"");
            var container = viewConversations.getView("conversationListContainer");
            var convList = container.getView(currentConv.user);
            convList.get().find("[data-body]").slideUp();
            convList.filterChild(text);
            //Colocamos el scroll en el primer resultado.
            container.scrollToTop();
    
        });

        var sendMessage = viewConversations.getView("sendMessage");
        sendMessage.get().on("submit",function(e){
            e.preventDefault();
            var text = this.message.value.trim().replace(/\s+/ig," ");
            this.message.value = "";
            var container = viewConversations.getView("conversationContainer");
            //Creamos el mensaje.
            serviceLocator
            .createMessage(currentConv.id,userConnected.id,currentConv.user,text)
            .done(function(message){
                //Mostramos  el mensaje enviado.
                showMessage(message);
                //Colocamos el scroll en el último mensaje.
                container.scrollToLast();
                $.ionSound.play("acceptYourApplication");
                //Actualizamos número de mensajes para la conversación
                updateNumberMessages(currentConv.id,currentConv.user,true);
            })
            .fail(function(){
                //fallo al enviar el mensaje.
            });
        });

        var convList = viewConversations.getView("conversationListContainer");
        convList.get().delegate("[data-action]","click",function(e){
            e.preventDefault();
            var $this = $(this);
            var action = this.dataset.action.toUpperCase();
            switch(action){
                case 'RESTORECONVERSATION':
                    var conversation = $this.parent().data("info");
                    //Iniciamos la conversación.
                    initConversation(JSON.parse(conversation));
                    break;
                case 'SHOWBODY':
                    $this.find("[data-body]").slideDown(500).end().siblings().find("[data-body]").slideUp(500);
                    break;
            }
        });

        var container = viewConversations.getView("conversationContainer");
        var currentLoaded = false;
        container.get().on("scroll",function(e){
            var $this = $(this);
            if ($this.scrollTop() == 0 && !currentLoaded) {
                console.log("Cargando más resultados");
                currentLoaded = true;
                var loaderData = loaderManager.getLoader(currentConv.id);
                console.log("ID conversacion : " + currentConv.id);
                console.log(loaderData);
                loaderData.load({
                    id:currentConv.id,
                    callbacks:{
                        onDataLoaded:function(messages){
                            //Mostramos cada mensaje.
                            messages.forEach(function(message){
                                showMessage(message,{
                                    direction:"asc"
                                });
                            });
                            //Colocamos el scroll en el primer mensaje a mostrar.
                            container.scrollAtChild(messages[0].id);
                            currentLoaded = false;
                        },
                        onNoDataFound:function(){
                            self.notificator.dialog.alert({
                                title:"Ningún Mensaje Encontrado",
                                text:"No se encontrarón más mensajes para esta conversación",
                                level:"info"
                            });
                            currentLoaded = false;
                        }
                    }
                });
            }else{
                console.log("Scroll Cnacelado");
                e.preventDefault();
            }
        });
        
        //Manejador para el borrado de mensajes.
        container.get().on("click","[data-action='deleteMessage']",function(e){
            e.preventDefault();
            var $this = $(this);
            var id = $this.parents(".message-wrapper").data("id");
            //Borramos el mensaje.
            serviceLocator.deleteMessage(id)
            .done(function(){
                console.log("Borrado Mensaje con id : " + id);
                container.getView(id).hide(true);
            }).fail(function(){
                self.notificator.dialog.alert({
                    title:"Mensaje no borrado",
                    text:"No pudo borrarse el mensaje, inténtelo más tarde",
                    level:"warning"
                });
            });
            
        });
        

    }

    //Actualiza número de mensajes.
    var updateNumberMessages = function(idConv,idUser,sent){
        var container = viewConversations.getView("conversationListContainer");
        var convListView = container.getView(idUser);
        //Obtenemos el item de conversación.
        var conv = convListView.getView(idConv);
        //Actualizamos número total de mensajes de la conversación.
        var messages = conv.getView("messages").get();
        messages.text(parseInt(messages.text()) + 1); 
        if (sent) {
            var el = conv.getView("messagesSent").get();
        }else{
            var el = conv.getView("receivedMessages").get();
        }
        el.text(parseInt(el.text()) + 1); 
    }

    //Función para crear la vista de cada uno de los item de conversación
    var showItemConversation = function(conversation){
        //Obtenemos una referencia al contenedor del listado de conversaciones.
        var container = viewConversations.getView("conversationListContainer");
        var idUser = conversation.userOne.id == userConnected.id ? conversation.userTwo.id : conversation.userOne.id;
        var convListView = container.getView(idUser);
        if(convListView){
            var enviados = 0,recibidos = 0;
            //Si trae información sobre el número de mensajes enviado por cada usuario
            // lo recojemos, sino los consideramos como 0.
            if(conversation.userOne && conversation.userTwo){
                enviados = conversation.userOne.id == userConnected.id ? conversation.userOne.mensajes : conversation.userTwo.mensajes;
                recibidos = conversation.userOne.id == userConnected.id ? conversation.userTwo.mensajes : conversation.userOne.mensajes;
            }

            var info = {
                id:conversation.id,
                name:conversation.name,
                user:idUser
            }

            convListView.createView("conversationItem",{
                id:conversation.id,
                info:JSON.stringify(info),
                convName:conversation.name,
                creation:conversation.creacion,
                messages:conversation.mensajes,
                messagesSent:enviados,
                receivedMessages:recibidos
            });

        }
            

    }

    //Función para insertar mensajes en el DOM.
    var showMessage = function(message,options){

        //Obtenemos una referencia al contenedor de conversaciones.
        var container = viewConversations.getView("conversationContainer");
        var convView = container.getView(message.idConv);
        if(convView){

            var status = "fa-eye-slash";
            
            if(message.status == "LEIDO" || (message.status == "NOLEIDO"  && message.userId != userConnected.id)){
                status = "fa-eye";
            }

            var closeStatus = 'off';
            if(message.status == "NOLEIDO" && message.userId == userConnected.id){
                closeStatus = 'on';
            }


            var photo,animationin,animationout;
            if (message.userId == userConnected.id) {
                photo = userConnected.foto;
                animationin = "slideInLeft";
                animationout = "slideOutLeft";
            }else{
                photo = self.contacts.getContactPhoto(message.userId);
                animationin = "slideInRight";
                animationout = "slideOutRight";
            }

            var direction = (options && options.direction && options.direction.toUpperCase() == "ASC" ) ? "ASC" : "DESC";

            convView.createView("message",{
                id:message.id,
                photo:photo,
                authorName:utils.urldecode(message.userName),
                creation:message.creacion,
                status:status,
                close:closeStatus,
                text:utils.utf8_encode(message.text)
            },{
                handlers:{
                    onCreate:function(view){
                        if(message.userId == userConnected.id){
                            view.get().addClass("emisor");
                        }else{
                            view.get().addClass("receptor");
                        }
                    }
                },
                animations:{
                    animationIn:animationin,
                    animationOut:animationout
                },
                direction:direction
            });

        }

    }

    //Método para mostrar un mensaje pendiente.
    var showPendingMessage = function(conversation){
        if (viewPendingMessages) {
            var container = viewPendingMessages.getView("container");
            var lastMessage = conversation.lastMessage;
            container.createView("message",{
                photo:self.contacts.getContactPhoto(lastMessage.userId),
                convName:conversation.convName,
                userName:"Sergio",
                text:lastMessage.text,
                date:lastMessage.creacion
            });
        };
            
            /*if(!$pendingMessagesContainer.children("[data-idconv='"+message.idConv+"']").length){
                //tema nuevo.
                var $viewPendingMessage = $pendingMessageTemplate.clone(true).removeClass("template");
                $viewPendingMessage.attr({"data-idconv":message.idConv,"data-iduser":message.lastMsg.userId});
                $viewPendingMessage.find("[data-photo]").attr({src:message.lastMsg.foto,alt:"Foto de " + message.lastMsg.userName})
                $viewPendingMessage.find("[data-convname]").text(utils.urldecode(message.lastMsg.convName));
                $viewPendingMessage.find("[data-username]").text(utils.urldecode(message.lastMsg.userName));
                $viewPendingMessage.appendTo($pendingMessagesContainer);
            }else{
                //mensaje nuevo para un tema existente.
                var $viewPendingMessage = $pendingMessagesContainer.children("[data-idconv='"+message.idConv+"']");
            }
            
            //Mostramos los datos del último mensaje.
            if($viewPendingMessage.attr("data-countmsg"))
                var countMessages = parseInt($viewPendingMessage.attr("data-countmsg"))+message.countMsg;
            else
                var countMessages = message.countMsg
            $viewPendingMessage.attr("data-countmsg",countMessages);
            $viewPendingMessage.find("[data-text]").text(message.lastMsg.text);
            $viewPendingMessage.find("[data-date]").text(message.lastMsg.creacion);*/
            
    }

   
    var initConversationList = function(data){
        //Obtenemos una referencia al contenedor de conversaciones.
        var container = viewConversations.getView("conversationListContainer");
        //Intentamos mostrar la conversación
        container.hideAllChild(false).showChild(data.idUser,function(){
            console.log("Lista de conversacines mostradas");
        },function(){
            //Creamos un vista para mostrar el listado de conversaciones.
            container.createView("conversationList",{
                id:data.idUser
            },{
                handlers:{
                    onAfterFirstShow:function(view){
                        data.conversations && data.conversations.forEach(showItemConversation);
                    },
                    onAfterShow:function(view){
                        var conv = view.getView(data.active);
                        conv.addClass("active").getView('body').get().slideDown(500);
                    }
                }
            });
        });
        
    }

    var initConversation = function(conversation){
        currentConv = conversation;
        if (loaderManager.existsLoader(currentConv.id)) {
            loaderData = loaderManager.getLoader(currentConv.id);
        }else{
            loaderData = loaderManager.createLoader(currentConv.id,{
                minResultShown:MIN_MESSAGES_BY_CONV,
                dataStepts:MESSAGES_STEPS,
                service:"getMessages"
            });
        }
        console.log(loaderData);
        var title = viewConversations.getView("title");
        title.get().text(conversation.name);
        //Obtenemos una referencia al contenedor de conversaciones.
        var container = viewConversations.getView("conversationContainer");
        //Intentamos mostrar la conversación
        container.hideAllChild(false).showChild(conversation.id,
        function(){
            console.log("Conversación ya cargada");
        },
        function(){
            //Creamos la vista para esta conversación.
            container.createView("conversation",{
                id:conversation.id
            },{
                handlers:{
                    onAfterFirstShow:function(view){

                        loaderData.load({
                            id:conversation.id,
                            filter:{
                                value:"",
                                field:"text"
                            },
                            callbacks:{
                                onDataLoaded:function(messages){
                                    //Mostramos cada mensaje.
                                    messages.forEach(function(message){
                                        showMessage(message,{
                                            direction:"asc"
                                        });
                                    });

                                    container.scrollAt(view.getHeight());

                                    //Recogemos los mensajes que hemos recibido y que no hemos visto
                                    var unseenMessages = messages.filter(function(message){
                                        if(message.status == "NOLEIDO" && message.userId !== userConnected.id){
                                            return true;
                                        }else{
                                            return false;
                                        }
                                    });
                                    console.log("Mensajes no vistos");
                                    console.log(unseenMessages);
                                    //Comprobamos si hemos encontrado alguno.
                                    if(unseenMessages.length){
                                        //Actualizamos los mensajes "NOLEIDOS" a "LEIDOS"
                                        serviceLocator
                                        .updateMessagesStatus(currentConv.user,unseenMessages.map(function(message){
                                            return {
                                                id:message.id,
                                                emisor:message.userId,
                                                idConv:message.idConv
                                            };
                                        })).done(function(ids){
                                            pendingMessages = pendingMessages.filter(function(message){
                                                if(ids.indexOf(message.id) == -1){
                                                    return true;
                                                }else{
                                                    return false;   
                                                }
                                            });
                                            //Notificamos que el usuario acaba de ver mensajes nuevos.
                                            self.triggerEvent("VIEWED_POST");
                                        });
                                    }  
                                },
                                onNoDataFound:function(){
                                    self.notificator.dialog.alert({
                                        title:"Ningún mensaje encontrado",
                                        text:"Esta conversación no tiene mensajes",
                                        level:"info"
                                    });
                                }
                            }
                        });

                    },
                    onAfterShow:function(view){
                        container.scrollAt(view.getHeight());
                    },
                    onBeforeHide:function(view){
                        container.scrollAt(view.getHeight());
                        if (view.size() > MAX_MESSAGES_BY_CONV) {
                            var diff = view.size() - MAX_MESSAGES_BY_CONV;
                            view.removeNthChilds(diff);
                            var pos = (MAX_MESSAGES_BY_CONV - MIN_MESSAGES_BY_CONV) / MESSAGES_STEPS + 1;
                            console.log("Posición a la que se reseteará : " + pos + " la conversacion : " + view.getId());
                            loaderManager.resetLoaderTo(view.getId(),pos);
                        };
                        
                        
                    }
                }
            });
            

        });

    }

    //Obtiene la información de las conversaciones entre estos usuarios.
    var getConversationsFor = function(idUser,idConv){

        var deferred = $.Deferred();
        //Obtenemos todas las conversaciones entre estos usuarios.
        serviceLocator
        .getConversations(userConnected.id,idUser)
        .done(function(conversations){
            if(conversations.length){
                //Obtenemos la conversación a iniciar
                if(idConv){
                    var idx = conversations.map(function(conversation){
                        return conversation.id;
                    }).indexOf(idConv);
                            
                    if(idx != -1)
                        var conversation = conversations[idx];
                    else
                        //No existe conversación con ese id.
                        var conversation =  conversations[0];
                }else{
                    //Iniciamos por defecto la primera conversación(la más reciente)
                    var conversation = conversations[0];
                }
                console.log("Resolviendo esta promise de hay conversaciones");
                deferred.resolve(conversations,conversation);
                
            }else{

                self.notificator.dialog.prompt({
                    title:"No tienes conversaciones con este usuario, debes proporcionar un nombre para crear una",
                    label:"Crear nueva conversación",
                    informer:"Introduce un nombre",
                    placeholder:"conversación",
                    onSuccess:function(name){
                    
                        serviceLocator
                            .createConversation(userConnected.id,idUser,name)
                            .done(function(conversation){
                                console.log(conversation);
                                deferred.resolve([conversation],conversation);
                            })
                            .fail(function(){
                                deferred.reject();
                            });

                    },
                    onCancel:function(){
                        deferred.reject();
                    }

                });
            }
                
        });

        return deferred.promise();
            
    }

    // API Pública

    Conversation.prototype.onCreate = function() {
        //Configuramos los manejadores generales
        attachHandlers();
        return serviceLocator
        .getPendingMessages(userConnected.id)
        .done(function(messages){
            pendingMessages = messages;
        })
        .fail(function(error){
        });
        
    };

    //Devuelve el número de mensajes no leídos.
    Conversation.prototype.getPendingMessages = function() {
        return pendingMessages.length;
    };

    //Devuelve texto y emisor de cada mensaje pendiente
    Conversation.prototype.getPendingMessagesThumbnails = function(count){
        var deferred = $.Deferred();
        setTimeout(function(){

            deferred.resolve(pendingMessages.slice(0,count).map(function(message){
                return {
                    poster:self.contacts.getContactPhoto(message.userId),
                    title:message.convName + " : " + message.text
                }
            }));
        },5000);
        return deferred.promise();
    }

    Conversation.prototype.showPendingMessages = function() {
        if(pendingMessages.length){
            templating.loadTemplate({
                name:"pending_messages",
                category:"MODULE_VIEWS",
                handlers:{
                    onAfterFirstShow:function(view){
                        viewPendingMessages = view;
                        var conversations = [];
                        //Agrupamos los mensajes por conversaciones.
                        for (var i = 0; i < pendingMessages.length; i++) {
                            var pendingMessage = pendingMessages[i];
                            if (!conversations[pendingMessage.idConv]) {
                                conversations[pendingMessage.idConv] = {
                                    idConv:pendingMessage.idConv,
                                    convName:pendingMessage.convName,
                                    count:1,
                                    lastMessage:pendingMessage
                                }
                            }else{
                                conversations[pendingMessage.idConv].count += 1;
                                conversations[pendingMessage.idConv].lastMessage = pendingMessage;
                            }
                        };

                        conversations.forEach(showPendingMessage);
                    }
                }

            });

        }else{
            throw new Error("No tienes ningún mensaje nuevo");
        }
    };

    //Inicia una conversación con un usuario cuyo id es idUser.
    Conversation.prototype.startConversation = function(idUser,idConv){
        templating.loadTemplate({
            name:"conversations",
            category:"MODULE_VIEWS",
            handlers:{
                onCreate:onCreateViewConversations
            }
        }).done(function(view){

            var container = view.getView("conversationListContainer");
            if (!container.hasView(idUser)) {
                //Obtenemos las conversaciones y la conversación a iniciar.
                getConversationsFor(idUser,idConv).done(function(conversations,conversation){
                    //Iniciamos el listado de conversaciones
                    initConversationList({
                        idUser:idUser,
                        conversations:conversations,
                        active:conversation.id
                    });
                    //Iniciamos la conversación.
                    initConversation({
                        id:conversation.id,
                        name:conversation.name,
                        user:idUser
                    });
                });

            }else{
                console.log("Y existe entorno");
            }

        });
    }

        

    return Conversation;

})(Component,jQuery,environment);