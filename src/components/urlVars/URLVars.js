define( [
	'jquery', 'backbone', 'underscore' 
],
function($, Backbone, _) {
	var URLVars = Backbone.Model.extend({
		
		constructor: function(varDefs) {	    
		    Backbone.Model.apply(this, []);
		    this.registerVars(varDefs);		    
		    this.readFromUrl();
		    
		    this.on("change", function(){
		    	this.writeToUrl();
		    }.bind(this));
		},
		  
		registerVars : function(varDefs){
			console.log("registering veters");
			this.registeredVars = varDefs;
			var defaults = {};
			_.each(this.registeredVars, function(varDef) {
				defaults[varDef.name] = varDef.defaultValue;
			});
			this.set(defaults);
		},
		
		pickByTags : function(tags){
			var varDefs = [];
			_.each(tags, function(tag){
				var varDefsWithTag = _.filter(this.registeredVars, function(varDef){
					var tags = varDef.tags || [];
					return tags.indexOf(tag) > -1;
				}.bind(this));
				varDefs = _.union(varDefs, varDefsWithTag);
			}.bind(this));
			return this.pick(_.pluck(varDefs, "name"));
		},
		
		writeToUrl : function(){
			var path = Backbone.history.getFragment();
			var pathComponents = path.split("/");
			pathComponents = _.filter(pathComponents, function(pathComponent){
				if(pathComponent.indexOf("=") == -1){
					return true;
				}
				var parts = pathComponent.split("=");
				if(parts > 2){
					return true;
				}
				if(_.findWhere(this.registeredVars, {alias : parts[0]})){
					return false;
				}
				return true;
			}.bind(this));
			
			_.each(this.registeredVars, function(varDef){
				if(this.has(varDef.name) && String(this.get(varDef.name)).length && this.get(varDef.name) != varDef.defaultValue){
				   // if(_.contains(pathComponents, this.get(varDef.name))) return;
					pathComponents.push(varDef.alias + "=" + encodeURIComponent(this.get(varDef.name)))
				}				
			}.bind(this));
			path = pathComponents.join("/");
			Backbone.history.navigate(path, {replace : true});
			console.log("writeToUrl", path);

		},
		
		readFromUrl : function(){
			console.log("readFromUrl");
			var path = window.location.hash;
			var pathComponents = path.split("/");
			
			var values = {};
			
			_.each(pathComponents, function(pathComponent){
				if(pathComponent.indexOf("=") == -1){
					return;
				}
				var parts = pathComponent.split("=");
				if(parts > 2){
					return;
				}
				var varDef = _.findWhere(this.registeredVars, {alias : parts[0]});
				if(varDef){
					values[varDef.name] = decodeURIComponent(parts[1]);
				}
			}.bind(this));

			console.log("setting value", values);
			
			this.set(values);
		}
	});
	
	return URLVars;
});
