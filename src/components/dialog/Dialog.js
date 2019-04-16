 define(["jquery",
         "backbone",
         "underscore",
         "text-loader!components/dialog/DialogTpl.html"
     ],
     function($, Backbone, _, dialogTpl) {

         var View = Backbone.View.extend({
        	 
        	 className : "ui small modal js-dialog-model",

        	 template : _.template(dialogTpl),
        	 
             initialize: function(options) {
            	 this.options = options;
            	 if(options.type === 'basic') {
                    this.$el.addClass('basic');
                 }else {
            		this.$el.addClass('error-box-consumer');
                 }

            	 this.render();
             },

             render : function(){
            	 this.$el.html(this.template({
            		 header : this.options.header, 
            		 content : this.options.content, 
            		 buttons: this.options.buttons
            	 }));
            	 $('body').append(this.$el);
            	 this.$el.modal({
            		closable : false,
            		blurring: true,
            		allowMultiple: !(this.options.closeOthers || false),
            		onApprove : function($element){
            			this.dfd.resolve($element);
                        $("body").removeClass("dimmable").removeClass("blurring");
            		}.bind(this),
            		onDeny: function($element){
            			this.dfd.reject($element );
                        $("body").removeClass("dimmable").removeClass("blurring");
            		}.bind(this),
            		onHidden: function(){
            		    this.remove();
                        $("body").removeClass("dimmable").removeClass("blurring");
            		}.bind(this)
            	 });
            	 return this;
             },

             show : function(){
            	 this.dfd = jQuery.Deferred();
            	 this.$el.modal('show');
            	 return this.dfd;
             },

             resolve : function(){
                 this.dfd = jQuery.Deferred();
                 return this.dfd;
             },

             hide : function(){
                if(this.dfd){
                    this.dfd.reject('cancelled');
                }
                this.$el.modal('hide');
                $("body").removeClass("dimmable").removeClass("blurring");
             }

         });
         return View;

     });