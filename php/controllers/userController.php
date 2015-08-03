<?php

class userController extends baseController{
    
    /* Método para filtrar Usuarios*/
    public function searchUsers($idUser,$filter,$count){

        $fields = array('NAME','LOCATION');
        $field = strtoupper($filter->field);

        if($field && in_array($field,$fields)){
            //Decodificamos el patrón.
            $value = $filter->pattern;
            //Construimos la query.
            $query = 'SELECT id,foto,name FROM USUARIOS_VIEW U ';

            if ($field === 'NAME') {
                $query .= "WHERE UPPER(name) LIKE UPPER(:value)";
            }elseif($field === 'LOCATION'){
                $query .= "WHERE UPPER(location) LIKE UPPER(:value)";
            }
            
            $query .= " AND id != :idUser AND NOT EXISTS(
                    SELECT * FROM CONTACTOS C WHERE C.idRepresentado = U.id  AND C.idUsuario = :idUser
                )";
                

            if (!empty($count) && is_numeric($count)) {
               $query .= "LIMIT 0,$count";
            }

            $sql = $this->conn->prepare($query);
            $sql->execute(array("idUser"=> $idUser,"value" => "%$value%")); 
            $usuarios = $sql->fetchAll(PDO::FETCH_ASSOC);
            for($i = 0; $i < sizeof($usuarios); $i++)
                $usuarios[$i] = array_map("utf8_encode",$usuarios[$i]);

            return array(
                "response_message" => array(
                    "type" => "RESPONSE",
                    "name" => "RESULT_OF_SEARCH",
                    "data" => array(
                        "error" => false,
                        "msg" => $usuarios
                    )
                )
            );
        
        }
        
    }

    
    /*Método para obtener todos los detalles de un usuario*/
    public function getUserDetails($id){
     
        $sql = $this->conn->prepare('SELECT id,foto,name,edad,sexo,ubicacion FROM USUARIOS_VIEW WHERE id = :id');
        $sql->execute(array("id" => $id));
        $usuario = $sql->fetch(PDO::FETCH_ASSOC);
        $usuario = array_map("utf8_encode",$usuario);
        return array(
            "response_message" => array("type" => "RESPONSE","name" => "USER_DETAILS","data" => array("error" => false,"msg" =>$usuario))
        );
        
    }
    //Devuelve la información del usuario conectado.
    public function getUserConnectedData($idUser){
        //Obtenemos datos del usuario.
        $sql = $this->conn->prepare('SELECT id,foto,name,ubicacion FROM USUARIOS_VIEW WHERE id = :idUsuario');
        $sql->execute(array(":idUsuario" => $idUser));
        $user = $sql->fetch(PDO::FETCH_ASSOC);
        $user = array_map("utf8_encode",$user);
        return array(
            "response_message" => array("type" => "RESPONSE","name" => "USER_CONNECTED_DATA_FINDED","data" => array("error" => false,"msg" =>$user)),
            "task_before_send_data" => $user
        );
    
    }
    
    public function closeConnection($idUser){
        
        //Obtenemos datos del usuario.
        $sql = $this->conn->prepare('SELECT id,foto,name FROM USUARIOS_VIEW WHERE id = :idUsuario');
        $sql->execute(array(":idUsuario" => $idUser));
        $user = $sql->fetch(PDO::FETCH_ASSOC);
        $user = array_map("utf8_encode",$user);
        //Obtenemos los contactos del usuario.
        $sql = $this->conn->prepare('SELECT idRepresentado FROM contactos_view WHERE idUsuario = :idUsuario');
        $sql->execute(array(":idUsuario" => $user["id"]));
        $contactos = $sql->fetchAll(PDO::FETCH_ASSOC);
        $targets = [];
        for($i = 0; $i < sizeof($contactos); $i++){
            array_push($targets,array(
                "id" => $contactos[$i]["idRepresentado"],
                "data" => $user
            ));
        }
        
        return array(
            "response_message" => array("type" => "RESPONSE","name" => "DESTROY_SESSION_SUCCESFULL","data" => array("error" => false,"msg" =>null)),
            "event_message" => array("type" => "EVENT","name" => "USER_DISCONNECTED","targets" => $targets),
            "task_before_send_data" => $user
        );
    
    }
    
    


}