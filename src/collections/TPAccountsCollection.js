var URLS = require('../urls');

define( [
	'jquery', 'backbone', 'underscore', 'models/TPAccountsModel', 'services/SecurityService'],
function($, Backbone, _,TPAccountsModel, SecurityService) {
	var Collection = Backbone.Collection.extend({

        model: TPAccountsModel,

        initialize: function(){},

        parse: function(resp){

            return resp.data;
        },

        fetch: function(options){
            var params = {
                type: "get",
                cache: false,
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                url: URLS.CORE_ACCOUNTS,
                headers: {
					Authorization: 'Bearer ' + SecurityService.token.get("access_token"),
				},
            };
            return Backbone.Collection.prototype.fetch.apply(this, [params]);
        }
	});
    return Collection;
});