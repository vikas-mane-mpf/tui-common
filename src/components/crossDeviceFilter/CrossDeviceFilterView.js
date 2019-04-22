define(["underscore", "jquery", "backbone",
        "text!components/crossDeviceFilter/crossDeviceFilterTpl.html",
        "common/services/AccountService", "jqueryUI"],
   function(_, $, Backbone,
		   CrossDeviceFilterTpl,
		   AccountService){

	var CrossDeviceFilterView = Backbone.View.extend({

		template : _.template(CrossDeviceFilterTpl),
		className : "cross-device-filter ui borderless secondary menu",

		events : {"click .ui-slider-handle" : function(){return false;}},

		attributes : {
			style : "margin:-.5em 0"
		},

		initialize: function(options){
			options = options || {};
			this.enabled = options.enabled || false;
			this.reach = typeof options.reach != 'undefined' ? options.reach : 0;

		},

		render : function(){
			var crossDeviceEnabled =  AccountService.getCurrentAccount().get("crossDeviceEnabled") === "Y";
			if(crossDeviceEnabled){

				this.$el.append(this.template({label : "minimum cross-device reach"}));
				this.cacheDom();

				this.$slider.slider({
				      range: "min",
				      min: 0,
				      max: 100,
				      value: this.reach,
				      slide: function( event, ui ) {
				    	  console.log(ui.value);
				          this.setReach(ui.value);
				        }.bind(this),
				      stop: function( event, ui ) {
				    	  this.setReach(ui.value, true);
				      }.bind(this)
				    });


				this.$input.on("change", function(){
					this.setReach(this.$input.val(), true)
				}.bind(this));

				this.$checkbox.checkbox();

				this.$checkbox.on("change", function(){
				var pagename = "";

				if(window.location.hash === "#interaction"){
					pagename = "Interaction Look-a-like List";
				}
				if(window.location.hash === "#segmentBuilder"){
                	pagename = "Custom Segment List";
                }
                if(window.location.hash === "#modelling"){
                    pagename = "Interest Model List";
                }
                if(window.location.hash === "#demographic"){
                    pagename = "Data Partner Model List";
                 }

				this.setEnabled(this.$checkbox.prop("checked"), true);
				}.bind(this));

				this.setReach(this.reach);
				this.setEnabled(this.enabled);
			}
			return this;
		},

		cacheDom : function(){
			this.$slider = this.$('.slider');
			this.$checkbox = this.$('input[type="checkbox"]');
			this.$input = this.$('input[type="number"]');
		},

		setReach : function(value, trigger){
			value = +value;
			value = Math.max(Math.min(value, 100), 0);
			this.reach = value;
			this.$slider.slider( "value", value );
			this.$input.val(value);
			if(trigger){
				setTimeout(function(){this.trigger("change", this.getSelectedValue())}.bind(this), 50);
			}
		},

		setEnabled : function(value, trigger){
			this.enabled = value;
			this.$el.toggleClass('disabled', !value);
			this.$checkbox.prop('checked', value);
			this.$slider.slider( "option", "disabled", !value );
			this.$slider.toggleClass("ui-state-disabled", !value);
			this.$input.parent().toggleClass("disabled", !value);
			if(trigger){
				setTimeout(function(){this.trigger("change", this.getSelectedValue())}.bind(this), 50);
			}
		},

		getSelectedValue : function(){
			return this.enabled ? this.reach : 0;
		}
	});

	return CrossDeviceFilterView;
})