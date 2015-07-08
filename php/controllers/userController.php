<?php

class userController extends baseController{
    
    /* Método para filtrar Usuarios*/
    public function searchUsers($idUser,$field,$value){
        $fields = array('NAME','LOCATION');
        if($field && in_array(strtoupper($field),$fields)){
            $value = utf8_decode($value);
            echo "Este es el valor : $value" . PHP_EOL;
            if(strtoupper($field) == "NAME"){
                echo "Hola estoy buscando por el nombre..." . PHP_EOL;
                $sql = $this->conn->prepare('SELECT id,foto,name FROM USUARIOS_VIEW U
                                            WHERE UPPER(name) LIKE UPPER(:value) AND id != :idUser AND NOT EXISTS(
                                                   SELECT * FROM CONTACTOS C WHERE C.idRepresentado = U.id  AND C.idUsuario = :idUser
                                                )');
       
            
                $sql->execute(array("value" => "%$value%","idUser" => $idUser));
            }else if($field == "LOCATION"){
                $sql = $this->conn->prepare('SELECT id,foto,name FROM USUARIOS_VIEW U
                                                WHERE UPPER(ubicacion) LIKE UPPER(:location) AND id != :idUser AND NOT EXISTS(
                                                   SELECT * FROM CONTACTOS C WHERE C.idRepresentado = U.id  AND C.idUsuario = :idUser
                                                )');
    
                $sql->execute(array("location" => "%$value%","idUser" => $idUser));
            
            }
            $usuarios = $sql->fetchAll(PDO::FETCH_ASSOC);
            for($i = 0; $i < sizeof($usuarios); $i++)
                $usuarios[$i] = array_map("utf8_encode",$usuarios[$i]);
            return array(
                "response_message" => array("type" => "RESPONSE","name" => "RESULT_OF_SEARCH","data" => array("error" => false,"msg" => $usuarios))
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