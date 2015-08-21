var Metro = (function(_super,$,environment){

	var templating;

	function Metro(){

		templating = environment.getService("TEMPLATE_MANAGER");
	}

	var onCreate = function(view){
		
		var serviceLocator = environment.getService("SERVICE_LOCATOR");
		var utils = environment.getService("UTILS");

		var generalNews = serviceLocator.getGeneralNewsToday();
		var sportNews = serviceLocator.getLatestSportsNews();
		var technologyNews = serviceLocator.getLatestTechnologyNews();

		$.when(generalNews,sportNews,technologyNews).done(function(generalNews,sportNews,technologyNews){

			var containerGeneralNews = view.getView("generalNews");
			for(var i = 0; i < 2; i++){
				var poster = utils.utf8_decode(generalNews[i].poster);
				containerGeneralNews.createView("news",{
					poster:poster,
					title:generalNews[i].title[0]
				});
			}

			var containerSportNews = view.getView("sportNews");
			for(var i = 0; i < 2; i++){
				var poster = utils.utf8_decode(sportNews[i].poster);
				containerSportNews.createView("news",{
					poster:poster,
					title:sportNews[i].title[0]
				});
			}

			var containerTechNews = view.getView("techNews");
			for(var i = 0; i < 2; i++){
				var poster = utils.utf8_decode(technologyNews[i].poster);
				containerTechNews.createView("news",{
					poster:poster,
					title:technologyNews[i].title[0]
				});
			}
			

			$(".tile").filter(function(idx,tile){
				return $(".tile-content",tile).children(".live-slide").length >= 2;
			}).each(function(idx,tile){
				setTimeout(function(){
					$(".tile-content .live-slide:first",tile).remove();
				},5000);
			})
			

		});
		
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