(function(_super,environment,exports){

    var ServiceLocator = (function(){

        __extends(ServiceLocator, _super);

        //Identifica Servicios WebSocket
        const WEBSOCKET_SERVICE = 1;
        //Identifica Servicios HTTP
        const HTTP_SERVICE = 2;

        var self;

        function ServiceLocator(utils,debug,sessionManager){
            self = this;
            this.utils = utils;
            this.debug = debug;
            this.sessionManager = sessionManager;

        }



        //Método para resolver el servicio, en función de su tipo.
        var resolveService = function(service){
            var promise = null;
            if (service.type == WEBSOCKET_SERVICE) {
                promise = WebSocketResolverService.getInstance().resolve(service);
            }else if(service.type == HTTP_SERVICE){
                promise = HttpResolverService.getInstance().resolve(service);
            }
            return promise;
        }

        ServiceLocator.prototype.addEventListener = function(events,callback,one) {
            WebSocketResolverService.getInstance().addEventListener(events,callback,one);
        };

        /*
        
            API de Servicios
            =========================================
            Aquí se encuentran los servicions disponibles, consumidos por el resto
            de módulos y que se resolverán remotamente.
        */


        ServiceLocator.prototype.authenticate = function(credentials) {
            return resolveService({
                service:"USER_AUTHENTICATOR",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    nick:credentials.nick,
                    password:credentials.password
                }
            });
        };

        ServiceLocator.prototype.getUserConnectedData = function(){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"GET_USER_CONNECTED_DATA",
                type:WEBSOCKET_SERVICE,
                encode:false,
                params:null
            });
        }

        ServiceLocator.prototype.checkExistsUser = function(email) {
            return resolveService({
                service:"CHECK_EXISTS_USER",
                encode:true,
                params:{
                    email:email
                }
            });
        };
        
        ServiceLocator.prototype.notifyInitSession = function(idUser,contacts){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"NOTIFY_INIT_SESSION",
                type:WEBSOCKET_SERVICE,
                encode:true,
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
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"SEARCH_USERS",
                type:WEBSOCKET_SERVICE,
                encode:true,
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
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"NOTIFY_USER_STATUS",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    userId:userId,
                    remoteUserId:remoteUserId,
                    status:status
                }
            });
        }
        
        //Obtener detalles de un usuario.
        ServiceLocator.prototype.getDetailsOfUser = function(id){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"DETAILS_OF_USER",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    id:id
                }
            });
        }
        //Obtener Solicitudes de amistad pendientes.
        ServiceLocator.prototype.getApplicationsOfFriendship = function(idUserConnected){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"PENDING_APPLICATIONS_FRIENDSHIP",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    idUserConnected:idUserConnected
                }
            });
        }
        //Aceptar una Solicitud de amistad.
        ServiceLocator.prototype.acceptApplication = function(idSolicitado,idSolicitador){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"ACCEPT_APPLICATION",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    idSolicitado:idSolicitado,
                    idSolicitador:idSolicitador
                }
            });
        }
        //Rechazar una solicitud de amistad.
        ServiceLocator.prototype.rejectApplication = function(idSolicitado,idSolicitador){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"REJECT_APPLICATION",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    idSolicitado:idSolicitado,
                    idSolicitador:idSolicitador
                }
            });
        }
        //Enviar Solicitud de amistad.
        ServiceLocator.prototype.sendApplication = function(idUserConnected,idUser,message){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"TO_ASK_FOR_FRIENDSHIP",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    idUserConnected:idUserConnected,
                    idUser:idUser,
                    message:self.utils.urlencode(message)
                }
            });
        }
        
        ServiceLocator.prototype.getApplicationForUser = function(usuSolicitador,usuSolicitado){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"GET_APPLICATIONS_FOR_USER",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    usuSolicitador:usuSolicitador,
                    usuSolicitado:usuSolicitado
                }
            });
        }
        
        //Obtener lista de contactos.
        ServiceLocator.prototype.getAllContacts = function(idUser){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"GET_ALL_CONTACTS",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    idUser:idUser
                }
            });
        }
        //Añadir Contacto.
        ServiceLocator.prototype.addContact = function(idSolicitado,idSolicitador){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"ADD_CONTACT",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    idSolicitado:idSolicitado,
                    idSolicitador:idSolicitador
                }
            });
        }
        
        //Borrar contacto
        ServiceLocator.prototype.dropContact = function(user_one,user_two){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"DROP_CONTACT",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    user_one:user_one,
                    user_two:user_two
                }
            });
        }
        
        ServiceLocator.prototype.updateContact = function(user_one,user_two,desc){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"UPDATE_CONTACT",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    user_one:user_one,
                    user_two:user_two,
                    desc:desc
                }
            });
        }

        /*Servicios para las conversaciones*/

        //Obtiene todas las conversaciones en las que participa estos usuarios
        ServiceLocator.prototype.getConversations = function(idUserOne,idUserTwo){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"GET_CONVERSATIONS",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    idUserOne:idUserOne,
                    idUserTwo:idUserTwo
                }
            });
        }
        
        //Crea una nueva conversación.
        ServiceLocator.prototype.createConversation = function(idUserOne,idUserTwo,name){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"CREATE_CONVERSATION",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    idUserOne:idUserOne,
                    idUserTwo:idUserTwo,
                    name:name
                }
            });
        }

        //Borra una conversación cuyo id, es el pasado como argumento
        ServiceLocator.prototype.dropConversation = function(idConv,receptor){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"DROP_CONVERSATION",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    idConv:idConv,
                    receptor:receptor
                }
            });
        }
        //Borra todas la conversaciones existentes entre dos usuarios,
        ServiceLocator.prototype.dropAllConversations = function(user_one,user_two){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"DROP_ALL_CONVERSATIONS",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    user_one:user_one,
                    user_two:user_two
                }
            });
        }
        //Comprueba si ya existe un conversación con ese nombre con ese usuario
        ServiceLocator.prototype.existsConversationName = function(name,user_one,user_two){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"EXISTS_CONVERSATION_NAME",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    name:name,
                    user_one:user_one,
                    user_two:user_two
                }
            });    
        }

        //Obtiene mensajes de una conversación.
        ServiceLocator.prototype.getMessages = function(data){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"GET_MESSAGES",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    idConver:data.idConv,
                    filter:{
                        type:data.type,
                        field:data.field,
                        pattern:data.value
                    },
                    limit:{
                        start:data.start || 0,
                        count:data.count
                    },
                    exclusions:data.exclusions || []
                }
            });
        }
        
        //Obtiene todos los mensajes no leidos
        ServiceLocator.prototype.getPendingMessages = function(idUser){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"GET_PENDING_MESSAGES",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    idUser:idUser
                }
            });        
        }

        ServiceLocator.prototype.uploadFile = function(idConv,file) {

            //You need to use the FormData API and set the jQuery.ajax's processData and contentType to false.
            var fd = new FormData();
            fd.append('token',self.sessionManager.getToken());
            fd.append('service',"UPLOAD_FILE");
            fd.append('type',HTTP_SERVICE);
            fd.append('encode',false);
            fd.append('file',file.data);
            fd.append('params',JSON.stringify({
                idConv:idConv,
                format:file.format
            }));
            
            return resolveService(fd);

        }

        ServiceLocator.prototype.getForecast = function(data) {
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"GET_FORECAST",
                type:HTTP_SERVICE,
                encode:false,
                params:{
                    latitude:data.latitude,
                    longitude:data.longitude,
                    units:data.units
                }
            });
        };

        
        //Enviar un mensaje en una conversación.
        ServiceLocator.prototype.createMessage = function(idConv,idUserEmisor,idUsuRecep,type,content){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"CREATE_MESSAGE",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    idConver:idConv,
                    idUserEmisor:idUserEmisor,
                    idUsuRecep:idUsuRecep,
                    type:type,
                    content:content
                }
            });
        }

        //Elimina un mensaje enviado y que no ha sido leido.
        ServiceLocator.prototype.deleteMessage = function(emisor,receptor,idConv,idMessage) {
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"DELETE_MESSAGE",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    emisor:emisor,
                    receptor:receptor,
                    idConv:idConv,
                    idMessage:idMessage
                }
            });
        };

        //Actualiza el estado de los mensajes "NOLEIDOS"
        ServiceLocator.prototype.updateMessagesStatus = function(receptor,messages){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"UPDATE_MSG_STATUS",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    receptor:receptor,
                    messages:messages
                }
            });
        }
        
        //Notifica a otro usuario la conversación que está visualizando.
        ServiceLocator.prototype.notifyChangeOfConversation = function(emisor,receptor,idConv) {
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"CONVERSATION_CURRENTLY_VIEWING",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    emisor:emisor,
                    receptor:receptor,
                    idConv:idConv
                }
            });
            
        };
        
        
        
        ServiceLocator.prototype.getCalls = function(idUser){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"GET_CALLS",
                type:WEBSOCKET_SERVICE,
                encode:true,
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
                type:WEBSOCKET_SERVICE,
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
                type:WEBSOCKET_SERVICE,
                params:{
                    callId:callId,
                    remoteUserId:remoteUserId
                }
            });    
        }
        
        ServiceLocator.prototype.sharePosition = function(timestamp,formatted_address,address_components,users){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"SHARE_POSITION",
                type:WEBSOCKET_SERVICE,
                encode:true,
                params:{
                    user:self.sessionManager.getUser().id,
                    timestamp:timestamp,
                    formatted_address:formatted_address,
                    address_components:Object.keys(address_components).map(function(component){
                        return address_components[component];
                    }),
                    users:users
                }
            });
        }

        ServiceLocator.prototype.getLatestSportsNews = function(count,lastDate) {
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"GET_LATEST_SPORTS_NEWS",
                type:HTTP_SERVICE,
                encode:true,
                params:{
                    count:count,
                    lastDate:lastDate || null
                }
            });
        };

        ServiceLocator.prototype.getLatestTechnologyNews = function(count,lastDate) {
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"GET_LATEST_TECHNOLOGY_NEWS",
                type:HTTP_SERVICE,
                encode:true,
                params:{
                    count:count,
                    lastDate:lastDate || null
                }
            });
        };

        ServiceLocator.prototype.getGeneralNewsToday = function(count,lastDate){
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"GET_LATEST_GENERAL_NEWS",
                type:HTTP_SERVICE,
                encode:true,
                params:{
                    count:count,
                    lastDate:lastDate || null
                }
            });
        }

        ServiceLocator.prototype.getLatestVideoGamesNews = function(count,lastDate) {
            return resolveService({
                token:self.sessionManager.getToken(),
                service:"GET_LATEST_VIDEOGAMES_NEWS",
                type:HTTP_SERVICE,
                encode:true,
                params:{
                    count:count,
                    lastDate:lastDate || null
                }
            });
        };

        //Pendiente de revisión.
        ServiceLocator.prototype.logout = function(){
            return enqueueRequest({
                token:self.sessionManager.getToken(),
                service:"LOGOUT",
                type:WEBSOCKET_SERVICE,
                params:null
            });
        }


        return ServiceLocator;


    })();

    //Resolutor de servicios WebSocket.
    var WebSocketResolverService = (function(){

        __extends(WebSocketResolverService, _super);

        const IP = '127.0.0.1';
        const PORT = 30000;

        var self,socket,currentRequest = null,pendingRequest = [],timerReenvio = null,instance = null;

        function WebSocketResolverService(){
            self = this;
            this.utils = environment.getService("UTILS");
            this.debug = environment.getService("DEBUG");
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
                "DELETE_MESSAGE":[],
                "TALK_USER_CHANGES":[],
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

        var getInstance = function(){
            if (!instance) {
                instance = new WebSocketResolverService();
            }
            return instance;
        }

        //Método para abrir Socket.
        var openSocket = function(){
            
            try{
            
                socket = new WebSocket("ws://"+IP+":"+PORT+"/");
                //Manejador para el evento Open
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

        //Método para codificar en base64 parámetros de una petición.
        var encodeParams = function(params){
    
            for(var param in params){
                if (param[param] instanceof Object) {
                    params[param] = encodeParams(params[param]);
                }else{
                    //si es cadena la codificamos a base64
                    if (isNaN(parseInt(params[param]))) {
                        params[param] = self.utils.utf8_to_b64(params[param]);
                    }
                }
            }
           
            return params;
        }
        
        //Método para descodificar los datos de la respuesta.
        var decodeData = function(params){

            for(var param in params){
                if (params[param] instanceof Object) {
                    params[param] = decodeData(params[param]);
                }else{
                    //si es cadena la decodificamos.
                    if (isNaN(parseInt(params[param]))) {
                        params[param] = self.utils.b64_to_utf8(params[param]);
                    }
                }
            }
    
            return params;
        }

        //Manejador de Mensajes del Servidor WebSocket
        var handlerMessage = function(e){
            //Parseamos la respuesta.
            console.log("RESPUESTA");
            console.log(e.data);
            var response = JSON.parse(e.data);
            
            console.log(response);
            if(response.type == "EVENT"){
                var name = response.name;
                var data = response.data;
                this.triggerEvent(name,data);
            }else if(response.type == "RESPONSE"){

                clearInterval(timerReenvio);
                var msg = response.data.msg && decodeData(response.data.msg);
                if(!response.data.error){
                    //no hay error, resolvemos la promise
                    currentRequest.resolve(msg);
                    //Si hay peticiones pendientes
                }else{
                    // hay error, la rechazamos.
                    currentRequest.reject(msg);
                }
                
                //desencolamos siguiente petición
                dequeueRequest();
            }
           
        }
        
        var sendRequest = function(request){
            currentRequest = request.deferred;
            //codificamos los parámetros a base64.
            if (request.data.encode && request.data.params) {
                request.data.params = encodeParams(request.data.params);
            };
            
            console.log("ENVIANDO PETICION");
            console.log(request.data);
            var request = JSON.stringify(request.data);
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

        WebSocketResolverService.prototype.resolve = function(service) {
            var deferred = $.Deferred();
            if(socket.readyState == 1){
                if(!currentRequest || currentRequest.state() == "resolved" || currentRequest.state() == "rejected"){
                    sendRequest({data:service,deferred:deferred});
                }else{
                    //hay una petición en curso, portanto la encolamos.
                    pendingRequest.push({data:service,deferred:deferred});
                }
            }else{
                //Socket no abierto, encolamos la petición
                pendingRequest.push({data:service,deferred:deferred});
            }
            
            return deferred.promise();
        };
        
        return {
            getInstance:getInstance
        }

    })();


    var HttpResolverService = (function(){

        __extends(HttpResolverService, _super);

        const URL = 'php/httpService.php';

        var instance,self;

        function HttpResolverService(){
            self = this;

        }

        var getInstance = function(){
            if (!instance) {
                instance = new HttpResolverService();
            }
            return instance;
        }

        HttpResolverService.prototype.resolve = function(data) {
            var promise = null;
            if (data instanceof FormData) {
                promise = $.ajax({
                    type: 'POST',
                    url:URL,
                    data: data,
                    processData: false,
                    contentType: false
                });
            }else{
                promise = $.post(URL,data);
            }

            return promise;
        }

        return{
            getInstance:getInstance
        } 

    })();



    exports.ServiceLocator = ServiceLocator;

})(Component,environment,window);

