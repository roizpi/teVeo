var FileManager = (function(_super,$,environment){

	__extends(FileManager, _super);

    const DEFAULT_TITLE = "Eliga los archivos a adjuntar";

    var reader;

	function FileManager(){

        //crea instancias de un objeto FileReader.
        reader = new FileReader();
		//Reporting the module events.
        this.events = {
            "FILE_SELECTED":[]
        }
	}



    //Previsualiza el archivo seleccionado.
    var showPreviewFile = function(file){
        console.log("Fichero....");
        console.log(file);
        templating.loadTemplate({
            name:"file_preview",
            category:"OVERLAY_MODULE_VIEW",
            handlers:{
                onCreate:function(view){
                    console.log("onCreate triggered");
                    view.get().delegate("[data-action]","click",function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        var action = this.dataset.action.toUpperCase();
                        switch(action){
                            case 'CANCEL':
                                view.hide(true);
                                break;
                        }

                    });

                    reader.addEventListener("load",function(e) {
                        var data = e.target.result;
                        console.log("Este es el resultado ...");
                        console.log(data);
                        view.getView("preloader").hide(false);
                        view.getView("filePreviewContainer").createView("imagePreview",{
                            id:file.name,
                            img:data,
                            handlers:{
                                onCreate:function(view){
                                    console.log("Esta es la imagen ...");
                                    console.log(view);
                                    //view.setValue(data);
                                }
                            }
                        });
                    });
                },
                onBeforeShow:function(view){
                    console.log("Fichero a mostrar");
                    console.log(file);
                    var list = view.getView("infoFile");
                    list.setChildValue("fileName",file.name);
                    list.setChildValue("size",file.size);
                    list.setChildValue("type",file.type);

                    reader.readAsDataURL(file);
                },
                onAfterHide:function(view){
                    console.log("Ocultando vista");
                    console.log(view);
                    view.getView("filePreviewContainer").hideChild(file.name,true);
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
            console.log("Has soltado sobre el dropzone");
            var file = null;
            //Comprobamos el tipo del evento.
            if(e.type == "change"){
                //usuario selecciona el archivo por el método tradicional.
                file = e.target.files[0];
            }else if(e.type == "drop"){
                //paramos la animación
                //$(this).removeClass("flash");
                //usuario selecciona el archivo arrastrándolo directamente.
                file = e.originalEvent.dataTransfer.files[0]; 
            }
            //Previsualizamos el fichero.
            showPreviewFile(file);
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