define(["backbone", 'common/services/RemoteService'], function(Backbone,RemoteService){
  var AccountModel = Backbone.Model.extend({
	url : 'getApiData.htm',

	parse : function(results){
		if(!results.accounts)
			return results;
		var account = results.accounts[0];
		account.text = account.name;
		this.statistics = _.extend(this.statistics, results.statistics);
		return account;
	},
	
	statistics : {},

	fetch : function(options) {
		  var params = {
				  type: "post",
				  data: JSON.stringify({
					  'entity' : 'accounts', 
					  'operation' : 'get', 
					  'id' :this.id,
					  'queryString': 'statistics=true'
				  }),
				  cache: false,
				  contentType: 'application/json; charset=utf-8',
				  dataType: 'json'
		  };
		  console.log("fetching account", params)
		  return Backbone.Model.prototype.fetch.apply(this, [params]);
	
	}
		
  });
  
  return AccountModel;
})


