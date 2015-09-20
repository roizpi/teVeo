<?php

class solicitudesController extends baseController{

    //Obtiene todas las solicitudes de amistad pendientes
    public function getApplicationsOfFriendship($idUser){
    
        $sql = $this->conn->prepare('SELECT * FROM SOLICITUDES_PENDIENTES WHERE idSolicitado = :idUser');
        $sql->execute(array("idUser" => $idUser));
        $applications = $sql->fetchAll(PDO::FETCH_ASSOC); 

        return array("response_message" =>array("type" => "RESPONSE","name" => "PENDIG_APPLICATIONS","data" => array("error" => false,"msg" => $applications)));
        
    
    }
    
    public function getApplicationForUser($usuSolicitador,$usuSolicitado){
        $sql = $this->conn->prepare('SELECT idUsuSolicitador,idUsuSolicitado,fecha,status FROM SOLICITUDES_AMISTAD WHERE idUsuSolicitador = :usuSolicitador AND idUsuSolicitado = :usuSolicitado AND status IN("PENDIENTE","RECHAZADA")');
        $sql->execute(array("usuSolicitador" => $usuSolicitador,"usuSolicitado" => $usuSolicitado));
        $application = $sql->fetch(PDO::FETCH_ASSOC);
        return array("response_message" =>array("type" => "RESPONSE","name" => "APPLICATION","data" => array("error" => false,"msg" => $application)));
        
    }
    
    
    
    //Método para añadir una solicitud de amistad
    public function addApplication($idUsuSolicitador,$idUsuSolicitado,$mensaje){
       
        $sql = "INSERT INTO SOLICITUDES_AMISTAD (idUsuSolicitador,idUsuSolicitado,mensaje,fecha)
                VALUES(:idUsuSolicitador,:idUsuSolicitado,:mensaje,:fecha)";
        //Preparamos la sentencia.                             
        $stmt = $this->conn->prepare($sql);
            
        $fecha =  date("Y-m-d H:i:s");
        //Bindeamos los datos.                                   
        $stmt->bindParam(':idUsuSolicitador',$idUsuSolicitador, PDO::PARAM_INT);       
        $stmt->bindParam(':idUsuSolicitado',$idUsuSolicitado, PDO::PARAM_INT); 
        $stmt->bindParam(':mensaje',$mensaje, PDO::PARAM_STR);  
        $stmt->bindParam(':fecha',$fecha, PDO::PARAM_STR); 
        //Ejecutamos la sentencia.                                     
        $exito = $stmt->execute();
        
        if ($exito) {
            //Preparamos la sentencia.                             
            $stmt = $this->conn->prepare("SELECT * FROM SOLICITUDES_PENDIENTES WHERE idSolicitador = :idSolicitador AND idSolicitado = :idSolicitado");
            //Bindeamos los datos.                                          
            $stmt->bindParam(':idSolicitador',$idUsuSolicitador, PDO::PARAM_INT);       
            $stmt->bindParam(':idSolicitado',$idUsuSolicitado, PDO::PARAM_INT); 
            //Ejecutamos la sentencia.                                     
            $stmt->execute();
            $application = $stmt->fetch(PDO::FETCH_ASSOC);
            return array(
                "response_message" => array("type" => "RESPONSE","name" => "RESULT_OF_ADD_APPLICATION","data" => array("error" => false,"msg" => "La solicitud se ha enviado correctamente")),
                "event_message" => array("type" => "EVENT","name" => "NEW_APPLICATION_OF_FRIENDSHIP","targets" => array(array("id" => $idUsuSolicitado,"data" => $application)))
            );
        }
    
    }
    
    //Confirmamos Solicitud.
    public function acceptApplication($idSolicitado,$idSolicitador){
        
        $sql = "UPDATE SOLICITUDES_AMISTAD SET status = 'ACEPTADA'
                WHERE idUsuSolicitado = :idUsuSolicitado AND idUsuSolicitador = :idUsuSolicitador";
        //Preparamos la sentencia.                             
        $stmt = $this->conn->prepare($sql);
        //Bindeamos los datos.       
        $stmt->bindParam(':idUsuSolicitado',$idSolicitado, PDO::PARAM_INT); 
        $stmt->bindParam(':idUsuSolicitador',$idSolicitador, PDO::PARAM_INT);       
        //Ejecutamos la sentencia.                                     
        $exito = $stmt->execute();
                    
        if ($exito) {
            $result = $this->conn->query("SELECT name FROM USUARIOS_VIEW WHERE id = $idSolicitado");
            $name = $result->fetch(PDO::FETCH_ASSOC)["name"];
            return array(
                "response_message" => array("type" => "RESPONSE","name" => "RESULT_OF_ACCEPT_APPLICATION","data" => array("error" => false,"msg" => "La solicitud ha sido aceptada correctamente")),
                "event_message" => array("type" => "EVENT","name" => "ACCEPT_YOUR_APPLICATION","targets" => array(array("id" => $idSolicitador,"data" => "Ahora $name y tu sois amigos")))
            );
        }
    }
    
    //Rechazar Solicitud
    public function rejectApplication($idSolicitado,$idSolicitador){
        $sql = "UPDATE SOLICITUDES_AMISTAD SET status = 'RECHAZADA'
                WHERE idUsuSolicitado = :idUsuSolicitado AND idUsuSolicitador = :idUsuSolicitador";
        //Preparamos la sentencia.                             
        $stmt = $this->conn->prepare($sql);
        //Bindeamos los datos.       
        $stmt->bindParam(':idUsuSolicitado',$idSolicitado, PDO::PARAM_INT); 
        $stmt->bindParam(':idUsuSolicitador',$idSolicitador, PDO::PARAM_INT);       
        //Ejecutamos la sentencia.                                     
        $exito = $stmt->execute();
                    
        if ($exito) {
            $result = $this->conn->query("SELECT name FROM USUARIOS_VIEW WHERE id = $idSolicitado");
            $name = $result->fetch(PDO::FETCH_ASSOC)["name"];
            return array(
                "response_message" => array("type" => "RESPONSE","name" => "RESULT_OF_REJECT_APPLICATION","data" => array("error" => false,"msg" => "La solicitud ha sido rechazada correctamente")),
                "event_message" => array("type" => "EVENT","name" => "REJECT_YOUR_APPLICATION","targets" => array(array("id" => $idSolicitador,"data" => "$name ha rechazado tu solicitud de amistad")))
            );
        }
    }

}
