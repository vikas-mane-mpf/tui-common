define( [
	'jquery', 'backbone', 'underscore', 'main/models/DeliveryPlatformModel'],
function($, Backbone, _,DeliveryPlatformModel) {
	var Collection = Backbone.Collection.extend({
		model : DeliveryPlatformModel,
		url: "getApiData.htm",
		
		initialize: function(){},
		
		parse: function(response){
			return _.map(response.externalMappings, function(item){
				var platform = {
						id : item.excPlatformId, 
						text : item.excPlatformName, 
						code : item.excPlatformCode
				};

				platform.parameters = _.map(item.parameters, function(param){
					return {id : param.parameterId,text : param.parameterName};
				});
				return platform;
			}.bind(this));
		},
		
		fetch : function(options) {
			var params = {
					type: "post",
					data: JSON.stringify({
						entity: "externalmappings",
	                    operation: "other"
					}),
					cache: false,
	                contentType: 'application/json; charset=utf-8',
	                dataType: 'json'
			};
           
			return Backbone.Collection.prototype.fetch.apply(this, [params]);
			
         }
		
	});
	
	return Collection;
});
