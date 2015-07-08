/*Módulo de reconocimiento y síntesis de voz*/
var WebSpeech = (function(_super,$){

    __extends(WebSpeech, _super);
    
    var utterance;
    var speechSynthesis;
    var volume = 1;
    var rate = 1;
    var loaded = false;
    var moduleEnabled = false;

    function WebSpeech(){
        //Eventos del Módulo
        this.eventsModule = {
            "SpeechEnabled":[],
            "SpeechDisabled":[]
        }

    }

    /*
        Métodos Privados
        ***************************
    */

    var load = function(callback){
        window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition || null;
        if ('speechSynthesis' in window) {
         // Synthesis support. Make your web apps talk!
            speechSynthesis = window.speechSynthesis;
            callback(new SpeechSynthesisUtterance());
        }else{
            $.getScript("js/vendor/speech-synthesis-polyfill.min.js",function(){
                console.log("Speech Synthesis Polyfill is loaded");
                speechSynthesis = window.speechSynthesisPolyfill;
                var fallbackSpeechSynthesisUtterance = window.SpeechSynthesisUtterancePolyfill;
                var utterance = new fallbackSpeechSynthesisUtterance();
                utterance.corsProxyServer = 'http://www.corsproxy.com/';
                callback(utterance);
            })
        }
       
    }
    
    /*
        Métodos Públicos
        *****************************

    */

    WebSpeech.prototype.isEnabled = function(first_argument) {
        return moduleEnabled;
    };

    WebSpeech.prototype.speak = function(text,callback) {
        // the text you that wish to be spoken is contained within an utterance object (SpeechSynthesisUtterance).
        //This utterance object also contains information about how the text should be spoken
        utterance.text = text;
        speechSynthesis.speak(utterance);
        utterance.onend = callback;
    };

    WebSpeech.prototype.hearSentence = function(callbackSuccess,callbackError) {
        if(isEnabled()){
            var recognition = new webkitSpeechRecognition();
            recognition.lang = 'es-ES';
            recognition.onresult = function(e){
                console.log(e);
                var result = {};
                //recogemos el resultado del transcripción.
                result.transcript = e.results[0][0].transcript;
                //probabilidad de que el reconocimiento sea correcto.
                result.confidence = e.results[0][0].confidence;
                callbackSuccess(result);
            }
            recognition.onerror = function(e){
                callbackError(e.error);
            };
            
            recognition.start();
            
        }else{
            callbackError("Servicio no disponible");
        }
    };

    WebSpeech.prototype.enable = function(callbackSuccess,callbackError) {
        var self = this;
        if(navigator.userAgent.match(/Chrome/i)){
            if(!loaded){
                load(function(speechSynthesisUtterance){
                    utterance = speechSynthesisUtterance;
                    utterance.lang = 'es-ES';
                    //The volume property allows you to adjust the volume of the speech
                    utterance.volume = volume
                    //The rate attribute defines the speed at which the text should be spoken
                    utterance.rate = rate;
                    utterance.onerror = function(e){
                        console.log("Error : ");
                        console.log(e);
                    }
                    moduleEnabled = true;
                    loaded = true;
                    self.triggerEvent("SpeechEnabled");
                    typeof(callbackSuccess) == "function" && callbackSuccess.call(self);
                    
                });
            }else{
                moduleEnabled = true;
                triggerEvent("SpeechEnabled");
                typeof(callbackSuccess) == "function" && callbackSuccess.call(self);
            }
        
        }else{
            
            typeof(callbackSuccess) == "function" && callbackError("Característica no disponible para tu navegador");
        }
    };

    WebSpeech.prototype.disable = function(callbackSuccess,callbackError) {
        if(moduleEnabled){
            moduleEnabled = false;
            this.triggerEvent("SpeechDisabled");
        }
    };

    return WebSpeech;

})(BaseModule,jQuery);