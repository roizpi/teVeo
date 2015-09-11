var View = (function(_super,$,environment){


	function View(el,id,type,category,name,animations,handlers,target,direction){

		this.el = el;
		this.id = id;
		this.type = type;
		this.category = category;
		this.name = name;
		this.animations = animations;
		this.handlers = handlers;
		this.target = target;
		this.direction = direction;
		this.views = {};
		this.templates={};
		this.timestamp = new Date().getTime();

	}

	var convertToRegion = function(target){
		var values = target.split(":");
		var activity = environment.getService("ACTIVITY_MANAGER").getCurrentActivity();
		return activity["templates"]["gui"]["regions"][values[1]];
	}
	
	var create = function($element,data,options) {
		//Obtenemos el id de la vista.
		var id = (data && data.id) || Math.round(Math.random() * 100000 + 5000);
		//Obtenemos el tipo de componente.
		var type = $element.get(0).dataset.type || 'html';
		//Obtenemos nombre de la vista.
		var name = (data && data.name) || $element.get(0).dataset.view;
		//Obtenemos la categoría de la vista.
		var category = (data && data.category) || "";
		//Obtenemos las animaciones de la vista.
		var animations = {};
		//Animación de entrada.
		animations.animationIn = $element.get(0).dataset.animationin ||(options.animations && options.animations.animationIn) || "" ;
		animations.animationOut = $element.get(0).dataset.animationout ||(options.animations && options.animations.animationOut) || "" ;
		//Obtenemos los manejadores del ciclo de vida de la vista.
		var handlers = options && (options.handlers || {});
		//Obtenemos el target (lugar donde se insertará la vista).
		var target = $element.get(0).dataset.target || options.target || "body";
		var direction = options.direction;
		$element.data("id",id);
		var view = new View($element,id,type,category,name,animations,handlers,target,direction);
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
					var subView = create($child,{},{
						target:view.el
					});
					view.views[subView.getId()] = subView;
				}
			}
			
		});

		//Eliminamos las meta-información del elementos
		view.get().removeAttr("data-view").removeAttr("data-type");

		//hidratamos la vista con los datos especificados.
		view._hydrate(data);

		//Notificamos que la vista fue creada.
		view.onCreate();

		view.show(true);

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
							view.el.data(view.name,value);
							break;
						case 'DATA':
							view.el.attr("data-"+view.name,value);
							break;
						case "CLASS":
							view.el.addClass(value);
							break;
						case 'TOGGLE':
							if(value == 'off') view.remove();
							break;
						default:
							console.log("Valor no conocido");
					}
						
				};

				view._hydrate(data);
			}

		}

	}

	View.prototype.onCreate = function() {
		this.handlers && typeof(this.handlers.onCreate) === "function" && this.handlers.onCreate(this);
	};

	View.prototype.onBeforeShow = function() {
		this.handlers && typeof(this.handlers.onBeforeShow) == "function" && this.handlers.onBeforeShow(this);
	};

	View.prototype.onAfterFirstShow = function() {
		this.handlers && typeof(this.handlers.onAfterFirstShow) == "function" && this.handlers.onAfterFirstShow(this);
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

	View.prototype.getNativeNode = function() {
		return this.el.get(0);
	};

	View.prototype.getName = function() {
		return this.name;
	};

	View.prototype.getHeight = function() {
		return this.el.height();
	};

	View.prototype.getId = function() {
		return this.id;
	};

	View.prototype.getViews = function() {
		return this.views;
	};

	View.prototype.getViewIds = function() {
		return Object.keys(this.views);
	};

	View.prototype.size = function() {
		return Object.keys(this.views).length;
	};
	//Oculta y opcionalmente elimina un elemento.
	View.prototype.hide = function(remove,callback) {
		var deferred = $.Deferred();
		var self = this;
		this.onBeforeHide();
		if(this.animations && this.animations.animationOut){
			var animation = this.animations.animationOut;
			this.el.addClass(animation).one("webkitAnimationEnd animationend",function(){
				var $this = $(this);
				$this.removeClass(animation);
				remove ? $this.remove() : $this.detach();
				deferred.resolve();
				self.onAfterHide();
			});
		}
		return deferred.promise();
		
	};
	
	View.prototype.show = function(first,callback) {
		var self = this;
		if (!this.isVisible()) {
			this.onBeforeShow();
			if(this.animations && this.animations.animationIn){
				var animation = this.animations.animationIn;
				var target;
				if (this.category && this.category == "MODULE_VIEWS") {
					target = convertToRegion(this.target);
				}else{
					target = this.target;
				}

				//Aplicamos Animación de Entrada.
				this.el.addClass(animation).one("webkitAnimationEnd animationend",function(){
					$(this).removeClass(animation);
					typeof(callback) == "function" && callback();
					first == true && self.onAfterFirstShow();
					self.onAfterShow();
				})[self.direction == "ASC" ? "prependTo" : "appendTo"](target);
				
			}	
			
		};
		
	};
	//Comprueba si la vista es visible.
	View.prototype.isVisible = function() {
		return this.el.is(":visible");
	};
	//Comprueba si tiene algún descendiente.
	View.prototype.isEmpty = function() {
		return $.isEmptyObject(this.views);
	};
	//Comprueba si esta vista tiene el valor especificado.
	View.prototype.hasContent = function(value) {
		var result = false;
		switch(this.type.toUpperCase()){
			case 'CLASS':
				result = this.el.hasClass(value);
				break;
		}
		return result;
	};
	//Coloca el scroll la vista al final.
	View.prototype.scrollToLast = function() {
		var pos = this.el.children().height();
		this.el.scrollTop(pos);
	};

	View.prototype.scrollAt = function(pos) {
		if (pos && !isNaN(parseInt(pos))) {
			this.el.scrollTop(pos);
		};
	};

	View.prototype.scrollToTop = function() {
		this.scrollAt(0);
	};

	View.prototype.scrollAtChild = function(id) {
		var child = this.getView(id);
		var pos = child.el.position().top;
		this.scrollAt(pos);
		return child;
	};

	View.prototype.detach = function() {
		this.el.detach();
	};

	View.prototype.remove = function() {
		this.el.remove();
	};

	View.prototype.match = function(pattern) {
		var text = this.el.find("[data-mark]").html().replace(/<mark>|<\/mark>/ig,"");
		if(text.search(pattern) == -1){
			return false;
		}else{
			//El texto encaja con el patrón, señalamos en que parte.
			//Con $1 hacemos referencia a la captura anterior.
			this.el.find("[data-mark]").html(text.replace(pattern,"<mark>$1</mark>"));
			return true;
		}
	};

	View.prototype.addClass = function(classNames) {
		this.el.addClass(classNames);
		return this;
	};

	View.prototype.filterChild = function(pattern) {
		
		var pattern = new RegExp("("+pattern+")","i");
		$.each(this.views,function(key,view){
			if(view.match(pattern)){
				this.show();
			}else{
				this.hide(false);
			}
			
		});
	};

	View.prototype.findChildsByClass = function(className) {
		var result = [];
		for(var view in this.views){
			var view = this.views[view];
			if (view.get().hasClass(className)) {
				result.push(view);
			}
		}
		return result;
	};

	View.prototype.findChildsWhere = function(viewName,value) {
		var result = [];
		if (viewName && value) {
			for(var view in this.views){
				var view = this.views[view];
				if (view.getView(viewName).hasContent(value)) {
					result.push(view);
				}
			}
		};
		return result;
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
		
		var view = this.views && this.views[id];
		if(view instanceof View){
			//Eliminamos el Nodo DOM.
			view.get().remove();
			//Lo eliminamos del array de vistas.
			delete this.views[id];
		}
	};

	View.prototype.removeNthChilds = function(n) {
		if (n && !isNaN(parseInt(n))) {
			var self = this;
			Object.keys(this.views).slice(0,n).forEach(function(view){
				self.removeChild(view);
			});
		};
	};

	View.prototype.hideChild = function(id,remove,callback) {
		var view = this.views && this.views[id];
		if(view){
			view.hide(remove).done(callback);
			if (remove) {
				delete this.views[id];
			};
		}
	};

	View.prototype.hideAllChild = function(remove) {
		var promises = [];
		for(var view in this.views){
			var currentView = this.views[view];
			if (currentView.isVisible()){
				promises.push(currentView.hide(remove));
			}
			
		};

		//Sincronizamos todas las promises.
        return $.when.apply($, promises);

	};

	View.prototype.hideChildsByFilter = function(remove,filter) {
		if (this.views) {
			if (typeof(filter) == "function") {
				for(var view in this.views){
					filter(this.views[view]) && this.hideChild(view,remove);
				}
			};
		};
	};

	View.prototype.showChild = function(id,callbackSuccess,callbackFailed) {
		var view = this.views && this.views[id];
		if(view){
			view.show(callbackSuccess);
		}else{
			typeof(callbackFailed) == "function" && callbackFailed();
		}
	};

	View.prototype.showAllChild = function() {
		
	};

	View.prototype.updateChilds = function(data) {
		if (data && data.length) {
			for (var i = 0; i < data.length; i++) {
				for(var key in data[i]){
					this.setChildValue(key,data[i][key]);
				}
			};
			
		};
	};

	View.prototype.dispatch = function(event) {
		this.el.trigger(event);
	};
	

	View.prototype.setChildValue = function(id,value) {
		if (id && value) {
			var view = this.getView(id);
			//recogemos el tipo.
			var type = view.type &&  view.type.toUpperCase();
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
					break;
				case 'TOGGLE':
					value === 'on' ? view.el.show() : view.el.hide();
					break;
					default:
				console.log("Valor no conocido");
			}
		};
	};

	View.prototype.hasView = function(id) {
		return this.views[id] ? true : false;
	};


	View.prototype.createView = function(name,data,options) {
		//Obtenemos la template.
		var template = this.templates && this.templates[name];
		//Comprobamos si hay una template con ese nombre.
		if(template){
			data = data || {};
			options = options || {};
			var optionsDefault = {target:this.el};
			options = $.extend(options,optionsDefault);
			//Clonamos la template.
			var $template = template.clone(true).removeClass("template").data("id",name);
			//Creamos la vista a partir de la template.
			var view = create($template,data,options);
			//Guardamos la vista creada.
			this.views[view.getId()] = view;
			/*view.onBeforeShow();
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
			}*/			            
		}
	};

	
	return {
		create:create
	};

})(Component,jQuery,environment);


