define(['backbone', 'numeral',"i18next"], function(Backbone, numeral, i18next){
	var AudienceSizeBarModel = Backbone.Model.extend({
		defaults : {
			audience : null,
			crossDevice : 0,
			audienceSize : 0,
			audienceChange : 0,
			previousSize : 0,
			estimatedSize : 0,
			maxAudienceSize : 0,
			overallChange : 0,
			showEstimated : false
		},

		initialize : function(options){
			options = options || {};
			/* make numeric */
			this.set("crossDevice", +this.get("crossDevice"));
			this.set("audienceSize", +this.get("audienceSize"));
			this.set("audienceChange", +this.get("audienceChange"));
			this.set("previousSize", +this.get("previousSize"));
			this.set("estimatedSize", +this.get("estimatedSize"));
			this.set("maxAudienceSize", +this.get("maxAudienceSize"));
			this.set("overallChange", +this.get("overallChange"));

			if(this.get("audienceSize")) console.log("ATTRIBUTES", this.attributes);

			/* set previousSize if only change is set */
			if(!this.get("previousSize")){
				this.set("previousSize", this.get("audienceSize") - this.get("audienceChange"));
			}

			this.set("crossDevicePct", Math.round(10000 * this.get("crossDevice")/this.get("audienceSize"))/100);
			console.log("estinmated size", this.get("estimatedSize"));
		},

		getStackDef : function(){
			var crossDeviceWidth = this.get("showCrossDevice")? this.get("crossDevice") : 0;

			var toPct = function(val){
				return 100 * (this.get("maxAudienceSize") ? val/this.get("maxAudienceSize") : 0);
			}.bind(this);


			if(this.get("showEstimated")){
				var audienceSizeWidth = this.get("audienceSize");
				var estimatedSizeWidth = this.get("estimatedSize") ?  this.get("estimatedSize") - this.get("audienceSize") : 0;
				console.log("estimatedSizeWidth", estimatedSizeWidth, this.get("estimatedSize"), this.get("audienceSize"));
				return [
						{
							className: "stacked-bar-cross-device",
							pctWidth : toPct(crossDeviceWidth),
							tooltip : "Cross-Device Reach: " + this.get("crossDevicePct") + "%"
		    			},
						{
							className: "stacked-bar-primary",
							pctWidth : toPct(audienceSizeWidth)
						},
						{
							className: "stacked-bar-estimate",
							pctWidth : toPct(estimatedSizeWidth),
							tooltip : _.template(i18next.t("app.expectedAudSizeTooltip"), {"expectedAudienceSize": numeral(this.get("estimatedSize")).format("0.[00]a").toUpperCase()})
    		    	
						}

			        ]

			}else{

				var audienceSizeWidth = Math.min(this.get("previousSize"), this.get("audienceSize"));
				var changeWidth =  Math.abs(this.get("previousSize") - this.get("audienceSize"));

				return [
	    				{
	    					className: "stacked-bar-cross-device",
	    					pctWidth : toPct(crossDeviceWidth),
	    					tooltip : "Cross-Device Reach: " + this.get("crossDevicePct") + "%"
	    				},
	    				{
	    					className: "stacked-bar-primary " + (this.get("previousSize") >= this.get("audienceSize") ? "stacked-bar-end" : ""),
	    					pctWidth : toPct(audienceSizeWidth)
	    				} ,

	    				{
	    					className: (this.get("previousSize") > this.get("audienceSize")) ? "stacked-bar-under" : "stacked-bar-over stacked-bar-end",
	    					pctWidth : toPct(changeWidth)
	    				}
	    			]

			}

			return stack;
		}		,
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
