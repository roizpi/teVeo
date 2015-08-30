
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
    var loaderData;
    var viewConversations;
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
                //Filtramos los mensajes.
                conv.filterChild(text);
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
            console.log("Conversación Actual");
            console.log(currentConv);
            serviceLocator
            .createMessage(currentConv.id,userConnected.id,currentConv.user,text)
            .done(function(message){
                //Mostramos  el mensaje enviado.
                showMessage(message);
                //Colocamos el scroll en el último mensaje.
                container.scrollToLast();
                $.ionSound.play("acceptYourApplication");
                //Actualizamos número de mensajes para la conversación
                //updateConvCountMsg(idConv,idUser,"ENVIADO");
            })
            .fail(function(){
                //fallo al enviar el mesanje.
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
                    console.log("Esta es la info de la conversación");
                    console.log(conversation);
                    //Iniciamos la conversación.
                    initConversation(JSON.parse(conversation));
                    break;
                case 'SHOWBODY':
                    $this.find("[data-body]").slideDown(500).end().siblings().find("[data-body]").slideUp(500)
                    break;
            }
        });

        var container = viewConversations.getView("conversationContainer");
        container.get().on("scroll",function(){
            console.log("Evento Scroll Producido");
            var $this = $(this);
            if ($this.scrollTop() == 0) {
                console.log("Cargando más resultados");
            };
        });


        var loaderDataManager = environment.getService("LOADER_DATA_MANAGER");
        loaderData = loaderDataManager.createLoader({
            minResultShown:MIN_MESSAGES_BY_CONV,
            dataStepts:MESSAGES_STEPS,
            service:"getMessages"
        });
 
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
                countmsg:conversation.mensajes,
                countmensajesenviados:enviados,
                countmensajesrecibidos:recibidos
            });

        }
            

    }

    //Función para insertar mensajes en el DOM.
    var showMessage = function(message){

        //Obtenemos una referencia al contenedor de conversaciones.
        var container = viewConversations.getView("conversationContainer");
        var convView = container.getView(message.idConv);
        if(convView){

            var status = "fa-eye-slash";
            if(message.status == "LEIDO" || (message.status == "NOLEIDO"  && message.userId != userConnected.id)){
                status = "fa-eye";
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

            convView.createView("message",{
                id:message.id,
                photo:photo,
                authorName:utils.urldecode(message.userName),
                creation:message.creacion,
                status:status,
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
                }
            });

        }

    }

    //Método para la creación de conversaciones
    var createConversation = function(name,idUser,callbackSuccess,callbackError){
        //Creamos una conversación con ese nombre.
        serviceLocator
        .createConversation(userConnected.id,idUser,name)
        .done(function(conversation){
            
        })
        .fail();
           
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
                    onAfterShow:function(view){
                        data.conversations && data.conversations.forEach(showItemConversation);
                    }
                }
            });
        });
        
    }

    var initConversation = function(conversation){
        currentConv = conversation;
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

                        //Obtenemos los mensajes para esta conversación.
                        loaderData.setContainer(view);

                        loaderData.load({
                            type:"RESET",
                            id:conversation.id,
                            callbacks:{
                                onDataLoaded:function(messages){
                                    //Mostramos cada mensaje.
                                    messages.forEach(function(message){
                                        showMessage(message);
                                    });

                                    container.scrollAt(view.getHeight());
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


                        

                        /*serviceLocator
                        .getMessages(id,0,MIN_MESSAGES_BY_CONV)
                        .done(function(messages){

                            console.log("NÚMERO DE MENSAJES OBTENIDOS....");
                            console.log(messages.length);
                            

                            //Recogemos los mensajes que hemos recibido y que no hemos visto
                            var msgNoVistos = messages.filter(function(msg){
                                if(msg.status == "NOLEIDO" && msg.userId != userConnected.id){
                                    return true;
                                }else{
                                    return false;
                                }
                            });
                            console.log("Mensajes no vistos");
                            console.log(msgNoVistos);
                            //Comprobamos si hemos encontrado alguno.
                            if(msgNoVistos.length){
                                //Actualizamos los mensajes "NOLEIDOS" a "LEIDOS"
                                serviceLocator
                                    .updateMessagesStatus(userConnected.id,msgNoVistos.map(function(msg){
                                        return {
                                            id:msg.id,
                                            emisor:msg.userId,
                                            idConv:msg.idConv
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
                        })
                        .fail();*/
                    },
                    onAfterShow:function(view){
                        console.log("Colocando Scroll al final...");
                        container.scrollAt(view.getHeight());
                    }
                }
            });
            

        });

    }


    //Inicia la conversación especificada.
    var createEnvironmentFor = function(idUser,idConv){
       
        //Obtenemos todas las conversaciones entre estos usuarios.
        return serviceLocator
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
                //Iniciamos el listado de conversaciones
                initConversationList({
                    idUser:idUser,
                    conversations:conversations
                });
                //Iniciamos la conversación.
                initConversation(conversation);

                
            }
                
        });
            
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


    //Inicia una conversación con un usuario cuyo id es idUser.
    Conversation.prototype.startConversation = function(idUser,idConv){
        templating.loadTemplate({
            name:"conversations",
            category:"MODULE_VIEWS",
            handlers:{
                onCreate:onCreateViewConversations
            }

        }).done(function(view){

           createEnvironmentFor(idUser,idConv).done(function(){

           }).fail(function(){

           });

        });
    }

        

    return Conversation;

})(Component,jQuery,environment);