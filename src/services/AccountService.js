define(['underscore', 'jquery', 'backbone', 'services/CacheService', 'collections/AccountCollection'], 
function(_, $, Backbone, CacheService, AccountCollection){

	var AccountService = function(){}
	
	_.extend(AccountService.prototype, Backbone.Events, {
		
		initialize : function(reset){
			if(!reset && this.accountCollection){
				return;
			}
			if(reset){
			    this.accountCollection = null;
			    this.currentAccount = null;
			}
			
			this.accountCollection = new AccountCollection();
			
			return this.accountCollection.fetch().then(function() {
				var defer = $.Deferred();
				var accountId = CacheService.get("accountId");
				var account;
				if(accountId){
					account = this.accountCollection.findWhere({id : accountId});	   
				}
				
				this.currentAccount = (account || (this.accountCollection.length > 0 && this.accountCollection.at(0) || null));
				console.log("currentaccount", this.currentAccount);
				
				if(this.currentAccount) return defer.resolve(this.currentAccount.fetch());
				else return defer.reject("EMPTY_ACCOUNTS_LIST");
			}.bind(this));
		},

		
		getAccountCollection : function(){
			return this.accountCollection;
		},

		getAccount : function(id){
			return this.accountsCollection.find({ id: parseInt(id) });			
		},
		
		getCurrentAccount : function(){
			return this.currentAccount;
		},		

		getAccountsForSharing : function(){
			return this.accountCollection.filter(function(account){ return account.get('masterAccountId') === this.currentAccount.get('masterAccountId') && account.id !== this.currentAccount.id  }.bind(this));
		},
		
		changeAccount : function(accountId){
			var account = this.accountCollection.find({id : accountId});
			
			if(account){
				this.currentAccount = account;
				CacheService.set("accountId", account.id);
				CacheService.set("currentAccountStatus", account.get("status"));
				CacheService.set("agencyCode", account.get('agencyCode'));
				this.trigger("accountChanged");
			}
		},

		isEditableSharedEntity: function(isShared, ownerAcKey){
		    if(isShared)
		        return this.currentAccount.id === ownerAcKey;

		    return true;
		}
	
	});
	
	var service = new AccountService();
	return service;
});
