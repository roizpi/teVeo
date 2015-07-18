var Debug = (function(){
    

    function Debug(){}

    /*  
        Métodos Públicos
        **********************
    */
    
    Debug.prototype.log = function(text,level){
        if(text && text.length){
            if(level.toUpperCase() == "WARNING")
                console.warn(text);
            else if(level.toUpperCase() == "ERROR")
                console.error(text);
            else 
                console.log(text);
        }
    }
    return Debug;

})();