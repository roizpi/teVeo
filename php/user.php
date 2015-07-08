<?php
require_once 'auth/Auth.php';

class User
{
    private $_data;
    private $auth;
    private $method;
    
    public function __construct($method){
        $this->method = $method;
        $this->auth = new Auth();       
    }

    public function authenticate(){
        //Logeamos al usuario, devuelve token en caso de éxito
        return $this->auth->login($this->method);
        
    }
    
}