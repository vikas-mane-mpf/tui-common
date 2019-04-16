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
    'bootstrap': 'lib/bootstrap',
    "Selectcomp" : "lib/bootstrap-select",
    "Selectbox" : "lib/bootstrap-selectplugin"
    
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
    }
  }
});

require([
	"jquery",
    "backbone",
    "segmentBuilder/views/parentView",
    "segmentBuilder/model/dataModel",
    
],

function($, Backbone, ParentView,DataModel) {
	$(document).ready(function() {
		
		
		//$("#content").html(instance.render().$el);
		var opt = {};
		opt.url="data/data.json";
		var model = new DataModel();
		
		 
		model.fetch().then(function(){
			console.log(JSON.stringify(model.toJSON()));
			opt.configuration = model.toJSON();
			//opt.scopedropDownOptions = "Advertiser";
			opt.advAccName = "Google";
			opt.sortDropDownOptions = [
			{
				text:"SORT BY DATE",
				id:"1"
			},
			{
				text:"SORT BY DATE",
				id:"2"
			},
			{
				text:"SORT BY ALPHABET",
				id:"3"
			},
			{
				text:"SORT BY ALPHABET",
				id:"4"
			}];
			/*opt.scopedropDownOptions = [
            {
            	text:"ADVERTISER",
			    id:"1"
			},
			{
				text:"ACCOUNT",
			    id:"2"
			}];*/
			opt.tabValues1 ={
				text:"deepak",
				isSelected:false 
			}
			opt.tabValues2 ={
					text:"keswani",
					isSelected:true
			};
			opt.isPaginationSupport = true;
			
			var instance = new ParentView(opt);
			$("#content").html(instance.render().$el);
		})
		
		
		
		
		
		
		
		/*model.fetch().then(function(){
			console.log(model.toJSON());
			//var instance = new DropDownWithSeparatorView(model.toJSON());
			var instance = new ParentView(model.toJSON());
			$("#content").html(instance.render().$el);
		});*/
	});
});