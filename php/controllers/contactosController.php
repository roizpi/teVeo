<?php

class contactosController extends baseController{
    
    //Obtiene todos los contactos.
    public function getAllContacts($idUser){
        
        $sql = $this->conn->prepare('SELECT * FROM CONTACTOS_VIEW WHERE idUsuario = :idUser');
        $sql->execute(array("idUser" => $idUser));
        $contactos = $sql->fetchAll(PDO::FETCH_ASSOC);
        for($i = 0; $i < sizeof($contactos); $i++)
            $contactos[$i] = array_map("utf8_encode",$contactos[$i]);
        return array(
            "response_message" => array("type" => "RESPONSE","name" => "RESULT_OF_GET_ALL_CONTACTS","data" => array("error" => false,"msg" =>$contactos))
        );
    
    }
    //Notifica el inicio de sesión de un usuario a todos sus contactos.
    public function notifyInitSession($idUser,$contactos){
        echo var_dump($contactos) .  PHP_EOL;
        if(is_numeric($idUser) && is_array($contactos)){
            //Obtenemos datos del usuario.
            $sql = $this->conn->prepare('SELECT id,foto,name,ubicacion FROM USUARIOS_VIEW WHERE id = :idUsuario');
            $sql->execute(array(":idUsuario" => $idUser));
            $user = $sql->fetch(PDO::FETCH_ASSOC);
            $user = array_map("utf8_encode",$user);
            //Formamos los destinatarios del evento.
            $targets = [];
            for($i = 0; $i < sizeof($contactos); $i++){
                array_push($targets,array(
                    "id" => $contactos[$i],
                    "data" => $user
                ));
            }
            
            return array(
                "response_message" => array("type" => "RESPONSE","name" => "NOTIFIED_USER_INIT_SESSION","data" => array("error" => false,"msg" =>null)),
                "event_message" => array("type" => "EVENT","name" => "USER_CONNECTED","targets" => $targets)
            );
        
        }
        
    }
    
    public function notifyUserStatus($userId,$users,$status){
        $targets = [];
        if(is_array($users) && sizeof($users)){
            for($i = 0,$len = sizeof($users); $i < $len; $i++){
                array_push($targets,array(
                    "id" => $users[$i],
                    "data" => array("id" => $userId,"status" => $status)
                ));
            }
        }else{
            array_push($targets,array("id" => $users,"data" => array("id" => $userId,"status" => $status)));
        }
        
        return array(
            "response_message" => array("type" => "RESPONSE","name" => "THE_STATE_HAS_BEEN_NOTIFIED","data" => array("error" => false,"msg" =>"Estado notificado")),
            "event_message" => array("type" => "EVENT","name" => "NEW_USER_STATE","targets" => $targets)
        );
    }
    
    //añade contacto.
    public function addContact($idSolicitado,$idSolicitador){

        $sql = "INSERT INTO CONTACTOS (descripcion,idUsuario,idRepresentado)
                VALUES(:descripcion,:idUsuario,:idRepresentado)";
        //Preparamos la sentencia.                             
        $stmt = $this->conn->prepare($sql);
            
        $fecha =  date("Y-m-d H:i:s");
        $descripcion = "";
        //Bindeamos los datos.                                  
        $stmt->bindParam(':descripcion',$descripcion, PDO::PARAM_STR);       
        $stmt->bindParam(':idUsuario',$idSolicitado, PDO::PARAM_INT); 
        $stmt->bindParam(':idRepresentado',$idSolicitador, PDO::PARAM_INT);  
        //$stmt->bindParam(':fecha',$fecha, PDO::PARAM_STR); 
        //Ejecutamos la sentencia.                                     
        $exito1 = $stmt->execute();
        
        $stmt->bindParam(':idUsuario',$idSolicitador, PDO::PARAM_INT); 
        $stmt->bindParam(':idRepresentado',$idSolicitado, PDO::PARAM_INT);
        
        $exito2 = $stmt->execute();
                    
        if ($exito1 && $exito2) {
            $result1 = $this->conn->query("SELECT * FROM CONTACTOS_VIEW WHERE idUsuario = $idSolicitador AND idRepresentado = $idSolicitado");
            $usuSolicitado = $result1->fetch(PDO::FETCH_ASSOC);
            $usuSolicitado = array_map("utf8_encode",$usuSolicitado);
            $result2 = $this->conn->query("SELECT * FROM CONTACTOS_VIEW WHERE idUsuario = $idSolicitado AND idRepresentado = $idSolicitador ");
            $usuSolicitador = $result2->fetch(PDO::FETCH_ASSOC);
            $usuSolicitador = array_map("utf8_encode",$usuSolicitador);
            return array(
                "response_message" => array("type" => "RESPONSE","name" => "RESULT_OF_ADD_CONTACT","data" => array("error" => false,"msg" => "Nuevo contacto agregado correctamente")),
                 "event_message" => array("type" => "EVENT","name" => "NEW_CONTACT","targets" => array(array("id" => $idSolicitador,"data" => $usuSolicitado ),array("id" => $idSolicitado,"data" => $usuSolicitador)))
            );
        }
    }
    
