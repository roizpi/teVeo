
var Conversation = (function(_super,$,environment){

    __extends(Conversation, _super);

    var self;
    //Mensajes pendientes.
    var pendingMessages = [];
    var templating;
    var serviceLocator;
    var viewConversations;
    var userConnected;
    var utils;

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

        //configuration handlers
        attachHandlers();
    }

    var onCreateViewConversations = function(view){
        viewConversations = view;

    }


    var attachHandlers = function(){

        

    }

    //Función para crear la vista de cada uno de los item de conversación
    var showItemConversation = function(conversation){
        //Obtenemos una referencia al contenedor del listado de conversaciones.
        var container = viewConversations.getView("conversationListContainer");
        var key = conversation.userOne.id == userConnected.id ? conversation.userTwo.id : conversation.userOne.id;
        var convListView = container.getView("user"+key);
        if(convListView){
            var enviados = 0,recibidos = 0;
            //Si trae información sobre el número de mensajes enviado por cada usuario
            // lo recojemos, sino los consideramos como 0.
            if(conversation.userOne && conversation.userTwo){
                enviados = conversation.userOne.id == userConnected.id ? conversation.userOne.mensajes : conversation.userTwo.mensajes;
                recibidos = conversation.userOne.id == userConnected.id ? conversation.userTwo.mensajes : conversation.userOne.mensajes;
            }

            convListView.createView("conversationItem",{
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
        container.hideAllChild(false).showChild("user"+data.idUser,function(){
            console.log("Lista de conversacines mostradas");
        },function(){
            //Creamos un vista para mostrar el listado de conversaciones.
            container.createView("conversationList",{
                id:"user"+data.idUser
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
        //Obtenemos una referencia al contenedor de conversaciones.
        var container = viewConversations.getView("conversationContainer");
        //Intentamos mostrar la conversación
        container.hideAllChild(false).showChild(conversation.id,function(){
            console.log("Conversación Mostrada");
        },function(){
            //Creamos la vista para esta conversación.
            container.createView("conversation",{
                id:conversation.id
            },{
                handlers:{
                    onAfterShow:function(view){
                        //Obtenemos los mensajes para esta conversación.
                        serviceLocator
                        .getMessages(conversation.id)
                        .done(function(messages){
                            //Mostramos cada mensaje.
                            messages.forEach(function(message){
                                showMessage(message);
                            });

                            container.scrollAt(view.getHeight());    
                        })
                        .fail();
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

                initConversationList({
                    idUser:idUser,
                    conversations:conversations
                });

                initConversation(conversation);
            }
                
        });
            
    }

    //Método para la restauración de un entorno.
    var restoreEnviroment = function(idUser,idConv,callback){

        //viewConversations
        

    }

    // API Pública

    //Devuelve el número de mensajes no leídos.
    Conversation.prototype.getNumberOfPendingMessages = function() {
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