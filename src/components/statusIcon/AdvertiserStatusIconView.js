 define(["jquery",
         "backbone",
         "underscore",
         "i18next",
         "services/AccountService",
         "services/RemoteService",
         "services/ErrorService",
         "services/SecurityService",
         "events/EventDispatcher",
         "components/statusDropdown/StatusDropdown",
     ],
     function($, Backbone, _, i18next, AccountService, RemoteService, ErrorService, SecurityService, EventDispatcher, StatusDropdown) {

        var View = StatusDropdown.extend({

            initialize : function(options){
                this.options = options;
                this.status = this.model.get("status") === "A" || this.model.get("status") === "a" || this.model.get("status") === "active" ? 'active' : 'inactive';
                this.statuses = new Backbone.Collection([
                    { id : 'active' , text : 'Active', icon : 'toggle icon checked'},
                    { id : 'inactive' , text : 'Inactive', icon : 'toggle icon unchecked'}
                ]);
                this.isEditableSharedEntity = AccountService.isEditableSharedEntity(this.model.get("isShared"), this.model.get("ownerAcKey"));
            },

            getIconClass : function(){
                return (this.model.get("status") === "A" || this.model.get("status") === "a" || this.model.get("status") === "active" ? "green circle checked" : "grey circle  unchecked") + ' turbine-status toggle';
            },

            handleChange : function(value){
                this.save(value);
            },

            isDisabled : function(){
                return !SecurityService.hasPermission(SecurityService.ENTITY_ADVERTISER, SecurityService.UPDATE, true) || this.model.hasDependentModels() || !this.isEditableSharedEntity;
            },

             getDisabledMessage : function(){
                if(!this.isEditableSharedEntity)
                    return 'no-popup';

                if(this.model.hasDependentModels())
                    return i18next.t("app.statusChangeWarningMsg");
             },

            save : function(value){
                this.oldStatus = this.model.get("status");
                this.model.fetch().then(function(){
                    this.model.set("status", value === "active" || value === "a" || value === "A" ? "A" : "I");
                    this.model.save().then(function(response) {
                        if(response.advertisers){
                            this.update(value === "inactive" || value === "I" ? "I" : "A");
                            this.trigger('saved', response);
                            EventDispatcher.trigger(EventDispatcher.ADVERTISER_SAVE, this.model);
                        }else{
                            var error = ErrorService.getErrorFromResponse(response);
                            error.title = this.model.get("status") == "I" ? "Unable to Deactivate Advertiser" : "Unable to Activate Advertiser";
                            this.handleSaveError(error);
                            this.$el.checkbox(this.model.get("status") === 'A' || this.model.get("status") === 'a' || this.model.get("status") === 'active' ? 'set checked' : 'set unchecked');
                            this.$el.find('.menuOptions').remove();
                        }
                    }.bind(this), function(){
                        this.handleSaveError();
                    }.bind(this));
                }.bind(this))

            },

            handleSaveError : function(error){
                this.model.set("status", this.oldStatus);
               this.update(this.status);
               ErrorService.showError(error);
            }


        });

        return View;

     }
);