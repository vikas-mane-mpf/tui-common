 define(["jquery",
         "backbone",
         "underscore",
         "i18next",
         "text-loader!components/multilevelAccordion/accordionTpl.html"
     ],
     function($, Backbone, _, i18next, accordionTpl) {

         var View = Backbone.View.extend({
        	 
        	template : _.template(accordionTpl),
        	 
            events: {
                "keyup #search": "searchDSPFilter"
            },

             initialize: function(options, from) {
        	    this.seats = options.seats ? options.seats : [];
                this.selectAllCounter = 0;
                this.childChecked = false;
                this.from = from;
             },

             cacheDom : function(){
                this.$search = this.$('#search');
                this.$accordion = this.$('.js-accordion');
                this.$mainControls = this.$('.js-main-controls');
                this.$selectAll = this.$('.js-selectAll');
                this.$showSelected = this.$('.js-showSelected');
                this.$accordionTitle = this.$('.js-title');
                this.$accordionContent = this.$('.js-content');
                this.$parentCheckbox = this.$('.js-checkboxes');
             },
             
             render : function(options){
                this.$el.html(this.template({
                    i18next : i18next,
                    data : this.seats,
                    from : this.from
                }));
                
                this.cacheDom();
                this.renderAccordions();
                this.renderCheckboxes();
                this.renderSeatCheckboxes();

                return this;
             },

             selectAllChecked: function() {
                this.$accordion.find('.checkbox').each(function(index, item) {
                    if($(item).checkbox('is checked')) {
                        this.selectAllCounter++;
                    }
                }.bind(this));

                if(this.selectAllCounter === this.$accordion.find('.checkbox').length) {
                    this.$selectAll.checkbox('set checked');                   
                }else {
                    this.$selectAll.checkbox('set unchecked');
                    this.selectAllCounter = 0;
                }
             },

             enableShowSelected: function() {
                var checkCounter = 0;
                this.$accordion.find('.checkbox').each(function(index, item) {
                    if($(item).checkbox('is checked')) {
                        checkCounter++;                        
                    }
                }.bind(this));

                if(checkCounter > 0) {
                    this.$showSelected.removeClass('disabled');                        
                }
             },

             disableShowSelected: function() {
                var checkBoxLen = this.$accordion.find('.checkbox').length;
                this.$accordion.find('.checkbox').each(function(index, item) {
                    if($(item).checkbox('is unchecked')) {
                        checkBoxLen--;                        
                    }
                }.bind(this));

                if(checkBoxLen <= 0) {
                    this.$showSelected.checkbox('uncheck');
                    this.$showSelected.addClass('disabled');                        
                }
             },

             renderAccordions: function() {                
                this.$accordion.accordion({
                    selector: {
                      trigger: '.title .icon'
                    }
                });

             },

             renderCheckboxes: function() {
                this.$showSelected.addClass('disabled');
                this.$selectAll.checkbox({
                    onChecked: function() {
                        if($(event.currentTarget).hasClass('js-selectAll')) {
                             $childCheckbox  = this.$accordion.find('.checkbox');
                             $childCheckbox.checkbox('set checked');
                             this.$accordion.find('.js-content').find('.field').addClass('highlight');
                             this.enableShowSelected();
                             this.childChecked = true;
                             if(this.$showSelected.checkbox('is checked')){ // MIPUI-1943 - When 'Select All' is clicked after 'Show Selected'
                                this.$accordion.find('.accordion-item-parent').show() // Show 1st level
                                this.$accordion.find('.field').show(); // Show 2nd level
                                this.$accordion.find('.inner-accordion-child').show(); // Show 3rd level
                             }
                        }
                    }.bind(this),

                    onUnchecked: function() {
                        if($(event.currentTarget).hasClass('js-selectAll')) {
                             $childCheckbox  = this.$accordion.find('.checkbox');
                             $childCheckbox.checkbox('set unchecked');
                             this.$accordion.find('.js-content').find('.field').removeClass('highlight');
                             this.disableShowSelected();
                             this.childChecked = false;
                             this.selectAllCounter = 0;
                        }
                    }.bind(this)
                })

                this.$showSelected.checkbox({
                    onChecked: function() {
                        this.$accordion.find('.content, .title').addClass('active');
                        this.$accordion.find('.inner-accordion-child, .field').removeClass('hidden').show();

                        if(this.$accordion.find('.checkbox:not(.checked)').length){

                            this.$accordion.find('.checkbox:not(.checked)').each(function(index, item){
                                $(item).parents('.field:first').removeClass('visible').hide();
                                if($(item).hasClass('js-GrandchildSeat')){
                                    $(item).parents('.inner-accordion-child:first').removeClass('visible').hide();
                                }
                            });

                            this.$accordion.find('.checkbox:not(.checked).js-checkboxes').each(function(index, item){
                                $(item).parents('.accordion-item-parent:first').hide();
                            });

                        }

                        this.$accordion.find('.checkbox.checked').each(function(index, item){
                            if($(item).hasClass('js-GrandchildSeat')){
                                $(item).parents('.inner-accordion-child:first').addClass('visible').show();
                            }                            
                            $(item).parents('.field:first').addClass('visible').show();
                        });                                            
                   }.bind(this),

                    onUnchecked: function() {
                        this.$accordion.find('.field').show();
                        this.$accordion.find('.checkbox').show();
                        this.$accordion.find('.content, .title').removeClass('active');
                        this.$accordion.find('.accordion-item-parent').show();                       
                    }.bind(this)
                });
             },

             renderSeatCheckboxes : function(){

                this.$accordionTitle.find('.checkbox').checkbox({
                    onChecked: function() {
                        if(!this.childChecked) {
                            this.enableShowSelected(); 
                            $(event.target).parents('.accordion-item-parent:first').find('.js-content .ui.checkbox').checkbox('set checked');
                            $(event.target).parents('.accordion-item-parent:first').find('.field').addClass('highlight');
                            this.selectAllChecked();
                        }
                    }.bind(this),

                    onUnchecked: function() {
                        this.disableShowSelected();
                        $(event.target).parents('.accordion-item-parent:first').find('.js-content .ui.checkbox').checkbox('set unchecked');
                        $(event.target).parents('.accordion-item-parent:first').find('.field').removeClass('highlight');
                        this.selectAllChecked();
                        //this.$accordionTitle.next('.js-content').find('.checkbox').checkbox('set unchecked');
                        this.childChecked = false;
                    }.bind(this)
                });

                this.$accordionContent.find('.checkbox').checkbox({
                    onChecked: function() {
                        this.childChecked = true;

                        //check if child nodes are present
                        //TODO: NEED TO REFACTOR THIS CODE, AVOID USING HEAVY JQUERY
                        if($(event.currentTarget).closest('.title').next().hasClass('content')) {
                            $(event.currentTarget).closest('.title').next('.content').find('.checkbox').checkbox('set checked');
                        }

                        //check if parent nodes are present
                        //TODO: NEED TO REFACTOR THIS CODE, AVOID USING HEAVY JQUERY
                        if($(event.currentTarget).closest('.content').prev('.title').find('.checkbox').length) {
                           $(event.currentTarget).closest('.content').prev('.title').find('.checkbox').checkbox('set checked'); 
                        }

                        if($(event.currentTarget).closest('.content').closest('.js-content').prev('.title').find('.checkbox').length) {
                           $(event.currentTarget).closest('.content').closest('.js-content').prev('.title').find('.checkbox').checkbox('set checked'); 
                        }

                        this.enableShowSelected(); 
                        this.selectAllChecked(); 
                        
                    }.bind(this),

                    onUnchecked: function() {
                        this.disableShowSelected(); 
                        this.selectAllChecked(); 
                        
                        if($(event.currentTarget).closest('.title').next().hasClass('content')) {
                            $(event.currentTarget).closest('.title').next('.content').find('.checkbox').checkbox('uncheck');
                        }

                        if($(event.currentTarget).hasClass('js-GrandchildSeat')){
                            var firstChildIsChecked = $(event.currentTarget).closest('.content').find('.js-GrandchildSeat').checkbox('is checked');
                            if(!_.contains(firstChildIsChecked, true)) {
                                var $secondLevelParent = $(event.currentTarget).closest('.accordion-item-parent').find('.js-childSeatWithGrandChild');
                                $secondLevelParent.checkbox('uncheck');

                                this.unselectFirstParent(event);
                            }
                        }

                        if($(event.currentTarget).hasClass('js-childSeat') || $(event.currentTarget).hasClass('js-childSeatWithGrandChild')){
                            this.unselectFirstParent(event);
                        }

                        
                    }.bind(this)

                });

             },

            unselectFirstParent: function(event){
                var firstChildIsChecked = $(event.currentTarget).closest('.js-content').find('.js-childSeatWithGrandChild, .js-childSeat').checkbox('is checked');
                if(!_.contains(firstChildIsChecked, true)) {
                    $(event.currentTarget).closest('.accordion-item-parent').find('.js-checkboxes').checkbox('uncheck');
                }
            },

             getSelectedSeatKeys : function(){
                var seatsData = [];
                this.$accordionContent.closest('.js-accordion').find('.checkbox').each(function(index, item) {
                    if($(item).checkbox('is checked')) {
                        if($(item).hasClass('js-childSeat') || $(item).hasClass('js-childSeatWithGrandChild') || $(item).hasClass('js-GrandchildSeat')) {
                            seatsData.push($(item).find('input').data('key'));
                        }
                    }
                });
                return seatsData;
             },

             searchDSPFilter: function(event) {
                var searchText = $(event.currentTarget).val().toLowerCase();
                
                this.$showSelected.checkbox('uncheck');

                if(searchText.length <= 2){
                    this.$accordion.find('.accordion-item-parent').show();
                    this.$accordion.find('.accordion-item-parent').find('.title').removeClass('active');
                    this.$accordion.find('.accordion-item-parent').find('.content').removeClass('active');

                    this.$accordion.find('.inner-accordion-child').show();
                    this.$accordion.find('.inner-accordion-child').find('.title').removeClass('active');
                    this.$accordion.find('.inner-accordion-child').find('.content').removeClass('active');

                    this.$accordion.find('.js-childSeat').show();
                } else {                    
                    this.searchText(searchText);
                }                
            },

            searchText : function(text){
                var searchText = text;

                this.$accordion.find('.accordion-item-parent').hide();
                this.$accordion.find('.inner-accordion-child').hide();
                this.$accordion.find('.inner-accordion-child').find('.content .field').hide();
                this.$accordion.find('.js-childSeat').hide();

                this.$accordion.find('label').each( function (index) {
                    if( $( this ).text().toLowerCase().indexOf( searchText ) >= 0){                        

                        var itemClass = $(this).attr('class');

                        switch(itemClass) {
                            case "js-fourth-label":

                                //hide siblings
                                $(this).parents('.field:first').show();

                                $(this).parents('.inner-accordion-child:first').show();
                                $(this).parents('.content:first').addClass('active');
                                $(this).parents('.inner-accordion-child:first').find('.title').addClass('active');

                                $(this).parents('.accordion-item-parent:first').show();
                                $(this).parents('.accordion-item-parent:first').find('.title').addClass('active');
                                $(this).parents('.accordion-item-parent:first').find('.content').addClass('active');
                                
                                break;
                            case "js-third-label":
                                $(this).parents('.inner-accordion-child:first').show();

                                $(this).parents('.accordion-item-parent:first').show();
                                $(this).parents('.accordion-item-parent:first').find('.title').addClass('active');
                                $(this).parents('.accordion-item-parent:first').find('.content').addClass('active');

                                break;
                            case "js-second-label":
                                $(this).parents('.js-childSeat:first').show();

                                $(this).parents('.accordion-item-parent:first').show();
                                $(this).parents('.accordion-item-parent:first').find('.title').addClass('active');
                                $(this).parents('.accordion-item-parent:first').find('.content').addClass('active');
                                break;
                            case "js-first-label":
                                $(this).parents('.js-childSeat:first').show();
                                
                                $(this).parents('.accordion-item-parent:first').show();
                                break;
                            }

                    }
                });               
            }

         });
         return View;

     });