var FacebookAuthenticator = (function(_super,$,environment){

	__extends(FacebookAuthenticator, _super);

	const APP_ID = '462860030545455';
    const SCOPES = 'email,user_likes,user_friends,user_birthday,user_hometown,user_location';
    const SDK_URL = '//connect.facebook.net/en_US/sdk.js';
    var sdkLoaded = false;

	function FacebookAuthenticator(){}


	var loadFacebookSdk = function(callback){
 
        if(!sdkLoaded){
            //Cargamos el SDK.
            $.getScript(SDK_URL,function(){
                //Inicializamos el objeto FB.
                FB.init({
                    appId      : APP_ID,
                    status     : true,
                    cookie     : true, 
                    xfbml      : true, 
                    version    : 'v2.1'
                });
                sdkLoaded = true;
                //Pasamos el testigo a la siguiente función.
                callback();
            });
        }else{
            //Sdk ya cargado.
            //Pasamos el testigo a la siguiente función.
            callback();
        }
    }

    //Obtiene información del usuario.
    var getUserData =  function(callback) {
    	//Obtenemos información del usuario.
        FB.api('/me', function(response) {
        	//Obtenemos el servicio de utilidades.
        	var utils = environment.getService("UTILS");
            //Obtenemos la imagen en base64
            utils.convertImgToBase64URL('http://graph.facebook.com/'+response.id+'/picture?type=large', function(base64Img){
                //Incluimos también la foto en la respuesta.
                response.photo = base64Img;
                //pasamos el testigo a la siguiente función.
                callback(response);
            });
        });
    }

    var signUp = function(callbackSuccess,callbackError){
        //Obtenemos información del usuario.
        getUserData(function(data){
            console.log(data);
            //Obtenemos el localizador de servicios remotos.
            var serviceLocator = environment.getService("SERVICE_LOCATOR");
            //Comprobamos si el usuario ya está registrado.
            serviceLocator.checkExistsUser(data.email)
                .done(function(result){
                    //Comprobamos el resultado.
                    if (result.exists) {
                        //El usuario existe.
                        typeof(callbackSuccess) == "function" && callbackSuccess.apply(self,[result.id.id]);
                    }else{
                        //Pedimos confirmación, para registrarse.
                        templating.loadTemplate({
                            name:"user_facebook_preview",
                            category:"OVERLAY_MODULE_VIEW",
                            handlers:{
                                onCreate:function(view){
                                    view.setChildValue("profileImg",data.photo);
                                    view.setChildValue("userName",data.name);
                                    view.setChildValue("location",data.location.name);
                                    view.setChildValue("age",data.birthday);
                                    view.setChildValue("email",data.email);
                                }
                            }
                        });
                    }
                    
                }).fail(function(){
                    //error.
                });
            
        
        });
    }

    
    FacebookAuthenticator.prototype.login = function(callbackSuccess,callbackError) {

        templating.loadTemplate({
            name:"facebook_loader",
            category:"OVERLAY_MODULE_VIEW",
            handlers:{
                onAfterShow:function(view){
                    var self = this;
                    var info = view.getView("info");
                    //Cargamos el SDK de Facebook.
                    loadFacebookSdk(function(){
                        //Comprobamos el estado.
                        info.setValue("Conectándo con Facebook");
                        FB.getLoginStatus(function(data) {
                            
                            if (data.status !== 'connected') {
                                info.setValue("Utiliza la ventana emergente para iniciar sesión en facebook");
                                //El usuario no está conectado.
                                FB.login(function(response) {
                                    console.log(response);
                                    info.setValue("Obteniendo tus datos");
                                    //Comprobamos si se ha conectado.
                                    if (response.status === 'connected'){
                                        //Usuario conectado.
                                        signUp(callbackSuccess,callbackError);
                                    }else{
                                        view.hide(false);
                                        callbackError.call(self);
                                    }
                                }, {scope: SCOPES});
                            }else{
                                info.setValue("Obteniendo tus datos");
                                signUp(callbackSuccess,callbackError);
                            }
                        });
                    });
                }
            }
        });
        
         
    }
     
    /*var facebookLogout = function() {
        checkLoginState(function(data) {
            if (data.status === 'connected') {
                FB.logout(function(response) {
                    $('#facebook-session').before(btn_login);
                    $('#facebook-session').remove();
                })
            }
        })
    }*/


    return FacebookAuthenticator;

})(Component,jQuery,environment);