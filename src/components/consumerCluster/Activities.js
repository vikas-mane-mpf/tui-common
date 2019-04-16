define(
    [
        "jquery",
        "underscore",
        "backbone"
    ],
    function(
        $,
        _,
        Backbone
    ) {
        var Activities = Backbone.View.extend({
            angleStart: -360,
            initialize: function(options) {
                this.model = options.data || null;
            },
            render: function() {
                if (!this.model) return;

                var $listItems = '<div class="ui doubling four column grid">';

                _.each(this.model, function(item, index){
                    $listItems +=  '<div class="column digital-item"><span class="activities-name">'+item.name+'</span></div>';
                });
                $listItems +=  '</div>';
                return $listItems;
            },
        });
        return Activities;
    });