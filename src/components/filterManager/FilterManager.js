define(["underscore", "jquery", "backbone"], function(_, $, Backbone){
	
	var FilterManager = function(options){
		options = options || {};
		this.activeFilters = options.activeFilters || {};
		if(options.filterString){
			this.setFilterString(options.filterString);
		}
	}
	
	FilterManager.getByValue = function(collection, value){
		return _.findWhere(collection, {value : value});
	}
	
	FilterManager.extend = Backbone.View.extend;
	
	FilterManager.prototype = {
		constructor : FilterManager,
			
		getFilter : function(key){
			return this.activeFilters[key];
		},
		
		
		setFilter : function(key, value){
			this.activeFilters[key] = value;
		},
		
		mergeFilters: function(filters){
			_.extend(this.activeFilters, filters);
		},

		getFilterString : function(){
			return _.map(_.keys(this.activeFilters), this.getFilterStringForKey.bind(this)).join("&");
		},
		
		setFilterString : function(filterString){
			var serializedFilters = filterString.split("&");
			_.each(serializedFilters, function(serializedFilter){
				var parts = serializedFilter.split("=");
				this.activeFilters[parts[0]] = parts[1];
			}.bind(this));
		}
		
	}
	
	
	return FilterManager;
})