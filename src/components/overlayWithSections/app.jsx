requirejs.config({
    //By default load any module IDs from js/lib
	baseUrl: '../../js',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
  paths: {
    'jquery': 'lib/jquery-1.9.1.min',
    'underscore': 'lib/underscore-min',
    'backbone': 'lib/backbone-min',
    'text': "lib/text",
    "highstock": 'lib/highcharts',
    'exporting': 'lib/exporting',
  },
  shim: {
    'jquery': {
      exports: 'jquery'
    },
    'backbone': {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    'underscore': {
      exports: '_'
    },
    'exporting': {
      deps:["highstock"],
      exports: 'exporting'
    },
    "highstock": {
      exports: "Highcharts"
  	},
  }
});

require([
	"jquery",
    "backbone",
    "overlayWithSections/views/OverlayWithSectionsView",
    "overlayWithSections/model/dataModel"
	
],

function($, Backbone, OverlayWithSectionsView, DataModel) {
	$(document).ready(function() {
		
		var model = new DataModel();
		
		model.fetch().then(function(){
			console.log(model.toJSON());
			var instance = new OverlayWithSectionsView(model.toJSON());
			
			$("#content").append(instance.render().$el);
		});
	});
});