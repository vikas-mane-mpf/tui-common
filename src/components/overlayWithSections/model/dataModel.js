define(["backbone"],function(Backbone){
	var Model = Backbone.Model.extend({
		url: "static/js/components/overlayWithSections/data/megadropdown_Final_V1.json",
		
		parse: function(resp){
		
			return resp;
		}
	}); 
	
	return Model;
});