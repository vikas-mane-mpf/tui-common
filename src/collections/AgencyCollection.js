define( [
	'jquery', 'backbone', 'underscore', 'common/models/AgencyModel'],
function($, Backbone, _,AgencyModel) {
	var Collection = Backbone.Collection.extend({
		model : AgencyModel,
		url: "getApiData.htm",
		
		initialize: function(){},
		
		parse: function(response){
			return response.agencies;
		},
		
		fetch : function(options) {
			var params = {
                type: "post",
                cache: false,
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                data: JSON.stringify({
                    entity: "agencies",
                    operation: "other"
                }),
			};
           
			return Backbone.Collection.prototype.fetch.apply(this, [params]);			
        }
		
	});
	
	return Collection;
});
