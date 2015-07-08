<?php

class callingController extends baseController{
    
    public function getCalls($idUser){
        //preparamos la consulta.
        $stmt = $this->conn->prepare("SELECT id,type,name,emisor,receptor,DATE_FORMAT(timestamp,'%Y/%m/%d %H:%m:%s') as timestamp,duracion,status FROM LLAMADAS WHERE emisor = :idUser OR receptor = :idUser");
        //ejecutamos la consulta.
        $stmt->execute(array("idUser" => $idUser)); 
        //extraemos los resultados.
        $calls = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array(
            "response_message" => array("type" => "RESPONSE","name" => "CALLS","data" => array("error" => false,"msg" => $calls)),
        );
        
    }
    
    public function sendOffer($type,$idUsuCaller,$idUsuCalled,$convName,$iceCandidate,$numChunks){
        return array(
            "response_message" => array("type" => "RESPONSE","name" => "OFERTA_ENVIADA","data" => array("error" => false,"msg" => null)),
            "event_message" => array("type" => "EVENT","name" => "OFFER_RECEIVED","targets" => array(array("id" => $idUsuCalled,"data" => array("type" => $type,"caller" => $idUsuCaller,"convName" => $convName,"iceCandidate" => $iceCandidate,"numChunks" => $numChunks))))
        );
    }
    
    public function sendOfferSdpChunk($idUsuCaller,$idUsuCalled,$numChunk,$chunkSdp){
        return array(
            "response_message" => array("type" => "RESPONSE","name" => "OFFER_SDP_CHUNK_SENDED","data" => array("error" => false,"msg" => null)),
            "event_message" => array("type" => "EVENT","name" => "OFFER_SDP_CHUNK_RECEIVED","targets" => array(array("id" => $idUsuCalled,"data" => array("caller" => $idUsuCaller,"chunkSdp" => $chunkSdp,"numChunk" => $numChunk))))
        );
    }
    
    public function sendAnswer($idUsuCaller,$idUsuCalled,$iceCandidate,$numChunks){
        //echo "Hola estoy aqui contestando" . PHP_EOL;
        return array(
            "response_message" => array("type" => "RESPONSE","name" => "CONTESTACION_REALIZADA","data" => array("error" => false,"msg" => null)),
            "event_message" => array("type" => "EVENT","name" => "ANSWER_RECEIVED","targets" => array(array("id" => $idUsuCaller,"data" => array("called" => $idUsuCalled,"iceCandidate" => $iceCandidate,"numChunks" => $numChunks))))
        );
    }
    
    public function sendAnswerSdpChunk($idUsuCaller,$idUsuCalled,$numChunk,$chunkSdp){
        return array(
            "response_message" => array("type" => "RESPONSE","name" => "ANSWER_SDP_CHUNK_SENDED","data" => array("error" => false,"msg" => null)),
            "event_message" => array("type" => "EVENT","name" => "ANSWER_SDP_CHUNK_RECEIVED","targets" => array(array("id" => $idUsuCaller,"data" => array("called" => $idUsuCalled,"chunkSdp" => $chunkSdp,"numChunk" => $numChunk))))
        );
    }
    
    public function saveCall($type,$caller,$called,$convName,$status){
        //preparamos la sentancia.
        $stmt = $this->conn->prepare('INSERT INTO LLAMADAS(type,emisor,receptor,name,timestamp,status) VALUES(:type,:emisor,:receptor,:name,:timestamp,:status)');
        $timestamp =  date("Y-m-d H:i:s");
        $type = $type == "VIDEOCALL" ? "VIDEOLLAMADA" : "LLAMADA DE VOZ";
        //bindeamos los datos.
        $stmt->bindParam(":type",$type,PDO::PARAM_STR);
        $stmt->bindParam(":emisor",$caller,PDO::PARAM_INT);
        $stmt->bindParam(":receptor",$called,PDO::PARAM_INT);
        $stmt->bindParam(":name",$convName,PDO::PARAM_STR);
        $stmt->bindParam(":timestamp",$timestamp);
        $stmt->bindParam(":status",$status,PDO::PARAM_STR);
        //Ejecutamos la sentencia.
        $exito = $stmt->execute();
        if($exito){
            $callId = $this->conn->lastInsertId();
            //llamada insertada.
            if($status == "ESTABLECIDA"){
                //devolvemos a ambos pares el id de la llamada.
                $response = array(
                    "response_message" => array("type" => "RESPONSE","name" => "CALL_ESTABLISHED","data" => array("error" => false,"msg" => $callId)),
                    "event_message" => array("type" => "EVENT","name" => "CALL_ESTABLISHED","targets" => array(array("id" => $called,"data" => $callId)))
                );
            }else if($status == "RECHAZADA"){
                //devolvemos a ambos pares la información de la llamada
                $result = $this->conn->query("SELECT * FROM LLAMADAS WHERE id = $callId");
                $call = $result->fetch(PDO::FETCH_ASSOC);
                $response = array(
                    "response_message" => array("type" => "RESPONSE","name" => "CALL_REJECTED","data" => array("error" => false,"msg" => array("msg" => "La llamada fue rechazada","call" => $call))),
                    "event_message" => array("type" => "EVENT","name" => "CALL_REJECTED","targets" => array(array("id" => $caller,"data" =>array("msg" => "La llamada ha sido rechazada", "call" => $call))))
                );
            }
            
            return $response;
        }
        
    
    }
    
    public function finishCall($callId,$remoteUserId){
        $finalLlamada =  date("Y/m/d H:i:s");
        //preparamos la sentencia.
        //la duración la guardamos en minutos.
        echo $finalLlamada;
        $stmt = $this->conn->prepare('UPDATE LLAMADAS SET duracion = TIMEDIFF(:final,timestamp) WHERE id = :callId');
         //bindeamos los datos.
        $stmt->bindParam(":final",$finalLlamada,PDO::PARAM_STR);
        $stmt->bindParam(":callId",$callId,PDO::PARAM_INT);
        //Ejecutamos la sentencia.
        $exito = $stmt->execute();
        if($exito){
            //devolvemos a ambos pares la información de la llamada
            $result = $this->conn->query("SELECT * FROM LLAMADAS WHERE id = $callId");
            $call = $result->fetch(PDO::FETCH_ASSOC);
            return array(
                "response_message" => array("type" => "RESPONSE","name" => "CALL_FINISHED","data" => array("error" => false,"msg" => array("msg" => "La llamada finalizó correctamente", "call" => $call))),
                "event_message" => array("type" => "EVENT","name" => "CURRENT_CALLING_FINISHED","targets" => array(array("id" => $remoteUserId,"data" => array("msg" => "La llamada ha sido finalizada", "call" => $call))))
            );
        }
    }


}