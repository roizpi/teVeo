var Utils = (function(){

  function Utils(){}

  /*
    Métodos Privados
    *********************
  */

  var createBlob = function(parts, options) {
    options = options || {};
    if (typeof options === 'string') {
      options = {type: options}; // do you a solid here
    }
    return new Blob(parts, options);
  }
        
  var binaryStringToArrayBuffer = function(binary) {
    var length = binary.length;
    var buf = new ArrayBuffer(length);
    var arr = new Uint8Array(buf);
    var i = -1;
    while (++i < length) {
      arr[i] = binary.charCodeAt(i);
    }
    return buf;
  }
        
  //Convert a base64-encoded string to a <code>Blob</code>. Returns a Promise.
  var base64StringToBlob = function(base64, type) {
    return Promise.resolve().then(function () {
      var parts = [binaryStringToArrayBuffer(atob(base64))];
      return type ? createBlob(parts, {type: type}) : createBlob(parts);
    });
  }


  // Can't find original post, but this is close
  // http://stackoverflow.com/questions/6965107/ (continues on next line)
  // converting-between-strings-and-arraybuffers
  var arrayBufferToBinaryString = function(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var length = bytes.byteLength;
    var i = -1;
    while (++i < length) {
      binary += String.fromCharCode(bytes[i]);
    }
    return binary;
  }
    
  
  /*
    Métodos Públicos
    **********************
  */

  Utils.prototype.convertImgToBase64URL = function(url, callback, outputFormat) {
    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function(){
      var canvas = document.createElement('CANVAS'),
      ctx = canvas.getContext('2d'), dataURL;
      canvas.height = img.height;
      canvas.width = img.width;
      ctx.drawImage(img, 0, 0);
      dataURL = canvas.toDataURL(outputFormat);
      callback(dataURL);
      canvas = null; 
    };
    img.src = url;
  };

  Utils.prototype.base64URLToBlob = function(data) {
    return Promise.resolve().then(function () {
      var base64String = data.substr(data.indexOf(',') + 1);
      console.log(base64String);
      return base64StringToBlob(base64String, 'image/jpg');
    });
  };

  Utils.prototype.utf8_encode = function(argString) {
  
      if (argString === null || typeof argString === 'undefined') {
        return '';
      }

      var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      var utftext = '',
        start, end, stringl = 0;

      start = end = 0;
      stringl = string.length;
      for (var n = 0; n < stringl; n++) {
        var c1 = string.charCodeAt(n);
        var enc = null;

        if (c1 < 128) {
          end++;
        } else if (c1 > 127 && c1 < 2048) {
          enc = String.fromCharCode(
            (c1 >> 6) | 192, (c1 & 63) | 128
          );
        } else if ((c1 & 0xF800) != 0xD800) {
          enc = String.fromCharCode(
            (c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
          );
        } else { // surrogate pairs
          if ((c1 & 0xFC00) != 0xD800) {
            throw new RangeError('Unmatched trail surrogate at ' + n);
          }
          var c2 = string.charCodeAt(++n);
          if ((c2 & 0xFC00) != 0xDC00) {
            throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
          }
          c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
          enc = String.fromCharCode(
            (c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
          );
        }
        if (enc !== null) {
          if (end > start) {
            utftext += string.slice(start, end);
          }
          utftext += enc;
          start = end = n + 1;
        }
      }

      if (end > start) {
        utftext += string.slice(start, stringl);
      }

      return utftext;
  }

  Utils.prototype.utf8_decode  = function(str_data) {

      var tmp_arr = [],
        i = 0,
        ac = 0,
        c1 = 0,
        c2 = 0,
        c3 = 0,
        c4 = 0;

      str_data += '';

      while (i < str_data.length) {
        c1 = str_data.charCodeAt(i);
        if (c1 <= 191) {
          tmp_arr[ac++] = String.fromCharCode(c1);
          i++;
        } else if (c1 <= 223) {
          c2 = str_data.charCodeAt(i + 1);
          tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
          i += 2;
        } else if (c1 <= 239) {
          // http://en.wikipedia.org/wiki/UTF-8#Codepage_layout
          c2 = str_data.charCodeAt(i + 1);
          c3 = str_data.charCodeAt(i + 2);
          tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
          i += 3;
        } else {
          c2 = str_data.charCodeAt(i + 1);
          c3 = str_data.charCodeAt(i + 2);
          c4 = str_data.charCodeAt(i + 3);
          c1 = ((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63);
          c1 -= 0x10000;
          tmp_arr[ac++] = String.fromCharCode(0xD800 | ((c1 >> 10) & 0x3FF));
          tmp_arr[ac++] = String.fromCharCode(0xDC00 | (c1 & 0x3FF));
          i += 4;
        }
      }

      return tmp_arr.join('');
  }

  Utils.prototype.htmlspecialchars = function(string, quote_style, charset, double_encode) {
  
      var optTemp = 0,
        i = 0,
        noquotes = false;
      if (typeof quote_style === 'undefined' || quote_style === null) {
        quote_style = 2;
      }
      string = string.toString();
      if (double_encode !== false) { // Put this first to avoid double-encoding
        string = string.replace(/&/g, '&amp;');
      }
      string = string.replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      var OPTS = {
        'ENT_NOQUOTES': 0,
        'ENT_HTML_QUOTE_SINGLE': 1,
        'ENT_HTML_QUOTE_DOUBLE': 2,
        'ENT_COMPAT': 2,
        'ENT_QUOTES': 3,
        'ENT_IGNORE': 4
      };
      if (quote_style === 0) {
        noquotes = true;
      }
      if (typeof quote_style !== 'number') { // Allow for a single string or an array of string flags
        quote_style = [].concat(quote_style);
        for (i = 0; i < quote_style.length; i++) {
          // Resolve string input to bitwise e.g. 'ENT_IGNORE' becomes 4
          if (OPTS[quote_style[i]] === 0) {
            noquotes = true;
          } else if (OPTS[quote_style[i]]) {
            optTemp = optTemp | OPTS[quote_style[i]];
          }
        }
        quote_style = optTemp;
      }
      if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
        string = string.replace(/'/g, '&#039;');
      }
      if (!noquotes) {
        string = string.replace(/"/g, '&quot;');
      }

      return string;
  }

  Utils.prototype.urlencode = function(str) {
      
      str = (str + '')
        .toString();

      // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
      // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
      return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .
      replace(/\)/g, '%29')
        .replace(/\*/g, '%2A')
        .replace(/%20/g, '+');
  }

  Utils.prototype.urldecode = function(str) {
    
      return decodeURIComponent((str + '')
        .replace(/%(?![\da-f]{2})/gi, function() {
          // PHP tolerates poorly formed escape sequences
          return '%25';
        })
        .replace(/\+/g, '%20'));
  }

  Utils.prototype.orderByInsercionBinariaAsc = function(arreglo,property) {
    //Función para ordenar arreglo de objetos Ascendetemento por el valor de una propiedad.
    var aux,primero,ultimo,central;
    for(var i = 1; i < arreglo.length; i++){
        aux = arreglo[i];
        primero = 0;
        ultimo = i - 1;
        //búsqueda binaria de la posición de inserción
        while(primero <= ultimo){
            central = Math.ceil((primero + ultimo)/2);
            if(aux[property] <= arreglo[central][property]){
              ultimo = central - 1;    
            }else{
              primero = central + 1;   
            }
                
        }
        //desplazamos a la derecha los elementos ordenados para insertar el nuevo
        for(var j = i - 1; j >= primero; j--){
            arreglo[j+1] = arreglo[j];
        }
        arreglo[primero] = aux;
        
    }
        
    return arreglo;
  }
  
  //Función para ordenar arreglo de objetos Descendentemente por el valor de una propiedad.
  Utils.prototype.orderByInsercionBinariaDesc = function(arreglo,property) {
    var aux,primero,ultimo,central;
    for(var i = 1; i < arreglo.length; i++){
        aux = arreglo[i];
        primero = 0;
        ultimo = i - 1;
        //búsqueda binaria de la posición de inserción
        while(primero <= ultimo){
            central = Math.ceil((primero + ultimo)/2);
            if(aux[property] >= arreglo[central][property]){
                ultimo = central - 1;    
            }else{
                primero = central + 1;   
            }
                
        }
        //desplazamos a la derecha los elementos ordenados para insertar el nuevo
        for(var j = i - 1; j >= primero; j--){
            arreglo[j+1] = arreglo[j];
        }
        arreglo[primero] = aux;
        
    }
        
    return arreglo;
  };

  //Ascendente.
  Utils.prototype.orderByBubbleShortAsc = function(arreglo) {

    var intercambios = false;
    var i =0;
    do{
      intercambios = false;
      for(var j = 0; j < arreglo.length - i - 1; j++){
        if(arreglo[j] > arreglo[j + 1]){
            var aux = arreglo[j];
            arreglo[j] = arreglo[j + 1];
            arreglo[j + 1] = aux;
            intercambios = true;
        }
      }
      i++;
    }while(intercambios && i <= arreglo.length - 1);
    
    return arreglo;
  }
  //Descendente.
  Utils.prototype.orderByBubbleShortDesc = function(arreglo) {

    var intercambios = false;
    var i =0;
    do{
      intercambios = false;
      for(var j = 0; j < arreglo.length - i - 1; j++){
        if(arreglo[j] < arreglo[j + 1]){
            var aux = arreglo[j];
            arreglo[j] = arreglo[j + 1];
            arreglo[j + 1] = aux;
            intercambios = true;
        }
      }
      i++;
    }while(intercambios && i <= arreglo.length - 1);
    
    return arreglo;
  }


  Utils.prototype.utf8_to_b64 = function(str) {
    return window.btoa(unescape(encodeURIComponent( str )));
  }

  Utils.prototype.b64_to_utf8 = function(str) {
    return decodeURIComponent(escape(window.atob( str )));
  }

  //Convert a binary string to a <code>Blob</code>. Returns a Promise.
  Utils.prototype.binaryStringToBlob = function(binary, type) {
    return Promise.resolve().then(function () {
      return base64StringToBlob(btoa(binary), type);
    });
  }

 // Convert a <code>Blob</code> to a binary string. Returns a Promise.
  Utils.prototype.blobToBinaryString = function(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      var hasBinaryString = typeof reader.readAsBinaryString === 'function';
      reader.onloadend = function (e) {
        var result = e.target.result || '';
        if (hasBinaryString) {
          return resolve(result);
        }
        resolve(arrayBufferToBinaryString(result));
      };
      reader.onerror = reject;
      if (hasBinaryString) {
        reader.readAsBinaryString(blob);
      } else {
        reader.readAsArrayBuffer(blob);
      }
    });
  }

  



  return Utils;
    

})();