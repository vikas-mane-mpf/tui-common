define(['underscore', 'jquery', 'backbone', 'common/models/MenuConfigModel', 'common/services/SecurityService', 'common/services/FeatureToggleService', 'common/services/ConfigService'],
function(_, $, Backbone, MenuConfigModel, SecurityService, FeatureToggleService, ConfigService){

	var MenuService = function(){}
	
	_.extend(MenuService.prototype, Backbone.Events, {
		
		initialize : function(){
			// TODO: No use of MenuConfigModel combine in UIConstans
			this.menuItems = new MenuConfigModel();
			return this.menuItems.fetch();
			// return this.menuConfig.get("menuItems");
			// try {
			// 	this.menuItems = ConfigService.getConfig("constants").externalUrls.menuItems;
			// } catch(e) {
			// 	this.menuItems = [];
			// }
		},
		
		getMenuItems : function(){
			return this.menuItems.get("menuItems");
		},

		getMenuItem : function(id){
            var getById = function(items, id){
                for(var i=0; i< items.length; i++){
                    var menuItem = items[i];
                     if(menuItem.id == id){
                       return menuItem;
                     }else  if(menuItem.children){
                        var item = getById(menuItem.children, id);
                        if(item)
                            return item;
                      }
                }
            }
		    return getById(this.getMenuItems(), id);
		},

		getMenuItemByPathName: function(pathName){
			var getByPathName = function(items, pathName){
				for(var i=0; i< items.length; i++){
					var menuItem = items[i];
						if(menuItem.href && menuItem.href.indexOf(pathName) > -1){
						return menuItem;
						} else  if(menuItem.children){
						var item = getByPathName(menuItem.children, pathName);
						if(item)
							return item;
						}
				}
			}
			return getByPathName(this.getMenuItems(), pathName);
		},
		
		updatePermissions : function(){
    		console.trace("updatePermissions");
			var updateAccess = function(items){
				_.each(items, function(menuItem){
					menuItem.enabled = true;
					// MPSUP-1676 - support an array of portal roles to check access to menu items
					var menuItemAccessArray = menuItem.access;
					if(menuItemAccessArray){
						// ensure we have an array
						menuItemAccessArray = Array.isArray(menuItemAccessArray) ? menuItemAccessArray : [menuItemAccessArray];

						var menuItemResultArray = [];

						_.each(menuItemAccessArray, function(menuItemAccess){

							var params = menuItemAccess.split("|");
							menuItemResultArray.push(SecurityService.hasPermission(SecurityService[params[0]], SecurityService[params[1]]));
						});

						menuItem.enabled = (menuItemResultArray.indexOf(true) >= 0);

                        if(menuItem.multiLevel) {
                            if(menuItem.children.length) {
                                _.each(menuItem.children, function(childItem) {
                                    if(childItem.isChild) {
                                       _.each(childItem.children, function(grandChild) {

											// MPSUP-1676 - grandchildren may have an array of roles too
											var grandchildItemAccessArray = grandChild.access;
											if(grandchildItemAccessArray){
												// ensure we have an array
												grandchildItemAccessArray = Array.isArray(grandchildItemAccessArray) ? grandchildItemAccessArray : [grandchildItemAccessArray];

												var grandchildItemResultArray = [];

												_.each(grandchildItemAccessArray, function(menuItemAccess){

													var params = menuItemAccess.split("|");
													grandchildItemResultArray.push(SecurityService.hasPermission(SecurityService[params[0]], SecurityService[params[1]]));
												});

												grandChild.enabled = (grandchildItemResultArray.indexOf(true) >= 0);

                                            }
                                       }); 
                                    }
                                });
                            }
                        }
					}
                    
					if(menuItem.featureToggles){
					    var featureToggles = menuItem.featureToggles.split("|");
					    _.each(featureToggles, function(featureToggle){
					        // Ignore AD featuretoggle if user has ENTITY_AUDIENCE_DISCOVERY_SUPER permissions
					        if(featureToggle == FeatureToggleService.AUDIENCE_DISCOVERY && SecurityService.hasPermission(SecurityService.ENTITY_AUDIENCE_DISCOVERY_SUPER, SecurityService.LIST)){

					        }else if(!FeatureToggleService.isFeatureEnabled(featureToggle)){
                                menuItem.enabled = false;
                            }
                            
                            if((featureToggle == FeatureToggleService.ENABLE_MOBILE_APP_BEHAVIORS_BY_ACCOUNT_MIPUI_3125 || featureToggle == FeatureToggleService.ENABLE_MOBILE_APP_BEHAVIORS_BY_SUPER_USER_MIPUI_3125) && FeatureToggleService.isFeatureEnabled(FeatureToggleService.ENABLE_MOBILE_APP_BEHAVIORS_BY_ACCOUNT_MIPUI_3125)) {
                                if(SecurityService.hasPermission(SecurityService.ENTITY_SUPERUSER, SecurityService.CREATE) && FeatureToggleService.isFeatureEnabled(FeatureToggleService.ENABLE_MOBILE_APP_BEHAVIORS_BY_SUPER_USER_MIPUI_3125)) {
                                    menuItem.enabled = true;
                                }else if(!FeatureToggleService.isFeatureEnabled(FeatureToggleService.ENABLE_MOBILE_APP_BEHAVIORS_BY_SUPER_USER_MIPUI_3125)) {
                                    menuItem.enabled = true;
                                }else {
                                    menuItem.enabled = false;
                                }
                            }
                            
					    })
					}

					if(menuItem.enabled && menuItem.children)
						updateAccess(menuItem.children);
				});

			};
			
			updateAccess(this.getMenuItems());
			this.trigger("change");
		}
		
	});
	
	var service = new MenuService();
	return service;
});
