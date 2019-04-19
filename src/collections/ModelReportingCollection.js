define( [
	'jquery', 'backbone', 'underscore', 'models/ModelReportingModel'],
function($, Backbone, _,ModelReportingModel) {
	var Collection = Backbone.Collection.extend({
		model : ModelReportingModel,
		url: "getApiData.htm",
		
		initialize: function(options){
		
			this.accountId = options.accountId;
		},
		
		parse: function(response){		
			return response;
		},
		
		fetch : function(options) {
			var params = {
					type: "post",
					data: JSON.stringify({
						'entity' : 'accounts', 
						'operation' : 'get', 
						'id' : this.accountId,
						'queryString': 'statistics=modelReporting'}),
					cache: false,
	                contentType: 'application/json; charset=utf-8',
	                dataType: 'json'
			};
           	console.log("fetching accounts", params);
			return Backbone.Collection.prototype.fetch.apply(this, [params]);
			
         }
		
	});
	
	return Collection;
});
