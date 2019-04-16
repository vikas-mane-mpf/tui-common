define([
        'jquery',
        'underscore',
        'backbone'
    ],
    function($, _,Backbone) {
        var ValidationUtil= Backbone.Model.extend({
        	
        	defaults : function(){
        		var keys = _.keys(this.config);
        		var result = {};
        		_.each(keys, function(key){
        			result[key] = '';
        		})
        		return result;
        	},
        	
        	initialize : function(options){
        		this.config = options.config;
        		this.updateDependencies();
        		this.setModel(options.model);
        		this.setView(options.view);
        		
        		this.unset("model");
        		this.unset("config");
        	},
        	
        	setView : function(view){
        		var errors = _.keys(this.config);
        		
        		view.bindingSources = view.bindingSources || {};
        		view.bindingSources.error = function() { return this }.bind(this);

        		view.bindings = view.bindings || {};
        		_.each(errors, function(error){
        			view.bindings['[data-error="'+ error +'"]'] = "error:error_" + error;
        		});
        		
        		view.bindingHandlers = view.bindingHandlers || {};
        		view.bindingHandlers.error = function( $element, value ) {
        			console.log("element", $element);
        			if($element)
        				$element.text(value).toggle(value != '');;
		        };
        		
        		console.log("bindings", view.bindings);				
        	},
        	
        	setModel : function(model, config){
        		this.model = model;
        		this.updateListeners();
        		this.set(this.defaults());
        	},
        	
        	updateDependencies : function(){
        		var dependencies = {};
        		_.each(_.keys(this.config), function(error){
        			var attributes = this.config[error];
        			_.each(attributes, function(attribute){
        				dependencies[attribute] = dependencies[attribute] || [];
        				dependencies[attribute].push(error);
        			}.bind(this));
        		}.bind(this));
        		this.dependencies = dependencies;
        	},
        	
        	updateListeners : function(){
        		this.stopListening();
        		this.listenTo(this.model, "validate", this.handleValidation);  
        		_.each(_.keys(this.dependencies), function(attribute){
        			console.log("updateListeners", attribute)
        			this.listenTo(this.model, "change:" + attribute, function(){
        				var dependencies = this.dependencies[attribute];
        				_.each(dependencies, function(dependency){
        					console.log("clearing dependency", dependency);
        					this.set(dependency, '');
        				}.bind(this))
        			}.bind(this)); 
        		}.bind(this));
        	},
        	
        	handleValidation : function(errors){
        		console.log("handleValidation",errors);
        		var byName = _.object(_.map(errors, function(error){ return [error.name, error.message]}));
        		console.log("handleValidation", errors, byName, this);
        		
        		this.set(this.defaults());
        		this.set(byName);
        	},

        });
        
        return ValidationUtil;
	});
        