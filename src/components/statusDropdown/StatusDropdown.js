 define(["jquery",
         "backbone",
         "underscore",
         "text-loader!components/statusDropdown/StatusDropdownTpl.html"
     ],
     function($, Backbone, _, statusDropdownTpl) {

         var View = Backbone.View.extend({
        	 
        	className : "ui toggle checkbox js-toggle-icon toggle-btn-wrap",
        	 
        	template : _.template(statusDropdownTpl),
        	 
            events: {
                "click .js-toggle-icon" : "updateToggle",
                "click .actionWrap .button" : "toggleStatus"
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
                this.$menu = this.$('.js-menu');
                this.$LalMenu = this.$('.js-lal-menu');
                this.$jsToggle = this.$('.js-toggle-icon');
                this.$jsLALicon = this.$('.js-lal-icons');
             },
             
             render : function(options){
                this.$el.html(this.template({}));
                this.cacheDom();
                this.renderIcon();
                this.renderMenu();
                this.$el.css('cursor', this.isDisabled() && this.getDisabledMessage() ? 'default' : 'pointer');
                
                this.$el.checkbox(this.status === 'a' || this.status === 'active' || this.status === 'A' ? 'check' : 'uncheck');
                
                if(this.isDisabled()) {
                    this.$el.checkbox('set disabled');   
                }else {
                    this.$el.checkbox({
                        
                        beforeChecked: function() {
                            if(!this.$el.find('.menuOptions').length) {
                                this.createOptions(false);
                            }

                            return false;
                        }.bind(this),

                        beforeUnchecked: function() {

                            if(!this.$el.find('.menuOptions').length) {
                                this.createOptions(true);
                            }

                            return false;
                        }.bind(this)                            
                    });
                }

                return this;
             },

             createOptions: function(isChecked) {
                var menuBox = document.createElement('div');
                var menuHead = document.createElement('h5');
                $(menuHead).html('Status Change');
                $(menuBox).addClass('menuOptions');
                $(menuBox).append(menuHead);
                var inactiveMsg = 'Are you sure you want to change the status from Active to Inactive?';
                var activeMsg = 'Are you sure you want to change the status from Inactive to Active?';
                 
                $(menuBox).append(isChecked ? inactiveMsg : activeMsg);

                if(!isChecked) {
                    if((this.options.model && this.options.model.get && this.options.model.get('censusType') && this.options.model.get('censusType') === 'Y')) {
                        $(menuBox).addClass('digital-behavior-census-menuoption');
                        $(menuBox).append('<br/><br/>Active Census models will never expire.');
                    }else if(this.options.model && this.options.model.get && this.options.model.get('subType')) {
                        $(menuBox).addClass('inactive-list-menuOption');
                        $(menuBox).append('<br/><br/>When re-activated, expiration date will be automatically reset to 90 days from today.<br/>Expiration date can be updated in the edit screen.');
                    }else if((this.options.screen && this.options.screen === 'model-screen')) {
                        $(menuBox).addClass('inactive-model-menuOption');
                        $(menuBox).append('<br/><br/>When re-activated, expiration date will be automatically reset to 90 days from today.<br/>Expiration date can be updated in the expiration date picker.');
                    }

                    /*if((this.options.screen && this.options.screen === 'digital behavior')) {
                        $(menuBox).addClass('digital-behavior-census-menuoption');
                        $(menuBox).append('<br/><br/>Active Digital Behaviors will never expire.');
                    }*/
                }


                $(menuBox).append('<div class="actionWrap"><a href="javascript: void(0);" data-status="'+isChecked+'" data-value="yes" class="small ui button blue">Yes</a><a href="javascript: void(0);" data-value="no" class="small ui button blue basic">No</a></div>');
                

                this.$el.find('label').popup('hide');
                this.$el.append(menuBox);

                $('.actionWrap .button').on('click', function(event){
                    this.toggleStatus(event);
                }.bind(this))

                this.$el.on('mouseleave', function(event) {
                    setTimeout(function() {
                        this.$el.find('.menuOptions').remove(); 
                    }.bind(this), 1000);
                }.bind(this));
             },

             toggleStatus: function(event) {
                var eventStatus = $(event.target).data('value');
                if(eventStatus === 'yes') {
                    if($(event.target).data('status')) {
                        this.handleChange('inactive');
                        this.$el.checkbox('set unchecked');
                    }else {
                        this.handleChange('active');
                        this.$el.checkbox('set checked');
                    }
                }

                this.$el.find('.menuOptions').remove();                    
             },

             updateToggle: function(event) {
                event.stopPropagation();
                if(this.isDisabled()){
                    return false;
                 }else{
                   this.createOptions();
                 }                
             },

             handleChange : function(value){
                this.status = value;
                this.trigger("change", value);
             },

             renderIcon : function(){
                this.$jsToggle.attr('class', this.getIconClass() + ' turbine-status icon');
                setTimeout(function(){
                    if(!(this.getDisabledMessage() === 'no-popup')) {
                         this.$el.find('label').popup({
                            variation : "very wide",
                            position : 'top left',
                            prefer : 'opposite',
                            lastResort : 'bottom left',
                            maxSearchDepth : 2,
                            offset : -9
                        });
                    }
                }.bind(this), 10)
                return this;
             },

             renderStatusIcon : function(){
                var statusIcon = document.createElement('i');
                $(statusIcon).attr('class', this.getIconClass() + ' turbine-status icon');
                setTimeout(function(){
                     $(statusIcon).popup({
                        variation : "very wide",
                        html : this.getTooltip(),
                        position : 'top left',
                        prefer : 'opposite',
                        lastResort : 'bottom left',
                        maxSearchDepth : 2,
                        offset : -9,
                        onVisible: function ($popup) {
                            $(this).addClass('hideBlur'); 
                        }
                    });
                }.bind(this), 1)
                return $(statusIcon)
             },

             update : function(status, iconClass){
                this.status = status;
                this.iconClass = iconClass;
                this.$jsToggle.attr('class', this.getIconClass() + ' icon');
                this.$el.checkbox(this.status === 'active' || this.status === 'A' || this.status === 'a' ? 'check' : 'uncheck');
             },

             updateStatusIcon : function(element, iconClass){
                element = $(element).attr('class', iconClass);
                setTimeout(function(){
                     $(element).popup({
                        variation : "very wide",
                        html : this.getTooltip(),
                        position : 'top left',
                        prefer : 'opposite',
                        lastResort : 'bottom left',
                        maxSearchDepth : 2,
                        offset : -9,
                        onVisible: function ($popup) {
                           $(this).addClass('hideBlur');
                        }
                    });
                }.bind(this), 10);
                return $(element);
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
                    if(this.getDisabledMessage() === 'no-popup') {
                        this.$menu.html(''); 
                    }else {
                        this.$menu.html('<div class="message" style="width:200px;white-space:normal">' + this.getDisabledMessage() + '</div>');
                    }
                 }else{
                    this.$menu.append('<div style="padding: 5px; width: 180px;">Click to Make Active/Inactive</div>');
            	 }
             }

         });
         return View;

     });