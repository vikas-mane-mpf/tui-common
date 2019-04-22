define( [
	'jquery', 'backbone', 'underscore', 'common/models/AdvertiserModel'],
function($, Backbone, _,AdvertiserModel) {
	var Collection = Backbone.Collection.extend({
		model : AdvertiserModel,
		url: "getApiData.htm",
		
		initialize: function(options){
			this.accountId = options.accountId;
			this.indexed = options.indexed;
		},
		
		parse: function(response){
		    if(!this.indexed)
    			return response.advertisers;
    	    else{
    	        return _.filter(response.advertisers, function(a){
    	            return a.statistics.indexedActivities > 0;
    	        });
    	    }
		},
		
		fetch : function(options) {
		    var filterBy = "advertiser_status:A";
		    if(this.indexed){
		        filterBy += ';indexed=Y';
		    }
			var params = {
					type: "post",
					data: JSON.stringify({
						entity: "advertisers",
	                    operation: "list",
	                    accountId : this.accountId,
	                    queryString:"statistics=true&filterBy="+filterBy+"&searchBy=&rowsPerPage=0&pageNumber=0"
	                    //queryString:"filterBy=advertiser_status:A"
					}),
					cache: false,
	                contentType: 'application/json; charset=utf-8',
	                dataType: 'json'
			};
			console.log("fetching Advertisers", params);
			return Backbone.Collection.prototype.fetch.apply(this, [params]);			
         }
		
	});
	
	return Collection;
});
