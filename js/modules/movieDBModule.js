var MovieDB = (function(_super,$,environment){

	__extends(MovieDBModule, _super);

	const API_KEY = '349a89a63f08927611382bc4817912e7';

	var authToken = null;
	var configuration;
	var services = {
		CONFIGURATION:{
			url:"http://api.themoviedb.org/3/configuration",
			auth:false
		},
		AUTH_TOKEN:{
			url:"http://api.themoviedb.org/3/authentication/token/new",
			auth:false
		},
		DISCOVER_MOVIES:{
			url:"http://api.themoviedb.org/3/discover/movie",
			auth:false
		},
		DISCOVER_TV_SERIES:{
			url:"http://api.themoviedb.org/3/discover/tv",
			auth:false
		}
		
	}


	function MovieDBModule(){


	}

	//Métodos privados
	//Convierte un objeto de opciones a un query string.
	var jsonToQueryString = function(json) {
	    return '?' + 
	        Object.keys(json).map(function(key) {
	            return encodeURIComponent(key) + '=' +
	                encodeURIComponent(json[key]);
	        }).join('&');
	}

	var callService = function(url,callback){
		$.getJSON(url,function(response){
			typeof(callback) == "function" && callback(response);
		});
	}

	var resolveService = function(name,query,callbacks){

		if (services[name.toUpperCase()] && $.isPlainObject(query)) {

			var service = services[name.toUpperCase()];
			if (!service.auth) {
				query["api_key"] = API_KEY;
				var queryString = jsonToQueryString(query);
				callService(service.url+queryString,function(response){
					typeof(callbacks.onRequestResolved) == "function" && callbacks.onRequestResolved(response);
				});
			};

		}
		
	}

	//Devuelve el token de autorización necesario para utilizar el resto de la api.
	var getAuthToken = function(callbackSuccess,callbackError){
		
		if (!authToken) {
			
			callService("AUTH_TOKEN",{
				api_key:API_KEY
			},function(response){
				if(response.success){
					authToken = {
						expires_at:token.expires_at,
						request_token:token.request_token
					}
					typeof(callbackSuccess) == "function" && callbackSuccess(authToken.request_token);
				}
			});
				
		}else{
			typeof(callbackSuccess) == "function" && callbackSuccess(authToken.request_token);
		}
		
		
	};


	//API Pública del Módulo

	MovieDBModule.prototype.onCreate = function() {
		//Obtenemos la configuración necesaria.
		resolveService("CONFIGURATION",{},{
			onRequestResolved:function(response){
				configuration = response;
			}
		});
	};

	//Método para obtener películas.
	MovieDBModule.prototype.getPopularMovies = function(count,callback) {
		
		resolveService("DISCOVER_MOVIES",{
			language:"es",
			sort_by:"popularity.desc",
			with_genres:27,
			"release_date.gte":"2000-5-12"
		},{
			onRequestResolved:function(response){
				var movies = [];
				var idx = 0;
				do{
					var movie = response.results[idx];
					//Configuramos la información a devolver.
					movies.push({
						title:movie['title'],
						poster:configuration['images']['base_url'] + configuration['images']['poster_sizes'][2] + movie['poster_path'],
						date:movie['release_date']
					});
					idx++;
				}while(movies.length < count && response.results[idx]);
				//Devolvemos la películas.
				typeof(callback) == "function" && callback(movies);
			}
		});
		
	};

	MovieDBModule.prototype.getPopularTVSeries = function() {

		resolveService("DISCOVER_TV_SERIES",{
			language:"es",
			sort_by:"popularity.desc",
			timezone:"ES"
		},{
			onRequestResolved:function(response){
				console.log("Series Populares");
				console.log(response);
			}
		});
	};


	return MovieDBModule;


})(Component,jQuery,environment);