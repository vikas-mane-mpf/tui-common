define( [
	'jquery', 'backbone', 'underscore', 'common/models/GeoModel'],
function($, Backbone, _,GeoModel) {
	var Collection = Backbone.Collection.extend({
		model : GeoModel,
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
                data: JSON.stringify({"entity":"geos","operation":"list","agencyId":options.agencyId, "queryString":"sort=name.asc"})
			};
			return Backbone.Collection.prototype.fetch.apply(this, [params]);			
        }
		
	});
	
	return Collection;
});
