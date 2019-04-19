define(
    [
        'underscore',
        'jquery',
        'backbone',
        'main/services/RemoteService',
        'main/services/AccountService'
    ],
    function(
        _,
        $,
        Backbone,
        RemoteService,
        AccountService
    ){
        var HierarchicalService = function(){
            this.data = [];
        }
        _.extend(HierarchicalService.prototype, Backbone.Events, {
            getLimitCurrentCounts: function(options) {
                var queryString = "limit=true";
                if (options && options.hasOwnProperty("limitTypes") && options.limitTypes){
                    queryString += "&limitTypes="+options.limitTypes;
                }
                return RemoteService.ajax({
                    url: "getApiData.htm",
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    type: "POST",
                    data: JSON.stringify({
                        'entity': 'accounts',
                        'operation': 'get',
                        "id": AccountService.getCurrentAccount().id,
                        "queryString": queryString
                    }),
                    success: function(resp){
                        return $.Deferred().resolve().promise(resp);
                    }
                });
            },

            limitTypes: Object.freeze({
                LWR_SEED_AUD: "LWR_SEED_AUD",
                STANDARD_LAL: "STANDARD_LAL",
                CUST_SEG: "CUST_SEG",
                CLUS_GRP_DEF : "CLUS_GRP_DEF"
            }),

            isDependentAccount : function(){
                if(AccountService.getCurrentAccount().id !== AccountService.getCurrentAccount().get('masterAccountId')){
                    return true;
                }else {
                    return false;
                }
            }
        });

        var service = new HierarchicalService();
        return service;
    }
);
