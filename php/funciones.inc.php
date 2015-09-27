<?php

/*
    Funciones de Utilidad
*/
		
function decodeParams($params){
    
    if (!is_null($params)) {
        //Comprobamos si es un objeto.
        if (is_object($params)) {
            $params = get_object_vars($params);
        }

        foreach ($params as $key => $value) {
            if (!is_array($value) && !is_object($value)) {

                if (!is_numeric($value)) {
                    $params[$key] = utf8_decode(base64_decode($value));
                }else{
                    $params[$key] = $value;
                }
            }else{
                $params[$key] = decodeParams($params[$key]);
            }
        }
    }
    return $params;
}

//Método para codificar cadenas en base64
function encodeData(&$data){
    
    if (!is_null($data)) {
        //Procedemos a codificar cada valor.
        foreach ($data as $key => $value) {
            if (!is_array($value)) {
                if (!is_numeric($value)) {
                    $data[$key] = base64_encode(utf8_encode($value));
                }
            }else{
                encodeData($data[$key]);
            }
        }
    }
}		    

	
	
