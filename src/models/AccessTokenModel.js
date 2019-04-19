define(["backbone", "utils/Cookie", "moment"], function(Backbone, CookieUtil, moment){
    var AccessTokenModel = Backbone.Model.extend({

        timeToExpiry : function(units){
          var now = moment();
          console.log("timeToExpiry", now.format(), this.get("expire"), moment.unix(this.get("expire")).format());
          return moment.unix(this.get("expire")).diff(now, units || 'hours');
        },

        initialize : function(){
          this.readCookie();
        },


        // fetches from username and password;
        fetch : function(options){

            var config = {
               type: 'post',
               cache: false,
               url: "newLogin.htm",
               data: {
                username: options.username,
                password: options.password
               }
               // + sign in username and password change with space in request object
               // data: "username=" + options.username + "&password=" + options.password
            };

           return Backbone.Model.prototype.fetch.apply(this, [config]).then(
               function(response){
                    if(response.access_token){
                       this.writeCookie();
                       //NOTE: As per the new Segment.io user tracking method MIPUI-2333
                       if (window.analytics) {
                        window.analytics.identify(response.user_id, {
                          email: options.username // NOTE: right now only email address is available and user_id is available from the response.
                        });
                      }
                    }else{
                        return $.Deferred().reject().promise();
                    }
               }.bind(this)
           );
        },

        // refreshes;
        refresh : function(){
            console.log("refreshing token");
            if(!this.get("refresh_token"))
                return $.Deferred().reject().promise();


            var config = {
               type : 'post',
               cache : false,
               contentType : 'application/json; charset=utf-8',
               dataType : 'json',
               async : true,
               url: "getApiData.htm",
               data: JSON.stringify({
                    entity : "refreshToken",
                    refreshToken : this.get("refresh_token")
               })
            };

           return Backbone.Model.prototype.fetch.apply(this, [config]).then(
               function(){
                    this.writeCookie();
               }.bind(this)
           );
        },

        invalidate : function(){
            var config = {
               type : 'post',
               cache : false,
               contentType : 'application/json; charset=utf-8',
               dataType : 'json',
               async : true,
               ignore401 : true,
               url: "logout.htm",
            };

           return Backbone.Model.prototype.fetch.apply(this, [config]).always(
               function(){
                    this.clearCookie();
               }.bind(this)
           );
        },

        writeCookie : function(){
            CookieUtil.createCookie("trb_user_id", this.get("user_id") || '', 7);
            CookieUtil.createCookie("trb_access_token", this.get("access_token") || '', 7);
            CookieUtil.createCookie("trb_refresh_token", this.get("refresh_token") || '', 7);
            CookieUtil.createCookie("trb_token_expiry", this.get("expire") || '', 7);
        },

        clearCookie : function(){
            CookieUtil.eraseCookie("trb_user_id");
            CookieUtil.eraseCookie("trb_access_token");
            CookieUtil.eraseCookie("trb_refresh_token");
            CookieUtil.eraseCookie("trb_token_expiry");
        },

        readCookie : function(){
            this.set({
                 user_id : CookieUtil.readCookie("trb_user_id"),
                 access_token : CookieUtil.readCookie("trb_access_token"),
                 refresh_token : CookieUtil.readCookie("trb_refresh_token"),
                 expire : CookieUtil.readCookie("trb_token_expiry"),
             })
        },

        getData : function() {
            return {
                user_id: this.get("user_id"),
                access_token: this.get("access_token"),
                refresh_token: this.get("refresh_token"),
                expire: this.get("expire")
            }
        }
    });

  return AccessTokenModel;
})


