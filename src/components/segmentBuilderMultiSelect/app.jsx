requirejs.config({
    //By default load any module IDs from js/lib
	baseUrl: '../../',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
  paths: {
    'jquery': 'lib/jquery-2.0.3.min',
    "underscore": "lib/lodash.underscore.min",
    "backbone": "lib/backbone-min",
    'text': "lib/text",
    "highstock": 'lib/highcharts',
    'exporting': 'lib/exporting',
    'bootstrap': 'lib/bootstrap',
    "Selectcomp" : "lib/bootstrap-select",
    "Selectbox" : "lib/bootstrap-selectplugin",
    'jquery.tagsInput': 'lib/jquery.tagsinput.min'
    
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
  	"bootstrap":{
    	"deps" : ["jquery"]
    },
    "Selectcomp":{
    	"deps" :["jquery"]
    },
    "Selectbox":{
    	"deps" :["jquery"]
    },
    "jquery.tagsInput": {
    	deps:['jquery']		    	
    }
  }
});

require([
	"jquery",
    "backbone",
    "components/segmentBuilderMultiSelect/view/multiSelectView",
    
    
],

function($, Backbone, MultiSelectView) {
	$(document).ready(function() {
		
		
		//$("#content").html(instance.render().$el);

			var opt={};
			opt.data = [
			{
				text:"Windows",
				id:"1"
			},
			{
				text:"OS X",
				id:"2"
			},
			{
				text:"Android",
				id:"3"
			},
			{
				text:"IOS",
				id:"4"
			}];
			var instance = new MultiSelectView(opt);
			//instance.render();
			//$("#content").html(instance.render().$el);
			
	});
});