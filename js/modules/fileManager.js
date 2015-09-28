var FileManager = (function(_super,$,environment){

	__extends(FileManager, _super);

    const DEFAULT_TITLE = "Eliga los archivos a adjuntar";

    var reader,self,file_selected;

	function FileManager(){
        self = this;
        //crea instancias de un objeto FileReader.
        reader = new FileReader();
		//Reporting the module events.
        this.events = {
            "FILE_SELECTED":[]
        }
	}



    //Previsualiza el archivo seleccionado.
    var loadPreviewFile = function(){

        templating.loadTemplate({
            name:"file_preview",
            category:"OVERLAY_MODULE_VIEW",
            handlers:{
                onCreate:function(view){
                    view.get().delegate("[data-action]","click",function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        var action = this.dataset.action.toUpperCase();
                        switch(action){
                            case 'CANCEL':
                                view.hide(false);
                                break;
                            case 'SUCCESS':
                                var container = view.getView("filePreviewContainer");
                                var value = container.getView("imagePreview").getChildValue("img");
                                self.triggerEvent("FILE_SELECTED",{
                                    type:2,
                                    format:file_selected.type.split("/")[1],
                                    data:value
                                });
                                view.hide(false);
                                break;
                        }

                    });

                    reader.addEventListener("load",function(e) {
                        var data = e.target.result;
                        view.getView("preloader").hide(false);
                        view.getView("filePreviewContainer").createView("imagePreview",{
                            id:file_selected.id,
                            img:data
                        });
                    });
                },
                onBeforeShow:function(view){
                    var list = view.getView("infoFile");
                    list.setChildValue("fileName",file_selected.name);
                    list.setChildValue("size",file_selected.size);
                    list.setChildValue("type",file_selected.type);
                    //obtenemos la dataURL del fichero.
                    reader.readAsDataURL(file_selected);
                },
                onAfterHide:function(view){
                    view.getView("filePreviewContainer").removeChild(file_selected.id);
        
                }
            }
        });
    }


	var onCreateRequestFile = function(options){

        var view = this;
        view.setChildValue("title",options.title || DEFAULT_TITLE);

		view.get().delegate("[data-action]","click",function(e){
            e.preventDefault();
            e.stopPropagation();
            //recogemos la acción.
            var action = this.dataset.action.toUpperCase();
            switch(action){
                case 'CLOSE':
                    //Ocultamos la vista eliminándola.
                    view.hide(false);
                    break;
            }
        });

        var dropzone = view.getView("dropzone");

        dropzone.get().on('dragleave',function(e){
            console.log("Ha salido del dropzone");
        });
        
        dropzone.get().on('dragover', function(e){
            e.stopPropagation();
            e.preventDefault();
            e.originalEvent.dataTransfer.dropEffect = 'copy'
            console.log("Estás sobre el dropzone");
            // // Explicitly show this is a copy.
        });

        //Manejador para el envío de archivos.
        //Común para archivos seleccionados tradicionalmente
        // o a través de una operación Drag and Drop.
        dropzone.get().on("drop",function(e){
            e.stopPropagation();
            e.preventDefault();
            var file = null;
            //Comprobamos el tipo del evento.
            if(e.type == "change"){
                //usuario selecciona el archivo por el método tradicional.
                file = e.target.files[0];
            }else if(e.type == "drop"){
                //paramos la animación
                //usuario selecciona el archivo arrastrándolo directamente.
                file = e.originalEvent.dataTransfer.files[0]; 
            }
            file_selected = file;
            file_selected.id  = 1111;
            //Previsualizamos el fichero.
            loadPreviewFile();
        });



	}

	FileManager.prototype.requestFile = function(options) {
		templating.loadTemplate({
            name:"request_file",
            category:"OVERLAY_MODULE_VIEW",
            handlers:{
            	onCreate:function(view){
                    onCreateRequestFile.apply(view,[options]);
                }
            }
        });
	};

	return FileManager;

})(Component,jQuery,environment);