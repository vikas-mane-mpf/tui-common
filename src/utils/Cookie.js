define([
        'jquery',
        'underscore',
        'backbone',
        'i18next'
    ],
    function($, _,Backbone, i18next) {
        var CookieUtil= function(){}

        CookieUtil.createCookie = function(name,value,days) {
            if (days) {
                var date = new Date();
                date.setTime(date.getTime()+(days*24*60*60*1000));
                var expires = "; expires="+date.toGMTString();
            }
            else var expires = "";
            document.cookie = name+"="+value+expires+"; path=/";
        };

        CookieUtil.readCookie = function (name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        };

        CookieUtil.eraseCookie = function (name) {
            CookieUtil.createCookie(name,"",-1);
        };


        return CookieUtil;
	});
