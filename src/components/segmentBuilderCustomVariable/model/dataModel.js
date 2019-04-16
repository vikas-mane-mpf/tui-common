define(["backbone"],function(Backbone){
	var Model = Backbone.Model.extend({
		url: "static/js/components/segmentBuilderCustomVariable/data/ComponentConfiguration.JSON",
		
		parse: function(resp){
			console.log(resp);
			return resp;
		}
	}); 
	
	return Model;
});