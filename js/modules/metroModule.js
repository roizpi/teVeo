var Metro = (function(_super,$,environment){

	__extends(Metro, _super);

	var templating;

	function Metro(){

		templating = environment.getService("TEMPLATE_MANAGER");
	}

	var onCreate = function(view){

		var tiles = {
			GENERAL_NEWS:{
				service:"getGeneralNewsToday",
				colors:"fg-white bg-magenta",
				icon:"mif-pencil"
			},
			SPORT_NEWS:{
				service:"getLatestSportsNews",
				colors:"fg-white bg-darkViolet",
				icon:"mif-trophy"
			},
			TECHNOLOGY_NEWS:{
				service:"getLatestTechnologyNews",
				colors:"fg-white bg-lightOlive",
				icon:"mif-phonelink"
			}
		}
		var serviceLocator = environment.getService("SERVICE_LOCATOR");
		var utils = environment.getService("UTILS");

		for (var tile in tiles) 

			(function(tile){

				//llamamos al servicio para obtener las noticias.
				serviceLocator[tile.service]().done(function(news){

					view.createView("tileNews",{
						name:tile
					},{
					
						handlers:{
							onCreate:function(view){
								var tileContent = view.getView("tileContent");
								for(var j = 0; j < 2; j++){
									var title = news[j].title[0];
									var poster = utils.utf8_decode(news[j].poster);
									tileContent.createView("news",{
										background:tile.colors,
										poster:poster,
										icon:tile.icon,
										title:title
									});
								}
							}
						},
						animations:{
							animationIn:"zoomInUp",
							animationOut:"zoomOutDown"
						}

					}); 
				});

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