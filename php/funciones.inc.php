<?php

    function init_session(){
        // Tiempo de Vida de la sesión(1 hora)
        // configura periodo recolección de basura
        ini_set('session.gc_maxlifetime', 3600);
        //Parámetros para la cookie de sesión.
        session_set_cookie_params(3600,'/','');
        session_name("teveo");
        session_cache_limiter('nocache');
        session_start();
    }
    //Comprueba la disponibilidad de un email.
    function emailAvaliable($email){
        try{
            $pdo = obtenerConexion();
            $stmt = $pdo->prepare("SELECT COUNT(*) AS EXISTE from USUARIOS where email = :email");
            $stmt->execute(array("email" => $email));
            return !$stmt->fetch(PDO::FETCH_ASSOC)["EXISTE"];
        
        }catch (PDOException $e) {
             return true;
        }
    }

    //Comprueba la disponibilidad del nick.
    function nickAvaliable($nick){
        try{
            $pdo = obtenerConexion();
            $stmt = $pdo->prepare("SELECT COUNT(*) AS EXISTE from USUARIOS where nick = :nick");
            $stmt->execute(array("nick" => $nick));
            return !$stmt->fetch(PDO::FETCH_ASSOC)["EXISTE"];
        
        }catch (PDOException $e) {
             return true;
        }
    }

    function validarMail(&$email) { 
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
    //Valida teléfono
    function validarTelefono($telefono){
        return preg_match('/^[9|8|6|7][0-9]{8}$/', $telefono);
    }
    //Valida fecha
    function validarFecha($fecha){
        return preg_match('/^\d{1,2}\/\d{1,2}\/\d{4}$/', $fecha);
    }

    function userExistenceCheck($email,$authMethod){
        
        try{
            $pdo = obtenerConexion();
            $stmt = $pdo->prepare("SELECT COUNT(*) AS EXISTE from USUARIOS where email = :email AND authMethod = :authMethod");
            $stmt->execute(array("email" => $email,"authMethod" =>$authMethod ));
            return $stmt->fetch(PDO::FETCH_ASSOC)["EXISTE"];
        
        }catch (PDOException $e) {
             return true;
        }
    
    }

    //Función para Obtener una instancia del Objeto PDO.
    function obtenerConexion(){
        # Parámetros de conexión a la BD.
        $host='localhost';
        $dbname='teveo';
        $user='root';
        $pass='';
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
            $pdo->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
            return $pdo;
 		} catch (Exception $e) {
 			return false;
 		}
		
		 
	}

	/* Función para generar la password */
	function generarPassword($length = 10){
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
	function hash_password($password){

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

	function check_password($password,$dbHash){

		// Recalculamos a ver si el hash coincide.
		if (crypt($password, $dbHash) == $dbHash){
			return true;
		}else{
		    return false;
		}

	}

	
	// Función para enviar email a través de la librería PHPMailer.
	function send_mail($destino,$asunto,$msg){

		require_once 'vendor/phpMailer/class.phpmailer.php';
		require_once 'vendor/phpMailer/class.smtp.php';

		$mail = new PHPMailer();
		//indico a la clase que use SMTP
		$mail->IsSMTP();
		//permite modo debug para ver mensajes de las cosas que van ocurriendo
		$mail->SMTPDebug = 0;
		//Debo de hacer autenticación SMTP
		$mail->SMTPAuth = true;
		$mail->SMTPSecure = "ssl";
		//indico el servidor de Gmail para SMTP
		$mail->Host = "smtp.gmail.com";
		//indico el puerto que usa Gmail
		$mail->Port = 465;
		//indico un usuario / clave de un usuario de gmail
		$mail->Username = "bibliotecajcyl@gmail.com";
		$mail->Password = "Asuncion13.";
		$mail->SetFrom("bibliotecajcyl@gmail.com", utf8_decode('TeVeo!'));
		//$mail->AddReplyTo("tu_correo_electronico_gmail@gmail.com","Nombre completo");
		$mail->Subject = $asunto;
		
		$mail->MsgHTML(utf8_decode("<p>$msg</p>"));
		//indico destinatario
		$address = $destino;
		$mail->AddAddress($address, "El Equipo de TeVeo!");
		$mail->Send();
	}

	/*Función para comprobar la disponibilidad de un nick en la BD*/
	function isAvailable($nick){
		$pdo = obtenerConexion();
		if ($pdo) {
			$res = $pdo->query("SELECT COUNT(*) AS DISPONIBLE FROM USUARIOS WHERE NICK = '$nick'");
			$available = $res->fetch(PDO::FETCH_ASSOC)["DISPONIBLE"];
			return !$available;
			
		}
	}

	function logger_action($accion,$origen){
		define("LOG_FOLDER",'log/');
	    //Definimos la hora de la accion
	    $hora=str_pad(date("H:i:s"),10," "); //hhmmss;
	    //Definimos el contenido de cada registro de accion por usuario.
	    $usuario=strtoupper(str_pad($origen,15," "));
	    $accion=strtoupper(str_pad($accion,30," "));
	    $cadena=$hora.$usuario.$accion.$origen;
	    //Creamos dinamicamente el nombre del archivo por dia
	    $pre="log";
	    $date=date("ymd"); //aammddhhmmss
	    $fileName=LOG_FOLDER.$pre.$date.".txt";
	    //echo "$fileName";
	    $f = fopen($fileName,"a");
	        fputs($f,$cadena."\r\n") or die("no se pudo crear o insertar el fichero");
	    fclose($f);
	   
	}//end generaLogs function
	
		
		    

	
	
