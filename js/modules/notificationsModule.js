var Notificator = (function(_super,$,environment){

    __extends(Notificator, _super);

    var pendingNotifications = [];
    const DEFAULT_IMAGE = "resources/img/logo.png";
    var state;
    var self;
    var templating;

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
        //Obtenemos el template manager.
        templating = environment.getService("TEMPLATE_MANAGER");
        //Instanciamos un dialogador.
        //Eventos del Módulo
        this.events = {
            "NOT_FOUND_NOTIFICATIONS":[],
            "NEW_NOTIFICATION":[]
        }

        pendingNotifications.push({
            title:"Notificación de Prueba",
            body:"Esto es una notificación de prueba",
            timestamp:new Date().getTime()
        });

        Notificator.prototype.dialog = new Dialog();
        //Configuramos handlers
        //attachHandlers();

    }

    /*  
        Métodos Privados
        *******************************
    */

    //Manejador onCreate para la template "notifications".
    var onCreate = function(){
        //cacheamos contenedor de notificaciones
        var view = this;
        //obtenemos una referencia al contenedor.
        var container = view.getView("container");
        //Delegamos evento click sobre las notificaciones en el contenedor.
        container.get().delegate("[data-notification]","click",function(){
            var $this = $(this);
            var id = $this.data("id");
            container.hideChild(id,true);
            //Borramos la notificación.
            removeNotification(id);
            if(!pendingNotifications.length){
                self.triggerEvent("NOT_FOUND_NOTIFICATIONS");
            }
        });
        //Inicializamos plugin mixItUp
        /*$container.mixItUp({
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
                    var $toOrderNotifications = view.getView("toOrderNotifications").get();
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
        });*/
    }

    //Manejador onBeforeShow para la template "notifications".
    var onBeforeShow = function(){

        //Mostramos cada notificación pendiente.
        pendingNotifications.forEach(showNotification);
        //refrescamos contador de notificaciones pendientes.
        updateCountNotifications();
        pendingNotifications = [];
    }

    //Añade la notificación a la lista de notificaciones pendientes.
    var addNotification = function(data){

        data.id = Math.round((Math.random() * 100000) + 1);
        data.timestamp = new Date().toLocaleString();
        
        if(templating.getView("notifications").getView("container").isVisible()){
            //La insertamos en el DOM
            showNotification(data);
            //refrescamos contador de notificaciones pendientes.
            updateCountNotifications();
        }else{
            //la añadimos a las notificaciones no leídas.
            pendingNotifications.push(data);
        }

        //Notificamos que existe una nueva notificación.
        self.triggerEvent("NEW_NOTIFICATION");
    }

    var removeNotification = function(id){
        var idx = pendingNotifications.map(function(notification){
            return notification.id;
        }).indexOf(id);
        pendingNotifications.splice(idx,1);
    }
    
    //Inserta Notificación en el DOM.
    var showNotification = function(data){
    
        templating
            .getView("notifications")
            .getView("container")
            .createView('notification',{
                icon:data.icon,
                title:data.title,
                body:data.body,
                timestamp:data.timestamp
            },{
                animations:{
                    animationIn:"zoomIn",
                    animationOut:"zoomOut"
                }
            });
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
        data.icon = data.icon ? data.icon : DEFAULT_IMAGE;
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
            templating.loadTemplate({
                name:"notifications",
                type:"MODULE_VIEWS",
                handlers:{
                    onCreate:onCreate,
                    onBeforeShow:onBeforeShow
                }
            },function(){
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
    
})(Component,jQuery,environment);