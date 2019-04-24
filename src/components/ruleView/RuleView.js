define(["jquery", 
        "backbone", 
        "services/AccountService",
        "components/overlayWithSections/views/OverlayWithSectionsView",
        "components/overlayWithSections/model/dataModel",
        "text!components/ruleView/ruleTpl.html",
        "components/segmentBuilder/views/parentView",
        "components/segmentBuilder/model/dataModel",
        "components/segmentBuilderMultiSelect/view/multiSelectView",
        "components/ruleView/segmentInterestDrpDwnView",
        "components/segmentBuilderCustomVariable/views/customVariableComponentView",
        "components/segmentBuilderCustomVariable/model/dataModel",
        "services/RefDataService",
        "services/ConfigService",        
        "modules/audienceIndexing/views/AudiencePerformanceIndexingComponentView",
        "services/RemoteService",
        "services/FeatureToggleService",
        "events/EventDispatcher",
        "i18next"],
        function($, Backbone, AccountService, OverlayWithSectionsView, MegaDropdownModel, ruleTpl, SegmentBuilderActivityOverlay, SegmentOverlayDataModel,
        		MultiSelectOverlay, SegmentInterestDrpDwnView, CustomVariableComponentView, CustomVariableDataModel, RefDataService, ConfigService,
        		AudiencePerformanceIndexingComponentView, RemoteService, FeatureToggleService, EventDispatcher, i18next){
	var View = Backbone.View.extend({

		events: {
			"click .criteriaAddBtn": "addCriteria",
			"click .criteriaRemoveBtn": "removeCriteria",
			"click #find_audience_button": "getCriteriaSelectionForAudienceIndex"	
		},

		initialize: function(options){
			this.options = options;
			this.$el.html(_.template(ruleTpl, {"isForAdd": (typeof this.options.data == "undefined" ? true : false), i18next: i18next}));
			this.isBillingCodeEnabled = !FeatureToggleService.isFeatureEnabled(FeatureToggleService.BILLING_CODE_DATAPARTNER_FEATURE);
			this.componentsRef = [];
			this.cnt = 0;
			this.isAdded = false;
			this.isRemoved = false;
			this.$('#find_audience_button').hide();
			this.isValueChangedInEditMode = false;
			this.isAdvertiserChangedForDemographic = false;
			this.advDropdownId, this.advDropdownId = null;
			this.modelingLevelRadio = 'MOOKIE';

			this.listenTo(this, "advertiserDropdownChange", function(value, text){
				this.advDropdownId = value;
				this.advDropdownText = text;
			});

			this.overlayInstance = new OverlayWithSectionsView();
			this.listenTo(this, "modelingLevelCheck", function(value, fromAddNewSet){
				this.overlayInstance.trigger('modelingLevelCheck', value);
				this.modelingLevelRadio = value;
				// this.renderMegaDropdown();
                if(!fromAddNewSet) {
                    $(".inclusion_seg_close").trigger('click');
                    $(".exclusion_seg_close").trigger('click');
                }
			});

			if($('#modelId').text().length) {
				this.checkModelingLevel();
			} else {
				this.setModelingLevel();
			}
		},

		setModelingLevel: function(){
		    if($('.js-modeling-level').length) {
				$('.js-modeling-level').each(function(index, item){
	                if($(item).checkbox('is checked')) {
	                	this.modelingLevelRadio = $(item).data('value');
	                }
	            }.bind(this));
			}
		},

		renderIncludeDataPartnerDropdown: function(){
		    var includeSelectedSeg = $('#segmentParentContainer').find('.js-selected-seg');

            includeSelectedSeg.each(function(index, elem){
                if($(elem).text() == 'Data Partner'){
                    $('a[data-value="observed.ACTIVITY.dataPartner"]')[index].click();
                }
            })
		},

		renderExcludeDataPartnerDropdown: function(){
            var excludeSelectedSeg = $('#exclusionSegmentParentContainer').find('.js-selected-seg');

            excludeSelectedSeg.each(function(index, elem){
                if($(elem).text() == 'Data Partner'){
                    $('a[data-value="observed.ACTIVITY.dataPartner"]')[index].click();
                }
            })
        },

		performAdvertiserDeletionOnChangeOfAdvertiser: function(){

		},

		render: function(){
			var self = this;

			this.$el.find("button[data-id='addCriteria']").hide();

			if(typeof self.options.data == "undefined" || self.options.data === null){

				this.attrReferences = ConfigService.getConfig("attrReferences");
				self.renderMegaDropdown();				
			}else{
				this.attrReferences = ConfigService.getConfig("attrReferences");
				self.renderRowInEditMode();
			}

			return this;
		},


		renderRowInEditMode: function(){
			var self = this;
			ConfigService.getConfig("rowConfigModel").resetVars();
			var currentLevel = ConfigService.getConfig("rowConfigModel").getParentObject(this.options.data.attributePath+"."+this.options.data.attributeName);

			this.renderMegaDropdown()
			.renderAdjoiningLabel(currentLevel, currentLevel["fieldForSelection"]);

			var arr = [self.options.data.attributePath.replace(".", ".")+"."+self.options.data.attributeName];

			_.each(self.options.data.selectedValues, function(value, key, list){
				var json = ConfigService.getConfig("rowConfigModel").renderNextComponent(arr);
				
				if(json){
					self.renderComponent(json, arr);				
				}else if(key == "selectedInterval" && arr.indexOf("observed.activity.activityLastOccurrence") == -1){
					//self.renderActivityIntervalSelection();
				}

			});
			this.isAdded = true;
			

		},		

		renderMegaDropdown: function(){
			var data = this.recreateOverlay();
			var instance = new OverlayWithSectionsView({
				"data" : data,
				"getExternalScope": this.options.getExternalScope,
				"forBuildModel": this.options.forBuildModel,
				"getModelType": this.options.getModelType,
				"getCampaignId": this.options.getCampaignId,
				"isInEditMode": typeof this.options.data != "undefined",
				"isForEdit": this.options.isForEdit,
				"modelType": this.options["modelType"],
				"isAccOrAdv": this.options["isAccOrAdv"],
				"campaignId": this.options.campaignId,
				"modelName": this.options.modelName,
				"isUsedForFindAudience": this.options.isUsedForFindAudience
			}),

			self = this;

			this.megaDrpDownInstance = instance;
			self.$('[data-id="attributeSelection"]').empty();
			self.$('[data-id="attributeSelection"]').attr("data-component-cnt", self.cnt);

			self.$('[data-id="attributeSelection"]').attr("data-external-scope", $('input[name=segment]:checked').val());

			self.$('[data-id="attributeSelection"]').append("<div data-type='label' class='attributeLabel'>SELECT ATTRIBUTE</div>");

			if(self.options.data !=undefined && self.options.data !=null && self.options.data!=''){
				self.$('[data-id="attributeSelection"]').addClass('disabled');
				//instance.disable();
			}
			
			self.$('[data-id="attributeSelection"]').append(instance.render().$el);

			var callback = function(_instance, _self){
				
				var instance1 = _instance;
				var self1=_self;

				return function(value){

					if(_instance != null){

						if(_instance.getSelection().length == 0 || typeof _self.options.forBuildModel == "undefined"){
							if(_self.isAdded){
								return;
							}
							_instance.unbind();
							_instance.remove();
							_instance = null;
							_self.$('[data-id="componentContainer"]').html('<div data-id="attributeSelection" class="modal_segment" style="float: left;" data-type="componentParentDiv"></div>');
							self.$el.find("button[data-id='addCriteria']").hide();
							_self.renderMegaDropdown();

						}else{
							if(_self.options.forBuildModel){
								if(_instance.$el.find(".col1 ul").find('[data-value="observed.CAMPAIGN.campaignLastClick"]').length == 0){
									_instance.$el.find(".col1 ul").prepend('<li data-value="observed.CAMPAIGN.campaignLastClick" title="Campaign Last Click">Campaign Last Click</li>');
								}

								if(!_self.isAdded){
									if(value == "-"){
										_instance.$el.find(".col1 ul").find('[data-value="observed.CAMPAIGN.campaignLastClick"]').hide();
									}else{
										if(_instance.$el.find(".col1 ul").find('[data-value="observed.CAMPAIGN.campaignLastClick"]').length > 1){
											_instance.$el.find(".col1 ul").eq(0).find('[data-value="observed.CAMPAIGN.campaignLastClick"]').remove();
										}
										_instance.$el.find(".col1 ul").find('[data-value="observed.CAMPAIGN.campaignLastClick"]').show();
									}
								}
							}

						}
					}
				};
			}(instance, self);

			if(self.options.selector){
				$(self.options.selector).on("change", callback);
			}

			self.on("campaignSelectChange", function(value){
				callback(value);								
			});

			var temp = {
					getValue: function(){

						var arr = instance.getSelection();

						return arr.length == 0 ? "" : instance.getSelection()[0].split(".")[2];
					}
			};


			this.componentsRef[this.cnt] = {
					"componentRef": temp,
					"fieldForSelection": "attributeName",
					"ref": instance
			};

			this.cnt++;


			this.listenTo(instance, "selectionDone", function(obj){
				self.removeAddedComponents();

				var temp = {
						getValue: function(){
							return instance.getSelection()[0].split(".")[2];
						}
				};

				self.componentsRef[self.cnt] = {
						"componentRef": temp,
						"fieldForSelection": "attributeName",
						"ref": instance
				};

				self.cnt++;

				var temp = ConfigService.getConfig("rowConfigModel");

				ConfigService.getConfig("rowConfigModel").resetVars();

				var nextComponentJson = ConfigService.getConfig("rowConfigModel").renderNextComponent(obj);

				var currentLevel = ConfigService.getConfig("rowConfigModel").getCurrentLevel();

				if(currentLevel!=undefined && currentLevel.scope!=undefined && currentLevel.scope!=null){
					self.currentScope=currentLevel.scope;
				}

				self.renderAdjoiningLabel(currentLevel, 'attributeName');

				self.renderComponent(nextComponentJson, obj);
				
				if(this.options.isUsedForFindAudience === true){
					self.$('[data-id="componentContainer"]').find(".recencyTooltip").remove();
				}
				self.trigger("change");
			});

			if(typeof this.options.getacvid != "undefined" && this.options.getacvid != ""){
				instance.setValue("observed.ACTIVITY.activityLastOccurrence");
				this.$(".outerDivOverlay .drpDwnBtn").css("background-color","#f6f6f6");
				instance.trigger("selectionDone", instance.getSelection());
			}

			if(typeof self.options.data != "undefined" && self.options.data !== null){
				instance.setValue(self.options.data.attributePath + "." +self.options.data.attributeName);
				this.$(".outerDivOverlay .drpDwnBtn").css("background-color","#f6f6f6");
			}

			if(this.options.isUsedForFindAudience === true){
				instance.setAudienceIndexingValue("observed.ACTIVITY.activityLastOccurrence");
				this.$(".outerDivOverlay .drpDwnBtn").css("background-color","#f6f6f6");
				instance.trigger("selectionDone", instance.getSelection());
				instance.disable();
			}

			return this;

		},

		renderAdjoiningLabel: function(componentConfigObj, lblForText){
			if(componentConfigObj){			
				if(componentConfigObj["adjoiningLabel"]){
					var existingLbl = this.$('[data-id="componentContainer"]').find("[data-label-for='"+lblForText+"']");
					if(existingLbl.length > 0){
						existingLbl.html(componentConfigObj["adjoiningLabel"]);//.css('text-transform','capitalize');
					}else{
						this.$('[data-id="componentContainer"]').append("<div class='field forLabel' data-label-for='"+lblForText+"'>"+componentConfigObj["adjoiningLabel"]+"</div>");
					}
				}else{
					this.$('[data-id="componentContainer"]').find("[data-label-for='"+lblForText+"']").remove();
				}
			}
			
			return this;
		},

		removeAddedComponents: function(){
			var addedComponents = this.$("[data-id='componentContainer']").find("[data-type='componentParentDiv']");

			addedComponents.each(function(index, elem){
				if(index != 0){
					$(elem).remove();
				}
			});

			this.$("[data-id='componentContainer']").siblings(".criteriaAddBtnContainer").find(".criteriaAddBtn").hide();

			this.componentsRef = [];
			this.cnt = 0;

			return this;
		},

		renderComponent: function(componentObj, megaDrpDwnSelectionObj){

			var self=this;

			if(componentObj == "attributeValueDropdown"){
				this.renderDropdown(ConfigService.getConfig("componentConfigModel").get("attributeValueDropdown"), megaDrpDwnSelectionObj);				
			}else if(componentObj["component"] == "dropdown"){
				this.renderDropdown(componentObj, megaDrpDwnSelectionObj);				
			}else if(componentObj["component"] == "demographicSegmentOverlay" || componentObj["component"] == "lookalikeSegmentOverlay"){
				this.renderDemographicSegmentOverlay(componentObj, megaDrpDwnSelectionObj);
			}else if(componentObj["component"] == "segmentBuilderActivityOverlay"){
				this.renderSegmentBuilderActivityOverlay(componentObj, megaDrpDwnSelectionObj);
			}else if(componentObj["component"] == "activityIntervalSelection" || componentObj == "activityIntervalSelection"){
				this.renderActivityIntervalSelection();		
				this.$("[data-id='addCriteria']").show();
				EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
			}else if(componentObj["component"] == "activityIntervalSelectionForAudiencePerformanceIndexing" || componentObj == "activityIntervalSelectionForAudiencePerformanceIndexing"){
				this.renderActivityIntervalSelection();				
			}else if(componentObj["component"] == "activityIntervalSelectionOptional" || componentObj == "activityIntervalSelectionOptional" || componentObj["component"] == "activityIntervalSelectionForAudiencePerformanceIndexing" || componentObj == "activityIntervalSelectionForAudiencePerformanceIndexing"){
				this.renderActivityIntervalSelectionOptional();				
			}else if(componentObj =="multiSelectDropdown" || componentObj["component"] =="multiSelectDropdown"){
				this.renderMultiSelectOverlay(componentObj);
			}else if(componentObj["component"] == "campaignExposureCountSelection" || componentObj == "campaignExposureCountSelection"){
				this.listenTo(this, "dropDownSelected", function(){
					self.$el.find("button[data-id='addCriteria']").show();
					EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
				});
				this.renderCampaignExposureCountSelection();
			}else if(componentObj["component"] == "campaignClickCountSelection" || componentObj == "campaignClickCountSelection"){
				this.renderCampaignClickCountSelection();
			}
			else if(componentObj["component"] == "campaignIntervalSelection" || componentObj == "campaignIntervalSelection"){
				this.rendercampaignIntervalSelection();
			}
			else if(componentObj["component"] == "cookieAgeDropDown" || componentObj == "cookieAgeDropDown"){
				this.renderCookieAgeDropdown();
				this.$el.find("button[data-id='addCriteria']").show();
				if(!this.isAdded){
					this.trigger("addNewSetConditions");
					EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
				}
			}else if(componentObj["component"] == "rawInterestCount" || componentObj == "rawInterestCount"){
				this.renderRawInterestCount();
				this.$el.find("button[data-id='addCriteria']").show();
				if(!this.isAdded){
					this.trigger("addNewSetConditions");
					EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
				}
			}else if(componentObj["component"] == "interestSegmentOverlay" || componentObj == "interestSegmentOverlay"){
				this.renderInterestSegmentOverlay(componentObj);

			}else if(componentObj["component"] == "segmentBuilderCustVariableOverlay"){
				this.renderCustomVariableOverlay(componentObj);

			}else if(componentObj["component"] == "audiencePerformanceIndexing"){
				this.renderAudiencePerformanceIndexing(componentObj,megaDrpDwnSelectionObj);

			}else if(componentObj == "numberTextBox" || componentObj["component"] == "numberTextBox"){
				this.renderNumberTextBox(componentObj);

			}else if(componentObj == "stringTextBox" || componentObj["component"] == "stringTextBox"){
				this.renderStringTextBox(componentObj);

			}
			if((componentObj!=undefined && componentObj!=null && componentObj!='') && (componentObj["component"]==undefined || componentObj["component"]==null ||  componentObj["component"]=='')){
				if(componentObj == "activityIntervalSelectionForAudiencePerformanceIndexing"){
					this.$('#find_audience_button').show();
				}else{
					this.$el.find("button[data-id='addCriteria']").show();
					if(!this.isAdded){
						this.trigger("addNewSetConditions");
						EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
					}
				}
			}
		},

		renderAudiencePerformanceIndexing : function(componentObj,megaDrpDwnSelectionObj){
			var self = this;
			this.$('#find_audience_button').hide();
			var container = $("<div data-type='componentParentDiv' class='ati-global-search' style='float: left;'></div>");
			this.$('[data-id="componentContainer"]').append(container);
			var opt={};
			opt.edit={};
			if(megaDrpDwnSelectionObj.toString().toLowerCase()=="observed.ACTIVITY.activityLastOccurrence".toLowerCase()){
				opt.selectedEntity="activityLastOccurance";
			}else if(megaDrpDwnSelectionObj.toString().toLowerCase()=="observed.ACTIVITY.campaignLastClick".toLowerCase()){
				opt.selectedEntity="campaignLastClick";
			}

			if(this.options.data){			
				opt.edit.activityId=this.options.data.selectedValues.entity.activityId;
				opt.edit.activityName=this.options.data.selectedValues.entity.activityName;
				opt.edit.campaignId=this.options.data.selectedValues.entity.campaignId;
				opt.edit.campaignName=this.options.data.selectedValues.entity.campaignName;
				opt.edit.advertiserId=this.options.data.selectedValues.entity.advertiserId || this.options.data.advertiserId;
				opt.edit.advertiserName=this.options.data.selectedValues.entity.advertiserName;
				opt.edit.scope=this.options.data.selectedValues.entity.scope;
				opt.edit.isEdit=true;
				opt.edit.type = this.options.data.selectedValues.entity.type;
			}
			opt.url="getApiData.htm";
			opt.componentConfiguration=this.getComponentConfigurationData();

			var instance = new AudiencePerformanceIndexingComponentView(opt);
			container.html("");

			container.append(instance.render().$el);
			//instance.render();
			this.listenToOnce(instance, "audiencePerformanceSelectionDone", function(optionSelected){
				var nextComponentJson = ConfigService.getConfig("rowConfigModel").renderNextComponent();

				if(nextComponentJson!=null){
					self.renderComponent(nextComponentJson);
				}
				
			});
			
			this.listenTo(instance, "onChangeActivitySelection", function(optionSelected){
				self.trigger("renderAccountDropDownView",optionSelected);
			});
			
			var obj = {
					getValue: function(){ 
						return instance.getSelectedValue();

					}
			};

			self.componentsRef[this.cnt] = {
					"componentRef": obj,
					"fieldForSelection": componentObj["fieldForSelection"],
					"fieldForActivitySelection": componentObj["fieldForActivitySelection"],								
					"ref": instance
			};
			this.cnt++;
		},
		getComponentConfigurationData:function(){
			var configurationData=[
			                       {
			                    	   id:"activityLastOccurance",
			                    	   configuration:{
			                    		   topLevelDropDown:[{"text":"ADVERTISER ACTIVITY","scope_id":"avertiser_activity"},{"text":"ACCOUNT ACIVITY","scope_id":"account_activity"}]
			                    	   }
			                       },
			                       {
			                    	   id:"campaignLastClick",
			                    	   configuration:{
			                    		   topLevelDropDown:[{"text":"ADVERTISER CAMPAIGN","scope_id":"avertiser_CAMPAIGN"}]
			                    	   }
			                       }
			                       ];
			return 	configurationData;
		},

		renderInterestSegmentOverlay : function(componentObj, megaDrpDwnSelectionObj){
			var container = $("<div data-type='componentParentDiv' class='interestSegmentOverlay'></div>");
			this.$('[data-id="componentContainer"]').append(container);
			var opt={};
			if(typeof this.options.data != "undefined"){
				var selectedVals = this.options.data.selectedValues;

				opt.isEdit = true;
				opt.selectedElementArray = selectedVals[componentObj["fieldForSelection"]];
				this.$el.find(".criteriaRemoveBtnContainer").show(); 
				this.$el.find('.criteriaAddBtnContainer').hide();
			}
			var instance = new SegmentInterestDrpDwnView(opt);
			var self = this;
			this.listenTo(instance, "valueSelectedFromInterestSelect", function(){
				self.$el.find("button[data-id='addCriteria']").show();
				if(self.isadded==false) {
					self.trigger("addNewSetConditions");
					EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
				}
			});
			container.append(instance.$el);

			var obj = {
					getValue: function(){ 
						return instance.getSelection();
					}
			};

			self.cnt++;

			self.componentsRef[self.cnt] = {
					"componentRef": obj,
					"fieldForSelection": componentObj["fieldForSelection"],
					"ref": instance
			};

			container.attr("data-component-cnt", self.cnt);

		},

		renderDropdown: function(componentObj, optionsData){

			var self = this;

			if(componentObj["attributeName"] == "dataPartnerDropdown"){

				var selectedAdvertiserId = this.options.getAdvertiserId();
				var _isValidAdv = (selectedAdvertiserId == "" || selectedAdvertiserId == null || typeof selectedAdvertiserId == "undefined");

				/*componentObj["options"] = ConfigService.getConfig("dataPartnersModel").getOptions(
						_isValidAdv ? "ALL_ADV" : "THESE_ADV", _isValidAdv ? undefined : [selectedAdvertiserId]);*/

				componentObj["options"] = _.filter(ConfigService.getConfig("dataPartnersModel"), function(obj){
					var scope = _isValidAdv ? "ALL_ADV" : "THESE_ADV"
					var advertisers = selectedAdvertiserId.length == 0 ? undefined : [selectedAdvertiserId];
					if(scope == "ALL_ADV"){
						return obj["scope"] == "ALL_ADV";
					}else{
						return obj["scope"] == "ALL_ADV" || (advertisers.length === _.intersection(advertisers, obj["advertiserIds"].split(",")).length);
					}				
				});
				
				this.addAdvertiserChangeClickHandler();

				this.onSuccessDropdownDataFetch(componentObj);

			}else if(componentObj["source"] == "options"){

				if(typeof optionsData !== "undefined" && optionsData != null){
					componentObj["options"] = (optionsData.length >= 1 && typeof optionsData[0] == "string") ? componentObj["options"] : optionsData;
				}

				this.onSuccessDropdownDataFetch(componentObj);

			}else if(componentObj["source"] == "dynamic"){
				if(this.options.data && !this.isValueChangedInEditMode 
					&& componentObj["fieldForSelection"] !== "dataAttributeValues" 
					&& componentObj["fieldForSelection"] !== "dataAttribute"
					&& componentObj["objectType"] !== "interest"){
					//componentObj["options"] = [this.options.data["selectedValues"][componentObj["fieldForSelection"]]];
					this.fetchDropdownData(componentObj)
					.done(function(resp){
						componentObj["options"] = componentObj["recordsKey"] ? (componentObj["recordsKey"].split(".").length ==2 ? resp[componentObj["recordsKey"].split(".")[0]][0][componentObj["recordsKey"].split(".")[1]] : resp[componentObj["recordsKey"]]) : resp;

						if(componentObj["recordsKey"].split(".").length == 2 && resp[componentObj["recordsKey"].split(".")[0]][0].varValueRefMapping !== undefined){
							componentObj["varValueRefMapping"] = resp[componentObj["recordsKey"].split(".")[0]][0].varValueRefMapping;
						} else if(componentObj["attributeName"] === "dataAttribute"){
							componentObj["varValueRefMapping"] = undefined;
						}

						self.onSuccessDropdownDataFetch(componentObj);	
					});					
				}else{
					this.fetchDropdownData(componentObj)
					.done(function(resp){
						if(componentObj["objectType"] && componentObj["objectType"] === "interest"){
							componentObj["options"] = resp.segments.map(function(x){return {id: x.categoryId, name: x.name}});
						} else {
							componentObj["options"] = componentObj["recordsKey"] ? (componentObj["recordsKey"].split(".").length ==2 ? resp[componentObj["recordsKey"].split(".")[0]][0][componentObj["recordsKey"].split(".")[1]] : resp[componentObj["recordsKey"]]) : resp;
							componentObj["options"] = typeof componentObj["options"] == "undefined" ? [] : componentObj["options"];

							if(componentObj["recordsKey"].split(".").length == 2 && resp[componentObj["recordsKey"].split(".")[0]][0].varValueRefMapping !== undefined){
								componentObj["varValueRefMapping"] = resp[componentObj["recordsKey"].split(".")[0]][0].varValueRefMapping;
							} else if(componentObj["attributeName"] === "dataAttribute"){
								componentObj["varValueRefMapping"] = undefined;
							}
						}

						if(self.$el.find('.js-dummy-container').length > 0){
							self.$el.find('.js-dummy-container').remove();	
						}
						self.onSuccessDropdownDataFetch(componentObj);
					});
				}
			}

			return this;
		},

		fetchDropdownData: function(componentObj){
			/*
		    if(this.modelingLevelRadio == 'DEVICE_IOS' || this.modelingLevelRadio == 'DEVICE_GOG'){
		        var modelingLevelRadio = 'DEVICE_IDS'
		    } else {
		        var modelingLevelRadio = 'COOKIES'
		    }
		    */

		    var modelingLevelRadio = 'COOKIES'; 
		    if($('.js-modeling-level').length) {
				$('.js-modeling-level').each(function(index, item){
	                if($(item).checkbox('is checked')) {
	                	var selectedModelingLevelRadio = $(item).data('value');
	                	if(selectedModelingLevelRadio == 'DEVICE_IOS' || selectedModelingLevelRadio == 'DEVICE_GOG'){
					        modelingLevelRadio = 'DEVICE_IDS';
					    }
	                }
	            }.bind(this));
			}

			var reqJson = {};

			if(componentObj["params"]){

				if(componentObj["isDependentOnPrevious"] == "yes"){
					for(var i=0;i<this.componentsRef.length;i++){
						if(this.componentsRef[i] != null){
							if(componentObj["attributeName"] == "dataSource"){
								if(this.componentsRef[i]["fieldForSelection"] == "dataPartner"){
									//componentObj["params"]["queryString"] = "filterBy=status:A;&id_type="+modelingLevelRadio+"&dataPartnerKey="+this.componentsRef[i].componentRef.getValue()["id"]+"&orderByColumn=name&orderBy=asc&rowsPerPage=0&pageNumber=0";
									componentObj["params"]["queryString"] = "filterBy=status:A;id_type:"+modelingLevelRadio+"&dataPartnerKey="+this.componentsRef[i].componentRef.getValue()["id"]+"&orderByColumn=name&orderBy=asc&rowsPerPage=0&pageNumber=0";
								}
							}else if(componentObj["attributeName"] == "dataAttribute"){
								if(this.componentsRef[i]["fieldForSelection"] == "dataSource"){
									componentObj["params"]["id"] = this.componentsRef[i].componentRef.getValue()["id"];
								}
							}else if(componentObj["params"]["entity"] == "customVariableValues"){
								if(this.componentsRef[i]["fieldForSelection"] == "dataSource"){
									componentObj["params"]["dataSourceId"] = this.componentsRef[i].componentRef.getValue()["id"];
								}
								if(this.componentsRef[i]["fieldForSelection"] == "dataAttribute"){
									componentObj["params"]["dataAttributes"] = this.componentsRef[i].componentRef.getValue()["name"];
								}							
							} else if(this.componentsRef[i]["fieldForSelection"] == "dataAttribute" && componentObj["attributeName"] == "dataAttributeValues"){
								componentObj["prevSelectedValue"] = this.componentsRef[i].componentRef.getValue()["name"];
							}
						}
					}
				}

				//Store varValueRefMapping object to componentObj
				if(componentObj["attributeName"] === "dataAttributeValues"){

					this.componentsRef.map(function(x){
						if(x && x.fieldForSelection === "dataSource" && x.componentRef.getFullValue() && x.componentRef.getFullValue().varValueRefMapping){
							var varValueRefMappings = x.componentRef.getFullValue().varValueRefMapping.filter(function(x){return x.varName === componentObj.prevSelectedValue});
							if(varValueRefMappings && varValueRefMappings.length > 0){
								componentObj["varValueRefMapping"] = varValueRefMappings;
							}							
						}

						if(typeof componentObj["varValueRefMapping"] === "undefined" && x.fieldForSelection === "dataOptions" && x.componentRef.getFullValue()
							&& x.componentRef.getFullValue().next && x.componentRef.getFullValue().next.varValueRefMapping ){
							var varValueRefMappings = x.componentRef.getFullValue().next.varValueRefMapping;
							componentObj["varValueRefMapping"] = varValueRefMappings.filter(function(x){return x.varName === componentObj.prevSelectedValue});
						}					
					});
					
				}

				if(typeof componentObj["params"]["accountId"] != "undefined"){
					componentObj["params"]["accountId"] = AccountService.getCurrentAccount().id;
				}
				reqJson = _.extend(reqJson, componentObj["params"]);

			} else if(componentObj["objectType"] === "interest") {
				var data = {
					"accountId": AccountService.getCurrentAccount().id,
					"option": "interestSegments",
					"modelType": componentObj["modelType"],
					"modelingLevel": this.modelingLevelRadio
				};
				/*
				//NOTE: When Modeling Level Ios or Android radio buttons checked
				if(this.modelingLevelRadio === 'DEVICE_IOS' || this.modelingLevelRadio === 'DEVICE_GOG') {
					data["modelingLevel"] = this.modelingLevelRadio;
				} 
				*/
				reqJson = _.extend(reqJson, data);
			}

			return RemoteService.ajax({
				url: componentObj["dataUrl"],
				data: JSON.stringify(reqJson),
				type: "post"
			});
		},

		onSuccessDropdownDataFetch: function(componentObj, megaDrpDwnSelectionObj, componentType){
			var container = $("<div class='field width grid js-columns' data-type='componentParentDiv' style='margin: 0 .5em 1em 0; clear: none; float: left;'></div>"),
			self = this;
			var staticWidth = 129;
			var widthChangeCounter = 0; 
			var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
			var uniqid = randLetter + Date.now();

			if (componentObj && componentObj.options && componentObj.options.length === 2) {
				for(var i = 0; i < componentObj.options.length; i++) {
			 		if(componentObj.options[i].name === "Internal" || componentObj.options[i].name === "External") {
				    	widthChangeCounter++;
				 	}
				}
			}

			if (widthChangeCounter === 2) {
				staticWidth = 100;
			}

			if(self.$el.find('.js-dummy-container').length > 0){
				self.$el.find('.js-dummy-container').remove();	
			}

			this.$('[data-id="componentContainer"]').append(container);
			var selectRef =	'<div class="ui search selection dropdown" data-id="'+uniqid+'" style="min-width:'+staticWidth+'px;"> <input type="hidden"/><i class="dropdown icon"></i><div class="default text">SELECT</div> <div class="menu multiSelectMenu"></div> </div>';
			//var selectRef =	'<input type="hidden" id="select2_container_ruleView"/>';

			//container.append("<div data-type='label' class='attributeLabel'>"+componentObj["header"]+"</div>");

			if(componentObj.attributeName === 'dataPartnerDropdown') {
				container = $(container).addClass('custom-size-dp-dropdown');
			}

			if((componentObj.dropDownCssClass === 'customMultiSelectDrpDn' || componentObj.dropDownCssClass === 'multiSelectDataPartnerDrpDn' || componentObj.dropDownCssClass === 'dPMultiSelectDrpDn') && (componentObj.width === "160" || componentObj.width === "170" || componentObj.width === "133")) {
				container = $(container).addClass('custom-size-multiselect');
			}

			container.append(selectRef);

			this.$el.find('.menu .browse').popup('hide');		

			if(componentObj.multiple === "true") {
				container.find("[data-id='"+uniqid+"']").addClass('multiple');
			}	
			
			// This change is added to use string value returned for custom variable value in case of "is" condition selection, till json object is not returned from server.
			if(typeof this.options.data != "undefined" && !this.isValueChangedInEditMode){
				if(typeof componentObj["params"] != "undefined"){
					if(componentObj["fieldForSelection"] == "textBoxValue" && componentObj["params"]["entity"] == "customVariableValues"){
						componentObj["options"] = {
							"id" : this.options.data.selectedValues.textBoxValue,
							"text": this.options.data.selectedValues.textBoxValue,
							"name": this.options.data.selectedValues.textBoxValue
						};		
					}else if(componentObj["fieldForSelection"] == "textBoxValues"){						

						if(typeof this.options.data.selectedValues["dataAttribute"] !== "undefined" 
							&& typeof this.options.data.selectedValues["dataAttribute"].type !== "undefined"
							&& this.options.data.selectedValues["dataAttribute"].type !== "" && ["RAW", "MAPPED"].includes(this.options.data.selectedValues["dataAttribute"].type) ){

							//Get textbox values
							var textBoxArray = this.options.data.selectedValues.textBoxValues;

							if(this.options.data.selectedValues["dataAttribute"].type === "RAW"){
								componentObj["options"] = [];
								textBoxArray.forEach(function(val){
									componentObj["options"].push({"id": val, "text": val, "name": val});
								})								
							} else {
								//Get selected data attribute value
								var attrName = this.options.data.selectedValues.dataAttribute.name;
								var self = this;


								//Get Mapped values
								var internalVals = this.getMappedValues(attrName);

								if(internalVals.length === 0){
									//Get Mapped internal values
									var internalVals = this.getMappedInternalValues(attrName, textBoxArray);
								}
							
								componentObj["options"] = [];
								internalVals.forEach(function(internalVal){
									componentObj["options"].push(internalVal);
								});

								//Get All updated mapped values
								var internalVals = this.getAllMappedValues(attrName);

								internalVals.then(function(internalValues){

									if(internalValues.length === 0){
										//Get Mapped internal values
										var internalValues = self.getMappedInternalValues(attrName, textBoxArray);
									}

									componentObj["options"] = [];
									internalValues.forEach(function(internalVal){
										componentObj["options"].push(internalVal);
									});	

								});
							}

																					

						} else if (componentObj["params"]["entity"] == "customVariableValues") {
							var textBoxArray = this.options.data.selectedValues.textBoxValues;
							componentObj["options"] = [];
							for(var i=0; i < textBoxArray.length; i++) {
								componentObj["options"].push({
										"id" : textBoxArray[i],
										"text": textBoxArray[i],
										"name": textBoxArray[i]
									});
							}
						}						
					}
				}

				if(componentObj["fieldForSelection"] == "textBoxValues"){

					if(typeof this.options.data.selectedValues["dataAttribute"] !== "undefined" 
						&& typeof this.options.data.selectedValues["dataAttribute"].type !== "undefined"
						&& this.options.data.selectedValues["dataAttribute"].type !== "" && ["RAW", "MAPPED"].includes(this.options.data.selectedValues["dataAttribute"].type) ){

						//Get textbox values
						var textBoxArray = this.options.data.selectedValues.textBoxValues;

						if(this.options.data.selectedValues["dataAttribute"].type === "RAW"){
							componentObj["options"] = [];
							textBoxArray.forEach(function(val){
								componentObj["options"].push({"id": val, "text": val, "name": val});
							});
						} else {							
							//Get selected data attribute value
							var attrName = this.options.data.selectedValues.dataAttribute.name;
							var self = this;


							//Get Mapped values
							var internalVals = this.getMappedValues(attrName);

							if(internalVals.length === 0){
								//Get Mapped internal values
								var internalVals = this.getMappedInternalValues(attrName, textBoxArray);
							}
						
							componentObj["options"] = [];
							internalVals.forEach(function(internalVal){
								componentObj["options"].push(internalVal);
							});															

							//Get All updated mapped values
							this.getAllMappedValues(attrName).							
							then(function(internalValues){

								if(internalValues.length === 0){
									//Get Mapped internal values
									var internalValues = self.getMappedInternalValues(attrName, textBoxArray);
								}
							
								componentObj["options"] = [];
								internalValues.forEach(function(internalVal){
									componentObj["options"].push(internalVal);
								});															

							})
						}


					}
				}

			}	


			//Set the previous selected value for component which are loaded from options
			for(var i=0;i<this.componentsRef.length;i++){
				if(this.componentsRef[i] != null){
					if(this.componentsRef[i]["fieldForSelection"] == "dataAttribute" && componentObj["attributeName"] == "dataAttributeValues"){
						componentObj["prevSelectedValue"] = this.componentsRef[i].componentRef.getValue()["name"];
					}
				}
			}

			
			var inputFieldRef = container.find(".ui.dropdown");

			var defaultSelected = undefined;
			_.each(componentObj["options"], function(elem){
				elem["id"] = elem["value"] || elem[componentObj["idAttribute"]];
				elem["text"] = elem["name"] || elem[componentObj["nameAttribute"]];
				
				if(elem["key"] && elem["key"].length) {
					elem["key"] = elem["key"];
				}
				if(componentObj["attributeName"] === "dataAttribute"){
					elem["value"] = elem["name"];
					elem["displayName"] = elem["displayName"] + " (" + elem["name"] + ")";
				}

				if(elem["default"]!=undefined && elem["default"])
					defaultSelected = elem;
			});
			(function(inputFieldRef, componentObj, self){
			if( self.isCustomValues(componentObj) ){
				$(inputFieldRef).data('componentOptions',  componentObj.options).dropdown({
				    fullTextSearch : "exact",
				    match: "text",
					saveRemoteData : false,
					forceSelection: false,
					apiSettings: {
						url : componentObj.dataUrl,
						method : 'POST',
						throttle : 300,
						cache : false,
						contentType: 'application/json; charset=utf-8',
						beforeSend: function (settings) {
							var value = $(this).find('.search').val();
							self.setRequestParamsForAttributeValues(componentObj);	
							settings.data = JSON.stringify(
								{	
									"accountId" : AccountService.getCurrentAccount().id,
									"dataSourceId" : componentObj["params"]["dataSourceId"],
									"dataAttributes": componentObj["params"]["dataAttributes"],
									"entity" : 'customVariableValues',
									"queryString": componentObj["params"]["queryString"],
									"searchBy": value
								});
	                    	return true;
						},
						onRequest : function(promise, xhr){
							console.log("onRequest", promise, xhr);
						},
						onAbort : function(errorMessage, element, xhr){
							return false;
						},
						onFailure : function(response, element){
							return false;
						},
						onResponse: function (response) {
							this.dropdownVals = $(inputFieldRef).dropdown('get values');
							var responseJson = {
								results : []
							};

							if(!response) {
					          return;
					        }

					       	response.variables = _.filter(response.variables, function(record){
					       		if(this.dropdownVals.indexOf(record.id) === -1){
								  record["text"] = record["name"];
								  record["value"] = record["id"];
								  return record;
								} 
								 
							}.bind(this));
							var more = (parseInt(response.paging.pageNumber) * parseInt(response.paging.rowsPerPage)) < parseInt(response.paging.totalRows);
							return {
								results: response.variables.indexOf(undefined) !== -1 ? [] : response.variables,
								more : more
							};
						},
					},

					allowAdditions: componentObj.multiple === "true" ? true : false,
					useLabels: true,

					onRemove: function (removedValue, removedText, $removedChoice) {
						if ($(inputFieldRef).find('a').length <= 1) {
							$(inputFieldRef).css('width', componentObj["width"]);
						}
					},

					onChange: function (value, text, $choice) {
						$(inputFieldRef).find('.multiSelectMenu').css('display', 'none');
						self.$("button[data-id='addCriteria']").show();
						if(!self.isAdded){
							self.trigger("addNewSetConditions");
							EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
						}
					}
				});

				$(inputFieldRef).find('.search').on('keypress', function () {
					$(inputFieldRef).find('.multiSelectMenu').css('display', 'block');
					if ($(inputFieldRef).outerWidth() >= '200') {
	    				$(inputFieldRef).css('min-width', '205px');
	    				$(inputFieldRef).css('width', 'auto');
    				}
				});

				$(inputFieldRef).find('.menu').html('<div></div>')
				
	    		$(inputFieldRef).css('width', (componentObj["width"] ? componentObj["width"] : 75)/12 +'em');

				if(componentObj.multiple === "true"){
		    		$(inputFieldRef).addClass('fluid');
		    		$(inputFieldRef).find('input.search').on('change', function (event) {
		    			if ($(inputFieldRef).outerWidth() >= '200') {
		    				$(inputFieldRef).css('min-width', '205px');
		    				$(inputFieldRef).css('width', 'auto');
		    				$(inputFieldRef).css('max-width', '756px');
		    			}else {
		    				$(inputFieldRef).css('width', componentObj["width"]);
		    			}
		    		});
					$(inputFieldRef).find('input.search').css('min-width', '2.2em');
		    	}	
				
				if(componentObj.placeholder){
					$(inputFieldRef).find('.default.text').text(componentObj.placeholder.toLowerCase());
				}	

			}else{
				$(inputFieldRef).css('width', (componentObj["width"] ? componentObj["width"] : 75)/12 +'em');
				$(inputFieldRef).find('input.search').css('min-width', '2.2em');
				//750 Sorting
				$.each(self.sortResponseInOption(componentObj.options), function(index, item){
					if(self.isBillingCodeEnabled && self.options.selectedDPs && self.options.selectedDPs.length > 0) {
						if(componentObj.attributeName === 'dataPartnerDropdown' && _.contains(self.options.selectedDPs,item.id)) {
							if(item.key && item.key.length) {
                                $(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'" data-key="'+item.key+'">' + item.name + '</div>');
                            }else {
                                $(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'">' + item.name + '</div>');
                            }
						}else if(componentObj.attributeName !== 'dataPartnerDropdown') {
							if(item.key && item.key.length) {
								if(item.displayName && item.displayName.length > 0 ){
									$(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'" data-key="'+item.key+'" data-name="'+item.name+'">' + item.displayName + '</div>');
								}else{
									$(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'" data-key="'+item.key+'">' + item.name + '</div>');
								}
                            }else {
                                $(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'">' + item.name + '</div>');
                            }
						}
					}else {
						if(item.key && item.key.length) {
							if(item.displayName && item.displayName.length > 0 ){
								$(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'" data-key="'+item.key+'" data-name="'+item.name+'">' + item.displayName + '</div>');
							}else{
								$(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'" data-key="'+item.key+'">' + item.name + '</div>');
							}
						}else {
							$(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'">' + item.name + '</div>');	
						}
					}
					// $(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'">' + item.name + '</div>');
				});
				
				$(inputFieldRef).data('componentOptions',  componentObj.options).dropdown({
				    fullTextSearch : "exact",
				    match: "text",
				    forceSelection: false,
				    onShow: function() {
				    	var itemLen = $(inputFieldRef).find('.menu .item').map(function(index, item){
							return $(item).text().length;
						});

				    	var maxLen = _.max(itemLen);
						if(maxLen > 36){
							$(inputFieldRef).find('.menu').css('min-width', (maxLen+140)+'%');
						}else if(maxLen > 30 && maxLen <= 36) {
							$(inputFieldRef).find('.menu').css('min-width', (maxLen+120)+'%');
						}else {
							$(inputFieldRef).find('.menu').css('min-width', '100%');
						}
				    },
				    //MIUI2-1006-To add new change
				    onHide: function(){
                         $(this).find('.sizer').text("");
                         $(this).find('.search').val("");
                        }
				});
				
				if(componentObj.placeholder){
					$(inputFieldRef).find('.default.text').text(componentObj.placeholder.toLowerCase());
				}				
			}
				
				var flag = true;
				if(self.options.data){
					var _flag = false;
					if(componentObj["attributeName"]){
						if(componentObj["attributeName"] == "dataPartnerDropdown" || componentObj["source"] == "options"){
							_flag = true;
						}
					}
	
					if(!_flag){
						self["isDataFetchedFor"+componentObj["attributeName"]] = undefined;
						inputFieldRef.on("select2-open", function(e){
							if(self["isDataFetchedFor"+componentObj["attributeName"]] === true){
								return;
							}
							if(typeof componentObj["dropDownCssClass"] != "undefined"){
								$("."+componentObj["dropDownCssClass"]).addClass("dropdownLoader");
							}
							self.fetchDropdownData(componentObj)
							.done(function(resp){

								if(componentObj["objectType"] && componentObj["objectType"] === "interest"){
									componentObj["options"] = resp.segments.map(function(x){return {id: x.categoryId, text: x.name}});
								} else {
									resp = componentObj["recordsKey"].split(".").length == 2 ? resp[componentObj["recordsKey"].split(".")[0]][0][componentObj["recordsKey"].split(".")[1]] : resp[componentObj["recordsKey"]];
		
									resp = typeof resp == "undefined" ? [] : resp;
		
									_.each(resp, function(elem){
										elem["id"] = elem[componentObj["idAttribute"]];
										elem["text"] = elem[componentObj["nameAttribute"]];		
                                        
                                        if(elem["key"] && elem["key"].length) {
                                            elem["key"] = elem["key"];
										}

									});
		
									componentObj["options"] = resp;
									self["isDataFetchedFor"+componentObj["attributeName"]] = true;
								}
	
								


								if(flag){
									flag = false;
									//inputFieldRef.select2("close");
									//inputFieldRef.select2("open");
								}
								if(typeof componentObj["dropDownCssClass"] != "undefined"){
									$("."+componentObj["dropDownCssClass"]).removeClass("dropdownLoader");
								}
							});				
						});
					}
				}
			})(inputFieldRef, $.extend(true, {}, componentObj), self);			


			if(componentObj["isReadOnly"]){
				if(typeof this.options.data != "undefined" && !this.isValueChangedInEditMode){

					var attributePresent = this.options.data.selectedValues.dataSource.attributePresent;

					if(typeof attributePresent != "undefined" && attributePresent === true){

					}else{
						inputFieldRef.dropdown("readonly").addClass('disabled');
					}
				}else{
					inputFieldRef.dropdown("readonly").addClass('disabled');
				}
			}

			$(document).on("click", function(e){
				$("#select2_container_ruleView").dropdown('close');
			});

			var obj = {
					getValue: function(){
						if(componentObj["responseFields"]){
							var obj = {};
							// selectedValueObj = inputFieldRef.data("selectOptionData");

							// for(var i=0;i<componentObj["responseFields"].length;i++){
							// 	if(selectedValueObj == null){
							// 		obj = {};
							// 		break;
							// 	}else{
							// 		obj[componentObj["responseFields"][i]] = selectedValueObj[componentObj["responseFields"][i]];
							// 	}
							// }
							
							var id = inputFieldRef.dropdown('get value');
							var text = inputFieldRef.dropdown('get text');
							var name;
							var domElement;
							if(inputFieldRef.dropdown('get item') && typeof inputFieldRef.dropdown('get item').data == "function"){
								name = inputFieldRef.dropdown('get item').data('name');
								domElement = String(inputFieldRef.dropdown('get item').data('key') ? inputFieldRef.dropdown('get item').data('key') : '');
							}

							obj['id'] = id;
							obj['name'] = name || text;

							if(domElement && domElement.length) {
								obj['key'] = domElement;
							}

							return obj;
						}else{

							var _data = inputFieldRef.data("selectOptionData");
							var attributeKey = (inputFieldRef && inputFieldRef.data("selectOptionData") && inputFieldRef.data("selectOptionData").key) ? inputFieldRef.data("selectOptionData") : '';
							var _tempObj;
							if(componentObj['multiple'] === 'true'){
								var values = inputFieldRef.dropdown('get values');
								var item;
								if(values.length > 0){
									_data = [];
									values.forEach(function(val){									
										item = {};
										item["id"] = val;
										item["text"] = inputFieldRef.dropdown('get item', val) ? inputFieldRef.dropdown('get item', val).text() : val;
										item["name"] = item["text"];
										_data.push(item);
									});
								} else {
									_data = null;
								}

							} else {
								var id = inputFieldRef.dropdown('get value');
								var text = inputFieldRef.dropdown('get text');
							}

							if(!_.isArray(_data) && id && text){
								_data = {};
								_data["id"] = id;
								_data["text"] = text;

								if(attributeKey.key && attributeKey.key.length) {
									_data["key"] = _data.key;
								}
							}

							if(_data != null && typeof _data != "undefined"){

								if(componentObj["objectType"] === 'interest'){
									_tempObj = _data;
								} else if(_.isArray(_data)){
									_tempObj = _.pluck(_data, "id");
								}else{
									_tempObj = { 
										"id": _data["id"], 
										"name": _data["text"]
									};

									if(attributeKey.key && attributeKey.key.length) {
										_tempObj["key"] = attributeKey.key;
									}	
								}

								if(_data["customVariables"]){
									_tempObj["customVariables"] = _data["customVariables"]; 
								}


								if(_data["varValueRefMapping"]){
									_tempObj["varValueRefMapping"] = _data["varValueRefMapping"]; 
								}
							}

							return _data == null ? undefined : _tempObj;

						}
					},
					getFullValue: function(){

						var _data = inputFieldRef.dropdown("get value");

						return _data == null ? undefined : _data;
					}
			};

			this.cnt++;

			if(typeof componentObj["parentComponent"] == "undefined"){

				this.componentsRef[this.cnt] = {
						"componentRef": obj,
						"fieldForSelection": componentObj["fieldForSelection"]
				};
			}

			if(componentObj["attributeName"] && componentObj["attributeName"] == "dataPartnerDropdown"){
				inputFieldRef.on("change", function(e){
					self.trigger("dataPartnerSelected");
				});	
				this.dataPartnerConfigObj = componentObj;	
				this.dataPartnerContainer = container;
			}

			container.attr("data-component-cnt", self.cnt);

			if(typeof this.options.data != "undefined" && this.isValueChangedInEditMode == false){
				if(componentObj["options"] != undefined && Object.keys(componentObj["options"]).length == 1){
					if(componentObj["options"][0]["value"] != undefined || componentObj["options"][0][componentObj["idAttribute"]] != undefined){
						if(componentObj["fieldForSelection"] == "textBoxValues"){
							var selectedVals = this.options.data;
  							var _selectionObj = selectedVals["selectedValues"][componentObj["fieldForSelection"]];
  							inputFieldRef.dropdown('set selected', _selectionObj);
  							if(inputFieldRef.find('.ui.label.transition').hasClass('hidden')){
								inputFieldRef.find('.ui.label.transition').removeClass('hidden');
							}
							//====================================Remove exsiting style and add new inline-block style
							inputFieldRef.find('a').removeAttr('style');
							inputFieldRef.find('a').css('animation-duration', '200ms');
							//inputFieldRef.select2("val", _selectionObj);
						}else{
							inputFieldRef.dropdown('set selected', componentObj["options"][0]["value"] || componentObj["options"][0][componentObj["idAttribute"]]);
							if(inputFieldRef.find('.ui.label.transition').hasClass('hidden')){
								inputFieldRef.find('.ui.label.transition').removeClass('hidden');
							}
							inputFieldRef.find('a').removeAttr('style');
							inputFieldRef.find('a').css('animation-duration', '200ms');
							inputFieldRef.data('selectOptionData',  componentObj["options"][0]);
							//inputFieldRef.select2("val", componentObj["options"][0]["value"] || componentObj["options"][0][componentObj["idAttribute"]]);
						}
					}
					if(componentObj["options"][0]["next"] != undefined){
						this.renderComponent(componentObj["options"][0]["next"]);
					}
				}
			}


			if(typeof this.options.data == "undefined" || self.goThroughDefaultSelection === true){		

				if(self.goThroughDefaultSelection === true){
					self.goThroughDefaultSelection = false;
				}

				if(typeof this.options.data != "undefined" && ! this.isValueChangedInEditMode){

					var _selectedVal = this.options.data.selectedValues[componentObj["fieldForSelection"]];

					// inputFieldRef.select2("val", _selectedVal);
					inputFieldRef.dropdown('set selected', _selectedVal);

					if(typeof this.options.data != "undefined"){

						var valueSelected = _.findWhere(componentObj["options"], {"id": _selectedVal});					

						if(valueSelected != null && typeof valueSelected != "undefined"){
							if(valueSelected["isLastNode"] === "true"){
								this.isValueChangedInEditMode = true;
							}
						}

						if(typeof valueSelected != "undefined" && valueSelected.next){
							this.renderComponent(valueSelected.next);
						}
					}

				}else if(defaultSelected!=undefined && componentObj["attributeName"] !== "dataAttributeValues"){
					inputFieldRef.dropdown('set selected', defaultSelected["value"] || defaultSelected[componentObj["idAttribute"]]);
					// inputFieldRef.select2("val", defaultSelected["value"] || defaultSelected[componentObj["idAttribute"]]);
					if(defaultSelected.next != undefined){
						if(defaultSelected.next["component"]){
							this.renderComponent(defaultSelected.next);
						}else{
							var nextComponent = {};
							nextComponent["component"] = defaultSelected.next;
							this.renderComponent(nextComponent);
						}
					}
					else{
						if(this.componentsRef[0]!=undefined && this.componentsRef[0].componentRef!=undefined 
								&& this.componentsRef[0].componentRef.getValue()=='activityLastOccurrence'
									&& defaultSelected.name == 'Is at any time'){
							this.$('#find_audience_button').show();
						}
					}
				}
			}

			if(typeof this.options.data != "undefined" && this.isValueChangedInEditMode === false){
				var selectedVals = this.options.data.selectedValues;

				if(typeof componentObj["options"][0] != "undefined" && typeof componentObj["options"][0]["next"] != "undefined" && componentObj["options"][0]["next"] != null && componentObj["options"][0]["next"] != "" && componentObj["options"][0]["next"]=="activityIntervalSelectionForAudiencePerformanceIndexing" && selectedVals =="-1"){

				}else{

					var _val = selectedVals[componentObj["fieldForSelection"]];

					if(componentObj["multiple"] !== "true"){
						_val = typeof selectedVals[componentObj["fieldForSelection"]] == "object" ? selectedVals[componentObj["fieldForSelection"]]["id"] : selectedVals[componentObj["fieldForSelection"]];
					} else {
						if($.isArray(selectedVals[componentObj["fieldForSelection"]]) && componentObj["objectType"] === "interest"){
							_val = selectedVals[componentObj["fieldForSelection"]].map(function(x){return x.id.toString()});
						}
					}

					inputFieldRef.dropdown('set selected', _val);
					inputFieldRef.data('selectOptionData',  componentObj["options"][0]);
					// inputFieldRef.select2("val", _val);

					if(componentObj["fieldForSelection"] == "condition"){
						var _obj = _.findWhere(componentObj["options"], {"id": _val});

						if(typeof _obj != "undefined" && _obj.next){
							
							this.renderComponent(_obj.next);
							this.$el.find(".criteriaRemoveBtnContainer").show(); 
							this.$el.find('.criteriaAddBtnContainer').hide();
						}

						if(_obj && typeof _obj.next == "undefined"){
							
							// Fixed issue  : On Edit Model Screen (x) button is not displayed at the end of condition 
							this.$el.find(".criteriaRemoveBtnContainer").show(); 
							this.$el.find('.criteriaAddBtnContainer').hide();
						}

					} else if (componentObj["fieldForSelection"] === "dataAttributeValues" && typeof selectedVals["dataAttribute"].type !== "undefined" && selectedVals["dataAttribute"].type !== ""){ 
						inputFieldRef.dropdown('set selected', selectedVals["dataAttribute"].type);
						inputFieldRef.data('selectOptionData', selectedVals["dataAttribute"]);
						inputFieldRef.trigger('change', selectedVals["dataAttribute"].type);
						//inputFieldRef.select2("val", selectedVals["dataAttribute"].type, true);	
						this.valuesPutInEditMode = true;
					} else if (componentObj["fieldForSelection"] == "textBoxValues"
								&& typeof this.options.data.selectedValues["dataAttribute"] !== "undefined"
								&& typeof this.options.data.selectedValues["dataAttribute"].type !== "undefined"
								&& this.options.data.selectedValues["dataAttribute"].type !== "" && ["RAW", "MAPPED"].includes(this.options.data.selectedValues["dataAttribute"].type) ){

						// //Get textbox values
						var textBoxArray = selectedVals[componentObj["fieldForSelection"]];

						if(this.options.data.selectedValues["dataAttribute"].type === "RAW"){
							inputFieldRef.dropdown('set selected', textBoxArray);
							inputFieldRef.data('selectOptionData', textBoxArray);
							inputFieldRef.trigger('change', textBoxArray);
							// inputFieldRef.select2("val", textBoxArray, true);
						} else {
							//Get selected data attribute value
							var attrName = this.options.data.selectedValues.dataAttribute.name;

							//Get Mapped internal values
							var internalVals = this.getMappedInternalValues(attrName, textBoxArray);
							var selectedValues = internalVals.map(function(x){return x.id});

							//Set selected values
							inputFieldRef.dropdown('set selected', selectedValues);
							inputFieldRef.trigger('change', selectedValues);
							// inputFieldRef.select2("val", selectedValues, true);
						}	

						if(componentObj["isLastNode"] === 'true'){
							this.$el.find(".criteriaRemoveBtnContainer").show(); 
							this.$el.find('.criteriaAddBtnContainer').hide();
						}						
						this.valuesPutInEditMode = true;							

					}

				}

				if(typeof componentObj["options"][0] != "undefined"){
					if(typeof componentObj["options"][0]["next"] != "undefined"){						
						if(componentObj["options"][0]["next"] == "activityIntervalSelectionForAudiencePerformanceIndexing" && selectedVals[componentObj["fieldForSelection"]]=="-1"){

						}else{
							if(componentObj["attributeName"] == "dataOptions"){
								this.renderComponent(_.findWhere(componentObj["options"], {"id": selectedVals[componentObj["fieldForSelection"]]["id"]})["next"]);
							}else if(componentObj["fieldForSelection"] != "condition" && componentObj["fieldForSelection"] !== "dataAttributeValues"){
								this.renderComponent(_.findWhere(componentObj["options"], {"id": selectedVals[componentObj["fieldForSelection"]]})["next"]);
							}
						}
					}
				}

			}else{

				if(componentType!=undefined && (componentType=='campaignClickCountSelection' || componentType=='campaignExposureCountSelection' || componentType=='cookieAgeDropDown' || componentType == 'cookieAgeDropDownDaysLbl')){
					var selectedVals = componentObj["options"][0]['value'];
					inputFieldRef.dropdown('set selected', selectedVals);							
					// inputFieldRef.select2("val", selectedVals);
				}

			}

			if(componentObj["parentComponent"]){
				var selectedVals = componentObj["options"][0]['value'];
				inputFieldRef.dropdown('set selected', selectedVals);	
				// inputFieldRef.select2("val", selectedVals);
			}			

			inputFieldRef.on("change", function(e, selectedId){

				var selectOptionData = e.added;
				var isMappedValues = false;
				var componentOptions = inputFieldRef.data('componentOptions');

				if(componentOptions && componentOptions.length === 0){
					var values = inputFieldRef.dropdown('get values');
					if(values){
						values.forEach(function(val, index){
							componentOptions.push({"id": val});
						});						
					}
					// componentOptions = inputFieldRef.dropdown('get values');
				}

				if(selectedId){
					var selectOptionData = _.findWhere(componentOptions, {'id':  typeof componentOptions[0].id === 'string' ? selectedId.toString(): selectedId });
				}else{
					var selectOptionData = _.findWhere(componentOptions, {'id':  componentOptions && componentOptions.length > 0 && typeof componentOptions[0].id === 'string' ? $(e.target).val().toString(): parseInt( $(e.target).val() ) });
				}

				if(!selectOptionData){
					var selectOptionData = _.findWhere(componentOptions, {'id': $(e.target).val()});
				}

				if(_.isUndefined(selectOptionData))
					return;
				if ((selectOptionData.value == 'isatanytime') || (selectOptionData.value == '0')){
					self.componentsRef = _.filter(self.componentsRef, function(item){return item && item["fieldForSelection"] !== "selectedInterval" });
					var pagename = "Create New Model";

					if(window.location.hash === "#audienceIndexing"){
						pagename = "Audience Indexing";
					}
				}

				$(inputFieldRef).data('selectOptionData',  selectOptionData);
				self.trigger('dropDownSelected');
				
				if(self.options.isUsedForFindAudience === true){
					self.$('[data-id="componentContainer"]').find(".recencyTooltip").remove();
				}

				var currentDropdownParent = $(e.target).parents("[data-type='componentParentDiv']"), 
				count = currentDropdownParent.next("[data-type='componentParentDiv']").data("component-cnt"),
				nextSibling = currentDropdownParent.next("[data-type='componentParentDiv']");

				//check if any value mapping attribute is present for current selected option
				if(componentObj.varValueRefMapping !== undefined){
					//check if any values are mapped to data attribute
					var mappedValues = componentObj.varValueRefMapping.filter(function(x){return x.varName === selectOptionData.name});

					if(mappedValues.length > 0){
						isMappedValues = true;
					}
				}

				if(nextSibling.length != 0){
					self.isValueChangedInEditMode = true;
				}

				if(componentObj["attributeName"] && componentObj["attributeName"] == "dataPartnerDropdown"){
					self.dataPartnerSelection = selectOptionData;
				}

				if(componentObj["attributeName"] == "dataSource" && selectOptionData["sourceType"] == "Batch File"){

					var nextConponentRef;
					do{
						nextConponentRef = currentDropdownParent.next("[data-type='componentParentDiv']"),
						count = currentDropdownParent.next("[data-type='componentParentDiv']").data("component-cnt");
						self.componentsRef[count] = null;
						nextConponentRef.remove();
					}while(nextConponentRef.length > 0);

					self.renderComponent(componentObj["next"][0]);

				}else if(componentObj["attributeName"] == "dataSource" && selectOptionData["sourceType"] == "Live Tag"){

					var nextConponentRef;
					do{
						nextConponentRef = currentDropdownParent.next("[data-type='componentParentDiv']"),
						count = currentDropdownParent.next("[data-type='componentParentDiv']").data("component-cnt");
						self.componentsRef[count] = null;
						nextConponentRef.remove();
					}while(nextConponentRef.length > 0);					

					var _nextComponent = componentObj["next"];

					if(typeof selectOptionData["customVariables"] != "undefined"){
						self.renderComponent(_nextComponent[1]);
					}else{
						var arrItem = $.extend(true, {}, _.findWhere(_nextComponent[1]["options"], {"id": "eventOccurrance"}));
						arrItem["default"] = "true";
						var arr = [arrItem];

						var obj = _.clone(_nextComponent[1]);
						obj["isReadOnly"] = "true";
						obj["options"] = arr;

						self.goThroughDefaultSelection = true;

						self.renderComponent(obj);
					}
				}else if( (componentObj["attributeName"] == "dataAttribute" && isMappedValues)  
					||  ( componentObj["attributeName"] == "dataAttribute" && typeof selectOptionData.type !== "undefined" && selectOptionData.type != "") ){

					var nextConponentRef;
					do{
						nextConponentRef = currentDropdownParent.next("[data-type='componentParentDiv']"),
						count = currentDropdownParent.next("[data-type='componentParentDiv']").data("component-cnt");
						self.componentsRef[count] = null;
						nextConponentRef.remove();
					}while(nextConponentRef.length > 0);


					if(Array.isArray(componentObj["next"])){
						var _nextComponent = componentObj["next"][1];
					} else {
						var _nextComponent = componentObj["next"];
					}

					self.renderComponent(_nextComponent);
				}else if(componentObj["attributeName"] == "dataAttributeValues" && selectOptionData && selectOptionData["id"] === "MAPPED" ){


					//Get the previous select box value from componentObj
					var previousSelectBoxValue = componentObj["prevSelectedValue"];					

					//Get the varValueRefMapping data for selected attribute
					//var varValueRefMapping = componentObj["varValueRefMapping"];
					

					//Extract the Internal Values
					//var internalValues = self.fetchInternalValues(previousSelectBoxValue, varValueRefMapping);

					// if(self.options.data && self.options.data.selectedValues.textBoxValues && self.options.data.selectedValues.textBoxValues.length > 0){
					// 	internalValues = _.filter(internalValues, function(val){ return self.options.data.selectedValues.textBoxValues.includes(String(val.id)) });
					// }

					//clear old dropdowns from other selections
					var nextConponentRef;
					do{
						nextConponentRef = currentDropdownParent.next("[data-type='componentParentDiv']"),
						count = currentDropdownParent.next("[data-type='componentParentDiv']").data("component-cnt");
						self.componentsRef[count] = null;
						nextConponentRef.remove();
					}while(nextConponentRef.length > 0);

					nextConponentRef = componentObj.next[0];

					


					var internalVals = self.getAllMappedValues(previousSelectBoxValue);

					internalVals.then(function(internalValues){		
						nextConponentRef.options[0].next.options = [];			
						internalValues.forEach(function(internalVal){
							nextConponentRef.options[0].next.options.push(internalVal);
						});	

						self.renderComponent(nextConponentRef);	

					});


					// internalValues.forEach(function(internalVal){
					// 	nextConponentRef.options[0].next.options.push(internalVal)	
					// });

									

				}else if(selectOptionData["next"]){

					if(componentObj["attributeName"] === "dataOptions" && Array.isArray(selectOptionData["next"])){
						var nextComponent = selectOptionData["next"][0];
					} else {
						var nextComponent = selectOptionData["next"];
					}

					//var nextComponent = selectOptionData["next"];

					if(componentObj["attributeName"] == "dataSource" && selectOptionData["sourceType"] == "Batch Tag"){
						nextComponent = selectOptionData["next"][0];
					}

					$(e.target).parents("[data-type='componentParentDiv']").next("[data-type='componentParentDiv']").remove();
					self.componentsRef[count] = null;
					if(nextComponent["component"] == 'cookieAgeDropDown'){
						$(e.target).parents("[data-type='componentParentDiv']").next("[data-type='componentParentDiv']").remove();
					}

					var nextConponentRef;
					do{
						nextConponentRef = currentDropdownParent.next("[data-type='componentParentDiv']"),
						count = currentDropdownParent.next("[data-type='componentParentDiv']").data("component-cnt");
						self.componentsRef[count] = null;
						nextConponentRef.remove();
					}while(nextConponentRef.length > 0);	
					
					if(self.options.isUsedForFindAudience === true){
						self.renderTooltipForImplOfRecency();
					}

					if(nextComponent == "attributeValueDropdown"){
						self.renderComponent(nextComponent);
					}else if(nextComponent =="multiSelectDropdown" || nextComponent["component"] =="multiSelectDropdown"){
						self.renderMultiSelectOverlay(nextComponent);
					}else{

						self.renderAdjoiningLabel(selectOptionData, selectOptionData["fieldForSelection"])
						.renderComponent(nextComponent);

					}
				}else if(componentObj["next"]){

					var _nextComponent = componentObj["next"];

					if(componentObj["attributeName"] == "dataSource" && selectOptionData["sourceType"] == "Batch File"){
						_nextComponent = _nextComponent[0];
					}

					if(componentObj["attributeName"] === "dataAttribute" && Array.isArray(componentObj["next"])){
						_nextComponent = componentObj["next"][0];
					} 

					if(componentObj["attributeName"] === "dataAttributeValues" && Array.isArray(componentObj["next"])){
						_nextComponent = componentObj["next"][1];
					} 


					if(componentType == 'cookieAgeDropDown'){
						$(e.target).parents("[data-type='componentParentDiv']").next("[data-type='componentParentDiv']").remove();
					}
					var nextConponentRef;
					do{
						nextConponentRef = currentDropdownParent.next("[data-type='componentParentDiv']"),
						count = currentDropdownParent.next("[data-type='componentParentDiv']").data("component-cnt");
						self.componentsRef[count] = null;
						nextConponentRef.remove();
					}while(nextConponentRef.length > 0);

					self.renderAdjoiningLabel(componentObj, componentObj["fieldForSelection"])
					.renderComponent(_nextComponent);
				}else{
					$(e.target).parents("[data-type='componentParentDiv']").next("[data-type='componentParentDiv']").remove();
					self.componentsRef[count] = null;
					if(self.componentsRef[0]!=undefined && self.componentsRef[0].componentRef!=undefined 
							&& self.componentsRef[0].componentRef.getValue()=='activityLastOccurrence'
								&& selectOptionData['name']=='Is at any time' && self.options.isUsedForFindAudience === true){
						self.renderTooltipForImplOfRecency();
						self.$('#find_audience_button').show();
					}
					else {
						self.$el.find("button[data-id='addCriteria']").show();
						if(!self.isAdded){
							self.trigger("addNewSetConditions");
							EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
						}
					}
				}			

			});

			if(typeof this.options.data != "undefined" && !this.isValueChangedInEditMode){
				if(componentObj["attributeName"] == "dataSource"){					
					if(typeof this.options.data.selectedValues.dataOptions != "undefined"){
						if(this.options.data.selectedValues.dataOptions.id == "attribute" && this.options.data.selectedValues.dataSource.sourceType == "Live Tag"){
							this.renderComponent(componentObj.next[1]);
						}else if(this.options.data.selectedValues.dataOptions.id == "attribute" && this.options.data.selectedValues.dataSource.sourceType == "Batch File"){
							this.renderComponent(componentObj.next[0]);
						}else if(this.options.data.selectedValues.dataOptions.id == "eventOccurrance" && this.options.data.selectedValues.dataSource.sourceType == "Live Tag"){

							if(this.options.data.selectedValues.dataSource.attributePresent === false){

								var _nextComponent = componentObj["next"];
								var arrItem = $.extend(true, {}, _.findWhere(_nextComponent[1]["options"], {"id": "eventOccurrance"}));
								arrItem["default"] = "true";
								var arr = [arrItem];

								var obj = _.clone(_nextComponent[1]);
								obj["isReadOnly"] = "true";
								obj["options"] = arr;

								self.goThroughDefaultSelection = true;

								self.renderComponent(obj);
							}else{	
								this.renderComponent(componentObj.next[1]);
							}
						}
					}else{
						this.renderComponent(componentObj.next[0]);						
					}
				} else if(componentObj["attributeName"] == "dataAttribute"){
					if( typeof this.options.data.selectedValues["dataAttribute"].type !== "undefined"
							&& this.options.data.selectedValues["dataAttribute"].type !== "" && ["RAW", "MAPPED"].includes(this.options.data.selectedValues["dataAttribute"].type) ){
						this.renderComponent(componentObj.next[1]);
					} else {
						if(_.isArray(componentObj.next)){
							this.renderComponent(componentObj.next[0]);	
						} else {
							this.renderComponent(componentObj.next);		
						}
						
					}
					
				} else if (componentObj["attributeName"] === "dataAttributeValues"){
					if(this.options.data.selectedValues["dataAttribute"].type === "RAW"){
						this.renderComponent(componentObj.next[1]);
					} else {
						this.renderComponent(componentObj.next[0]);
					}					
				}

				if(typeof this.options.data != "undefined"){
					if(componentObj["isLastNode"] === "true"){
						this.isValueChangedInEditMode = true;
					}
					if(componentObj["objectType"] === 'interest'){
						this.$el.find(".criteriaRemoveBtnContainer").show(); 
						this.$el.find('.criteriaAddBtnContainer').hide();
					}
				}
			}
			
			if(this.options.isUsedForFindAudience === true){
				this.renderTooltipForImplOfRecency();				
				this.$el.find(".criteriaRemoveBtnContainer").hide();
				this.$('#find_audience_button').show();
			}

			return this;
		},
        // 750 Sorting
        // Sorting for Select Attribute as per ticket 750
                sortResponseInOption:function(activityCustom) {
                     return _.sortBy(activityCustom ,function(item) {
                     return item.name.toLowerCase();
                     });
                },


		fetchInternalValues: function(attributeName, varValueRefMapping){
			//Create instance of AttributeReferenceCollection
			var attributeReferences = this.attrReferences;

			//Store Internal Values
			var internalValues = [];
			
			//GET varRefKey and varValueRefKey for current selected attribute
			varRefKeys = _.chain(varValueRefMapping) // starts chain using the varValueRefMapping array
		    .filter(function(object) { // uses array from chain
		        return  object.varName == attributeName;
		    })
		    .map(function(object) { // uses array from chain
		        return {
		        	varName: object.varName,
			        varRefKey : object.varRefKey,			    
				    varValueRefKey : object.varValueRefKey
		        };
		    })
		    .value();

		  	// Get specific object from master json for selected attribute
		    varAttribute = _.filter(attributeReferences.models, function(a){
			    return _.find(varRefKeys, function(b){
			        return b.varRefKey === a.get("varRefKey") && b.varName === a.get("varRefName");
			    });
			})[0];


		    //Fetch internal values from selected object
			internalValues = _.filter(varAttribute.get("values"), function(a){
			    return _.find(varRefKeys, function(b){
			        return b.varValueRefKey === a.varValueRefKey;
			    });
			}).map(function(x){return {id: x.varValueRefKey, name: x.varValueRefName } });

			return internalValues;
		},

		getMappedInternalValues: function(attributeName, varRefKeys){
			//Create instance of AttributeReferenceCollection
			var attributeReferences = this.attrReferences;

			//Store Internal Values
			var internalValues = [];
			var selectedAttrReference = attributeReferences.filter(function(x){return x.get("varRefName").toLowerCase() === attributeName.toLowerCase()})[0];

			if(selectedAttrReference){
				varAttributes = _.filter(selectedAttrReference.values.models, function(a){
				    return _.find(varRefKeys, function(b){
				        return b == a.get("varValueRefKey");
				    });
				});

				internalValues = varAttributes.map(function(x){return {id: x.get("varValueRefKey"), name: x.get("varValueRefName"), text: x.get("varValueRefName") }})
			}
			return internalValues;
			
		},

		getAllMappedValues: function(attributeName){
			var mappedValues = [];			
			var internalVals = [];
			var reqJson =  {};
			var self = this;

			var reqParams = { 
				"params" : 
							{
				                "id": "",
				                "accountId": AccountService.getCurrentAccount().id,
				                "entity": "activities",
				                "operation": "get",
				                "queryString": "&filterBy=status:A;&orderByColumn=name&orderBy=asc&rowsPerPage=0&pageNumber=0"
			            	}
        	}


			this.componentsRef.map(function(x){									
				if(x && x.fieldForSelection === "dataSource"){
					reqParams["params"]["id"] = x.componentRef.getValue()["id"];
				}
			});

			

        	reqJson = _.extend(reqJson, reqParams["params"]);


            return RemoteService.ajax({
				url:  "getApiData.htm",
				data: JSON.stringify(reqJson),
				type: "post"
			}).then(function(response) {
				var varValueRefMappings = response.activities[0].varValueRefMapping;
				mappedValues = varValueRefMappings.filter(function(x){return x.varName === attributeName});
				if(mappedValues.length > 0){
					var varValueRefKeys = mappedValues.map(function(x){return x.varValueRefKey})
					internalVals = self.getMappedInternalValues(attributeName, varValueRefKeys);
				}
				return 	internalVals;				
			});


		},


		getMappedValues: function(attributeName){
			var mappedValues = [];			
			var internalVals = [];

			this.componentsRef.map(function(x){					
				if(x.fieldForSelection === "dataOptions" && x.componentRef.getFullValue()
					&& x.componentRef.getFullValue().next && x.componentRef.getFullValue().next.varValueRefMapping ){
					var varValueRefMappings = x.componentRef.getFullValue().next.varValueRefMapping;
					mappedValues = varValueRefMappings.filter(function(x){return x.varName === attributeName});
				}					
			});

			if(mappedValues.length > 0){
				var varValueRefKeys = mappedValues.map(function(x){return x.varValueRefKey})
				internalVals = this.getMappedInternalValues(attributeName, varValueRefKeys);
			}
			return 	internalVals;

		},
		
		renderTooltipForImplOfRecency: function(){
			
			var compContainer = this.$('[data-id="componentContainer"]');
			
			if(compContainer.find(".recencyTooltip").length > 0){
				compContainer.find(".recencyTooltip").remove();
			}
			compContainer.append('<span class="recencyTooltip interactionLAL popup" title="'+i18next.t("app.implOfRecency")+'"></span>');
			
			$('.recencyTooltip').popup({
			    position : 'bottom center',
			    content  : $(this).attr('title')
		  	});

			/*this.$(".recencyTooltip").tooltip({
				content: function(){
					return $(this).attr('title');
				},
				position: {
			        my: "center bottom-20",
			        at: "center top",
			        collision: "flipfit",
			        using: function( position, feedback ) {
			          $( this ).css( position );
			          $( "<div>" )
			            .addClass( "arrowNew" )
			            .addClass( feedback.vertical )
			            .addClass( feedback.horizontal )
			            .appendTo( this );
			        }
			      }
			});*/	
		},

		renderMultiSelectOverlay: function(configurationOpt){

			var opt={},
			componentConfig = ConfigService.getConfig("componentConfigModel").get("multiSelectDropdown"),

			self=this;

			var componentType = "";
			if(configurationOpt.objectType == "device_vendor_cat_num"){
				componentType = "DEVICE VENDOR";
			}else if(configurationOpt.objectType == "device_model_cat_num"){
				componentType = "DEVICE MODEL";
			}else if(configurationOpt.objectType == "geo_city"){
				componentType = "CITY";
			}else if(configurationOpt.objectType == "geo_country_code"){
				componentType = "COUNTRY";
			}else if(configurationOpt.objectType == "browser_name_cat_num"){
				componentType = "BROWSER";
			}else if(configurationOpt.objectType == "device_env_encode_cat_num"){
				componentType = "OS";
			}
			if(typeof this.options.data != "undefined"){
				var selectedVals = this.options.data.selectedValues;

				opt.isEdit = true;
				opt.selectedElementArray = selectedVals[componentConfig["fieldForSelection"]];
			}

			opt.componentName = componentType;
			opt.url=configurationOpt['dataUrl'];
			opt.objectType = configurationOpt['objectType']; 
			opt.accountId=AccountService.getCurrentAccount().id;
			opt.isServerSidePagination=true;
			opt.rowsPerPage = 1000;
			var instance = new MultiSelectOverlay(opt);

			var container = $("<div data-type='componentParentDiv' class='valueSelector field width grid js-columns' style='clear:none; float:left;margin: 0 .5em 1em 0 ; min-width:220px; max-width: 64%;'></div>");

			container.append("<div data-type='label' class='attributeLabel'>"+componentConfig["header"]+"</div>");

			container.append(instance.$el);

			this.$('[data-id="componentContainer"]').append(container);

			this.listenTo(instance, "valueSelectedFromMultiSelect", function(){
				self.$el.find("button[data-id='addCriteria']").show();
				if(!self.isAdded){
					self.trigger("addNewSetConditions");
					EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
				}
			});

			instance.render();

			var obj = {
					getValue: function(){
						return instance.getSelection(instance.isServerSearch ? 'serverSearch' : '');
					}
			};

			this.cnt++;
			this.componentsRef[this.cnt] = {
					"componentRef": obj,
					"fieldForSelection": componentConfig["fieldForSelection"]
			};

			container.attr("data-component-cnt", self.cnt);		
		},

		renderActivityIntervalSelectionOptional: function(selectedValues){
			var componentConfig = ConfigService.getConfig("componentConfigModel").get("activityIntervalSelectionOptional"),
			self = this;

			var container = $("<div class='field width grid js-columns' data-type='componentParentDiv' class='textboxwithstring'></div>");

			var inputStr1 = '<div class="ui selection dropdown" data-id="child" style="min-width: auto;"> <input type="hidden"/><i class="dropdown icon"></i><div class="default text"></div> <div class="menu"></div> </div>',
				inputStr2 = '<div class="ui selection dropdown" data-id="parent" style="min-width: auto;"> <input type="hidden"/><i class="dropdown icon"></i><div class="default text"></div> <div class="menu"></div> </div>';


			container.append("<div data-type='label' class='attributeLabel'>"+componentConfig["header"]+"</div>");

			container.append(inputStr1);
			container.append(inputStr2);

			this.$('[data-id="componentContainer"]').append(container);

			_.each(componentConfig["options"], function(elem){
				elem["id"] = elem["value"];
				elem["text"] = elem["name"];
			});

			var $parentMenu = container.find('[data-id="parent"] .menu');
			_.each(componentConfig["options"], function(data){
				$parentMenu.append('<div class="item" data-value="'+data.id+'">' + data.name + '</div>')
			});
			
			container.find('[data-id="parent"]').dropdown({
				fullTextSearch : "exact",
				match: "text",
				forceSelection: false,
				onChange: function(value, text, $choice){
					self.$('[data-id="child"]').dropdown("set selected",  _.findWhere(value, {"default": "true"})["id"]);
				},
				onShow: function() {
					var itemLen = container.find('[data-id="parent"]').find('.menu .item').map(function(index, item){
						return $(item).text().length;
					});

					var maxLen = _.max(itemLen);
					if(maxLen > 36){
						container.find('[data-id="parent"]').find('.menu').css('min-width', (maxLen+140)+'%');
					}else if(maxLen > 20 && maxLen <= 36) {
						container.find('[data-id="parent"]').find('.menu').css('min-width', (maxLen+120)+'%');
					}else {
						container.find('[data-id="parent"]').find('.menu').css('min-width', '100%');
					}

				}
			});			

			this.$('[data-id="parent"]').dropdown('set selected', _.findWhere(componentConfig["options"], {"default": "true"})["id"]);

			var defaultOptions = _.findWhere(componentConfig["options"], {"default": "true"})["options"];

			_.each(defaultOptions, function(elem){
				elem["id"] = elem["value"];
				elem["text"] = elem["name"];
			});

			var $childMenu = container.find('[data-id="child"] .menu');
			_.each(defaultOptions, function(data){
				$parentMenu.append('<div class="item" data-value="'+data.id+'">' + data.name + '</div>')
			});
			
			container.find('[data-id="child"]').dropdown({
				fullTextSearch : "exact",
				match: "text",
				forceSelection: false,
				onShow: function() {
					var itemLen = container.find('[data-id="child"]').find('.menu .item').map(function(index, item){
						return $(item).text().length;
					});

					var maxLen = _.max(itemLen);
					if(maxLen > 36){
						container.find('[data-id="child"]').find('.menu').css('min-width', (maxLen+140)+'%');
					}else if(maxLen > 20 && maxLen <= 36) {
						container.find('[data-id="child"]').find('.menu').css('min-width', (maxLen+120)+'%');
					}else {
						container.find('[data-id="child"]').find('.menu').css('min-width', '100%');
					}
				}
			});

			this.$('[data-id="child"]').dropdown("set selected", _.findWhere(defaultOptions, {"default": "true"})["id"]);


			var obj = {
					getValue: function(){ 
						return {
							"parent": self.$('[data-id="parent"]').dropdown("get value"),
							"child": self.$('[data-id="child"]').dropdown("get value")
						};
					}
			};
			this.cnt++;
			this.componentsRef[this.cnt] = {
					"componentRef": obj,
					"fieldForSelection": componentConfig["fieldForSelection"]
			};

			container.attr("data-component-cnt", this.cnt);


			if(typeof this.options.data != "undefined"){
				var selectedVals = this.options.data.selectedValues.selectedInterval;

				this.$('[data-id="parent"]').dropdown("set selected", selectedVals["parent"]);
				this.$('[data-id="child"]').dropdown("set selected", selectedVals["child"]);
			}

		},

		renderActivityIntervalSelection: function(selectedValues){
			var componentConfig = ConfigService.getConfig("componentConfigModel").get("activityIntervalSelection"),
			self = this;

			if(this.$('[data-id="parent"]').length > 0 ){
				return;				
			}

			var container = $("<div class='field width grid js-columns' data-type='componentParentDiv' class='textboxwithstring'></div>");

			var inputStr1 = '<div style="float: left;" class="days-input-wrap"><div class="ui search dropdown selection" data-id="child" style="min-width: auto;"> <input type="hidden"/><i class="dropdown icon"></i><div class="default text"></div><div class="menu"></div></div></div>',
			inputStr2;
			if (this.options.isUsedForFindAudience) {
				inputStr2 = '<div class="audience-days-label"><div class="ui dropdown selection disabled" data-id="parent"><input type="hidden" /><i class="dropdown icon"></i><div class="default text"></div><div class="menu"></div></div></div>';
			}else {
				inputStr2 = '<div style="float: left; margin: 0 .1em 0 .5em;" class="days-ago-wrap"><div class="ui dropdown selection disabled" data-id="parent"><input type="hidden" /><i class="dropdown icon"></i><div class="default text"></div><div class="menu"></div></div></div>';
			}

			// container.append("<div data-type='label' class='attributeLabel'>"+componentConfig["header"]+"</div>");

			container.append(inputStr1);
			container.append(inputStr2);

			this.$('[data-id="componentContainer"]').append(container);
			/*this.$('[data-id="componentContainer"]').append(inputStr1);
			this.$('[data-id="componentContainer"]').append(inputStr2);*/

			var $parentMenu = this.$('[data-id="componentContainer"]').find('[data-id="parent"] .menu');
			_.each(componentConfig["options"], function(data){
				$parentMenu.append('<div class="item" data-value="'+data.id+'">' + data.name + '</div>')
			});
			
			this.$('[data-id="componentContainer"]').find('[data-id="parent"]').dropdown({
				fullTextSearch : "exact",
				match: "text",
				forceSelection: false,
				onChange: function(value, text, $choice){
					//self.$('[data-id="child"]').dropdown("set selected",  _.findWhere(value, {"default": "true"})["id"]);
				},

				onShow: function() {
					var itemLen = self.$('[data-id="componentContainer"]').find('[data-id="parent"]').find('.menu .item').map(function(index, item){
						return $(item).text().length;
					});

					var maxLen = _.max(itemLen);
					if(maxLen > 36){
						self.$('[data-id="componentContainer"]').find('[data-id="parent"]').find('.menu').css('min-width', (maxLen+140)+'%');
					}else if(maxLen > 20 && maxLen <= 36) {
						self.$('[data-id="componentContainer"]').find('[data-id="parent"]').find('.menu').css('min-width', (maxLen+120)+'%');
					}else {
						self.$('[data-id="componentContainer"]').find('[data-id="parent"]').find('.menu').css('min-width', '100%');
					}

				}
			});	

			this.$('[data-id="parent"]').dropdown('set selected', _.findWhere(componentConfig["options"], {"default": "true"})["id"]);

			var defaultOptions = _.findWhere(componentConfig["options"], {"default": "true"})["options"];

			var $childMenu = this.$('[data-id="componentContainer"]').find('[data-id="child"] .menu');
			_.each(defaultOptions, function(data){
				$childMenu.append('<div class="item" data-value="'+data.id+'">' + data.name + '</div>')
			});
			
			this.$('[data-id="componentContainer"]').find('[data-id="child"]').dropdown({
				fullTextSearch : "exact",
				match: "text",
				forceSelection: false,
				onChange : function(value, text, $choice){
					var pagename = "Create New Model";

					if(window.location.hash === "#audienceIndexing"){
						pagename = "Audience Indexing";
					}
					var daysSelected = self.$('[data-id="child"]').dropdown("get value");

				},

				onShow: function() {
					var itemLen = self.$('[data-id="componentContainer"]').find('[data-id="child"]').find('.menu .item').map(function(index, item){
						return $(item).text().length;
					});

					var maxLen = _.max(itemLen);
					if(maxLen > 36){
						self.$('[data-id="componentContainer"]').find('[data-id="child"]').find('.menu').css('min-width', (maxLen+140)+'%');
					}else if(maxLen > 20 && maxLen <= 36) {
						self.$('[data-id="componentContainer"]').find('[data-id="child"]').find('.menu').css('min-width', (maxLen+120)+'%');
					}else {
						self.$('[data-id="componentContainer"]').find('[data-id="child"]').find('.menu').css('min-width', '100%');
					}
				}
			});

			this.$('[data-id="child"]').dropdown("set selected", _.findWhere(defaultOptions, {"default": "true"})["id"]);


			var obj = {
					getValue: function(){ 
						return {
							"parent": self.$('[data-id="parent"]').dropdown("get value"),
							"child": self.$('[data-id="child"]').dropdown("get value")
						};
					}
			};
			this.cnt++;
			this.componentsRef[this.cnt] = {
					"componentRef": obj,
					"fieldForSelection": componentConfig["fieldForSelection"]
			};

			//container.attr("data-component-cnt", this.cnt);


			if(typeof this.options.data != "undefined"){
				var selectedVals = this.options.data.selectedValues.selectedInterval;

				if(selectedVals){
					if(selectedVals["parent"]!=undefined && selectedVals["parent"] == -1){

					}else{
						this.$('[data-id="parent"]').dropdown("set selected", selectedVals["parent"]);
						this.$('[data-id="child"]').dropdown("set selected", selectedVals["child"]);
					}					
				}

			}

		},

		renderSegmentBuilderActivityOverlay: function(componentObj, megaDrpDwnSelectionObj){
			var self = this, tokens = megaDrpDwnSelectionObj[0].split(".");

			var container = $("<div data-type='componentParentDiv' class='searchActvity' style='float: left; clear: none; margin-right: .5em;'></div>");
			
			this.$('[data-id="componentContainer"]').append(container);

			if(self.$el.find('.js-dummy-container').length > 0){
				self.$el.find('.js-dummy-container').remove();	
			}

			var model = new SegmentOverlayDataModel();


			model.fetch().then(function(){
				self.onSuccessCallbackActivityOverlay(tokens, model, container, componentObj, megaDrpDwnSelectionObj);
				$("input[name='segment']").on("change", function(e){
					if(!self.isAdded){
						if(($('input[name=segment]:checked').prop("id") == "segmentAdvertiser") && this.advDropdownId == ""){
							return;							
						}						
					}
				});

				self.on("advertiserChanged", function(){
					if(($.inArray("advertiser", self.currentScope)!=-1)|| self.currentScope=='advertiser'){

						if(!self.isAdded){
							self.$('[data-id="componentContainer"]').html('<div data-id="attributeSelection" class="modal_segment" style="float: left; clear: none;" data-type="componentParentDiv"></div>');
							self.$el.find("button[data-id='addCriteria']").hide();
							self.cnt = 0;
							self.componentsRef = [];
							self.renderMegaDropdown();

						}else{
							self.$el.remove();
							self.isRemoved = true;
						}

					}else{
						if(!self.isAdded){
							self.$('[data-id="componentContainer"]').html('<div data-id="attributeSelection" class="modal_segment" style="float: left; clear: none;" data-type="componentParentDiv"></div>');
							self.$el.find("button[data-id='addCriteria']").hide();
							self.cnt = 0;
							self.componentsRef = [];
							self.renderMegaDropdown();

						}
					}
				});
			});
		},

		onSuccessCallbackActivityOverlay: function(tokens, model, container, componentObj, megaDrpDwnSelectionObj){

			var self = this,
			opt = {};

			opt.url="getApiData.htm";

			opt.megaDrpDwnSelectionObj = megaDrpDwnSelectionObj;

			opt.configuration = model.toJSON();


			opt.accountId=AccountService.getCurrentAccount().id;

			if(this.options.forBuildModel){				

				if(this.options.getExternalScope() == "advertiser"){
					var _tempVal = this.advDropdownId;

					_tempVal = _tempVal == null ? "" : _tempVal;

					if(typeof this.options.data != "undefined"){
						opt.advertiserId = this.options.advertiserId; 
						opt.advertiserName = this.options.advertiserName; 
					}else{
						opt.advertiserId = _tempVal.length > 0 ? _tempVal : (typeof this.options.advertiserId != "undefined" ? this.options.advertiserId : _tempVal);
					}
				}else{
					opt.advertiserId = this.advDropdownId;
					opt.advAccName = this.advDropdownText;
				}			

				opt.advAccName = (this.options.getExternalScope() == "advertiser") ? $(".js-advertiser-dd").dropdown('get text') : "In Account";
			}else{				
				opt.advAccName = this.advDropdownText;
				opt.advertiserId = this.advDropdownId;
			}

			if(opt.advertiserId != undefined && opt.advertiserId != '')
				opt.selectedScope = 'advertiser';

			opt.operation = "list";

			opt.modelType = this.options.getModelType === undefined;
			
			opt.sortDropDownOptions = [
			                           {
			                        	   text:"SORT BY DATE",
			                        	   id:"1",
			                        	   orderBy:"asc",
			                        	   orderByColumn:"whencreated",
			                           },
			                           {
			                        	   text:"SORT BY DATE",
			                        	   id:"2",
			                        	   orderBy:"desc",
			                        	   orderByColumn:"whencreated",
			                           },
			                           {
			                        	   text:"SORT BY ALPHABET",
			                        	   id:"3",
			                        	   orderBy:"asc",
			                        	   orderByColumn:"name",
			                           },
			                           {
			                        	   text:"SORT BY ALPHABET",
			                        	   id:"4",
			                        	   orderBy:"desc",
			                        	   orderByColumn:"name",
			                           }];

			if(tokens[1].toLowerCase() == "activity" || tokens[1].toLowerCase() == "lookalike"){

				opt.entity = "activities";

			}

			if(tokens[1].toLowerCase() == "campaign"){
				opt.entity = "campaigns";
			}

			if(typeof this.options.getacvid != "undefined"){
				opt.getacvid = this.options.getacvid;
			}

			if(typeof this.options.getacvid != "type"){
				opt.type = this.options.type;
			}

			if(tokens[2] == "lookalikeSegmentMembership"){
				opt.tabValues1 ={
						text:"FeedBack",
						id:"feedBackLookAlikes",
						isSelected:false 
				};
				opt.tabValues2 ={
						text:"LookAlikes",
						id:"lookAlikes",
						isSelected:true
				};
			}
			opt.isServerSidePagination=true;
			opt.rowsPerPage=0;

			if(this.options.data){
				if(this.options.data.scope){
					opt['selectedScope'] = this.options.data.scope;
				}
			}

			var instance = new SegmentBuilderActivityOverlay(opt);

			container.html("");

			container.append("<div data-type='label' class='attributeLabel'>"+componentObj["header"]+"</div>");

			container.append(instance.render().$el);

			if(this.options.data == undefined){
				this.nextComponent = ConfigService.getConfig("rowConfigModel").renderNextComponent();
			}				

			var callbackFn = function(_componentObj, _megaDrpDwnSelectionObj){
				
				return	function(optionSelected){

					var nextComponentJson = ConfigService.getConfig("rowConfigModel").renderNextComponent();

					if((nextComponentJson == undefined) && (self.options.data == undefined)){
						nextComponentJson = self.nextComponent;
					}

					self.renderComponent(nextComponentJson == null ? (_componentObj,_megaDrpDwnSelectionObj) : nextComponentJson);
				};
			}(componentObj, megaDrpDwnSelectionObj);

			self.listenToOnce(instance, "selectionDone", callbackFn);

			var obj = {
					getValue: function(){ 
						return {
							"id": instance.getSelectedValue()
						};
					}
			};

			self.cnt++;

			self.componentsRef[self.cnt] = {
					"componentRef": obj,
					"fieldForSelection": componentObj["fieldForSelection"],
					"ref": instance
			};

			container.attr("data-component-cnt", self.cnt);

			if(this.options.data){
				if(this.options.data.selectedValues){
					if(this.options.data.selectedValues[componentObj["fieldForSelection"]]){
						instance.setSelection(this.options.data.selectedValues[componentObj["fieldForSelection"]]["name"],this.options.data.selectedValues[componentObj["fieldForSelection"]]["id"],this.options.data.scope);
					}
				}
			}

			self.$el.find('.menu .browse').popup('hide');
			self.listenTo(instance, "innerScopeChanged", function(selectedDropDown){
				self.currentScope=[];
				self.currentScope.push(selectedDropDown);
			});

			if(typeof this.options.forBuildModel != "undefined"){
				if(this.options.forBuildModel){
					if(megaDrpDwnSelectionObj[0].indexOf("campaignLastClick") != -1){
						if(this.options.getCampaignId() != -1 && this.options.getCampaignId().length != 0){
							this.listenTo(instance, "refreshed", function(){
								var campaignId = this.options.getCampaignId();//(typeof this.options.data == "undefined" ? this.options.getCampaignId() : RefObj.get("currentCampaignId"));
								instance.$("[data-id='"+campaignId+"']").trigger("click");
								instance.$(".selectedSegment .text span").eq(1).hide();
								instance.$(".selectedSegment .text span").parents(".selectedSegment").attr("data-for-build-model", true);
								self.on("campaignSelectValueChange", function(value){
									instance.trigger("refreshed");								
								});
							});
						}else if(this.options.getCampaignId().length == 0){
							instance.setSelection(this.options.campaignName, this.options.campaignId, "advertiser");
							instance.trigger("selectionDone");
						}
					}
					if(typeof this.options.getacvid != "undefined"){
						if(megaDrpDwnSelectionObj[0].indexOf("activityLastOccurrence") != -1){
							if(this.options.type == "adv"){
								instance.setScope("advertiser");
								this.currentScope=[];
								this.currentScope.push("advertiser");
							}
							this.listenTo(instance, "refreshed", function(){
								instance.$("[data-id='"+self.options.getacvid+"']").trigger("click");
								self.options.getacvid = undefined;
							});
						}
					}
				}				
			}

			if(this.options.isForEdit){
				if(megaDrpDwnSelectionObj[0].indexOf("campaignLastClick") != -1){					
					this.listenTo(instance, "refreshed", function(){
						instance.$("[data-id='"+this.options.campaignId+"']").trigger("click");
						instance.$(".selectedSegment .text span").eq(1).hide();
						instance.$(".selectedSegment .text span").parents(".selectedSegment").attr("data-for-build-model", true);
						//instance.$(".selectedSegment").css("border", "none");
					});
				}
			}

			this.options.type = undefined; 

		},
		
		renderDemographicSegmentOverlay: function(componentObj, megaDrpDwnSelectionObj){
			var self = this, tokens = megaDrpDwnSelectionObj[0].split(".");

			var container = $("<div data-type='componentParentDiv' class='field width grid js-columns searchActvity' class='textboxwithstring'></div>");
			//var container = $("<div class='field width grid js-columns searchActvity' data-type='componentParentDiv' style='margin: 0 .1em 1em .5em ; clear: none; float: left;'></div>"),

			this.$('[data-id="componentContainer"]').append(container);

			self.$el.find('.menu .browse').popup('hide');			
			
			if(typeof this.options.data != "undefined"){
				this.$el.find(".criteriaRemoveBtnContainer").show(); 
				this.$el.find('.criteriaAddBtnContainer').hide();
			}

			if(self.$el.find('.js-dummy-container').length > 0){
				self.$el.find('.js-dummy-container').remove();	
			}

			var model = new SegmentOverlayDataModel();


			model.fetch().then(function(){
				self.onSuccessCallbackDemographicSegmentOverlayOverlay(tokens, model, container, componentObj, megaDrpDwnSelectionObj);
				$("input[name='segment']").on("change", function(e){
					if(!self.isAdded){
						if(($('input[name=segment]:checked').prop("id") == "segmentAdvertiser") && self.advDropdownId == ""){
							return;							
						}						
					}
				});

				self.addAdvertiserChangeClickHandler();

			});
		},
		
		addAdvertiserChangeClickHandler: function(){		
			var self = this;
			this.on("advertiserChanged", function(){
				if(($.inArray("advertiser", self.currentScope)!=-1)|| self.currentScope=='advertiser'){

					self.isRemoved = true;
					if(!self.isAdded){
						self.$('[data-id="componentContainer"]').html('<div data-id="attributeSelection" class="modal_segment" style="float: left; clear: none;" data-type="componentParentDiv"></div>');
						self.$el.find("button[data-id='addCriteria']").hide();
						self.cnt = 0;
						self.componentsRef = [];
						self.renderMegaDropdown();

					}else{
						if(self.isAdvertiserChanged()){
							self.$el.remove();
							self.isRemoved = true;
						}
					}							
				}else{
					if(!self.isAdded){
						self.$('[data-id="componentContainer"]').html('<div data-id="attributeSelection" class="modal_segment" style="float: left; clear: none;" data-type="componentParentDiv"></div>');
						self.$el.find("button[data-id='addCriteria']").hide();
						self.cnt = 0;
						self.componentsRef = [];
						self.renderMegaDropdown();
					}
				}								
			});

		},

		isAdvertiserChanged: function(){

			var isChanged = true;

			for(var i=0;i<this.componentsRef.length;i++){
				if(this.componentsRef[i] != null){

					var fieldForSelection = this.componentsRef[i]["fieldForSelection"];					

					if(fieldForSelection == "entity" && typeof this.componentsRef[i]["componentRef"].getAdvertiserId != "undefined"){

						if(this.options.getAdvertiserId() == this.componentsRef[i]["componentRef"].getAdvertiserId()){
							isChanged = false;
						}
						
						if(this.isAdvertiserChangedForDemographic === true){
							isChanged = true;
						}
					}
				}
			}

			return isChanged;
		},

		onSuccessCallbackDemographicSegmentOverlayOverlay: function(tokens, model, container, componentObj, megaDrpDwnSelectionObj) {

			var self = this,
			opt = {};

			opt.url="getModelData.htm";

			opt.configuration = model.toJSON();			


			opt.accountId=AccountService.getCurrentAccount().id;

			if($('#segmentAdvertiser input').is(':checked')){
				opt.advertiserId = self.advDropdownId;	
			}
		
			opt.operation = "list";

			opt.advAccName = $('#segmentAdvertiser input').is(':checked') ? self.advDropdownText : "In Advertiser";
			opt.sortDropDownOptions = [
			                           {
			                        	   text:"SORT BY DATE",
			                        	   id:"1",
			                        	   orderBy:"asc",
			                        	   orderByColumn:"whencreated",
			                           },
			                           {
			                        	   text:"SORT BY DATE",
			                        	   id:"2",
			                        	   orderBy:"desc",
			                        	   orderByColumn:"whencreated",
			                           },
			                           {
			                        	   text:"SORT BY ALPHABET",
			                        	   id:"3",
			                        	   orderBy:"asc",
			                        	   orderByColumn:"name",
			                           },
			                           {
			                        	   text:"SORT BY ALPHABET",
			                        	   id:"4",
			                        	   orderBy:"desc",
			                        	   orderByColumn:"name",
			                           }];

			if(tokens[1].toLowerCase() == "SEGMENT MEMBERSHIP".toLowerCase()){
				opt.entity = "models";
				if(tokens[2].toLowerCase() == "userIsInDemographicSegment".toLowerCase() || tokens[2].toLowerCase() == "userIsNotInDemographicSegment".toLowerCase()){
					opt.selectModelType='demographic';

					opt.url="getModels.htm";
					opt.option="demographics";

					//NOTE: When Modeling Level Ios or Android radio buttons checked
					if(this.modelingLevelRadio === 'DEVICE_IOS' || this.modelingLevelRadio === 'DEVICE_GOG') {
						opt['modelingLevel'] = this.modelingLevelRadio;
					}else {
						opt['modelingLevel'] = 'MOOKIE';
					}

					if(opt.advertiserId == undefined){
						opt.advAccName = "In Account";
					}
				}else if(tokens[2].toLowerCase() == "userIsInLookalikeSegment".toLowerCase() || tokens[2].toLowerCase() == "userIsNotInLookalikeSegment".toLowerCase()){

					opt.selectModelType='lookalike';
					opt.url="getModels.htm";
					opt.option="feedback";

					opt.tabValues1 ={
							text:"FEEDBACK",
							id:"feedBackLookAlikes",
							isSelected:false 
					};
					opt.tabValues2 ={
							text:"LOOKALIKES",
							id:"lookAlikes",
							isSelected:true
					};
				}
			}

			opt['selectedScope'] = 'advertiser';	

			if(this.options.data && this.options.data.selectedValues && this.options.data.selectedValues[componentObj["fieldForSelection"]] ){

				opt['selectionId'] = this.options.data.selectedValues[componentObj["fieldForSelection"]]["id"]; 

			}	

			var instance = new SegmentBuilderActivityOverlay(opt);

			container.html("");

			container.append("<div data-type='label' class='attributeLabel'>"+componentObj["header"]+"</div>");

			container.append(instance.render().$el);

			$(container).find('.ui.dropdown').css('width', componentObj["width"] ? componentObj["width"] : 300);

			self.listenTo(instance, "selectionDone", function(optionSelected){
				var nextComponentJson = ConfigService.getConfig("rowConfigModel").renderNextComponent();
				instance.$el.find('.ui.dropdown').removeAttr('style');
				instance.$el.find('.ui.dropdown').find('.menu').find('.item').css('word-break', 'break-all');
				instance.$el.find('.ui.dropdown').css('width', '100%');

				if(nextComponentJson!=null){
					self.renderComponent(nextComponentJson);
				}else{
					self.$el.find("button[data-id='addCriteria']").show();
					EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
				}
				
				var fullValue = instance.getFullValueFromSelectedValue();

				if(fullValue){
					if(fullValue.scope == "ALL_ADV"){
						self.currentScope = ["account"];
					}else{
						self.currentScope = ["account", "advertiser"];
					}
				}


			});

			self.listenTo(instance, "valueSelectedModelComponent", function(){
				self.$el.find("button[data-id='addCriteria']").show();
				if(!self.isAdded){
					self.trigger("addNewSetConditions");
					EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
				}
			});

			self.listenTo(instance, "innerScopeChanged", function(selectedDropDown){
				self.currentScope=[];
				self.currentScope.push(selectedDropDown);
			});

			var obj = {
					getValue: function(){ 
						return {
							"id": instance.getSelectedValue()
						};
					},

					getFullValue: function(){
						return instance.getFullValueFromSelectedValue();
					},

					getAdvertiserId: function(){
						return instance.getAdvertiserId();
					}
			};

			self.cnt++;

			self.componentsRef[self.cnt] = {
					"componentRef": obj,
					"fieldForSelection": componentObj["fieldForSelection"],
					"ref": instance
			};

			container.attr("data-component-cnt", self.cnt);

			// if(this.options.data){
			// 	if(this.options.data.selectedValues){
			// 		if(this.options.data.selectedValues[componentObj["fieldForSelection"]]){
			// 			instance.setSelection(this.options.data.selectedValues[componentObj["fieldForSelection"]]["name"],this.options.data.selectedValues[componentObj["fieldForSelection"]]["id"],this.options.data.scope);
			// 		}
			// 	}
			// }

			this.listenTo(this, "advertiserDropdownChange", function(value, text){
				this.advDropdownId = value;
				this.advDropdownText = text;

				instance.advertiserId = value;
				instance.selectedScope = "advertiser";
				self.isAdvertiserChangedForDemographic = true;
				instance.render();
				self.addAdvertiserChangeClickHandler();
			});			
			
			$('input[name=segment]').on("click", function(e){
				if($(e.target).prop("id") == "segmentAccount"){
					instance.advertiserId = undefined;
					instance.selectedScope = "account";
					self.isAdvertiserChangedForDemographic = false;
				}
			});
		},

		addCriteria: function(e, canShowAddBtn){
			var obj = {};
			var isInDemographicSegment = false;

			for(var i=0;i<this.componentsRef.length;i++){
				if(this.componentsRef[i] != null){

					var fieldForSelection = this.componentsRef[i]["fieldForSelection"];
					var componentValue = this.componentsRef[i]["componentRef"].getValue();

					if(fieldForSelection == "attributeName" && componentValue == "userIsInDemographicSegment"){
						isInDemographicSegment = true;
					}

					if(isInDemographicSegment === true && fieldForSelection == "entity"){
						var fullValue = this.componentsRef[i]["componentRef"].getFullValue();

						if(fullValue && fullValue.scope == "ALL_ADV"){
							this.currentScope = ["account"];
						}
					}

					if(fieldForSelection == "dataPartner"){
						var fullValue = this.componentsRef[i]["componentRef"].getFullValue();

						if(fullValue && fullValue.scope == "ALL_ADV"){
							this.currentScope = ["account"];
						}
					}

					obj[this.componentsRef[i]["fieldForSelection"]] = componentValue;
				}
			}

			obj["scope"] = $('input[name=segment]:checked').val();
			this.$(".outerDivOverlay .drpDwnBtn").css("background-color","#f6f6f6");

			this.isAdded = true;

			if(!canShowAddBtn){
				this.$el.find('.criteriaAddBtnContainer').hide();
				this.trigger("addedCriteria");
			}

			this.checkModelingLevel();

			this.componentsRef[0]["ref"].disable();
		},
		
		checkModelingLevel: function() {
			if($('.js-modeling-level').length) {
				$('.js-modeling-level').each(function(index, item){
	                if($(item).checkbox('is checked')) {
	                	this.modelingLevelRadio = $(item).data('value');
	                    this.modifyMegaDropdown($(item).data('value'));
	                }
	            }.bind(this));
			}
		},

		modifyMegaDropdown: function(modelingLevel) {
            if(modelingLevel === 'DEVICE_IOS' || modelingLevel === 'DEVICE_GOG') {
            	setTimeout(function() {
	                this.overlayInstance.trigger('modelingLevelCheck', value);
	                $('.js-mega-CS-dropdown').addClass('medium-mega-dropdown');

	                $('a[data-value="modelled.SEGMENT MEMBERSHIP.userIsInInterestSegment"]').text('User does qualify for selected Mobile App Behavior');
	                $('a[data-value="modelled.SEGMENT MEMBERSHIP.userIsNotInInterestSegment"]').text('User doesn\'t qualify for selected Mobile App Behavior');
            	}.bind(this), 500);
            }else {
            	setTimeout(function() {
	                this.overlayInstance.trigger('modelingLevelCheck', value);
	                $('.js-mega-CS-dropdown').removeClass('medium-mega-dropdown');
            	}.bind(this), 500);
            }
        },

		getCriteriaSelection: function(){
			var obj = {};

			obj["selectedValues"] = {};

			var entityRef;

			for(var i=0;i<this.componentsRef.length;i++){
				if(this.componentsRef[i] != null){

					if(this.componentsRef[i]["fieldForSelection"] == "attributeName"){

						obj[this.componentsRef[i]["fieldForSelection"]] = this.componentsRef[i]["componentRef"].getValue().trim();
						if(this.componentsRef[i]["fieldForSelection"] == "entity"){
							entityRef = this.componentsRef[i]["ref"];
						}
					} else if (this.componentsRef[i]["fieldForSelection"] == "dataAttributeValues"){
						//Get data attribute value
						var _valueObj = this.componentsRef[i]["componentRef"].getValue();

						//Get the data attribute value
						_value = obj["selectedValues"]["dataAttribute"];

						_value["type"] = _valueObj.id;

						obj["selectedValues"]["dataAttribute"] = _value;

					} else if (this.componentsRef[i]["fieldForSelection"] === "dataSource"){
						var _valueObj = this.componentsRef[i]["componentRef"].getValue();

						//remove customvariable and varrefvalue keys from _valueObj
						_valueObj = _.omit(_valueObj , 'customVariables', 'varValueRefMapping');

						obj["selectedValues"][this.componentsRef[i]["fieldForSelection"]] = (typeof _valueObj == "undefined" || _valueObj == null) ? "" : _valueObj;						
						
					}else if(this.componentsRef[i]["fieldForSelection"] == "condition"){					

						var _obj = this.componentsRef[i]["componentRef"].getValue();

						obj["selectedValues"][this.componentsRef[i]["fieldForSelection"]] = typeof _obj == "undefined" ? "" : _obj.id;						
					}else{
						
						var _valueObj = this.componentsRef[i]["componentRef"].getValue();
						
						obj["selectedValues"][this.componentsRef[i]["fieldForSelection"]] = this.componentsRef[i]["componentRef"].getValue();						

						if(this.componentsRef[i]["fieldForSelection"] == "textBoxValue" && typeof this.componentsRef[i]["componentRef"].getFullValue != "undefined"){
							obj["selectedValues"][this.componentsRef[i]["fieldForSelection"]] = (typeof _valueObj == "undefined" || _valueObj == null) ? "" : _valueObj.id;
						}else if(this.componentsRef[i]["fieldForSelection"] == 'condition' || this.componentsRef[i]["fieldForSelection"] == 'interval' || this.componentsRef[i]["fieldForSelection"] == 'occurrences'){
							obj["selectedValues"][this.componentsRef[i]["fieldForSelection"]] = this.componentsRef[i]["componentRef"].getValue().id;
						}
						else if(this.componentsRef[i]["fieldForActivitySelection"] != undefined){
							obj["selectedValues"][this.componentsRef[i]["fieldForActivitySelection"]] = this.componentsRef[i]["componentRef"].getOtherValue();
						}else if(this.componentsRef[i]["fieldForSelection"] == "textBoxValues"){
							if(_valueObj && _valueObj.id){
								obj["selectedValues"][this.componentsRef[i]["fieldForSelection"]] = (typeof _valueObj == "undefined" || _valueObj == null) ? "" : (_valueObj.id.split(",").length > 0 ? _valueObj.id.split(",") : [_valueObj.id]);
							} else {
								obj["selectedValues"][this.componentsRef[i]["fieldForSelection"]] = (typeof _valueObj == "undefined" || _valueObj == null) ? "" :  _valueObj;
							}							
						}
					}
				}
			}

			if(entityRef){
				obj["scope"] = entityRef.getScope();
			}else{
				obj["scope"] = $('input[name=segment]:checked').val();
			}

			return obj;
		},

		/**
		 * This method will invoke on click of 'Find Audience' button. This method then call AudienceFilterView.renderChart to prepare 
		 * bubble chart.
		 */
		getCriteriaSelectionForAudienceIndex: function(){
			var obj = {};

			obj["selectedValues"] = {};

			var entityRef,
				advertiserObj;

			for(var i=0;i<this.componentsRef.length;i++){
				if(this.componentsRef[i] != null){
					if(this.componentsRef[i]["fieldForSelection"] == "entity"){
						entityRef = this.componentsRef[i]["ref"];
						if(this.componentsRef[i]["componentRef"].getValue().advertiserId != undefined){
							advertiserObj = entityRef.getAdvertiserObj();
							
							if(advertiserObj.isActivity === true){
								obj["advertiserId"] = advertiserObj.advertiserId;
								obj["advertiserName"] = advertiserObj.advertiserName;
							}else if(advertiserObj.isActivity !== true){
								obj["dataPartnerId"] = advertiserObj.dataPartnerId;
							}
						}
						obj["activityId"] = this.componentsRef[i]["componentRef"].getValue().activityId;
						obj["activityName"] = this.componentsRef[i]["componentRef"].getValue().activityName;
						obj["type"] = this.componentsRef[i]["componentRef"].getValue().type;
						obj["isCrossAccount"] = this.componentsRef[i]["componentRef"].getValue().isCrossAccount || "N";
					}
					if(this.componentsRef[i]["fieldForSelection"] == "condition"){
						obj["condition"] = this.componentsRef[i]["componentRef"].getValue();
						//Is at any time value
						if(this.componentsRef[i]["componentRef"].getValue()!=undefined && this.componentsRef[i]["componentRef"].getValue().id=="0")
							obj["activityDays"] = "0";
					}
					if(this.componentsRef[i]["fieldForSelection"] == "selectedInterval"){
						if(this.componentsRef[i]["componentRef"].getValue().child.length > 0){
							obj["activityDays"] = this.componentsRef[i]["componentRef"].getValue().child;
						}
						
					}
				}
			}

			obj["accountId"] = AccountService.getCurrentAccount().id;
			obj["accountName"] = AccountService.getCurrentAccount().text;

			if(obj["advertiserName"] != undefined){
				obj["owner"] = obj["advertiserName"];
			}else if(typeof advertiserObj !== "undefined" && advertiserObj["isActivity"] === false){
				obj["owner"] = advertiserObj["dataPartnerText"];
			}else
				obj["owner"] = obj["accountName"];

			obj["option"] = "AudienceIndex";

			this.trigger("findAudience", obj);
			return obj;
		},

		removeCriteria: function(){
			var self=this;
			
			if(!this.isMaximumCriteriaCreated){

				var parentDiv = undefined;
				var conditions = this.$el.parent().find("[data-id='componentContainer']");
				
				if(conditions.length === 1){
					this.$el.parent().find('div').last().hide();					
					this.trigger('addedCriteria');				
					this.$el.next().remove();	
				}	

				parentDiv = this.$el.parent();
				
				parentDiv.find('.js-condition-divider:last').remove();
                this.$el.remove();

                if(parentDiv && parentDiv !== null && conditions.length !== 1 && conditions.last().children().length > 1){
                    $(parentDiv).find('div').last().show().find(".criteriaAddBtn").css('display', 'inline-block');;
                }
					
				this.isRemoved=true;
			}else{
				
				self.$('[data-id="componentContainer"]').html('<div data-id="attributeSelection" class="modal_segment" style="float: left;" data-type="componentParentDiv"></div>');
				self.$el.find("button[data-id='addCriteria']").hide();
				self.cnt = 0;
				self.componentsRef = [];
				this.$el.find('.criteriaRemoveBtnContainer').hide();
				// this.$("[data-id='addCriteria']").removeClass("criteriaRemoveBtn").addClass("criteriaAddBtn")
				// .html("X"); 

				self.removeFromArray=true;
				self.isAdded=false;
				this.trigger('maxLimitRowRemoved');				
				this.trigger("addedCriteria");
			}
			this.trigger("forDataLedgerSetRemoved");
			this.trigger("change");

			if($('.js-modeling-level').length) {
				$('.js-modeling-level').each(function(index, item){
	                if($(item).checkbox('is checked')) {
	                    this.modifyMegaDropdown($(item).data('value'));
	                }
	            }.bind(this));
			}

			EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
		},
		renderCampaignExposureCountSelection : function(){
			var componentConfig = ConfigService.getConfig("componentConfigModel").get("campaignExposureCountSelection");

			if(componentConfig['component']=='dropdown'){
				this.renderDropdown(componentConfig,null,'campaignExposureCountSelection');
			}
		},
		renderCampaignClickCountSelection : function(){
			var componentConfig = ConfigService.getConfig("componentConfigModel").get("campaignClickCountSelection");

			if(componentConfig['component']=='dropdown'){
				this.renderDropdown(componentConfig,null,'campaignClickCountSelection');
			}
		},
		rendercampaignIntervalSelection: function(selectedValues){
			componentObj = ConfigService.getConfig("componentConfigModel").get("activityIntervalSelection");

			var self = this;
			var container = $("<div data-type='componentParentDiv' class='valueSelector' style='float: left; margin: 0 .1em 1em 0 ;'></div>");

			var inputStr1 = '<div style="float: left; margin: 0 .1em 0 0;" class="days-input-wrap"><div class="ui search dropdown selection" data-id="child" style="min-width: auto;"> <input type="hidden"/><i class="dropdown icon"></i><div class="default text"></div><div class="menu"></div></div></div>',
			inputStr2 = '<div class="days-ago-wrap" style="float: left; margin: 0 .1em 0 .5em;"><div class="ui dropdown selection disabled" data-id="parent"><input type="hidden" /><i class="dropdown icon"></i><div class="default text"></div><div class="menu"></div></div></div>';

			container.append(inputStr1);
			container.append(inputStr2);

			this.$('[data-id="componentContainer"]').append(container);

			componentObj["options"][0]["id"] = componentObj["options"][0]["value"];
			componentObj["options"][0]["text"] = componentObj["options"][0]["name"]; 

			var $menuParent = container.find('[data-id="parent"]').find('.menu');
			
			$.each( componentObj.options , function(index, item){
				$menuParent.append('<div class="item" data-value="'+item.id+'">' + item.name + '</div>');
			});
			
			container.find('[data-id="parent"]').data('componentOptions',  componentObj.options).dropdown({
				fullTextSearch : "exact",
				match: "text",
				forceSelection: false,
				onShow: function() {
					var itemLen = container.find('[data-id="parent"]').data('componentOptions',  componentObj.options).find('.menu .item').map(function(index, item){
						return $(item).text().length;
					});

					var maxLen = _.max(itemLen);
					if(maxLen > 36){
						container.find('[data-id="parent"]').data('componentOptions',  componentObj.options).find('.menu').css('min-width', (maxLen+140)+'%');
					}else if(maxLen > 20 && maxLen <= 36) {
						container.find('[data-id="parent"]').data('componentOptions',  componentObj.options).find('.menu').css('min-width', (maxLen+120)+'%');
					}else {
						container.find('[data-id="parent"]').data('componentOptions',  componentObj.options).find('.menu').css('min-width', '100%');
					}

				}
			});
			this.$('[data-id="parent"]').dropdown('set selected', _.findWhere(componentObj["options"], {"default": "true"})["value"]);
			this.$('[data-id="parent"]').trigger('change', _.findWhere(componentObj["options"], {"default": "true"})["value"]);

			var defaultOptions = _.findWhere(componentObj["options"], {"default": "true"})["options"];

			_.each(defaultOptions, function(elem, index, list){
				elem["id"] = elem["value"];
				elem["text"] = elem["name"];
			});
			
			var $menu = container.find('[data-id="child"]').find('.menu');
			
			$.each( defaultOptions , function(index, item){
				$menu.append('<div class="item" data-value="'+item.id+'">' + item.name + '</div>');
			});

			container.find('[data-id="child"]').data('defaultOptions', defaultOptions).dropdown({
				fullTextSearch : "exact",
				match: "text",
				forceSelection: false,
				onShow: function() {
					var itemLen = container.find('[data-id="child"]').data('defaultOptions', defaultOptions).find('.menu .item').map(function(index, item){
						return $(item).text().length;
					});

					var maxLen = _.max(itemLen);
					if(maxLen > 36){
						container.find('[data-id="child"]').data('defaultOptions', defaultOptions).find('.menu').css('min-width', (maxLen+140)+'%');
					}else if(maxLen > 20 && maxLen <= 36) {
						container.find('[data-id="child"]').data('defaultOptions', defaultOptions).find('.menu').css('min-width', (maxLen+120)+'%');
					}else {
						container.find('[data-id="child"]').data('defaultOptions', defaultOptions).find('.menu').css('min-width', '100%');
					}
				}
			});
			
			this.$('[data-id="child"]').dropdown('set selected', _.findWhere(defaultOptions, {"default": "true"})["id"]);
			this.$('[data-id="child"]').trigger('change', _.findWhere(defaultOptions, {"default": "true"})["id"]);

			this.$('[data-id="parent"]').on("change", function(e){
				
				var $menuParent = self.$('[data-id="parent"]').find('.menu');
				$.each( componentObj.options , function(index, item){
					$menuParent.append('<div class="item" data-value="'+item.id+'">' + item.name + '</div>');
				});
				self.$('[data-id="child"]').data('componentOptions',  componentObj.options).dropdown({
					fullTextSearch : "exact",
					match: "text",
					forceSelection: false,
					onShow: function() {
						var itemLen = self.$('[data-id="child"]').data('componentOptions',  componentObj.options).find('.menu .item').map(function(index, item){
							return $(item).text().length;
						});

						var maxLen = _.max(itemLen);
						if(maxLen > 36){
							self.$('[data-id="child"]').data('componentOptions',  componentObj.options).find('.menu').css('min-width', (maxLen+140)+'%');
						}else if(maxLen > 20 && maxLen <= 36) {
							self.$('[data-id="child"]').data('componentOptions',  componentObj.options).find('.menu').css('min-width', (maxLen+120)+'%');
						}else {
							self.$('[data-id="child"]').data('componentOptions',  componentObj.options).find('.menu').css('min-width', '100%');
						}

					}.bind(self)
				});
				//width: componentObj["childWidth"]
				self.$('[data-id="child"]').dropdown('set selected',  _.findWhere(self.$('[data-id="child"]').data('defaultOptions'), {"default": "true"})["id"]);
				self.$('[data-id="child"]').trigger('change',  _.findWhere(self.$('[data-id="child"]').data('defaultOptions'), {"default": "true"})["id"]);
			});

			var obj = {
					getValue: function(){ 
						return {
							"parent": self.$('[data-id="parent"]').dropdown("get value"),
							"child": self.$('[data-id="child"]').dropdown("get value")
						};
					}
			};

			this.cnt++;
			this.componentsRef[this.cnt] = {
					"componentRef": obj,
					"fieldForSelection": componentObj["fieldForSelection"]
			};

			container.attr("data-component-cnt", this.cnt);


			if(typeof this.options.data != "undefined" && !self.isValueChangedInEditMode){
				var selectedVals = this.options.data.selectedValues.selectedInterval;
				
				this.$('[data-id="parent"]').dropdown('set selected', selectedVals["parent"]);
				this.$('[data-id="parent"]').trigger('change', selectedVals["parent"]);
				
				this.$('[data-id="child"]').dropdown('set selected', selectedVals["child"]);
				this.$('[data-id="child"]').trigger('change', selectedVals["child"]);

				if(componentObj["isLastNode"] == "true"){
					self.isValueChangedInEditMode = true;
				}
			}
			
			this.$el.find("button[data-id='addCriteria']").show();
			if(!this.isAdded){
				this.trigger("addNewSetConditions");
				EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
			}
		},

		renderCookieAgeDropdown : function(){
			var componentConfig = ConfigService.getConfig("componentConfigModel").get("cookieAgeDropDown");

			if(componentConfig['component']=='dropdown'){
				this
				.renderDropdown(componentConfig,null,'cookieAgeDropDown')
				.renderDropdown(componentConfig["next"], null, 'cookieAgeDropDownDaysLbl');
			}
		},
		renderRawInterestCount : function(){
			var componentConfig = ConfigService.getConfig("componentConfigModel").get("rawInterestCount");

			if(componentConfig['component']=='dropdown'){
				this.renderDropdown(componentConfig);
			}
		},
		renderCustomVariableOverlay:function(componentObj){
			var self = this;
			var opt = {};
			var model = new CustomVariableDataModel();
			model.fetch({async:false}).complete(function(){

				if(self.$el.find('.js-dummy-container').length > 0){
					self.$el.find('.js-dummy-container').remove();	
				}

				opt.configuration = model.toJSON();
				var isAdvertiserSelected = false;	

				if(self.options.getExternalScope() == "segmentAdvertiser" || self.options.getExternalScope() == "advertiser"){
					isAdvertiserSelected = true;
				}
				opt.getExternalScope = self.options.getExternalScope;
				opt.isAdvertiserSelected = isAdvertiserSelected;

				if(self.options.data != undefined){
					var advertiserKey = self.options.advertiserId;
					if(advertiserKey!=undefined)
						opt.advAccName = _.findWhere(RefDataService.get('advertisers').toJSON(), {"id": parseInt(advertiserKey)})["name"];
				}else{					
					var advertiserKey = (typeof self.options.advertiserId != "undefined") ? self.options.advertiserId : self.advDropdownId;
					if(advertiserKey!=undefined)
						opt.advAccName = _.findWhere(RefDataService.get('advertisers').toJSON(), {"id": parseInt(advertiserKey)})["name"];
				}

				opt.sortDropDownOptions = [
				                           {
				                        	   text:"SORT BY DATE",
				                        	   id:"1",
				                        	   orderBy:"asc",
				                        	   orderByColumn:"whencreated",
				                           },
				                           {
				                        	   text:"SORT BY DATE",
				                        	   id:"2",
				                        	   orderBy:"desc",
				                        	   orderByColumn:"whencreated",
				                           },
				                           {
				                        	   text:"SORT BY ALPHABET",
				                        	   id:"3",
				                        	   orderBy:"asc",
				                        	   orderByColumn:"Variable_Name",
				                           },
				                           {
				                        	   text:"SORT BY ALPHABET",
				                        	   id:"4",
				                        	   orderBy:"desc",
				                        	   orderByColumn:"Variable_Name",
				                           }];
				opt.scopedropDownOptions = [
				                            {
				                            	text:"ADVERTISER",
				                            	scope_id:"advertiser"
				                            },{
				                            	text:"ACCOUNT",
				                            	scope_id:"account"
				                            }];				
				opt.entity = "customVariables";
				opt.accountId = AccountService.getCurrentAccount().id;
				opt.operation = "list";
				opt.nameOfVariable = "NAME OF VARIABLE";
				opt.associatedActivity = "ASSOCIATED ACTIVITY";
				opt.isPaginationSupport = true;
				opt.isServerSidePagination=true;
				opt.rowsPerPage=0;
				opt.selectedData=[];
				opt.advDropdownId = self.advDropdownId;
				opt.advDropdownText = self.advDropdownText;
				var container = $("<div data-type='componentParentDiv' class='searchActvity' style='position: relative; float: left; clear: none;'></div>");
				self.$('[data-id="componentContainer"]').append(container);

				if(self.options.data != undefined){
					opt.isEdit = true;
					opt.selectedData['scope'] = self.options.data.scope; 	
					opt.selectedData['activityId'] = self.options.data.selectedValues.activityId.id;
					opt.selectedData['activityName'] = self.options.data.selectedValues.activityId.name;
					opt.selectedData['condition'] = self.options.data.selectedValues.condition;
					opt.selectedData['entityId'] = self.options.data.selectedValues.entity.id;
					opt.selectedData['entityName'] = self.options.data.selectedValues.entity.id;
					opt.advertiserId = self.options.advertiserId;				
				}else if(typeof self.options.advertiserId != "undefined"){
					opt.advertiserId = self.options.advertiserId;
				}
				opt.forBuildModel = self.options.forBuildModel;

				var instance = new CustomVariableComponentView(opt);

				container.append(instance.render().$el);
				if(self.options.data == undefined){
					self.nextComponent = ConfigService.getConfig("rowConfigModel").renderNextComponent();
				}									
				
				
				self.listenTo(instance, "valueSelectedFromCustomVariableComponent", function(){

					var nextComponentJson = ConfigService.getConfig("rowConfigModel").renderNextComponent();

					if((nextComponentJson == undefined) && (self.options.data == undefined)){
						nextComponentJson = self.nextComponent;
					}
					if(nextComponentJson !== null && nextComponentJson !== undefined){					
						self.renderComponent(nextComponentJson);
					}

				});


				var obj = {
						getValue: function(){ 
							return instance.getSelectedValue();

						},
						getOtherValue: function(){ 
							return  instance.getSelectedOtherValue();

						},
						getTextBoxValue: function(){
							return  instance.getTextBoxValue();
						}
				};

				self.cnt++;

				self.componentsRef[self.cnt] = {
						"componentRef": obj,
						"fieldForSelection": componentObj["fieldForSelection"],
						"fieldForActivitySelection": componentObj["fieldForActivitySelection"],								
						"ref": instance
				};
				container.attr("data-component-cnt", self.cnt);

				self.$el.find('.menu .browse').popup('hide');
				self.listenTo(instance, "customVariableInnerScopeChanged", function(selectedDropDown){														
					self.currentScope=[];
					self.currentScope.push(selectedDropDown);
				});

				self.on("advertiserChanged", function(){
					if(($.inArray("advertiser", self.currentScope)!=-1)|| self.currentScope=='advertiser'){									
						if(!self.isAdded){
							self.$('[data-id="componentContainer"]').html('<div data-id="attributeSelection" class="modal_segment" style="float: left; clear: none;" data-type="componentParentDiv"></div>');
							self.$el.find("button[data-id='addCriteria']").hide();
							self.cnt = 0;
							self.componentsRef = [];
							self.renderMegaDropdown();

						}else{
							self.$el.remove();
							self.isRemoved = true;
						}

					}else{
						if(!self.isAdded){
							self.$('[data-id="componentContainer"]').html('<div data-id="attributeSelection" class="modal_segment" style="float: left; clear: none;" data-type="componentParentDiv"></div>');
							self.$el.find("button[data-id='addCriteria']").hide();
							self.cnt = 0;
							self.componentsRef = [];
							self.renderMegaDropdown();

						}
					}	
				});						
				
				self.listenTo(instance, "valueSelectedFromCustomVariableComponent", function(){
					this.trigger("change");
				});
			});
		},

		renderStringTextBox: function(componentObj) {			
			var container = $("<div data-type='componentParentDiv' class='textboxwithstring'></div>"),
			componentConfig = ConfigService.getConfig("componentConfigModel").get("stringTextBox"),
			component = undefined,
			self = this;

			if(componentObj["component"] == "stringTextBox" || componentObj == "stringTextBox"){
				component = $("<input id='custTextVal' class='custTextVal' type='text' size='10'>");
			}else if(componentObj["component"] == "numberTextBox" || componentObj == "numberTextBox"){
				component = $("<input id='custTextVal' class='custTextVal custNumericValues' type='text' size='10'>");
			}
			container.append(component);

			this.$('[data-id="componentContainer"]').append(container);
			this.$(".custNumericValues").keypress(function(e){
				if(e.which !=8 && e.which !=0 && (e.which < 48 || e.which > 57)){
					return false;
				}
			});

			this.$(".custTextVal").keypress(function(e){
				setTimeout(function(){
					if($(e.target).val() != ""){
						self.$("button[data-id='addCriteria']").show();
						if(!self.isAdded){
							self.trigger("addNewSetConditions");
							EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
						}
					}
				}, 500);
			});
			var obj = {
					getValue: function(){
						return container.find("input[class='custTextVal']").val();
					}
			};
			this.cnt++;
			this.componentsRef[this.cnt] = {
					"componentRef": obj,
					"fieldForSelection": componentConfig["fieldForSelection"]
			};

			if(this.options.data != undefined && this.isValueChangedInEditMode === false){
				container.find("input[class='custTextVal']").val(this.options.data.selectedValues.textBoxValue);		
				this.$("button[data-id='addCriteria']").show();
				if(!self.isAdded){
					self.trigger("addNewSetConditions");
					EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
				}
			}

			container.attr("data-component-cnt", this.cnt);

		},

		renderNumberTextBox: function(componentObj) {			
			var container = $("<div data-type='componentParentDiv' class='textboxwithstring'></div>"),
			component = undefined,
			componentConfig = ConfigService.getConfig("componentConfigModel").get("numberTextBox"),
			self = this;
			if(componentObj["component"] == "stringTextBox" || componentObj == "stringTextBox"){
				component = $("<input id='custTextVal' class='custTextVal' type='text' size='10'>");
			}else if(componentObj["component"] == "numberTextBox" || componentObj == "numberTextBox"){
				component = $("<input id='custTextVal' class='custTextVal custNumericValues' type='text' size='10'>");
			}
			container.append(component);

			this.$('[data-id="componentContainer"]').append(container);
			this.$(".custNumericValues").keypress(function(e){
				if(e.which !=8 && e.which !=0 && (e.which < 48 || e.which > 57)){
					return false;
				}else{
					setTimeout(function(){
						if($(e.target).val() != ""){
							self.$("button[data-id='addCriteria']").show();
							if(!self.isAdded){
								self.trigger("addNewSetConditions");
								EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
							}
						}
					}, 500);
				}
			});
			var obj = {
					getValue: function(){
						return container.find("input[class='custTextVal custNumericValues']").val();
					}
			};
			this.cnt++;
			this.componentsRef[this.cnt] = {
					"componentRef": obj,
					"fieldForSelection": componentConfig["fieldForSelection"]
			};

			if(this.options.data != undefined && this.isValueChangedInEditMode === false){
				container.find("input[class='custTextVal custNumericValues']").val(this.options.data.selectedValues.textBoxValue);		
				this.$("button[data-id='addCriteria']").show();
				if(!this.isAdded){
					this.trigger("addNewSetConditions");
					EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
				}
				if(componentObj["isLastNode"] === "true"){
					this.isValueChangedInEditMode = true;
				}
			}

			container.attr("data-component-cnt", this.cnt);
		},
		/*
		 * This function will set value of this.isMaximumCriteriaCreated
		 *  to true if maximum limit of criteria creation 
		 * has reached 
		 */
		isMaxCriteriaCreated : function(booleanValue){
			this.isMaximumCriteriaCreated = booleanValue;
		},

		redrawComponents: function(){
			if(!this.isAdded){
				var currentSelection = this.megaDrpDownInstance.getSelection();
				if(currentSelection.length > 0){
					this.$('[data-id="componentContainer"]').html('<div data-id="attributeSelection" class="modal_segment" style="float: left;" data-type="componentParentDiv"></div>');
					this.$el.find("button[data-id='addCriteria']").hide();
					this.cnt = 0;
					this.componentsRef = [];
					this.renderMegaDropdown()
					.setMegaDrpDownVal(currentSelection);
				}

			}
		},
		recreateOverlay: function(){
			var data = JSON.parse(JSON.stringify(ConfigService.getConfig("megaDropdownModel").toJSON())); 

			if(this.options.isIncludeInConsumerGroups) {
				var tmp = _.where(data.observed.options, {
					attributeName: "ACTIVITY"
				});
				data.observed.options = tmp;
				data.modelled.options = [];
				return data;
			}else{
				return data;
			}
		},

		getDataPartnerSelection: function(){
			return this.componentsRef[2] ? (this.componentsRef[2]["componentRef"].getValue() ? 
					(this.componentsRef && typeof this.componentsRef[2]["componentRef"].getValue()["name"] == "function" ? undefined : this.componentsRef[2]["componentRef"].getValue()["name"])
					: undefined) : undefined;
		},

		setMegaDrpDownVal: function(val){
			this.megaDrpDownInstance.setValue(val[0]);
			this.megaDrpDownInstance.trigger("selectionDone", val);

		},

		isFilledButNotAdded: function(){
			var flag = true;

			/*for(var i=0;i<this.componentsRef.length; i++){
				if(this.componentsRef[i]){
					var _val = this.componentsRef[i]["componentRef"].getValue();
					if(_val == null || typeof _val == "undefined" || _val == ""){
						flag = false;
					}
				}
			}*/

			//Pass second argument as a boolean value which will determine whether the insert link is to be shown or not
			if(flag){
				this.$(".criteriaAddBtn").trigger("click", [true]);
			}

			return flag;
		},

		resetDataPartnerOptions: function(resp){
			var self = this;

			if(self.dataPartnerConfigObj){
				_.each(resp, function(elem){			
					elem["id"] = elem[self.dataPartnerConfigObj["idAttribute"]];
					elem["text"] = elem[self.dataPartnerConfigObj["nameAttribute"]];				

					if(elem["key"] && elem["key"].length) {
                        elem["key"] = elem["key"];
					}
				});

				this.dataPartnerConfigObj["options"] = resp;
				// this.dataPartnerContainer.find("input").select2("open");
				// this.dataPartnerContainer.find("input").select2("close");
			}

		},

		filterByAdvertiser: function(advertiserId){
			var dataPartnerModelConfig = ConfigService.getConfig("dataPartnersModel");
			if(this.isAdded){
				if(this.dataPartnerSelection){
					if(this.dataPartnerSelection["scope"] == "ALL_ADV"){						
						this.resetDataPartnerOptions( _.filter(dataPartnerModelConfig, {scope:"ALL_ADV"}) );
					}else if(!([advertiserId].length === _.intersection([advertiserId], this.dataPartnerSelection["advertiserIds"].split(",")).length)){
						this.removeCriteria();
					}else{
						this.resetDataPartnerOptions(_.filter(dataPartnerModelConfig, {advertiserIds: advertiserId}) );
					}
				}
			}else{
				if(advertiserId == null || typeof advertiserId == "undefined"){
					this.resetDataPartnerOptions( _.filter(dataPartnerModelConfig, {scope:"ALL_ADV"}) );
				}else{
					this.resetDataPartnerOptions(_.filter(dataPartnerModelConfig, {advertiserIds: advertiserId}) );
				}
			}
		},

		/**
		  * This function return true if rendered component is select box for custom values otherwise false.
		 */
		isCustomValues : function(componentObj){
			return componentObj.isServersidePagination === 'true' ;
			//return false;
		},
		
		setRequestParamsForAttributeValues: function(componentObj){
			
			if(componentObj["isDependentOnPrevious"] == "yes"){
				for(var i=0;i<this.componentsRef.length;i++){
					if(this.componentsRef[i] != null){
						
						if(this.componentsRef[i].fieldForActivitySelection == "activityId"){
							componentObj["params"]["dataAttributes"] = this.componentsRef[2].componentRef.getValue()["name"];
							componentObj["params"]["dataSourceId"] = this.componentsRef[2].componentRef.getOtherValue()["id"];
						}
						
						if(componentObj["attributeName"] == "dataSource"){
							if(this.componentsRef[i]["fieldForSelection"] == "dataPartner"){
								componentObj["params"]["queryString"] = "filterBy=status:A;&dataPartnerKey="+this.componentsRef[i].componentRef.getValue()["id"]+"&orderByColumn=name&orderBy=asc&rowsPerPage=0&pageNumber=0";
							}
						}else if(componentObj["attributeName"] == "dataAttribute"){
							if(this.componentsRef[i]["fieldForSelection"] == "dataSource"){
								componentObj["params"]["id"] = this.componentsRef[i].componentRef.getValue()["id"];
							}
						}else if(componentObj["params"]["entity"] == "customVariableValues"){
							if(this.componentsRef[i]["fieldForSelection"] == "dataSource"){
								componentObj["params"]["dataSourceId"] = this.componentsRef[i].componentRef.getValue()["id"];
							}
							if(this.componentsRef[i]["fieldForSelection"] == "dataAttribute"){
								componentObj["params"]["dataAttributes"] = this.componentsRef[i].componentRef.getValue()["name"];
							}
						}
						
					}
				}
			}
			
			if(typeof componentObj["params"]["accountId"] != "undefined"){
				componentObj["params"]["accountId"] = AccountService.getCurrentAccount().id;
			}
			
			return componentObj;
		}
		
		
	});


	return View;
});