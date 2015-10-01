<?php

class weatherController extends baseController{

	const API_KEY = '6d2994aa361e6b53e25ea940efa73ee8';
	const API_ENDPOINT = 'https://api.forecast.io/forecast/';

	public function getForecast($latitude,$longitude,$units){

		$response =  array(
	        "response_message" => array(
	           	"type" => "RESPONSE",
	            "name" => "WEATHER_FORECAST",
	            "data" => array()
	        )
	    );

		$url = self::API_ENDPOINT . self::API_KEY . '/';
		$url .= $latitude .','.$longitude .'?units='.$units;
		$forecast = file_get_contents($url);
		if (isset($http_response_header) && strpos($http_response_header[0],'200')){
			$forecast = json_decode($forecast);
			$time = $forecast->currently->time;
			//información sobre la puesta/salida del sol y el comienzo/final del crepúsculo
			$hora = date_sunrise($time, SUNFUNCS_RET_STRING, $latitude,$longitude);
			//$sun_info = date_sun_info($time,);
			/*foreach ($sun_info as $clave => $valor) {
			    echo "$clave: " . date("H:i:s", $valor) . "\n";
			}*/
			echo "Esta es la hora del amanecer";
			print_r($hora);
			echo "Esta es la hora del atardecer";
			$hora = date_sunset($time, SUNFUNCS_RET_STRING,$latitude,$longitude);
			print_r($hora);
			$response["response_message"]["data"] = array("error" => false,"msg" => array("forecast" => $forecast));
		}else{
			$response["response_message"]["data"] = array("error" => true,"msg" => array("msg" => "La previsión no se pudo obtener"));
		} 

		

		return $response;
		
	}

	/*
		// File Name: proxy.php

		$api_key = 

		$API_ENDPOINT = 'https://api.forecast.io/forecast/';
		

		if(!isset($_GET['url'])) die();
		$url = $url . $_GET['url'];
		$url = file_get_contents($url);

		print_r($url);
	*/

}