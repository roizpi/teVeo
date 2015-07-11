var TemplateManager = (function($){

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
				uploadPage:"dashboard/uploadpage.html",
				errorPage:{}
			}
		}

	}

	function TemplateManager(){

		

	}


	TemplateManager.prototype.loadUploadPage = function(activity,callback) {
		var uploadpage = templates[activity] && templates[activity][uploadpage];
		if (uploadpage) {
			var path = this.environment.ACTIVITY_VIEWS_BASE_PATH + uploadpage;
			this.environment.loadResource("html",path).done(function(html){
				$(html).appendTo("body");
				typeof callback == "function" && callback();
			})
		};
	};

	return TemplateManager;


})(jQuery);