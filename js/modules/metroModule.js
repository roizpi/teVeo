var Metro = (function(_super,$,environment){

	var templating;

	function Metro(){

		templating = environment.getService("TEMPLATE_MANAGER");
	}

	var onCreate = function(){

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