define( [
	'jquery', 'backbone', 'underscore', 'main/models/AgencyModel'],
function($, Backbone, _,AgencyModel) {
	var Collection = Backbone.Collection.extend({
		model : AgencyModel,
		url: "getCoreApiData.htm",
		
		initialize: function(){},
		
		parse: function(response){
			return response.data;
		},
		
		fetch : function(options) {
			var params = {
					type: "post",
					cache: false,
	                contentType: 'application/json; charset=utf-8',
	                dataType: 'json',
	                data:JSON.stringify({"entity":"agencies","operation":"list","queryString":"page=1&size=100&sort=name.asc"})
			};
           
			return Backbone.Collection.prototype.fetch.apply(this, [params]);			
         },

         fetchAgenciesByGeo: function(options){
            var params = {
                type: "post",
                cache: false,
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                data:JSON.stringify({"entity":"agencies","operation":"list", "geoId": options.geoId, "queryString":"page=1&size=100&sort=name.asc"})
            };

            return Backbone.Collection.prototype.fetch.apply(this, [params]);
         },
		
	});
	
	return Collection;
});
