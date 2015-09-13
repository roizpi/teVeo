<?php

class conversationController extends baseController{
    
    //Obtiene todas las conversaciones en las que participa estos usuarios.
    public function getConversations($idUserOne,$idUserTwo){
        //Preparamos la sentencia
        $sql = $this->conn->prepare('SELECT id,DATE_FORMAT(creacion,"%d/%m/%Y %h:%i:%s") as creacion,name,mensajes FROM CONVERSACIONES_NORMALES_VIEW 
                                        WHERE (user_one = :idUserOne AND user_two = :idUserTwo) OR (user_one = :idUserTwo AND user_two = :idUserOne)');
        //La ejecutamos bindeando los datos.
        $sql->execute(array("idUserOne" => $idUserOne,"idUserTwo" => $idUserTwo));
        //Extraemos los resultados
        $conversations = $sql->fetchAll(PDO::FETCH_ASSOC);
        for($i = 0; $i < sizeof($conversations); $i++){
            $conversations[$i] = array_map("utf8_encode",$conversations[$i]);
            //obtenemos número de mensajes realizados por el user_one
            $sql = $this->conn->prepare('SELECT COUNT(*) AS mensajes
                                         FROM CONVERSACIONES C NATURAL JOIN CONVERSACIONES_NORMALES LEFT OUTER JOIN MENSAJES M ON(C.id = M.conversacion)
                                         WHERE C.id = :idConv AND user = :idUser');
             //La ejecutamos bindeando los datos.
            $sql->execute(array("idConv" => $conversations[$i]['id'],"idUser" => $idUserOne));
            $result = $sql->fetch(PDO::FETCH_ASSOC);
            $result["id"] = $idUserOne;
            $conversations[$i]["user_one"] = $result;
            //Obtenemos número de mensajes realizados por el user_two
            $sql = $this->conn->prepare('SELECT COUNT(*) AS mensajes
                                         FROM CONVERSACIONES C NATURAL JOIN CONVERSACIONES_NORMALES LEFT OUTER JOIN MENSAJES M ON(C.id = M.conversacion)
                                         WHERE C.id = :idConv AND user = :idUser');
            //La ejecutamos bindeando los datos.
            $sql->execute(array("idConv" => $conversations[$i]['id'],"idUser" => $idUserTwo));
            $result = $sql->fetch(PDO::FETCH_ASSOC);
            $result["id"] = $idUserTwo;
            $conversations[$i]["user_two"] = $result;
        }
        return array("response_message" =>array("type" => "RESPONSE","name" => "CONVERSACIONES_ENCONTRADAS","data" => array("error" => false,"msg" => $conversations)));
    }
    
    //Crea una nueva conversación para estos usuarios
    public function createConversation($idUserOne,$idUserTwo,$name){
        //Sentencia
        $sql = "INSERT INTO CONVERSACIONES (creacion,name)
                VALUES(CURRENT_TIMESTAMP(),:name)";
        //Preparamos la sentencia.                             
        $stmt = $this->conn->prepare($sql);
            
        //Bindeamos los datos.
        $stmt->bindParam(':name',$name, PDO::PARAM_STR);        
        //Ejecutamos la sentencia.                                     
        $exito = $stmt->execute();
        
        if($exito){
            $idConv = $this->conn->lastInsertId();
            //Preparamos la sentencia
            $stmt = $this->conn->prepare('INSERT INTO CONVERSACIONES_NORMALES (id,user_one,user_two) VALUES(:id,:user_one,:user_two)');
            //Bindeamos los datos.
            $stmt->bindParam(':id',$idConv, PDO::PARAM_INT);
            $stmt->bindParam(':user_one',$idUserOne, PDO::PARAM_INT);
            $stmt->bindParam(':user_two',$idUserTwo, PDO::PARAM_INT);
            //Ejecutamos la sentencia.                                     
            $exito = $stmt->execute();
            if ($exito) {
                //Preparamos la sentencia
                $sql = $this->conn->prepare('SELECT id,creacion,name,mensajes FROM CONVERSACIONES_NORMALES_VIEW WHERE id = :id');
                //La ejecutamos bindeando los datos.
                $sql->execute(array("id" => $idConv));
                //Extraemos los resultados
                $conversation = $sql->fetchAll(PDO::FETCH_ASSOC)[0];
                $conversation = array_map("utf8_encode",$conversation);
                $conversation["user_one"] = array(
                    "id" => $idUserOne,
                    "mensajes" => 0
                );

                $conversation["user_two"] = array(
                    "id" => $idUserTwo,
                    "mensajes" => 0
                );

                print_r($conversation);

                $response =  array(
                    "response_message" => array(
                        "type" => "RESPONSE",
                        "name" => "CONVERSATION_CREATED",
                        "data" => array(
                            "error" => false,
                            "msg" => $conversation
                        )
                    ),
                    "event_message" => array(
                        "type" => "EVENT",
                        "name" => "NEW_CONVERSATION",
                        "targets" => array(
                            array("id" => $idUserTwo, "data" => $conversation)
                        )
                    )
                );
            }
        
        }

        return $response;
        
    }
    
    public function dropConversation($idConv,$otherUser){
        //Obtenemos sus datos para enviárselos al otro usuario
        $sql = $this->conn->prepare('SELECT * FROM CONVERSACIONES_NORMALES_VIEW WHERE id = :id'); 
        //La ejecutamos bindeando los datos.
        $sql->execute(array("id" => $idConv));
        //Extraemos los resultados
        $conversation = $sql->fetch(PDO::FETCH_ASSOC);
        $conversation = array_map("utf8_encode",$conversation);
        //Borramos la conversación.                       
        $stmt = $this->conn->prepare("DELETE FROM CONVERSACIONES WHERE id = :id");
        $exito = $stmt->execute(array("id" => $idConv));
        if($exito){
            return array(
                "response_message" =>array("type" => "RESPONSE","name" => "CONVERSATION_DROPED","data" => array("error" => false,"msg" => "Conversación borrada correctamente")),
                "event_message" => array("type" => "EVENT","name" => "DROP_CONVERSATION","targets" => array(array("id" => $otherUser, "data" =>$conversation )))
            );
        }
    }
    
    public function dropAllConversation($user_one,$user_two){
        $stmt = $this->conn->prepare("DELETE FROM CONVERSACIONES WHERE id IN (
                                        SELECT id FROM CONVERSACIONES_NORMALES
                                        WHERE (user_one = :userOne OR user_one = :userTwo) AND (user_two = :userOne OR user_two = :userTwo))");
        $exito = $stmt->execute(array("userOne" => $user_one,"userTwo" => $user_two));
        if($exito){
            return array(
                "response_message" =>array("type" => "RESPONSE","name" => "ALL_CONVERSATION_DROPED","data" => array("error" => false,"msg" => "Todas las conversación fueron borradas correctamente")),
                "event_message" => array("type" => "EVENT","name" => "DROP_ALL_CONVERSATION","targets" => array(array("id" => $user_two, "data" =>$user_one )))
            );
        }
    }
    
    public function existsConversationName($name,$user_one,$user_two){
        //Preparamos la sentencia
        $stmt = $this->conn->prepare('SELECT * FROM CONVERSACIONES_NORMALES_VIEW WHERE name = :name AND (user_one = :user_one OR user_one = :user_two) AND (user_two = :user_two OR user_two = :user_one)');
        //Bindeamos los datos.
        $stmt->bindParam(':name',$name, PDO::PARAM_STR); 
        $stmt->bindParam(':user_one',$user_one, PDO::PARAM_INT); 
        $stmt->bindParam(':user_two',$user_two, PDO::PARAM_INT); 
        $stmt->execute();
        
        $response = null;
        if($stmt->rowCount() == 0){
            $response =  array("response_message" =>array("type" => "RESPONSE","name" => "RESULTADO_DE_COMPROBACION","data" => array("error" => false,"msg" => false)));
        }else{
            $response =  array("response_message" =>array("type" => "RESPONSE","name" => "RESULTADO_DE_COMPROBACION","data" => array("error" => false,"msg" => true)));
        }
        
        return $response;
    }
    
    //Obtiene todos los mensajes de una conversación.
    public function getMessages($idConv,$filter,$limit,$exclusions){
        
        $query = 'SELECT * FROM MENSAJES_VIEW WHERE idConv = :idConv AND UPPER(text) LIKE UPPER(:text)';
        $params = array(
            'idConv' => $idConv,
            'text' => "%".$filter->pattern."%"
        );
        //Validamos las exclusiones.
        if (is_array($exclusions) && sizeof($exclusions)) {
            $query .= ' AND id NOT IN (:exclusions)';
            $params['exclusions'] = join(",",$exclusions);
        }

        //Validamos el Limit
        if (is_int($limit->start) && is_int($limit->count)) {
            $query .= " LIMIT {$limit->start},{$limit->count}";
        }

        echo "Query : $query";
        //Preparamos la sentencia
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        //Extraemos los resultados
        $mensajes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
        for($i = 0; $i < sizeof($mensajes); $i++)
            $mensajes[$i] = array_map("utf8_encode",$mensajes[$i]);
        return array("response_message" =>array("type" => "RESPONSE","name" => "MENSAJES_ENCONTRADOS","data" => array("error" => false,"msg" => $mensajes)));
    
    }
    
    //Obtiene todos los mensajes no leidos junto con el nombre de la conversación a la que pertenecen.
    public function getPendingMessages($idUser){
        
        //Preparamos la sentencia
        $sql = $this->conn->prepare('SELECT * FROM MENSAJES_VIEW WHERE (user_one = :id OR user_two = :id) AND status = "NOLEIDO" AND userId != :id');
        //La ejecutamos bindeando los datos.
        $sql->execute(array("id" => $idUser));
        //Extraemos los resultados
        $pendingMessages = $sql->fetchAll(PDO::FETCH_ASSOC);
        for($i = 0; $i < sizeof($pendingMessages); $i++)
            $pendingMessages[$i] = array_map("utf8_encode",$pendingMessages[$i]);
        return array("response_message" =>array("type" => "RESPONSE","name" => "PENDING_MESSAGES_FINDED","data" => array("error" => false,"msg" => $pendingMessages)));
    
    } 
    
    
    //Crea un nuevo mensaje para una conversación
    public function createMessage($idConversacion,$idEmisor,$idReceptor,$text){
        
        $insultos = array("gilipollas", "cabron","puta","puto","putorra","zorra","mamon");
        $insultos = join($insultos,"|");
        $text = preg_replace_callback("/$insultos/i",function($matches){
            return substr_replace($matches[0], str_repeat("*", strlen($matches[0])), 0);
        }, $text);
 
        //Sentencia para crear el mensaje
        $sql = "INSERT INTO MENSAJES (conversacion,user,creacion,text)
                VALUES(:conversacion,:user,CURRENT_TIMESTAMP(),:text)";
        //Preparamos la sentencia.                             
        $stmt = $this->conn->prepare($sql);
            
        //Bindeamos los datos.
        $stmt->bindParam(':conversacion',$idConversacion,PDO::PARAM_INT); 
        $stmt->bindParam(':user',$idEmisor,PDO::PARAM_INT);       
        $stmt->bindParam(':text',$text, PDO::PARAM_STR); 
        //Ejecutamos la sentencia.                                     
        $exito = $stmt->execute();
        if ($exito) {
            $msgId = $this->conn->lastInsertId();
            $result = $this->conn->query("SELECT * FROM MENSAJES_VIEW WHERE id = $msgId");
            $msg = $result->fetch(PDO::FETCH_ASSOC);
            
            return array(
                "response_message" => array("type" => "RESPONSE","name" => "MESSAGE_CREATED","data" => array("error" => false,"msg" => $msg)),
                 "event_message" => array("type" => "EVENT","name" => "NEW_MESSAGE","targets" => array(array("id" => $idReceptor, "data" => $msg)))
            );
        }
    
    }

    public function deleteMessage($id){

        $response = null;
        $query = 'SELECT status FROM MENSAJES_VIEW WHERE id = :id';
        //Preparamos la sentencia.                             
        $stmt = $this->conn->prepare($query);
        //Bindeamos los datos.
        $stmt->bindParam(':id',$id,PDO::PARAM_INT);
        //Ejecutamos la sentencia.                                     
        $exito = $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if (strtoupper($result['status']) === 'NOLEIDO') {
            $dml = 'DELETE FROM MENSAJES WHERE id = :id';
            //Preparamos la sentencia.                             
            $stmt = $this->conn->prepare($dml);
            //Bindeamos los datos.
            $stmt->bindParam(':id',$id,PDO::PARAM_INT);
            //Ejecutamos la sentencia.                                     
            $exito = $stmt->execute();
            $response = array(
                "response_message" => array(
                    "type" => "RESPONSE",
                    "name" => "MESSAGE_DROPED",
                    "data" => array(
                        "error" => false,
                        "msg" => $id
                    )
                )
            );
        }

        return $response;
    }
    
    //Actualiza los mensajes "NOLEIDOS" a "LEIDOS"
    public function updateMessagesStatus($receptor,$messages){
        $stmt = $this->conn->prepare('UPDATE MENSAJES SET status = "LEIDO" WHERE id = :id');
        $msgids = array();
        $targets = array();
        for($i = 0,$len = sizeof($messages); $i < $len; $i++){
            //Ejecutamos la sentencia
            $exito = $stmt->execute(array("id" => $messages[$i]->id));
            if($exito){
                array_push($msgids,$messages[$i]->id);
                $ids = array_map(function($target){
                    return $target["id"];
                },$targets);
                $idx = array_search($messages[$i]->emisor,$ids); 
                if(is_numeric($idx)){
                    if(!in_array($messages[$i]->idConv,$targets[$idx]["data"]["convs"])){
                        array_push($targets[$idx]["data"]["convs"],$messages[$i]->idConv);
                    }
                }else{
                    $target = array("id" => $messages[$i]->emisor , "data" => array("receptor" => $receptor , "convs" => array()));
                    array_push($target["data"]["convs"],$messages[$i]->idConv);
                    array_push($targets,$target);
                }
            }
        }
        
        return array(
            "response_message" => array("type" => "RESPONSE","name" => "MESSAGE_CREATED","data" => array("error" => false,"msg" => $msgids)),
            "event_message" => array("type" => "EVENT","name" => "MENSAJES_LEIDOS","targets" => $targets)
        );
    }

    public function notifyConversationCurrentlyViewing($emisor,$receptor,$idConv){
        return array(
            "response_message" => array(
                "type" => "RESPONSE",
                "name" => "CONVERSATION_CURRENTLY_VIEWING_NOTIFIED",
                "data" => array(
                    "error" => false,
                    "msg" => $receptor
                )
            ),
            "event_message" => array(
                "type" => "EVENT",
                "name" => "TALK_USER_CHANGES",
                "targets" => array(
                    array("id" => $receptor, "data" => array('idUser' => $emisor,'idConv' => $idConv ))
                )
            )
        );
    }
}