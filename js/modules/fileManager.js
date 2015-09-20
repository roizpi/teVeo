var FileManager = (function(_super,$,environment){

	__extends(FileManager, _super);

	function FileManager(){


		//Reporting the module events.
        this.events = {
            "FILE_SELECTED":[]
        }
	}


	var onCreateRequestFile = function(view){

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

	}

	//Manejador para el envío de archivos.
    //Común para archivos seleccionados tradicionalmente
    // o a través de una operación Drag and Drop.
    var handleFileSelect = function(e) {
            
        e.stopPropagation();
        e.preventDefault();
            
        var file = null;
        //Comprobamos el tipo del evento.
        if(e.type == "change"){
           	//usuario selecciona el archivo por el método tradicional.
            file = e.target.files[0];
       	}else if(e.type == "drop"){
            //paramos la animación
            $(this).removeClass("flash");
            //usuario selecciona el archivo arrastrándolo directamente.
            file = e.originalEvent.dataTransfer.files[0]; 
        }

    }

               
	FileManager.prototype.requestFile = function(mime) {
		templating.loadTemplate({
            name:"request_file",
            category:"OVERLAY_MODULE_VIEW",
            handlers:{
            	onCreate:onCreateRequestFile
            }
        });
	};

	return FileManager;

})(Component,jQuery,environment);