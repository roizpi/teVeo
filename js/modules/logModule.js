var Logger = (function(_super){
    
    __extends(Logger, _super);

    function Logger(){}

    /*  
        Métodos Públicos
        **********************
    */
    
    Logger.prototype.log = function(text,level){
        if(text && text.length){
            if(level.toUpperCase() == "WARNING")
                console.warn(text);
            else if(level.toUpperCase() == "ERROR")
                console.error(text);
            else 
                console.log(text);
        }
    }
    return Logger;

})(BaseModule);