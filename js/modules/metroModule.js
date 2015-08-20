var Metro = (function(_super,$,environment){

	var templating;

	function Metro(){

		templating = environment.getService("TEMPLATE_MANAGER");
	}

	var onCreate = function(view){
		
		var serviceLocator = environment.getService("SERVICE_LOCATOR");
		var utils = environment.getService("UTILS");
		serviceLocator.getLatestSportsNews().done(function(news){
			
			var sportNews = view.getView("sportNews");
			for(var i = 0; i < 2; i++){
				console.log(news[i]);
				sportNews.createView("news",{
					poster:news[i].poster,
					title:news[i].title[0]
				});
			}

		});

		serviceLocator.getLatestTechnologyNews().done(function(news){
			var techNews = view.getView("techNews");
			for(var i = 0; i < 2; i++){
				var poster = utils.utf8_decode(news[i].poster);
				console.log("Esta es la img : " + poster);
				techNews.createView("news",{
					poster:poster,
					title:news[i].title[0]
				});
			}
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