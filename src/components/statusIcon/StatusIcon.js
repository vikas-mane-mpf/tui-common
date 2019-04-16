 define(["jquery",
         "backbone",
         "underscore",
         "text-loader!components/statusIcon/StatusIconTpl.html"
     ],
     function($, Backbone, _, statusDropdownTpl) {

         var View = Backbone.View.extend({
        	 
        	className : "ui toggle checkbox toggle-btn-wrap",
        	 
        	template : _.template(statusDropdownTpl),
        	 
            events: {
                "click .icon" : "updateToggle"
            },

             initialize: function(options) {
                console.log("status initializing", options)
            	 this.options = options;
            	 this.iconClass = options.iconClass;
            	 this.statuses = options.statuses;
                 this.status = options.status;
                 this.tooltip = options.tooltip;
                 this.disabled = options.disabled;
                 this.disabledMessage = options.disabledMessage;
             },

             cacheDom : function(){
                this.$icon = this.$('.icon');
                this.$menu = this.$('.menu');
             },
             
             render : function(options){
            	 this.$el.html(this.template({}));
            	 this.cacheDom();
                 this.renderIcon();
            	 return this;
             },

             updateToggle: function() {
                if(this.isDisabled()){
                    return false;
                 }else{
                    if(this.status === 'active') {
                        this.handleChange('inactive');                            
                    }else {
                        this.handleChange('active');                            
                    }
                 }                
             },

             handleChange : function(value){
                this.status = value;
                this.trigger("change", value);
             },

             renderIcon : function(){
                setTimeout(function(){
                     this.$icon.popup({
                        variation : "very wide",
                        html : this.getTooltip(),
                        position : 'top left',
                        prefer : 'opposite',
                        lastResort : 'bottom left',
                        maxSearchDepth : 2,
                        offset : -9
                    });
                }.bind(this), 10)

             },

             update : function(status, iconClass){
                this.status = status;
                this.iconClass = iconClass;
                this.$icon.attr('class', this.getIconClass() + ' icon');
                this.$el.dropdown('set selected', status);
                console.log("status update", status, 'class', this.getIconClass() + ' icon');
             },

             getIconClass : function(){
                return this.iconClass;
             },

             getTooltip : function(){
                return this.tooltip;
             },

             isDisabled : function(){
                return this.disabled;
             },

             getDisabledMessage : function(){
                return this.disabledMessage;
             },

             renderMenu : function(){
                this.$menu.empty();
                 if(this.isDisabled()){
                    this.$menu.html('<div class="message" style="width:200px;white-space:normal">' + this.getDisabledMessage() + '</div>');
                 }else{
                    this.$menu.append('<div style="padding: 5px;">Slide to Make Active/Inactive</div>');
            	 }
             }

         });
         return View;

     });