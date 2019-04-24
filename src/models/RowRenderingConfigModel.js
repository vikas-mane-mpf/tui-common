define(["backbone"],function(Backbone){
	var Model = Backbone.Model.extend({
		url: function(){
			return "";
		},
				
		initialize: function(){
			
		},
		
		setOptions: function(filterBy, searchBy){
			
			if(searchBy){
				this.searchBy = searchBy;
			}
			
			if(filterBy){
				this.filter1 = filterBy["filter1"];
				this.filter2 = filterBy["filter2"];
				this.filter3 = filterBy["filter3"];
				this.filter4 = filterBy["filter4"];
			}
			
		},
		
		parse: function(resp){
			return resp;
		},
		
		fetch : function(optionVal) {         
			
			var reqData = {					
			};
			
			return Backbone.Model.prototype.fetch.apply(this, [{
				type:"post",
				data:JSON.stringify(reqData),
				contentType: 'application/json; charset=utf-8',
				//url: "getSegmentConfig.htm",
				url: "static/js/segmentBuilder/data/UISegmentConfig.json",
				//url: "static/js/segmentBuilder/data/Configuration_Final_V1.JSON",
				dataType: 'json',
				timeout: 600000
			}]); 
			   
        },
        
        getCurrentLevel: function(){
        	return this.currentLevel;
        },
        
        renderNextComponent: function(option){
        	
        	this.option = option || this.option;        	
        	
        	if(this.currentLevel){
        		if(this.currentLevel["next"]){
        			this.currentLevel = this.currentLevel["next"];
        			return this.currentLevel["next"];
        		}else{
        			return null;
        		}
        	}
        	
        	
        	var tokens = this.option[0].split("."),
        		topSection = tokens[0],
        		data = this.get(topSection),
        		str = tokens[1];
        	
        	if(tokens && tokens[1] == "others"){
        		str = "other observed attributes";
        	}
        	
        	this.firstLevel = data[0][str.toLowerCase()];
        	if(this.firstLevel){
        		this.secondLevel = _.findWhere(this.firstLevel, {"attributeName": tokens[2].trim()});
        		if(this.secondLevel){
        			this.currentLevel = this.secondLevel;
        			
        			if(this.currentLevel["next"]){
        				return this.currentLevel["next"];
        			}else{
            			return null;
            		}
        		}
        	}
        		
        	
        },
        
        resetVars: function(){
        	this.currentLevel = undefined;
        },
        
        getParentObject: function(tokenizedVal){
        	var tokens = tokenizedVal.split("."),
	    		topSection = tokens[0];
        	
        	if(tokens[1] == "others"){
        		tokens[1] = "other observed attributes";
        	}
        	
	    	var	data = _.findWhere(this.get(topSection)[0][tokens[1].toLowerCase()], {"attributeName": tokens[2].trim()});
        	return data;
        }
		
		
	}); 
	
	return Model;
});