var TemplateManager = (function(_super,$,environment){

	__extends(TemplateManager, _super);

	var templates = {

		DASHBOARD:{
			//Interfaz Principal
			main:{
				file:"dashboard/dashboard.html",
				regions:{
					panelMenu:{

						Contacts:{
							contacts:{
					        	fileName:"contacts.html",
					        	animationIn:"bounceInLeft",
					            animationOut:"bounceOutRight",
					            handlers:{
					                onCreate:false,
					                onBeforeShow:false,
					                onAfterShow:false,
					                onBeforeHide:false,
					                onAfterHide:false
					            }
					       	}
					    }
					},
					panelAction:{
						//Interfaz para módulo Notificator.
						Notificator:{
				        	//cada una de las templates de este módulo.
				            notifications:{
				                fileName:"notifications.html",
				                animationIn:"zoomInUp",
				                animationOut:"zoomOutDown",
				                handlers:{
				                	onCreate:false,
				                	onBeforeShow:false,
				                	onAfterShow:false,
				                	onBeforeHide:false,
				                	onAfterHide:false
				                }
				            }
				        },
				        Searchs:{
				        	searchUsers:{
				        		fileName:"searchUsers.html",
				        		animationIn:"fadeInLeft",
				                animationOut:"fadeOutRight",
				                handlers:{
				                	onCreate:false,
				                	onBeforeShow:false,
				                	onAfterShow:false,
				                	onBeforeHide:false,
				                	onAfterHide:false
				                }
				        	}
				        },
				        ApplicationsManager:{
				        	applications:{
				        		fileName:"applications.html",
				        		animationIn:"zoomInUp",
				                animationOut:"zoomOutDown",
				                handlers:{
				                	onCreate:false,
				                	onBeforeShow:false,
				                	onAfterShow:false,
				                	onBeforeHide:false,
				                	onAfterHide:false
				                }
				        	}
				        },
				        Contacts:{
				        	contactDetail:{
				        		fileName:"contactDetail.html",
				        		animationIn:"zoomInUp",
				                animationOut:"zoomOutDown",
				                handlers:{
				                	onCreate:false,
				                	onBeforeShow:false,
				                	onAfterShow:false,
				                	onBeforeHide:false,
				                	onAfterHide:false
				                }
				        	}
				        }
					}
				},
				animationIn:"",
				animationOut:"",
			},
			uploadPage:"dashboard/uploadpage.html",
			errorPage:{}
		}

	}

	function TemplateManager(){

		

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


	TemplateManager.prototype.loadUploadPage = function(activity,callback) {
		var uploadpage = templates[activity] && templates[activity]["uploadPage"];
		if (uploadpage) {
			var path = environment.ACTIVITY_VIEWS_BASE_PATH + uploadpage;
			environment.loadResource({
				type:"html",
				src:path
			}).done(function(uploadpage){
				$uploadpage = $(uploadpage);
				$uploadpage.find("[data-title]").addClass("fadeInDown").on("webkitAnimationEnd  animationend",function(e){
		            $("<img>",{
		                src:"resources/img/mainLoader.gif",
		                alt:""
		            }).insertAfter(this);
					typeof callback == "function" && callback();
				}).end().appendTo("body");
			});
				
		};
	};

	return TemplateManager;


})(Component,jQuery,environment);