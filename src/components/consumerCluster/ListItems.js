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
        var listItems = Backbone.View.extend({
            angleStart: -360,
            initialize: function(options) {
                this.model = options.data || null;
            },
            render: function() {
                if (!this.model) return;

                var $listItems = '';
                var demographics = {};
                _.each(this.model, function(item, index) {
                    if (!demographics.hasOwnProperty(item.varRefName)) {
                        demographics[item.varRefName] = [];
                    }

                    demographics[item.varRefName].push(item.varValueRefName);
                });

                _.each(demographics, function (demographic, key) {
                    var list = "";
                    _.each(demographic, function (subCategory, index) {
                        if (key.toLowerCase() === "gender") {
                            list += '<span class="gender-rectangle">' +
                                '   <img src="static/js/components/consumerCluster/img/ic-'+subCategory.toLowerCase()+'.svg"/><span class="gender"> ' + subCategory + ' </span>' +
                                '</span> ';
                        } else {
                            list += '<span class="cluster-tag"><span>' + subCategory + '</span></span>';
                        }
                    });

                    $listItems +=  '<div class="list-item-rectangle ui segment widget pkgrid-item--width1 pkgrid-item--height1 cluster-card">' +
                        '   <div style="display:flex;flex-direction:column;height:100%;">' +
                        '       <div class="ui secondary menu"><h3 class="active section">' + key + '</h3></div>' +
                        '       <div class="">' + list + '</div>' +
                        '   </div>' +
                        '</div>';
                });

                return $listItems;
            },
        });
        return listItems;
    }
)