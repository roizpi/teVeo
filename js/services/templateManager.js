var View = (function(){


	function View(el,id,type,name,animations,handlers){

		this.el = el;
		this.id = id;
		this.type = type;
		this.name = name;
		this.views = {};
		this.templates={};
		this.animations = animations;
		this.handlers = handlers;
		this.timestamp = new Date().getTime();
	}

		

	var create = function($element,data,options) {
		//Obtenemos el id de la vista.
		var id = (data && data.id) || Math.round(Math.random() * 100000 + 5000);
		//Obtenemos el tipo de componente.
		var type = $element.get(0).dataset.type || 'html';
		//Obtenemos nombre de la vista.
		var name = (data && data.name) || $element.get(0).dataset.view;
		//Obtenemos las animaciones de la vista.
		var animations = options && (options.animations || {});
		//Obtenemos los manejadores del ciclo de vida de la vista.
		var handlers = options && (options.handlers || {});
		$element.data("id",id);
		var view = new View($element,id,type,name,animations,handlers);

		//las animaciones para los componentes se expresan en el marcado.
		//data-animationin
		//data-animationout
		//los handlers se configuran mediante la API.
		//mediante método setOnCreate
		//Procesamos todos los componentes que contiene el elemento
		$("[data-view]",$element).each(function(idx,child){

			var $child = $(child);
			var $viewParent = $child.parents("[data-view]");
			if($viewParent.length && $viewParent.get(0).isEqualNode($element.get(0))){

				if ($child.is("[data-type='template']")) {
					//Obtenemos el nombre de la template.
					var name = child.dataset.view;
					//Guardamos la template.
					view.templates[name] = $child.removeAttr("data-type").remove();
				}else{
					//creamos la vista.
					var subView = create($child,{},{});
					view.views[subView.getId()] = subView;
				}
			}
			
		});
		//Eliminamos las meta-información del elementos
		view.get().removeAttr("data-view").removeAttr("data-type");
		//hidratamos la vista con los datos especificados.
		view._hydrate(data);
		
		return view;
	};

	//Rellenar el componente con los datos especificados.
	View.prototype._hydrate = function(data){

		if(data){
			
			for(var key in this.views){
				var view = this.views[key];
				//recogemos el valor.
				var value = data[view.name];
				//recogemos el tipo.
				var type = view.type &&  view.type.toUpperCase();
				//Si se ha encontrado valor.
				if (value && type) {

					switch(type){

						case 'IMG':
							view.el.attr("src",value);
							break;
						case 'TEXT':
							view.el.text(value);
							break;
						case 'HTML':
							view.el.html(value);
							break;
						case 'BACKGROUND':
							view.el.css("background-image","url("+value+")");
							break;
						case 'HIDDEN':
							view.el.data("id",value);
							break;
						case 'DATA':
							view.el.attr("data-"+view.name,value);
						default:
							console.log("Valor no conocido");
					}
						
				};
			}

		}


	}

	View.prototype.onCreate = function() {
		this.handlers && typeof(this.handlers.onCreate) === "function" && this.handlers.onCreate(this);
	};

	View.prototype.onBeforeShow = function() {
		this.handlers && typeof(this.handlers.onBeforeShow) == "function" && this.handlers.onBeforeShow(this);
	};

	View.prototype.onAfterShow = function() {
		this.handlers && typeof(this.handlers.onAfterShow) == "function" && this.handlers.onAfterShow(this);
	};

	View.prototype.onBeforeHide = function() {
		this.handlers && typeof(this.handlers.onBeforeHide) == "function" && this.handlers.onBeforeHide(this);
	};
	View.prototype.onAfterHide = function() {
		this.handlers && typeof(this.handlers.onAfterHide) == "function" && this.handlers.onAfterHide(this);
	};

	//Devuelve Objeto jQuery original.
	View.prototype.get = function() {
		return this.el;
	};

	View.prototype.getName = function() {
		return this.name;
	};

	View.prototype.getId = function() {
		return this.id;
	};

	View.prototype.getViews = function() {
		return this.views;
	};
	//Oculta y opcionalmente elimina un elemento.
	View.prototype.hide = function(remove) {
		if(this.animations && this.animations.animationOut){
			var animation = this.animations.animationOut;
			this.el.addClass(animation).one("webkitAnimationEnd animationend",function(){
				var $this = $(this);
				$this.removeClass(animation);
				remove ? $this.remove() : $this.hide();
			});
		}
	};

	View.prototype.show = function() {
		if(this.animations && this.animations.animationIn){
			var animation = this.animations.animationIn;
			this.el.show().addClass(animation).one("webkitAnimationEnd animationend",function(){
				var $this = $(this);
				$this.removeClass(animation);
			});
		}
	};
	//Comprueba si la vista es visible.
	View.prototype.isVisible = function() {
		return this.el.is(":visible");
	};
	//Coloca el scroll la vista al final.
	View.prototype.scrollToLast = function() {
		this.el.scrollTop(el.children(":last").offset().top);
	};

	View.prototype.scrollAt = function(pos) {
		if (pos && !isNaN(parseInt(pos))) {
			this.el.scrollTop(pos);
		};
	};

	View.prototype.detach = function() {
		this.el.detach();
	};

	View.prototype.filter = function(pattern) {
		
		var pattern = new RegExp("("+pattern+")","i");
		$.each(this.el.children(),function(indx,element){
			var $element = $(element);
			var text = $element.find("[data-mark]").html().replace(/<mark>|<\/mark>/ig,"");
			if(text.search(pattern) == -1){
				$element.fadeOut(1000);
			}else{
				//El texto encaja con el patrón, señalamos en que parte.
				//Con $1 hacemos referencia a la captura anterior.
				$element.find("[data-mark]").html(text.replace(pattern,"<mark>$1</mark>"));
				if($element.is(":hidden")){
					$element.fadeIn(1000).effect("highlight",1000);
				}
			}
		});
	};

	View.prototype.getView = function(key){

		var result = null;

		if(this.views && this.views.constructor.toString().match(/object/i)){
			for(var view in this.views){
				var currentView = this.views[view];
				if(currentView.getId() === key || currentView.getName() === key){
					result = currentView;
					break;
				}else{
					var view = currentView.getView(key);
					if (view)
						result = view;
				}
			}
		}

		return result;
			
	}

	View.prototype.removeChild = function(id) {
		
		var view = views && views[id];
		if(view instanceof View){
			//Eliminamos el Nodo DOM.
			view.get().remove();
			//Lo eliminamos del array de vistas.
			delete views[id];
		}
	};

	View.prototype.hideChild = function(id,remove) {
		var view = this.views && this.views[id];
		if(view){
			var self = this;
			view.onBeforeHide();
			//Ocultará elemento mediante animación configurada en animationout.
			//si queremos eliminar el componente
			view.hide(remove);
			if (remove) {
				delete this.views[id];
			};
			view.onAfterHide();
		}
	};

	View.prototype.hideAllChild = function(remove) {
		// body...
	};

	View.prototype.showChild = function(id) {
		// body...
	};

	View.prototype.showAllChild = function() {
		// body...
	};

	View.prototype.createView = function(name,data,options) {
		//Obtenemos la template.
		var template = this.templates && this.templates[name];
		//Comprobamos si hay una template con ese nombre.
		if(template){
			//Clonamos la template.
			var $template = template.clone(true).removeClass("template").data("id",name);
			//Creamos la vista a partir de la template.
			var view = create($template,data,options);
			//Notificamos que la vista fue creada.
			view.onCreate();
			//Guardamos la vista creada.
			this.views[view.getId()] = view;
			view.onBeforeShow();
			if(this.el.mixItUp && this.el.mixItUp('isLoaded')){
				if(options.position == "prepend")
					this.el.mixItUp('prepend',view.get());
				else if(options.position == "append")
					this.el.mixItUp('append',view.get());
				else
					console.log("Posición no conocida");
			}else{
				this.el.append(view.get());
				view.onAfterShow();
			}			            
		}
	};

	
	return {
		create:create
	};

})();


