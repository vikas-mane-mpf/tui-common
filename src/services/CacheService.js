define(['underscore', 'jquery', 'backbone', 'components/localstorage/LocalStorage'],
function(_, $, Backbone, LocalStorage){

	var CacheService = function(){}
	
	_.extend(CacheService.prototype, Backbone.Events, {
		
		get : function(key){
			var webStorageKey = LocalStorage.getUniqueKey();
        	var cachedData = LocalStorage.get(webStorageKey) || {};
			return cachedData[key];
		},
		
		set : function(key, value){
			var webStorageKey = LocalStorage.getUniqueKey();
        	var cachedData = LocalStorage.get(webStorageKey) || {};
        	cachedData[key] = value;
        	LocalStorage.set(webStorageKey,cachedData);
		},
		remove : function(key){
		    var webStorageKey = LocalStorage.getUniqueKey();
		    var cachedData = LocalStorage.get(webStorageKey) || {};
            delete cachedData[key];
		    LocalStorage.set(webStorageKey,cachedData);
		},
		clear : function(){
		    var webStorageKey = LocalStorage.getUniqueKey();
		    var pickedObj = _.pick(LocalStorage.get(webStorageKey) || {}, ["accountId", "geoId", "coreAgencyId", "agencyCode"]);

		    LocalStorage.deleteKey(webStorageKey);

		    //create a comb and put a key on localstorage
		    var _t = _.pairs(pickedObj);
		    //map function on comb
		    _.map(_t, Function.prototype.apply.bind(this.set, this));
		}
	});
	
	var service = new CacheService();
	return service;
});
