var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

var BaseModule = (function (){
    

    function BaseModule(){

    }
   
    BaseModule.prototype.addEventListener = function(events,callback){
        if((events && isNaN(parseInt(events))) && typeof(callback) == "function"){
            var events = events.trim().replace(/\s+/g,' ').split(" ");
            for(var i = 0,len = events.length; i < len; i++)
                this.eventsModule[events[i]] && this.eventsModule[events[i]].push(callback);
        }
    }
        
    BaseModule.prototype.triggerEvent = function(event,data){
        if(this.eventsModule[event])
            for(var i = 0,len = this.eventsModule[event].length; i < len; i++ )
                this.eventsModule[event][i].apply(this,[data]);
    }

    return BaseModule;
})();