var TemplateManager = (function(_super,$,environment){

	__extends(TemplateManager, _super);

	var views = {};

	function TemplateManager(){}


	var hasActiveView = function(type,target){
		for(var view in views){
			var currentView = views[view];
			if (currentView.type == type && currentView.active && currentView.target == target )
				return currentView;
		}
	}

	var convertToRegion = function(target){
		var values = target.split(":");
		var activity = environment.getService("ACTIVITY_MANAGER").getCurrentActivity();
		return activity["templates"]["gui"]["regions"][values[1]];

	}

	var hideView = function(view,callback){

		typeof(view["handlers"]["onBeforeHide"]) == "function" && view["handlers"]["onBeforeHide"].call(view.component);
		//Aplicamos animación de salida.
		view.node
			.addClass(view["animations"]["animationOut"])
			.one("webkitAnimationEnd  animationend",function(){
                var $this = $(this);
                $this.removeClass(view["animations"]["animationOut"]).detach();
                typeof(view["handlers"]["onAfterHide"]) == "function" && view["handlers"]["onAfterHide"].call(view.component);
                typeof(callback) == "function" && callback();
            });

	}

	var showView = function(view,callback){
		//llamamos al beforeShow
		typeof(view["handlers"] && view["handlers"]["onBeforeShow"]) == "function" && view["handlers"]["onBeforeShow"].call(view.el);
		view.node
			.addClass(view["animations"]["animationIn"])
			.one("webkitAnimationEnd  animationend",function(){
                    var $this = $(this);
                    typeof(view["handlers"] && view["handlers"]["onAfterShow"]) == "function" && view["handlers"]["onAfterShow"].call(view.component);
                    $this.removeClass(view["animations"]["animationIn"]);
                    typeof(callback) == "function" && callback.call("Pedro");
            })
            .appendTo(view["target"] == "body" ? view["target"] : convertToRegion(view["target"]));

	}

	var viewLoad = function(view,callback){

		var activeView = hasActiveView(view.type,view.target);
		//Si hay una vista activa la ocultamos
		if(activeView){
			hideView(activeView,function(){
				showView(view,callback);
			})

		}else{
			showView(view,callback);
		}	
	}


	//Carga la template especificada.
	TemplateManager.prototype.loadTemplate = function(data) {
		//comprobamos si ha especificado el tipo de template.
		var deferred = $.Deferred();
		//Obtenemos la actividad actual.
		var activity = environment.getService("ACTIVITY_MANAGER").getCurrentActivity();
		//Esta es la data pasada.
		//Obtenemos el nombre totalmente cualificado de la template.
		var fqn = activity.name + ":" + data["name"];
		//Comprobamos si ya existe una vista para esta template.
		if(!views[fqn]){
			//comprobamos el tipo de template a cargar.
			var type = data["type"].toUpperCase();
			var path,animations,target;
			//obtenemos el path.
			switch(type){
				case "ACTIVITY_VIEWS":
					//Ruta de la interfaz de la actividad.
					path = environment.ACTIVITY_TEMPLATES_BASE_PATH + activity["templates"]["gui"]["file"];
					//Animaciones para la interfaz
					animations = activity["templates"]["gui"]["animations"];
					//Donde se ubicará la interfaz.
					target = "body";
					break;
				case "ACTIVITY_UPLOADPAGE_VIEWS":
					//Ruta de la interfaz de la actividad.
					path = environment.ACTIVITY_TEMPLATES_BASE_PATH + activity["templates"]["uploadPage"]["file"];
					//Animaciones para la interfaz
					animations = activity["templates"]["uploadPage"]["animations"];
					//Donde se ubicará la interfaz.
					target = "body";
					break;
				case "MODULE_VIEWS":
					var template = environment.getService("MANAGER_MODULE").getTemplateData(fqn);
					//var name = data["template"] ? data["template"] : Array.prototype.slice.call(Object.keys(templates),0,1);
					//Ruta de la interfaz de la actividad.
					path = environment.MODULES_TEMPLATES_BASE_PATH + template["file"];
					//Animaciones para la interfaz
					animations = template["animations"];
					//Donde se ubicará la interfaz.
					target = activity.name + ":" + template["region"];
					break;
			}
			//Cargamos el recurso.
			environment.loadResource({
				type:"html",
				src:path
			}).done(function(template){

				//cacheamos la template.
				var $template = $(template);
				$template.addClass("animateView");
				//creamos la vista 
		        var view = {
		        	component:View.create($template,animations,data["handlers"]),//estructura de vistas derivada de la template
		        	node:$template,//objeto jquery original
		        	type:type,//tipo de vista
		        	timestamp:new Date().getTime(),//timemstamp de creación
		        	handlers:data["handlers"],//manejadores del ciclo de vida
		        	animations:animations,//animaciones.
		        	target:target//Donde se ubicará la interfaz.
		        }

		        views[fqn] = view;
		        //llamamos al onCreate
		        typeof(data["handlers"] && data["handlers"]["onCreate"]) == "function" && data["handlers"]["onCreate"].call(view.component);
		        //la cargamos.
		        viewLoad(view,function(){
		        	view.active = true;
		        	deferred.resolve(view.component);
		        });

			}).fail(function(){
				console.log("Fallo al descargar template");
			});
		}

		return deferred.promise();
	}

	TemplateManager.prototype.getView = function(name) {
		//Obtenemos la actividad actual.
		var activity = environment.getService("ACTIVITY_MANAGER").getCurrentActivity();
		//fully qualified name
		var fqn = activity.name + ":" + name;
		//retornamos el componente.
		return views[fqn] && views[fqn].component;
	};


	return TemplateManager;


})(Component,jQuery,environment);