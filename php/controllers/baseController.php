<?php

abstract class baseController{
    
    const CONTROLLERS_FOLDER = "/controllers/";
    private static $controllerCache = array();
    protected $conn;
    
    public function __construct(){
		$this->conn = new PDO('mysql:host=localhost;port=3306;dbname=teveo', 'root', '');
		$this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	}
    
    private static function loadController($controller){
        $class = $controller->controller_name;
        $method = $controller->action_name;
        if(!array_key_exists($class,self::$controllerCache)){
            $folder = dirname(__DIR__).self::CONTROLLERS_FOLDER;
            $fileName = $folder.$class.".php";
            if(is_file($fileName)) {
               //incluimos ese archivo
                require $fileName;
                if (class_exists($class)) {
                    if(in_array($method,get_class_methods($class))){
                        $obj = new $class;
                        //cacheamos Objeto.
                        self::$controllerCache[$class] = $obj;
                        return $obj;
                    }else{
                        //lanzar excepción
                    }
                }
                
            }else{
                
                throw new Exception("Fallo al cargar controlador, fichero no encontrado");
            }
            
        }else{
            
            return self::$controllerCache[$class];
        }
        
    }
    
    public static function execute($controller,$params){
        $obj = self::loadController($controller);
        $response = call_user_method_array($controller->action_name, $obj,$params);
        return $response;
    }
    
    
    

}