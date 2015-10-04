<?php

error_reporting(0);
require_once 'funciones.inc.php';
require_once 'controllers/baseController.php';

if (isset($_SERVER['HTTP_REFERER']) && preg_match("/^http\:\/\/localhost\/teveo/",$_SERVER['HTTP_REFERER']) ) {

	date_default_timezone_set('Europe/Madrid');
	header('Content-Type: application/json');

	define("SERVICES_PATH","services.json");
	define("HTTP_SERVICE",2);

	//cargamos los servicios.
	$content = @file_get_contents(SERVICES_PATH);
	if ($content) {
		$services = (array) json_decode($content,true);
		foreach ($services as $key => $service) {
			if($service['type'] != HTTP_SERVICE){
				unset($services[$key]);
			}
		}
		//Recogemos valores de la peticion.
		$service = filter_input(INPUT_POST,'service',FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);
		$token = filter_input(INPUT_POST,'token',FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);
		$encode = filter_input(INPUT_POST,'encode',FILTER_VALIDATE_BOOLEAN,FILTER_NULL_ON_FAILURE);
		$params = $_REQUEST['params'];

		//Comprobamos si el servicio solicitado es HTTP_SERVICE.
		if (array_key_exists($service,$services)) {
			if ($services[$service]['token_required']) {
				//Comprobamos si el token de sesión está presente en la petición.
				if ($token) {
					//decodificamos el token de sesión.
                    $token = json_decode(base64_decode($token));
                    if (!is_null($params)) {
                    	if (!is_array($params)) {
                    		$params = (array) json_decode($params,true);
                    	}
                    	$params = $encode ? decodeParams($params) : $params;
                    }
                    //Ejecutamos la acción del controlador
            		$response = baseController::execute($services[$service]['controller'],$params);
					//Codificamos los datos de la respuesta.
            		if($encode) encodeData($response["response_message"]['data']['msg']);
            		//Enviamos respuesta
            		echo json_encode($response["response_message"]);
				}else{
					echo json_encode(array("error" => true,"data" => "Acceso no permitido"));
				}
			}

		}else{
			echo json_encode(array("error" => true,"data" => "Servicio no disponible"));
		}

	}else{
		header($_SERVER['SERVER_PROTOCOL'] . " 500 Internal Error", true, 500);
	}

}else {
	header($_SERVER['SERVER_PROTOCOL'] . " 400 Bad Request", true, 400);
}
	