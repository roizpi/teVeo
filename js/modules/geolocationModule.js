var GeoLocation = (function(_super,$,environment){

  __extends(GeoLocation, _super);

  const URL_API_GOOGLE_MAPS = "http://maps.google.com/maps/api/js?sensor=false&callback=setupAPIGoogleMaps";

  var location = {};
  
  function GeoLocation(){}

  var setupAPIGoogleMaps = function(){
    $(window).trigger('GOOGLE_MAPS_LOADED');
  }

  var getGoogleMap = function(callback){
    //Comprobamos si la API está cargada.
    if (navigator.geolocation && $('script[src="'+URL_API_GOOGLE_MAPS+'"]').length>0 && window.google){
      typeof(callback) == "function" && callback(google);
    }else{
      //Configuramos el callback.
      window.setupAPIGoogleMaps = setupAPIGoogleMaps;
      //Descargamos la API.
      $.getScript(URL_API_GOOGLE_MAPS);

      $(window).on('GOOGLE_MAPS_LOADED',function(){
        typeof(callback) == "function" && callback(google);
      });
    }
  }

  //Devuelve la localización actual del usuario.
  var getCurrentLocation = function(){
      var deferred = $.Deferred();
      //Si no esta vacía o no ha expirado.
      if (!$.isEmptyObject(location)) {
        //Si ya hay una localización cacheada, la devolvemos.
        deferred.resolve(location);
      }else{
        //Obtenemos la posición del usuario.
        navigator.geolocation.getCurrentPosition(function(position){

          //Longitud
          var lon = position.coords.longitude;
          //Latitud
          var lat = position.coords.latitude;

          getGoogleMap(function(google){
            //Creamos objeto LatLng de la API de Google
            var latlng = new google.maps.LatLng(lat, lon);
            //el Servicio de Codificación Geográfica (google.maps.Geocoder).
            var geocoder = new google.maps.Geocoder();

            geocoder.geocode({"latLng": latlng}, function(results, status){
              //Comprobamos que la operación se ha realizado correctamente
              if (status == google.maps.GeocoderStatus.OK){

                if (results[0]){
                  location.timestamp = new Date().getTime();
                  location.coords = position.coords;
                  location.address_components = {
                    street:results[0].address_components[1].long_name,
                    town:results[0].address_components[2].long_name,
                    province:results[0].address_components[3].long_name,
                    county:results[0].address_components[4].long_name,
                  }
                  location.formatted_address = results[0].formatted_address;
                  //resolvemos la promise devolviendo el resultado.
                  deferred.resolve(location);
                }else{
                  deferred.reject("No se ha podido obtener ninguna dirección en esas coordenadas.");
                }

              }else{
                deferred.reject("El Servicio de Codificación Geográfica ha fallado con el siguiente error: " + status);
              }

            });

          });
        },function(error){
          var message;
          switch (error.code){
            case error.PERMISSION_DENIED:
              message = "No se ha permitido el acceso a la posición del usuario.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "No se ha podido acceder a la información de su posición.";
              break;
            case error.TIMEOUT:
              message = "El servicio ha tardado demasiado tiempo en responder.";
              break;
            default:
              message ="Error desconocido.";
          }

          deferred.reject(message);

        },{
            maximumAge: 75000,
            timeout: 15000
        });
      }

      return deferred.promise();

    }

  /*API Pública*/

  //Compartimos nuestra posición con otros usuarios.
  GeoLocation.prototype.sharePosition = function(users) {

    return this.getLocation().done(function(location){
      console.log("ESTA ES LA POSICIÓN");
      console.log(location);
      //Obtenemos el servicio de localización de servicios remotos.
      var serviceLocator = environment.getService("SERVICE_LOCATOR");
      //Utilizamos el servicio "sharePosition" para compartir nuestra ubicación
      //con otros usuarios conectados.
      return serviceLocator.sharePosition(
        location.timestamp,
        location.formatted_address,
        location.address_components,
        users //Usuarios a los que notificar esta información
      );

    });
    
  };

  //Devuelve las coordenadas del usuario.
  GeoLocation.prototype.getCoords = function() {
    return getCurrentLocation().pipe(function(location){
      return location.coords;
    });
  };
  //Retorna toda la información sobre la ubicación del usuario.
  GeoLocation.prototype.getLocation = function() {
    return getCurrentLocation().pipe(function(location){
      return location;
    });
  };

  return GeoLocation;

})(Component,jQuery,environment);
