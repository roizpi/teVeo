<?php

//Excepciones.
class ExceedSessionAttempts extends Exception {}
class LoginFailed extends Exception {}
class InvalidData extends Exception {}


class Auth
{
    private $pdo;
    //Número Máximo de Intentos permitidos de Inicio de Sesión
    const MAX_ATTEMPTS = 5;
    //Tiempo de bloqueo, cuando sobrepasa el número de intentos permitidos.
    const SECURITY_DURATION = "+30 minutes";
    
    public function __construct(){
        $this->pdo = new PDO('mysql:host=localhost;port=3306;dbname=teveo', 'root', '');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->expireattempt();
    }
    
    /**
    *
    * Método para logear al usuario.
    *
    */
    
    public function login($authMethod){
        
        if($authMethod == "LOCAL"){
            //Obtengo el número de intentos de sesión de la ip.
            $attcount = $this->getattempt($_SERVER['REMOTE_ADDR']);

            if($attcount >= self::MAX_ATTEMPTS){

                throw new ExceedSessionAttempts("Has sobrepasado el número de intentos de sessión permitidos - espere 30 minutos");

            }else{

                //Validamos datos.
                //Saneamos y Filtramos los datos.
                $nick = filter_input(INPUT_POST,'nick',FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);
                $password = filter_input(INPUT_POST,'password',FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);

                if($nick && $password){
                    //Comprobamos si existe ese usuario con esa contraseña.
                    $sql = $this->pdo->prepare('SELECT * FROM USUARIOS WHERE nick = :nick AND authMethod = "LOCAL"');
                    $sql->execute(array('nick' => $nick));
                    $usuario = $sql->fetch(PDO::FETCH_ASSOC);

                    if(!check_password($password,$usuario["password"])){
                        //Fallo al intentar iniciar sesión.
                        //Añadimos intento de sesión.
                        $this->addattempt($_SERVER['REMOTE_ADDR']);
                        //Registramos acción.
                        logger_action("intento sesión fallido",$_SERVER["REMOTE_ADDR"]);
                        throw new LoginFailed("Usuario o contraseña no válidos");
                    }else{
                        //usuario logeado correctamente.
                        logger_action("sesión iniciada",$_SERVER["REMOTE_ADDR"]);
                        //Generamos token de sesión
                        return $this->generateSessionToken($usuario["id"]);

                    }

                }else{
                    throw new InvalidData("Nick y password no pueden estar vacíos");
                }
            }
            
        }else{
            //Saneamos y validamos email.
            $email =filter_input(INPUT_POST,'email',FILTER_SANITIZE_EMAIL,FILTER_VALIDATE_EMAIL);
            $stmt = $this->pdo->prepare('SELECT * FROM USUARIOS WHERE email = :email AND authMethod = :authMethod');
            $stmt->execute(array('email' => $email,'authMethod' => $authMethod));
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if($stmt->rowCount() == 0){
                throw new LoginFailed("Usuario o contraseña no válidos");
            }else{
                //usuario logeado correctamente.
                logger_action("sesión iniciada",$_SERVER["REMOTE_ADDR"]);
                //Generamos token de sesión
                return $this->generateSessionToken($usuario["id"]);
            }
        }
    
    }


    /*Obtiene el número de intentos realizados.*/
    private function getattempt($ip){
        $sql = $this->pdo->prepare('SELECT count as num FROM ATTEMPTS WHERE IP = :IP');
        $sql->execute(array(':IP' => $ip));
        $resultado = $sql->fetch(PDO::FETCH_ASSOC);
        return $resultado["num"];
    }
    
    /*Permite añadir intentos de sesión fallidos*/
    private function addattempt($ip){
        
        $attempt_count = $this->getattempt($ip);
        if($attempt_count == 0){

            // No existe ningún registro para esta Ip, creamos uno nuevo.
            $attempt_expiredate = date("Y-m-d H:i:s", strtotime(self::SECURITY_DURATION));
            $attempt_count = 1;
            $sql = "INSERT INTO attempts (ip,count,expiredate) VALUES (:ip,:count,:expiredate)";
            $q = $this->pdo->prepare($sql);
            $q->execute(array(':ip'=>$ip,':count' => $attempt_count,':expiredate' => $attempt_expiredate));

        }else{

            // La IP Ya existe en la tabla de intentos de sesión, por lo que actualizamos el número de intentos.
            $attempt_expiredate = date("Y-m-d H:i:s", strtotime(self::SECURITY_DURATION));
            $attempt_count = $attempt_count + 1;
            $sql = "UPDATE attempts SET count = :count, expiredate = :expiredate WHERE ip = :ip";
            $q = $this->pdo->prepare($sql);
            $q->execute(array(':ip'=>$ip,':count' => $attempt_count,':expiredate' => $attempt_expiredate));
        }
    }

    
    /*
    * Función usada para eliminar intentos de acceso expirados
    *(Recommended as Cron Job)
    */
    
    private function expireattempt(){
        
        $curr_time = strtotime(date("Y-m-d H:i:s"));
        $sql = $this->pdo->prepare('SELECT * FROM ATTEMPTS');
        $sql->execute();
        $attempts = $sql->fetchAll();
        
        foreach ($attempts as $attempt) {
            //Si la fecha de expiración del intento de sesión es menor o igual que la fecha actual
            // lo borramos.
            if(strtotime($attempt["expiredate"]) <= $curr_time){
                $sql = $this->pdo->prepare('DELETE FROM ATTEMPTS WHERE IP = :IP');
                $sql->execute(array("IP" => $attempt["ip"]));
            }
        }
    
    }
    
    //Método  para generar Tokens de Sesión.
    private function generateSessionToken($idUser){
        
        $sessionToken = array("idUser" => $idUser,"date" => time(),"exp" => time() +30);
        return base64_encode(json_encode($sessionToken));
    }
    
    

}