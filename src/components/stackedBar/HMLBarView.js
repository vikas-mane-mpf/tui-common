define(['underscore','backbone','jquery',
    'components/stackedBar/HMLStackedBarView',
    'text!components/stackedBar/AudienceSizeBarViewTpl.html',
    'components/stackedBar/AudienceSizeBarModel',
    'numeral'],
	function(_, Backbone, $, StackedBarView, audienceSizeBarViewTpl, AudienceSizeBarModel, numeral){
    var HMLBarView = Backbone.View.extend({

      template : _.template(audienceSizeBarViewTpl),

      initialize : function(){
        this.barView = new StackedBarView({model : this.model});
        this.listenTo(this.model, "change", this.renderBar.bind(this))
      },

      cacheDom : function(){
        this.$barContainer = this.$('.bar-container');
        this.$total = this.$('.size');
        this.$change = this.$('.overall-change');
      },

      render : function(){
        this.$el.html(this.template());
        this.cacheDom();
        this.renderBar();       
        return this;
      },
      
      renderBar : function(){
    	  this.$barContainer.empty().append(this.barView.render().$el);
        if(this.model.get('status')){
          this.$total.text(numeral(this.model.get("lowAudSize")).add(numeral(this.model.get("medAudSize"))).add(numeral(this.model.get("highAudSize"))).format('0.[0]a').toUpperCase());  
        } else {
          this.$total.html('&nbsp;');
        }    	  
      }
    });
    
    HMLBarView.initTooltips = StackedBarView.initTooltips;

    return HMLBarView;
  }
)
