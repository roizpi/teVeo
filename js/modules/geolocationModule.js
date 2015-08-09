var GeoLocation = (function(_super,$,environment){

  __extends(GeoLocation, _super);

  const URL_API_GOOGLE_MAPS = "http://maps.google.com/maps/api/js?sensor=false";
  
  function GeoLocation(){
  }

  var isAvailableGeolocation = function(){
    var avaliable = false;
    if (navigator.geolocation && $('script[src="'+URL_API_GOOGLE_MAPS+'"]').length>0 && window.google){
      avaliable = true;
    }
    return avaliable;
  }

  /*API Pública*/

  //Compartimos nuestra posición con otros usuarios.
  GeoLocation.prototype.sharePosition = function(position,users) {
    //Obtenemos el servicio de localización de servicios remotos.
    var serviceLocator = environment.getService("SERVICE_LOCATOR");
    //Utilizamos el servicio "sharePosition" para compartir nuestra ubicación
    //con otros usuarios conectados.
    return serviceLocator.sharePosition(
      position.timestamp,
      position.detail.formatted_address,
      position.detail.address_components,
      users //Usuarios a los que notificar esta información
    );
    
  };

  //Obtiene información sobre la ubicación del usuario.
  GeoLocation.prototype.getLocation = function(callbackSucces,callbackError) {
    if(isAvailableGeolocation()){
      //Obtenemos la posición del usuario.
      navigator.geolocation.getCurrentPosition(function(position){
        //Éxito
        var location;
        //Longitud
        var lon = position.coords.longitude;
        //Latitud
        var lat = position.coords.latitude;
        //Creamos objeto LatLng de la API de Google
        var latlng = new google.maps.LatLng(lat, lon);
        //el Servicio de Codificación Geográfica (google.maps.Geocoder).
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({"latLng": latlng}, function(results, status){
          //Comprobamos que la operación se ha realizado correctamente
          if (status == google.maps.GeocoderStatus.OK){
            if (results[0]){
              var result = {};
              result.address_components = results[0].address_components;
              result.formatted_address =  results[0].formatted_address;
              callbackSucces(result)
            }else{
              callbackError("No se ha podido obtener ninguna dirección en esas coordenadas.");
            }
          }else{
            callbackError("El Servicio de Codificación Geográfica ha fallado con el siguiente error: " + status);
          }
        });
               
      },function(error){
          switch (error.code){
            case error.PERMISSION_DENIED:
              callbackError("No se ha permitido el acceso a la posición del usuario.");
              break;
            case error.POSITION_UNAVAILABLE:
              callbackError("No se ha podido acceder a la información de su posición.");
              break;
            case error.TIMEOUT:
              callbackError("El servicio ha tardado demasiado tiempo en responder.");
              break;
            default:
              callbackError("Error desconocido.");
          }
        },{
          maximumAge: 75000,
          timeout: 15000
      });
           
    }else{
      callbackError("Geolocalización no disponible");
    }

  };

  return GeoLocation;

})(Component,jQuery,environment);
