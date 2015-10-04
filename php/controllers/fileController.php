<?php

class fileController extends baseController{

	const FILES_BASE_PATH = 'resources/files/';

	public function save($idConv,$format){


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
			$file_name = substr(str_replace(array("/",".","\\"),"_",base64_encode(openssl_random_pseudo_bytes('30'))), 0, 22);
			if(isset($_FILES['file']) and !$_FILES['file']['error']){
			    move_uploaded_file($_FILES['file']['tmp_name'], ROOT_DIR.$file_folder.$file_name.".".$format);
			}
			// pull the raw binary data from the POST array
			//$data = substr($blob, strpos($blob, ",") + 1);
			// decode it
			//$data = base64_decode($data);			
			// Escribir los contenidos en el fichero
			//$exito = file_put_contents(ROOT_DIR.$file_folder.$file_name.".".$format,$data,LOCK_EX);
			$response["response_message"]["data"] = array("error" => false,"msg" => array("folder" => $file_folder,"name" => $file_name));
		}
		

        return $response;
	}

	public function delete($idConv,$name,$format){

		$response =  array(
	        "response_message" => array(
	           	"type" => "RESPONSE",
	            "name" => "FILE_DELETION",
	            "data" => array()
	        )
	    );

	    if(is_numeric($idConv)){
			define("ROOT_DIR",$_SERVER['DOCUMENT_ROOT']."/teVeo/");
			$conv_folder = "conv_".$idConv;
			$file = ROOT_DIR.self::FILES_BASE_PATH.$conv_folder.$name.".".$format;
			if(file_exists($file)){
				if(unlink($file)){
					$response["response_message"]["data"] = array("error" => false,"msg" => array("msg" => "Fichero borrado con éxito"));
				}else{
					$response["response_message"]["data"] = array("error" => true,"msg" => array("msg" => "Error al borrar el fichero"));
				}
			}else{
				$response["response_message"]["data"] = array("error" => true,"msg" => array("msg" => "El fichero no existe"));
			}

		}else{
			$response["response_message"]["data"] = array("error" => true,"msg" => array("msg" => "Identificador de conversación no válido"));
		}

		return $response;
	}


}