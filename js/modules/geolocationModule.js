var GeoLocation = (function(_super,$,environment){

  __extends(GeoLocation, _super);

  var urlApiGoogle = "http://maps.google.com/maps/api/js?sensor=false";
  
  function GeoLocation(){
  }

  var isAvailableGeolocation = function(){
    var avaliable = false;
    if (navigator.geolocation && $('script[src="'+urlApiGoogle+'"]').length>0 && window.google){
      avaliable = true;
    }
    return avaliable;
  }

  //Compartimos nuestra posición con otros usuarios.
  GeoLocation.prototype.sharePosition = function(position,users,callbackSuccess,callbackError) {
    var serviceLocator = environment.getService("SERVICE_LOCATOR");
    serviceLocator.sharePosition(userConnected.id,position.timestamp,position.detail.formatted_address,position.detail.address_components,users)
        .done(function(response){
          //Ubicación compartida.
          callbackSuccess && callbackSuccess(response);
        })
        .fail(function(error){
          callbackError && callbackError(error);
        });
  };

  GeoLocation.prototype.getLocation = function(callbackSucces,callbackError) {
    if(isAvailableGeolocation()){
      //Obtenemos la posición del usuario.
      navigator.geolocation.getCurrentPosition(function(position){
        //Éxito
        var location;
        var lon = position.coords.longitude;
        var lat = position.coords.latitude;
        var latlng = new google.maps.LatLng(lat, lon);
        //el Servicio de Codificación Geográfica (google.maps.Geocoder).
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({"latLng": latlng}, function(results, status){
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
