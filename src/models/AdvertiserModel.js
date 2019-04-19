define(["backbone", "i18next", "main/services/RemoteService"], function(Backbone, i18next, RemoteService){
  var AdvertiserModel = Backbone.Model.extend({
	  url : 'getApiData.htm',
	  
	  defaults : {
		 name : "",
		 notes : "",
		 status : "A",
		 accounts : []
	  },

	  hasDependentModels : function(){
	    return this.get('statistics') && this.get('statistics').models;
	  },
	  
	  parse : function(results){
		  var adv = results
		  if(results.advertisers){
			  adv = results.advertisers[0];
		  }
		  if(!adv.defaultAccount){
			  adv.defaultAccount = adv.accountKey;
		  }
		  if(!adv.accounts){
			  adv.accounts = [{accountKey : adv.accountKey}]
		  }
		  adv.existingAccounts = [].concat(adv.accounts);
		  return adv;
	  },
	  
	  validate : function(defaultAccountValue){
		  var errors = [];
		  if(this.get("name").trim() == ""){
			  errors.push({name : "name", message : i18next.t("app.PleaseEnterAdvertiserName")});
		  }
		  if(typeof this.get("agencyKey") == 'undefined'){
			  errors.push({name : "agencyKey", message : "Please select an Agency"});
		  }
		  if(this.get("isCrossAccount") == "Y" && defaultAccountValue == ''){
			  errors.push({name : "defaultAccount", message : i18next.t("app.PleaseselectDefaultAccount")})
		  }
		  this.trigger("validate", errors.length > 0 ? errors : false);
		  console.log("errors", errors);
	      return errors.length > 0 ? errors : false;
	  },

	  getDefaultAccountName : function(){
          var accountId = Number(this.get("defaultAccount"));
          console.log(accountId, this.get("accounts"));
          var account = _.findWhere(this.get("accounts"), {accountKey : accountId});

          return account.accountName;
      },

      getAccountIds : function(){
        return _.pluck(this.get("accounts"), "accountKey");
      },
	
	  
	  fetch : function(options) {
	  	  var operation = options && options.operation ? options.operation : "get";
	  	  var querystring = options && options.querystring ? options.querystring : 'statistics=true';
		  var params = {
				  type: "post",
				  data: JSON.stringify({
					  'entity' : 'advertisers', 
					  'operation' : operation, 
					  'id' :this.id,
					  "accountId": this.get("accountId") || this.get("accountKey"),
					  'queryString': querystring
				  }),
				  cache: false,
				  contentType: 'application/json; charset=utf-8',
				  dataType: 'json'
		  };
		  console.log("fetching account", params)
		  return Backbone.Model.prototype.fetch.apply(this, [params]);	
	},
	
	save : function(options){
		var createNewAdv = {
			"id": this.id,						
			"entity": "advertisers",
			"accountId": String(this.get("accountId") || this.get("accountKey")),
			"operation": !this.id ? "add" : "update",
			"input" : {}	
		};

		var input = createNewAdv.input;					
		input.name = this.get("name").trim();
		input.notes = this.get("notes").replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
            return '&#' + i.charCodeAt(0) + ';';
        }).replace(/&/gim, '&').trim();
		input.externalAdvertiserKey = "70709778";
        input.status = this.get("status");
    	input.agencyKey = String(this.get("agencyKey"));
    	input.isCrossAccount = this.get("isCrossAccount") || "N";
    	
    	if(this.get("tagGroupId")){
    		input.tagGroupId = this.get("tagGroupId");
            input.routingType = this.get("isCrossAccount") === 'Y' ? 'dynamic' : 'static';
    	}

    	this.set('accounts', _.filter(this.get("accounts"), function(account){ return account.accountKey != '' })); // Remove account : '', if found any

    	if(input.isCrossAccount == "Y"){
    		input.accounts = _.map(this.get("accounts"), function(account){return {accountKey : parseInt(account.accountKey)}});
    	}
    	
    	var updateGlobalSettings = this.get("isCrossAccount") == "Y" && ( this.get("existingAccounts").length != this.get("accounts").length || this.get("tagGroupId") );
    	var tagrUrl = updateGlobalSettings ? 'genericGlobalTagSettings' + ( this.get("tagGroupId") ? '/' + this.get("tagGroupId") : '') : 'genericGlobalTagSettings';

		input.tagr_api_adv_update = {
            url:  tagrUrl,
            accounts: _.map(input.accounts, function(account){return {id : parseInt(account.accountKey)}}),
            routingType : input.isCrossAccount === 'Y' ? 'dynamic' : 'static',
            defaultAccount: String(this.get("defaultAccount")),
            operation: createNewAdv.operation
        };
        
    	console.log("save", JSON.stringify(createNewAdv));

    	return RemoteService.ajax({
			url : "getApiData.htm", 
			data: JSON.stringify(createNewAdv)
		}).then(function(response){
			try{
				console.log("saved", response.advertisers[0].id)
				this.set("id", response.advertisers[0].id)
			}catch(e){}
				return response;
		}.bind(this))	

	}
 
  });
  
  return AdvertiserModel;
})


