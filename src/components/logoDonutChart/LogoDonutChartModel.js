/**
 * Created by Jerome.Champigny on 2/21/2017.
 */

define(
    [
        "jquery",
        "underscore",
        "backbone",
        "numeral"
    ],
    function(
        $,
        _,
        Backbone,
        Numeral
    ){
        var LogoDonutChartModel = Backbone.Model.extend({
            mockEnabled: true,
            // mockUrl: 'data/components/logoDonutChart/data/logoDonutChart.json',
            liveUrl: 'getWidgetData.htm',
            widgetId: 'DeviceBreakdown',
            deviceTypes: [],
            initialize: function(options){
                this.mockEnabled = options.mockEnabled;
                this.account = options.account;
                this.colors = options.colors;
                this.hoverColors = options.hoverColors;
            },
            fetch: function(options) {
                if (this.mockEnabled) {
                    this.url = this.mockUrl;
                    return Backbone.Model.prototype.fetch.apply(this);
                }

                this.url = this.liveUrl;

                var params = {
                    type: 'post',
                    data: JSON.stringify({
                        'accountId': this.account.id,
                        'widget': this.widgetId
                    }),
                    cache: false,
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json'
                };
                return Backbone.Model.prototype.fetch.apply(this, [params]);
            },
            parse: function(results){
                if(results && !results.intersectionResults) return {errors:true};
                results = results.intersectionResults ? results.intersectionResults : results;
                var srcTypes = _.filter(results, function(result){
                    return result.traits[0].type == "DEVICE";
                });

                var points = [];

                _.each(srcTypes, function(type) {
                    if (type.traits[0].name !== "TV") {
                        var compiledSize = 0;
                        var pointChilds = [];
                        var children = _.filter(results, function (result) {
                            if (result.traits[0].type == "DEVICE+OS") {
                                var fullId = String(result.traits[0].id);
                                var deviceId = parseInt(fullId.substr(fullId.length - 3));
                                return type.traits[0].id == deviceId;
                            }
                            return false;
                        });

                        children = _.sortBy(children, function (obj) {
                            return obj.size;
                        }).reverse();

                        _.each(children, function (child, index) {
                            pointChilds.push({
                                id: child.traits[0].id,
                                name: child.traits[0].name.split(" + ")[0],
                                y: child.size,
                                y_1: child.size,
                                color: this.colors[index],
                                marker: {
                                    states: {
                                        hover: {
                                            fillColor: this.hoverColors[index]
                                        }
                                    }
                                }
                            });
                            compiledSize += child.size.round();
                        }.bind(this));

                        points.push({
                            id: type.traits[0].id,
                            name: type.traits[0].name,
                            value: compiledSize,
                            data: pointChilds
                        });
                    }
                }.bind(this));

                points = _.sortBy(points, function (obj) {
                    return obj.value;
                }).reverse();

                this.points = points;
            }
        });

        return LogoDonutChartModel;
    });