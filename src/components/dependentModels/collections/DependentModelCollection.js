define(["backbone"], function(Backbone){
  var DependentModelCollection = Backbone.Collection.extend({
		url: "getModelData.htm",
		
		initialize : function(options){
			this.options = options;
		},
		
		getFetchParams : function(){
			return {
				type: 'post',
	            cache: false,
	            contentType: 'application/json; charset=utf-8',
	            dataType: 'json',	                    
				data : JSON.stringify({
					"accountId" : this.options.accountId,
					"entity": "models",
		            "operation": "list",
		            "option" : this.options.modelType,
		            "dataPartnerId": this.options.dataPartnerId,
	               	"dataSourceId": this.options.dataSourceId,
	               	"activityId": this.options.activityId
				})
			}
		},
		
		fetchWithParams : function(){
			return this.fetch(this.getFetchParams());
		},
		  
		parse: function(response) {
			return response.models;
		},
		
  });

  return DependentModelCollection;
})
