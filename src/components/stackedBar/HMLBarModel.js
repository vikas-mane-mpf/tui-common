define(['backbone', 'numeral',"i18next"], function(Backbone, numeral, i18next){
	var HMLBarModel = Backbone.Model.extend({
		defaults : {
			audience : null,
		 	highAudSize: 0,
          	medAudSize: 0,
          	lowAudSize: 0
		},

		initialize : function(options){
			options = options || {};
			/* make numeric */			
			this.set("highAudSize", +this.get("highAudSize"));
			this.set("lowAudSize", +this.get("lowAudSize"));
			this.set("medAudSize", +this.get("medAudSize"));
			this.set("maxAudienceSize", +this.get("maxAudienceSize"));
			this.set("modelType", this.get("type"));			
		},

		getStackDef : function(){
			var crossDeviceWidth = this.get("showCrossDevice")? this.get("crossDevice") : 0;
			var additionalHighClass, additionalMedClass, additionalLowClass;
			switch (this.get("modelType")) {
			    case "interest":
			        additionalHighClass = "stacked-high-green";
			        additionalMedClass = "stacked-medium-green";
			        additionalLowClass = "stacked-low-green";
			        break; 
			    case "predictive":
			        additionalHighClass = "stacked-high-blue";
			        additionalMedClass = "stacked-medium-blue";
			        additionalLowClass = "stacked-low-blue";
			        break; 
		        case "intent":
			        additionalHighClass = "stacked-high-purple";
			        additionalMedClass = "stacked-medium-purple";
			        additionalLowClass = "stacked-low-purple";
			        break;
			    default: 
			        additionalHighClass = "";
			        additionalMedClass = "";
			        additionalLowClass = "";
			}

			var toPct = function(val){
				return 100 * (this.get("maxAudienceSize") ? val/this.get("maxAudienceSize") : 0);
			}.bind(this);

			if(!this.get('status')){
				return  [
							{	
								className: "stacked-progress-bar",
								pctWidth: 100
							}
						]

			} else {
				return [
	    				{
	    					className: "stacked-progress-bar "+ additionalHighClass,
	    					pctWidth : toPct(this.get("highAudSize"))
	    				},
	    				{
	    					className: "stacked-progress-bar "+ additionalMedClass,
	    					pctWidth : toPct(this.get("medAudSize"))
	    				},
	    				{
	    					className: "stacked-progress-bar "+ additionalLowClass,
	    					pctWidth : toPct(this.get("lowAudSize"))
	    				}
	    			]				
			}			
			
		}

	});

	return HMLBarModel;
})
