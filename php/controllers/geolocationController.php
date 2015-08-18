<?php

class geolocationController extends baseController{
    
    public function sharePosition($user,$timestamp,$formatted_address,$address_components,$users){
        $targets = array();
        echo "Este es el id del usuario : $user" . PHP_EOL;
        for($i = 0,$len = sizeof($users); $i < $len; $i++){
            array_push($targets,array("id" => $users[$i] , "data" => array("id" => $user, "position" => array("timestamp" => $timestamp,"detail" => array("formatted_address" => $formatted_address,"address_components" => $address_components) ))));
        }
        return array(
            "response_message" => array("type" => "RESPONSE","name" => "POSITION_SHARED","data" => array("error" => false,"msg" => "Posición compartida")),
            "event_message" => array("type" => "EVENT","name" => "USER_SHARE_YOUR_POSITION","targets" => $targets)
        );
    }
}