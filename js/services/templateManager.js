var Component = (function(){

	var el,type,name,components,templates,animations,handlers;

	function Component($element){
		var el = $element;
		//Obtenemos el tipo de componente.
		var type = $element.get(0).dataset.type || 'html';
		//Obtenemos nombre del componente.
		var name = $element.get(0).dataset.component;

		//las animaciones para los componentes se expresan en el marcado.
		//data-animationin
		//data-animationout
		//los handlers se configuran mediante la API.
		//mediante método setOnCreate
		var components = {};
		var templates = {};

		//Procesamos todos los componentes que contiene el elemento
		$element.find("[data-component]").each(function(idx,child){

			var $child = $(child);
			var $componentParent = $child.parents("[data-component]");
			if($componentParent.length && $componentParent.get(0).isEqualNode($element.get(0))){

				if ($child.is("[data-type='template']")) {
					//Obtenemos el nombre de la template.
					var name = child.dataset.component;
					//Guardamos la template.
					templates[name] = $child.removeAttr("data-type").remove();
				}else{
					//parseamos el componente de forma recursiva.
					var component = new Component($child);
					components[component.name] = component;
				}
			}
			
		});
		//Eliminamos el data-atributo.
		$element.removeAttr("data-component");
	
	}

	//Rellenar el componente con los datos especificados.
	var hydrate = function(data){
		
		var components = component._components;

		for(var componentName in components){
			//recogemos el valor.
			var value = data[componentName];
			//recogemos el tipo.
			var type = components[componentName].type &&  components[componentName].type.toUpperCase();
			//Si se ha encontrado valor.
			if (value && type) {

				switch(type){

					case 'IMG':
						components[componentName].el.attr("src",value);
						break;
					case 'TEXT':
						components[componentName].el.text(value);
						break;
					case 'HTML':
						components[componentName].el.html(value);
						break;
					case 'BACKGROUND':
						components[componentName].el.css("background-image","url("+value+")");
						break;
					case 'HIDDEN':
						components[componentName].el.data(componentName,value);
						break;
					case 'DATA':
						components[componentName].el.attr("data-"+componentName,value);
					default:
						console.log("Valor no conocido");
				}
					
			};
		}

		return component;
	}

	//Devuelve Objeto jQuery original.
	Component.prototype.get = function() {
		return this.el;
	};
	//Oculta y opcionalmente elimina un elemento.
	Component.prototype.hide = function(remove) {
		if(this.animations && this.animations.animationout){
			var animation = this.animations.animationout
			this.el.addClass(animation).one("webkitAnimationEnd animationend",function(){
				remove && $(this).remove();
			});
		}
	};
	//Comprueba si un elemento es visible.
	Component.prototype.isVisible = function() {
		return this.el.is(":visible");
	};

	Component.prototype.scrollToLast = function() {
		this.el.scrollTop(this.el.children(":last").offset().top);
	};

	Component.prototype.scrollAt = function(pos) {
		if (pos && !isNaN(parseInt(pos))) {
			this.el.scrollTop(pos);
		};
	};

	Component.prototype.detach = function() {
		this.el.detach();
	};

	Component.prototype.filter = function(patter) {
		
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


	Component.prototype.removeChild = function(id) {
		
		var component = this.components && this.components[id];
		if(component instanceof Component){
			//Eliminamos el Nodo DOM.
			component.el.remove();
			//Lo eliminamos del array de componentes.
			delete this.components[id];
		}
	};

	Component.prototype.hideChild = function(id,remove) {
		var component = this.components && this.components[id];
		if(component instanceof Component){
			var self = this;
			component.onBeforeHide();
			//Ocultará elemento mediante animación configurada en animationout.
			//si queremos eliminar el componente
			component.hide(remove);
			if (remove) {
				delete this.components[id];
			};
			component.onAfterHide();
		}
	};

	Component.prototype.hideAllChild = function(remove) {
		// body...
	};

	Component.prototype.showChild = function(id) {
		// body...
	};

	Component.prototype.showAllChild = function() {
		// body...
	};

	
	
	return Component;

})();


var TemplateManager = (function(_super,$,environment){

	__extends(TemplateManager, _super);

	var views = {};

	var componentPrototype = {

    	filter:function(pattern){

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

		},
		removeComponent:function(id){
			
			var component = this._components && this._components[id];
			if(component){
				component.el.remove();
				delete this._components[id];
			}
		},
		showComponent:function(id){
			var component = this._components && this._components[id];
			if(component){}
		},
		hideComponent:function(id,time,remove){
			
			var component = this._components && this._components[id];
			if(component){
				var self = this;
				component.el.fadeOut(time,function(){
					if (remove) self.removeComponent(id);
				});
			}
	
		},
		hideAllComponents:function(time,remove){
			for(var component in components) 
				hideComponent(component,time,remove);
		},
		get:function(){
			return this.el;
		},
		focus:function(){
			this.focus();
		},
		getComponent:function(name,recursively){
			if(!recursively)
				return this._components && this._components[name];
			else
				return this._searchComponent(name);
			
		},
		getComponentByClass:function(className){
			if (typeof className == "string") {

				for(var componentName in this._components){

					var component = this._components[componentName];
					if (component.el.hasClass(className)) {
						return component;
					};
				}
			};
		},
		applyClassToChildrens:function(classNames){
			for(var component in this._components){
				this._components[component].el.addClass(classNames);
			}
		},
		_searchComponent:function(name){

			var componentFinded = null;

			if(this._components && this._components.constructor.toString().match(/object/i)){
				var components = this._components;
				for(var componentName in components){
					if(componentName == name){
						componentFinded = components[componentName];
						break;
					}else if(components[componentName]._components){
						componentFinded = components[componentName]._searchComponent(name);
						if(componentFinded){
							break;
						}
					}
				}

			}

			return componentFinded;
			
		},
		isVisible:function(){
			return this.el.is(":visible");
		},
		scrollToLast:function(){
			this.el.scrollTop(this.el.children(":last").offset().top);
		},
		scrollAt:function(pos){
			this.el.scrollTop(pos);
		},
		detach:function(){
			this.el.detach();
		}
    }

    var componentWithTemplatePrototype = {

		createComponent:function(name,data,options){
			//Obtenemos la template.
			var template = this._templates && this._templates[name];
			//Comprobamos si hay una template con ese nombre.
			if(template){
				//Configuramos el nombre del componente.
				var name = options.componentName || (data && data.id) || Math.round(Math.random() * 100000 + 5000);
				//Clonamos la template.
				var $template = template.clone(true).removeClass("template").data("id",name);
				//Creamos el componente a partir de la template.
				var component = parseElement($template);
				//hidratamos el componente con los datos.
				if(data) 
					component = hydrate(component,data);

				this._components[name] = {
					component:component,
					animations:options.animations || null,
					handlers:options.handlers || null
				}

				if(this.el.mixItUp && this.el.mixItUp('isLoaded')){
					if(options.position == "prepend")
					    this.el.mixItUp('prepend',component.el);
					else if(options.position == "append")
					    this.el.mixItUp('append',component.el);
					else
					    console.log("Posición no conocida");
				}else{
					this.el.append(component.el);
				}
					            
			}
		
		}
						
														
	}

	function TemplateManager(){}

	//Parsea un elemento para crear un componente equivalente.
	var parseElement = function($element){
		
		//Obtenemos el tipo de componente.
		var type = $element.get(0).dataset.type || 'html';
		//Obtenemos nombre del componente.
		var name = $element.get(0).dataset.component;
		
		var components = {};
		var templates = {};
		//Procesamos todos los componentes que contiene el elemento
		$element.find("[data-component]").each(function(idx,child){

			var $child = $(child);
			var $componentParent = $child.parents("[data-component]");
			if($componentParent.length && $componentParent.get(0).isEqualNode($element.get(0))){

				if ($child.is("[data-type='template']")) {
					//Obtenemos el nombre de la template.
					var name = child.dataset.component;
					//Guardamos la template.
					templates[name] = $child.removeAttr("data-type").remove();
				}else{
					//parseamos el componente de forma recursiva.
					var component = parseElement($child);
					components[component.name] = component;

				}
			}
			
		});
		//Eliminamos el data-atributo.
		$element.removeAttr("data-component");
		//Obtenemos el prototipo del componente.
		var proto = templates ? $.extend(componentPrototype,componentWithTemplatePrototype) : componentPrototype;

		var component = {
			el:$element,
			type:type,
			name:name,
			_components:components ? components : [],
			_templates:templates ? templates : null
		};

		component.__proto__ = proto;

		return component;

	}

	

	

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
		console.log("Target :"+view["target"]);
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
		        	component:new Component($template),//estructura de componentes derivada de la template
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