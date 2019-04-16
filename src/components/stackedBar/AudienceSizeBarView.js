define(['underscore','backbone','jquery',
    'components/stackedBar/StackedBarView',
    'text-loader!components/stackedBar/AudienceSizeBarViewTpl.html',
    'components/stackedBar/AudienceSizeBarModel',
    'numeral'],
  function(_, Backbone, $, StackedBarView, audienceSizeBarViewTpl, AudienceSizeBarModel, numeral){
    var AudienceSizeBarView = Backbone.View.extend({

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
        this.$total.text(numeral(this.model.get("audienceSize")).format('0.[0]a').toUpperCase());
          this.$change.text(numeral(this.model.get("overallChange")).format('0.[0]%').toUpperCase());
      }
    });
    
    AudienceSizeBarView.initTooltips = StackedBarView.initTooltips;

    return AudienceSizeBarView;
  }
)
