var ServiceLocator = (function(_super,environment){

    __extends(ServiceLocator, _super);
    
    const IP = '127.0.0.1';
    const PORT = 30000;

    var self;
    var socket;
    var currentRequest = null;
    var pendingRequest = [];
    var timerReenvio = null;

    function ServiceLocator(utils,debug,sessionManager){

        self = this;
        this.utils = utils;
        this.debug = debug;
        this.sessionManager = sessionManager;

        this.events = {
            "USER_CONNECTED":[],
            "USER_DISCONNECTED":[],
            "NEW_USER_STATE":[],
            "NEW_APPLICATION_OF_FRIENDSHIP":[],
            "ACCEPT_YOUR_APPLICATION":[],
            "REJECT_YOUR_APPLICATION":[],
            "NEW_CONTACT":[],
            "DROP_CONTACT":[],
            "NEW_CONVERSATION":[],
            "DROP_CONVERSATION":[],
            "DROP_ALL_CONVERSATION":[],
            "NEW_MESSAGE":[],
            "MENSAJES_LEIDOS":[],
            "OFFER_RECEIVED":[],
            "OFFER_SDP_CHUNK_RECEIVED":[],
            "ANSWER_RECEIVED":[],
            "ANSWER_SDP_CHUNK_RECEIVED":[],
            "CALL_ESTABLISHED":[],
            "CALL_REJECTED":[],
            "CURRENT_CALLING_FINISHED":[],
            "USER_SHARE_YOUR_POSITION":[]
        }

        openSocket();

    }


    var openSocket = function(){
        
        try{
        
            socket = new WebSocket("ws://"+IP+":"+PORT+"/");
            socket.addEventListener("open",function(e){
                self.debug.log('Socket status: '+socket.readyState + '(opened)',"log");
                dequeueRequest();
            });
            //Manejador del Evento Error del Socket.
            socket.addEventListener("error",function(e){
                self.debug.log(e,"error");
            });
            socket.addEventListener("message",function(e){
                handlerMessage.apply(self,[e]);
            });
            //Manejador del Evento Close.
            socket.addEventListener("close",function(){
                self.debug.log('Socket status: '+socket.readyState+' (Closed)',"warning");
                //intentamos inicializar conexión de nuevo.
                setTimeout(function(){
                    openSocket();
                },5000);
            });
            
        } catch(exception){
            self.debug.log(exception,"error");
            
        }

    }


    //Manejador de Mensajes del Servidor WebSocket
    var handlerMessage = function(e){
        //Parseamos la respuesta.
        var response = JSON.parse(e.data);
        self.debug.log(response,"log");
        if(response.type == "EVENT"){
            var name = response.name;
            var data = response.data;
            this.triggerEvent(name,data);
        }else if(response.type == "RESPONSE"){

            clearInterval(timerReenvio);
            
            if(!response.data.error){
                //no hay error, resolvemos la promise
                currentRequest.resolve(response.data.msg);
                //Si hay peticiones pendientes
            }else{
                // hay error, la rechazamos.
                currentRequest.reject(response.data.msg);
            }
            
            //desencolamos siguiente petición
            dequeueRequest();
        }
       
    }
    
    var sendRequest = function($request){
        currentRequest = $request.deferred;
        var request = JSON.stringify($request.data);
        console.log("Enviando petición!!!!!!!!");
        console.log(request);
        socket.send(request);
        timerReenvio = setInterval(function(){
            socket.send(request);
        },30000);
        
    }

    var dequeueRequest = function(){
        if(pendingRequest.length){
            //Desencolamos la siguiente petición
            sendRequest(pendingRequest.shift());
        }
    }
    
    var enqueueRequest = function($request){
        var deferred = $.Deferred();
        if(socket.readyState == 1){
            if(!currentRequest || currentRequest.state() == "resolved" || currentRequest.state() == "rejected"){
                sendRequest({data:$request,deferred:deferred});
            }else{
                //hay una petición en curso, portanto la encolamos.
                pendingRequest.push({data:$request,deferred:deferred});
            }

        }else{
            //Socket no abierto, encolamos la petición
            pendingRequest.push({data:$request,deferred:deferred});
        }
        
        return deferred.promise();
    }
    

    
    /*
        
        API de Servicios
        =========================================
        Aquí se encuentran los servicions disponibles, consumidos por el resto
        de módulos y que se resolverán remotamente.
    
    */

    ServiceLocator.prototype.authenticate = function(credentials) {
        return enqueueRequest({
            service:"USER_AUTHENTICATOR",
            params:{
                nick:credentials.nick,
                password:credentials.password
            }
        });
    };
    
    ServiceLocator.prototype.getUserConnectedData = function(){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"GET_USER_CONNECTED_DATA",
            params:null
        });
    }

    ServiceLocator.prototype.checkExistsUser = function(email) {
        return enqueueRequest({
            service:"CHECK_EXISTS_USER",
            params:{
                email:email
            }
        });
    };
    
    ServiceLocator.prototype.notifyInitSession = function(idUser,contacts){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"NOTIFY_INIT_SESSION",
            params:{
                idUser:idUser,
                contacts:contacts
            }
        });
    }

    //Servicio para Obtener Usuarios.
    ServiceLocator.prototype.searchUsers = function(terms){
        //Validamos las exclusiones.
        var exclusions = terms.exclusions && terms.exclusions.constructor.toString().match(/array/i) ?  terms.exclusions : null;
        //Encolamos la petición.
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"SEARCH_USERS",
            params:{
                idUser:userConnected.id,
                filter:{
                    field:self.utils.urlencode(terms.field),
                    pattern:self.utils.urlencode(terms.value)
                },
                limit:{
                    start:terms.start || 0,
                    count:terms.count
                },
                exclusions:exclusions
                
            }
        });
    }
    
    ServiceLocator.prototype.notifyStatus = function(userId,remoteUserId,status){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"NOTIFY_USER_STATUS",
            params:{
                userId:userId,
                remoteUserId:remoteUserId,
                status:status
            }
        });
    }
    
    //Obtener detalles de un usuario.
    ServiceLocator.prototype.getDetailsOfUser = function(id){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"DETAILS_OF_USER",
            params:{
                id:id
            }
        });
    }
    //Obtener Solicitudes de amistad pendientes.
    ServiceLocator.prototype.getApplicationsOfFriendship = function(idUserConnected){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"PENDING_APPLICATIONS_FRIENDSHIP",
            params:{
                idUserConnected:idUserConnected
            }
        });
    }
    //Aceptar una Solicitud de amistad.
    ServiceLocator.prototype.acceptApplication = function(idSolicitado,idSolicitador){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"ACCEPT_APPLICATION",
            params:{
                idSolicitado:idSolicitado,
                idSolicitador:idSolicitador
            }
        });
    }
    //Rechazar una solicitud de amistad.
    ServiceLocator.prototype.rejectApplication = function(idSolicitado,idSolicitador){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"REJECT_APPLICATION",
            params:{
                idSolicitado:idSolicitado,
                idSolicitador:idSolicitador
            }
        });
    }
    //Enviar Solicitud de amistad.
    ServiceLocator.prototype.sendApplication = function(idUserConnected,idUser,message){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"TO_ASK_FOR_FRIENDSHIP",
            params:{
                idUserConnected:idUserConnected,
                idUser:idUser,
                message:self.utils.urlencode(message)
            }
        });
    }
    
    ServiceLocator.prototype.getApplicationForUser = function(usuSolicitador,usuSolicitado){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"GET_APPLICATIONS_FOR_USER",
            params:{
                usuSolicitador:usuSolicitador,
                usuSolicitado:usuSolicitado
            }
        });
    }
    
    //Obtener lista de contactos.
    ServiceLocator.prototype.getAllContacts = function(idUser){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"GET_ALL_CONTACTS",
            params:{
                idUser:idUser
            }
        });
    }
    //Añadir Contacto.
    ServiceLocator.prototype.addContact = function(idSolicitado,idSolicitador){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"ADD_CONTACT",
            params:{
                idSolicitado:idSolicitado,
                idSolicitador:idSolicitador
            }
        });
    }
    
    //Borrar contacto
    ServiceLocator.prototype.dropContact = function(user_one,user_two){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"DROP_CONTACT",
            params:{
                user_one:user_one,
                user_two:user_two
            }
        });
    }
    
    ServiceLocator.prototype.updateContact = function(user_one,user_two,desc){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"UPDATE_CONTACT",
            params:{
                user_one:user_one,
                user_two:user_two,
                desc:desc
            }
        });
    }
    
    //Enviar un mensaje en una conversación.
    ServiceLocator.prototype.createMessage = function(idConver,idUserEmisor,idUsuRecep,text){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"CREATE_MESSAGE",
            params:{
                idConver:idConver,
                idUserEmisor:idUserEmisor,
                idUsuRecep:idUsuRecep,
                text:self.utils.urlencode(text)
            }
        });
    }
    //Actualiza el estado de los mensajes "NOLEIDOS"
    ServiceLocator.prototype.updateMessagesStatus = function(receptor,messages){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"UPDATE_MSG_STATUS",
            params:{
                receptor:receptor,
                messages:messages
            }
        });
    }
    
    //Obtiene todas las conversaciones en las que participa estos usuarios
    ServiceLocator.prototype.getConversations = function(idUserOne,idUserTwo){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"GET_CONVERSATIONS",
            params:{
                idUserOne:idUserOne,
                idUserTwo:idUserTwo
            }
        });
    }
    
    //Crea una nueva conversación.
    ServiceLocator.prototype.createConversation = function(idUserOne,idUserTwo,name){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"CREATE_CONVERSATION",
            params:{
                idUserOne:idUserOne,
                idUserTwo:idUserTwo,
                name:window.encodeURI(name)
            }
        });
    }
    //Borra una conversación cuyo id, es el pasado como argumento
    ServiceLocator.prototype.dropConversation = function(idConv,otherUser){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"DROP_CONVERSATION",
            params:{
                idConv:idConv,
                otherUser:otherUser
            }
        });
    }
    //Borra todas la conversaciones existentes entre dos usuarios,
    ServiceLocator.prototype.dropAllConversations = function(user_one,user_two){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"DROP_ALL_CONVERSATIONS",
            params:{
                user_one:user_one,
                user_two:user_two
            }
        });
    }
    //Comprueba si ya existe un conversación con ese nombre con ese usuario
    ServiceLocator.prototype.existsConversationName = function(name,user_one,user_two){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"EXISTS_CONVERSATION_NAME",
            params:{
                name:name,
                user_one:user_one,
                user_two:user_two
            }
        });    
    }
    
    //Obtiene todos los mensajes de una conversación
    ServiceLocator.prototype.getMessages = function(idConver){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"GET_MESSAGES",
            params:{
                idConver:idConver
            }
        });
    }
    
    //Obtiene todos los mensajes no leidos
    ServiceLocator.prototype.getPendingMessages = function(idUser){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"GET_PENDING_MESSAGES",
            params:{
                idUser:idUser
            }
        });        
    }
    
    ServiceLocator.prototype.getCalls = function(idUser){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"GET_CALLS",
            params:{
                idUser:idUser
            }
        });
    }
    
    //Envía una oferta (oferta su sdp a otro par remoto)
    ServiceLocator.prototype.sendOffer = function(type,idUsuCaller,idUsuCalled,convName,offer,iceCandidate){
        
        var sdpLength = offer.sdp.length;
        var numChunks = 4;
        console.log("Longitud del SDP : " + sdpLength);
        var chunkSize = Math.ceil(sdpLength/numChunks);
        console.log("Tamaño de cada trozo : " + chunkSize);
        var currentPos = 0;
        var currentChunk = 0;
        
        var sendChunk = function(){
            if(currentChunk < numChunks){
                console.log("Enviando trozo .....");
                return enqueueRequest({
                    token:self.sessionManager.getToken(),
                    service:"SEND_OFFER_SDP_CHUNK",
                    params:{
                        idUsuCaller:idUsuCaller,
                        idUsuCalled:idUsuCalled,
                        numChunk:currentChunk,
                        chunkSdp:offer.sdp.substr(currentPos,chunkSize)
                    }
                    
                }).done(function(){
                    currentPos += chunkSize;
                    currentChunk++;
                    sendChunk();
                });
            }
        }
        
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"SEND_OFFER",
            params:{
                type:type,
                idUsuCaller:idUsuCaller,
                idUsuCalled:idUsuCalled,
                convName:convName,
                iceCandidate:iceCandidate,
                numChunks:numChunks
            }
            
        }).done(function(){
            sendChunk();
        });
        
    }
    //Envía una Answer SDP al peer remoto.
    ServiceLocator.prototype.sendAnswer = function(idUsuCalled,idUsuCaller,answer,iceCandidate){
        var sdpLength = answer.sdp.length;
        var numChunks = 4;
        console.log("Longitud del SDP : " + sdpLength);
        var chunkSize = Math.ceil(sdpLength/numChunks);
        console.log("Tamaño de cada trozo : " + chunkSize);
        var currentPos = 0;
        var currentChunk = 0;
        
        var sendChunk = function(){
            if(currentChunk < numChunks){
                console.log("Enviando trozo .....");
                return enqueueRequest({
                    token:self.sessionManager.getToken(),
                    service:"SEND_ANSWER_SDP_CHUNK",
                    params:{
                        idUsuCaller:idUsuCaller,
                        idUsuCalled:idUsuCalled,
                        numChunk:currentChunk,
                        chunkSdp:answer.sdp.substr(currentPos,chunkSize)
                    }
                    
                }).done(function(){
                    currentPos += chunkSize;
                    currentChunk++;
                    sendChunk();
                });
                                    
            }
        }
        
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"SEND_ANSWER",
            params:{
                idUsuCaller:idUsuCaller,
                idUsuCalled:idUsuCalled,
                iceCandidate:iceCandidate,
                numChunks:numChunks
            }
            
        }).done(function(){
            sendChunk();
        });

    }
    
    ServiceLocator.prototype.saveCall = function(type,caller,called,convName,status){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"SAVE_CALL",
            params:{
                type:type,
                caller:caller,
                called:called,
                convName:convName,
                status:status
            }
        });   
    }
        
    ServiceLocator.prototype.finishCall = function(callId,remoteUserId){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"FINISH_CALL",
            params:{
                callId:callId,
                remoteUserId:remoteUserId
            }
        });    
    }
    
    ServiceLocator.prototype.sharePosition = function(user,timestamp,formatted_address,address_components,users){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"SHARE_POSITION",
            params:{
                user:user,
                timestamp:timestamp,
                formatted_address:self.utils.urlencode(formatted_address),
                address_components:address_components.map(function(component){
                    return self.utils.urlencode(component.long_name);
                }),
                users:users
            }
        });
    }

    ServiceLocator.prototype.logout = function(){
        return enqueueRequest({
            token:self.sessionManager.getToken(),
            service:"LOGOUT",
            params:null
        });
    }
    
    ServiceLocator.prototype.closeConnection = function(){
        socket.close();
    }
    
    
    return ServiceLocator;

})(Component,environment);