var GooglePlusAuthenticator = (function(_super,$,environment){

	__extends(GooglePlusAuthenticator, _super);

	const API_KEY = "AIzaSyDBhfmcLQP5qPmufZ9l-aZRRD4OuslS7xU";
	const CLIENT_ID = "416268326597-jukv6geep1m9quq5s3mm07n6cl7qb4k1.apps.googleusercontent.com";
	const GOOGLE_API_URL = "https://apis.google.com/js/client.js?onload=onLoadCallback";


	function GooglePlusAuthenticator(){}

	var loadGooglePlusApi = function(callback){

		//Comprobamos si la API está cargada.
	    if ($('script[src="'+GOOGLE_API_URL+'"]').length>0 && window.google){
	      	typeof(callback) == "function" && callback(gapi);
	    }else{
	      //Configuramos el callback.
	      window.onLoadCallback = onLoadCallback;
	      //Descargamos la API.
	      $.getScript(GOOGLE_API_URL);

	      $(window).on('GOOGLE_PLUS_LOADED',function(){
	      	//Inicializamos el objeto FB.
        	gapi.client.setApiKey(API_KEY); //set API_KEY
    		gapi.client.load('plus', 'v1',function(){});//Load Google + API
    		delete window['onLoadCallback'];
	        typeof(callback) == "function" && callback(gapi);
	      });
	    }

    }

    var onLoadCallback = function(){
    	$(window).trigger('GOOGLE_PLUS_LOADED');
    }

    var loginCallback = function(result){
    	if(result['status']['signed_in']){
    		getUserData();
    	}else{
    		console.log("Ocurrió error");
    		console.log(result);
    	}
    }

    /*function logout()
	{
	    gapi.auth.signOut();
	    location.reload();
	}*/

    var getUserData = function(){

    	var request = gapi.client.plus.people.get({
		    'userId': 'me'
		});

		request.execute(function (resp){
    		var email = '';
		    if(resp['emails'])
		    {
		        for(i = 0; i < resp['emails'].length; i++)
		        {
		            if(resp['emails'][i]['type'] == 'account')
		            {
		                email = resp['emails'][i]['value'];
		            }
		        }
		    }
 			console.log("RESPUESTA ....");
    		console.log(resp);
		});
    }


	GooglePlusAuthenticator.prototype.login = function(callbackSuccess,callbackError) {

		templating.loadTemplate({
            name:"google_plus_loader",
            category:"OVERLAY_MODULE_VIEW",
            handlers:{
            	onAfterShow:function(view){
            		var self = this;
			        //Cargamos el SDK de Facebook.
			        loadGooglePlusApi(function(gapi){

			        	var params = {
						    'clientid' :CLIENT_ID , //You need to set client id
						    'cookiepolicy' : 'single_host_origin',
						    'callback' : 'loginCallback', //callback function
						    'approvalprompt':'force',
						    'scope' : 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.profile.emails.read'
						};

						window.loginCallback = loginCallback;

				  		gapi.auth.signIn(params);
			        });
            	}
            }
        });
        
         
    }


	return GooglePlusAuthenticator;


})(Component,jQuery,environment);