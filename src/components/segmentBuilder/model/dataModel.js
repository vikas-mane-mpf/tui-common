define(["backbone"],function(Backbone){
	var Model = Backbone.Model.extend({
		url: "data/components/segmentBuilder/data/ComponentConfiguration.JSON",
		
		parse: function(resp){
			console.log(resp);
			return resp;
		}
	}); 
	
	return Model;
});