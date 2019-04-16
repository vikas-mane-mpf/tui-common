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
        IconModel
    ) {
        var Technographics = Backbone.View.extend({
            angleStart: -360,
            initialize: function(options) {
                this.type = options.type || null;
                if(this.type === 'OS'){
                    this.model = options.dataOS || null;
                } else {
                    this.model = options.data || null;
                }
            },
            render: function() {
                if (!this.model) return;

                var $listItems = '';
                var iconModel = new IconModel();
                _.each(this.model, function(item, index){
                    $listItems += '<span class="gender-rectangle"><img src="static/js/components/consumerCluster/img/'+iconModel.formatName(item.name)+'.svg"></i><span class="gender"> ' + item.name + ' </span></span> ';
                }.bind(this));
                return $listItems;
            }
        });
        return Technographics;
    }
);