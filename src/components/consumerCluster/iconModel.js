define(["jquery", "underscore", "backbone"],
    function($, _, Backbone){
        var iconModel = Backbone.Model.extend({
            mockEnabled: true,
            mockUrl: 'data/components/consumerCluster/data/icon.json',
            //liveUrl: 'getWidgetData.htm',
            initialize: function(options){
                
            },
            fetch: function(options) {
                if(this.mockEnabled){
                    this.url = this.mockUrl;
                    return Backbone.Model.prototype.fetch.apply(this);
                }

                this.url = this.liveUrl;

                var params = {
                    type: 'get',
                    cache: false,
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json'
                };
                return Backbone.Model.prototype.fetch.apply(this, [params]);
            },
            formatName: function(str) {
                return "ic-" + str.replace(/\//g, "-").replace(/& /g, "").replace(/\+ /g, "").replace(/ /g, "-").replace(/' /g, "-").replace("'","-",'g').toLowerCase();
            }
        });
    return iconModel;
});