define(['backbone', 'numeral',"i18next"], function(Backbone, numeral, i18next){
	var AudienceSizeBarModel = Backbone.Model.extend({
		defaults : {
			audience : null,	
			audienceSize : 0,
			maxAudienceSize : 0,
			showEstimated : false
		},

		initialize : function(options){
			options = options || {};

			this.set("peopleSize", +this.get("peopleSize"));
			this.set("totalIdsSize", +this.get("totalIdsSize"));
			this.set("desktopCookiesSize", +this.get("desktopCookiesSize"));
			this.set("mobileCookiesSize", +this.get("mobileCookiesSize"));			
			this.set("deviceIdsSize", +this.get("deviceIdsSize"));
			this.set("maxAudienceSize", +this.get("maxAudienceSize"));
			this.set("segmentBy", this.get("segBy"));
			this.set("modelType", this.get("type"));	
		},

		getStackDef : function(){
			var crossDeviceWidth = this.get("showCrossDevice")? this.get("crossDevice") : 0;

			var toPct = function(val){
				return 100 * (this.get("maxAudienceSize") ? val/this.get("maxAudienceSize") : 0);
			}.bind(this);

			var audienceSizeWidth = Math.min(this.get("previousSize"), this.get("audienceSize"));
			var changeWidth =  Math.abs(this.get("previousSize") - this.get("audienceSize"));

			return [
	    				{
	    					className: "stacked-progress-bar stacked-medium-green",
	    					pctWidth : toPct(this.filterSegmentBy(this.get("segmentBy")))
	    				}
	    				
	    			]

		},

		filterSegmentBy : function(segementBy){ 
	      switch(segementBy){
	        case "people" :
	          	return this.get("peopleSize");
	          	break;
	        case "totalIds" :
	          	return this.get("totalIdsSize");
	          	break;
	        case "desktopCookies" :
	          	return this.get("desktopCookiesSize");
	          	break;
	        case "mobileCookies" :
	          	return this.get("mobileCookiesSize");
	          	break;
	        case "deviceIds" :
				return this.get("deviceIdsSize");
	          	break;       
	        default:
		    	return this.get("peopleSize");         
	      }
	    },

		getFinalConversion : function(){
			var converttostring = this.get("audienceSize").toString();

			if(converttostring.length >= 4)
			{               	
				var convert = numeral(this.get("audienceSize")).format("0.00");
				var finalconversion = numeral(convert).format("0.00a").toUpperCase();
				finalconversion = finalconversion == "0.00" ? 0 : finalconversion;
			}else{
				var finalconversion = this.get("audienceSize");
			}

			finalconversion = finalconversion + " (" + numeral(this.get("overallChange")).format("0.00") + "%)";
			return finalconversion;
		}

	});

	return AudienceSizeBarModel;
})
