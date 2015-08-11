
var SessionManager = (function(_super,$,environment){

	__extends(SessionManager, _super);

	var session = {};
	var self = this;
	
	function SessionManager(debug,utils){

		self = this;
		this.debug = debug;
		this.utils = utils;
		//recuperamos el token del almacenamiento local.
		var item = sessionStorage.getItem("session_token");
		token = item ? JSON.parse(item) : false;

		this.debug.log("Este es el entorno","LOG");
		this.debug.log(environment,"LOG");

	}

	var encodeToken = function(token){
		return self.utils.utf8_to_b64(JSON.stringify(token));
	}

	var storageToken = function(token){
		sessionStorage.setItem("session_token",encodeToken(token));
	}

	SessionManager.prototype.createSession = function(idUser) {

		var time = new Date().getTime();
		//Creamos el token
		session.token = {
			idUser:idUser,
			data:time,
			exp:time +30
		};
		//Persistimos el token en el almacenamiento local HTML5
		storageToken(session.token);
       
		//Obtenemos el servicio de localización de servicios remotos.
		var serviceLocator = environment.getService("SERVICE_LOCATOR");
		//Obtenemos la información del usuario.
		return serviceLocator.getUserConnectedData().done(function(data){
			if (data) session.user = data;
		});
		
	};

	SessionManager.prototype.getToken = function() {
		return encodeToken(session.token);
	};

	SessionManager.prototype.getUser = function() {
		return session.user;
	};

	//Comprueba si hay una sesión activa.
	SessionManager.prototype.hasSessionAlive = function() {
		return token ? true : false;
	};
	//Devuelve el tiempo de vida del token de sesión.
	SessionManager.prototype.getSessionLife = function() {
		return false;
	};

	SessionManager.prototype.destroy = function() {
		// body...
	};
	
	return SessionManager;
	
})(Component,jQuery,environment);