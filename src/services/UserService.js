define(['underscore', 'jquery', 'backbone', 'common/models/UserModel', 'common/services/RemoteService', 'common/services/CacheService', 'common/services/SecurityService'],
function(_, $, Backbone, UserModel, RemoteService, CacheService, SecurityService){

	var UserService = function(){        	
	}
	
	_.extend(UserService.prototype, Backbone.Events, {
		
		initialize : function(){
		    console.log("SecurityService", SecurityService)
		    this.user = new UserModel({id : SecurityService.token.get("user_id")})
			return this.user.fetch();
		},

		logout : function(){
			CacheService.clear();
            //window.location.replace('login.htm');
		}
	
	});
	
	return new UserService();
});
