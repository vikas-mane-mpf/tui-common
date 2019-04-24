define(["jquery", 
        "backbone", 
        "text!components/ruleView/dataPartnerRuleTpl.html",
        "services/AccountService",
        "services/ConfigService",
        "events/EventDispatcher",
        "components/segmentBuilderMultiSelect/view/multiSelectView",
        "i18next",
        "services/RemoteService", "services/FeatureToggleService"],
        function($, Backbone, ruleTpl, AccountService, ConfigService, EventDispatcher, MultiSelectOverlay, i18next, RemoteService, FeatureToggleService){
	var View = Backbone.View.extend({ 

		events: {
			"click .criteriaAddBtn:not(.readonly)": "addCriteria",
			"click .criteriaRemoveBtn:not(.readonly)": "removeCriteria",
			"click #find_audience_button": "getCriteriaSelectionForAudienceIndex"
		},

		className: "clearAll",

		initialize: function(options){
			this.options = options;
			this.$el.html(_.template(ruleTpl, {"isForAdd": (typeof this.options.data == "undefined" ? true : false),"i18next": i18next}));
			this.isBillingCodeEnabled = !FeatureToggleService.isFeatureEnabled(FeatureToggleService.BILLING_CODE_DATAPARTNER_FEATURE);
			this.componentsRef = [];
			this.cnt = 0;
			this.isAdded = false;
			this.isRemoved = false;
			this.$('#find_audience_button').hide();
			this.isValueChangedInEditMode = false;
			if(typeof this.options.data != "undefined"){
				this.$(".criteriaRemoveBtn").removeClass("hideelem");
				this.$el.find(".criteriaRemoveBtnContainer").show(); 
				this.$el.find('.criteriaAddBtnContainer').hide();
			}
			this.$("[data-id='componentContainer']").siblings(".criteriaAddBtnContainer").find(".criteriaAddBtn").hide();			 
		},

		render: function(){
		    if(this.options.readOnlyModal){
		        this.$el.find(".criteriaRemoveBtn").addClass('readonly');
                this.$el.find('.delete-subset-links').addClass('readonly');
                this.$el.find('.criteriaAddBtn').addClass('readonly');
		    }
			if(typeof this.options.data == "undefined"){
				this.renderRule();
			}else{
				this.renderRowInEditMode();
			}

			return this;			
		},

		renderRule: function(){
			this.attrReferences = ConfigService.getConfig("attributeReferences");

			var componentObjForDataPartner;

			var selectedAdvertisers = this.options.getAdvertiserListSelection();
            if(this.options.modelSubType === "FACT_MAP_MODEL"){
                componentObjForDataPartner = ConfigService.getConfig("dataPartnerModelRef").get("component")[2];
                componentObjForDataPartner["options"] = _.filter(ConfigService.getConfig("dataPartnersModel"), function(obj){
                    var scope = selectedAdvertisers.length == 0 ? "ALL_ADV" : "THESE_ADV"
                    var advertisers = selectedAdvertisers.length == 0 ? undefined : selectedAdvertisers;
                    if(scope == "ALL_ADV"){
                        return obj["scope"] == "ALL_ADV";
                    }else{
                        return obj["scope"] == "ALL_ADV" || (advertisers.length === _.intersection(advertisers, obj["advertiserIds"].split(",")).length);
                    }
                });
			}else{
			    componentObjForDataPartner = ConfigService.getConfig("dataPartnerModelRef").get("component")[0];
			    componentObjForDataPartner["options"] = [];
			}

			this.renderComponent(componentObjForDataPartner);
		},		

		renderRowInEditMode: function(){
			
			this.attrReferences = ConfigService.getConfig("attributeReferences");

			this.isAdded = true;

			var componentObjForDataPartner;

			var selectedAdvertisers;

			if(this.options["advertiser-scope"] == "THESE_ADV"){
				selectedAdvertisers = this.options["advertisers-list"].split(",");
			}else{
				selectedAdvertisers = [];
			}
            if(this.options.modelSubType === "FACT_MAP_MODEL"){
                componentObjForDataPartner = ConfigService.getConfig("dataPartnerModelRef").get("component")[2];
                componentObjForDataPartner["options"] = _.filter(ConfigService.getConfig("dataPartnersModel"), function(obj){
                    var scope = selectedAdvertisers.length == 0 ? "ALL_ADV" : "THESE_ADV"
                    var advertisers = selectedAdvertisers.length == 0 ? undefined : selectedAdvertisers;
                    if(scope == "ALL_ADV"){
                        return obj["scope"] == "ALL_ADV";
                    }else{
                        return obj["scope"] == "ALL_ADV" || (advertisers.length === _.intersection(advertisers, obj["advertiserIds"].split(",")).length);
                    }
                });
			}else{
			    componentObjForDataPartner = ConfigService.getConfig("dataPartnerModelRef").get("component")[0];
			    componentObjForDataPartner["options"] = [];
			}

			this.renderComponent(componentObjForDataPartner);

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

		renderComponent: function(componentObj, optionsData){

			var _optionsData = typeof optionsData !== "undefined" ? optionsData : undefined;
			
			if(componentObj["component"] == "dropdown"){
				this.renderDropdown(componentObj, _optionsData);				
			}else if(componentObj =="multiSelectDropdown" || componentObj["component"] =="multiSelectDropdown"){
				this.renderMultiSelectOverlay(componentObj);
			}else if(componentObj["component"] == "numberTextBox"){
				this.renderNumberTextBox(componentObj);

			}else if(componentObj["component"] == "stringTextBox"){
				this.renderStringTextBox(componentObj);				
			}else if(componentObj["component"] == "dependentdropdown"){
				this.rendercampaignIntervalSelection(componentObj);
			}else{
				var attributeNameObj = _.findWhere(ConfigService.getConfig("dataPartnerModelRef").get("component"), {"attributeName": componentObj["component"]});
				if(attributeNameObj){
					if(attributeNameObj["component"]){
						//Clear previosuly set varValueRefMapping
						attributeNameObj.varValueRefMapping = undefined;
						this.renderComponent(attributeNameObj, _optionsData);
					}
				}
			}			
		},

		renderDropdown: function(componentObj, optionsData){

			var self = this;

			if(componentObj["source"] == "options"){

				if(typeof optionsData !== "undefined"){
					componentObj["options"] = optionsData;
				}

				this.onSuccessDropdownDataFetch(componentObj);

			}else if(componentObj["source"] == "dynamic"){
				if(this.options.data && !this.isValueChangedInEditMode && componentObj["fieldForSelection"] !== "dataAttributeValues" && componentObj["fieldForSelection"] !== "dataAttribute"){
					componentObj["options"] = [this.options.data["selectedValues"][componentObj["fieldForSelection"]]];
					this.fetchDropdownData(componentObj)
					.done(function(resp){
						self.trigger("showHideLoader", false);
						componentObj["options"] = componentObj["recordsKey"] ? (componentObj["recordsKey"].split(".").length ==2 ? resp[componentObj["recordsKey"].split(".")[0]][0][componentObj["recordsKey"].split(".")[1]] : resp[componentObj["recordsKey"]]) : resp;

						componentObj["options"] = typeof componentObj["options"] == "undefined" ? [] : componentObj["options"];

						if(componentObj["recordsKey"].split(".").length == 2 && resp[componentObj["recordsKey"].split(".")[0]][0].varValueRefMapping !== undefined){
							componentObj["varValueRefMapping"] = resp[componentObj["recordsKey"].split(".")[0]][0].varValueRefMapping;
						} else if(componentObj["attributeName"] === "dataAttribute"){
							componentObj["varValueRefMapping"] = undefined;
						}
					});
					self.onSuccessDropdownDataFetch(componentObj);
				}else{
					this.trigger("showHideLoader", true);
					this.fetchDropdownData(componentObj)
					.done(function(resp){
						self.trigger("showHideLoader", false);
						componentObj["options"] = componentObj["recordsKey"] ? (componentObj["recordsKey"].split(".").length ==2 ? resp[componentObj["recordsKey"].split(".")[0]][0][componentObj["recordsKey"].split(".")[1]] : resp[componentObj["recordsKey"]]) : resp;

						componentObj["options"] = typeof componentObj["options"] == "undefined" ? [] : componentObj["options"];

						if(componentObj["recordsKey"].split(".").length == 2 && resp[componentObj["recordsKey"].split(".")[0]][0].varValueRefMapping !== undefined){
							componentObj["varValueRefMapping"] = resp[componentObj["recordsKey"].split(".")[0]][0].varValueRefMapping;
						} else if(componentObj["attributeName"] === "dataAttribute"){
							componentObj["varValueRefMapping"] = undefined;
						}

						self.onSuccessDropdownDataFetch(componentObj);
					});
				}
			}

			return this;
		},

		fetchDropdownData: function(componentObj){
			var modelingLevelRadio = 'COOKIES'; 
		    if($('.js-deviceTypeCheckboxes').length) {
				$('.js-deviceTypeCheckboxes').each(function(index, item){
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
									// componentObj["params"]["queryString"] = "filterBy=status:A;&dataPartnerKey="+this.componentsRef[i].componentRef.getValue()["id"]+"&orderByColumn=name&orderBy=asc&rowsPerPage=0&pageNumber=0";
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

					//Store varValueRefMapping object to componentObj
					if(componentObj["attributeName"] === "dataAttributeValues"){

						this.componentsRef.map(function(x){
							if(x && x.componentRef.getValue() && x.componentRef.getValue().varValueRefMapping){
								componentObj["varValueRefMapping"] = x.componentRef.getValue().varValueRefMapping; 
							}
						});

						if(typeof componentObj["varValueRefMapping"] === "undefined"){
							var attributeNameObject = _.findWhere(ConfigService.getConfig("dataPartnerModelRef").get("component"), {"attributeName": "dataAttribute"});
							if(attributeNameObject.varValueRefMapping)
								componentObj["varValueRefMapping"] = attributeNameObject.varValueRefMapping.filter(function(x){return x.varName === componentObj.prevSelectedValue});
						}
					}
				}

				if(typeof componentObj["params"]["accountId"] != "undefined"){
					componentObj["params"]["accountId"] = AccountService.getCurrentAccount().id;
				}
				reqJson = _.extend(reqJson, componentObj["params"]);
			}

			return RemoteService.ajax({
				url: componentObj["dataUrl"],
				data: JSON.stringify(reqJson),
				type: "post"
			});
		},

		checkIfBatchOrLive: function(componentObj){
			for(var i=0;i<this.componentsRef.length;i++){
				if(this.componentsRef[i] != null){
					if(this.componentsRef[i]["fieldForSelection"] == "dataSource"){
						return this.componentsRef[i].componentRef.getFullValue().sourceType;
					}

				}
			}
		},

		onSuccessDropdownDataFetch: function(componentObj){
			var minWidth = 'auto', variantWidth = false;

			if(this.cnt!=0){
				this.$el.parents(".segmentSection").find(".criteriaRemoveBtnContainer").last().show();
			}

			var self = this,
			container = $("<div class='field width grid js-columns' data-type='componentParentDiv' style='margin: 0 .5em 1em 0; clear: none; float: left;'></div>");

			this.$('[data-id="componentContainer"]').append(container);

			var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
			var uniqid = randLetter + Date.now();
			
			if(componentObj.attributeName === 'dataPartner') {
				container = $(container).addClass('custom-size-dp-dropdown js-mainDPMenu');
			}

			if(componentObj.attributeName === 'dataAttributeValues' && componentObj.dropDownCssClass === 'dataOptionDrpDn' && componentObj.options.length === 2) {
				minWidth = 100;
				variantWidth = true;
			}

			if(componentObj.attributeName === 'clusterGroup' && !componentObj.options.length && typeof this.options.data !== "undefined" && !_.isEmpty(this.options.data)) {
			    var _s = this.options.data;
                componentObj.options = [_s["selectedValues"][componentObj["fieldForSelection"]]];
            }

            if(componentObj.attributeName === 'clusters' && !componentObj.options.length && typeof this.options.data !== "undefined" && !_.isEmpty(this.options.data)) {
                var _s = this.options.data;
                componentObj.options = _s["selectedValues"][componentObj["fieldForSelection"]];
            }

            if(this.options.readOnlyModal){
                componentObj["isReadOnly"] = true;
            }

			var selectRef =	'<div class="ui search selection dropdown" data-id="'+uniqid+'"> <input type="hidden"/><i class="dropdown icon"></i><div class="default text">SELECT</div> <div class="menu multiSelectMenu"></div> </div>';
			container.append(selectRef);

			if(componentObj.multiple === "true") {
				container.find("[data-id='"+uniqid+"']").addClass('multiple');
			}	

			var inputFieldRef = container.find("[data-id='"+uniqid+"']");
			inputFieldRef.css('min-width', minWidth);
			/*$(document).on("click", function(e){
				inputFieldRef.select2('close');
			});*/

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
							&& this.options.data.selectedValues["dataAttribute"].type === "MAPPED"){

							//Get textbox values
							var textBoxArray = this.options.data.selectedValues.textBoxValues;

							//Get selected data attribute value
							var attrName = this.options.data.selectedValues.dataAttribute.name;

							//Get Mapped internal values
							var internalVals = this.getMappedInternalValues(attrName, textBoxArray);
							componentObj["options"] = [];
							internalVals.forEach(function(internalVal){
								componentObj["options"].push(internalVal);
							});															

						} else {
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
				}else if(componentObj["fieldForSelection"] == "clusters"){
                    var clusters = this.options.data.selectedValues.clusters;
                     componentObj["options"] = [];
                     for(var i=0; i < clusters.length; i++) {
                         componentObj["options"].push({
                                 "id" : clusters[i].id,
                                 "text": clusters[i].id,
                                 "name": clusters[i].name
                             });
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

			//Store varValueRefMapping object to componentObj
			if(componentObj["attributeName"] === "dataAttributeValues"){

				this.componentsRef.map(function(x){
					if(x && x.componentRef.getValue() && x.componentRef.getValue().varValueRefMapping){
						componentObj["varValueRefMapping"] = x.componentRef.getValue().varValueRefMapping; 
					}
				});

				if(typeof componentObj["varValueRefMapping"] === "undefined"){
					var attributeNameObject = _.findWhere(ConfigService.getConfig("dataPartnerModelRef").get("component"), {"attributeName": "dataAttribute"});
					if(attributeNameObject.varValueRefMapping)
						componentObj["varValueRefMapping"] = attributeNameObject.varValueRefMapping.filter(function(x){return x.varName === componentObj.prevSelectedValue});
				}
			}

			var isBatchOrLive = this.checkIfBatchOrLive(componentObj);
			if(isBatchOrLive == 'Batch File' && componentObj["fieldForSelection"] == "textBoxValues"){
				//NOTE: Initially width set to 340, I have changed it to 214 due to some UI fix: Vikas
				componentObj["width"] = componentObj["width"] ? componentObj["width"] : 214;
			}

			var defaultSelected = undefined;
			_.each(componentObj["options"], function(elem){
				if(elem){
					elem["id"] = elem[componentObj["idAttribute"]];
					elem["text"] = elem[componentObj["nameAttribute"]];

					if(componentObj["attributeName"] === "dataAttribute"){
						elem["value"] = elem["name"];
						elem["displayName"] = elem["displayName"] + " (" + elem["name"] + ")";
					}
					if(elem["default"] !== undefined && elem["default"])
						defaultSelected = elem;
				}
			}.bind(this));

			var _nextComponentObj = {
					"component": "numberTextBox",
					"isSearcheable": "false",
					"fieldForSelection": "textBoxValue",
					"isLastNode": "true"
			};
			if(this.options.data && componentObj["attributeName"] == "dataCondition"){
				if(typeof this.options.data.selectedValues.dataOptions != "undefined" && this.options.data.selectedValues.dataOptions == "attribute"){
					for(var j=0;j<componentObj["options"].length;j++){

						if(componentObj["options"][j]["value"] == "<"){
							componentObj["options"][j]["next"] = _nextComponentObj;
						}else if(componentObj["options"]["value"] == ">"){
							componentObj["options"]["next"] = _nextComponentObj;
						}				

					}
				}
			}
			(function(inputFieldRef, componentObj, self){
				//self.isCustomValues(componentObj)
				if( self.isCustomValues(componentObj) ){
					$(inputFieldRef).data('componentOptions',  componentObj.options).dropdown({
						fullTextSearch : "exact",
						match: "text",
						saveRemoteData : false,
						forceSelection : false,
						apiSettings: {
							url : componentObj.dataUrl,
							method : 'POST',
							throttle : 300,
							cache : false,
							contentType: 'application/json; charset=utf-8',
							beforeSend: function (settings) {
								var value = $(this).find('.search').val();
								//custom variables
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
								$(inputFieldRef).attr('style', 'width: '+ 205/12 + 'em !important');
							}
						},

						onChange: function (value, text, $choice) {
							$(inputFieldRef).find('.multiSelectMenu').css('display', 'none');
						}

					});	

					$(inputFieldRef).find('.search').on('keypress', function () {
						$(inputFieldRef).find('.multiSelectMenu').css('display', 'block');
						if ($(inputFieldRef).outerWidth() >= '200') {
		    				$(inputFieldRef).attr('style', 'min-width: '+ 205/12 + 'em !important');
		    				$(inputFieldRef).css('width', 'auto');
	    				}
					});

					$(inputFieldRef).find('.menu').html('<div></div>')
					
		    		$(inputFieldRef).attr('style', 'width: '+ (componentObj["width"] ? componentObj["width"] : 75)/12 + 'em !important');

		    		if(componentObj.dropDownCssClass === 'multiSelectDataPartnerDrpDn' && componentObj.multiple === 'true' && componentObj.width === '214') {
	    				$(inputFieldRef).attr('style', 'width: '+ (componentObj["width"] ? componentObj["width"] : 75)/12 + 'em');
	    				$(inputFieldRef).addClass('dp-multiselect-dropdown');
		    		}

					if(componentObj.multiple === "true"){
			    		$(inputFieldRef).addClass('fluid');
			    		$(inputFieldRef).find('input.search').on('change', function (event) {
			    			if ($(inputFieldRef).outerWidth() >= '200') {
			    				$(inputFieldRef).attr('style', 'min-width: '+ 205/12 + 'em !important');
			    				$(inputFieldRef).css('width', 'auto');
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
					
					$(inputFieldRef).attr('style', 'width: '+(componentObj["width"] ? componentObj["width"] : 75)/12 + 'em !important');
					
					if (variantWidth) {
						$(inputFieldRef).css({'min-width': 100, 'width': 100});
					}

					if(componentObj.dropDownCssClass === 'multiSelectDataPartnerDrpDn' && componentObj.multiple === 'true' && componentObj.width === '214') {
	    				$(inputFieldRef).attr('style', 'width: '+(componentObj["width"] ? componentObj["width"] : 75)/12 + 'em');
	    				$(inputFieldRef).addClass('dp-multiselect-dropdown');
		    		}

					$(inputFieldRef).find('input.search').css('min-width', '2.2em');
					$.each( self.sortResponseInOption(componentObj.options) , function(index, item){
						if(self.isBillingCodeEnabled && self.options.selectedDPs && self.options.selectedDPs.length > 0) {
							if(componentObj.attributeName === 'dataPartner' && _.contains(self.options.selectedDPs,item.id)) {
								$(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'">' + item.name + '</div>');
							}else if(componentObj.attributeName !== 'dataPartner') {
								if(item.displayName && item.displayName.length > 0 ){
									$(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'" data-name="'+item.name+'">' + item.displayName + '</div>');
								}else{
									$(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'">' + item.name + '</div>');
								}
							}else {
                                $(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'">' + item.name + '</div>');
                            }
						}else {
							if(item.displayName && item.displayName.length > 0 ){
								$(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'" data-name="'+item.name+'">' + item.displayName + '</div>');
							}else{
								$(inputFieldRef).find('.menu').append('<div class="item" data-value="'+item.id+'">' + item.name + '</div>');
							}
						}
					});
					
					$(inputFieldRef).data('componentOptions',  componentObj.options).dropdown({
						fullTextSearch : "exact",
						match: "text",
						forceSelection : false,
						onShow: function() {
							var itemLen = $(inputFieldRef).find('.menu .item').map(function(index, item){
								return $(item).text().length;
							});

							var maxLen = _.max(itemLen);
							if(maxLen > 36){
								$(inputFieldRef).find('.menu').css('min-width', (maxLen+136)+'%');
							}else if(maxLen > 26 && maxLen <= 36) {
								$(inputFieldRef).find('.menu').css('min-width', (maxLen+100)+'%');
							}else {
								$(inputFieldRef).find('.menu').css('min-width', '100%');
							}

						}.bind(self)
					});
					if(componentObj.placeholder){
						$(inputFieldRef).find('.default.text').text(componentObj.placeholder.toLowerCase());
					}
				}
				
				var flag = true;
				if(self.options.data){
					var _flag = false;
					if(componentObj["attributeName"]){
						if(componentObj["attributeName"] == "dataPartner"){
							_flag = true;
						}
					}
	
					if(!_flag && componentObj["source"] == "dynamic"){
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
	
								resp = componentObj["recordsKey"].split(".").length == 2 ? resp[componentObj["recordsKey"].split(".")[0]][0][componentObj["recordsKey"].split(".")[1]] : resp[componentObj["recordsKey"]];
								_.each(resp, function(elem){
									elem["id"] = elem[componentObj["idAttribute"]];
									elem["text"] = elem[componentObj["nameAttribute"]];						
								});
	
								componentObj["options"] = resp;
								self["isDataFetchedFor"+componentObj["attributeName"]] = true;
								if(flag){
									flag = false;
									//TODO
									inputFieldRef.dropdown("close");	
									inputFieldRef.dropdown("open");							
								}
								if(typeof componentObj["dropDownCssClass"] != "undefined"){
									$("."+componentObj["dropDownCssClass"]).removeClass("dropdownLoader");
								}
							});				
						});
					}
				}
				
				if(componentObj["attributeName"] && componentObj["attributeName"] == "dataPartner"){
					inputFieldRef.on("change", function(e){
						self.trigger("dataPartnerSelected");
					});	
					self.dataPartnerConfigObj = componentObj;	
					self.dataPartnerContainer = container;
				}
				
			})(inputFieldRef, $.extend(true, {}, componentObj), self);			

			if(componentObj["isReadOnly"]){
			    var _sel = ((this.options.data || {}).selectedValues || {});
				if(typeof this.options.data != "undefined" && _sel.dataSource && !this.isValueChangedInEditMode){

					var attributePresent = this.options.data.selectedValues.dataSource.attributePresent;

					if(typeof attributePresent != "undefined" && attributePresent === true){

					}else{
						inputFieldRef.dropdown("readonly").addClass('disabled');
					}
				}else{
					inputFieldRef.dropdown("readonly").addClass('disabled');
				}
			}

			var obj = {
					getValue: function(){

						//var _data = container.find(".dropdown").dropdown('get value');
						var _data = container.find(".dropdown").data("selectOptionData");
						var attributeKey = (container && container.find(".dropdown").data("selectOptionData") && container.find(".dropdown").data("selectOptionData").key) ? container.find(".dropdown").data("selectOptionData") : '';
						var id = container.find(".dropdown").dropdown('get value')[0];
						var text = container.find(".dropdown").dropdown('get text')[0];
						var selectedItem = container.find(".dropdown").dropdown('get item')[0];
						var name;

						if(_data && _data.displayName){
							name = selectedItem && selectedItem.data("name") || _data["name"];
						}
						if(!_.isArray(_data) && id && text){
							_data = {};
							_data["id"] = id;
							_data["text"] = text;
							if(name){
								_data["name"] = name;
								_data["text"] = name;
							}
							if(attributeKey.key && attributeKey.key.length) {
								_data["key"] = _data.key;
							}
							
						}
	
						var _tempObj = undefined;
	
						if(_data != null){
	
							if(_.isArray(_data)){
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
					},
					getFullValue: function(){

						var _data = inputFieldRef.data("selectOptionData");

						return _data == null ? undefined : _data;
					}
			};

			this.cnt++;

			this.componentsRef[this.cnt] = {
					"componentRef": obj,
					"fieldForSelection": componentObj["fieldForSelection"],
					"componentType": "select2Dropdown",
					"thisRef": inputFieldRef
			};			

			container.attr("data-component-cnt", self.cnt);


			if(typeof this.options.data != "undefined" && this.isValueChangedInEditMode == false){
				if(componentObj["options"] != undefined && Object.keys(componentObj["options"]).length == 1){
					if(typeof componentObj["options"][0] != "undefined" && componentObj["options"][0][componentObj["idAttribute"]] != undefined){
						if(componentObj["fieldForSelection"] == "textBoxValues"){
							var selectedVals = this.options.data;
							var _selectionObj = selectedVals["selectedValues"][componentObj["fieldForSelection"]];
							inputFieldRef.dropdown('set selected', _selectionObj);
							inputFieldRef.trigger('change', _selectionObj);
						}else if(componentObj["attributeName"] == "clusters"){
                             var _dpObjlist = this.options.data.selectedValues.clusters;

                             _dpObjlist.forEach(function(_dpObj){
                                 setTimeout(function(){
                                     inputFieldRef.dropdown('set selected', typeof _dpObj == "undefined" ? "" : _dpObj.id);
                                     inputFieldRef.trigger('change',  typeof _dpObj == "undefined" ? "" : _dpObj.id);
                                 }, 500);
                             }.bind(this));
                        }else{
						    inputFieldRef.dropdown('set selected', componentObj["options"][0][componentObj["idAttribute"]]);
						    inputFieldRef.data('selectOptionData',  componentObj["options"][0]);
						    inputFieldRef.trigger('change', componentObj["options"][0][componentObj["idAttribute"]]);
					    }
					}
					if(typeof componentObj["options"][0] != "undefined" && componentObj["options"][0]["next"] != undefined){

						if(componentObj["options"][0]["next"]["component"] == "dataCondition"){
							this.renderComponent(this.filterConditions(componentObj["options"][0]["next"]));
						}else{
							this.renderComponent(componentObj["options"][0]["next"]);
						}
					}
				}else if(typeof componentObj["attributeName"] != "undefined" && componentObj["attributeName"] == "dataPartner"){
					var _dpObj = this.options.data.selectedValues.dataPartner;
					inputFieldRef.dropdown('set selected', typeof _dpObj == "undefined" ? "" : _dpObj.id);
					inputFieldRef.trigger('change',  typeof _dpObj == "undefined" ? "" : _dpObj.id);
				}else if(componentObj["attributeName"] == "clusters"){
				    var _dpObjlist = this.options.data.selectedValues.clusters;
				    _dpObjlist.forEach(function(_dpObj){
				        setTimeout(function(){
                            inputFieldRef.dropdown('set selected', typeof _dpObj == "undefined" ? "" : _dpObj.id);
                            inputFieldRef.trigger('change',  typeof _dpObj == "undefined" ? "" : _dpObj.id);
                        }, 500);
				    }.bind(this));
				}
			}


			if(typeof this.options.data == "undefined" || self.goThroughDefaultSelection === true){

				if(self.goThroughDefaultSelection === true){
					self.goThroughDefaultSelection = false;
				}

				if(defaultSelected!=undefined && componentObj["attributeName"] !== "dataAttributeValues"){
					inputFieldRef.dropdown('set selected', defaultSelected[componentObj["idAttribute"]]);
					inputFieldRef.data('selectOptionData',  defaultSelected)
					inputFieldRef.trigger('change', defaultSelected[componentObj["idAttribute"]]);
					if(defaultSelected.next != undefined){

						if(componentObj["attributeName"] == "dataOptions"){
							this.renderComponent(this.filterConditions(defaultSelected.next));
						}else if(componentObj["attributeName"] == "dataAttributeCondition"){
							this.renderComponent(defaultSelected.next);
						}else{
							this.renderComponent(defaultSelected.next);							
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

			if(componentObj["parentComponent"]){
				var selectedVals = componentObj["options"][0]['value'];
				inputFieldRef.dropdown('set selected', selectedVals);
				inputFieldRef.trigger('change', selectedVals);
			}					

			inputFieldRef.on("change", function(e, selectedId){

				if(e.target.className === "search"){
     				return true;
				}

				var componentOptions = inputFieldRef.data('componentOptions');
				
				if(selectedId){
					var selectOptionData = _.findWhere(componentOptions, {'id':  typeof componentOptions[0].id === 'string' ? selectedId.toString(): selectedId });
				}else{
					var selectOptionData = _.findWhere(componentOptions, {'id':  componentOptions && typeof componentOptions[0].id === 'string' ? $(e.target).val().toString(): parseInt( $(e.target).val() ) });
				}
				
				if(!selectOptionData){
					var selectOptionData = _.findWhere(componentOptions, {'id': $(e.target).val()});
				}
				
				$(inputFieldRef).data('selectOptionData',  selectOptionData)
				var isMappedValues = false;
				self.trigger('dropDownSelected');
				self.trigger("change");

				if(componentObj["attributeName"] && componentObj["attributeName"] == "dataPartner"){
					self.dataPartnerSelection = selectOptionData;
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
					if(self.valuesPutInEditMode === false){
						self.isValueChangedInEditMode = true;
					}else if(self.valuesPutInEditMode === true){
						self.valuesPutInEditMode = false;
					}
				}

				if(componentObj["attributeName"] == "dataSource" && selectOptionData["sourceType"] == "Batch File"){

					var nextConponentRef;
					do{
						nextConponentRef = currentDropdownParent.next("[data-type='componentParentDiv']"),
						count = currentDropdownParent.next("[data-type='componentParentDiv']").data("component-cnt");
						if(typeof self.componentsRef[count] != "undefined" && self.componentsRef[count] != null  && typeof self.componentsRef[count].componentType != "undefined" && self.componentsRef[count].componentType == "select2Dropdown"){
							if(typeof self.componentsRef[count].thisRef != "undefined"){
								//self.componentsRef[count].thisRef.select2("destroy");
							}
						}
						self.componentsRef[count] = null;
						nextConponentRef.remove();
					}while(nextConponentRef.length > 0);

					self.renderComponent(componentObj["next"], typeof self.options.data != "undefined" ? self.options.data["selectedValues"][componentObj["next"]["component"]] : undefined);

				}else if(componentObj["attributeName"] == "dataSource" && selectOptionData["sourceType"] == "Live Tag"){
					//TODO
					var nextConponentRef;
					do{
						nextConponentRef = currentDropdownParent.next("[data-type='componentParentDiv']"),
						count = currentDropdownParent.next("[data-type='componentParentDiv']").data("component-cnt");
						if(typeof self.componentsRef[count] != "undefined" && self.componentsRef[count] != null  && typeof self.componentsRef[count].componentType != "undefined" && self.componentsRef[count].componentType == "select2Dropdown"){
							if(typeof self.componentsRef[count].thisRef != "undefined"){
								//self.componentsRef[count].thisRef.dropdown("destroy");
							}
						}
						self.componentsRef[count] = null;
						nextConponentRef.remove();
					}while(nextConponentRef.length > 0);
					var attributeNameObj = _.findWhere(ConfigService.getConfig("dataPartnerModelRef").get("component"), {"attributeName": "dataOptions"});
					if(typeof selectOptionData["customVariables"] != "undefined"){
						self.renderComponent(self.getOptionsConfig(false, attributeNameObj));
					}else if(typeof selectOptionData["customVariables"] == "undefined" && self.isValueChangedInEditMode === true){
						self.goThroughDefaultSelection = true;
						self.renderComponent(self.getOptionsConfig(true, attributeNameObj));
					}else if(typeof self.options.data != "undefined"){
						if(typeof self.options.data.selectedValues != "undefined" && typeof self.options.data.selectedValues.dataAttribute != "undefined"){
							self.renderComponent(self.getOptionsConfig(false, attributeNameObj));
						}else{

							var attributePresent = self.options.data.selectedValues.dataSource.attributePresent;

							if(typeof attributePresent != "undefined" && attributePresent === true){
								self.goThroughDefaultSelection = true;
								var _config = self.getOptionsConfig(false, attributeNameObj);
								var optionOne = _.findWhere(_config["options"], {"id": "eventOccurrance"});
								optionOne["default"] = "true";
								self.renderComponent(_config);
							}else{
								self.renderComponent(self.getOptionsConfig(true, attributeNameObj));
							}	

						}
					}else{
						self.renderComponent(self.getOptionsConfig(true, attributeNameObj));
					}

				}else if( (componentObj["attributeName"] == "dataAttribute" && isMappedValues)  
					||  ( componentObj["attributeName"] == "dataAttribute" && selectOptionData && typeof selectOptionData.type !== "undefined" && selectOptionData.type != "") ){

					//clear old dropdowns
					var nextConponentRef;
					do{
						nextConponentRef = currentDropdownParent.next("[data-type='componentParentDiv']"),
						count = currentDropdownParent.next("[data-type='componentParentDiv']").data("component-cnt");
						if(typeof self.componentsRef[count] != "undefined" && self.componentsRef[count] != null  && typeof self.componentsRef[count].componentType != "undefined" && self.componentsRef[count].componentType == "select2Dropdown"){
							if(typeof self.componentsRef[count].thisRef != "undefined"){
								//self.componentsRef[count].thisRef.select2("destroy");
							}
						}
						self.componentsRef[count] = null;
						nextConponentRef.remove();
					}while(nextConponentRef.length > 0);


					var attributeNameObject = _.findWhere(ConfigService.getConfig("dataPartnerModelRef").get("component"), {"attributeName": "dataAttributeValues"});
					self.renderComponent(self.getOptionsConfig(false, attributeNameObject));

				}else if(componentObj["attributeName"] == "dataAttributeValues" && selectOptionData && selectOptionData["id"] === "MAPPED" && componentObj["prevSelectedValue"]){

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
						if(typeof self.componentsRef[count] != "undefined" && self.componentsRef[count] != null  && typeof self.componentsRef[count].componentType != "undefined" && self.componentsRef[count].componentType == "select2Dropdown"){
							if(typeof self.componentsRef[count].thisRef != "undefined"){
								//self.componentsRef[count].thisRef.select2("destroy");								
							}
						}
						self.componentsRef[count] = null;
						nextConponentRef.remove();
					}while(nextConponentRef.length > 0);

					var attributeNameObject = _.findWhere(ConfigService.getConfig("dataPartnerModelRef").get("component"), {"attributeName": "dataAttributeCondition"});
					

					var internalVals = self.getAllMappedValues(previousSelectBoxValue);

					internalVals.then(function(internalValues){		
						attributeNameObject.options[0].next.options = [];			
						internalValues.forEach(function(internalVal){							
							attributeNameObject.options[0].next.options.push(internalVal);
						});	

						self.renderComponent(self.getOptionsConfig(false, attributeNameObject));	

					});
					
				}else if(selectOptionData != null && selectOptionData["next"]){
					var nextConponentRef;
					do{
						nextConponentRef = currentDropdownParent.next("[data-type='componentParentDiv']"),
						count = currentDropdownParent.next("[data-type='componentParentDiv']").data("component-cnt");
						if(typeof self.componentsRef[count] != "undefined" && self.componentsRef[count] != null  && typeof self.componentsRef[count].componentType != "undefined" && self.componentsRef[count].componentType == "select2Dropdown"){
							if(typeof self.componentsRef[count].thisRef != "undefined"){
								//self.componentsRef[count].thisRef.select2("destroy");
							}
						}
						self.componentsRef[count] = null;
						nextConponentRef.remove();
					}while(nextConponentRef.length > 0);

					if(selectOptionData["next"] =="multiSelectDropdown" || selectOptionData["next"]["component"] =="multiSelectDropdown"){
						self.renderMultiSelectOverlay(selectOptionData["next"]);
					}else{

						if(selectOptionData["next"]["component"] == "dataCondition"){
							self.renderComponent(self.filterConditions(selectOptionData["next"]));
						}else{
							self.renderComponent(selectOptionData["next"]);
						}

					}
				}else if(componentObj["next"]){

					var nextConponentRef;
					do{
						nextConponentRef = currentDropdownParent.next("[data-type='componentParentDiv']"),
						count = currentDropdownParent.next("[data-type='componentParentDiv']").data("component-cnt");
						if(typeof self.componentsRef[count] != "undefined" && self.componentsRef[count] != null  && typeof self.componentsRef[count].componentType != "undefined" && self.componentsRef[count].componentType == "select2Dropdown"){
							if(typeof self.componentsRef[count].thisRef != "undefined"){
								//self.componentsRef[count].thisRef.select2("destroy");
							}
						}
						self.componentsRef[count] = null;
						nextConponentRef.remove();
					}while(nextConponentRef.length > 0);

					if(typeof self.options.data != "undefined" && componentObj["attributeName"] == "dataSource"){
						var attributeNameObj = _.findWhere(ConfigService.getConfig("dataPartnerModelRef").get("component"), {"attributeName": "dataOptions"});

						if(self.options.data.selectedValues.dataOptions.id == "eventOccurrance" && typeof self.options.data.selectedValues.dataAttribute == "undefined"){
							self.renderComponent(self.getOptionsConfig(true, attributeNameObj));
						}else{
							if(componentObj["next"]){
								self.renderComponent(componentObj["next"]);
							}else{
								self.renderComponent(self.getOptionsConfig(false, attributeNameObj));
							}
						}						

					}else if(componentObj["next"]["component"] == "dataCondition"){
						self.renderComponent(self.filterConditions(componentObj["next"]));
					}else{
						self.renderComponent(componentObj["next"], typeof self.options.data != "undefined" ? self.options.data["selectedValues"][componentObj["next"]["component"]] : undefined);
					}

				}else{
					$(e.target).parents("[data-type='componentParentDiv']").next("[data-type='componentParentDiv']").remove();
					self.componentsRef[count] = null;
					if(self.componentsRef[0]!=undefined && self.componentsRef[0].componentRef!=undefined 
							&& self.componentsRef[0].componentRef.getValue()=='activityLastOccurrence'
								&& selectOptionData['name']=='Is at any time'){
						self.$('#find_audience_button').show();
					}
					else{						
						self.$el.find("button[data-id='addCriteria']").show();
						if(!self.isAdded){
							self.trigger("addNewSetConditions");
							EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
						}
					}
				}

				if(typeof self.options.data != "undefined"){
					if(selectOptionData!=undefined && selectOptionData["isLastNode"] == "true"){
						self.isValueChangedInEditMode = true;
					}
				}

			});

			if((typeof this.options.data != "undefined" && !_.isEmpty(this.options.data)) && this.isValueChangedInEditMode == false){
				var selectedVals = this.options.data;
				var _selectionObj = selectedVals["selectedValues"][componentObj["fieldForSelection"]];
				var dropdownValues  = inputFieldRef.dropdown('get value');

				if(!_.isArray(_selectionObj)){
				    _selectionObj = typeof _selectionObj == "object" ? isNaN(_selectionObj["id"]) ? _selectionObj["id"] : parseInt(_selectionObj["id"]) : _selectionObj;
				}
				if(componentObj["fieldForSelection"] == "dataOptions"){
					if(selectedVals["selectedValues"]["dataSource"]["sourceType"] == "Live Tag" && typeof selectedVals["selectedValues"]["dataAttribute"] != "undefined"){
						inputFieldRef.dropdown('set selected', componentObj["options"][0]["id"]);	
						if(dropdownValues !== ""){
							inputFieldRef.trigger('change', componentObj["options"][0]["id"]);	
						}						
					}else if(selectedVals["selectedValues"]["dataSource"]["sourceType"] == "Live Tag" && typeof selectedVals["selectedValues"]["dataAttribute"] == "undefined"){
						inputFieldRef.dropdown('set selected', componentObj["options"][0]["id"]);
						if(dropdownValues !== ""){	
							inputFieldRef.trigger('change', componentObj["options"][0]["id"]);
						}
					}else if(selectedVals["selectedValues"]["dataSource"]["sourceType"] == "Batch File" && typeof selectedVals["selectedValues"]["dataAttribute"] == "undefined"){
						inputFieldRef.dropdown('set selected', componentObj["options"][0]["id"]);
						if(dropdownValues !== ""){
							inputFieldRef.trigger('change', componentObj["options"][0]["id"]);
						}
					} 
				} else if (componentObj["fieldForSelection"] === "dataAttributeValues" && typeof selectedVals["selectedValues"]["dataAttribute"].type !== "undefined" && selectedVals["selectedValues"]["dataAttribute"].type !== ""){ 
					inputFieldRef.dropdown('set selected', selectedVals["selectedValues"]["dataAttribute"].type);
					if(dropdownValues !== ""){
						inputFieldRef.trigger('change', selectedVals["selectedValues"]["dataAttribute"].type);
					}
					this.valuesPutInEditMode = true;
				} else if (componentObj["fieldForSelection"] == "textBoxValues"
							&& typeof this.options.data.selectedValues["dataAttribute"] !== "undefined"
							&& typeof this.options.data.selectedValues["dataAttribute"].type !== "undefined"
							&& this.options.data.selectedValues["dataAttribute"].type === "MAPPED" ){

					// //Get textbox values
					var textBoxArray = _selectionObj;
					
					//Get selected data attribute value
					var attrName = this.options.data.selectedValues.dataAttribute.name;

					var self = this;
					//Get Mapped internal values
					var internalVals = this.getMappedInternalValues(attrName, textBoxArray);
					var selectedValues = internalVals.map(function(x){return x.id.toString()});

					//Set selected values
					inputFieldRef.dropdown('set selected', selectedValues);	
					if(dropdownValues !== ""){
						inputFieldRef.trigger('change', selectedValues);
					}
					self.valuesPutInEditMode = true;							

				}else{
					inputFieldRef.dropdown('set selected', _selectionObj);	
					if(dropdownValues !== ""){
						inputFieldRef.trigger('change', _selectionObj);	
					}
					
					this.valuesPutInEditMode = true;
				}

				if(typeof this.options.data != "undefined"){
					if(componentObj["isLastNode"] == "true"){
						this.isValueChangedInEditMode = true;
					}
				}
			}

		},

        // Sorting for option values as per ticket 464
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

		renderMultiSelectOverlay: function(configurationOpt){

			var opt={},
			self=this;

			if(typeof this.options.data != "undefined"){
				opt.isEdit = true;
				opt.selectedElementArray = this.options.data[configurationOpt["fieldForSelection"]];
			}				

			opt.componentName = " FROM LIST";
			opt.url=configurationOpt['dataUrl'];
			opt.formatData = false;
			opt.objectType = configurationOpt['objectType']; 
			opt.accountId=AccountService.getCurrentAccount().id;
			opt.isServerSidePagination=true;
			opt.rowsPerPage=1000;
			var instance = new MultiSelectOverlay(opt);

			var container = $("<div data-type='componentParentDiv' style='float: left;' class='valueSelector'></div>");

			container.append(instance.$el);

			this.$('[data-id="componentContainer"]').append(container);

			this.listenTo(instance, "valueSelectedFromMultiSelect", function(){
				self.$el.find("button[data-id='addCriteria']").show();
			});

			instance.render();


			var obj = {
					getValue: function(){
						return instance.getSelection();
					}
			};

			this.cnt++;
			this.componentsRef[this.cnt] = {
					"componentRef": obj,
					"fieldForSelection": configurationOpt["fieldForSelection"]
			};

			container.attr("data-component-cnt", self.cnt);		

		},

		addCriteria: function(){
			var obj = {};
			
			for(var i=0;i<this.componentsRef.length;i++){
				if(this.componentsRef[i] != null){
			
					var valueObj = this.componentsRef[i]["componentRef"].getValue();
					if(typeof valueObj["id"] != "undefined"){
						obj[this.componentsRef[i]["fieldForSelection"]] = this.componentsRef[i]["componentRef"].getValue();
					}
				}
			}

			this.$(".outerDivOverlay .drpDwnBtn").css("background-color","#f6f6f6");

			// this.$("[data-id='addCriteria']").removeClass("criteriaAddBtn").addClass("criteriaRemoveBtn")
			// .html("X");
			this.$el.find(".criteriaRemoveBtnContainer").show(); 
		    this.$el.find('.criteriaAddBtnContainer').hide();

			this.isAdded = true;

			this.trigger("addedCriteria");			

		},

		getCriteriaSelection: function(){
			
			var obj = {};

			obj["selectedValues"] = {};
			obj["attributeName"] = "dataPartner";

			var entityRef = undefined;
			
			for(var i=0;i<this.componentsRef.length;i++){
				if(this.componentsRef[i] != null){

					if(this.componentsRef[i]["fieldForSelection"] == "attributeName"){

						obj[this.componentsRef[i]["fieldForSelection"]] = this.componentsRef[i]["componentRef"].getValue();
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
					}else{
						if(this.componentsRef[i]["fieldForSelection"] == 'condition'){
							var _conVal = this.componentsRef[i]["componentRef"].getValue();
							obj["selectedValues"][this.componentsRef[i]["fieldForSelection"]] = typeof _conVal == "undefined" ? "" : this.componentsRef[i]["componentRef"].getValue().id;
						}else{
							var _valueObj = this.componentsRef[i]["componentRef"].getValue();
							if(_valueObj!=undefined && _valueObj.id!=undefined && (this.componentsRef[i]["fieldForSelection"] == 'textBoxValue' || this.componentsRef[i]["fieldForSelection"] === 'textBoxValues') && !_.isArray(_valueObj)){
								obj["selectedValues"][this.componentsRef[i]["fieldForSelection"]] = (typeof _valueObj == "undefined" || _valueObj == null) ? "" : (_valueObj.id.split(",").length > 0 ? _valueObj.id.split(",") : [_valueObj.id]);
							}else{
								obj["selectedValues"][this.componentsRef[i]["fieldForSelection"]] = (typeof _valueObj == "undefined" || _valueObj == null) ? "" : _valueObj;
							} 
						}
						if(this.componentsRef[i]["fieldForActivitySelection"] != undefined){
							obj["selectedValues"][this.componentsRef[i]["fieldForActivitySelection"]] = this.componentsRef[i]["componentRef"].getOtherValue();
						}
					}
				}
			}

			return obj;
		},

		removeCriteria: function(){
			var self=this;
			
			if(!this.isMaximumCriteriaCreated){

				var parentDiv = undefined;
				var conditions = this.$el.parent().find("[data-id='componentContainer']");
				// this.$el.remove();
				// this.isRemoved=true;
				if(conditions.length === 1){
					this.$el.parent().find('div').last().hide();
					this.trigger('addedCriteria');
					this.$el.next().remove();	
				}	

				parentDiv = this.$el.parent();
				parentDiv.find('.js-condition-divider:last').remove();
				this.$el.remove();				
				
				if(parentDiv && parentDiv !== null && conditions.length !== 1 && conditions.last().children().length > 2){
					$(parentDiv).find('div').last().show().find(".criteriaAddBtn").css("display", "inline-block");;
				}
					
				this.isRemoved=true;
			}else{
				self.$('[data-id="componentContainer"]').html('<div data-id="attributeSelection" class="modal_segment" style="float: left;" data-type="componentParentDiv"></div>');
				self.$el.find("button[data-id='addCriteria']").hide();
				self.cnt = 0;
				self.componentsRef = [];
				// this.$("[data-id='addCriteria']").removeClass("criteriaRemoveBtn").addClass("criteriaAddBtn")
				// .html("X"); 
				this.$el.find(".criteriaRemoveBtnContainer").hide(); 
				this.$el.find('.criteriaAddBtnContainer').show();
				
				self.removeFromArray=true;
				self.isAdded=false;
				this.trigger('maxLimitRowRemoved');				
				this.trigger("addedCriteria");
			}
			this.trigger("removedCriteria");
			this.trigger("change");
			EventDispatcher.trigger(EventDispatcher.DATA_LEDGER, "dataAPICreated");
		},

		renderStringTextBox: function(componentObj) {			
			var container = $("<div data-type='componentParentDiv' style='float: left; margin: 0 .5em 1em 0; clear: none;'></div>"),
			component = undefined,
			self = this;

			if(componentObj["component"] == "stringTextBox"){
				component = $("<input id='custTextVal' class='custTextVal' type='text' size='10' style='width: 60%;'>");
			}else if(componentObj["component"] == "numberTextBox"){
				component = $("<input id='custTextVal' class='custTextVal custNumericValues' type='text' size='10' style='width: 60%;'>");
			}
			container.append(component);
			if(this.options.data != undefined && this.isValueChangedInEditMode == false){
				container.find("input[class='custTextVal']").val(this.options.data.selectedValues.textBoxValue);				
			}

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
					"fieldForSelection": componentObj["fieldForSelection"]
			};

			container.attr("data-component-cnt", this.cnt);

			if(typeof this.options.data != "undefined"){
				if(componentObj["isLastNode"] == "true"){
					this.isValueChangedInEditMode = true;
				}
			}

		},

		renderNumberTextBox: function(componentObj) {			

			var container = $("<div data-type='componentParentDiv' style='margin: 0 .5em 1em 0; clear: none; float: left;'></div>"),
			component = undefined,
			self = this;
			if(componentObj["component"] == "stringTextBox"){
				component = $("<input id='custTextVal' class='custTextVal' type='text' size='10' style='width: 60%; '>");
			}else if(componentObj["component"] == "numberTextBox"){
				component = $("<input id='custTextVal' class='custTextVal custNumericValues' type='text' size='10' style='width: 60%;'>");
			}
			container.append(component);
			if(this.options.data != undefined && this.isValueChangedInEditMode == false){
				container.find("input[class='custTextVal custNumericValues']").val(this.options.data.selectedValues.textBoxValue);				
			}

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
					"fieldForSelection": componentObj["fieldForSelection"]
			};

			container.attr("data-component-cnt", this.cnt);

			if(typeof this.options.data != "undefined"){
				if(componentObj["isLastNode"] == "true"){
					this.isValueChangedInEditMode = true;
				}
			}
		},


		rendercampaignIntervalSelection: function(componentObj){

			var self = this;

			componentObj = _.findWhere(ConfigService.getConfig("dataPartnerModelRef").get("component"), {"attributeName": componentObj["component"]});

			var container = $("<div data-type='componentParentDiv' class='valueSelector' style='float: left;'></div>");

			var inputStr1 = '<div style="float: left; margin: 0 .1em 1em .5em;"><div class="ui dropdown selection" data-id="child" style="min-width: 62px;"> <input type="hidden"/><i class="dropdown icon"></i><div class="default text"></div><div class="menu"></div></div></div>',
			inputStr2 = '<div style="float: left; margin: 0 .1em 1em .5em;" class="days-ago-wrap"><div class="ui dropdown selection disabled" data-id="parent"><input type="hidden" /><i class="dropdown icon"></i><div class="default text"></div><div class="menu"></div></div></div>';

			container.append(inputStr1);
			container.append(inputStr2);

			this.$('[data-id="componentContainer"]').append(container);

			componentObj["options"][0]["id"] = componentObj["options"][0]["value"];
			componentObj["options"][0]["text"] = componentObj["options"][0]["name"]; 

			var $menuParent = container.find('[data-id="parent"]').find('.menu');
			
			$.each( componentObj.options , function(index, item){
				$menuParent.append('<div class="item" data-value="'+item.id+'">' + item.name + '</div>');
			});
			
			container.find('[data-id="parent"]').data('componentOptions',  componentObj.options).dropdown();
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

			container.find('[data-id="child"]').data('defaultOptions', defaultOptions).dropdown();
			
			this.$('[data-id="child"]').dropdown('set selected', _.findWhere(defaultOptions, {"default": "true"})["id"]);
			this.$('[data-id="child"]').trigger('change', _.findWhere(defaultOptions, {"default": "true"})["id"]);

			this.$('[data-id="parent"]').on("change", function(e){
				
				var $menuParent = self.$('[data-id="parent"]').find('.menu');
				$.each( componentObj.options , function(index, item){
					$menuParent.append('<div class="item" data-value="'+item.id+'">' + item.name + '</div>');
				});
				self.$('[data-id="child"]').data('componentOptions',  componentObj.options).dropdown();
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
				this.$('[data-id="componentContainer"]').html('<div data-id="attributeSelection" class="modal_segment" style="float: left;" data-type="componentParentDiv"></div>');
				this.$el.find("button[data-id='addCriteria']").hide();
				this.cnt = 0;
				this.componentsRef = [];
				this.renderRule();
			}
		},

		getDataPartnerSelection: function(){
			return this.componentsRef[1] ? (this.componentsRef[1]["componentRef"].getValue() ? 
					(this.componentsRef && typeof this.componentsRef[1]["componentRef"].getValue()["name"] == "function" ? undefined : this.componentsRef[1]["componentRef"].getValue()["name"])
					: undefined) : undefined;
		},

		resetDataPartnerOptions: function(resp){
			var self = this;
			_.each(resp, function(elem){
				elem["id"] = elem[self.dataPartnerConfigObj["idAttribute"]];
				elem["text"] = elem[self.dataPartnerConfigObj["nameAttribute"]];						
			});

			this.dataPartnerConfigObj["options"] = resp;
			this.dataPartnerContainer.find("input").dropdown("open");
			this.dataPartnerContainer.find("input").dropdown("close");

		},

		filterByAdvertisers: function(advertisers){

			if(this.isAdded && !this.isRemoved){
				if(this.dataPartnerSelection["scope"] == "ALL_ADV"){
					this.resetDataPartnerOptions(ConfigService.getConfig("dataPartnersModel").getOptions("ALL_ADV"));
				}else if(!(advertisers.length === _.intersection(advertisers, this.dataPartnerSelection["advertiserIds"].split(",")).length) || advertisers.length == 0){
					this.removeCriteria();
				}else{
					this.resetDataPartnerOptions(ConfigService.getConfig("dataPartnersModel").getOptions("THESE_ADV", advertisers));
				}
			}else{
				if(advertisers.length == 0){
					if(this.isFilledButNotAdded() === true){
						this.removeCriteria();
					}					
					this.resetDataPartnerOptions(ConfigService.getConfig("dataPartnersModel").getOptions("ALL_ADV"));
				}else{
					this.resetDataPartnerOptions(ConfigService.getConfig("dataPartnersModel").getOptions("THESE_ADV", advertisers));
				}
			}
		},

		getOptionsConfig: function(showOccurranceOnly, data){

			var _data = $.extend(true, {}, data);

			if(showOccurranceOnly){

				var optionOne = _.findWhere(_data["options"], {"id": "eventOccurrance"});

				optionOne["default"] = "true";
				_data["isReadOnly"] = "true";	
				_data["options"] = [optionOne];

			}

			return _data;
		},

		filterConditions: function(data){

			var selection = "";
			var obj = undefined;
			var attributeNameObj = $.extend(true, {}, _.findWhere(ConfigService.getConfig("dataPartnerModelRef").get("component"), {"attributeName": data["component"]}));
			var _nextComponentObj = {
					"component": "numberTextBox",
					"isSearcheable": "false",
					"fieldForSelection": "textBoxValue",
					"isLastNode": "true"
			};

			for(var i=0;i<this.componentsRef.length;i++){
				if(this.componentsRef[i] != null){
					if(this.componentsRef[i]["fieldForSelection"] == "dataOptions"){
						selection = this.componentsRef[i].componentRef.getValue()["id"];
					}					
					if(this.componentsRef[i] != null){
						if(this.componentsRef[i]["fieldForSelection"] == "dataSource"){
							obj = this.componentsRef[i].componentRef.getFullValue();
						}					
					}
				}
			}

			for(var k=0;k<attributeNameObj.options.length;k++){

				if(typeof obj != "undefined" && obj["sourceType"] == "Batch File"){
					if(attributeNameObj.options[k]["sourceAttributes"].indexOf("attribute") == -1){
						attributeNameObj.options.splice(k, 1);
					}else if(attributeNameObj.options[k]["value"] == "<"){
						attributeNameObj.options[k]["next"] = _nextComponentObj;
					}else if(attributeNameObj.options[k]["value"] == ">"){
						attributeNameObj.options[k]["next"] = _nextComponentObj;
					}				
				}else if(attributeNameObj.options[k]["sourceAttributes"].indexOf(selection) == -1){
					attributeNameObj.options.splice(k, 1);
				}
			}


			for(var j=0;j<attributeNameObj.options.length;j++){

				if(selection == "attribute"){				
					if(attributeNameObj.options[j]["value"] == "<"){
						attributeNameObj.options[j]["next"] = _nextComponentObj;
					}else if(attributeNameObj.options[j]["value"] == ">"){
						attributeNameObj.options[j]["next"] = _nextComponentObj;
					}				
				}				
			}

			return attributeNameObj;

		},

		isFilledButNotAdded: function(data) {
			var flag = true;

			for(var i=0;i<this.componentsRef.length; i++){
				if(this.componentsRef[i]){
					var _val = this.componentsRef[i]["componentRef"].getValue();
					if(_val == null || typeof _val == "undefined" || _val == ""){
						flag = false;
					}
				}
			}

			if(!data && flag) {
				this.$(".criteriaAddBtn").trigger("click");
			}

			return flag;
		},

		/**
		  * This function return true if rendered component is select box for custom values otherwise false.
		 */
		isCustomValues : function(componentObj){
			return componentObj.isServersidePagination === 'true' ;			
		},
		
		setRequestParamsForAttributeValues: function(componentObj){
						
			if(componentObj["isDependentOnPrevious"] == "yes"){
				for(var i=0;i<this.componentsRef.length;i++){
					if(this.componentsRef[i] != null){
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