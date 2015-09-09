#!/usr/bin/env php
<?php
require_once 'funciones.inc.php';
require_once 'controllers/baseController.php';
require_once 'vendor/phpWebSocketServer/websockets.php';

class ServerSocket extends WebSocketServer {
  //protected $maxBufferSize = 1048576; //1MB... overkill for an echo server, but potentially plausible for other applications.
    private $clients;
    private $serviceMap;
    
    
    public function __construct($addr, $port){
        parent::__construct($addr, $port);
        $this->clients = new SplObjectStorage();
        // Services
        $this->serviceMap = array(
            "GET_USER_CONNECTED_DATA" => array(
                "controller" => array(
                    "controller_name" => "userController",
                    "action_name" => "getUserConnectedData"
                ),
                "token_required" => true,
                "require_user_id" => true,
                "task_before_send" => "attachUser",
                "throw_event" => false
            ),
            "GET_LATEST_SPORTS_NEWS" => array(
                "controller" => array(
                    "controller_name" => "newsController",
                    "action_name" => "getLatestSportsNews"
                ),
                "token_required" => true,
                "throw_event" => false
            ),
            "GET_LATEST_TECHNOLOGY_NEWS" => array(
                "controller" => array(
                    "controller_name" => "newsController",
                    "action_name" => "getLatestTechnologyNews"
                ),
                "token_required" => true,
                "throw_event" => false
            ),
            "GET_LATEST_GENERAL_NEWS" => array(
                "controller" => array(
                    "controller_name" => "newsController",
                    "action_name" => "getGeneralNewsToday"
                ),
                "token_required" => true,
                "throw_event" => false
            ),
            "GET_LATEST_VIDEOGAMES_NEWS" => array(
                "controller" => array(
                    "controller_name" => "newsController",
                    "action_name" => "getLatestVideoGamesNews"
                ),
                "token_required" => true,
                "throw_event" => false
            ),
            "NOTIFY_INIT_SESSION" => array(
                "controller" => array(
                    "controller_name" => "contactosController",
                    "action_name" => "notifyInitSession"
                ),
                "token_required" => true,
                "throw_event" => true
            ),
            "USER_AUTHENTICATOR" => array(
                "controller" => array(
                    "controller_name" => "authController",
                    "action_name" => "login"
                ),
                "throw_event" => false
            ),
            "CHECK_EXISTS_USER" => array(
                "controller" => array(
                    "controller_name" => "userController",
                    "action_name" => "existsUser"
                ),
                "throw_event" => false
            ),
            "LOGOUT" => array(
                "controller" => array(
                    "controller_name" => "userController",
                    "action_name" => "closeConnection"
                ),
                "require_user_id" => true,
                "task_before_send" => "detachUser",
                "throw_event" => true
            ),
            "NOTIFY_USER_STATUS" => array(
                "controller" => array(
                    "controller_name" => "contactosController",
                    "action_name" => "notifyUserStatus"
                ),
                "throw_event" => true
            ),
            "SEARCH_USERS" => array(
                "controller" => array(
                    "controller_name" => "userController" ,
                    "action_name" => "searchUsers"
                ),
                "throw_event" => false
            ),
            "DETAILS_OF_USER" => array(
                "controller" => array(
                    "controller_name" => "userController",
                    "action_name" => "getUserDetails"
                ),
                "throw_event" => false
            ),
            "TO_ASK_FOR_FRIENDSHIP" => array(
                "controller" => array(
                    "controller_name" => "solicitudesController",
                    "action_name" => "addApplication"
                ),
                "throw_event" => true
            ),
            "GET_APPLICATIONS_FOR_USER" => array(
                "controller" => array(
                    "controller_name" => "solicitudesController",
                    "action_name" => "getApplicationForUser"
                ),
                "throw_event" => false
            ),
            "PENDING_APPLICATIONS_FRIENDSHIP" => array(
                "controller" => array(
                    "controller_name" => "solicitudesController",
                    "action_name" => "getApplicationsOfFriendship"
                ),
                "throw_event" => false
            ),
            "ACCEPT_APPLICATION" => array(
                "controller" => array(
                    "controller_name" => "solicitudesController",
                    "action_name" => "acceptApplication"
                ),
                "throw_event" => true
            ),
            "REJECT_APPLICATION" => array(
                "controller" => array(
                    "controller_name" => "solicitudesController",
                    "action_name" => "rejectApplication"
                ),
                "throw_event" => true
            ),
            "GET_ALL_CONTACTS" => array(
                "controller" => array(
                    "controller_name" => "contactosController",
                    "action_name" => "getAllContacts"
                ),
                "throw_event" => false
            ),
            "ADD_CONTACT" => array(
                "controller" => array(
                    "controller_name" => "contactosController",
                    "action_name" => "addContact"
                ),
                "throw_event" => true
            ),
            "DROP_CONTACT" => array(
                "controller" => array(
                    "controller_name" => "contactosController",
                    "action_name" => "dropContact"
                ),
                "throw_event" => true
            ),
            "UPDATE_CONTACT" => array(
                "controller" => array(
                    "controller_name" => "contactosController",
                    "action_name" => "updateContact"
                ),
                "throw_event" => false
            ),
            "GET_CONVERSATIONS" => array(
                "controller" => array(
                    "controller_name" => "conversationController",
                    "action_name" => "getConversations"
                ),
                "throw_event" => false
            ),
            "CREATE_CONVERSATION" => array(
                "controller" => array(
                    "controller_name" => "conversationController",
                    "action_name" => "createConversation"
                ),
                "throw_event" => true
            ),
            "CONVERSATION_CURRENTLY_VIEWING" => array(
                "controller" => array(
                    "controller_name" => "conversationController",
                    "action_name" => "notifyConversationCurrentlyViewing"
                ),
                "token_required" => true,
                "throw_event" => true
            ),
            "DROP_CONVERSATION" => array(
                "controller" => array(
                    "controller_name" => "conversationController",
                    "action_name" => "dropConversation"
                ),
                "throw_event" => true
            ),
            "DROP_ALL_CONVERSATIONS" => array(
                "controller" => array(
                    "controller_name" => "conversationController",
                    "action_name" => "dropAllConversation"
                ),
                "throw_event" => true
            ),
            "EXISTS_CONVERSATION_NAME" => array(
                "controller" => array(
                    "controller_name" => "conversationController",
                    "action_name" => "existsConversationName"
                ),
                "throw_event" => false
            ),
            "GET_MESSAGES" => array(
                "controller" => array(
                    "controller_name" => "conversationController",
                    "action_name" => "getMessages"
                ),
                "throw_event" => false
            ),
            "GET_PENDING_MESSAGES" => array(
                "controller" => array(
                    "controller_name" => "conversationController",
                    "action_name" => "getPendingMessages"
                ),
                "throw_event" => false
            ),
            "CREATE_MESSAGE" => array(
                "controller" => array(
                    "controller_name" => "conversationController",
                    "action_name" => "createMessage"
                ),
                "throw_event" => true
            ),
            "DELETE_MESSAGE" => array(
                "controller" => array(
                    "controller_name" => "conversationController",
                    "action_name" => "deleteMessage"
                ),
                "token_required" => true,
                "throw_event" => false
            ),
            "UPDATE_MSG_STATUS" => array(
                "controller" => array(
                    "controller_name" => "conversationController",
                    "action_name" => "updateMessagesStatus"
                ),
                "throw_event" => true
            ),
            "GET_CALLS" => array(
                "controller" => array(
                    "controller_name" => "callingController",
                    "action_name" => "getCalls"
                ),
                "throw_event" => false
            ),
            "SEND_OFFER" => array(
                "controller" => array(
                    "controller_name" => "callingController",
                    "action_name" => "sendOffer"
                ),
                "throw_event" => true
            ),
            "SEND_OFFER_SDP_CHUNK" => array(
                "controller" => array(
                    "controller_name" => "callingController",
                    "action_name" => "sendOfferSdpChunk"
                ),
                "throw_event" => true
            ),
            "SEND_ANSWER" => array(
                "controller" => array(
                    "controller_name" => "callingController",
                    "action_name" => "sendAnswer"
                ),
                "throw_event" => true
            ),
            "SEND_ANSWER_SDP_CHUNK" => array(
                "controller" => array(
                    "controller_name" => "callingController",
                    "action_name" => "sendAnswerSdpChunk"
                ),
                "throw_event" => true
            ),
            "SAVE_CALL" => array(
                "controller" => array(
                    "controller_name" => "callingController",
                    "action_name" => "saveCall"
                ),
                "throw_event" => true
            ),
            "FINISH_CALL" => array(
                "controller" => array(
                    "controller_name" => "callingController",
                    "action_name" => "finishCall"
                ),
                "throw_event" => true
            ),
            "SHARE_POSITION" => array(
                "controller" => array(
                    "controller_name" => "geolocationController",
                    "action_name" => "sharePosition"
                ),
                "token_required" => true,
                "throw_event" => true
            )
        );
    }
    


