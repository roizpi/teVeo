var AuthenticatorFactory = (function(_super,$,environment){

	__extends(AuthenticatorFactory, _super);

	function AuthenticatorFactory(){}

	AuthenticatorFactory.prototype.getAuthenticator = function(name,callback) {
		//Obtenemos el servicio de administración de módulos
		var managerModule = environment.getService("MANAGER_MODULE");

		if(managerModule.isExists(name) && managerModule.isDeferred(name)){

			//Solicitamos el módulo diferido indicado como parámetro.
			managerModule.getDefferedModule(name,callback);

		}else{
			console.log("El módulo no existe o no está activado");
		}
		
	};

	return AuthenticatorFactory;

})(Component,jQuery,environment);