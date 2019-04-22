define([
	'jquery', 
	'backbone', 
	'underscore',
	'text!components/segmentBuilder/tpl/parentTpl.html',
	'services/RemoteService',
	'components/segmentBuilder/model/lookAlikeModel',
	'components/localstorage/LocalStorage',
	"services/CacheService",
	"services/AccountService",
	"services/RefDataService",
	"modules/tags/util/Util"
],

function($, Backbone, _,parentTpl,RemoteService,LookAlikeModel, LocalStorage, CacheService, AccountService, RefDataService, Util){
	
	var view = Backbone.View.extend({
		events: {
			//"click ul.data_list li": "handleClick",
			"click #selectedSegCloseBtn": "unSelect",
			"change .search": "handleClick"
		},
		initialize:function(opt){
			//this.opt=opt;
			this.opt=opt;
			this.configuration = opt.configuration;
			this.url = opt.url;
			this.scopedropDownOptions = opt.scopedropDownOptions;
			this.advAccName=opt.advAccName;
			this.sortDropDownOptions=opt.sortDropDownOptions;
			this.tabValues=opt.tabValues;
			this.pageNumber=1;
			this.tpl = _.template(parentTpl);
			this.$el.html(this.tpl());
			this.entity = opt.entity;
			this.selectedScope = opt.selectedScope;
			this.renderComponentThroughConfiguration(this.opt);
			this.selectionId = opt.selectionId;
			this.modelType = opt.modelType;
			this.accountId = opt.accountId;
			this.advertiserId = opt.advertiserId;
			if(opt.advertiserName!=undefined)
				this.advAccName=opt.advertiserName;
			this.operation = opt.operation;
			this.rowsPerPage = opt.rowsPerPage;
			this.orderBy;
			this.orderByColumn;
			this.typedText;
			this.selectedTab;
			this.selectModelType=opt.selectModelType;
			var self=this;
			this.isServerSidePagination = opt.isServerSidePagination;
			if(this.isServerSidePagination){
				self.registerScrolling();
			}
			
			$(document).on("click", function(e){
				
				if($(e.target).hasClass("segContainer") || $(e.target).parents(".segContainer").length > 0){
					
				}else{
					self.$('.innerContainer').slideUp("slow");
				}
				
			});
			
		},
		render:function(){
			//$("body").append(this.$el);
			this.refreshList(this.pageNumber);
			return this;
		},
		/*
		 *This function call server get response and call a
		 *function that appends response in the list.  
		 */  
		refreshList:function(pageNumber,isAppend){
			console.log('inside refresh list');
			var self = this;
			var data = this.getInputForServer();
			var callServer = false;
			if(this.isServerSidePagination){
				if(self.totalRecords!=null && self.totalRecords!=undefined){
					var maxPageNumber =  Math.ceil(self.totalRecords/this.rowsPerPage);
					console.log(maxPageNumber);
					if(self.totalRecords==0){
						maxPageNumber = 1;
					}
					if(this.pageNumber <= maxPageNumber){
						callServer=true;
					}
				}else{
					callServer=true;
				}
				
			}else{
				callServer=true;
			}
			
			//show laoding for dropdown before making an API call
			this.$el.find('.ui.dropdown').addClass('loading');			
			
			if(callServer){
				RemoteService.ajax({
	                url: this.url,
	                data: JSON.stringify(data)
	            }).then(function(response){
	            	self.$el.find('.ui.dropdown').removeClass('loading')
	            	console.log(response);
            		var response = self.parseResponse(response, self.entity);
            		self.removejQueryAddedCss();
	           		self.appendResponseInList(response,isAppend);
	           		self.trigger("refreshed");
	            });
			}
		},
		
		removejQueryAddedCss:function(){
			$.each($('.ui.search.selection.dropdown.multiple'), function(){
				if($(this).find('a').length < 2)	{
					$(this).find('a').removeAttr('style');
				}			
			});
		},
		/*
		 * This function creates input request for server.
		 */
		getInputForServer : function(){
			
			var data = {};
			var self = this;
			var searchByKey;
			var status;
			var option;
			if(this.entity=='activities'){
				searchByKey = 'activity_name';
				status="activity_status:A";
			}
			else if(this.entity=='advertisers'){
				searchByKey = 'advertiser_name';
				status="advertiser_status:A";
			}
			else if(this.entity=='campaigns'){
				searchByKey = 'campaign_name';
				status="campaign_status:A";
			}
			if(this.entity!=null && this.entity!=undefined && this.entity !=''){
				data['entity'] = this.entity;
			}
			if(this.accountId!=null && this.accountId!=undefined && this.accountId !=''){
				data['accountId'] = this.accountId;
			}
			if(this.advertiserId!=null && this.advertiserId!=undefined && this.advertiserId !='' && this.selectedScope!='account'){
				data['advertiserId'] = this.advertiserId;
			}
			if(this.operation!=null && this.operation!=undefined && this.operation !=''){
				data['operation'] = this.operation;
			}
			console.log(this.orderBy);
			console.log(this.orderByColumn);
			data['queryString'] = "filterBy="+status;
			
			if(this.orderBy!=null && this.orderBy!=undefined && this.orderBy !='' && this.orderByColumn!=null && this.orderByColumn!=undefined && this.orderByColumn !=''){
				data['queryString'] = data['queryString']+"&orderBy="+this.orderBy + "&orderByColumn="+this.orderByColumn;
			}
			if(this.typedText!=null && this.typedText!=undefined && this.typedText !=''){
				data['queryString'] = data['queryString'] + "&searchBy="+searchByKey+":"+this.typedText;
			}
			if(this.opt.getacvid){
				data['queryString'] = data['queryString'] + "&searchBy=activitykey:"+this.opt.getacvid;
			}
			if(this.isServerSidePagination){
				data['queryString'] = data['queryString'] + "&rowsPerPage="+self.rowsPerPage+ "&pageNumber="+self.pageNumber;
			}
			if(this.selectModelType=='lookalike'){
				 option = 'FEEDBACK'; 
			}else if(this.selectModelType=='demographic'){
				 option = 'DEMOGRAPHIC'; 
			}
			if(option!=undefined && option!=null){
				data['option']=option;
			}
			if(this.entity=='activities'){
				var scope;
				if(this.selectedScope=='advertiser'){
					scope='advertisers';
				}else{
					scope='accounts';
				}
				if(this.opt.type){
					if(this.opt.type=='adv'){
						scope='advertisers';
					}else{
						scope='accounts';
					}
					this.opt.type = undefined;
				}
				//data['scope']=scope;
				if(data['advertiserId']==undefined)
					data['queryString'] = data['queryString'] + "&scope=" + scope;
			}
			
			if(this.opt.modelingLevel) {
				if(this.opt.modelingLevel === 'DEVICE_IOS' || this.opt.modelingLevel === 'DEVICE_GOG') {
					data['modelingLevel'] = this.opt.modelingLevel;
				}
			}

			this.opt.getacvid = undefined;
			
			return data;
		},
		
		/*
		 * This function append response in the list.
		 */
		appendResponseInList:function(data,isAppend){
			var self = this;
			if(!isAppend){
				self.$el.find('.ui.dropdown .menu').empty();
			}
			if(data.length > 0){
			    //data = _.sortBy(data, 'name');
			    data = _.sortBy(data, function(obj){
			        if(obj.name){
			            return obj.name.toUpperCase();
			        } else {
			            return 0;
			        }
			    });
				$.each( data, function(index, jsonObj) {
					var id = self.generateLiId(jsonObj.id);
					self.$el.find('.ui.dropdown .menu').append('<div class="actvtyLastOccurenceellipsis item"  id="'+id+'" data-value="'+jsonObj.id+'" data-id="'+jsonObj.id+'">' + jsonObj.name + '</div>');
					self.$el.find('.ui.dropdown').dropdown({
						fullTextSearch : "exact",
						match: "text",
						forceSelection: false,
						onShow: function() {
					    	var itemLen = self.$el.find('.ui.dropdown').find('.menu .item').map(function(index, item){
								return $(item).text().length;
							});

					    	var maxLen = _.max(itemLen);
							if(maxLen > 36){
								self.$el.find('.ui.dropdown').find('.menu').css('min-width', (maxLen+136)+'%');
							}else if(maxLen > 20 && maxLen <= 36) {
								self.$el.find('.ui.dropdown').find('.menu').css('min-width', (maxLen+120)+'%');
							}else {
								self.$el.find('.ui.dropdown').find('.menu').css('min-width', '100%');
							}
					    }

					});
					self.$el.find('.ui.dropdown').find('input').attr('data-id', jsonObj.id);
					self.$el.find('.ui.dropdown').find('input').attr('id', id);
				});
				if(self.selectionId || this.getSelectedValue()){
					self.$el.find('.ui.dropdown').dropdown('set selected', self.selectionId || this.getSelectedValue());
					if(this.entity === 'campaigns' && !self.modelType){
						self.$el.find('.ui.dropdown').addClass('campaign-present-LAL');
						self.$el.find('.ui.dropdown.campaign-present-LAL').find('input.search, .menu').hide();
					}	
				}				
				if(this.entity === 'campaigns' && !self.modelType && this.opt.megaDrpDwnSelectionObj && this.opt.megaDrpDwnSelectionObj.length > 0 && this.opt.megaDrpDwnSelectionObj[0] === "observed.CAMPAIGN.campaignLastClick"){
					self.$el.find('.ui.dropdown').addClass('campaign-present-LAL');
					self.$el.find('.ui.dropdown.campaign-present-LAL').find('input.search, .menu').hide();
				}
			}else{
				self.$el.find('.ui.dropdown').find('.text').text('No records found');
				self.$el.find('.data_list').append('<span class="noRecord">No records found</span>');
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
				// are we at the bottom
				//console.log(maxScroll);
				//console.log(currScroll);
				if(currScroll==maxScroll){
					//console.log("inside")
					$(this)[0].scrollTop = $(this)[0].scrollHeight - $(this).height();
					self.pageNumber++;
					self.refreshList(self.pageNumber,true);
				}
				//scroll to the bottom of the div
				//load again
			
			});
		},
		getUrl:function(pageNumber){
			//console.log(pageNumber);
			return "data/data"+pageNumber+".json";
		},
		
		/*
		 * This function is called when dropdown is selected
		 * or when tab is selected. 
		 */
		updateState:function(event){
			//alert('updateState' + event.data.value);
			console.log($(event.target).attr("class"));
			var classArray = $(event.target).attr("class").split(" ");
			var selectedElementClass;
			var self=this;
			$.each(classArray,function(index,className){
				if(className=='tabValues1'){
					selectedElementClass = 'tabValues1';
					self.$(".tabValues2").removeClass('selected');
					self.$(".tabValues1").addClass('selected');
					//self.selectedScope=;
					self.selectedTab=event.data.value;
				}else if(className=='tabValues2'){
					selectedElementClass = 'tabValues2';
					self.$(".tabValues1").removeClass('selected');
					self.$(".tabValues2").addClass('selected');
					self.selectedTab=event.data.value;
					console.log(this.selectedTab);
				}else if(className=='scopeOrSort'){
					console.log($(event.target).val());
					var dropDownValue = $(event.target).val();
					console.log(dropDownValue);
					var splittdValues =  dropDownValue.split('&&&');
					console.log(splittdValues[0]);
					if(splittdValues[0] =='asc'){
						self.$('.scopeOrSort').find('button.selectpicker span.filter-option').addClass("test1").removeClass("test2");
					}
					if(splittdValues[0] =='desc'){
						self.$('.scopeOrSort').find('button.selectpicker span.filter-option').removeClass("test1").addClass("test2");
					}
					
					self.pageNumber=1;
					// this is sort dropDown
					if(dropDownValue.indexOf("&&&")>-1){
						var sortArray = dropDownValue.split('&&&');
						console.log(sortArray[0]);
						console.log(sortArray[1]);
						self.orderBy = sortArray[0];
						self.orderByColumn = sortArray[1];
						
					}else{
						var advertiserObj;
						if(dropDownValue=='advertiser'){
							self.advertiserId = self.opt.advertiserId;
							if(self.opt.tabValues1!=undefined && self.opt.tabValues1!=undefined){
								self.$('.tabsBg').show();
							}
							
							if(!isNaN(self.advertiserId)){
								var webStorageKey = LocalStorage.getUniqueKey(),
								cachedData = LocalStorage.get(webStorageKey);
																
								if(typeof cachedData.advertiserAllList == "undefined"){
									advertiserObj = this.getAdvertiserCollection();
									console.log('IN parent View:',advertiserObj);
								}else{
									console.log('IN else parent View:',advertiserObj);
									advertiserObj = cachedData.advertiserAllList;
								}	
								
								self.advAccName = _.findWhere(advertiserObj, {"id": parseInt(self.advertiserId)})["name"];
							}
							
							self.$el.find('.label_account_adv_label').text(self.advAccName);
						}else if(dropDownValue=='account'){
							self.advertiserId = null;
							if(self.opt.tabValues1!=undefined && self.opt.tabValues1!=undefined){
								self.$('.tabsBg').hide();
							}
							self.$el.find('.label_account_adv_label').text('In Advertiser');
						}
						self.selectedScope=dropDownValue;
						console.log(self.selectedScope);
						self.trigger('innerScopeChanged',self.selectedScope);
					}
					return false;
				}   
				
			});
			console.log('updateState' + $(".scopedropDownOptions").val());
			console.log('updateState' + $(".tabValues1").text());
			console.log('updateState' + $(".tabValues2").text());
			if(this.entity!='models'){
				self.refreshList(this.pageNumber,false);
			}else{
				self.refreshModelList();
			}
		},
		refreshModelList : function(){
			var self = this;
			var response = self.lookAlikeModel.filterData(self.selectedScope,(typeof self.selectedTab == "undefined" ? (self.selectModelType == "demographic" ? "demographic" : undefined) : self.selectedTab),self.orderBy,self.orderByColumn,self.typedText,this.advertiserId);
			if(self.selectedScope=='account'){
				this.totalRecords = response.length;
				this.$('.label_account_adv').text(this.totalRecords);
			}else if(self.selectedScope=='advertiser'){
				/*this.totalRecords =  self.lookAlikeModel.getTotalAdvertiserCount();
				this.$('.label_account_adv').text(this.totalRecords);
				if(self.selectedTab=='lookAlikes'){
					this.$('.cl_tabValues2').text(response.length);
				}else if(self.selectedTab=='feedBackLookAlikes'){
					this.$('.cl_tabValues1').text(response.length); 
				}*/
				
				var advCounts =  self.lookAlikeModel.getTotalAdvertisersCount();
				this.$('.label_account_adv').text(self.selectModelType == "demographic" ? response.length : advCounts.totalAdvs);
				if(self.selectedTab=='lookAlikes'){
					this.$('.cl_tabValues2').text(response.length);
					this.$('.cl_tabValues1').text(advCounts.feedBackLookAlike);
				}else if(self.selectedTab=='feedBackLookAlikes'){
					this.$('.cl_tabValues1').text(response.length);
					this.$('.cl_tabValues2').text(advCounts.lookAlike);
				}
			}else if(self.selectedScope==undefined){
				/*if(self.advertiser!=undefined && self.advertiser!=null && self.advertiser!=''){
					this.totalRecords =  self.lookAlikeModel.getTotalAdvertiserCount();
					this.$('.label_account_adv').text(this.totalRecords);
				}else{
					this.totalRecords = dataArray.length;
					this.$('.label_account_adv').text(this.totalRecords);
				}*/
				this.totalRecords = response.length;
				this.$('.label_account_adv').text(this.totalRecords);
			}
			
			
			self.appendResponseInList(response,false);
		},
		tabClicked:function(event){
			console.log('updateState' + $(".scopedropDownOptions").val());
			console.log('updateState' + $(".tabValues1").text());
			console.log('updateState' + $(".tabValues2").text());
		},
		renderComponentThroughConfiguration : function(opt){
			var self = this;
			var componentJsonConfiguration = opt.configuration;
			var rows = componentJsonConfiguration["rows"];
			//console.log(rows);
			$.each(rows,function(rowNum,row){
				console.log(row);
				
				var rowContext={};
				if(rowNum==0){
					self.$el.find('#outerDiv').append("<div class='row' id ="+"row_"+rowNum+">");
				}else if(rowNum==1){
					self.$el.find('#outerDiv').append("<div id = 'innerDiv' class='segContainer innerContainer' style='display:none'></div>");
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
								
								var optionJSONArray = opt[column["key"]]; 
								var selectBox = "<select class='selectpicker scopeOrSort dropdown " + identifierClass + "'>";
								
								$.each(optionJSONArray,function(index,optionJSON){
									if(index==0){
										if(optionJSON.orderBy!=undefined && optionJSON.orderBy!=null){
											self.orderBy= optionJSON.orderBy;
											self.orderByColumn= optionJSON.orderByColumn;
										}
										if(optionJSON.scope_id!=null && optionJSON.scope_id!=undefined){
											if(self.selectedScope == undefined){
												self.selectedScope=optionJSON.scope_id;
											}
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
										selectBox += "<option class='"+orderByClass+"' value='"+ optionJSON.orderBy+"&&&"+optionJSON.orderByColumn+"'>"+optionJSON.text+"</option>"
									}else{
										selectBox += "<option value='"+optionJSON.scope_id+"'>"+optionJSON.text+"</option>"
									}
									
									  
								});
								console.log(selectBox);
								self.$el.find("#"+"row_"+rowNum).append(selectBox);
								setTimeout(function(){
									//self.$el.find('.selectpicker').selectpicker();
									self.$('.scopeOrSort').find('button.selectpicker span.filter-option').addClass("test1").removeClass('test2');
									console.log(self.$el.find('.scopeOrSort'));
									//self.$('.scopeOrSort').selectpicker('render');
									//self.$('.scopeOrSort').on('change',$.proxy(self.updateState,self));
								},50);
							}
							else if(column["type"]=="label"){
								var labelDiv = "<div class='label' id="+'row_'+rowNum+'col_'+columnNum +"/>";
								//var labelInnerDiv1 = "<div id="+'inner1_row_'+rowNum+'col_'+columnNum +"/>";
								var labelInnerDiv2 = "(<span id="+'inner2_row_'+rowNum+'col_'+columnNum+"/>)";
								self.$el.find("#"+"row_"+rowNum).append(labelDiv);
								
								//self.$el.find("#"+"row_"+rowNum+"col_"+columnNum).append(labelInnerDiv1);
								
								//self.$el.find("#"+"row_"+rowNum+'col_'+columnNum).text(opt[column["key"]]);
								var tempFunc = function(_rowNum, _columnNum){
									
									return function(){
										self.$el.find('#row_'+_rowNum+'col_'+_columnNum).append("<span class='label_account_adv_label'/>");
										if(self.selectedScope == "advertiser"){
											self.$el.find(".label_account_adv_label").text(self.advAccName);
										}else{
											self.$el.find(".label_account_adv_label").text("In Advertiser");
										}	
										if(self.selectedTab==undefined)
										{
											if(self.advertiserId!=undefined && self.advertiserId!=null && self.advertiserId!=''){
												if(self.entity=='activities'){
													if(self.selectedScope == "advertiser"){
														self.$el.find(".label_account_adv_label").text(self.advAccName);
													}else{
														self.$el.find(".label_account_adv_label").text("In Advertiser");
													}
												}else if(self.entity=='campaigns'){
													self.$el.find(".label_account_adv_label").text(self.advAccName);
												}
												
											}
										}
										self.$el.find('#row_'+_rowNum+'col_'+_columnNum).append(" (<span class='label_account_adv' id="+'inner3_row_'+_rowNum+'col_'+_columnNum+"/>)");
										if(self.totalRecords != undefined)
											self.$el.find("#"+"inner3_row_"+_rowNum+"col_"+_columnNum).text(self.totalRecords);
										else
											self.$el.find("#"+"inner3_row_"+_rowNum+"col_"+_columnNum).text("");
									};
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
										self.$el.find('#row_'+_rowNum+'col_'+_columnNum).append(" (<span class='cl_"+identifierClass+"' id="+'inner3_row_'+_rowNum+'col_'+_columnNum+"/>)");
										self.$el.find("#"+"inner3_row_"+_rowNum+"col_"+_columnNum).text(" ");
									};
								};
								setTimeout(tempFunc(rowNum, columnNum), 10);
								self.$el.find("#"+"row_"+rowNum+"col_"+columnNum).text(opt[column["key"]].text);
								if(opt[column["key"]].isSelected){
									self.selectedTab = opt[column["key"]].id;
								}
								self.$el.find("#"+"row_"+rowNum+"col_"+columnNum).bind("click",{value:opt[column["key"]].id},$.proxy(self.updateState,self));
								if(self.selectedScope=='account'){
									self.$('.tabsBg').hide();
								}
							}
						}
					}else{
						 if(column["type"]=="searchBox"){
							 var searchBoxDiv;
							 console.log(rowContext.preColumnType);
							 var placeHolder = 'Search For Activities';
							 if(self.entity!=undefined && self.entity=='campaigns'){
								 placeHolder = 'Search For Campaigns';
							 }else if(self.entity!=undefined && self.entity=='models'){
								 placeHolder = 'Search For Segment';
							 }
							 
							 if(rowContext.preColumnType != undefined && rowContext.preColumnType !=null && rowContext.preColumnType == 'DropDown'){
								searchBoxDiv = "<div id='searchBoxContainer'> <div class='searchBox "+identifierClass+" ui search selection dropdown'> <input type='hidden'/><i class='dropdown icon'></i><div class='default text'>"+placeHolder+"</div><div class='menu'></div></div>";
								// searchBoxDiv =	"<div id='searchBoxContainer'><div class='searchBox small "+identifierClass+"'> <input type='text' class='searchField' placeholder='"+placeHolder+"' data-input-type='searchBox'/></div></div>";
							 }else{
				 				//var selectRef =	'<div class="ui search selection dropdown" data-id="'+uniqid+'" style="min-width: auto;"> <input type="hidden"/><i class="dropdown icon"></i><div class="default text">SELECT"</div> <div class="menu"></div> </div>';
								searchBoxDiv = "<div id='searchBoxContainer'> <div class='searchBox "+identifierClass+" ui search selection dropdown'> <input type='hidden'/><i class='dropdown icon'></i><div class='default text'>"+placeHolder+"</div><div class='menu'></div></div>";
								 //searchBoxDiv =	"<div id='searchBoxContainer'><div class='searchBox "+identifierClass+"'> <input type='text' class='searchField' placeholder='"+placeHolder+"' data-input-type='searchBox'/></div></div>";
							 }
							self.$el.find("#"+"row_"+rowNum).append(searchBoxDiv);

							setTimeout(function(){self.$('.searchField').on("focus",  $.proxy(self.toggleDiv,self))}, 100);

							setTimeout(function(){self.$('.searchField').on("focus", function(e){
								self.toggleDiv(e);
							});}, 100);

							setTimeout(function(){
								var options = {
									    callback: function(value){ 
									    	console.log('typed text--->' + value);
									    	if(value!=undefined && value!=null && value!=''){
									    		value = value.trim();
									    	}
									    	self.typedText=value;
									    	self.totalRecords=null;
									    	self.pageNumber=1;
									    	if(self.entity!='models'){
									    		self.refreshList(this.pageNumber,false);
									    	}else{
									    		self.refreshModelList();
									    	}
									    	
									    },
									    wait: 750,
									    highlight: true,
									    captureLength: 0
									}
								//self.$(".searchField" ).typeWatch(options);
		
								}, 100);
						}else if(column["type"]=="grid"){
							console.log("grid");
							var	gridView = "<div class='scrollableArea'><ul class='data_list'></ul></div>";
							self.$el.find("#innerDiv").append(gridView);
						}
					}
				})
			})
			
		},
		toggleDiv : function(){
			console.log(this.$el.html());
			console.log(this.$el.find('.innerContainer'));
			
			this.$('.innerContainer').slideDown("slow");
			//self.$('#segmentParentContainer').animate({scrollTop: $('#segmentParentContainer').prop("scrollHeight")}, 500);
			//this.$(".scrollableArea").mCustomScrollbar({theme:"dark-thick"});
			self.test1 = $('#segmentParentContainer').scrollTop();
			
			var scrlval=self.test1+200;
			$('#segmentParentContainer').animate({scrollTop: scrlval});
			
			if(this.entity=='models' && this.selectedScope == 'account'){
				$('.tabsBg').hide();
			}
		},
		
		handleClick: function(e){						
			console.log(this.$(e.target).html());
			this.setSelection(this.$el.find('.ui.dropdown').dropdown('get text'), this.$el.find('.ui.dropdown').dropdown('get value'));
			this.selectedId=this.$el.find('.ui.dropdown').dropdown('get value');//$(e.target).attr('data-id');
			if(this.entity!='models'){
				this.SelectedValue = this.$el.find('.ui.dropdown').dropdown('get value');
			}else{
				this.SelectedValue = this.$el.find('.ui.dropdown').dropdown('get text');
			}
			this.trigger("selectionDone", this.$el.find('.ui.dropdown').dropdown('get value'));
			console.log(this.getSelectedValue());
		},
		
		getSelectedValue : function(){
			return this.SelectedValue;
			
		},
		parseResponse : function(data,entity){
			var self=this;
			if(!this.isServerSidePagination){
				if(this.advertiserId!=undefined && this.advertiserId!=null && this.advertiserId!=''){
					self.lookAlikeModel = new LookAlikeModel({"response":data,"advertiserId":this.advertiserId}, {parse:true});
				}else{
					self.lookAlikeModel = new LookAlikeModel({"response":data}, {parse:true});
				}
				console.log(self.selectedScope);
				console.log(self.orderBy);
				console.log(self.orderByColumn);
				console.log(self.selectedTab);
				 
				var dataArray = self.lookAlikeModel.filterData(self.selectedScope,(typeof self.selectedTab == "undefined" ? (self.selectModelType == "demographic" ? "demographic" : undefined) : self.selectedTab),self.orderBy,self.orderByColumn,null);
				if(self.selectedScope=='account'){
					this.totalRecords = dataArray.length;
					this.$('.label_account_adv').text(this.totalRecords);
				}else if(self.selectedScope=='advertiser'){
					/*this.totalRecords =  self.lookAlikeModel.getTotalAdvertiserCount();
					this.$('.label_account_adv').text(this.totalRecords);
					if(self.selectedTab=='lookAlikes'){
						this.$('.cl_tabValues2').text(dataArray.length);
					}else if(self.selectedTab=='feedBackLookAlikes'){
						this.$('.cl_tabValues1').text(dataArray.length); 
					}*/
					var advCounts =  self.lookAlikeModel.getTotalAdvertisersCount();
					
					this.$('.label_account_adv').text(self.selectModelType == "demographic" ? dataArray.length : advCounts.totalAdvs);
					this.$('.cl_tabValues2').text(advCounts.lookAlike);
					this.$('.cl_tabValues1').text(advCounts.feedBackLookAlike); 
					this.totalRecords = (self.selectModelType == "demographic") ? dataArray.length : advCounts.totalAdvs;
					
				}else if(self.selectedScope==undefined){
					/*if(self.advertiser!=undefined && self.advertiser!=null && self.advertiser!=''){
						this.totalRecords =  self.lookAlikeModel.getTotalAdvertiserCount();
						this.$('.label_account_adv').text(this.totalRecords);
					}else{
						this.totalRecords = dataArray.length;
						this.$('.label_account_adv').text(this.totalRecords);
					}*/
					var advCounts =  self.lookAlikeModel.getTotalAdvertisersCount();
					this.$('.label_account_adv').text(advCounts.totalAdvs);
					this.$('.cl_tabValues2').text(advCounts.lookAlike);
					this.$('.cl_tabValues1').text(advCounts.feedBackLookAlike); 
					this.totalRecords = advCounts.totalAdvs;
				}
				
				
				//this.totalRecords = dataArray.length;
				console.log(dataArray);
				return dataArray; 
			}else{
				var dataArray = data[entity];
				this.totalRecords = data['totalRows'];
				if(this.totalRecords==undefined || this.totalRecords==null){
					this.totalRecords = 0;
				}
				return dataArray; 
			}
			
		},
		generateLiId : function(actualIdentifier){
			//var actualIdentifierWithoutWhiteSpace =  actualIdentifier.replace(" ","");
			return "id"+actualIdentifier;
		},
		selectElementFrom : function(value){
			var liId = this.generateLiId(value);
			$(".data_list").filter("#"+liId).addClass('selected');
		},
		unSelect: function(e){
			
			if($(e.target).parents(".selectedSegment").data("for-build-model")){
				return;
			}
			
			this.$(".selectedSegment").hide();
			this.$(".selectedSegment").find(".text .text_tag_data").html();
			this.$("#outerDiv").show();
			this.$(".searchBox").show();
			console.log(this.$(".data_list"));
			console.log(this.$('.scopedropDownOptions'));
			this.$('.scopedropDownOptions').attr('disabled',false);
			this.$(".data_list > li").removeClass("selected");
			this.$('#outerDiv .btn-group .btn').removeClass("disabled");
			this.$('#outerDiv .btn-group .dropdown-menu li').removeClass("disabled");
			this.$(".searchField").val("");
			this.SelectedValue=undefined;
		},
		
		getScope: function(){
			return this.selectedScope;
		},
		
		setSelection: function(value,id,scope){
			var self = this;

			this.SelectedValue = id;
			this.$(".scopedropDownOptions").val(scope);
			this.$('.scopedropDownOptions').attr('disabled',true);

			this.$el.find('.ui.dropdown').dropdown('set selected', id);

			//this.$(".selectedSegment").find(".text .text_tag_data").html(value).attr("title",value);
			
			if(this.entity == 'activities' || this.entity == 'campaigns' || ((this.entity == 'models') && (this.selectModelType == 'demographic' || this.selectModelType == 'lookalike'))){
				this.$(".searchBox").css({"width":"200px", "float":"right", "display":"block"});
			}else{
				this.$(".searchBox").css({"width":"125px", "float":"right", "padding":"2px","display":"block"});
			}
			
			//this.$("#searchBoxContainer").append(this.$(".selectedSegment").show());
			
			if(this.entity=='models'){
				console.log('valueSelectedModelComponent---- triggered');
				this.trigger("valueSelectedModelComponent");
			}
		},
		
		setScope: function(scope){
			this.$(".scopedropDownOptions").val(scope);
		},
		
		getFullValueFromSelectedValue: function(){
			return _.findWhere(this.lookAlikeModel.toJSON().response.models, {"name": this.SelectedValue});
		},
		
		getAdvertiserId: function(){
			return this.advertiserId;
		},

        /**
         * It return complete collection of available advertiser list from local storage.
         * If data is not found in local storage, then it send ajax request to server for data and save that data in local storage.
         * It intentionally used async: false, do not remove it
         */
        getAdvertiserCollection: function() {
            var advertiserArray;
            var currentStorage = LocalStorage.get(LocalStorage.getUniqueKey()),
            webStorageKey = LocalStorage.getUniqueKey()
            if(Util.isNull(currentStorage) || Util.isNull(currentStorage.advertiserAllList)){
                console.log('CommonModule.getAdvertiserCollection : advertiserAllList is not present in local storage, getting it from server');
                RemoteService.ajax({
                    url: "getApiData.htm",
                    data: JSON.stringify({
                        "entity": "advertisers",
                        "operation": "list",
                        "accountId": AccountService.getCurrentAccount().id,//(LocalStorage.get(webStorageKey).currentAccountSelected ? LocalStorage.get(webStorageKey).currentAccountSelected.id : LocalStorage.get(webStorageKey).accountId),
                        "queryString": "statistics=true&filterBy=advertiser_status:A&searchBy=&rowsPerPage=0&pageNumber=0"
                    }),
                    async: false
                }).done(function(response) {
                    console.log('CommonModule.getAdvertiserCollection : response = ', response);

                    CacheService.set("advertiserAllList", response.advertisers);

                    var updatedCachedData = LocalStorage.get(LocalStorage.getUniqueKey());
                    if(Util.isNull(updatedCachedData)){
                        updatedCachedData = {};
                    }
                    updatedCachedData.advertiserAllList = response.advertisers;
                    advertiserArray = response.advertisers;
                    LocalStorage.set(LocalStorage.getUniqueKey(), updatedCachedData);
                });

            } else {
                console.log('CommonModule.getAdvertiserCollection : advertiserAllList is present in local storage');
                advertiserArray = LocalStorage.get(LocalStorage.getUniqueKey()).advertiserAllList;
            }
            return advertiserArray;
        }
		
	});
	
	return view;

})
