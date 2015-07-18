
var SessionManager = (function(_super,environment){

	__extends(SessionManager, _super);

	var token;
	
	function SessionManager(debug){

		this.debug = debug;
		//recuperamos el token del almacenamiento local.
		var item = sessionStorage.getItem("session_token");
		token = item ? JSON.parse(item) : false;

		this.debug.log("Este es el entorno","LOG");
		this.debug.log(environment,"LOG");

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
	
})(Component,environment);