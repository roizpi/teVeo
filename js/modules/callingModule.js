var Caller = (function(_super,$) {
        
        __extends(Caller, _super);

        var self;
        var calls = [];
        navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        document.fullscreenElement = document.fullscreenElement || document.webkitfullscreenElement || document.mozfullscreenElement;
        var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        var iceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
        var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
        //Stuns and Turn Servers. (utilizo servidor de pruebas de google)
        var configuration = {"iceServers":[{"url":"stun:stun.1.google.com:19302"}]};
        var options = {
            optional: [
                //DtlsSrtpKeyAgreement is required for Chrome and Firefox to interoperate.
                {DtlsSrtpKeyAgreement: true},
                //RtpDataChannels is required if we want to make use of the DataChannels API on Firefox.
                {RtpDataChannels: true}
            ]
        }
        var dataChannel = null;
        //aloja objeto PeerConnection
        var pc = null;
        var dataChannelOptions = {
            ordered:true,
            maxRetransmitTime: 3000
        };
    
        //Objeto que guarda toda la información de llamada.
        var currentCalling = {};
        var chunksize = 0;
        //Almacena información de una offer sdp entrante
        var currentOffer = {};
        //Almacena información de una answer sdp entrante
        var currentAnswer = {};
        //Almacena información sobre el fichero que se esta enviando.
        var currentFileSending = null;
        //tono de llamada
        var soundCallAlert;
        //Referencia al timer encargado de contabilizar el tiempo de la llamada.
        var timerCallTime = null;
        var dataChannelEvents = {
            onChannelOpened:false,
            onChannelError:false,
            onChannelClosed:false,
            onChannelMessage:false
        }

        function Caller(templateManager,serviceLocator,contacts,notificator,preferences){

            self = this;
            this.templateManager = templateManager;
            this.serviceLocator = serviceLocator;
            this.contacts = contacts;
            this.notificator = notificator;
            this.preferences = preferences;
            //Eventos que notifica el módulo.
            this.eventsModule = {
                "CALLS_AVALIABLE":[],
                "CALL_ESTABLISHED":[],
                "CALL_CLOSE":[],
                "CALL_ABORTED":[],
                "CALL_FINISHED":[]
            }
            //Aplicamos preferencias
            applyPreferences();
            //Configuramos manejadores
            attachHandlers();
            //Obtenemos datos necesarios para el funcionamiento del módulo.
            getData();
        }

        /*
            Métodos privados
            ****************************
        */

        var applyPreferences = function(){

            var sound = self.preferences.getPreference('sound');
            //Recogemos el tono de llamada.
            if(sound && isNaN(sound)){
                soundCallAlert = sound;
            }
        }

        var getView = function(name){
            return self.templateManager.getView({
                moduleName:self.constructor.name,
                templateName:name
            });
        }

        //Manejador para el envío de archivos.
        //Común para archivos seleccionados tradicionalmente
        // o a través de una operación Drag and Drop.
        var handleFileSelect = function(e) {
            
            e.stopPropagation();
            e.preventDefault();
            
            if(currentFileSending == null){
                
                var file = null;
                //Comprobamos el tipo del evento.
                if(e.type == "change"){
                    //usuario selecciona el archivo por el método tradicional.
                    file = e.target.files[0];
                }else if(e.type == "drop"){
                    //paramos la animación
                    $(this).removeClass("flash");
                    //usuario selecciona el archivo arrastrándolo directamente.
                    file = e.originalEvent.dataTransfer.files[0]; 
                }

                if (file) {

                    if(file.type.match(/^video/)){

                        //Mostramos alerta de éxito.
                        self.notificator.dialog.alert({
                            title:"No es posible enviar videos",
                            text:"En una futura versión, se incorporará la posibilidad de enviar videos",
                            level:"warning"
                        });

                    }else{
                        //Obtenemos mensaje de confirmación.
                        var message = "";
                        switch(file.type){
                            case 'application/x-javascript':
                                message = "¿Quieres enviar el archivo javaScript : "+file.name+"?";
                                //configuramos icono del archivo.
                                file.icon = "fa-file-code-o";
                                break;
                            case 'application/pdf':
                                message = "¿Quieres enviar el PDF : "+file.name+"?";
                                //configuramos icono del archivo.
                                file.icon = "fa-file-pdf-o";
                                break;
                            case 'text/plain':
                                message = "¿Quieres enviar el TXT : "+file.name+"?";
                                //configuramos icono del archivo.
                                file.icon = "fa-file-text-o";
                                break;
                            case 'image/png':
                                message = "¿Quieres enviar la imagen PNG : "+file.name+"?";
                                //configuramos icono del archivo.
                                file.icon = "fa-file-image-o";
                                break;
                            case 'image/jpeg':
                                message = "¿Quieres enviar la imagen JPG : "+file.name+"?";
                                //configuramos icono del archivo.
                                file.icon = "fa-file-image-o";
                                break;
                            case 'image/gif':
                                message = "¿Quieres enviar la imagen GIF : "+file.name+"?";
                                //configuramos icono del archivo.
                                file.icon = "fa-file-image-o";
                                break;
                            default:
                                message = "¿Quieres enviar el archivo : "+file.name+"?";
                                //configuramos icono del archivo.
                                file.icon = "fa-file-o";
                                break;
                        }
                        //Pedimos confirmación, antes del envio.
                        self.notificator.dialog.confirm({
                            title:"¿Continuar envío?",
                            text:message
                        },function(){
                            //comenzamos proceso
                            console.log("Tamaño del Fichero : " + file.size);
                            file.id = Math.round((Math.random() * 100000) + 1);
                            //Extraemos trozos de 10240 bytes (10kb).
                            var chunkSize = 10240;
                            var start = 0;
                            var stop = file.size - 1;
                            var numChunks = Math.ceil(file.size/chunkSize);
                            var currentChunk = 1;
                            //crea instancias de un objeto FileReader para leer su contenido en memoria
                            var reader = new FileReader();
                            //Función encargada de trocear el archivo, lee de 1024 a 1024
                            var fetch = function(){
                                console.log("Troceando Fichero .....");
                                if (start<=file.size){
                                    //Extraemos un trozo del archivo (10240 bytes)
                                    //En lugar de leer el archivo completo creamos un blob con 
                                    //el método slice().
                                    // (Un Blob es un objeto que representa datos "en crudo". Fue creado con 
                                    // el propósito de superar las llimiaciones de javaScript para trabajar con datos binarios)
                                    var blob = file.slice(start, start + chunkSize);
                                    //Lo cargamos en memoria
                                    //Lo cargamos en memoria
                                    reader.readAsBinaryString(blob);
                                    start += chunkSize;
                                }
                            }

                            //Se dispara cuando se ha completado la solicitud.
                            reader.addEventListener("loadend",function(e) {
                                //Es necesario comprobar el estado
                                if (e.target.readyState == FileReader.DONE) { // DONE == 2
                                    console.log("Finalice pero bien ....");
                                    //console.log(e.target.result);
                                    //borramos barra de estado.
                                    $("[data-fileid="+file.id+"]").find("progress").remove();
                                    //Notificamos al otro peer la finalización del envío.
                                    dataChannel.send(JSON.stringify({
                                        type:"SEND_FILE_FINISHED",
                                        data:{
                                            msg:"Finalice pero bien..."
                                        }
                                    }));
                                    //Incrementamos el número de ficheros enviados para esta llamada.
                                    currentCalling.countFileSend += 1;
                                }
                            });

                            //Cuando finaliza la carga, se activa el evento onload del lector y 
                            //se puede utilizar su atributo result para acceder a los datos del archivo.
                            reader.addEventListener("load",function(e) {
                                console.log("On load......");
                                var fileChunk = e.target.result;
                                console.log(fileChunk);
                                //Actualizamos barra de progreso.
                                var $progress = $("[data-fileid="+file.id+"]").find("progress");
                                var por = parseInt(start/file.size*100);
                                $progress.attr('value',por);
                                $progress.text(por + '%');
                                //enviamos el chunk.
                                dataChannel.send(JSON.stringify({
                                    type:"NEW_CHUNK_FILE",
                                    data:{
                                        numChunk:currentChunk,
                                        bytesReaded:start,
                                        fileChunk:fileChunk
                                    }
                                }));
                                currentChunk++;
                                fetch(); //Continuamos leyendo
                            });
                            //Configuramos mensaje inicial
                            var startMessage = {
                                type:"SEND_FILE_INIT",
                                data:{
                                    userId:userConnected.id,
                                    foto:userConnected.foto,
                                    userName:userConnected.name,
                                    fileInfo:{
                                        id:file.id,
                                        name:file.name,
                                        type:file.type,
                                        icon:file.icon,
                                        size:file.size,
                                        numChunks:numChunks
                                    },
                                    timestamp:new Date().toLocaleTimeString()
                                }
                            }
                            //Mostramos mensaje.
                            showMessage(startMessage);
                             //colocamos el scroll en el último mensaje recibido.
                            $conversationContainer.scrollTop($conversation.height());
                            //Enviamos mensaje inicial.
                            dataChannel.send(JSON.stringify(startMessage));
                            //Comenzamos a extraer los datos.
                            fetch();
                        });

                    }

                }else{
                    
                    //Mostramos alerta de éxito.
                    self.notificator.dialog.alert({
                        title:"Operación no realizada",
                        text:"Por favor, selecciona un archivo!",
                        level:"warning"
                    });
                }
            }else{

                //Mostramos alerta de éxito.
                self.notificator.dialog.alert({
                    title:"Operación no permitida",
                    text:"No puedes enviar varios archivos a la vez",
                    level:"warning"
                });

            }
            
        }

        //Configura la template de llamadas una vez cargada.
        var commonHandlerTemplate = function(){
            
            var view = this;
            var $formChat = view.getComponent("formChat").get();
            var $actions = view.getComponent("actions").get();

            //Manejador para la acción finalizar llamada.
            $("[data-action='endCall']",$actions).on("click",function(e){
                e.preventDefault();
                //Comprobamos si está habilitado.
                if(!$(this).hasClass("btn-disabled")){
                    //pedimos confirmación
                    self.notificator.dialog.confirm({
                        title:"¿Finalizar llamada?",
                        text:"la llamada será finalizada. ¿Estás Seguro?."
                    },function(){
                        //Finalizamos la llamada, notificándolo al otro usuario.
                        self.serviceLocator.finishCall(currentCalling.callId,currentCalling.remotePeer.id)
                            .done(function(response){

                                //Mostramos alerta de éxito.
                                self.notificator.dialog.alert({
                                    title:"Llamada finalizada correctamente",
                                    text:response.msg,
                                    level:"success"
                                });

                                //Añadimos la llamada
                                addCall(response.call);
                                //Finalizamos la llamada.
                                endCall();

                            })
                            .fail(function(error){

                            });

                    },function(){
                        alert("Operación cancelada..");
                    });
            
                }

            });

            //Manejador para la acción enviar fichero a un par remoto.
            $("[data-action='sendFile']",$actions).on("change",handleFileSelect);
            // Manejadores para la funcionalidad Drag And Drop.
            var $conversationContainer = view.getComponent("conversation").get();
            $conversationContainer.on('dragleave',function(e){
                $(this).removeClass("flash");
            });
            $conversationContainer.on('dragover', function(e){
                e.stopPropagation();
                e.preventDefault();
                e.originalEvent.dataTransfer.dropEffect = 'copy'
                $(this).addClass("flash");
                // // Explicitly show this is a copy.
            });
            $conversationContainer.on('drop', handleFileSelect);
            //Manejador para búsqueda de mensajes.
            $("[data-action='searchMessage']",$this).on("submit",function(e){
                e.preventDefault();
                var val = $(this).find("input[type=search]").val();
                //Filtramos los mensajes por ese valor.
                $conversationContainer.filter(val);
            });
            //Formulario enviar mensaje.
            $formChat.on("submit",function(e){
                e.preventDefault();
                $this = $(this);
                //Obtenemos referencia al mensaje.
                var $message = $("input[data-message]",$this);
                var text = $message.val();
                //limpiamos el mensaje.
                $message.val("");
                //Contruimos el mensaje.
                var message = {
                    type:"TEXT_MESSAGE",
                    data:{
                        userId:userConnected.id,
                        text:text,
                        timestamp:new Date().toLocaleTimeString()
                    }
                }
                //foto:userConnected.foto,
                //userName:userConnected.name,
                //añadimos el mensaje.
                showMessage(message);
                //colocamos el scroll en el último mensaje recibido.
                $conversationContainer.scrollTop($conversation.height());
                //Mandamos el mensaje por el WebRTC DataChannel
                dataChannel.send(JSON.stringify(message));
                //Incrementamos el número de mensajes enviados para esta llamada.
                currentCalling.countMsgSend += 1;
            });
            
            //Implementamos los manejadores del DataChannel
            //Cuando el dataChannel se abre.
            dataChannelEvents.onChannelOpened = function(e){
                console.log("The Data Channel is opened!!!");
                //Guardamos comienzo de la llamada.
                currentCalling.callingStart = new Date().toLocaleString();
                //Comienza contador de tiempo de la llamada
                showCallingTime();
                //Habilitamos botón de envío de formulario.
                $(":submit",$formSendMessages).removeAttr("disabled");
                //borramos preloader.
                $(".preloader",$conversation).remove();
                //habilitamos botones de acción.    
                $(".btn-disabled",$callActions).removeClass("btn-disabled");
            }
            //Cuando el dataChannel se cierra
            dataChannelEvents.onChannelClosed = function(){
                //Finalizamos llamada.
                console.log("El dataChannel se cerró");
            }
            //Cuando se produce un error en el dataChannel.
            dataChannelEvents.onChannelError = function(e){
                console.error("Data Channel Error!!!");
                console.error(e);
            }
            //Cuando este peer recibe un mensaje por el dataChannel.
            dataChannelEvents.onChannelMessage = function(e){
                var message = JSON.parse(e.data);
                switch(message.type){
                    case 'TEXT_MESSAGE':
                        addMessage(message);
                        //incrementamos número de mensajes recibidos.
                        currentCalling.countMsgReceive +=1;
                        break;
                    case 'SEND_FILE_INIT':
                        console.log(message);
                        currentFileSending = message.data.fileInfo;
                        currentFileSending.content = "";
                        addMessage(message);
                        break;
                    case 'NEW_CHUNK_FILE':
                        console.log(message);
                        //Actualizamos barra de progreso.
                        var $progress = $("[data-fileid="+currentFileSending.id+"]").find("progress");
                        var por = parseInt(message.data.bytesReaded/currentFileSending.size*100);
                        $progress.attr('value',por);
                        $progress.text(por + '%');
                        //Concatenamos el chunk.
                        currentFileSending.content += message.data.fileChunk;
                        break;
                    case 'SEND_FILE_FINISHED':
                        console.log(message);
                        utils.binaryStringToBlob(currentFileSending.content,currentFileSending.type)
                            .then(function(blob){
                                 //Borramos barra de progreso.
                                console.log(blob);
                                $("[data-fileid="+currentFileSending.id+"]").find("progress").remove();
                                $("[data-fileid="+currentFileSending.id+"]").find("[data-filename]").wrapInner($("<a>",{href:URL.createObjectURL(blob),title:"Descargar Fichero",download:currentFileSending.name}));
                                currentFileSending = null;
                                //incrementamos contador de ficheros recibidos
                                currentCalling.countFileReceive += 1;
                        });
                        break;
                    }
            }
            
        }


        //Configura los diferentes manejadores de dispositivos.
        var attachHandlers = function(){


            //Este peer ha recibido una constestación, sólo falta establecer la descripción remoto.
            self.serviceLocator.addEventListener("ANSWER_RECEIVED",function(answer){
                currentAnswer = answer;
                currentAnswer.AnswerSdp = {type:"answer",sdp:""};
                console.log(currentAnswer);
    
            });

            //Este evento se dispara cuando recibimos un chunk del Answer SDP del peer remoto.
            self.serviceLocator.addEventListener("ANSWER_SDP_CHUNK_RECEIVED",function(chunk){
                console.log("Recogiendo chunk!!!!!");
                if(!$.isEmptyObject(currentAnswer)){
                    currentAnswer.AnswerSdp.sdp +=  chunk.chunkSdp;
                    if(chunk.numChunk == currentAnswer.numChunks - 1){
                        console.log("Recogida finalizada :");
                        finishNegotation(currentAnswer);
                    }
                    
                }
            });
            
            //Este peer ha recibido una offer Sdp
            self.serviceLocator.addEventListener("OFFER_RECEIVED",function(offer){
                currentOffer = offer;
                currentOffer.offerSdp = {type:"offer",sdp:""};
                console.log(currentOffer);
                
            });
            
            //Este peer está recibiendo los sdp chunks
            self.serviceLocator.addEventListener("OFFER_SDP_CHUNK_RECEIVED",function(chunk){
                console.log("Recogiendo chunk!!!!!");
                if(!$.isEmptyObject(currentOffer)){
                    currentOffer.offerSdp.sdp +=  chunk.chunkSdp;
                    if(chunk.numChunk == currentOffer.numChunks - 1){
                        console.log("Recogida finalizada :");
                        if($.isEmptyObject(currentCalling)){
                            callAlert(currentOffer);
                        }else{
                            
                        }
                    }
                    
                }
            });
            
            //La llamada fue establecida con éxito.
            self.serviceLocator.addEventListener("CALL_ESTABLISHED",function(callId){
                 //Guardamos el id de la llamada.
                currentCalling.callId = callId;
                
            });
            //El otro peer rechazó la llamada
            self.serviceLocator.addEventListener("CALL_REJECTED",function(data){
                console.log("Llamada rechazada....");
                Alertify.dialog.alert(data.msg,function(){
                    //añadimos la llamada.
                    addCall(data.call);
                    //Cancelamos la llamada
                    cancelCall();
                });
            });
            //La llamada ha finalizo por iniciativa del otro peer.
            self.serviceLocator.addEventListener("CURRENT_CALLING_FINISHED",function(data){
                Alertify.dialog.alert(data.msg,function(){
                    //Añadimos la llamada
                    addCall(data.call);
                    //Finalizamos
                    endCall();
                    
                });
            });

            //Configuramos manejador para la template "videoCallingPanel".
            self.templateManager.attachHandlerTemplate({moduleName:self.constructor.name,templateName:"videoCallingPanel"},function(){

                var view = this;
                //Obtenemos referencia al contenedor de los elementos media.
                var mediaContainer = view.getComponent("mediaContainer").getNativeNode();
                //homogeneizamos el método requestFullScreen debido a que es experimental
                mediaContainer.requestFullScreen = mediaContainer.requestFullScreen || mediaContainer.webkitRequestFullScreen || mediaContainer.mozRequestFullScreen;    
                //Elemento para expandir a pantalla completa el video del par remoto.
                $expand = view.getComponent("expand").get();
                $expand.on("click",function(e){
                    e.preventDefault();
                    //levamos al elemento a pantalla completa.
                    mediaContainer.requestFullScreen();
                });
                //configuramos la template.
                handlerTemplate.call(view);
            });
            //Configuramos manejador para la template "callPanel".
            self.templateManager.attachHandlerTemplate({moduleName:self.constructor.name,templateName:"callPanel"},handlerTemplate);
            //Configuramos manejador para la template "calls".
            self.templateManager.attachHandlerTemplate({moduleName:self.constructor.name,templateName:"calls"},function(){

                var view = this;
                var $listOfCalls = view.getComponent("container").get();
                //Plegar y desplegar llamadas.
                $listOfCalls.delegate("[data-head]","click",function(e){
                    e.stopPropagation();
                    var $this = $(this);
                    //Colapsamos todas las demás llamadas.
                    $listOfCalls.find("[data-head]").not($this).next().slideUp("medium");
                    $this.next().slideToggle("medium"); 
                });
                //Filtros de llamadas.
                var $callFilter = view.getComponent("filters").get();
                $callFilter.delegate("[data-action]","click",function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    var $this = $(this);
                    if(!$this.hasClass("active")){
                        $this.addClass("active").siblings().removeClass("active");
                        var action = this.dataset.action;
                        switch(action){
                            case 'seeReceivedCalls':
                                filterCalls(function(call){
                                    if(call.receptor == userConnected.id && call.status == "ESTABLECIDA"){
                                        return true;
                                    }else{
                                        return false;
                                    }
                                });
                                break;
                            case 'seeDialedCalls':
                                filterCalls(function(call){
                                    if(call.emisor == userConnected.id && (call.status == "ESTABLECIDA" || call.status == "RECHAZADA")){
                                        return true;
                                    }else{
                                        return false;
                                    }
                                });
                                break;
                            case 'seeRejectedCalls':
                                filterCalls(function(call){
                                    if(call.receptor == userConnected.id && call.status == "RECHAZADA"){
                                        return true;
                                    }else{
                                        return false;
                                    }
                                });
                                break;
                        }
                    }
                });

                //Mostramos todas las llamadas
                calls.forEach(showCall);

            });

            //Configuramos manejador para la template "callAlertPanel".
            self.templateManager.attachHandlerTemplate({moduleName:self.constructor.name,templateName:"callAlertPanel"},function(){

                var view = this;
                //Obtenemos la referencia al contenedor de acciones.
                var $actions = view.getComponent("actions").get();
                //delegamos en él evento click sobre las acciones que contiene.
                $actions.delegate("a[data-action]","click",function(e){
                    //cancelamos comportamiento por defecto.
                    e.preventDefault();
                    //Eliminamos el contenedor de aviso
                    $(this).parents("#callAlertContainer").remove();                            
                    //paramos el sonido de llamada
                    if(soundCallAlert){
                        $.ionSound.stop(soundCallAlert);
                    }
                    //Recogemos la acción a realizar (ACEPTAR LLAMADA O RECHAZARLA)
                    var action = this.dataset.action;
                    if(action == "answer"){
                        //lanzamos contestación.
                        answer(offer); 
                    }else if(action == "reject"){
                        //rechazamos llamada
                        self.serviceLocator.saveCall(
                            offer.type,//Tipo de llamada.
                            offer.caller,//id del usuario llamador
                            userConnected.id,//id del usuario local
                            offer.convName,//Motivo de la llamada.
                            "RECHAZADA"//Configuramos el estado de la llamada a "RECHAZADA"
                        ).done(function(response){
                            //Notificamos que la llamada fue rechazada.
                            self.notificator.dialog.alert({
                                title:"Llamada Rechazada",
                                text:response.msg,
                                level:"info"
                            });
                            //añadimos la llamada al listado de llamadas.
                            addCall(response.call);
                        }).fail(function(error){


                        });
                    }

                });                            
                                                
            });


            self.contacts.addEventListener("CONTACT_DROPED",function(contact){
                //Eliminamos las llamadas del array.
                var idCalls;
                calls.forEach(function(call){
                    if(call.emisor == contact.id || call.receptor == contact.id){
                        //Guardamos el identificador de la llamada.
                        idCalls.push(call.id);
                        //Eliminamos la llamada.
                    }
                });

                var view = getView("calls");
                //Obtenemos una referencia al contendor de llamadas.
                var $container = view.getComponent("container").get();

                $container.each(function(idx,call){
                    var $call = $(call);
                    if(idCalls.indexOf($call.data("id") > -1)
                        $call.fadeOut(1000,function(){
                            $(this).remove();
                        })
                });
                
            });
            
        }

        //Obtiene los datos necesarios para el funcionamiento del módulo
        var getData = function(){
            //Obtenemos todas las llamadas.
            self.serviceLocator.getCalls(userConnected.id)
                .done(function(callsFinded){
                    //Guardamos llamadas.
                    calls = callsFinded;
                    //Notificamos que las llamadas ya están disponibles.
                    self.triggerEvent("CALLS_AVALIABLE");
                })
                .fail(function(error){
                    console.log(error)
                });
        }

        //Mostra una llamada en la lista    
        var showCall = function(call){
            var view = getView("calls");
            var container = view.getComponent("container");
            var callView = container.getSubtemplate("call");
            if(call.emisor == userConnected.id){
                call.icon = "resources/img/outgoingCall.png";
                call.user = self.contacts.getContactById(call.receptor).data.name;
            }else{
                if(call.status == "RECHAZADA"){
                    call.icon = "resources/img/callRejected.png";
                }else{
                    call.icon = "resources/img/callReceived.png";
                }
                call.user = self.contacts.getContactById(call.receptor).data.name;
            }
            callView.create({
                icon:call.icon,
                user:call.user,
                type:call.type,
                timestamp:"("+call.timestamp+")",
                status:call.status,
                name:call.name,
                duration:call.duracion ? call.duracion : 0,
            }null,function(){
                this.find("[data-head]").effect("highlight",1000);
                container.scrollToLast();
            });
        }

        //Función para insertar mensajes en la conversación.
        var showConversationMessage = function(message){
            var view = getView(currentCalling.type == "VIDEOCALL" ? "videoCallingPanel" : "callPanel");
            var conversation = view.getComponent("conversation");
            var messageView = conversation.getSubtemplate("message");
            var contact = self.contacts.getContactById(message.data.userId);
            var type = message.data.userId == userConnected.id ? "emisor" : "receptor";
            
            if(message.type == "TEXT_MESSAGE"){
                var text = message.data.text;
            }else if(message.type == "SEND_FILE_INIT"){
                var text = $("<div>",{"data-fileid":message.data.fileInfo.id})
                    .append(
                        $("<span>",{class:"fa " + message.data.fileInfo.icon}),
                        $("<p>",{"data-filename":"",text:message.data.fileInfo.name}),
                        $("<progress>",{value:0,max:100,text:'0%'})
                    )
            }

            messageView.create({
                photo:contact.data.foto,
                name:contact.data.name,
                creation:message.data.timestamp,
                text:text
            },null,function(){
                this.addClass(type);
                //Si la conversacción no está visible
                //(el usuario está con otra vista)
                //el mensaje se marca como no visto.
                if (conversation.isVisible())
                    this.attr("data-notseen","true");
                else
                    this.effect("highlight",1000);

                conversation.scrollToLast();
            });     
        }

        var addCall = function(call){
            //guardamos la llamada en el array.
            calls.push(call);
            //obtenemos referencia la vista de llamadas recibidas.
            var view = getView("calls");

            if(view){
                var $listOfCallsContainer = view.getComponent("container").get();
                //Mostramos todas las llamadas
                $listOfCallsContainer.children().show();
                //Desactivamos filtro actual.
                var $filters = view.getComponent("filters").get();
                $filters.children().removeClass("active");
                //Mostramos la llamada.
                showCall(call);
            }
            //Notificamos  que la llamada se ha establecido.
            triggerEvent("newCall");

        }

        var addMessage = function(message){
            //Reproducimos sonido
            $.ionSound.play("acceptYourApplication");
            //Obtenemos referencia a la vista actual.
            var view = getView(currentCalling.type == "VIDEOCALL" ? "videoCallingPanel" : "callPanel");
            //Mostramos todos los mensajes por si hay alguno oculto al filtrar para que no despiste al usuario
            view.getComponent("conversation").showAllChild();
            //mostramos el mensaje
            showConversationMessage(message);
        }

        //Carga el entorno para la comunicación.
        var loadEnviroment = function(callback){
            
            try{

                if(currentCalling.type == "VIDEOCALL"){
                    //videollamada
                    self.templateManager.loadTemplate({
                        moduleName:this.constructor.name,
                        templateName:"videoCallingPanel"
                    },function(){
                        var view = this;
                        //A continuación configuramos aspectos que son cambiantes en cada llamada.
                        //establecemos el título de la conversación
                        var $tittle = view.getComponent("conversationName").get();
                        $tittle.text(currentCalling.convName);
                        //establecemos el nombre del otro usuario.
                        var $remoteUserName = view.getComponent("remoteUserName").get();
                        $remoteUserName.text(currentCalling.remotePeer.name);
                        //establecemos la posición del usuario remoto.
                        var $remoteUserPosition = view.getComponent("remoteUserPosition").get();
                        $remoteUserPosition.text(currentCalling.remotePeer.currentPosition);
                        //Obtenemos el objeto LocalMediaStream
                        navigator.getMedia({video:true,audio:true},function(stream){ 
                            //Guardamos la referencia al objeto LocalMediaStream.
                            currentCalling.localPeer.localMediaStream = stream;
                            //añadimos el stream.
                            pc.addStream(stream);
                            var videoreceptor = view.getComponent("videoreceptor").getNativeNode();
                            //Establecemos la imagen del usuario remoto como imagen de fondo para el vídeo.
                            videoreceptor.style ="background-image:url("+currentCalling.remotePeer.photo+")";
                            //Convertimos el MediaStream en una fuente válida para el video    
                            videoemisor.setAttribute("src",URL.createObjectURL(stream));
                            //lo reproducimos
                            videoemisor.play();
                            //pasamos el testigo a la siguiente operación que enviará la oferta o Contestación  
                            callback(); 
                        },error);
                    });

                }else{
                    //llamada normal
                    self.templateManager.loadTemplate({
                        moduleName:this.constructor.name,
                        templateName:"callPanel"
                    },function(){
                        var view = this;
                        //establecemos el título de la conversación
                        var $tittle = view.getComponent("conversationName").get();
                        $tittle.text(currentCalling.convName);
                        //establecemos el nombre del otro usuario.
                        var $remoteUserName = view.getComponent("remoteUserName").get();
                        $remoteUserName.text(currentCalling.remotePeer.name);
                        //establecemos la posición del usuario remoto.
                        var $remoteUserPosition = view.getComponent("remoteUserPosition").get();
                        $remoteUserPosition.text(currentCalling.remotePeer.currentPosition);
                        //Obtenemos el objeto LocalMediaStream
                        navigator.getMedia({video:false,audio:true},function(stream){ 
                            currentCalling.localPeer.localMediaStream = stream;
                            //añadimos el stream.
                            pc.addStream(stream);
                            //establecemos la imagen del otro usuario como fondo .
                            var $remoteUser = view.getComponent("remoteUser").get();
                            $remoteUser.css("background-image","url("+currentCalling.remotePeer.photo+")");
                            //pasamos el testigo a la siguiente operación que enviará la oferta o Contestación  
                            callback(); 
                        },error);
                    });
                }
                
            }catch(e){
                console.log(e);
            }
        }

        //Restaura el entorno cacheado
        var restoreEnviroment = function(){

            if(currentCalling.type == "VIDEOCALL"){
               $viewPanelAction.children().detach().end().append($templateVideoCalling);
                //Reanudamos los videos.
                videoemisor.play();
                videoreceptor.play();
            }else{
                $viewPanelAction.children().detach().end().append($templateCall);
                audioreceptor.play();
            }
            
            //Destacamos los mensajes que no ha visto.
            $("[data-notseen]",$viewPanelAction).removeAttr("data-notseen").effect("highlight",1000);
            //colocamos el scroll en el último mensaje recibido.
            $conversationContainer.scrollTop($conversation.height());
            
        }

        //Muestra tiempo de la llamada
        var showCallingTime = function(){
            var hours = 0,minutes = 0,seconds = 0;
            var $currentTime = view.getComponent("currentTime").get();
            timerCallTime = setInterval(function(){
                if(seconds == 59){
                    seconds = 0;
                    if(minutes == 59){
                        minutes = 0;
                        hours++;
                    }else{
                        minutes++;
                    }
                }else{
                    seconds++;
                }
                //lo mostramos.
                var result = "";
                result += String(hours).length < 2 ?  0 + String(hours) :  String(hours);
                result += ":" + (String(minutes).length < 2 ?  0 + String(minutes) :  String(minutes));
                result += ":" + (String(seconds).length < 2 ?  0 + String(seconds) :  String(seconds));
                $currentTime.text("Tiempo de llamada : " + result);

            },1000);
        }

        //Filtra llamadas.
        var filterCalls = function(filter){
            if(filter.prototype.toString().search(/function/i)){
                $listOfCallsContainer.children().hide().filter(function(idx,callItem){
                    var $callItem = $(callItem);
                    var infoCall = $callItem.data("infoCall");
                    return filter(infoCall);
                }).show().find("[data-head]").effect("highlight",1000);
            }  
        }

        //Envía una offer sdp a un par remoto.
        var createOffer = function(){
            pc.createOffer(function(offer){
                //establecemos la descrión del para local.
                pc.setLocalDescription(offer);
                console.log("Oferta sdp ");
                console.log(offer);
                //este evento se dispara cuando el par local establezca un candidato ICE
                pc.onicecandidate = function(e){
                    // candidate exists in e.candidate
                    if (e.candidate) {
                        console.log("Mandando candidato ice !!!!!!!");
                        console.log(e.candidate);
                        //eviamos la oferta SDP al otro par.
                        self.serviceLocator.sendOffer(
                            currentCalling.type,//tipo de comunicación (videollamada o llamada)
                            currentCalling.localPeer.id,//id del llamador
                            currentCalling.remotePeer.id,//id del usuario a llamar
                            currentCalling.convName,//nombre de la conversación
                            offer,//offer sdp (descripción del equipo local)
                            e.candidate//cadidato ICE.
                        );
                        //On Chrome, multiple ICE candidates are usually found,
                        // we only need one so I typically send the first one then remove the handler. 
                        //Firefox includes the Candidate in the Offer SDP.
                        pc.onicecandidate = null;
                    }
                
                };
                
            },error);
        }
    
        //Envía una answer sdp a un par remoto.
        var createAnswer = function(){
            pc.createAnswer(function(answer){
                //establecemos la descripción del par local.
                pc.setLocalDescription(answer);
                
                console.log("Answer sdp ");
                console.log(answer);
                //este evento se dispara cuando el par local establezca un candidato ICE
                pc.onicecandidate = function(e){
                    // candidate exists in e.candidate
                    if (e.candidate) {
                        console.log("Mandando candidato ice !!!!!!!");
                        console.log(e.candidate);
                        //eviamos la oferta SDP al otro par.
                        self.serviceLocator.sendAnswer(
                            currentCalling.localPeer.id,//id del usuario llamado
                            currentCalling.remotePeer.id,//id del usuario llamador
                            answer,//answer sdp (descripción del equipo local)
                            e.candidate//candidato ICE.
                        ); 
                        //On Chrome, multiple ICE candidates are usually found,
                        //we only need one so I typically send the first one then remove the handler. 
                        //Firefox includes the Candidate in the Offer SDP.
                        pc.onicecandidate = null;
                    }
                
                };                
            },error);
            
        }
    
        var createPeerConection = function(){
            //This is the starting point to creating a connection with a peer. 
            //It accepts configuration options about ICE servers to use to establish a connection
            pc = new PeerConnection(configuration,options);
            console.log(pc);
            //Una vez la conexión se haya establecido y si el para remoto ha añadido su stream,
            //se lanzará este evento.
            pc.addEventListener('addstream',function(e){
                currentCalling.remotePeer.localMediaStream = e.stream;
                if(currentCalling.type == "VIDEOCALL"){
                    var view = getView("videoCallingPanel");
                    var video = view.getComponent("videoreceptor").getNativeNode();
                    //Convertimos el MediaStream en una fuente válida para el video 
                    video.setAttribute('src',URL.createObjectURL(e.stream));
                    //lo reproducimos
                    video.play();
                }else{
                    var view = getView("callPanel");
                    var audio = view.getComponent("audioreceptor").getNativeNode();
                    //Convertimos el MediaStream en una fuente válida para el audio 
                    audio.setAttribute('src',URL.createObjectURL(e.stream));
                    //lo reproducimos
                    audio.play();
                }
            });
            
            pc.addEventListener('iceconnectionstatechange',function(e){
                console.log("El estado de la conexión ha cambiado");
                console.log(e);
                console.log(this.iceConnectionState)
                if(this.iceConnectionState == "closed"){
                    alert("Conexión CERRADA!!!!");
                    console.log("Conexión Cerrada!!!!!!");
                    //endCall();
                }
            });
        
        }
        
        //Crea un WebRTC DataChannel para la conexión existente
        var setupDataChannel = function(isInitiator) {
            
            var handlerDataChannel = function(){
                //Cuando se abra el dataChannel con ese peer se habilita el boton enviar.
                dataChannel.onopen = function(e){
                    dataChannelEvents.onChannelOpened(e);
                }
                dataChannel.onerror = function(e){ 
                    dataChannelEvents.onChannelError(e);
                }
                 //Cuando se reciba un mensaje por DataChannel (WebRTC) se muestra el mensaje.
                dataChannel.onmessage = function(e){
                    dataChannelEvents.onChannelMessage(e);
                }
                
                dataChannel.onclose = function(e){
                    dataChannelEvents.onChannelClosed(e)
                };
            
            }
            
            if (isInitiator) {
                // Crear el datachannel para ese peer
                dataChannel = pc.createDataChannel("dataChannel");
                handlerDataChannel();
            } else {
                // Establecer el datachannel para ese peer
                pc.addEventListener("datachannel",function(e){
                    console.log("Evento DataChannel");
                    dataChannel = e.channel;
                    handlerDataChannel();
                });
            }
            
        }

        //Método para contestar a una llamada.
        var answer = function(offer){
            //Obtenemos la información del contacto.
            var currentContact = self.contacts.getContactById(offer.caller);
            //Configuramos Objeto currentCalling.
            currentCalling = {
                localPeer:{
                    id:userConnected.id,
                    name:userConnected.name
                },
                remotePeer:{
                    id:currentContact.data.idRepresentado,
                    name:currentContact.data.name,
                    photo:currentContact.data.foto,
                    currentPosition:currentContact.data.currentPosition && currentContact.data.currentPosition.detail ? currentContact.data.currentPosition.detail.formatted_address : "Ubicación no disponible"
                },
                type:offer.type,
                callId:null,
                convName:offer.convName,
                caller:currentContact.data.idRepresentado,
                countMsgSend:0,
                countMsgReceive:0,
                countFileSend:0,
                countFileReceive:0,
                callingStart:0,
                callingDuration:0
            }
            //Creamos el Peer
            createPeerConection();
            //levantamos el dataChannel indicando que no somos el peer iniciador de la conexión.
            setupDataChannel(false);
            //Cargamos todo el entorno gráfico necesario para la comunicación.
            loadEnviroment(function(){
                //Una vez cargado el entorno establecemos la descripción del para remoto
                pc.setRemoteDescription(new SessionDescription(offer.offerSdp));
                pc.addIceCandidate(new iceCandidate(offer.iceCandidate));
                //Creamos una Answer SDP para terminar de establecer la conexión.
                createAnswer();
                //Notificamos este hecho a otros componentes.
                self.triggerEvent("CALL_ESTABLISHED",{idUser:offer.caller,type:offer.type});
            });
        }

        //Este método es utilizado por el iniciador de la llamada
        // para terminar de establecer la conexión.
        var finishNegotation = function(answer){
            console.log("Finalizando negociación");
            console.log(answer);
            try{
                //Establecemos la descripción del peer remoto.
                pc.setRemoteDescription(new SessionDescription(answer.AnswerSdp));
                //Añadimos el candidato ICE para la conexión.
                pc.addIceCandidate(new iceCandidate(answer.iceCandidate));
                //guardamos información de la llamada.
                self.serviceLocator.saveCall(
                    currentCalling.type,//Tipo de la llamada (VIDEOCALLING, CALL)
                    currentCalling.localPeer.id,//Identificador del par local
                    currentCalling.remotePeer.id,//Identificador del par remoto
                    currentCalling.convName,//Nombre del motivo de la llamada.
                    "ESTABLECIDA"//Indicamos que fue establecida.
                ).done(function(callId){
                    //Guardamos el id de la llamada.
                    currentCalling.callId = callId;
                    //Notificamos a otros componentes que la conexión se ha establecido.
                    triggerEvent("CALL_ESTABLISHED",{
                        idUser:currentCalling.remotePeer.id,//Indicamos el id del peer remoto con el que hemos establecido la conexión.
                        type:currentCalling.type //Indicamos el tipo.
                    });
                }).fail(function(error){

                });
                    
            }catch(e){
                console.error(e);
            }
        }

        
        //Avisa de una llamada entrante
        var callAlert = function(offer){
            //Obtenemos los datos del contacto.
            var currentContact = self.contacts.getContactById(offer.caller);
            if(webSpeechModule.isEnabled()){
                webSpeechModule.speak("Recibiendo llamada de " + currentContact.data.name);
            }
            //reproducimos tono de llamada si está configurado.
            if(soundCallAlert){
                $.ionSound.play(soundCallAlert,{loop:99,volume:"100.0"});
            }
            
            //Configuramos el icono para el tipo de llamada.
            var iconType = offer.type == "VIDEOCALL" ? "fa-video-camera" : "fa-phone";
            //Configuramos el texto para el tipo de llamada.
            var text = offer.type == "VIDEOCALL" ? "Videollamada" : "llamada de voz";
            //creamos el marcado necesario.
            //videollamada
            self.templateManager.loadTemplate({
                moduleName:this.constructor.name,
                templateName:"videoCallingPanel"
            },function(){

                var view = this;
                //le dejamos 14 segundos para cojer la llamada.
                setTimeout(function(){
                    //Si hay tono de llamada paramos su reproducción.
                    if(soundCallAlert){
                        $.ionSound.stop(soundCallAlert);
                    }
                    //desvinculamos la vista del DOM.
                    view.detach();
                    //rechazamos llamada
                    self.serviceLocator.saveCall(
                        offer.type,//Tipo de llamada
                        offer.caller,//id del llamador
                        userConnected.id,//id del llamado
                        offer.convName,//nombre del motivo de la conversación.
                        "RECHAZADA"//Configuramos el estado a "RECHAZADA"
                    ).done(function(response){
                        
                        //Notificamos que la llamada fue rechazada.
                        self.notificator.throwNotification({
                            title:"llamada perdida",
                            icon:currentContact.data.foto,
                            body:currentContact.data.name + " te ha llamado para hablar contigo sobre " + offer.convName
                        });
                        
                        //añadimos la llamada al listado de llamadas.
                        addCall(response.call);

                    }).fail(function(error){

                    });

                },14000);

            }
            
        }

        //Método para finalizar una llamada.
        var endCall = function(){
            //cerramos conexión
            pc.close();
            
            if(currentCalling.type == "VIDEOCALL"){
                //Obtenemos una referencia la vista.
                var view = getView("videoCallingPanel");
                //Video del peer remoto.
                var videoreceptor = view.getComponent("videoreceptor").getNativeNode();
                //Lo pausamos.
                videoreceptor.pause();
                //eliminamos la fuente.
                videoreceptor.removeAttribute("src");
                //quitamos la imagen de fondo.
                videoreceptor.style ="background-image:''";
                //Video del peer local.
                var videoemisor = view.getComponent("videoemisor").getNativeNode();
                //lo pausamos.
                videoemisor.pause();
                //Eliminamos las fuentes de los videos.
                videoemisor.removeAttribute("src");
                
            }else{
                //Obtenemos una referencia la vista.
                var view = getView("callPanel");
                //Obtenemos referencia al audio del peer remoto.
                var audioreceptor = view.getComponent("audioreceptor").getNativeNode();
                //pausamos audio.
                audioreceptor.pause();
                //borramos la fuente del audio.
                audioreceptor.removeAttribute("src");
                audioreceptor.previousElementSibling.style = "background-image:''";
            }
            
            //Cerramos el streaming local
            currentCalling.localPeer.localMediaStream.stop();
            //Guardamos la duración final de la llamada.
            var $callingDuration = view.getComponent("currentTime").get();
            currentCalling.callingDuration = $callingDuration.text();
            //Borramos el tiempo de llamada.
            $callingDuration.text("");
            //Paramos el contador de tiempo de llamada
            clearInterval(timerCallTime);
            //mostramos resumen de la llamada.
            self.templateManager.loadTemplate({
                moduleName:this.constructor.name,
                templateName:"resumeCall"
            },function(){

                currentCalling = {};
                    
                var view = this;
                //Mostramos el tipo de llamada.
                view.getComponent("type").get().text((currentCalling.type == "VIDEOCALL" ? "Videollamada" : "llamada de voz") + " finalizada");
                //Mostramos el asunto de la llamada.
                view.getComponent("conversation_name").get().text("Asunto de la Llamada : " + currentCalling.convName);
                //Mostramos cuando comenzó llamada.
                view.getComponent("calling_start").get().text(currentCalling.callingStart);
                //Mostramos la duración de la llamada.
                view.getComponent("calling_duration").get().text(currentCalling.callingDuration);
                //Mostramos nombre del llamador.
                view.getComponent("caller_name").get().text((currentCalling.localPeer.id == currentCalling.caller ? currentCalling.localPeer.name : currentCalling.remotePeer.name));
                //Mostramos el nombre del llamado.
                view.getComponent("called_name").get().text((currentCalling.localPeer.id == currentCalling.caller ? currentCalling.remotePeer.name : currentCalling.localPeer.name));
                //Mostramos el número de mensajes enviados.
                view.getComponent("messages_sended").get().text(currentCalling.countMsgSend);
                //Mostramos el número de mensajes recibidos.
                view.getComponent("messages_recieved").get().text(currentCalling.countMsgReceive);
                //Mostramos el número de fichero enviados.
                view.getComponent("file_sended").get().text(currentCalling.countFileSend);
                //Mostramos el número de ficheros recibidos.
                view.getComponent("file_received").get().text(currentCalling.countFileReceive);
              
                var timerNotifyCallFinished =  setTimeout(function(){
                    //Notificamos evento callFinished.Este módulo ya no tiene nada más que hacer.
                    triggerEvent("CALL_FINISHED");
                },60000);

            });
            //vaciamos contenedor de mensajes.
            //$conversation.empty().append($preloader);
            //Indicamos que la llamada se ha cerrado.
            self.triggerEvent("CALL_CLOSE");
        }
        //Cancela una llamada todavía no establecida.
        var cancelCall = function(){
            //cerramos conexión
            pc.close();
            //Cerramos el streaming local
            currentCalling.localPeer.localMediaStream.stop();
        
            if(currentCalling.type == "VIDEOCALL"){
                //Obtenemos una referencia la vista.
                var view = getView("videoCallingPanel");
                //Video del peer remoto.
                var videoreceptor = view.getComponent("videoreceptor").getNativeNode();
                videoreceptor.style ="background-image:''";
                //Video del peer local.
                var videoemisor = view.getComponent("videoemisor").getNativeNode();
                //Eliminamos la fuentes del video emisor.
                videoemisor.removeAttribute("src");
                
            }else{

                //Obtenemos referencia al audio del peer remoto.
                var audioreceptor = view.getComponent("audioreceptor").getNativeNode();
                audioreceptor.previousElementSibling.style = "background-image:''";
            }

            //Eliminamos información de la llamada actual.
            currentCalling = {};
            //Notificamos evento callFinished.
            triggerEvent("CALL_ABORTED"); 
        }
        
        
        //Lanzamos por consola los posibles errores.
        var error = function(error){
            console.log(error);
            endCall();
        }

        
        /*
            Métodos Públicos
            *****************
        */

        //Método Público 
        Caller.prototype.showListOfCall = function(){
            if(calls.length){

                this.templateManager.loadTemplate({
                    moduleName:this.constructor.name,
                    templateName:"calls"
                });

            }else{
               throw new CallException("Ninguna llamada encontrada","No has realizado ninguna llamada","info");
            }
        }
        //Dice si hay una llamada en curso con un usuario.
        Caller.prototype.noCallInProgress = function(idUser){
            return !$.isEmptyObject(currentCalling) && currentCalling.remotePeer.id == idUser ;
        }
        //Devuelve el número de llamadas entre dos usuarios
        Caller.prototype.getNumCallsWidth = function(idUser){
            return calls.filter(function(call){
                if(call.emisor == idUser || call.receptor == idUser)
                    return true;
                else
                    return false;
            }).length;
        }
        //Obtiene el número de llamadas realizadas por el usuario hoy.
        Caller.prototype.getNumberOfCallsToday = function(){
            return calls.filter(function(call){
                if(call.emisor == userConnected.id && new Date(call.timestamp).getDate() == new Date().getDate()){
                    return true;
                }else{
                    return false;
                }
            }).length;
        }
        //Obtiene el número de llamadas recibidas por el usuario hoy
        Caller.prototype.getNumberOfCallsReceivedToday = function(){
            return calls.filter(function(call){
                if(call.receptor == userConnected.id && new Date(call.timestamp).getDate() == new Date().getDate()){
                    return true;
                }else{
                    return false;
                }
            }).length;
        }


        //Método público para iniciar una llamada.
        // Simplementa hay que indicar el id del usuario a llamar
        // y si se trata de una videollamada.
        Caller.prototype.call = function(idUser,videoCalling) {
   
            if($.isEmptyObject(currentCalling)){
                //No hay ninguna llamada en curso.
                var currentContact = this.contacts.getContactById(idUser);
                //Comprobamos si el usuario está disponible.
                if(currentContact.data.status.toUpperCase() == "DISPONIBLE" || currentContact.data.status.toUpperCase() == "AUSENTE"){
                    //usuario conectado.
                    Alertify.dialog.prompt("Introduce nombre de la conversación", function (name) { 
                        if (name){
                            //Configuramos Objeto CurrentCalling
                            currentCalling = {
                                localPeer:{
                                    id:userConnected.id,
                                    name:userConnected.name
                                },
                                remotePeer:{
                                    id:currentContact.data.idRepresentado,
                                    name:currentContact.data.name,
                                    photo:currentContact.data.foto,
                                    currentPosition:currentContact.data.currentPosition && currentContact.data.currentPosition.detail ? currentContact.data.currentPosition.detail.formatted_address : "Ubicación no disponible"
                                },
                                type:videoCalling ? "VIDEOCALL" : "CALL",
                                callId:null,
                                convName:name,
                                caller:userConnected.id,
                                countMsgSend:0,
                                countMsgReceive:0,
                                countFileSend:0,
                                countFileReceive:0,
                                callingStart:0,
                                callingDuration:0
                            }
                            //Creamos el Peer
                            createPeerConection();
                            //levantamos el dataChannel indicando que somos el peer iniciador de la conexión.
                            setupDataChannel(true);
                            //cargamos todo el entorno gráfico necesario.
                            loadEnviroment(function(){
                                //creamos una Offer SDP para iniciar la conexión.
                                createOffer();
                            });
                        }
                    });
                    
                }else if(currentContact.data.status.toUpperCase() == "OCUPADO"){
                    //El usuario está OCUPADO en otra conversación.
                    var type = videoCalling ? "videollamada" : "llamada de voz";
                    //lanzamos excepción que explica este hecho.
                    throw new CallException("La " + type + " no se puede realizar","El usuario está ocupado, espera a que vuelva a estar disponible","info");
                }else{
                    //El usuario no está disponible para iniciar la conexión.
                    var type = videoCalling ? "videollamada" : "llamada de voz";
                    if(currentContact.data.sexo == "H"){
                        var message = currentContact.data.name + " está desconectado, no puede establecer una "+type+" con él";
                    }else{
                        var message = currentContact.data.name + " está desconectada, no puede establecer una "+type+" con ella";
                    }
                    //lanzamos excepción que explica este hecho.
                    throw new CallException("La " + type + " no se puede realizar",message,"info");
                }
            }else{
                
                var type = videoCalling ? "VIDEOCALL" : "CALL";
                if(type != currentCalling.type){
                    var msg = currentCalling.type  == "VIDEOCALL" ? "videollamada" : "llamada de voz";
                    throw new CallException("La " + type + " no se puede realizar","Ya hay una "+msg+" en curso","warning");
                }else if(currentCalling.remotePeer.id != idUser)
                    throw new CallException("La " + type + " no se puede realizar","Debes finalizar primero la llamada en curso","warning");
                else
                    //restauramos el entorno cacheado.
                    restoreEnviroment();
            }
            
        }

    return Caller;

})(Component,jQuery);
        
        
        
        
        
        
        
        
     