    //Borra contacto
    public function dropContact($user_one,$user_two){
        //Ambos usuarios dejan de ser amigos
        $sql = "DELETE FROM CONTACTOS
                WHERE (idUsuario = :user_one OR idRepresentado = :user_one ) AND (idUsuario = :user_two OR idRepresentado = :user_two )";
        //Preparamos la sentencia.                             
        $stmt = $this->conn->prepare($sql);
        //Bindeamos los datos.                                  
        $stmt->bindParam(':user_one',$user_one, PDO::PARAM_INT);       
        $stmt->bindParam(':user_two',$user_two, PDO::PARAM_INT);
        //ejecutamos la sentencia.
        $stmt->execute();
        //Borramos todas la llamadas entre estos dos usuarios.
        $sql = "DELETE FROM LLAMADAS
                 WHERE (emisor = :user_one OR receptor = :user_one) AND (emisor = :user_two OR receptor = :user_two)";
        //Preparamos la sentencia.                             
        $stmt = $this->conn->prepare($sql);
        //Bindeamos los datos.                                  
        $stmt->bindParam(':user_one',$user_one, PDO::PARAM_INT);       
        $stmt->bindParam(':user_two',$user_two, PDO::PARAM_INT);
        //ejecutamos la sentencia.
        $stmt->execute();
        //Borramos todas la conversaciones entre estos usuarios.
        $sql = "DELETE FROM CONVERSACIONES
                 WHERE id IN (SELECT id FROM CONVERSACIONES_NORMALES WHERE (user_one = :user_one OR user_two = :user_one) AND (user_one = :user_two OR user_two = :user_two)) ";
        //Preparamos la sentencia.                             
        $stmt = $this->conn->prepare($sql);
        //Bindeamos los datos.                                  
        $stmt->bindParam(':user_one',$user_one, PDO::PARAM_INT);       
        $stmt->bindParam(':user_two',$user_two, PDO::PARAM_INT);
        //ejecutamos la sentencia.
        $stmt->execute();
        return array(
            "response_message" => array("type" => "RESPONSE","name" => "CONTACT_DROPED","data" => array("error" => false,"msg" =>$user_two)),
            "event_message" => array("type" => "EVENT","name" => "DROP_CONTACT","targets" => array(array("id" => $user_two,"data" => $user_one )))
        );
        
    }
    
    public function updateContact($user_one,$user_two,$desc){
        $sql = "UPDATE CONTACTOS
                SET descripcion = :desc WHERE idUsuario = :user_one AND idRepresentado = :user_two";
        //Preparamos la sentencia.                             
        $stmt = $this->conn->prepare($sql);
        //Bindeamos los datos.                                  
        $stmt->bindParam(':user_one',$user_one, PDO::PARAM_INT);       
        $stmt->bindParam(':user_two',$user_two, PDO::PARAM_INT);
        $stmt->bindParam(':desc',$desc, PDO::PARAM_STR);
        //ejecutamos la sentencia.
        $stmt->execute();
        return array(
            "response_message" => array("type" => "RESPONSE","name" => "CONTACT_UPDATED","data" => array("error" => false,"msg" => null))
        );
    }

}