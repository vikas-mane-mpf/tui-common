define(['underscore', 'jquery', 'backbone', 'main/services/CacheService', 'main/services/RemoteService'], 
function(_, $, Backbone, CacheService, RemoteService, Abcdf){

	var ConfigService = function(){}
	
	_.extend(ConfigService.prototype, Backbone.Events, {
		
		configs : {},
		
		setConfig : function(id, config){
			this.configs[id] = config;
			CacheService.set(id, config);
		},
		
		getConfig : function(id){
			debugger
			return this.configs[id];
		},
		
		destroyConfig : function(id){
			CacheService.destroy(id);
			delete this.configs[id];
		},
		
		fetchSegmentConfig : function(){
			return RemoteService.ajax({
				url : "getConfig.htm", 
				data: JSON.stringify({"type": "segment"})
			}).then(function(response){		
				this.setConfig("rowConfigModel", response.configuration);
				this.setConfig("componentConfigModel", response.component);
				this.setConfig("megaDropdownModel", response.megadropdown);
				return response;
			}.bind(this));
			
		},
		
		fetchDemographicConfig : function(){
			return RemoteService.ajax({
				url : "getConfig.htm", 
				data: JSON.stringify({"type": "datapartner"})
			}).then(function(response){		
				this.setConfig("rowConfigModel", response.configuration);
				this.setConfig("componentConfigModel", response.component);
				this.setConfig("megaDropdownModel", response.megadropdown);
				return response;
			}.bind(this));
			
		},
		
		fetchModelConfig : function(){
			return RemoteService.ajax({
				url : "getConfig.htm", 
				data: JSON.stringify({"type": "model"})
			}).then(function(response){
				this.setConfig("rowConfigModelForModelling", response.configuration);
				this.setConfig("componentConfigModelForModelling", response.component);
				this.setConfig("megaDropdownModelForModelling", response.megadropdown);	
				return response;
			}.bind(this));
			
		},
		
		fetchAudienceIndexingConfig : function(){
			return RemoteService.ajax({
				url : "getConfig.htm", 
				data: JSON.stringify({"type": "audienceindex"})
			}).then(function(response){
				this.setConfig("rowConfigModelForAudienceIndexing",  response["configuration"]);
				this.setConfig("componentConfigModelForAudienceIndexing", response["component"]);
				this.setConfig("megaDropdownModelForAudienceIndexing", response["megadropdown"]);
				this.setConfig("atiViewConfig", response["config"]);
				return response;
			}.bind(this));
		},
		
		fetchSegmentOverlapConfig : function(){
			return RemoteService.ajax({
				"url" : "getConfig.htm", 
				"data": JSON.stringify({"type": "segmentoverlap"})
			}).then(function(response){
				this.setConfig("segmentOverlapConf",  response);
				return response;
			}.bind(this));
		},
		
		fetchFilterConfig : function(){
		    if(this.getConfig("selectboxdata")){
		        return $.Deferred().resolve().promise(this.getConfig("selectboxdata"));
		    }

			return RemoteService.ajax({
				url : "getConfig.htm", 
				data : JSON.stringify({"type": "filter"})
			}).then(function(response){
				this.setConfig("selectboxdata", response);
				this.setConfig("batchDeliveryOptions", response);
				return response;
			}.bind(this));
		},
		
		fetchConstantsConfig : function(){
			return RemoteService.ajax({
                //url : "/static/js/main/data/constants.json",
				url : "getConfig.htm",
				data: JSON.stringify({"type": "constants"})
			}).then(function(response){
				this.setConfig("constants", response);
				return response;
			}.bind(this));
			
		},
		
		fetchDataTypes : function(){
			return RemoteService.ajax({
				url : "getApiData.htm", 
				data : JSON.stringify({
					"entity": "datatypes",
					"operation": "other"    
				})
			}).then(function(response){
				var dataTypes = _.map(resonse.dataTypes, function(dataType){
					return {id : dataType.id, text : dataType.name};
				});
				this.setConfig("datatypes", dataTypes);
				return dataTypes;
			}.bind(this));
		}
		
	});
	
	var service = new ConfigService();
	return service;
});