    private function resolveService($service,$params,$conn){
        
        try{

            //Ejecutamos la acción del controlador
            $response = baseController::execute($service["controller"],$params);

            //Comprobamos si es necesario ejecutar una tarea posterior 
            if(isset($service["task_before_send"])){
                //recogemos el nombre de la tarea.
                $task = $service["task_before_send"];
                if($task == "attachUser"){
                    //la información.
                    $data = $response["task_before_send_data"];
                    $this->clients[$conn] = $data;
                }else if($task == "detachUser"){
                    $this->clients->detach($conn);
                }else if($task == "requireUsersStatus"){
                    $contactos = $response["response_message"]["data"]["msg"];
                    $ids = array_map(function($contacto){
                        return $contacto["idRepresentado"];
                    },$contactos);
                    foreach($this->clients as $connection){
                        $user = $this->clients[$connection];
                        //Buscamos si existe el usuario.
                        $idx = array_search($user["id"],$ids);
                        if(is_numeric($idx)){
                            $response["response_message"]["data"]["msg"][$idx]["status"] = "conectado";
                        }
                    }
                }
                
            }

            //Enviamos la respuesta al emisor.
            $this->send($conn,json_encode($response["response_message"]));
            //Si el servicio debe notificar a otros clientes
            if($service["throw_event"]){
                //Obtenemos los targets
                $targets = $response["event_message"]["targets"];
                //Los eliminamos del evento
                unset($response["event_message"]["targets"]);
                
                if((is_array($targets) && sizeof($targets))){
                    //recogemos ids parra facilitar búsqueda.
                    $ids = array_map(function($target){
                        return $target["id"];
                    },$targets);
                    //recorremos usuarios conectados.
                    foreach($this->clients as $connection){
                        $user = $this->clients[$connection];
                        //Buscamos si existe el usuario.
                        $idx = array_search($user["id"],$ids);
                        if(is_numeric($idx)){
                            //existe, le notificamos el evento.
                            $this->send($connection,json_encode(array_merge($response["event_message"],$targets[$idx])));
                        }
                    }
                }
                    
            }
            
            
        }catch(Exception $e){
            echo $e->getMessage();
            
        }
    
    }
    
