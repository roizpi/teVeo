var Conversation = (function(_super,$,environment){

    __extends(Conversation, _super);

    //Número máximo de mensajes por conversación
    const MAX_MESSAGES_BY_CONV = 20;
    const MIN_MESSAGES_BY_CONV = 10;
    const MESSAGES_STEPS = 5;

    const MESSAGE_SENT = 1;
    const MESSAGE_RECEIVED = 2;
    const MESSAGE_DELETED = 3;


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
    var currentTalksRemoteUsers = {};
    var current
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
                //Obtenemos número de mensajes pendientes.
                var count = pendingMessages.filter(function(pendingMessage){
                    return pendingMessage.idConv == message.idConv ? true : false;
                }).length;
                updateNumberPendingMessages(message.userId,message.idConv,count);
                //Notificamos que hay un nuevo mensaje no visto.
                self.triggerEvent("NEW_PENDING_MESSAGE");
                    
            }

            //Actualizamos número de mensajes para la conversación
            updateNumberMessages(message.idConv,message.userId,MESSAGE_RECEIVED);
            //Mostramos el mensaje.
            showMessage(message);
           
        });
        
        //Manejador para el evento DELETE_MESSAGE.
        //Evento producido cuando el usuario borra un mensaje que este usuario todavía no ha visualizado.
        serviceLocator.addEventListener("DELETE_MESSAGE",function(message){
            var conv = getConversation(message.conv);
            conv && conv.removeChild(message.id);
            //Obtenemos el índice del mensaje pendiente.
            var idx = pendingMessages.map(function(pendingMessage){
                return pendingMessage.id;
            }).indexOf(message.id);
            //Eliminamos el mensaje pendiente.
            pendingMessages = pendingMessages.splice(idx,1);
            //Obtenemos total de mensajes.
            var count = self.getPendingMessagesByConv(message.conv);
            updateNumberPendingMessages(message.user,message.conv,count);

        });
        
        //Manejador para el evento MENSAJES_LEIDOS.
        //Este Evento se produce cuando un usuario ha visto un mensaje escrito
        // por este usuario.
        serviceLocator.addEventListener("MENSAJES_LEIDOS",function(response){
            console.log("Mensajes leidos");
            console.log(response);
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
                                message.setChildValue("close","off");
                            };
                           
                        });
                    };
                }
            }
            
        });

        //Manejador para el evento TALK_USER_CHANGES
        //Este Evento se produce cuando un usuario cambia de conversación
        serviceLocator.addEventListener("TALK_USER_CHANGES",function(response){

            if (!currentTalksRemoteUsers[response.idUser]) {
                //Notificamos el cambio de conversación.
                serviceLocator.notifyChangeOfConversation(userConnected.id,currentConv.user,currentConv.id);
                //Guardamos como activa esta conversación para el usuario remoto.
                currentTalksRemoteUsers[response.idUser] = response.idConv;
                var conv = getConversationItem(response.idUser,response.idConv);
                conv && conv.setChildValue("visible","on");
            }else{

                if (currentTalksRemoteUsers[response.idUser] != response.idConv) {
                    var lastConv = getConversationItem(response.idUser,currentTalksRemoteUsers[response.idUser]);
                    lastConv && lastConv.setChildValue("visible","off");
                    //Guardamos como activa esta conversación para el usuario remoto.
                    currentTalksRemoteUsers[response.idUser] = response.idConv;
                    var conv = getConversationItem(response.idUser,response.idConv);
                    conv && conv.setChildValue("visible","on");

                };

            }

        });

        //Manejador para el evento NEW_CONVERSATION
        //Un usuario de su lista de contacto quiere iniciar una nueva conversación
        serviceLocator.addEventListener("NEW_CONVERSATION",function(conversation){
            console.log("Nueva conversación recibida");
            console.log(conversation);
            var idUser = userConnected.id == conversation.user_one.id ? conversation.user_two.id : conversation.user_one.id;
            var user = self.contacts.getContactById(idUser);
            //Reproducimos sonido
            $.ionSound.play("acceptYourApplication");
            self.notificator.throwNotification({
                title:"Nueva Conversación iniciada",
                icon:user.data.foto,
                body:user.data.name + " quiere hablar contigo sobre : " + conversation.name
            });
            //Mostramos el item de conversación.
            showItemConversation(conversation);
        });

        //Manejador para el evento DROP_CONVERSATION.
        //Un usuario a borrado eliminado un tema.
        serviceLocator.addEventListener("DROP_CONVERSATION",function(conversation){
            var idUser = userConnected.id == conversation.user_one ? conversation.user_two : conversation.user_one;
            var user = self.contacts.getContactById(idUser);
            //Reproducimos sonido
            $.ionSound.play("acceptYourApplication");
            self.notificator.throwNotification({
                title:"Conversación Borrada",
                icon:user.data.foto,
                body:user.data.name + " ha borrado la conversación : " + conversation.name
            });
        });
        
    }


    //Manejadores para la vista de conversaciones.
    var onCreateViewConversations = function(view){
        viewConversations = view;
        $('.fancybox').fancybox({
            padding: 0,
            openEffect : 'elastic',
            openSpeed  : 150,
            closeEffect : 'elastic',
            closeSpeed  : 150,
            closeClick : true
        });

        
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
                if (text) {
                    exclusions = conv.filterChild(text,true);
                }else{
                    console.log("Borrando todos los mensajes...");
                    conv.hideAllChild(true);
                }
                
                if (conv.size() < MIN_MESSAGES_BY_CONV) {
                    //Obtenemos la diferencia.
                    var diff = MIN_MESSAGES_BY_CONV - conv.size();
                    //Obtenemos el loader de la conversacion actual.
                    var loaderData = loaderManager.getLoader(currentConv.id);

                    loaderData.load({
                        id:currentConv.id,
                        filter:{
                            type:"message_text",
                            value:text
                        },
                        limit:{
                            count:diff
                        },
                        exclusions:exclusions,
                        callbacks:{
                            onDataLoaded:function(messages){
                                console.log("Estos son los mensajes devueltos....");
                                console.log(messages);
                                var filter = this.filterValue;
                                //Mostramos cada mensaje.
                                messages.forEach(function(message){
                                    createViewMessage(message,{
                                        direction:"asc",
                                        filter:filter
                                    });
                                });

                                //Colocamos el scroll en el último mensaje.
                                container.scrollToLast();
                            },
                            onNoDataFound:function(){

                                if (!conv.size()) {
                                    self.notificator.dialog.alert({
                                        title:"Ningún mensaje encontrado",
                                        text:"No se encontraron mensajes para '" + text + "'",
                                        level:"info"
                                    });
                                };
                                
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
            //Creamos el mensaje de tipo texto.
            createMessage("TEXT",{
                text:text
            });
        }).delegate("[data-action]","click",function(e){
            e.preventDefault();
            e.stopPropagation();
            var action = this.dataset.action.toUpperCase();
            switch(action){
                case "REQUEST_FILE":
                    //Obtenemos el servicio de administración de módulos
                    var managerModule = environment.getService("MANAGER_MODULE");
                    if(managerModule.isExists("FILE_MANAGER") && managerModule.isDeferred("FILE_MANAGER")){
                        //Solicitamos el módulo diferido indicado como parámetro.
                        managerModule.getDefferedModule("FILE_MANAGER",function(fileManager){
                            
                            fileManager.requestFile({
                                title:"Selecciona archivos a enviar"
                            });

                            fileManager.addEventListener("FILE_SELECTED",function(file){

                                serviceLocator.uploadFile(currentConv.id,file).done(function(response){
                                    //Creamos el mensaje.
                                    createMessage(file.type,{
                                        folder:response.data.msg.folder,
                                        name:response.data.msg.name,
                                        format:file.format
                                    });
                                });
                                
                            },true);
                        });

                    }else{
                        console.log("El módulo no existe o no está activado");
                    }
                break;
            }

        });

        //Manejadores para el panel de conversaciones.
        var convListContainer = viewConversations.getView("conversationListContainer");
        convListContainer.get().delegate("[data-action]","click",function(e){
            e.preventDefault();
            var $this = $(this);
            var action = this.dataset.action.toUpperCase();
            switch(action){
                case 'RESTORECONVERSATION':
                    //Comprobamos que no se trata de la conversación actual.
                    if (!$this.hasClass('active')) {
                        convListContainer.get().find("[data-action]").removeClass("active");
                        //Marcamos como activa la conversación y recogemos su información.
                        var conversation = $this.addClass("active").parent().data("info");
                        //Iniciamos la conversación.
                        initConversation(JSON.parse(conversation));
                        //Notificamos el cambio de conversación.
                        serviceLocator.notifyChangeOfConversation(userConnected.id,conversation.user,conversation.id);
                    };
                    break;
                case 'SHOWBODY':
                    $this.find("[data-body]").slideDown(500).end().siblings().find("[data-body]").slideUp(500);
                    break;
                case 'DROPCONVERSATION':
                    var info = $this.parent().data("info");
                    var conversation = JSON.parse(info);
                    //Pedimos confirmación.
                    self.notificator.dialog.confirm({
                        title:"Eliminar Conversación " + conversation.name,
                        text:"¿Estás seguro que deseas eliminar esta conversación?. Todos sus mensajes serán eliminados",
                        onSuccess:function(){
                            //Borramos la conversación.
                            dropConversation(conversation,function(){
                                //Eliminamos la conversación del panel de conversaciones.
                                var conv = getConversation(conversation.id);
                                conv && conv.hide(true);
                                var convList = convListContainer.getView(conversation.user);
                                //Ocultamos el item de conversación.
                                convList.hideChild(conversation.id,true,function(){
                                    //Si borramos la conversación actual, debemos cambiar a otra.
                                    if (currentConv.id == conversation.id) {
                                        //Comprobamos si disponemos de más conversaciones.
                                        if (convList.size()) {
                                            var id = convList.getViewIds().shift();
                                            convList.getView(id).getView("restore").dispatch("click");
                                        }else{
                                            //Preguntamos al usuario si quiere crear nueva conversación.
                                            self.notificator.dialog.confirm({
                                                title:"Crear Nueva Conversación",
                                                text:"No existen más conversaciones con este usuario, ¿Deseas crear una nueva?",
                                                onSuccess:function(){
                                                    var remoteUser = conversation.user;
                                                    //Creamos nueva conversación.
                                                    createConversation(remoteUser,function(conversation){
                                                        //La marcamos como activa.
                                                        conversation.active = true;
                                                        showItemConversation(conversation);
                                                        
                                                    },function(){
                                                        console.log("Fallo al crear conversación");
                                                    });
                                                },
                                                onCancel:function(){

                                                    //Notificamos que no quedan conversaciones.
                                                    self.triggerEvent("ANY_CONVERSATION_FOUND");
                                                }
                                            });
                                                              
                                        }
                                    }

                                });
                                
                            });
                        }
                    });
                break;
            }
        });

        var container = viewConversations.getView("conversationContainer");
        var currentLoaded = false;
        container.get().perfectScrollbar().on("scroll",function(e){
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
                            var filter = this.filterValue;
                            //Mostramos cada mensaje.
                            messages.forEach(function(message){
                                createViewMessage(message,{
                                    direction:"asc",
                                    filter:filter
                                });
                            });
                            //Colocamos el scroll en el primer mensaje a mostrar.
                            container.scrollAtChild(messages[0].id);
                            currentLoaded = false;
                        },
                        onNoDataFound:function(){
                            self.notificator.dialog.alert({
                                title:"Final de la conversación",
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
            serviceLocator.deleteMessage(userConnected.id,currentConv.user,currentConv.id,id)
            .done(function(){
                container.getView(id).hide(true);
                //Colocamos el scroll al final.
                container.scrollToLast();
                //Actualizamo el contandor de mensajes.
                updateNumberMessages(currentConv.id,currentConv.user,MESSAGE_DELETED);
                //Incrementamos el cargador de datos.
                var loaderData = loaderManager.getLoader(currentConv.id);
                loaderData.decrementAmount(1);

            }).fail(function(){
                self.notificator.dialog.alert({
                    title:"Mensaje no borrado",
                    text:"No pudo borrarse el mensaje, inténtelo más tarde",
                    level:"warning"
                });
            });
            
        });
        //Manejador para el elemento create_conversation
        var createConv = viewConversations.getView("createConv");
        createConv.get().on("click",function(e){
            e.preventDefault();
            createConversation(currentConv.user,function(conversation){
                //La marcamos como activa.
                conversation.active = true;
                //La mostramos en el panel de conversaciones
                showItemConversation(conversation);
                
            },function(){
                //la creación ha fallado.
            });
        });
        

    }


    var getConversationPanel = function(idUser){
        //Obtenemos el contenedor del panel de conversación.
        var container = viewConversations.getView("conversationListContainer");
        //Obtenemos el panel del usuario con el id especificado.
        var convListView = container.getView(idUser);
        return convListView;
    }

    var getConversationItem = function(idUser,idConv){
        var conv = null;
        //Obtenemos el contenedor del panel de conversación.
        var container = viewConversations.getView("conversationListContainer");
        //Obtenemos el panel del usuario con el id especificado.
        var convListView = container.getView(idUser);
        if (convListView) {
            conv = convListView.getView(idConv);
        }
        return conv;
    }

    var getConversation = function(idConv){
        //Obtenemos una referencia al contenedor de conversaciones.
        var container = viewConversations.getView("conversationContainer");
        var conv = container.getView(idConv);
        return conv;
    }

    //Crea una nueva conversación.
    //Solicita un nombre de conversación y procede a crearla.
    //Adicionalmente recibe dos manejadores ejecutados en caso de éxito o error.
    var createConversation = function(user,success,fail){

        self.notificator.dialog.prompt({
            title:"Crear nueva conversación",
            label:"Crear nueva conversación",
            informer:"Introduce un nombre",
            placeholder:"conversación",
            onSuccess:function(name){
                    
                serviceLocator
                    .createConversation(userConnected.id,user,name)
                    .done(function(conversation){
                        typeof(success) == "function" && success(conversation);
                    })
                    .fail(function(){
                        typeof(fail) == "function" && fail();        
                    });

            },
            onCancel:function(){
                typeof(fail) == "function" && fail();
            }

        });

    }
    //Elimina una conversación especificada.
    var dropConversation = function(conversation,callback){
        //Utilizamos el servicio dropConversation para borrar la conversación y notificarlo al otro usuario.
        serviceLocator
        .dropConversation(conversation.id,conversation.user)
        .done(function(){
            //Mostramos alerta de información en caso de éxito.
            self.notificator.dialog.alert({
                title:"Conversación Borrada",
                text:"La conversación " + conversation.name + " fue borrada con éxito",
                level:"info"
            });

            //Eliminamos los mensajes pendientes para esta conversación.
            pendingMessages = pendingMessages.filter(function(message){
                return message.idConv == conversation.id ? false : true;
            });

            typeof(callback) == "function" && callback();

        });
                  
    }

    //Actualiza contador de número de mensajes pendientes.
    var updateNumberPendingMessages = function(idUser,idConv,value){
        //Obtenemos el item de conversación.
        var conv = getConversationItem(idUser,idConv);
        if (conv) {
            if (value) {
                conv.setChildValue("pending",value);
            }else{
                conv.removeChildValue("pending");
            }
            
        };

    }

    //Actualiza número de mensajes.
    var updateNumberMessages = function(idConv,idUser,type){
        //Obtenemos el item de conversación.
        var conv = getConversationItem(idUser,idConv);
        var messages = conv.getView("messages").get();

        if ((type == MESSAGE_RECEIVED) || (type == MESSAGE_SENT) ) {
            messages.text(parseInt(messages.text()) + 1);
            var el = type == MESSAGE_RECEIVED ? conv.getView("receivedMessages").get() : conv.getView("messagesSent").get();
            el.text(parseInt(el.text()) + 1);
        }else if(type == MESSAGE_DELETED){
            messages.text(parseInt(messages.text()) - 1);
            var el = conv.getView("messagesSent").get();
            el.text(parseInt(el.text()) - 1);
        }
        
    }

    //Función para crear la vista de cada uno de los item de conversación
    var showItemConversation = function(conversation){
        var idUser = conversation.user_one.id == userConnected.id ? conversation.user_two.id : conversation.user_one.id;
        var convListView = getConversationPanel(idUser);

        if(convListView){
            var enviados = 0,recibidos = 0;
            //Si trae información sobre el número de mensajes enviado por cada usuario
            // lo recojemos, sino los consideramos como 0.
            if(conversation.user_one && conversation.user_two){
                enviados = conversation.user_one.id == userConnected.id ? conversation.user_one.mensajes : conversation.user_two.mensajes;
                recibidos = conversation.user_one.id == userConnected.id ? conversation.user_two.mensajes : conversation.user_one.mensajes;
            }

            //Obtenemos número de mensajes pendientes.
            var pending = pendingMessages.filter(function(message){
                return message.idConv == conversation.id ? true : false;
            }).length;

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
                receivedMessages:recibidos,
                pending:pending,
                visible:'off'
            },{
                handlers:{
                    onAfterShow:function(view){
                        if (conversation.active) {
                            view.getView("restore").dispatch("click");
                        };
                    },
                    onBeforeHide:function(view){
                        view.get().find("[data-body]").slideUp();
                    }
                }
            });

        }
            

    }

    //Método para crear un nuevo mensaje.
    var createMessage = function(type,data){
        //Creamos el mensaje.
        serviceLocator.createMessage(
            currentConv.id,//Id de la conversacion actual
            userConnected.id,//Id del usuario que maneja la aplicacion
            currentConv.user,//Id del otro participante en la conversación
            type,//Tipo de mensaje
            data//Data del mensaje
            ).done(function(message){
                //Actualizamos número de mensajes para la conversación
                updateNumberMessages(currentConv.id,currentConv.user,MESSAGE_SENT);
                //Mostramos el mensaje.
                showMessage(message);
            })
            .fail(function(){
                //fallo al enviar el mensaje.
            });
    }

    var showMessage = function(message){
        $.ionSound.play("acceptYourApplication");
        var loaderData = loaderManager.getLoader(message.idConv);

        if (message.type.toUpperCase() == 'TEXT') {
            var filter = loaderData.getFilter();
            var pattern = new RegExp(filter,'im');
            //comprobamos si el mensaje concuerda con el patrón actual.
            if (message.text.match(pattern)) {
                //Mostramos  el mensaje enviado.
                createViewMessage(message,{
                    direction:"desc",
                    filter:filter
                });
                //Colocamos el scroll al final del contenedor.
                var container = viewConversations.getView("conversationContainer");
                //Colocamos el scroll en el último mensaje.
                container.scrollToLast();
                //Incrementamos la cantidad de datos.
                loaderData.increaseAmount(1);
            };

        }else if(message.type.toUpperCase() == 'IMAGE'){
            //Mostramos  el mensaje enviado.
            createViewMessage(message,{
                direction:"desc"
            });
            //Colocamos el scroll al final del contenedor.
            var container = viewConversations.getView("conversationContainer");
            //Colocamos el scroll en el último mensaje.
            container.scrollToLast();
            //Incrementamos la cantidad de datos.
            loaderData.increaseAmount(1);
        }
             
    }

    //Función para insertar mensajes en el DOM.
    var createViewMessage = function(message,options){
        var conv = getConversation(message.idConv)
        if(conv){

            var user = null;
            if(message.userId != userConnected.id){
                user = self.contacts.getContactById(message.userId).data;
            }else{
                user = userConnected;
            }
            
            var status = "fa-eye-slash";
            
            if(message.status == "LEIDO" || (message.status == "NOLEIDO"  && user.id != userConnected.id)){
                status = "fa-eye";
            }

            var closeStatus = 'off';
            if(message.status == "NOLEIDO" && user.id == userConnected.id){
                closeStatus = 'on';
            }


            var animationin,animationout;
            if (user.id != userConnected.id) {
                animationin = "slideInLeft";
                animationout = "slideOutLeft";
            }else{
                animationin = "slideInRight";
                animationout = "slideOutRight";
            }

            var direction = (options && options.direction && options.direction.toUpperCase() == "ASC" ) ? "ASC" : "DESC";
            
            conv.createView("message",{
                id:message.id,
                photo:user.foto
            },{
                handlers:{
                    onCreate:function(view){
     
                        if(user.id == userConnected.id){
                            view.get().addClass("emisor");
                        }else{
                            view.get().addClass("receptor");
                        }
                        if (options) {
                            options.filter && view.highlight(options.filter);
                        };   
                    },
                    onAfterFirstShow:function(view){

                        var view_name,data;
                        switch(message.type){
                            case "TEXT":
                                view_name = "textContent";
                                data = {
                                    authorName:user.name,
                                    creation:message.creacion,
                                    status:status,
                                    close:closeStatus,
                                    text:message.text
                                }
                                break;
                            case "IMAGE":
                                view_name = "imgContent";
                                var src = message.folder + message.name + "." + message.format;
                                data = {
                                    details:{
                                        href:src,
                                        title:"Imagen de prueba"
                                    },
                                    img:src
                                }
                                break;
                            case "AUDIO":
                                view_name = "soundContent";

                        }

                        //Creamos contenido del mensaje.
                        view.createView(view_name,data,{
                            animations:{
                                animationIn:animationin,
                                animationOut:animationout
                            }
                        });
                    }
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

    //Inicializa el panel de conversaciones.
    var initConversationList = function(data){
        //Obtenemos una referencia al contenedor de conversaciones.
        var container = viewConversations.getView("conversationListContainer");
        //Obtenemos el nombre del contancto.
        var name = self.contacts.getContactFirstName(data.idUser);
        var $userName = viewConversations.getView("userName").get();
        $userName.text(name).removeData("textillate").textillate({ 
            in: { 
                effect: 'fadeInLeftBig',
                delayScale: 1.5,
                delay: 50
            },
            out: { effect: 'fadeOutLeftBig', sync: true },
            autoStart: true,
            type: 'char'
        });
        //Intentamos mostrar la conversación
        container.hideAllChild(false).done(function(){
            container.showChild(data.idUser,function(){
                console.log("Lista de conversacines mostradas");
            },function(){
                //Creamos un vista para mostrar el listado de conversaciones.
                container.createView("conversationList",{
                    id:data.idUser
                },{
                    handlers:{
                        onAfterFirstShow:function(view){
                            data.conversations && data.conversations.forEach(showItemConversation);
                        }
                    }
                });
            });
        });
        
    }
    //Inicia el panel de la conversación.
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
        //Configuramos el título
        var $title = viewConversations.getView("title").get();
        $title.text(conversation.name).removeData("textillate").textillate({ 
            in: { 
                effect: 'fadeInLeftBig',
                delayScale: 1.5,
                delay: 50
            },
            out: { effect: 'fadeOutLeftBig', sync: true },
            autoStart: true,
            type: 'char'
        });

        //Obtenemos una referencia al contenedor de conversaciones.
        var container = viewConversations.getView("conversationContainer");
        //Intentamos mostrar la conversación
        container.hideAllChild(false).done(function(){
            container.showChild(conversation.id,function(){
                console.log("Conversación ya cargada");
            },function(){
                //Creamos la vista para esta conversación.
                container.createView("conversation",{
                    id:conversation.id
                },{
                    handlers:{
                        onAfterFirstShow:function(view){
                            console.log("Circle Audio Player");
                            console.log($("audio desde initConversation"));
                            $("audio").circleAudioPlayer();
                            loaderData.load({
                                id:conversation.id,
                                callbacks:{
                                    onDataLoaded:function(messages){
                                        var filter = this.filterValue;

                                        //Mostramos cada mensaje.
                                        messages.forEach(function(message){
                                            createViewMessage(message,{
                                                direction:"asc",
                                                filter:filter
                                            });
                                        });
                                        //Colocamos el scroll en el último mensaje.
                                        container.scrollToLast();
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
                        onBeforeHide:function(view){
                            container.scrollToLast();
                        },
                        onAfterShow:function(view){
                            
                            //Recogemos los mensajes que hemos recibido y que no hemos visto
                            var unseenMessages = pendingMessages.filter(function(message){
                                if(message.idConv == currentConv.id && message.status == "NOLEIDO" && message.userId !== userConnected.id){
                                    return true;
                                }else{
                                    return false;
                                }
                            });
                            
                            console.log("Mensajes no vistos");
                            console.log(unseenMessages);
                            //Comprobamos si hemos encontrado alguno.
                            if(unseenMessages.length){
                                updateNumberPendingMessages(currentConv.user,currentConv.id,"");
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
                                            return ids.indexOf(message.id) >= 0 ? false : true;
                                        });
                                        //Notificamos que el usuario acaba de ver mensajes nuevos.
                                        self.triggerEvent("VIEWED_POST");
                                    });
                            }  

                            
                        },
                        onBeforeHide:function(view){
                            if (view.size() > MAX_MESSAGES_BY_CONV) {
                                var diff = view.size() - MAX_MESSAGES_BY_CONV;
                                view.removeNthFirstChilds(diff);
                                loaderManager.resetLoaderTo(view.getId(),MAX_MESSAGES_BY_CONV);
                            };

                               
                        }
                    }
                });
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
                var idx = 0;
                //Obtenemos la conversación a iniciar
                if(idConv){
                    idx = conversations.map(function(conversation){
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
                //Marcamos la conversación activa.
                conversations[(idx != -1 ? idx : 0)].active = true;
                console.log("Resolviendo esta promise de hay conversaciones");
                deferred.resolve(conversations,conversation);
                
            }else{

                createConversation(idUser,function(conversation){
                    conversation.active = true;
                    deferred.resolve([conversation],conversation);
                },function(){
                    deferred.reject();
                });

                
            }
                
        });

        return deferred.promise();
            
    }

    // API Pública

    Conversation.prototype.onCreate = function() {
        //Configuramos los manejadores generales
        attachHandlers();
        /*Retornamos la promise del servicio getPendingMessages
        para que el administrador de módulos espere a que estén
        los mensajes pendientes cargados*/
        return serviceLocator
        .getPendingMessages(userConnected.id)
        .done(function(messages){
            pendingMessages = messages;
        })
        .fail(function(error){
        });
        
    };

    Conversation.prototype.getPendingMessagesByConv = function(idConv) {
        return pendingMessages.filter(function(pendingMessage){
            return pendingMessage.idConv == idConv ? true : false;
        }).length;
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
            //Comprobamos si existe panel de conversaciones para este usuario.
            if (!container.hasView(idUser)) {
                //Obtenemos las conversaciones y la conversación a iniciar.
                getConversationsFor(idUser,idConv).done(function(conversations,conversation){
                    
                    //Iniciamos el listado de conversaciones
                    initConversationList({
                        idUser:idUser,
                        conversations:conversations
                    });
    
                });

            }else{
                //Comprobamos si dispone de alguna conversarción.
                var conv = container.getView(idUser);
                if (!conv.size()) {
                    //No existen conversaciones.
                    createConversation(idUser,function(conversation){
                        //La marcamos como activa.
                        conversation.active = true;
                        showItemConversation(conversation);                                
                    },function(){
                        //Notificamos que no hay conversaciones.
                        self.triggerEvent("ANY_CONVERSATION_FOUND");
                    });
                }else{
                    //Iniciamos el listado de conversaciones
                    initConversationList({
                        idUser:idUser
                    });
                }
            }

        });
    }

        

    return Conversation;

})(Component,jQuery,environment);