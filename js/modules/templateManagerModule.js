var TemplateManager = (function(_super,$){

	__extends(TemplateManager, _super);



	var panels = [];
	var $loader;
	var templatesPath = "resources/templates/";
    var templates = {
    	//cada uno de los módulos
        "Notificator":{
        	//cada una de las templates de este módulo.
            "notifications":{
                "fileName":"notifications.html",
                "animationIn":"zoomInUp",
                "animationOut":"zoomOutDown",
                "handlers":{
                	"onCreate":false,
                	"onBeforeShow":false,
                	"onAfterShow":false,
                	"onBeforeHide":false,
                	"onAfterHide":false
                },
                "target":"panelAction"
            }
        },
        "Preferences":{
        	"preferences":{
        		"fileName":"preferences.html",
                "animationIn":"fadeInLeft",
                "animationOut":"fadeOutRight",
                "handlers":{
                	"onCreate":false,
                	"onBeforeShow":false,
                	"onAfterShow":false,
                	"onBeforeHide":false,
                	"onAfterHide":false

                },
                "target":"panelAction"
        	}
        },
        "Searchs":{
        	"searchUsers":{
        		"fileName":"searchUsers.html",
        		"animationIn":"fadeInLeft",
                "animationOut":"fadeOutRight",
                "handlers":{
                	"onCreate":false,
                	"onBeforeShow":false,
                	"onAfterShow":false,
                	"onBeforeHide":false,
                	"onAfterHide":false
                },
                "target":"panelAction"
        	}
        },
        "ApplicationsManager":{
        	"applications":{
        		"fileName":"applications.html",
        		"animationIn":"zoomInUp",
                "animationOut":"zoomOutDown",
                "handlers":{
                	"onCreate":false,
                	"onBeforeShow":false,
                	"onAfterShow":false,
                	"onBeforeHide":false,
                	"onAfterHide":false
                },
                "target":"panelAction"
        	}

        },
        "Contacts":{
        	"contacts":{
        		"fileName":"contacts.html",
        		"animationIn":"bounceInLeft",
                "animationOut":"bounceOutRight",
                "handlers":{
                	"onCreate":false,
                	"onBeforeShow":false,
                	"onAfterShow":false,
                	"onBeforeHide":false,
                	"onAfterHide":false
                },
                "target":"panelMenu"
        	},
        	"contactDetail":{
        		"fileName":"contactDetail.html",
        		"animationIn":"zoomInUp",
                "animationOut":"zoomOutDown",
                "handlers":{
                	"onCreate":false,
                	"onBeforeShow":false,
                	"onAfterShow":false,
                	"onBeforeHide":false,
                	"onAfterHide":false
                },
                "target":"panelAction"
        	}
        },
        "Caller":{
        	"videoCallingPanel":{
        		"fileName":"videoCallingPanel.html",
        		"animationIn":"zoomInUp",
                "animationOut":"zoomOutDown",
                "handlers":{
                	"onCreate":false,
                	"onBeforeShow":false,
                	"onAfterShow":false,
                	"onBeforeHide":false,
                	"onAfterHide":false
                },
                "target":"panelAction"
        	},
        	"callPanel":{
        		"fileName":"callPanel.html",
        		"animationIn":"zoomInUp",
                "animationOut":"zoomOutDown",
                "handlers":{
                	"onCreate":false,
                	"onBeforeShow":false,
                	"onAfterShow":false,
                	"onBeforeHide":false,
                	"onAfterHide":false
                },
                "target":"panelAction"
        	},
        	"callAlertPanel":{
        		"fileName":"callAlertPanel.html",
        		"animationIn":"zoomInUp",
                "animationOut":"zoomOutDown",
                "handlers":{
                	"onCreate":false,
                	"onBeforeShow":false,
                	"onAfterShow":false,
                	"onBeforeHide":false,
                	"onAfterHide":false
                },
                "target":"body"
        	},
        	"calls":{
        		"fileName":"calls.html",
        		"animationIn":"zoomInUp",
                "animationOut":"zoomOutDown",
                "handlers":{
                	"onCreate":false,
                	"onBeforeShow":false,
                	"onAfterShow":false,
                	"onBeforeHide":false,
                	"onAfterHide":false
                },
                "target":"panelMenu"
        	},
        	"resumeCall":{
        		"fileName":"resumeCall.html",
        		"animationIn":"zoomInUp",
                "animationOut":"zoomOutDown",
                "handlers":{
                	"onCreate":false,
                	"onBeforeShow":false,
                	"onAfterShow":false,
                	"onBeforeHide":false,
                	"onAfterHide":false
                },
                "target":"panelAction"
        	}
        }

    }

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

		createComponent:function(templateName,data,options){

			var template = this._templates && this._templates[templateName];
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

				this._components[name] = component;

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

				options && options.animate && component.el.addClass(options.animate);

				typeof(options.onCreate) == "function" && options.onCreate(component);
					            
			}
		
		}
						
														
	}

    var defaultAnimation = "zoomInUp";

	function TemplateManager(){

		$loader = $("<img>",{
			src:"resources/img/mainLoader.gif",
			class:"gifLoader"
		});
		panels["panelAction"] = $("#viewPanelAction");
		panels["panelMenu"]  = $("#viewPanelMenu");
	}


	var hydrate = function(component,data){
		
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
					default:
						console.log("Valor no conocido");
				}
					
			};
		}

		return component;
	}

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

	var hideTemplate = function(template,callback){

		typeof(template["handlers"]["onBeforeHide"]) == "function" && template["handlers"]["onBeforeHide"].call(template["view"]);
		//Aplicamos animación de salida.
		template["view"].el
			.addClass(template["animationOut"])
			.one("webkitAnimationEnd  animationend",function(){
                var $this = $(this);
                $this.removeClass(template["animationOut"]).detach();
                typeof(template["handlers"]["onAfterHide"]) == "function" && template["handlers"]["onAfterHide"].call(template["view"]);
                typeof(callback) == "function" && callback();
            });

	}

	var showTemplate = function($panel,template,callback){

		if(template["view"]){
			typeof(template["handlers"]["onBeforeShow"]) == "function" && template["handlers"]["onBeforeShow"].call(template["view"]);
			template["view"].el
				.addClass(template["animationIn"])
				.one("webkitAnimationEnd  animationend",function(){
                    var $this = $(this);
                     typeof(template["handlers"]["onAfterShow"]) == "function" && template["handlers"]["onAfterShow"].call(template["view"]);
                    $this.removeClass(template["animationIn"]);
                    $panel.data("active",template);
                    typeof(callback) == "function" && callback.call(template["view"]);
                })
                .appendTo($panel);
		}else{
			//Añadimos loader al contenedor
			$panel.append($loader);
			//Descargamos html de la template.
			$.get(templatesPath+template["fileName"],function(html){
				var $template = $(html);
				$template.addClass("animateView");
				//creamos la vista (estructura de componentes derivada de la template)
		        template["view"] = parseElement($template);
		 		//la guardamos como la actual.
		        $panel.data("active",template);
		        //llamamos al onCreate
		        typeof(template["handlers"]["onCreate"]) == "function" && template["handlers"]["onCreate"].call(template["view"]);
				setTimeout(function(){
					//Añadimos la vista al DOM.
					$panel.empty().append($template);
					typeof(template["handlers"]["onBeforeShow"]) == "function" && template["handlers"]["onBeforeShow"].call(template["view"]);
					//Aplicamos animación a la template.
			        $template.addClass(template["animationIn"]).one("webkitAnimationEnd  animationend",function(){
			            $(this).removeClass(template["animationIn"]);
			            typeof(template["handlers"]["onAfterShow"]) == "function" && template["handlers"]["onAfterShow"].call(template["view"]);
			            typeof(callback) == "function" && callback.call(template["view"]);
			        });
				},5000)
				
			});
		}

	}

	//Carga la template especificada.
	TemplateManager.prototype.loadTemplate = function(data,callback) {

		if (templates[data.moduleName] && templates[data.moduleName][data.templateName]) {
			var template = templates[data.moduleName][data.templateName];
			if(panels[template["target"]]){
				var $panel = panels[template["target"]];
				if($panel.data("active")){
					hideTemplate($panel.data("active"),function(){
						showTemplate($panel,template,callback);
					});

				}else{
					showTemplate($panel,template,callback);
				}

			}else{
				throw new Error("Target no encontrado");
			}
		
        }else{
            throw new Error("Template " + data.templateName + " del modulo "+ data.moduleName +" no encontrada");
        }
		
	};

	TemplateManager.prototype.implementHandler = function(data,callback) {
		
		if (templates[data.moduleName] && templates[data.moduleName][data.templateName] && templates[data.moduleName][data.templateName]["handlers"]) {
          	if(typeof(callback) == "function")
            	templates[data.moduleName][data.templateName]["handlers"][data.handler] = callback;
            else
            	throw new Error("callback debe ser una función");
        }else{
            throw new Error("Template " + data.templateName + " del modulo "+ data.moduleName +" no encontrada");
        }
	};

	TemplateManager.prototype.getView = function(data) {
		return templates[data.moduleName] && templates[data.moduleName][data.templateName] && templates[data.moduleName][data.templateName]["view"];
	};

	return TemplateManager;

})(BaseModule,jQuery);