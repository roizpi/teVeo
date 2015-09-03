var Metro = (function(_super,$,environment){

	__extends(Metro, _super);

	var templating;
	var serviceLocator;
	var utils;
	var self;

	function Metro(movieDB){
		self = this;
		this.movieDB = movieDB;
		templating = environment.getService("TEMPLATE_MANAGER");
		serviceLocator = environment.getService("SERVICE_LOCATOR");
		utils = environment.getService("UTILS");
	}


	var createTile = function(view,data){

		view.createView("tileNews",{
			name:data.name
		},{
					
			handlers:{
				onCreate:function(view){
					var tileContent = view.getView("tileContent");
					for(var j = 0; j < 2; j++){
						var element = data.content[j];
						var title = typeof(element.title) == "object" ? element.title[0] : element.title;
						var poster = utils.utf8_decode(element.poster);
						tileContent.createView("news",{
							background:data.colors,
							poster:poster,
							icon:data.icon,
							title:title
						},{
							handlers:{
								onCreate:function(view){
									view.get().addClass(data.size);
								}
							}
						});
					}
				}
			},
			animations:{
				animationIn:"zoomInUp",
				animationOut:"zoomOutDown"
			}

		});

	}

	var onCreate = function(view){

		var tiles = {
			GENERAL_NEWS:{
				name:"generalNews",
				resolver:"SERVICE_LOCATOR",
				service:"getGeneralNewsToday",
				size:"tile-wide",
				colors:"fg-white bg-magenta",
				icon:"mif-pencil"
			},
			SPORT_NEWS:{
				name:"sportNews",
				resolver:"SERVICE_LOCATOR",
				service:"getLatestSportsNews",
				size:"tile-wide",
				colors:"fg-white bg-darkViolet",
				icon:"mif-trophy"
			},
			TECHNOLOGY_NEWS:{
				name:"technologynews",
				resolver:"SERVICE_LOCATOR",
				service:"getLatestTechnologyNews",
				size:"tile-wide",
				colors:"fg-white bg-lightOlive",
				icon:"mif-phonelink"
			},
			POPULAR_MOVIES:{
				name:"popularmovies",
				resolver:"MOVIEDB",
				service:"getPopularMovies",
				size:"tile-wide",
				colors:"fg-white bg-darkCyan",
				icon:"mif-film"
			}
		}
		

		for (var tile in tiles) 

			(function(tile){

				switch(tile.resolver){
					case 'SERVICE_LOCATOR' :
						//llamamos al servicio para obtener las noticias.
						serviceLocator[tile.service]().done(function(news){
							createTile(view,{
								name:tile.name,
								size:tile.size,
								colors:tile.colors,
								icon:tile.icon,
								content:news
							});
						});
						break;
					case 'MOVIEDB':

						self.movieDB[tile.service](3,function(result){
							createTile(view,{
								name:tile.name,
								size:tile.size,
								colors:tile.colors,
								icon:tile.icon,
								content:result
							});
						});

						break;
				}

				

			})(tiles[tile]);

	}

	var onBeforeShow = function(){

	}

	Metro.prototype.showApps = function() {
		templating.loadTemplate({
            name:"metro",
            category:"MODULE_VIEWS",
          	handlers:{
                onCreate:onCreate,
                onBeforeShow:onBeforeShow
            }
        }).done(function(){

        });
	};

	return Metro;

})(Component,jQuery,environment);