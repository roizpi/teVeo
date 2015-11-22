var MediaStream = (function(_super,$,environment){

	__extends(MediaStream, _super);

    navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    var self;
    //Mapa de Filtros aplicables a la imagen
    var filters = {
        vintage:function(canvas){
            return canvas.vintage();
        },
        pop:function(canvas){
            return canvas.saturation(20).gamma(1.4).vintage().contrast(5).exposure(15).vignette(300, 60);
        },
        espectro:function(canvas){
            return canvas.invert().hue(90);
        },
        nostalgia:function(canvas){
            return canvas.nostalgia();
        },
        sinCity:function(canvas){
            return canvas.sinCity();
        },
        lomo:function(canvas){
            return canvas.lomo();
        },
        love:function(canvas){
            return canvas.love();
        },
        sepia:function(canvas){
            return canvas.sepia();
        }
    };

    const RECORD_VIDEO = "RECORD_VIDEO";
    const RECORD_AUDIO = "RECORD_AUDIO";


    function MediaStream(){
        self = this;
        this.caman = null;
        this.localMediaStream = null;
        this.utils = environment.getService("UTILS");

        //Reporting the module events.
        this.events = {
            "CANCEL_STREAM":[],
            "PHOTO_MAKED":[],
            "RECORD_SUCCESS":[]
        }
    }

    var Recorder = (function(_super){

        __extends(Recorder, _super);

        //Duración Máxima Permitida
        const RECORD_MAX_DURATION = 1200000;
        

        function Recorder(mediaElement,recordType){
            this.mediaElement = mediaElement;
            this.recordType = recordType;
            this.recordRTC = null;

        }

        Recorder.prototype._configMediaDevices = function(){
            var mediaConstraints = this.recordType == RECORD_VIDEO ? {video:true,audio:true} : {video:false,audio:true};
            var that = this;
            return navigator.mediaDevices.getUserMedia(mediaConstraints).then(function(stream){
                self.localMediaStream = stream;
                if (that.mediaElement) {
                    //URL.createObjectURL(localMediaStream)
                    that.mediaElement.setValue(URL.createObjectURL(stream));
                    //reproducimos video.
                    that.mediaElement.getNativeNode().play();
                };

                return Promise.resolve({
                    type: that.recordType == RECORD_VIDEO ? "video" : "audio",
                    format: that.recordType == RECORD_VIDEO ? 'webm' : 'ogg',
                    mimeType: that.recordType == RECORD_VIDEO ? 'video/webm' : 'audio/ogg',
                    localMediaStream:stream
                });
            }).catch(function(error){
                console.log("Error");
                console.log(error);
            })
        }

        Recorder.prototype.stopRecording = function(callback){
            console.log("No graba naaaa");
            this.mediaElement.getNativeNode().pause();
            URL.revokeObjectURL(this.mediaElement.getNativeNode());
            this.mediaElement.setValue("");
            //Obtenemos blob de la grabación
            var recordedBlob = this.recordRTC.getBlob();
            //Cancelamos stream
            self.cancelStreaming();
            //Notificamos evento pasando grabación.
            typeof(callback) == "function" && callback({
                type:config.type,
                format:config.format,
                data:recordedBlob
            });
            
        }

        Recorder.prototype.resumeRecording = function() {
            this.recordRTC.resumeRecording();
            this.mediaElement.getNativeNode().pause();
        };

        Recorder.prototype.startRecording = function(){
            var that = this;
            this._configMediaDevices().then(function(config){
                //Instanciamos el Recorder.
                that.recordRTC = RecordRTC(config.localMediaStream, {
                    type: config.type,
                    mimeType:config.mimeType, // or video/mp4 or audio/ogg
                });

                // auto stop recording after RECORD_MAX_DURATION seconds
                recordRTC.setRecordingDuration(RECORD_MAX_DURATION).onRecordingStopped(that.stopRecording);

                recordRTC.startRecording();
            });
        }

        return Recorder;

    })(_super);

    

    //Manejador para el evento ONCreate sobre la vista RecordVideoView.
    var onCreateRecordView = function(view,recordType){

        var recorder = null;
        //Configuramos el boton cerrar
        view.getView("close").get().on("click",function(e){
            e.preventDefault();
            view.hide(false);
            //Cancelamos stream
            self.cancelStreaming();
        });
        //Obtenemos contendor de acciones.
        var recordActions = view.getView("recordActions");
        //Delegamos en él todas las acciones.
        recordActions.get().delegate("[data-action]","click",function(){
            var $this = $(this);
            if (!$this.hasClass("btn-disabled")) {
                var action = this.dataset.action.toUpperCase();
                switch(action){
                    case 'PAUSE':
                    case 'RECORD':

                        if(action == 'PAUSE'){
                            recorder && recorder.pauseRecording();
                        }else{

                            if(!recorder){
                                var mediaElement =  view.getView('stream');
                                recorder = new Recorder(mediaElement,recordType);
                                recorder.startRecording();
                            }else{
                                recorder.resumeRecording();
                            }
                        }

                        //deshabilitamos esta opcion y habilitamos las otras opciones.
                        $this.addClass("btn-disabled").siblings().removeClass("btn-disabled");
                        break;
                    case 'FINISH':
   
                        //Finalizamos la grabación.
                        recorder && recorder.stopRecording(function(result){
                            self.triggerEvent("RECORD_SUCCESS",result);
                            //Ocultamos vista.
                            view.hide(false);
                        });
                        recorder = null;
                        $this.prev().prev().add($this).addClass("btn-disabled");
                        break;   
                }

                
            };
            
        });
    }

    var onAfterShowRecordVideoView = function(view){
        //Activamos Cuadro de Ayuda.
        view.getView("help").get().addClass("active");
        //var mediaConstraints = {video:true,audio:true};
        

            /*var recorder = new RecordRTC(view.get(), {
                type: 'canvas'
            });
            recorder.startRecording();
            setTimeout(function(){
                console.log("Finalizando Grabacion");
                recorder.stopRecording(function(blob) {
                    self.cancelStreaming();
                    console.log(blob);
                    video.src = URL.createObjectURL(blob);
                    
                })
            },10000);*/
        //});

        
        
        /*recordRTC.stopRecording(function(videoURL) {
            video.src = videoURL;

            
            recordRTC.getDataURL(function(dataURL) { });
        });*/
    }

    var onCreateMakePhotoView = function(view){

        var photos = view.getView("photos");

        photos.get().delegate(".photo","click",function(e){
            e.stopPropagation();
            $(this).addClass("active").siblings().removeClass("active");
        })

        view.get().delegate("[data-action]","click",function(e){
            e.preventDefault();
            e.stopPropagation();
            var action = this.dataset.action.toUpperCase();
            switch(action){
                case 'CLOSE':
                    self.cancelStreaming();
                    self.triggerEvent("CANCEL_STREAM");
                    view.hide(true);
                    break;
                case 'SEND_PHOTO':
                    var photo = photos.findChildsByClass("active")[0];

                    convertToBlob(photo).then(function(photo){
                        self.triggerEvent("PHOTO_MAKED",{
                            type:'image',
                            format:'jpg',
                            data:photo
                        });
                        self.cancelStreaming();
                        view.hide(true);
                    });

                    break;
                default:
                    break;
            }

        });

        var video =  view.getView('stream');

        video.get().on("click",function(e){
            e.stopPropagation();
            var fotogram = this;
            //acedemos al contenedor de fotos.
            photos.createView("photo",{},{
                handlers:{
                    onCreate:function(view){
                        var canvas = view.getView("canvas").getNativeNode();
                        ctx = canvas.getContext('2d');
                        //Dibujamos Fotograma actual en el canvas
                        ctx.drawImage(fotogram,0,0,canvas.width,canvas.height);
                        view.addData('caman',Caman(canvas));
                    },
                    onAfterShow:function(view){
                        view.get().addClass("active").siblings().removeClass("active");
                    }
                }
            });
        });
           
           

    }

    var onAfterShowView = function(view){

        
        
    }

    var convertToBlob = function(photo){
        var caman = photo.getData("caman");
        return self.utils.base64URLToBlob(caman.toBase64('image/jpg'));
    }

    //Cancela el Streaming de la cámara web.
    MediaStream.prototype.cancelStreaming = function() {
        if (this.isEnabled()) {
            this.localMediaStream.stop();
            this.localMediaStream = null;
        };
    };

    MediaStream.prototype.isEnabled = function() {
        //Comprueba si se está capturando actualmente el streaming del usuario.
        return (this.localMediaStream && /MediaStream/i.test(this.localMediaStream.__proto__.constructor.toString()));
    };

    MediaStream.prototype.getCurrentFotogram = function(mime) {
        //Devuelve el fotograma actual.
        return this.utils.base64URLToBlob(this.caman.toBase64(mime || 'image/jpg'));
    };

    MediaStream.prototype.makePhoto = function() {
        templating.loadTemplate({
            name:"make_photo",
            category:"OVERLAY_MODULE_VIEW",
            handlers:{
                onCreate:onCreateMakePhotoView,
                onAfterShow:onAfterShowMakePhotoView
            }
        });
    };

    MediaStream.prototype.recordMedia = function(recordType) {
        templating.loadTemplate({
            name:recordType == RECORD_VIDEO ? "record_video" : "record_audio",
            category:"OVERLAY_MODULE_VIEW",
            handlers:{
                onCreate:function(view){
                    onCreateRecordView(view,recordType)
                },
                onAfterShow:onAfterShowRecordVideoView
            }
        });
    };

    return MediaStream;


})(Component,jQuery,environment);