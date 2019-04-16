define([],
    function() {

        if (!('contains' in String.prototype)) {
          String.prototype.contains = function(str, startIndex) {
            return -1 !== String.prototype.indexOf.call(this, str, startIndex);
          };
        }

        if (!('replaceAll' in String.prototype)) {
          String.prototype.replaceAll = function (find, replace) {
              var str = this;
              return str.replace(new RegExp(find, 'g'), replace);
          };
        }

        if (!('addParameterToURL' in String.prototype)) {
            String.prototype.addParameterToURL = function (param){
                url = this;
                url += (url.split('?')[1] ? '&':'?') + param;
                return url;
             }
        }

        if (!('escapeRegEx' in String.prototype)) {
            String.prototype.escapeRegEx = function (){
               return this.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            }
        }


	});
