define(["backbone", 'services/RemoteService'], function(Backbone,RemoteService){
  var ModelReportingtModel = Backbone.Model.extend({
	url : 'getApiData.htm',

	parse : function(results){
		return results;
	},
	
	statistics : {},

	fetch : function(options) {
		  var params = {
				  type: "post",
				  data: JSON.stringify({
					  'entity' : 'accounts', 
					  'operation' : 'get', 
					  'id' :this.id,
					  'queryString': 'statistics=modelReporting'
				  }),
				  cache: false,
				  contentType: 'application/json; charset=utf-8',
				  dataType: 'json'
		  };
		  console.log("fetching model reporting", params)
		  return Backbone.Model.prototype.fetch.apply(this, [params]);
	
	}
		
  });
  
  return ModelReportingtModel;
})


