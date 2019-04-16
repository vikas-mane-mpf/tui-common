define(["backbone"], function(Backbone){
  var UserModel = Backbone.Model.extend({
	url : 'getApiData.htm',

	getDisplayName : function(){
        var parts = [this.get("first_name")];
        if(this.get("last_name")) {
            parts.push(this.get("last_name"));
        }
        return parts.join(" ");
    },

	fetch : function(options) {
		  var params = {
				  type: "post",
				  data: JSON.stringify({
					  'entity' : 'users',
					  'userId' :this.id
				  }),
				  cache: false,
				  contentType: 'application/json; charset=utf-8',
				  dataType: 'json'
		  };
		  return Backbone.Model.prototype.fetch.apply(this, [params]);

	}

  });

  return UserModel;
})


