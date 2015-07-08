<?php

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    
    require_once 'funciones.inc.php';
    $errores = [];
    //Recogemos método de autenticación.
    $authMethod = $_POST["authMethod"];
    if(!$authMethod)
        array_push($errores,"Método de autenticación no puede estar vacío");
    else if($authMethod != "LOCAL" && $authMethod != "FACEBOOK")
        array_push($errores,"Método de autenticación no válido");
        
            
    $email = $_POST["email"];
    
    //Comprobamos la existencia del usuario.
    if(userExistenceCheck($email,$authMethod)){
        
         echo json_encode(array("error" => true,"type" => "USER_ALREADY_EXIST","data" => "El usuario ya existe en la BD"));
       
    }else{
        //El usuario no existe, seguimos comprobando.
        $foto = $_POST['photo'];
        //Validamos FirstName
        $firstName = filter_input(INPUT_POST,'first_name',FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);
        if (!$firstName) 
            array_push($errores,"El nombre no puede estar vacío");
        elseif(is_numeric($firstName))
            array_push($errores,"El nombre no puede ser un número");

        //Validamos lastName
        $lastName = filter_input(INPUT_POST,'last_name',FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);
        if (!$lastName)
            array_push($errores,"El apellido no puede estar vacío");
        elseif(is_numeric($lastName))
            array_push($errores,"El apellido no puede ser un número");
        //Validamos ubicación
        $ubicacion = filter_input(INPUT_POST,'location',FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);
        if(!$ubicacion)
            array_push($errores,"La ubicación no puede estar vacía");
        //Validamos sexo.
        $sexo = $_POST["sex"];
        if($sexo != "H" && $sexo != "M")
            array_push($errores,"Sexo no válido");
        //Validamos fecha Nac
        $fechaNac = $_POST["birthday"];
        if(!$fechaNac)
            array_push($errores,"Fecha no puede estar vacía");
        else if(!validarFecha($fechaNac))
            array_push($errores,"la Fecha no es válida" );
        //Validamos teléfono
        $telefono = isset($_POST["tel"]) ? $_POST["tel"] : null;
        if($telefono != null && !(validarTelefono($_POST["tel"])))
            array_push($errores,"Teléfono no válido");
        //Validamos email.
        $nick = filter_input(INPUT_POST,'nick',FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);
            if (!$nick) 
                array_push($errores,"Nick no válido");

        //Comprobamos si hay errores.
        if(!sizeof($errores)){
            if($authMethod == "LOCAL"){
                //Generamos la password al usuario.
                $password = generarPassword();
                //Generamos un hash para la contraseña.
                $hash = hash_password($password);
                //Generamos mensaje de bienvenida que se mandará por email.
                $message = $firstName. " <br>Tus datos de acceso son: " . $nick . " y su contraseña: <strong>$password</strong> ";
            }else{
                $hash = null;
                //usuario ha utilizado un servicio externo que mediante el protocolo oAuth 
                //hemos obtenido sus datos.
                //Generamos mensaje de bienvenida que se mandará por email.
                $message = $firstName. " <br>Debes utilizar tu <strong>cuenta de facebook</strong> para acceder a la aplicación";
            }

            try{
                //Procedemos a dar de alta al usuario.
                //Obtenemos la conexión.
                $pdo = obtenerConexion();
                $sql = "INSERT INTO USUARIOS (foto,nick,password,firstName,lastName,email,fechaNac,sexo,ubicacion,telefono,authMethod)
                        VALUES(:foto,:nick,:password,:firstName,:lastName,:email,STR_TO_DATE(:fechaNac,'%d/%m/%Y'),:sexo,:ubicacion,:telefono,:authMethod)";
                //Preparamos la sentencia.                             
                $stmt = $pdo->prepare($sql);
                //Bindeamos los datos.                                  
                $stmt->bindParam(':foto',$foto, PDO::PARAM_STR);       
                $stmt->bindParam(':nick',$nick, PDO::PARAM_STR); 
                $stmt->bindParam(':password',$hash, PDO::PARAM_STR);  
                $stmt->bindParam(':firstName',$firstName, PDO::PARAM_STR); 
                $stmt->bindParam(':lastName', $lastName, PDO::PARAM_STR); 
                $stmt->bindParam(':email', $email, PDO::PARAM_STR); 
                $stmt->bindParam(':fechaNac', $fechaNac, PDO::PARAM_STR);
                $stmt->bindParam(':sexo', $sexo, PDO::PARAM_STR);
                $stmt->bindParam(':ubicacion', $ubicacion, PDO::PARAM_STR);
                $stmt->bindParam(':telefono', $telefono,PDO::PARAM_INT);
                $stmt->bindParam(':authMethod',$authMethod,PDO::PARAM_STR);
                //Ejecutamos la sentencia.                                     
                $exito = $stmt->execute();
                //La operación tuvo éxito.
                if ($exito) {
                    //Enviamos email al usuario.
                    echo json_encode(array("error" => false,"type" => "REGISTRATION_SUCCESFULL","data" => "Te has dado de alta correctamente, en breve recibirás un correo con tus datos de acceso"));
                    if($authMethod == "LOCAL")
                        logger_action("CONTRASEÑA GENERADA",$password);
                    send_mail($email,"Bienvenido a TeVeo!",$message); 
                }

            }catch (PDOException $e) {
                logger_action("ERROR_REGISTRO",$e->getMessage());
                echo json_encode(array("error" => true,"type" => "DATABASE","data" => "Ocurrió un error inténtelo más tarde"));
            }

        }else{
            echo json_encode(array("error" => true,"type" => "INVALID_DATA","data" => $errores));
        }
    

    }
    
    
}
    
sleep(5);


