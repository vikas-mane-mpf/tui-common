define(['underscore', 'jquery', 'backbone',
        'services/RemoteService', 
        'services/AccountService',
        'services/CacheService',
        'collections/DeliveryPlatformCollection',
        'collections/AgencyCollection',
        'collections/CoreAgencyCollection',
        'collections/GeoCollection',
        'collections/AdvertiserCollection',
        'collections/TPAccountsCollection',
        'models/TPAccountsModel',
        'collections/ModelReportingCollection',
        'events/EventDispatcher'],
function(_, $, Backbone,
		RemoteService, 
        AccountService,
        CacheService,
		DeliveryPlatformCollection, 
		AgencyCollection,
		CoreAgencyCollection,
		GeoCollection,
		AdvertiserCollection,
		TPAccountsCollection,
		TPAccountsModel,
		ModelReportingCollection,
		 EventDispatcher){

	var RefDataService = function(){
		this.data = [];
	}
	
	_.extend(RefDataService.prototype, Backbone.Events, {
		
		collections : {},

		initialize: function(){
		    this.geoCollection = new GeoCollection();
		    this.coreAgencyCollection = new CoreAgencyCollection();
		},
		
		set : function(id, data){
			console.log("setting", id, data);
			this.data[id] = data;
		},
		
		get : function(id){
			return this.data[id];
		},
		
		destroy : function(id){
			delete this.data[id];
		},
		getCurrentAgency: function(){
		    return this.currentAgency;
		},
		getCurrentCoreAgency: function(){
            return this.currentCoreAgency;
        },
		getCurrentGeo: function(){
            return this.currentGeo;
        },
		
		fetchDeliveryPlatforms : function(){
			var collection = new DeliveryPlatformCollection();
			collection.fetch().then(function(){
				this.set("deliveryPlatforms", collection);
			}.bind(this));
		},
		
		fetchAgencies : function(){
		    var collection = new AgencyCollection();
            collection.fetch().then(function(){
                this.set("agencies", collection);
            }.bind(this));
        },

        fetchCoreAgencies : function(){
			return this.coreAgencyCollection.fetch().then(function(){
			    this.set("coreAgencies", this.coreAgencyCollection);
				var agencyId = CacheService.get("coreAgencyId");
                var agency;
                if(agencyId){
                    agency = this.coreAgencyCollection.findWhere({id : agencyId});
                }

                this.currentCoreAgency = agency || this.coreAgencyCollection.at(0);
                CacheService.set("coreAgencyId", this.currentCoreAgency.id);
                //CacheService.set("agencyCode", this.currentCoreAgency.get('code'));
                console.log("currentAgency", this.currentCoreAgency);
                return this.coreAgencyCollection;
			}.bind(this));
		},

		changeCoreAgency : function(accountId){
            var agency = this.coreAgencyCollection.find({id : accountId});

            if(agency){
                this.currentCoreAgency = agency;
                CacheService.set("coreAgencyId", agency.id);
                //CacheService.set("agencyCode", agency.get('code'));
                this.trigger("coreAgencyChanged");
            }
        },

		fetchGeos : function(){
		    var agencyId = this.currentCoreAgency && this.currentCoreAgency.id;
		    if(!agencyId) return console.log("NO_AGENCY_ERROR - No agency to select");

            return $.when(this.geoCollection.reset(this.currentCoreAgency.get('geos'))).then(function(){
                this.set("geos", this.geoCollection);
                var geoId = CacheService.get("geoId");
                var geo;
                if(geoId){
                    geo = this.geoCollection.findWhere({id : geoId});
                }

                this.currentGeo = geo || this.geoCollection.at(0);
                CacheService.set("geoId", this.currentGeo.id);
                console.log("currentGeo", this.currentGeo);
                return this.geoCollection;
            }.bind(this));
        },

        fetchAccount : function(){
            var agencyId = this.currentCoreAgency && this.currentCoreAgency.id;
            var geoId = this.currentGeo && this.currentGeo.id;
            if(!agencyId || !geoId) return console.log("NO_AGENCY_OR_GEO_ERROR - No Agency/Geo to select");

            var accounts = CacheService.get("tpAccounts");
            this.currentTPAccount = null;
            this.currentTPAccount = accounts[agencyId+"#"+geoId] || null;
            if(this.currentTPAccount !== null){
                CacheService.set("tpAccountId", this.currentTPAccount.account_id);
                AccountService.changeAccount(this.currentTPAccount.account_id);
            }
            return this.currentTPAccount;
        },

        fetchAccounts : function(){
            this.tpAccountsCollection = new TPAccountsCollection();
            return this.tpAccountsCollection.fetch().then(function(){
                var res = [];
                if(this.tpAccountsCollection){
                    res = this.tpAccountsCollection.reduce(function(ac, x){
                        var k = x.get("agency_id") +"#"+ x.get("geo_id");
                        var objMt = {};
                        objMt[x.get("account_id")] = k;
                        var obj = {__meta__: _.extend(ac.__meta__, objMt)};
                        obj[k] = x;
                        ac = _.extend(ac, obj);
                        return ac;
                    }, {__meta__: {}});
                    CacheService.set("tpAccounts", res);
                }
                return this.tpAccountsCollection;
            }.bind(this));
        },

        changeGeo : function(geoId){
            var geo = this.geoCollection.find({id : geoId});

            if(geo){
                this.currentGeo = geo;
                CacheService.set("geoId", geo.id);
                this.trigger("geoChanged");
            }
        },

        fetchAgenciesForGeo: function(){
            var geoId = this.currentGeo && this.currentGeo.id;
            var collection = new CoreAgencyCollection();
            return collection.fetchAgenciesByGeo({geoId: geoId}).then(function(){
                return collection;
            });
        },

		fetchAdvertisers : function(){
			var accountId = AccountService.getCurrentAccount().id;
			var collection = new AdvertiserCollection({accountId : accountId});
			collection.fetch().then(function(){
				this.set("advertisers", collection);
				this.listenTo(EventDispatcher, EventDispatcher.ADVERTISER_SAVE, function(advertiser){
                    collection.add(advertiser, {merge : true});
                });
			}.bind(this));

		},

		fetchModelReporting : function(){
			var accountId = AccountService.getCurrentAccount().id;
			var collection = new ModelReportingCollection({accountId : accountId});
			collection.fetch().then(function(){
				this.set("modelReporting", collection);				
			}.bind(this));

		}
		
	});
	
	var service = new RefDataService();
	return service;
});
