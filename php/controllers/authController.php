<?php 

//Excepciones.
class LoginFailed extends Exception {}
class InvalidData extends Exception {}

class authController extends baseController{

    
    private function check_password($password,$dbHash){

		// Recalculamos a ver si el hash coincide.
		if (crypt($password, $dbHash) == $dbHash){
			return true;
		}else{
		    return false;
		}

	}

    public function login($nick,$password){

    	//Validamos datos.
        //Saneamos y Filtramos los datos.

        $nick = filter_var(trim($nick),FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);
        $password = filter_var(trim($password),FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);
        
        $response = array(
            "response_message" => array(
                "type" => "RESPONSE",
                "name" => "AUTHENTICATION_COMPLETED",
                "data" => array()
            )
        );

        try {

        	if($nick && $password){
         		//Comprobamos si existe ese usuario con esa contraseña.
         		$sql = $this->conn->prepare('SELECT * FROM USUARIOS WHERE nick = :nick AND authMethod = "LOCAL"');
         		$sql->execute(array('nick' => $nick));
         		$usuario = $sql->fetch(PDO::FETCH_ASSOC);

	            if(!$this->check_password($password,$usuario["password"])){
	                //Fallo al intentar iniciar sesión.
	                throw new LoginFailed("Usuario o contraseña no válidos");
	            }else{
	               	//usuario logeado correctamente.
	              	$response["response_message"]["data"] = array(
                        "error" => false,
                    	"msg" => array(
                    		"msg" => "Properly authenticated user",
                    		"id" => $usuario['id'] //Devolvemos el id.
                    	)
                    );
   
	            }

        	}else{
            	throw new InvalidData("Nick y password no pueden estar vacíos");
        	}
        	
        } catch (Exception $e) {

        	//fallo de autenticación.
            $response["response_message"]["data"] = array(
                "error" => true,
                "msg" => array(
                    "msg" => $e->getMessage()
                )
            );
	        
        }

        return $response;


    }


	
}