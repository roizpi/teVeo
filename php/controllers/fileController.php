<?php

class fileController extends baseController{

	const FILES_BASE_PATH = 'resources/files/';

	public function save($idConv,$format,$data){


		$response =  array(
	        "response_message" => array(
	           	"type" => "RESPONSE",
	            "name" => "FILE_CREATION",
	            "data" => array()
	        )
	    );

		if(is_numeric($idConv)){
			define("ROOT_DIR",$_SERVER['DOCUMENT_ROOT']."/teVeo/");
			$conv_folder = "conv_".$idConv;
			if(!is_dir(ROOT_DIR.self::FILES_BASE_PATH.$conv_folder)){
				$exito = mkdir(ROOT_DIR.self::FILES_BASE_PATH.$conv_folder, 0700,true);
				if (!$exito) throw new Exception("Error Processing Request", 1);
			}

			$file_folder = self::FILES_BASE_PATH.$conv_folder."/";
			$file_name = substr(base64_encode(openssl_random_pseudo_bytes('30')), 0, 22);
			//eliminamos data:image/png; y base64, de la cadena que tenemos
			list(, $data) = explode(';', $data);
			list(, $data) = explode(',',$data);
			//Decodificamos $data codificada en base64.
			// Escribir los contenidos en el fichero
			$exito = file_put_contents(ROOT_DIR.$file_folder.$file_name.".".$format, base64_decode($data),LOCK_EX);
			$response["response_message"]["data"] = array("error" => false,"msg" => array("folder" => $file_folder,"name" => $file_name));
		}
		

        return $response;
	}


}