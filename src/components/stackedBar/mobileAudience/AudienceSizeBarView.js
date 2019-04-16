define(['underscore','backbone','jquery',
    'components/stackedBar/mobileAudience/StackedBarMobileView',
    'text-loader!components/stackedBar/mobileAudience/AudienceSizeBarViewTpl.html',
    'components/stackedBar/mobileAudience/AudienceSizeBarModel',
    'numeral'],
  function(_, Backbone, $, StackedBarMobileView, audienceSizeBarViewTpl, AudienceSizeBarModel, numeral){
    var AudienceSizeBarView = Backbone.View.extend({

      template : _.template(audienceSizeBarViewTpl),

      initialize : function(){
        this.barView = new StackedBarMobileView({model : this.model});
        this.listenTo(this.model, "change", this.renderBar.bind(this));
      },

      cacheDom : function(){
        this.$barContainer = this.$('.bar-container');
        this.$total = this.$('.size');
      },

      render : function(){
        this.$el.html(this.template());
        this.cacheDom();
        this.renderBar();       
        return this;
      },
      
      renderBar : function(){
        this.$barContainer.empty().append(this.barView.render().$el);
        this.$total.text(numeral(this.model.get("audienceSize")).format('0.[0]a').toUpperCase());
      }
    });
    
    AudienceSizeBarView.initTooltips = StackedBarMobileView.initTooltips;

    return AudienceSizeBarView;
  }
)
