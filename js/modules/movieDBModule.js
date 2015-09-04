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
		},
		MOVIE_GENRES:{
			url:"http://api.themoviedb.org/3/genre/movie/list",
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
				//Añadimos el lenguaje local.
				query["language"] = navigator.language;
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

	//Obtiene todos lo géneros para las películas.
	var getMovieGenres = function(callback){
		resolveService("MOVIE_GENRES",{},{
			onRequestResolved:function(response){
				typeof(callback) == "function" && callback(response);
			}
		})
	}

	//Método para obtener películas.
	var getPopularMovies = function(count,mapper,callback) {
		
		resolveService("DISCOVER_MOVIES",{
			sort_by:"popularity.desc",
			"vote_average.gte":7,
			page:Math.floor(Math.random()*5 + 1),
			"release_date.gte":"2012-5-12",
			with_genres:"28,12"
		},{
			onRequestResolved:function(response){
				var movies = [];
				var idx = 0;
				do{
					var movie = response.results[idx];
					//Configuramos la información a devolver.
					movie = typeof(mapper) == "function" && mapper(movie);
					//Añadimos la película.
					movies.push(movie);
					idx++;
				}while(movies.length <= count && response.results[idx]);
				//Devolvemos la películas.
				typeof(callback) == "function" && callback(movies);
			}
		});
		
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


	MovieDBModule.prototype.getPopularTVSeries = function(count) {
		var deferred = $.Deferred();

		resolveService("DISCOVER_TV_SERIES",{
			sort_by:"popularity.desc",
			timezone:"ES",
			"vote_average.gte":8,
			page:Math.floor(Math.random()*5 + 1)
		},{
			onRequestResolved:function(response){
				var series = [];
				var idx = 0;
				do{
					var serie = response.results[idx];
					var overview = null;
					if (serie['overview']) {
						overview = serie['overview'].length > 50 ? serie['overview'].substr(0,50) + "..." : serie['overview'];
					};
					//Configuramos la información a devolver.
					series.push({
						title:serie['name'] + ": " + overview,
						poster:configuration['images']['base_url'] + configuration['images']['poster_sizes'][3] + serie['poster_path'],
						date:serie['first_air_date']
					});
					idx++;
				}while(series.length <= count && response.results[idx]);
				//Devolvemos la películas.
				deferred.resolve(series);
			}
		});

		return deferred.promise();
	};

	MovieDBModule.prototype.getMoviesThumbnails = function(count) {

		var deferred = $.Deferred();
		getPopularMovies(
			count,
			function(movie){
				var overview =null;
				if (movie['overview']) {
					overview = movie['overview'].length > 50 ? movie['overview'].substr(0,50) + "..." : movie['overview'];
				};

				return {
					title:movie['title'] + (overview ? ": " + overview : ""),
					poster:configuration['images']['base_url'] + configuration['images']['poster_sizes'][3] + movie['poster_path'],
					date:movie['release_date']
				}
			},
			function(movies){
				deferred.resolve(movies);
			}
		);

		return deferred.promise();
		
	};


	return MovieDBModule;


})(Component,jQuery,environment);