var TemplateManager = (function(_super,$,environment){

	__extends(TemplateManager, _super);

	var views = {};

	function TemplateManager(){}


	var getCurrentActiveView = function(category,target){
		for(var view in views){
			var currentView = views[view];
			if (currentView.category == category && currentView.isVisible() && currentView.target == target )
				return currentView;
		}
	}

	var createView = function(template,data,options,callback){

		var currentActiveView = getCurrentActiveView(data.category,options.target);
		if(currentActiveView){
			currentActiveView.hide(false).done(function(){
				//creamos la vista
				var view = View.create(template,data,options);
				typeof(callback) == "function" && callback(view);
			});
		}else{
			//creamos la vista
			var view = View.create(template,data,options);
			typeof(callback) == "function" && callback(view);
		}

	}

	var showView = function(view,callback){
		//la vista ya se creó
		var currentActiveView = getCurrentActiveView(view.category,view.target);
		console.log("ESTA es la vista actual");
		console.log(currentActiveView);
		if(currentActiveView){
			currentActiveView.hide(false).done(function(){
				//mostramos la vista
				view.show(false);
				typeof(callback) == "function" && callback(view);
			});
		}else{
			view.show(false);
			typeof(callback) == "function" && callback(view);
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
			var category = data["category"].toUpperCase();
			var handlers = data["handlers"];
			var path,animations,target;
			//obtenemos el path.
			switch(category){
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
				var data = {
					name:fqn,
					category:category
				};
				var options = {
					handlers:handlers,//manejadores del ciclo de vida
					animations:animations,//animaciones.
					target:target//Donde se ubicará la interfaz.
				}

				createView($template,data,options,function(view){
					views[fqn] = view;
					deferred.resolve(view);

				});
				
			}).fail(function(){
				console.log("Fallo al descargar template");
			});

		}else{
			var view = views[fqn];

			if(!view.isVisible()){
				//mostramos la vista.
				showView(view,function(){
					deferred.resolve(view);
				});
			}else{
				deferred.resolve(view);
			}
			
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