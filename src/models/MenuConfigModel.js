define(
		['underscore',
		 'backbone',
		 'services/CacheService'
		 ] ,

		 function(_, Backbone, CacheService){

		 	this.canShowNewMenu = true;
		 	this.multilevelMenu = true;

		 	var menuCollection = this.canShowNewMenu && this.multilevelMenu ? 'menu.json' : 'menu-old.json';
			var MenuConfigModel = Backbone.Model.extend({

				url : "static/js/data/"+ menuCollection +"?version="+CacheService.get("currentVersion"),

				initialize : function(options){
					options = options || {};
				},

			});

			return MenuConfigModel;
		}

);
