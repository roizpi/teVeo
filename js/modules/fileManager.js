var FileManager = (function(_super,$,environment){

	__extends(FileManager, _super);

    const DEFAULT_TITLE = "Eliga los archivos a adjuntar";

    var self,file_selected,utils;

	function FileManager(){
        self = this;
        utils = environment.getService("UTILS");
		//Reporting the module events.
        this.events = {
            "FILE_SELECTED":[]
        }
	}

    var readFile = function(file){

        var deferred = $.Deferred();
        //crea instancias de un objeto FileReader.
        reader = new FileReader();

        const CHUNK_SIZE = 51200;
        var start = 0;
        var stop = file.size - 1;
        var chunks = Math.ceil(file.size/CHUNK_SIZE);
        var currentChunk = 1;
        var data = "";
        var fetch = function(){
            if (start<=file.size){
                //Extraemos un trozo del archivo (51200 bytes)
                //En lugar de leer el archivo completo creamos un blob con 
                //el método slice().
                // (Un Blob es un objeto que representa datos "en crudo". Fue creado con 
                // el propósito de superar las limitaciones de javaScript para trabajar con datos binarios)
                var blob = file.slice(start, start + CHUNK_SIZE);
                //Lo cargamos en memoria
                reader.readAsBinaryString(blob);
                start += CHUNK_SIZE;
            }
        }

        //Se dispara cuando se ha completado la solicitud.
        reader.addEventListener("loadend",function(e) {
            //Es necesario comprobar el estado
            if (e.target.readyState == FileReader.DONE) { // DONE == 2
                utils.binaryStringToBlob(data,file.type).then(function(blob){
                    deferred.resolve(blob);
                });
            }
        });

        //Cuando finaliza la carga, se activa el evento onload del lector y 
        //se puede utilizar su atributo result para acceder a los datos del archivo.
        reader.addEventListener("load",function(e) {
            
            var chunk = e.target.result;
            data += chunk;
            currentChunk++;
            fetch(); //Continuamos leyendo
        });

        fetch();

        return deferred.promise();
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
                                var data = view.getView("filePreviewContainer").getChildValue("src");
                                var mime = file_selected.type.split("/");
                                self.triggerEvent("FILE_SELECTED",{
                                    type:mime[0],
                                    format:mime[1],
                                    data:data
                                });
                                view.hide(false);
                                break;
                        }

                    });

                },
                onBeforeShow:function(view){
                    var list = view.getView("infoFile");
                    list.setChildValue("fileName",file_selected.name);
                    list.setChildValue("size",file_selected.size);
                    list.setChildValue("type",file_selected.type);
                    //obtenemos la dataURL del fichero.
                    console.log("Este es el fihero");
                    console.log(file_selected);

                    readFile(file_selected).done(function(blob){
                        view.getView("preloader").hide(false);
                        var type = blob.type.split("/")[0];
                        var view_name = type+"Preview";
                        //Creamos la vista que previsualiza el fichero.
                        view.getView("filePreviewContainer").createView(view_name,{
                            id:file_selected.id,
                            src:blob
                        });
                    });
                    
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
            file_selected.id  = (Math.random() * 2000) + 1;
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