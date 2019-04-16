define(
    [
        "jquery",
        "underscore",
        "backbone",
        "components/consumerCluster/iconModel"
    ],
    function(
        $,
        _,
        Backbone,
        iconModel
    ) {
        var DigitalBehaviors = Backbone.View.extend({
            angleStart: -360,
            initialize: function(options) {
                this.model = options.data || null;
                this.sumDigitalBehaviorId = options.sumDigitalBehaviorId || null;
                this.digiBehaviors = options.digiBehaviors || null;
                this.icon = new iconModel();
            },
            render: function() {
                if (!this.model) return;

                return this.icon.fetch().then(function(res){
                    var $listItems = '<div class="ui doubling four column grid">';
                    _.each(this.model, function(item, index){
                        $listItems +=  '<div class="column digital-item">' +
                            '   <img src="static/js/components/consumerCluster/img/'+this.icon.formatName(item.category)+'.svg" class="ic_set"><span>'+item.category+'</span>' +
                            '</div>';
                    }.bind(this));
                    this.$listItems +=  '</div>';
                    return $listItems;
                }.bind(this));
            }
        });
        return DigitalBehaviors;
    });