define(["jquery", "underscore", "backbone", "i18next", "components/dependentModels/collections/DependentModelCollection"],
function($, _, Backbone, i18next, DependentModelCollection){
  var DependentModelView = Backbone.View.extend({
	
    initialize : function(options){
        this.options = options || {};    
        
        this.labels = {
        		"FEEDBACK" : 'Advertiser Lookalike Audiences',
        		"DEMOGRAPHIC" : 'Data Partner Lookalike Audiences',
        		"SEGMENT" : 'Custom Audiences'
        };
        
        this.links = {
        		"FEEDBACK" : '#interaction',
        		"DEMOGRAPHIC" : '#demographics',
        		"SEGMENT" : '#segmentBuilder'
        };
        
        switch(options.entity){
        	case "activity" :
        		this.modelTypes = ["FEEDBACK", "SEGMENT"];
        		this.params = {accountId: this.options.accountId, activityId : this.options.activityId};
        		break;
	        case "dataPartner" :
	        	this.modelTypes = ["DEMOGRAPHIC", "SEGMENT"];
	        	this.params = {accountId: this.options.accountId, dataPartnerId : this.options.dataPartnerId};
	        	break;
	        case "dataSource":
	        	this.modelTypes = ["DEMOGRAPHIC", "SEGMENT"];
	        	this.params = {accountId: this.options.accountId, dataPartnerId : this.options.dataPartnerId, dataSourceId : options.dataSourceId};
	        	break;
	    };
    },

    render : function(){
    	this.$el.html('<i class="notched circle loading icon"></i>');
    	this.items = _.map(this.modelTypes, function(modelType){
    		var params = _.extend({modelType : modelType}, this.params);

    		return {
    			modelType : modelType,
    			collection : new DependentModelCollection(params)
    		}
    	}.bind(this));
    	
    	var promises = _.invoke(_.pluck(this.items, "collection"), 'fetchWithParams');
    	console.log(promises);
    	$.when.apply(this, promises).done(function(){
    		this.$el.html('<h5>Dependent Audiences</h5><div class="js-content ui middle aligned list"></div>');
    		_.each(this.items, function(item){
    			console.log("item", item);
    			var $item = $('<a class="item" href="'+ this.getLink(item) +'">' + this.labels[item.modelType] + ' (' + item.collection.length + ')</a>');
    			if(!item.collection.length){
    				$item.addClass('disabled');
    			}
    			this.$(".js-content").append($item);
    		}.bind(this));
    	}.bind(this));
    	
    	
    	return this;
    },
    
   	getLink : function(item){
   		var params;
   		var link;
		switch(item.modelType){
			case "FEEDBACK":
				params = {
				    s : 'all',
					actid : this.options.activityId, 
					dname : this.options.dependentName};
				link = "#interaction";
				break;
			case "DEMOGRAPHIC":
				params = {
				    s : 'all',
					dpid : this.options.dataPartnerId,
					dsid : this.options.dataSourceId, 
					dname : this.options.dependentName
				};
				link = "#demographic";
				break;
			case "SEGMENT":
				params = {
				    s : 'all',
					dpid : this.options.dataPartnerId,
					dsid : this.options.dataSourceId, 
					actid : this.options.activityId,
					dname : this.options.dependentName
				};
				link = "#segmentBuilder";
				break;
		}
		_.each(_.pairs(params), function(pair){
			if(typeof pair[1] != 'undefined')
				link += '/' + pair[0] + '=' + pair[1];
		})
		return link;
	}
   

  });

  return DependentModelView;
})
