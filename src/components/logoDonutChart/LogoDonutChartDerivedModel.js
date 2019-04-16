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
            mockUrl: 'static/js/components/logoDonutChart/data/newDeviceCookieData.json',
            liveUrl: 'getWidgetData.htm',
            widgetId: 'XPIDDeviceBreakdown',
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
                var digitalIDCount = 0;
                var values;
                
                results = results && results.intersectionResults ? results.intersectionResults : results;
                
                if(results !== null && results !== undefined && results.length > 0) {
                    
                    values = _(_(results).groupBy('device_type')).map(function(g, key) {
                      return { 
                               id: 0,
                               name: key, 
                               value: _(g).reduce(function(m,x) { return m + x.unique_device_count; }, 0),
                               data: _(_(g).groupBy('id_type')).map(function(gInside, keyInside) {
                                    return {
                                        id: 1,
                                        name: keyInside+'s',
                                        y: _(gInside).reduce(function(mI,xI) { return mI + xI.unique_device_count; }, 0),
                                        y_1: _(gInside).reduce(function(mI,xI) { return mI + xI.unique_device_count; }, 0)
                                    }
                               })
                           };
                    });

                    results.forEach(function(item){
                       digitalIDCount += item.unique_device_count;
                    }); 
                }
                
                this.trigger("sumOfDigitalIDs", digitalIDCount); //NOTE: Trigger for Population Section
                // Right now not listening this event now getting digitalIDCount in AccountPopulation API
                values = _.sortBy(values, function (obj) {
                    return obj.name;
                });
                
                for(var i = 0; i < values.length; i++) {
                    values[i].id = i+1;
                    for(var j = 0; j < values[i].data.length; j++) {
                        var k = j+1;
                        values[i].data[j].id = values[i].id+'00'+k;
                        values[i].data[j].color = this.colors[j],
                        values[i].data[j].marker = {
                            states: {
                                hover: {
                                    fillColor: this.hoverColors[j]
                                }
                            }
                        }
                    }
                }

                this.points = values;
            }
        });

        return LogoDonutChartModel;
    });