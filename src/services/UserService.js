define(['underscore', 'jquery', 'backbone', 'main/models/UserModel', 'main/services/RemoteService', 'main/services/CacheService', 'main/services/SecurityService'],
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
