#!/usr/bin/env php
<?php
require_once 'funciones.inc.php';
require_once 'controllers/baseController.php';
require_once 'vendor/phpWebSocketServer/websockets.php';

class ServerSocket extends WebSocketServer {
  //protected $maxBufferSize = 1048576; //1MB... overkill for an echo server, but potentially plausible for other applications.
    private $clients;
    private $websocket_services;

    const SERVICES_PATH = "services.json";
    
    
    public function __construct($addr, $port){
        parent::__construct($addr, $port);
        $this->clients = new SplObjectStorage();
        // Services
        $services = @file_get_contents(self::SERVICES_PATH);
        if ($services) {
            $this->websocket_services = (array) json_decode($services,true);
        }
    }


    private function resolveService($service,$params,$conn){
        
        try{

            //Ejecutamos la acción del controlador
            $response = baseController::execute($service['controller'],$params);

            //Comprobamos si es necesario ejecutar una tarea posterior 
            if(isset($service['task_before_send'])){
                //recogemos el nombre de la tarea.
                $task = $service['task_before_send'];
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

            //Codificamos los datos de la respuesta.
            encodeData($response["response_message"]['data']['msg']);
            //Enviamos la respuesta al emisor.
            $this->send($conn,json_encode($response["response_message"]));
            //Si el servicio debe notificar a otros clientes
            if($service['throw_event']){
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
        $msg = (array) json_decode($message,true);
        echo var_dump($msg) . PHP_EOL;
        //Comprobamos si existe el servicio solicitado.
        if(array_key_exists($msg['service'],$this->websocket_services)){
            //Obtenemos el servicio.
            $service = $this->websocket_services[$msg['service']];
            //Decodificamos los parámetros.
            if ($msg['encode']) {
               $params = decodeParams($msg['params']);
            }else{
                $params = $msg['params'];
            }
            
            //Comprobamos si el servicio requiere token de acceso.
            if (isset($service['token_required'])) {
                //Comprobamos si hay token de sessión en la petición
                if(array_key_exists("token",$msg)){
                    //decodificamos el token de sesión.
                    $token = json_decode(base64_decode($msg['token']));
                    if(isset($service['require_user_id']))
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
