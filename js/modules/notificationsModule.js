var Notificator = (function(_super,$){

    __extends(Notificator, _super);

    var pendingNotifications = [];

    var defaultImg = "resources/img/logo.png";
    var state;
    var self;
    //Muestra cuadros de diálogo.
    var Dialog = (function(){

        var $alert,$confirm;

        function Dialog(){

            $alert = $("#alert").data('dialog');
            $confirm = $("#confirm").data('dialog');

            $confirm.element.on("click","[data-action]",function(e){
                e.preventDefault();
                e.stopPropagation();
                var action = this.dataset.action;
                if(action == "success")
                    typeof($confirm.onSuccess) == "function" && $confirm.onSuccess();
                else if(action == "cancel")
                    typeof($confirm.onCancel) == "function" && $confirm.onCancel();
                $confirm.close();
            });
        }

        Dialog.prototype.alert = function(data,callback) {
            var type = ["success","warning","alert","info"].indexOf(data.level.toLowerCase()) != -1 ? data.level.toLowerCase() : "success";
            $alert.element.removeClass("success  warning  alert  info").addClass(type);
            //Establecemos el título de la alerta
            $alert.element.find("[data-title]").text(data.title);
            //Establecemos el texto de la alerta.
            $alert.element.find("[data-text]").text(data.text);
            //Abrimos la alerta
            $alert.open();
        };

        Dialog.prototype.confirm = function(data,success,cancel) {
            $confirm.onSuccess = success;
            $confirm.onCancel = cancel;
            //Establecemos el título de la alerta
            $confirm.element.find("[data-title]").text(data.title);
            //Establecemos el texto de la alerta.
            $confirm.element.find("[data-text]").text(data.text);
            //Abrimos diálogo de confirmación.
            $confirm.open();
        };

        return Dialog;
        
    })();

    function Notificator(webSpeech){

        self = this;
        this.webSpeech = webSpeech;
        //Instanciamos un dialogador.
        //this.prototype.dialog = new Dialog();
        //Eventos del Módulo
        this.events = {
            "NOT_FOUND_NOTIFICATIONS":[],
            "NEW_NOTIFICATION":[]
        }


        Notificator.prototype.dialog = new Dialog();
        //Configuramos handlers
        //attachHandlers();

    }

    /*  
        Métodos Privados
        *******************************
    */

    var getMainView = function(){
        return self.templateManager.getView({
            moduleName:self.constructor.name,
            templateName:"notifications"
        });
    }

    var attachHandlers = function(){

        //Configuramos manejador para la template "notifications".
        self.templateManager.implementHandler({
            moduleName:self.constructor.name,
            templateName:"notifications",
            handler:"onCreate"
        },function(){
            //cacheamos contenedor de notificaciones
            var view = this;
            var $container = view.getComponent("container").get();
            //Delegamos evento click sobre las notificaciones en el contenedor.
            $container.delegate("[data-notification]","click",function(){
                var $this = $(this);
                var id = $this.data("id");
                $this.fadeOut(1000,function(){
                    //Borramos la notificación.
                    removeNotification(id);
                    //refrescamos contador de notificaciones pendientes.
                    updateCountNotifications();
                    if(!pendingNotifications.length){
                        self.triggerEvent("notFoundNotifications");
                    }
                    //Eliminamos la notificación.
                    $this.remove();
                });
            });
            //Inicializamos plugin mixItUp
            $container.mixItUp({
                animation: {
                    duration: 730,
                    effects: 'scale(1.26) rotateY(86deg) fade translateZ(880px)',
                    easing: 'cubic-bezier(0.47, 0, 0.745, 0.715)'
                },
                load:{
                    sort: 'timestamp:desc'
                },
                callbacks: {
                    onMixLoad: function(){
                        var $toOrderNotifications = view.getComponent("toOrderNotifications",true).get();
                        //Ordenar solicitudes.
                        $toOrderNotifications.delegate("a[data-action]","click",function(e){
                            e.preventDefault();
                            var $this = $(this);
                            var action = this.dataset.action;
                            if(!$this.hasClass("active")){
                                $this.addClass("active").siblings().removeClass("active");
                                if(action == 'shortDesc'){
                                    //Orden Descendente por el Timestamp
                                    $container.mixItUp('sort', 'timestamp:desc');
                                }else if(action == 'shortAsc'){
                                    //Orden Ascendente por el timestamp
                                    $container.mixItUp('sort', 'timestamp:asc');
                                }
                            
                            }
                        });
                    }
                }
            });
        });

        //Configuramos manejador para la template "notifications".
        self.templateManager.implementHandler({
            moduleName:self.constructor.name,
            templateName:"notifications",
            handler:"onBeforeShow"
        },function(){
            
            //Mostramos cada notificación pendiente.
            pendingNotifications.forEach(showNotification);
            //refrescamos contador de notificaciones pendientes.
            updateCountNotifications();
            pendingNotifications = [];

        });

    }

    //Añade la notificación a la lista de notificaciones pendientes.
    var addNotification = function(data){

        data.id = Math.round((Math.random() * 100000) + 1);
        data.timestamp = new Date().toLocaleString();
        var view = getMainView();
        
        if(view.getComponent("container").isVisible()){
            //La insertamos en el DOM
            showNotification(data);
            //refrescamos contador de notificaciones pendientes.
            updateCountNotifications();
        }else{
            //la añadimos a las notificaciones no leídas.
            pendingNotifications.push(data);
        }

        //Notificamos que existe una nueva notificación.
        self.triggerEvent("newNotification");
    }

    var removeNotification = function(id){
        var idx = pendingNotifications.map(function(notification){
            return notification.id;
        }).indexOf(id);
        pendingNotifications.splice(idx,1);
    }
    
    //Inserta Notificación en el DOM.
    var showNotification = function(data){
        var view = getMainView();
        view.getComponent("container").createComponent('notification',{
            icon:data.icon,
            title:data.title,
            body:data.body,
            timestamp:data.timestamp
        },{});
    }

    var updateCountNotifications = function(){
        var view = getMainView();
        var $countNotifications = view.getComponent("countNotifications",true).get();
        $countNotifications.text(pendingNotifications.length);   
    }

    /*
        Métodos Públicos.
        ***********************************

    */

    Notificator.prototype.getNumOfNotifications = function() {
        return pendingNotifications.length;
    };
    //Permite lanzar una web notification, siempre que el usuario haya dado permiso.
    Notificator.prototype.throwNotification = function(data){
        
        if(this.webSpeech.isEnabled()){
            this.webSpeech.speak(data.title);
        }
        //Si no se proporciona imagen, utilizamos la img por defecto.
        data.icon = data.icon ? data.icon : defaultImg;
        //Comprobamos si ha permitido lanzar notificaciones.
        if(window.Notification && Notification.permission == "granted"){
            //lanzamos notificación
            var notification = new Notification(data.title,{
                icon:data.icon,
                body:data.body
            });
            
            notification.addEventListener("close",function(e){
                if(notification.status == "pending")
                    addNotification(data);  
            });
            
            //Si hace click en ella la cerramos sin más
            notification.addEventListener("click",function(){
                notification.status = "done";
                notification.close();
            });
            
            //la notificación desaparecerá al cabo de 3 segundos a no ser que se haya
            // hecho click en ella.
            setTimeout(function(){
                //la cerramos
                notification.close();  
            },3000);
        
        }else{
            //lanzamos notificación del framework Metro UI
            var notification = $.Notify({
                caption: data.title,
                content: data.body,
                icon: "<img width='50px' height='50px' src='"+data.icon+"'>",
                shadow:true,
                keepOpen:true
            });
            
            notification._container.on("close",function(e){
                if(notification.status == "pending")
                    addPendingNotification(data);
                notification.close();
            });
            
            //Si hace click en ella la cerramos sin más
            notification._container.on("click",function(){
                notification.status = "done";
                notification.close();
            });
            
            //la notificación desaparecerá al cabo de 3 segundos a no ser que se haya
            // hecho click en ella.
            setTimeout(function(){
                //la cerramos
                notification._container.trigger("close");
            },3000);
    
        }
        
        notification.status = "pending";
            
    }

    //Muestra las notificaciones pendientes.
    Notificator.prototype.showNotifications = function(){
        if(pendingNotifications.length){
            this.templateManager.loadTemplate({moduleName:this.constructor.name,templateName:"notifications"},function(){
                console.log("La vista de notificaciones cargada");
                console.log(this);
            });
        }else{
            throw new Error("No tienes notificaciones pendientes");
        }
    }

    //Método para pedir permiso para mostrar web notifications.
    Notificator.prototype.requestPermission = function(){

        if(window.Notification){

            if(Notification.permission != "granted"){
                //pedimos permiso al usuario para hacer uso de ellas.
                Notification.requestPermission();
            }

        }else{
            //Navegador no soporta webNotifications
            //Mostramos dialogo de confirmación pidiendo permiso para mostrar
            //notificaciones
        }
    }



   return Notificator;
    
})(Component,jQuery);