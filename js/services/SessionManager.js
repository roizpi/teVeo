
var SessionManager = (function(){

	var token;
	
	function SessionManager(){
		//recuperamos el token del almacenamiento local.
		var item = sessionStorage.getItem("session_token");
		token = item ? JSON.parse(item) : false;

	}

	//Comprueba si hay una sesión activa.
	SessionManager.prototype.hasSessionAlive = function() {
		return token ? true : false;
	};
	//Devuelve el tiempo de vida del token de sesión.
	SessionManager.prototype.getSessionLife = function() {
		return fase;
	};

	SessionManager.prototype.destroy = function() {
		// body...
	};
	
	return SessionManager;
})();