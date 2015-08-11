<?php

class registerController extends baseController
{
	
	//Valida teléfono
    private function validatePhone($phone){
        return preg_match('/^[9|8|6|7][0-9]{8}$/', $phone);
    }
    //Valida fecha
    private function validateDate($date){
        return preg_match('/^\d{1,2}\/\d{1,2}\/\d{4}$/', $date);
    }

  

    private function validateMail(&$email) { 
        $error = false;
        //Saneamos el email.
        $email = filter_var($email,FILTER_SANITIZE_EMAIL);
        //Validamos el email.
        if (empty($email)) {
            $error = "Email no puede estar vacío";
        }elseif(!filter_var($email,FILTER_VALIDATE_EMAIL)){
            $error = "Email no válido";
        }else{
            
            list ( $username, $dominio ) =  explode("@",$email);
            /*Busca en DNS por registros MX correspondientes 
            a nombre_host. Devuelve TRUE si se encuentran 
            registros; devuelve FALSE si no se encuentran registros 
            o si ocurre un error.
            Una lista de los registros MX encontrados es colocada 
            en la matriz hosts_mx. Si la matriz peso es definida, 
            será llenada con la información de peso recolectada. 
            Nota: Esta función no es implementada en plataformas Windows*/
            //echo "Este es el Dominio : $dominio";
            if (!preg_match("/windows/i",PHP_OS)) {
                getmxrr($dominio, $mx_records, $mx_weight);
                
            }else{
                //Windows...
                $mx_records = array(); 
                exec('nslookup -type=mx '.$dominio, $result_arr); 
                foreach($result_arr as $line){ 
                    if (preg_match("/.*mail exchanger = (.*)/", $line, $matches))  
                        $mx_records[] = $matches[1]; 
                }   
            }
            
            //print_r($mx_records);
            if(count($mx_records) == 0){
                $error = "Dominio no conocido";
            }else{
                //Conexión a servidor SMTP (puerto 25)
                $conn = fsockopen ($mx_records[0],25); 
                
                if ($conn) {
                    
                    $ver = fgets($conn, 1024);
                    //Cuando un cliente establece una conexión con el servidor SMTP, 
                    //espera a que éste envíe un mensaje “220 Service ready” o “421 Service non available”
                    if (preg_match('/^220/', $ver)) {
                        //Servicio Disponible
                        //Se envía un HELO desde el cliente. Con ello el servidor se identifica. 
                        //Esto puede usarse para comprobar si se conectó con el servidor SMTP correcto.
                        fputs ($conn, "HELO ".$_SERVER['SERVER_NAME']."\r\n");  
                        $ver = fgets ($conn, 1024 );

                        //si el servidor comprueba que el origen es válido, el servidor responde “250 OK”.
                        fputs ($conn, "MAIL FROM: <{$email}>\r\n");
                        $From = fgets ($conn, 1024 ); 
                        /*Ya le hemos dicho al servidor que queremos mandar un correo, ahora hay que comunicarle a quien.   
                        La orden para esto es RCPT TO:<destino@host>.
                        Se pueden mandar tantas órdenes RCPT como destinatarios del correo queramos. 
                        Por cada destinatario, el servidor contestará “250 OK” o bien “550 No such user here”, si no encuentra al destinatario.
                        */
                        fputs ($conn, "RCPT TO: <{$email}>\r\n");  
                        $To = fgets ($conn, 1024);
                        //echo "Destinatario : $To"; 
                        //cerrar la sesión 
                        fputs ($conn, "QUIT\r\n");  
                        fclose($conn);
                        
                        if (!preg_match('/^250/', $From) || !preg_match('/^250/', $To )) {  
                                $error = "La cuenta de correo no existe";
                        }
                    
                    }
                
                }else{
                    echo "Hola error al intentar conectar";
                }
            
            }
        
        }

        return $error;
    }



    /* Función para generar la password */
	private function generarPassword($length = 10){
	    //Se define una cadena de caractares.
	    $cadena = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
	    //Obtenemos la longitud de la cadena de caracteres
	    $longitudCadena=strlen($cadena);
	     
	    $pass = "";
	    //Creamos la contraseña
	    for($i=1 ; $i<=$length ; $i++){
	        //Definimos numero aleatorio entre 0 y la longitud de la cadena de caracteres-1
	        $pos=rand(0,$length-1);
	        //Vamos formando la contraseña en cada iteraccion del bucle.
	        $pass .= substr($cadena,$pos,1);
	    }
	    return $pass;
	}

	/* Función para generar un hash mediante la concatenación de la password y un salt aleatorio de 22 caracteres*/
	private function hash_password($password){

		// Generamos un salt aleatoreo, de 22 caracteres para Bcrypt
		$salt = substr(base64_encode(openssl_random_pseudo_bytes('30')), 0, 22);
		// remplazamos los '+' por puntos, para evitar problemas de interpretación.
		$salt = strtr($salt, array('+' => '.')); 

		if (defined('CRYPT_BLOWFISH') && CRYPT_BLOWFISH){
			// Concatenamos las password con el salt y generamos el hash.
			//	-> $2y$ Indica que vamos a usar BlowFish.
			$hash = crypt($password, '$2y$10$' . $salt);

		}else{

			//Si la versión de php no dar soporte a este algoritmo, recurrimos a un cifrado SHA512.
			// -> $6$ Indica que vamos a usar SHA512.
			$hash = crypt($password, '$6$rounds=5000$' . $salt);

		}

		return $hash;
	}


    public function register($foto,$firstName,$lastName,$ubicacion,$sexo,$fechaNac,$telefono,$nick){

        //Validamos FirstName
        $firstName = filter_var($firstName,FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);
        if (!$firstName) 
            array_push($errores,"El nombre no puede estar vacío");
        elseif(is_numeric($firstName))
            array_push($errores,"El nombre no puede ser un número");

        //Validamos lastName
        $lastName = filter_var($lastName,FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);
        if (!$lastName)
            array_push($errores,"El apellido no puede estar vacío");
        elseif(is_numeric($lastName))
            array_push($errores,"El apellido no puede ser un número");
        //Validamos ubicación
        $ubicacion = filter_var($ubicacion,FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);
        if(!$ubicacion)
            array_push($errores,"La ubicación no puede estar vacía");
        //Validamos sexo.
        if($sexo != "H" && $sexo != "M")
            array_push($errores,"Sexo no válido");
        //Validamos fecha Nac
        if(!$fechaNac)
            array_push($errores,"Fecha no puede estar vacía");
        else if(!validarFecha($fechaNac))
            array_push($errores,"la Fecha no es válida" );
        //Validamos teléfono

        if($telefono != null && !(validarTelefono($_POST["tel"])))
            array_push($errores,"Teléfono no válido");
        //Validamos email.
        $nick = filter_var($nick,FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);
            if (!$nick) 
                array_push($errores,"Nick no válido");


        if($authMethod == "LOCAL"){
            //Generamos la password al usuario.
            $password = $this->generarPassword();
            //Generamos un hash para la contraseña.
            $hash = $this->hash_password($password);
            //Generamos mensaje de bienvenida que se mandará por email.
            $message = $firstName. " <br>Tus datos de acceso son: " . $nick . " y su contraseña: <strong>$password</strong> ";
       	}else{
            $hash = null;
            //usuario ha utilizado un servicio externo que mediante el protocolo oAuth 
            //hemos obtenido sus datos.
            //Generamos mensaje de bienvenida que se mandará por email.
            $message = $firstName. " <br>Debes utilizar tu <strong>cuenta de facebook</strong> para acceder a la aplicación";
        }
    }
}