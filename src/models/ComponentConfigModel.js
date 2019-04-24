define(["backbone"],function(Backbone){
	var Model = Backbone.Model.extend({
		url: function(){
			return "";
		},
				
		initialize: function(){
			
		},
		
		setOptions: function(){},
		
		parse: function(resp){
			
			var m = resp["activityIntervalSelection"];
			
			for(var k = 0;k<m.options.length;k++){
				m.options[k]["id"] = m.options[k]["value"];
				m.options[k]["text"] = m.options[k]["name"];
				for(var p=0;p<m.options[k]["options"].length;p++){
					m.options[k]["options"][p]["id"] = m.options[k]["options"][p]["value"];
					m.options[k]["options"][p]["text"] = m.options[k]["options"][p]["name"];
				}
			}
			
			
			return resp;
		},
		
		fetch : function(optionVal) {         
			
			var reqData = {					
			};
			
			return Backbone.Model.prototype.fetch.apply(this, [{
				type:"post",
				data:JSON.stringify(reqData),
				contentType: 'application/json; charset=utf-8',
				//url: "getDashboardData.htm",
				url: "static/js/segmentBuilder/data/Components_Final_V1.JSON",
				dataType: 'json',
				timeout: 600000
			}]);    
           
        }
		
		
	}); 
	
	return Model;
});