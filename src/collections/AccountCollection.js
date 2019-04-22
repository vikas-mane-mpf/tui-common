define( [
	'jquery', 'backbone', 'underscore', 'models/AccountModel', 'services/SecurityService'],
function($, Backbone, _,AccountModel, SecurityService) {
	var Collection = Backbone.Collection.extend({
		model : AccountModel,
		  url: "getApiData.htm",
		//url: "static/js/data/agencycode.json",

		initialize: function(){
		
			
		},
		
		parse: function(response){
			//console.log(response);
			var resp = [],
				accounts = _.filter(response.accounts, function(account){
				    return SecurityService.hasAccountAccess(account.id);
				});
            console.log("accounts", accounts, response.accounts, SecurityService.accountIds);
			for(var i=0;i<accounts.length;i++){
				var obj = accounts[i];
				obj["text"] = accounts[i]["name"];
				//delete obj["name"];
				
				resp.push(obj);
			}
			
			accounts = null;
			
			return resp;
		},
		
		fetch : function(options) {
			var params = {
					type: "post",
					data: JSON.stringify({
						'entity' : 'accounts', 
						'operation' : 'list', 
						'queryString': 'statistics=true;rowsPerPage=0&pageNumber=0&filterBy=account_status:A;'}),
					cache: false,
	                contentType: 'application/json; charset=utf-8',
	                dataType: 'json'
			};
           console.log("fetching accounts", params);
			return Backbone.Collection.prototype.fetch.apply(this, [params]);
			
         }
		
	});
	
	return Collection;
});
