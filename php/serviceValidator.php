<?php 

if (isset($_GET['accion'])) {  
    require("funciones.inc.php");
    $action = $_GET['accion'];
    date_default_timezone_set('Europe/Madrid');
    header('Content-Type: application/json');
        
    switch ($action) {
        case 'VALIDATE_EMAIL':
             //Validamos el email.
            $email = filter_input(INPUT_GET,'data',FILTER_SANITIZE_EMAIL,FILTER_VALIDATE_EMAIL); 
            if($email && emailAvaliable($email))
                 $response = array("error" => false,"data" => "Email correcto");
            else
                $response = array("error" => true,"data" => "Email incorrecto");
        
        break;
        case 'VALIDATE_NICK':
            //Validamos el nick
            $nick = filter_input(INPUT_GET,'data',FILTER_SANITIZE_STRING,FILTER_NULL_ON_FAILURE);
            if($nick && nickAvaliable($nick))
                $response = array("error" => false,"data" => "Nick correcto");
            else
                $response = array("error" => true,"data" => "Nick incorrecto");
        break;
        default:
            $response = array("error" => true,"data" => "Acción no válida");
    }
    
    echo json_encode($response);
        
} else {
    header($_SERVER['SERVER_PROTOCOL'] . " 400 Bad Request", true, 400);
}