    protected function process ($conn, $message) {
        //Decodificamos el mensaje.
        $msg = json_decode(urldecode($message));
        echo var_dump($msg) . PHP_EOL;
        $serviceName = $msg->service;
        $params = $msg->params;
        //Comprobamos si existe el servicio solicitado.
        if(array_key_exists($serviceName,$this->serviceMap)){
            //Obtenemos el servicio.
            $service = $this->serviceMap[$serviceName];
            //Comprobamos si el servicio requiere token de acceso.
            if (isset($service["token_required"])) {
                //Comprobamos si hay token de sessión en la petición
                if(array_key_exists("token",get_object_vars($msg))){
                    //decodificamos el token de sesión.
                    $token = json_decode(base64_decode($msg->token));
                    if(isset($service["require_user_id"]))
                        $this->resolveService($service,[$token->idUser],$conn);
                    else
                        $this->resolveService($service,$params,$conn);
                         
                }else{
                    echo json_encode(array("error" => true,"data" => "Accesso no permitido"));
                }
                
            }else{
                $this->resolveService($service,$params,$conn);
            }

        }else{
            echo json_encode(array("error" => true,"data" => "Servicio no disponible"));
        }
        
        
        
  }
  
  protected function connected ($conn) {
      //Recogemos token de sesión
      
          
    // Do nothing: This is just an echo server, there's no need to track the user.
    // However, if we did care about the users, we would probably have a cookie to
    // parse at this step, would be looking them up in permanent storage, etc.
  }
  
  protected function closed ($conn) {
    
      //echo $this->clients->count();
    // Do nothing: This is where cleanup would go, in case the user had any sort of
    // open files or other objects associated with them.  This runs after the socket 
    // has been closed, so there is no need to clean up the socket itself here.
  }
    
  
}

$ss = new ServerSocket("127.0.0.1","30000");

try {
  $ss->run();
}
catch (Exception $e) {
  $ss->stdout($e->getMessage());
}
