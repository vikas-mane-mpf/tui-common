var URLS = require('../urls');

define(["backbone"], function(Backbone){
  var UserModel = Backbone.Model.extend({
	getDisplayName : function(){
        var parts = [this.get("first_name")];
        if(this.get("last_name")) {
            parts.push(this.get("last_name"));
        }
        return parts.join(" ");
    },

	fetch : function(options) {
			var userId = this.id;
		  var params = {
				  type: "get",
				  cache: false,
				  contentType: 'application/json; charset=utf-8',
					dataType: 'json',
					url: URLS.USER_DETAILS(userId)
		  };
		  return Backbone.Model.prototype.fetch.apply(this, [params]);

	}

  });

  return UserModel;
})


