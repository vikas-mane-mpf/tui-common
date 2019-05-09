var URLS = require('../urls');

define( [
	'jquery', 'backbone', 'underscore', 'models/AgencyModel', 'services/SecurityService'],
function($, Backbone, _,AgencyModel, SecurityService) {
	var Collection = Backbone.Collection.extend({
		model : AgencyModel,
		
		initialize: function(){},
		
		parse: function(response){
			return response.data;
		},
		
		fetch : function(options) {
			var params = {
					type: "get",
					cache: false,
	                contentType: 'application/json; charset=utf-8',
					dataType: 'json',
					url: URLS.CORE_AGENCIES,
					headers: {
						Authorization: 'Bearer ' + SecurityService.token.get("access_token"),
					}
			};
           
			return Backbone.Collection.prototype.fetch.apply(this, [params]);			
         },

         fetchAgenciesByGeo: function(options){
            var params = {
                type: "get",
                cache: false,
                contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				headers: {
					Authorization: 'Bearer ' + SecurityService.token.get("access_token"),
				},
				url: URLS.AGENCY_BY_GEOID(options.geoId)
            };

            return Backbone.Collection.prototype.fetch.apply(this, [params]);
         },
		
	});
	
	return Collection;
});
