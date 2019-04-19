define( [
	'jquery', 'backbone', 'underscore', 'main/models/TPAccountsModel'],
function($, Backbone, _,TPAccountsModel) {
	var Collection = Backbone.Collection.extend({

        model: TPAccountsModel,

        initialize: function(){},

        url: "getCoreApiData.htm",

        parse: function(resp){

            return resp.data;
        },

        fetch: function(options){
            var params = {
                type: "post",
                cache: false,
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                data: JSON.stringify({"entity":"accounts","operation":"list","queryString":""})
            };
            return Backbone.Collection.prototype.fetch.apply(this, [params]);
        }
	});
    return Collection;
});