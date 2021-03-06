<?php

class geolocationController extends baseController{
    
    public function sharePosition($user,$timestamp,$formatted_address,$address_components,$users){
        $targets = array();
        for($i = 0,$len = sizeof($users); $i < $len; $i++){
            array_push($targets,array("id" => $users[$i] , "data" => array("id" => $user, "position" => array("timestamp" => $timestamp,"detail" => array("formatted_address" => $formatted_address,"address_components" => $address_components) ))));
        }
        $response = array(
            "response_message" => array(
                "type" => "RESPONSE",
                "name" => "POSITION_SHARED",
                "data" => array(
                    "error" => false,
                    "msg" => array("msg" => "Posición compartida")
                )
            ),
            "event_message" => array(
                "type" => "EVENT",
                "name" => "USER_SHARE_YOUR_POSITION",
                "targets" => $targets
            )
        );

        return $response;
    }
}