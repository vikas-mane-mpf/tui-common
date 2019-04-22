define([
	'jquery', 
	'backbone', 
	'underscore',
	'text!components/segmentBuilderCustomVariable/tpl/parentTpl.html',
	'services/RemoteService',
	"services/RefDataService",
	"services/CacheService"],

function($, Backbone, _,parentTpl,RemoteService, RefDataService, CacheService){
	
	var view = Backbone.View.extend({
		events: {
			"click ul.data_list li": "handleClick",
			"click .selectedSegment span.unselectVariable": "unSelect"			
		},
		initialize:function(opt){			
			this.opt=opt;
			this.configuration = opt.configuration;
			this.scopedropDownOptions = opt.scopedropDownOptions;
			this.advAccName=opt.advAccName;
			this.nameOfVariable = opt.nameOfVariable;
			this.associatedActivity = opt.associatedActivity;
			this.sortDropDownOptions=opt.sortDropDownOptions;
			this.tabValues=opt.tabValues;
			this.pageNumber=1;
			this.tpl = _.template(parentTpl);
			this.$el.html(this.tpl());			
			this.selectedValue;
			this.entity = opt.entity;
			this.accountId = opt.accountId;
			this.advertiserId = opt.advertiserId;
			this.operation = opt.operation;
			this.isEdit = opt.isEdit;
			this.isAdvertiserSelected = opt.isAdvertiserSelected;	
			this.populatedValues = opt.selectedData;
			this.isServerSidePagination = opt.isServerSidePagination;
			this.rowsPerPage = opt.rowsPerPage;
			this.advDropdownId = opt.advDropdownId;
			this.advDropdownText = opt.advDropdownText;
			this.renderComponentThroughConfiguration(this.opt);			
			this.entityId;
			this.entityName;
			this.activityKey;
			this.activityName;
			this.orderBy;
			this.orderByColumn;
			this.typedText;
			this.selectedScope;
			this.selectedTab;
			this.serverResponse;
			
			this.selectedDropDownValue;
			this.searchCustomVariableName;
			this.searchActivityName;
			this.advertiserKey;
			this.totalRecords;
			this.alreadySelected;
			this.alreadySelectedActivity;
			var self=this;
			
			if(this.isServerSidePagination){
				self.registerScrolling();
			}
			
				$(document).on("click", function(e){
				
					if($(e.target).hasClass("segContainer") || $(e.target).parents(".segContainer").length > 0){
					
				}else{
					self.$('.innerContainer').slideUp("slow");
				}
				
				// console.log($(e.target).hasClass("segContainer"));
				// console.log($(e.target).parents(".segContainer").length > 0);
			});
			
			
		},
		render:function(){
			
			if(this.isEdit){
				this.showPopulatedValuesInEdit();
			}
			return this;
		},				
        // To do Sorting as per Ticket 464
	    sortResponseInList:function(activityCustom) {
            return _.sortBy(activityCustom ,function(jsonObj) {
                return jsonObj.variableName.toLowerCase();
            });
         },

		 //This function append response in the list.

		appendResponseInList:function(data, rowNum, columnNum, isAppend){

			var $dropdown = this.$el.find('.js-custom-variable');
			if(data.activityCustom == '') {	
				$dropdown.find('.text').text('No Records Found');
			} else {
				$menu = $dropdown.find('.menu');
				$.each( this.sortResponseInList(data.activityCustom) , function(index, jsonObj) {
					if(jsonObj.id){
						$menu.append('<div class="item" data-activityKey="'+jsonObj.activityKey+'" data-activityName="'+jsonObj.activityName+'" data-value="'+jsonObj.id+'" data-variable="'+jsonObj.variableName+'">' + jsonObj.variableName+"("+jsonObj.activityName+")" + '</div>')
					} else {
						$dropdown.find('.text').text('No Records Found');							
					}
					
				});
				
				$dropdown.dropdown({
				    fullTextSearch : "exact",
				    match: "text",
				    forceSelection: false,
					onChange : function(value, text, $choice){
						this.handleClick(value, text, $choice);
					}.bind(this),

					onShow: function() {
				    	var itemLen = $dropdown.find('.menu .item').map(function(index, item){
							return $(item).text().length;
						});

				    	var maxLen = _.max(itemLen);
						if(maxLen > 36){
							$dropdown.find('.menu').css('min-width', (maxLen+140)+'%');
						}else if(maxLen > 20 && maxLen <= 36) {
							$dropdown.find('.menu').css('min-width', (maxLen+120)+'%');
						}else {
							$dropdown.find('.menu').css('min-width', '100%');
						}
				    }
				});

				if(this.activityKey){
					//Get id from menu item
					//var id = $menu.first().find('.item').attr('data-activitykey', this.activityKey).data('value');
					var id = $menu.last().find(".item[data-activitykey='" + this.activityKey+ "'][data-variable='" + this.entityId+ "']").data('value');
					
					$dropdown.dropdown('set selected', id);
				}

			}
		},
				
		/*
		 * This function register scrolling
		 */
		registerScrolling:function(){
			// scroll event of div
			var self = this;
			this.$el.find('.scrollableArea').scroll(function(){
				// get the max and current scroll
				var maxScroll = $(this)[0].scrollTop;
				var currScroll = $(this)[0].scrollHeight - $(this).height();
				//alert(maxScroll);
				//alert(currScroll);
				// are we at the bottom
				//console.log(maxScroll);
				//console.log(currScroll);
				if(currScroll==maxScroll){
					console.log("inside")
					$(this)[0].scrollTop = $(this)[0].scrollHeight - $(this).height();
					self.pageNumber++;
					self.refreshList(self.pageNumber,true);
				}
				//scroll to the bottom of the div
				//load again
			
			});
		},
						
		renderComponentThroughConfiguration:function(opt){
			var self = this;
			var componentJsonConfiguration = opt.configuration;
			var rows = componentJsonConfiguration["rows"];			
			console.log(rows);
			$.each(rows,function(rowNum,row){				
				console.log(rowNum+" : "+row);
				
				var rowContext={};
				if(rowNum==0){
					self.$el.find('#outerDiv').append("<div class='row' id ="+"row_"+rowNum+">");
				}else if(rowNum==1){
					self.$el.find('#outerDiv').append("<div id = 'innerDiv' class='segContainer innerContainer cusOuter customVariableCont' style='display:none;'></div>");
					self.$el.find('#innerDiv').append("<div class='row' id ="+"row_"+rowNum+">");
				}else{
					self.$el.find('#innerDiv').append("<div class='row' id ="+"row_"+rowNum+">");
				}
				
				$.each(row,function(columnNum,column){
					
					if(column["key"]!=undefined && column["key"]!=null){
						if(opt[column["key"]]!=undefined && opt[column["key"]]!=null){
							var identifierClass = column["key"];
							console.log(opt[column["key"]]);
							console.log(rowNum + ", " + columnNum);
							console.log(column["type"]);
							rowContext.preColumnType = column["type"]; 
							if(column["type"]=="DropDown"){								
								console.log(column["key"]);
								var optionJSONArray = opt[column["key"]];								
								console.log(optionJSONArray);
								var selectBox =	'<div class="ui search selection dropdown js-custom-variable"> <input type="hidden"/><i class="dropdown icon"></i><div class="default text">Select Custom Variable</div> <div class="menu"></div> </div>';
								//var selectBox = "<select class='selectpicker scopeOrSort dropdown " + identifierClass + "'>";
								
								$.each(optionJSONArray,function(index,optionJSON){
									//selectBox += "<option value='"+ optionJSON.text+"'>"+optionJSON.text+"</option>"
									if(index==0){
										if(optionJSON.orderBy!=undefined && optionJSON.orderBy!=null){
											self.orderBy= optionJSON.orderBy;
											self.orderByColumn= optionJSON.orderByColumn;
										}
										if(optionJSON.scope_id!=null && optionJSON.scope_id!=undefined){
											self.selectedScope=optionJSON.scope_id;											
											console.log(self.selectedScope);
										}
									}
									var orderByClass;
									if(index==0 || index==2){
										orderByClass="asc";
									}else if(index==1 || index==3){
										orderByClass="desc";
									}
									if(optionJSON.orderBy!=null && optionJSON.orderBy!=undefined && optionJSON.orderBy!='' &&  optionJSON.orderByColumn!=null && optionJSON.orderByColumn!=undefined && optionJSON.orderByColumn!=''){
										$(selectBox).find('.menu').append('<div class="item" data-value="'+ optionJSON.orderBy+'"&&&"'+ optionJSON.orderByColumn+ '">' + optionJSON.text + '</div>')
										// selectBox += "<option  class='"+orderByClass+"' value='"+ optionJSON.orderBy+"&&&"+optionJSON.orderByColumn+"'>"+optionJSON.text+"</option>"
									}else{
										if(self.opt.getExternalScope() == "segmentAdvertiser" || self.opt.getExternalScope() == "advertiser"){	
											$(selectBox).find('.menu').append('<div class="item" data-value="'+ optionJSON.text+'">' + optionJSON.text + '</div>');								
											//selectBox += "<option value='"+optionJSON.text+"'>"+optionJSON.text+"</option>";
										}else{
											if(optionJSON.text == 'ACCOUNT'){												
												$(selectBox).find('.menu').append('<div class="item" data-value="'+ optionJSON.text+'">' + optionJSON.text + '</div>')		
												//selectBox += "<option value='"+optionJSON.text+"'>"+optionJSON.text+"</option>";
											}											
										}										
									}									
									  
								});
								
								if(self.isEdit){				
									if(self.populatedValues['scope'] == 'advertiser'){	
										self.advertiserKey = this.advDropdownId;
									}
								}
								
								console.log(selectBox);
								self.$el.find("#"+"row_"+rowNum).append(selectBox);
								self.$el.find('.ui.dropdown').dropdown({
									forceSelection: false,
									onChange : function(value, text, $choice){

									}
								});
								// setTimeout(function(){
								// 	self.$el.find('.ui.dropdown').dropdown();
								// 	self.$('.scopeOrSort').find('button.selectpicker span.filter-option').addClass("test1").removeClass('test2');
								// 	console.log(self.$el.find('.scopeOrSort'));
								// 	self.$el.find('.scopeOrSort').selectpicker('render');
								// 	self.$el.find('.scopeOrSort').on('change',$.proxy(self.updateState,self));
								// 	self.$el.find('.scopeOrSort').selectpicker('hide');
								// },50);
							}
							else if(column["type"]=="label"){
								var labelDiv = "<div class='label' style='width:50%;' id="+'row_'+rowNum+'col_'+columnNum +"/>";
								//var labelInnerDiv1 = "<div id="+'inner1_row_'+rowNum+'col_'+columnNum +"/>";
								var labelInnerDiv2 = "(<span id="+'inner2_row_'+rowNum+'col_'+columnNum+"/>)";
								self.$el.find("#"+"row_"+rowNum).append(labelDiv);
								
								//self.$el.find("#"+"row_"+rowNum+"col_"+columnNum).append(labelInnerDiv1);								
								console.log(opt[column["key"]]);
								self.$el.find("#"+"row_"+rowNum+'col_'+columnNum).text(opt[column["key"]]);
								if(rowNum == 1 && columnNum == 0){
									self.advAccName = opt[column["key"]];
								}
								var tempFunc = function(_rowNum, _columnNum){
									
									return function(){
										if(rowNum!= 2){ 
											self.$el.find('#row_'+_rowNum+'col_'+_columnNum).append(" (<span id="+'inner3_row_'+_rowNum+'col_'+_columnNum+"/>)");
											//self.$el.find("#"+"inner3_row_"+_rowNum+"col_"+_columnNum).text("0");
										} 									};
								};
								
								setTimeout(tempFunc(rowNum, columnNum), 10);
								self.$el.find("#"+"row_"+rowNum+"col_"+columnNum).text(opt[column["key"]].text);
								//self.$el.find("#"+"inner1_row_"+rowNum+"col_"+columnNum).bind("click",{value:opt[column["key"]]},self.updateState);
							}
							else if(column["type"]=="tab"){
								self.$el.find("#"+"row_"+rowNum).addClass('tabsBg');
								var tabDiv = "<div class='tabs "+identifierClass+"' id="+'row_'+rowNum+'col_'+columnNum +"/>";
								self.$el.find("#"+"row_"+rowNum).append(tabDiv);
								console.log(opt[column["key"]].text);
								var tempFunc = function(_rowNum, _columnNum){
									
									return function(){
										if(opt[column["key"]].isSelected){
											self.$el.find('#row_'+_rowNum+'col_'+_columnNum).addClass('selected');
										}
										self.$el.find('#row_'+_rowNum+'col_'+_columnNum).append(" (<span id="+'inner3_row_'+_rowNum+'col_'+_columnNum+"/>)");
										self.$el.find("#"+"inner3_row_"+_rowNum+"col_"+_columnNum).text("13");
									};
								};
								setTimeout(tempFunc(rowNum, columnNum), 10);
								self.$el.find("#"+"row_"+rowNum+"col_"+columnNum).text(opt[column["key"]].text);
								if(opt[column["key"]].isSelected){
									self.selectedTab = opt[column["key"]].id;
								}
								self.$el.find("#"+"row_"+rowNum+"col_"+columnNum).bind("click",{value:opt[column["key"]].id},$.proxy(self.updateState,self));
							}
						}
					}else{
						 if(column["type"]=="searchBox" && false){
							 var searchBoxDiv;							 
							 console.log(rowContext.preColumnType);
							 var searchBoxId;
							 searchBoxId = "row_"+rowNum+"_col_"+columnNum;							
							 if(rowContext.preColumnType != undefined && rowContext.preColumnType !=null && rowContext.preColumnType == 'DropDown'){
							 	 searchBoxDiv = "<div id='searchBoxContainer'> <div class='searchBox "+identifierClass+" ui search selection dropdown'> <input type='hidden'/><i class='dropdown icon'></i><div class='default text'>Select Custom Variable</div><div class='menu'></div></div>";
								 //searchBoxDiv =	"<div id='searchBoxContainer'><div class='searchBox small  "+identifierClass+"' style='width:100%'> <input type='text' class='searchField'  placeholder='Select Custom Variable' data-input-type='searchBox' style='background:none' /></div></div>";
							 }else{
							 	searchBoxDiv = "<div id='searchBoxContainer'> <div class='searchBox "+identifierClass+" ui search selection dropdown' id='"+searchBoxId+"'> <input type='hidden'/><i class='dropdown icon'></i><div class='default text'>Select Custom Variable</div><div class='menu'></div></div>";
								//searchBoxDiv =	"<div id='searchBoxContainer'><div class='searchBox "+identifierClass+"' style='width:50%; float:left'> <input type='text' class='searchField' placeholder='' style='margin:0;' data-input-type='searchBox' id='"+searchBoxId+"' /></div></div>";
							 }
							self.$el.find("#"+"row_"+rowNum).append(searchBoxDiv);
							setTimeout(function(){self.$('.searchField').on("focus",  $.proxy(self.toggleDiv,self))}, 100);

							setTimeout(function(){self.$('.searchField').on("focus", function(e){								
								self.toggleDiv(e);
							});}, 100);
							
							setTimeout(function(){
								var options = {
									    callback: function(value){									    	
									    	//console.log('typed text--->' + value);
									    	//alert(value);
									    	self.searchCustomVariableName = self.$el.find("#row_3_col_0" ).val();
									    	self.searchCustomVariableName = self.searchCustomVariableName.trim();
									    	//alert(self.searchCustomVariableName)
									    	//console.log("#searchCustomVariableName#");
									    	//console.log(self.searchCustomVariableName);
											self.searchActivityName = self.$el.find("#row_3_col_1" ).val();
											self.searchActivityName = self.searchActivityName.trim();
									    	self.getDataFromServer();
											//console.log("#searchActivityName#");
									    	//console.log(self.searchActivityName);
											self.totalRecords=null;
									    	self.pageNumber=1;
									    	if((self.alreadySelected != self.searchCustomVariableName) || ((self.alreadySelectedActivity != self.searchActivityName))){
									    		self.refreshList(self.pageNumber,false);
									    		self.alreadySelected = self.searchCustomVariableName;
									    		self.alreadySelectedActivity = self.searchActivityName;
									    	}									    	
									    	
									    },
									    wait: 750,
									    highlight: true,
									    captureLength: 0
									}
								self.$el.find("#row_3_col_0" ).typeWatch(options);
								self.$el.find("#row_3_col_1" ).typeWatch(options);
		
								}, 100);
							
						}else if(column["type"]=="grid"){								
							var gridView = "<div id='grid_div_row_"+rowNum+"_col_"+columnNum+"' class='scrollableArea' style='width:100%; float:left; clear:none'><div class='data_list item ui fluid search selection dropdown' id='data_list_"+rowNum+"_"+columnNum+"'><span class='text'>Select Custom Variable</span><i class='dropdown icon'></i><div class='menu'></div></div></div>";
							self.$el.find("#"+"row_"+rowNum).append(gridView);
							self.getGridDynamic(rowNum, columnNum);
							
																					
						}
					}
				})
			})
			
		},
		generateLiId : function(actualIdentifier){			
			return "id"+actualIdentifier;
		},
		getGridDynamic: function(rowNum, columnNum){	
			//this.getDataFromServer();
			this.refreshList(this.pageNumber);
			
		},
		toggleDiv : function(){
			console.log(this.$el.html());
			console.log(this.$el.find('.innerContainer'));
			this.$el.find('.innerContainer').slideDown("slow");		
			//this.$(".scrollableArea").mCustomScrollbar({theme:"dark-thick"});
			self.test1 = $('#segmentParentContainer').scrollTop();
			
			var scrlval=self.test1+200;
			$('#segmentParentContainer').animate({scrollTop: scrlval});
			this.$("div.sortDropDownOptions").show();
		},

		handleClick: function(value, text, $elem){			
			var self=this;
			var oldEntityId = this.entityId; 
			this.SelectedValue = value;
			var customVarable_activity = this.$el.find('.ui.dropdown').dropdown('get text')[0];
			this.entityId = customVarable_activity.split("(")[0];
			this.entityName = customVarable_activity.split("(")[0];

			this.activityKey = $elem.data('activitykey');
			this.activityName = $elem.data('activityname');
			if(!this.isEdit || oldEntityId !== this.entityId ){				
				if(!this.isEdit){
					this.$el.parents("[data-type='componentParentDiv']").nextAll().remove();
					this.trigger("valueSelectedFromCustomVariableComponent");
				} else {
					this.$el.parents("[data-type='componentParentDiv']").nextAll().first().find('.ui.dropdown').dropdown('clear')
					if(this.$el.parents("[data-type='componentParentDiv']").nextAll().length > 1) {
						this.$el.parents("[data-type='componentParentDiv']").nextAll().last().remove();
					}
				}
			}

			
		},
		setSelection: function(value,id,scope){
			this.SelectedValue = id;
			//this.$el.find(".scopedropDownOptions").val(scope);
			/*this.$el.find('.scopedropDownOptions').attr('disabled',true);			
			this.$el.find(".selectedSegment").find(".text span.custom_data").html(value).attr("title",value);
			this.$el.find(".searchBox").hide();
			this.$el.find(".selectedSegment").css({"width":"100%"});			
			this.$el.find("#searchBoxContainer").append(this.$el.find(".selectedSegment").eq(0).show());*/
			this.$el.find(".js-custom-variable").dropdown('set selected', value);
		},
		unSelect: function(){
			this.$el.find(".selectedSegment").hide();
			this.$el.find("#outerDiv").show();
			this.$el.find(".searchBox").show();
			console.log(this.$(".data_list"));
			console.log(this.$('.scopedropDownOptions'));
			this.$el.find('.scopedropDownOptions').attr('disabled',false);
			console.log(this.$el.find('.scopedropDownOptions').attr('disabled',false));			
			this.$el.find(".data_list > li").removeClass("selected");
			this.$('#outerDiv .btn-group .btn').removeClass("disabled");
			this.$('#outerDiv .btn-group .dropdown-menu li').removeClass("disabled");
			//this.$el.find("#row_3_col_0" ).val("");
			//this.$el.find("#row_3_col_1" ).val("");
			this.SelectedValue = undefined;
			this.entityId = undefined;
			this.entityName = undefined;
			this.activityKey = undefined;
			this.pageNumber=1;
			this.refreshList(this.pageNumber,false);
			this.trigger("valueSelectedFromCustomVariableComponent");
		},
		getSelectedValue : function(){
			var obj=[];
			obj =  {
                    "id": this.entityId,
                    "name": this.entityName
                	}
			return obj;						
		},
		getSelectedOtherValue : function(){
			var obj=[];
			obj =  {
                    "id": this.activityKey,
                    "name": this.activityName
                	}
			return obj;						
		},		
		showPopulatedValuesInEdit:function(response, rowNum, columnNum, isAppend){
			this.entityId = this.populatedValues['entityId'];
			this.entityName = this.populatedValues['entityName'];
			this.activityKey = this.populatedValues['activityId'];
			this.activityName= this.populatedValues['activityName'];
			if(this.populatedValues['scope'] == 'account'){
				this.$el.find(".scopedropDownOptions").val("ACCOUNT");
			}else{
				this.$el.find(".scopedropDownOptions").val("ADVERTISER");
			}
			
			var customVarable_activity = this.entityId + '(' + this.activityName + ')';
			// if(response){
			// 	this.appendResponseInList(response, rowNum, columnNum, isAppend);
			// 	this.$el.find('.main-custom-variable-dropdown').first().dropdown('set selected', this.entityId);
			// }			

			// this.$el.find('.row:first-child').first().find('.default').text(customVarable_activity);
			// this.$el.find('.row:first-child').first().find('input.search').val(customVarable_activity);
			// this.$el.find(".selectedSegment").find(".text span.custom_data").html(customVarable_activity).attr("title",customVarable_activity);
			// this.$el.find(".searchBox").hide();
			// this.$el.find(".selectedSegment").css({"width":"auto", "padding":"0 2px"});			
			// this.$el.find("#searchBoxContainer").append(this.$el.find(".selectedSegment").show());
			// this.$el.find('.scopedropDownOptions').attr('disabled',true);
		},
		/*
		 * This function is called when dropdown is selected
		 * or when tab is selected. 
		 */
		updateState:function(event){						
			var classArray = $(event.target).attr("class").split(" ");
			var selectedElementClass;
			var self=this;
			var queryString;
			$.each(classArray,function(index,className){
				if(className=='scopeOrSort'){
					console.log($(event.target).val());
					var dropDownValue = $(event.target).val();
					self.selectedScope = $(event.target).val();
					//alert(dropDownValue);
					if(dropDownValue == 'ADVERTISER'){						
						self.advAccName = _.findWhere(cachedData.advertiserAllList, {"id": parseInt(self.advDropdownId)})["name"] || this.advDropdownText;
					}else{
						self.advAccName = 'In Account';
					}
					console.log(dropDownValue);
					self.selectedScope=dropDownValue.toLowerCase();
					self.trigger('customVariableInnerScopeChanged',self.selectedScope);
					var splittdValues =  dropDownValue.split('&&&');
					console.log(splittdValues[0]);
					
					self.pageNumber=1;
					if(splittdValues[0] =='asc'){
						self.$('.scopeOrSort').find('button.selectpicker span.filter-option').addClass("test1").removeClass("test2");
					}
					if(splittdValues[0] =='desc'){
						self.$('.scopeOrSort').find('button.selectpicker span.filter-option').removeClass("test1").addClass("test2");
					}
					// this is sort dropDown
					if(dropDownValue.indexOf("&&&")>-1){
						var sortArray = dropDownValue.split('&&&');
						console.log(sortArray[0]);
						console.log(sortArray[1]);
						self.orderBy = sortArray[0];
						self.orderByColumn = sortArray[1];
					}
				}   
			});
						
			//this.getDataFromServer();
			this.refreshList(this.pageNumber);
												
		},
		getDataFromServer: function(){			
			var rowNum = 4;
			var columnNum = 0;
			var	self = this;
			var queryString = "";
			var searchStringCustomVariable = "";
			var searchStringActivityName = "";
			var searchFlag = false;	
			//alert(this.$el.find(".scopedropDownOptions").val());
			if(this.$el.find(".scopedropDownOptions").val() == 'ADVERTISER' || this.opt.getExternalScope() === 'advertiser'){
				if(this.opt.getExternalScope() == "advertiser"){ 
					
					if(this.opt.advertiserId){
						this.advertiserKey = this.opt.advertiserId;
					}else{
						this.advertiserKey = this.advDropdownId;
					}
					
					queryString = "scope=advertiser";
					if(this.advertiserKey){
						// var webStorageKey = LocalStorage.getUniqueKey(),
						// cachedData = LocalStorage.get(webStorageKey);
						this.advAccName = _.findWhere(RefDataService.get('advertisers').toJSON(), {"id": parseInt(this.advertiserKey)})["name"];
					}else if($("div.ownerselect").children("button").attr("title") != undefined){
						this.advAccName = $("div.ownerselect").children("button").attr("title");
					}else{
						this.advAccName = this.advDropdownText;
					}
				}else{
					this.advertiserKey = this.advDropdownId;
					queryString = "scope=advertiser";
					if(this.advDropdownText != undefined){
						this.advAccName = this.advDropdownText;
					}else{
						this.advAccName = this.advDropdownText;
					}
				}
				
				
			}else{
				this.advertiserKey = undefined;
				queryString = "scope=account";
			}						
			
			if(this.advertiserKey!=null && this.advertiserKey!=undefined && this.advertiserKey !=''){
				if(this.opt.advertiserId){
					queryString = queryString + "&advertiserKey="+this.opt.advertiserId;
				} else {
					queryString = queryString + "&advertiserKey="+this.advDropdownId;
				}								
			}else{
				queryString = queryString + "&advertiserKey=";
			}
						
			if(this.activityKey!=null && this.activityKey!=undefined && this.activityKey !=''){
				queryString = queryString + "&activityKey="+this.activityKey;
			}
			
			//queryString = queryString + "&rowsPerPage=0&pageNumber=0";
			
			if(this.orderBy!=null && this.orderBy!=undefined && this.orderBy !=''){
				queryString = queryString + "&orderBy="+this.orderBy;
			}
			
			if(this.orderByColumn!=null && this.orderByColumn!=undefined && this.orderByColumn !=''){
				queryString = queryString + "&orderByColumn="+this.orderByColumn;
			}
			
			if(this.searchCustomVariableName!=null && this.searchCustomVariableName!=undefined && this.searchCustomVariableName !=''){
				searchStringCustomVariable = "custom_variable_name:"+this.searchCustomVariableName+";";
				searchFlag = true;
			}
			
			if(this.searchActivityName!=null && this.searchActivityName!=undefined && this.searchActivityName !=''){
				searchStringActivityName = "activity_name:"+this.searchActivityName+";";
				searchFlag = true;
			}
			
			if(searchFlag){
				queryString = queryString + "&searchBy="+searchStringCustomVariable+searchStringActivityName;
			}
			
			if(this.searchCustomVariableName!=null && this.searchCustomVariableName!=undefined && this.searchCustomVariableName !=''
				&& this.searchActivityName!=null && this.searchActivityName!=undefined && this.searchActivityName !=''){
				queryString = queryString + "&searchByOpr=AND";
			}
			
			var filterBy = "filterBy=activity_status:A;";
			queryString = queryString + "&" + filterBy;
			
			if(this.isServerSidePagination){
				queryString = queryString + "&rowsPerPage="+self.rowsPerPage+ "&pageNumber="+self.pageNumber;
			}
			
			var requestParameters = {
					'entity': this.entity,
					'accountId': this.accountId,
					'operation': this.operation,
					'queryString': queryString
					//'queryString': "activityKey=&advertiserKey=&searchBy=pp&rowsPerPage=0&pageNumber=0"
					/*'queryString': "activityKey=9&advertiserKey=7&searchBy=custom_variable_name:abc;activity_name:xyz;&rowsPerPage=0&pageNumber=0"*/
			}
			
			return requestParameters;
			/*RemoteService.ajax({
				url: "getApiData.htm",
				data: JSON.stringify(requestParameters)
			}).done(function(response) {
				     console.log("CUSTOM VARIABLE RESPONSE");
				     console.log(response);				
				     self.appendResponseInList(response, rowNum, columnNum);
			});*/
			
		},
		refreshList:function(pageNumber,isAppend){
			console.log('inside refresh list');
			var rowNum = 4;
			var columnNum = 0;
			var self = this;
			var data = this.getDataFromServer();
			var callServer = false;
			if(this.isServerSidePagination){
				
				if(self.totalRecords!=null && self.totalRecords!=undefined){					
					var maxPageNumber =  Math.ceil(self.totalRecords/this.rowsPerPage);
					console.log(maxPageNumber);
					if(this.pageNumber <= maxPageNumber){						
						callServer=true;
					}
				}else{				
					callServer=true;
				}
				
			}else{				
				callServer=true;
			}
			
			
			if(callServer){			
				RemoteService.ajax({
					url: "getApiData.htm",
					data: JSON.stringify(data)
				}).done(function(response) {
					     console.log("CUSTOM VARIABLE RESPONSE");
					     console.log(response);	
					     self.totalRecords=response.totalRows;
					     self.serverResponse = response;
					     self.appendResponseInList(response, rowNum, columnNum, isAppend);					     
				});
			}
		},
		getScope: function(){
			return this.selectedScope;
		},
		
		
	});
	
	return view;

})
