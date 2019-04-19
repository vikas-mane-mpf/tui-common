/*define([
        'backbone',
        'epoxy',
        'services/CacheService'
    ],
    function(Backbone, Epoxy, CacheService) {
        var ApiModel = Backbone.Epoxy.Model.extend({

            localStorageKey: 'api',
            defaults: function() {
                return {
                    accountId: null,
                    accountName: null,
                    user: null,
                    token: null,
                    url: null
                };
            },

            saveToLocalStorage: function(){
                CacheService.set(this.localStorageKey, this.attributes);
            },

            getFromLocalStorage: function(){
                this.attributes = LocalStorage.get(this.localStorageKey);
                return CacheService.get(this.localStorageKey);
            }

        });

        return ApiModel;
    });*/
