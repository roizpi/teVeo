
var Conversation = (function(_super,$,environment){

    __extends(Conversation, _super);

    var self;
    //Mensajes pendientes.
    var pendingMessages = [];
    var templating;

    function Conversation(webSpeech,notificator,contacts){

        self = this;
    
        this.webSpeech = webSpeech;
        this.notificator = notificator;
        this.contacts = contacts;
        templating = environment.getService("TEMPLATE_MANAGER");
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


    }


    var attachHandlers = function(){

        var serviceLocator = environment.getService("SERVICE_LOCATOR");

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

            console.log("La vista se cargó");
            console.log(view);


        });
    }

        

    return Conversation;

})(Component,jQuery,environment);