<?php

error_reporting(E_ALL);
require_once 'funciones.inc.php';
require_once 'user.php';


if (isset($_SERVER['HTTP_REFERER']) && preg_match("/^http\:\/\/localhost\/proyectoFinal/",$_SERVER['HTTP_REFERER'])  && isset($_REQUEST["method"])) {

    $method = $_REQUEST["method"];
    $user = new User($method);

    try {
        
        $token = $user->authenticate();
        //Enviamos token
        echo json_encode(array("error" => false,"type" => "SESSION_TOKEN","data" =>$token));
    
    } catch (ExceedSessionAttempts $e) {
        $error =  $e->getMessage();
        echo json_encode(array("error" => true,"type" => "EXCEED_SESSION_ATTEMPTS","data" => $error));
    }catch(LoginFailed $e){
        $error =  $e->getMessage();
        echo json_encode(array("error" => true,"type" => "LOGIN_FAILED","data" => $error));
    }catch(InvalidData $e){
        $error =  $e->getMessage();
        echo json_encode(array("error" => true,"type" => "INVALID_DATA","data" => $error));
    }catch(Exception $e){
        echo json_encode(array("error" => true,"type" => "OTHERS","data" => "Ocurrío un error inténtalo de más tarde"));
    }
    
}else{
    echo json_encode(array("error" => true,"data" => "Acceso no permitido"));
}

exit;
