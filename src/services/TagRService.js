define(['underscore', 'jquery', 'backbone', 'i18next',
        'common/services/ConfigService', 
        'common/services/AccountService',
        'common/services/RemoteService',
        'common/services/ErrorService'],
function(_, $, Backbone, i18next,
		ConfigService, 
		AccountService, 
		RemoteService,
		ErrorService){

	var TagRService = function(){        	
	}
	
	_.extend(TagRService.prototype, Backbone.Events, {
		
		initialize : function(){
			
		},
		
		getFlagValue : function(key){
			return ConfigService.getConfig("constants").flags[key];
		},
		
		isTagrV2 : function(){
			return this.getFlagValue('tagrV2enabled') == "true";
		},
		
		isTagrV2UI : function(){
			return this.getFlagValue('tagrV2UIenabled') == "true";
		},
		
		isGenerateV2tags : function(){
			return this.getFlagValue('generateV2tags') == 'true';
		},

		isTagrV2UIPayload : function(){
            return this.getFlagValue('tagrV2UIPayloadenabled') == 'true';
        },
		
		getXaxisVisitorIdMacro : function(){
			return ConfigService.getConfig("constants").tag.xaxisVisitorIdMacro
		},
		
		replaceDomain: function(tag) {
            var name =  AccountService.getCurrentAccount().get("domain");
            return tag.replace("{$tagr.domain}", name);
        },
		
		createAdvertiserGlobalSettings : function(advertiser){
			var isCrossAccount = advertiser.get("isCrossAccount")=== 'Y';
			var accounts = _.filter(advertiser.get("accounts"), function(account){
				return account.accountKey != advertiser.accountId
			})
			var globalSettingsModel = new GlobalSettingsModel({
	            accountId: AccountService.getCurrentAccount().id,
	            advertiserId: advertiser.get("id"),
	            eventType: 'advertisers',
	            routingType: isCrossAccount ? 'dynamic' : 'static',
	            additionalPlatforms: [],
	            payloads: new PayloadCollection([]),
	            allowedTurbineAccounts: [],
	            advertisersAccounts: accounts
	        });

	        return globalSettingsModel.save(null, {
	            success: function(model, response) {
	                advertiser.tagGroupId = response.globalTagSettingsId;
	            }
	        });	
		},
		
		fetchDataPartnerTagTemplate : function() {
            var data = {
                "tagType": "datapartner_sync",
                "protocol": "http",
                "accountId":  AccountService.getCurrentAccount().id
            };
            return RemoteService.ajax({
                "url": "generateTag.htm",
                "dataType" : 'text',
                "data": JSON.stringify(data)
            }).then(function(response) {
                this.syncTag = this.replaceDomain(response);
            }.bind(this));
        },
        
        fetchXaxisIdTagTemplate: function() {
            var data = {
                "tagType": "datapartner_sync_xaxis",
                "protocol": "http",
                "accountId":  AccountService.getCurrentAccount().id
            };
            return RemoteService.ajax({
                "url": "generateTag.htm",
                "dataType" : 'text',
                "data": JSON.stringify(data)
            }).then(function(response) {
                this.syncXidTag = this.replaceDomain(response);
            }.bind(this));
        },
        
        fetchTagTemplate : function(visitorIdType, dataPartnerId, syncUrl, visitorId){
        	var xaxisParameter = {}
        	if(visitorIdType === 'Xaxis'){
        		xaxisParameter["syncUrl"] = syncUrl;
        		xaxisParameter["visitorId"] = visitorId;
        		if(syncUrl === undefined && visitorId === undefined){
        			return $.Deferred().resolve().promise();
        		}
        	}
        	var data = {
                "tagType": "datapartner_sync",
                "visitorIdType" : visitorIdType,
                "dataPartnerId" : dataPartnerId,
                "accountId":  AccountService.getCurrentAccount().id
            };
            var finalData = _.extend(data, xaxisParameter)
            return RemoteService.ajax({
                "url": "generateTag.htm",
                "dataType" : 'text',
                "data": JSON.stringify(finalData)
            }).then(function(response) {
            	if(visitorIdType === 'Xaxis'){
            		this.syncXidTag = response;
            	} else {
            		this.syncTag = response;
            	}

            }.bind(this));
        },

        fetchDataSourceTagTemplate: function() {
            var data = {
                "tagType": "datapartner_activity",
                "accountId":  AccountService.getCurrentAccount().id
            };
            return RemoteService.ajax({
                "url": "generateTag.htm",
                "data": JSON.stringify(data)
            }).then(function(response) {
               this.liveTag = this.replaceDomain(response);
            }.bind(this));
        },
        
        getDataSourceTagTemplate : function(){
        	return this.liveTag;
        },

        handleConnectivityError : function(){
            return ErrorService.showError({title : i18next.t("tagr.api_connection_error"), message : i18next.t("tagr.api_connection_error_msg")})
        }
		
		
    }
	
	);
	
	return new TagRService();
});
