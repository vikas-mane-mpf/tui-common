define(['underscore','backbone','jquery'], 
	function(_, Backbone, $){

		var StackedBarView = Backbone.View.extend({
			tagName : "div",
			className : "stacked-bar-container",

			render : function(){
				var stack = this.model.getStackDef();
				this.$el.empty();
				_.each(stack, function(item){
					if(item.pctWidth){
						var child = $('<div class="stacked-bar '+item.className+'" ' + (item.tooltip ? 'data-html="'+item.tooltip+'"' :  '') + '" style="width:' + item.pctWidth + '%"></div>')
						
						this.$el.append(child);
					}
				}.bind(this));
				return this;
			},

			getTooltip : function(content){
				return {
					tooltipClass: "stacked-bar-tooltip",
					track: true,
	                position: {
	                    my: "center bottom-10",
	                    at: "center top",

	                },
	                content: content
				};
			}

		});

		StackedBarView.initTooltips = function(items){
			items = items || $('.stacked-bar[data-title]');
			items.popup();
		}

		return StackedBarView;
});
