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

    
    FacebookAuthenticator.prototype.login = function(callbackSuccess,callbackError) {
        var self = this;
        //Cargamos el SDK de Facebook.
        loadFacebookSdk(function(){
        	//Comprobamos el estado.
            FB.getLoginStatus(function(data) {
                if (data.status !== 'connected') {
                	//El usuario no está conectado.
                    FB.login(function(response) {
                        console.log(response);
                        //Comprobamos si se ha conectado.
                        if (response.status === 'connected')
                        	//Usuario conectado.
                            getUserData(function(data){
                                callbackSuccess.apply(self,[data]);
                            });
                        else
                            callbackError.call(self);
                    }, {scope: SCOPES});
                }else{
                	//El usuario ya está conectado.
                    getUserData(function(data){
                    	//Obtenemos su información.
                        callbackSuccess.apply(self,[data]);
                    });
                }
            });
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