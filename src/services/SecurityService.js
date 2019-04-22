define(['underscore', 'jquery', 'backbone', 'common/utils/Cookie', 'common/services/AccountService', 'common/services/RemoteService',  'common/services/CacheService', 'common/models/AccessTokenModel'],
function(_, $, Backbone, CookieUtil, AccountService, RemoteService, CacheService, AccessTokenModel){
	
	var SecurityService = function(){}

	_.extend(SecurityService.prototype, Backbone.Events, {

		LIST : "read_permitted",
    	GET : "read_permitted",
    	READ : "read_permitted",
    	ADD : "create_permitted",
    	CREATE : "create_permitted",
    	UPDATE : "update_permitted",
    	DELETE : "delete_permitted",
    	EXECUTE : "execute_permitted",

        ENTITY_SUPERUSER : "SUPERUSER",
    	ENTITY_ACCOUNTUSER : "ACCOUNTUSER",
    	ENTITY_REGULARUSER : "REGUSER",
    	ENTITY_ACCOUNT : "ACCOUNT",
    	ENTITY_ADVERTISER : "ADVERTISER",
    	ENTITY_ACTIVITY : "ACTIVITY",
    	ENTITY_DATA_SOURCE : "DATASOURCE",
    	ENTITY_DATA_PARTNER : "DATAPARTNER",
    	ENTITY_CAMPAIGN : "CAMPAIGN",
    	ENTITY_MODEL : "MODEL",
    	ENTITY_GLOBAL_SETTINGS : "TAG_GLOBAL_SETTINGS",
    	ENTITY_CROSS_ACCOUNT : "CROSS_ACCOUNT",
    	ENTITY_AUDIENCE_DISCOVERY : "AUDIENCE_DISCOVERY",
    	ENTITY_AUDIENCE_DISCOVERY_SUPER : "AUDIENCE_DISCOVERY_SUPER",
    	ENTITY_PARTNER_SYNC : "PARTNER_STATUS_REPORT",
    	ENTITY_AD_POPULATION : "AUDIENCE_DISCOVERY_POPULATION",
    	ENTITY_AD_DEVICES: "AUDIENCE_DISCOVERY_DEVICES",
    	ENTITY_AD_INTEREST: "AUDIENCE_DISCOVERY_INTEREST",
    	ENTITY_AD_HHI: "AUDIENCE_DISCOVERY_HHI",
    	ENTITY_AD_DSP_REACH: "AUDIENCE_DISCOVERY_DSP_REACH",
    	ENTITY_AUDIENCE_RELEVANCY: "AUDIENCE_RELEVANCY",
    	ENTITY_AUDIENCE_OVERLAP: "AUDIENCE_OVERLAP",

        token : new AccessTokenModel(),

		initialize : function(){
			return this.fetchPermissions();
		},

		fetchPermissions : function(){
		    var data = {
                "entity": "entityaccess",
                "operation": "other"
            };

		    return RemoteService.ajax({
                url : "getApiData.htm",
                data: JSON.stringify(data)
            }).then(
                function(response){
                    var privileges = response.privileges;
                    var permissions = [];
                    _.each(privileges, function(privilege){
                        var instance = _.omit(privilege, ["resource_conditions","resource_id"])
                        var accounts = privilege.resource_conditions;
                        _.each(accounts, function(account){
                            permissions.push(_.extend({accountKey : account.resource_id}, instance))
                        });
                    })

                    this.permissions = permissions;
                    var allAccounts = AccountService.getAccountCollection();
                    this.accountIds = _.uniq(_.pluck(permissions, "accountKey"));
                    if(!this.accountIds.length)
                        return $.Deferred().reject();
                }.bind(this)
            );
		},

		hasAccountAccess : function(accountId){
		    return this.accountIds.indexOf(String(accountId)) > -1;
		},

		hasRoleAccess : function(key, type, roles){
			if(!this.permissionsByKey && !roles)
				return false;

            var roles = roles.split(',');
            for ( var i in roles) {
                if (this.permissionsByKey[roles[i]]){
					console.log("Logged as ",roles[i]);
					return true;
                }
            }
            return false;

        },


		hasPermission : function(key, type, checkAccountStatus){
			if(!this.permissionsByKey)
				return false;
			
			if(checkAccountStatus && AccountService.getCurrentAccount().get("status") != "A")
				return false;

			var permissions = this.permissionsByKey[key] || {}
			return permissions[type] ? true : false;
		},	
		
		hasCrossAccountPermission : function(accountIds, key, type){
			var accountMap= {}
			 _.each(accountIds, function(accountId){ accountMap[String(accountId)] = accountId});

			var permissions = _.filter(this.permissions, function(permission){
				return accountMap[permission.accountKey] && permission.resource_type == key && permission[type];
			});
			return permissions.length == accountIds.length;
		},
		
		updatePermissions : function(){
			var account = AccountService.getCurrentAccount();
			var current = _.where(this.permissions, {accountKey : String(account.id)});
			this.permissionsByKey = _.indexBy(current, "resource_type");
			this.trigger("permissionsChanged");
		}

	
	});
	
	return new SecurityService();
});
