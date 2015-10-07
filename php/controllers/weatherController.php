<?php

class weatherController extends baseController{

	const API_KEY = '6d2994aa361e6b53e25ea940efa73ee8';
	const API_ENDPOINT = 'https://api.forecast.io/forecast/';

	const WEATHER_FOLDER = 'resources/img/weather/';

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
		//print_r($http_response_header);
		if (isset($http_response_header) && strpos($http_response_header[0],'200')){
			$forecast = (array) json_decode($forecast,true);
			$time = $forecast["currently"]["time"];
			//timestamp del a salida del sol.
			$sunrise_timestamp = date_sunrise($time,SUNFUNCS_RET_TIMESTAMP,$forecast['latitude'],$forecast['longitude']);
			$sunset_timestamp = date_sunset($time,SUNFUNCS_RET_TIMESTAMP,$forecast['latitude'],$forecast['longitude']);
			//print_r($forecast);

			$forecast['currently']['sunrise_timestamp'] = $sunrise_timestamp;
			$forecast['currently']['sunset_timestamp'] = $sunset_timestamp;
			
		
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