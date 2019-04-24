define(["jquery", 
        "backbone",
        "underscore",
        "i18next",
        "services/AccountService",
        "text-loader!components/ruleView/treeDrpDwn.html",
        "services/RemoteService",
        "text-loader!components/ruleView/WarningTpl.html"],
		function($, Backbone, _, i18next, AccountService, treeDprDwnTpl, RemoteService, WarningTpl){
	
	var View = Backbone.View.extend({
		
		events : {
			"click .active.valueUnSelected" : "onSelect",
			"click .active.valueSelected" : "onDeSelect",
			"click .activeImage .unselected" : "onImageSelection",
			"click .activeImage .selected" : "onImageDeSelection",
			"click #inActiveImages" : "onImageSelection",
			"click #activeImages" : "onImageDeSelection"
		},
		
		initialize: function(options){			
			this.timesofinitialization = 1;
			this.tags = [];
			this.filterArray = [];
			this.isEdit=options.isEdit;
			this.selectedElementsArray = options.selectedElementArray;
			this.singleSelect=options.singleSelect;
			this.showOnlyComponent=options.showOnlyComponent;
			this.isMaxReached=options.isMaxReached;
			this.render();
		},
		
		getData: function(){
			var data = {
					"accountId": AccountService.getCurrentAccount().id,
					"option": "interest"
			};
			var self = this;
			var getData =  RemoteService.ajax({
	            url: "getModels.htm",
	            data: JSON.stringify(data)
	        }).then(function(response) {
	        	self.drpDwnResponse = response;
	        	self.trigger("removeLoader");
	        });
			return $.when(getData);
		},
		
		render: function(){
			var self=this;
			$('.content').children('div').append(_.template(WarningTpl,{
				//"errorHeading": i18next.t("app.maxLimitSegmentType"),
				"i18next": i18next
			}));
		    $('#popuperrorNoteclose_segmentInterestOverlap').on('click', this.closeErrorPopUp);
			this.getData().then(function(){
				var tpl = _.template(treeDprDwnTpl,{
					mainLiList : self.drpDwnResponse.models,
					filterLiList : self.drpDwnResponse.filters
				});
				self.$el.html(tpl);
				self.$('.tags').tagsInput({width:'auto',defaultText:'',onRemoveTag:$.proxy(self.removeTag,self)});
				var id= Math.random();
				self.$el.find('.treemenu').html('<ul id="example'+id+'" class="example treemenu-dropdown"></ul>');
				self.generateHtml(self.drpDwnResponse);
				if(self.isEdit!=undefined && self.isEdit!=null && self.isEdit!='' && self.isEdit){
					self.selectedValuesFromListForEdit();
				}else{
					self.$('.tags').show();
					self.$('.tagsinput').hide();
				}
				self.$el.find(".interactionLAL").tooltip({
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
				});
				var options = {
					    callback: function(value){ 
					    	self.$('#activeImages').removeClass("showInLineElem").addClass("hideElem");
					    	self.$('#inActiveImages').removeClass("hideElem").addClass("showInLineElem");
					    	self.typedText=value;
					    	var searchArray =  self.typedText.split(' ');
					    	var searchString = "";
					    	var currentSelectedValues = self.$('.tags').val();
							var currentValuesArray = currentSelectedValues.split(",");
					    	for(var i=0;i<searchArray.length; i++){
					    		if(i==0){
					    			searchString += searchArray[i]; 
					    		}else{
					    			if(searchArray[i] != ""){
					    				searchString += "##"+searchArray[i];
					    			}
					    		}
					    	}
					    	var searchdata = {
									"accountId": AccountService.getCurrentAccount().id,
									"searchBy": searchString,
									"option": "interest"
							};
							if(searchString != ""){
								self.$(".treemenu").addClass('componentBlock');
								self.$(".treemenu").addClass('componentBlockLoader');
								RemoteService.ajax({
									url: "getModels.htm",
									data: JSON.stringify(searchdata)
								}).then(function(response) {
									self.$(".treemenu").removeClass('componentBlock');
									self.$(".treemenu").removeClass('componentBlockLoader');
									self.$('.intrest_icons_ul').find('li').removeClass('selected').addClass('unselected');
									self.$('.intrest_icons_ul').find('li').children('#activeImages').removeClass("showInLineElem").addClass("hideElem");
									self.$('.intrest_icons_ul').find('li').children('#inActiveImages').removeClass('hideElem').addClass("showInLineElem");
									self.drpDwnResponse = "";
									self.generateHtml(response);
									//self.createTreeLi(response.models);
									_.each(currentValuesArray,function(values, index){
										var value = values.replace(/\s+/g,'');
										self.$('.example').find('li').find('a[data-value="'+value+'"]').removeClass('valueUnSelected').addClass('valueSelected');
										self.$('.example').find('li').find('a[data-value="'+value+'"]').children('.selectedimage').removeClass("hideElem").addClass("showInLineElem");
										self.$('.example').find('li').find('a[data-value="'+value+'"]').children('.unselectedimage').removeClass("showInLineElem").addClass("hideElem");
									});
									if(response.models.length > 0){
										setTimeout(function(){
											_.each(response.models,function(modelData, index){
											self.$('.intrest_icons_ul').find('li[data-value="'+modelData.categoryId+'"]').removeClass('unselected').addClass('selected');
											self.$('.intrest_icons_ul').find('li[data-value="'+modelData.categoryId+'"]').children('#activeImages').removeClass("hideElem").addClass("showInLineElem");
											self.$('.intrest_icons_ul').find('li[data-value="'+modelData.categoryId+'"]').children('#inActiveImages').removeClass('showInLineElem').addClass("hideElem");
										});},500);
									}
									self.trigger("removeLoader");
								});
							}else{
								var search = {
									"accountId": AccountService.getCurrentAccount().id,
									"option": "interest"
								}
								self.$(".treemenu").addClass('componentBlock');
								self.$(".treemenu").addClass('componentBlockLoader');
								RemoteService.ajax({
									url: "getModels.htm",
									data: JSON.stringify(search)
								}).then(function(respnse) {
									self.$(".treemenu").removeClass('componentBlock');
									self.$(".treemenu").removeClass('componentBlockLoader');
									self.$('.intrest_icons_ul').find('li').removeClass('selected').addClass('unselected');
									self.$('.intrest_icons_ul').find('li').children('#activeImages').removeClass("showInLineElem").addClass("hideElem");
									self.$('.intrest_icons_ul').find('li').children('#inActiveImages').removeClass('hideElem').addClass("showInLineElem");
									self.drpDwnResponse = "";
									self.generateHtml(respnse);
									//self.createTreeLi(response.models);
									_.each(currentValuesArray,function(values, index){
										var value = values.replace(/\s+/g,'');
										self.$('.example').find('li').find('a[data-value="'+value+'"]').removeClass('valueUnSelected').addClass('valueSelected');
										self.$('.example').find('li').find('a[data-value="'+value+'"]').children('.selectedimage').removeClass("hideElem").addClass("showInLineElem");
										self.$('.example').find('li').find('a[data-value="'+value+'"]').children('.unselectedimage').removeClass("showInLineElem").addClass("hideElem");
									});
								});
								self.trigger("removeLoader");
							}
					    },
					    wait: 500,
					    highlight: true,
					    captureLength: 0
					}
					self.$el.find('.searchInputField').typeWatch(options);
					self.open = false;
					$(document).on("click", function(e){
						if((self.$el.find(e.target).hasClass("nestableOuterDiv") || self.$el.find(e.target).parents(".nestableOuterDiv").length > 0) && self.showOnlyComponent==undefined){
							if(!self.open){
								self.$el.find('.nestableDrpDwn').removeClass('hideElem').addClass('showElem');
								
								//self.$(".treemenu").mCustomScrollbar({theme:"dark-thick"});
								self.open = true;
								if(self.open){
									self.test1 = $('#segmentParentContainer').scrollTop();
									var scrlval=self.test1+200;
									$('#segmentParentContainer').animate({scrollTop: scrlval});
									}
							}else{
								if(self.$el.find(e.target).children('.multiselectClick').length > 0){
									self.$el.find('.nestableDrpDwn').removeClass('showElem').addClass('hideElem');
									
									self.open = false;
								}else if(self.$el.find(e.target).parents('.multiselectClick').length > 0){
									self.$el.find('.nestableDrpDwn').removeClass('showElem').addClass('hideElem');
									
									self.open = false;
									if(!self.open){
										self.test1 = $('#segmentParentContainer').scrollTop();
										var scrlval=self.test1-100;
										$('#segmentParentContainer').animate({scrollTop: scrlval});
										}
									
								
								}else{
									self.$el.find('.nestableDrpDwn').removeClass('hideElem').addClass('showElem');
									//self.$(".treemenu").mCustomScrollbar({theme:"dark-thick"});
									self.open = true;
								}
							}
						}else if(self.showOnlyComponent==undefined){
							self.$el.find('.nestableDrpDwn').removeClass('showElem').addClass('hideElem');
							if(self.open){
								self.test1 = $('#segmentParentContainer').scrollTop();
								var scrlval=self.test1-50;
								$('#segmentParentContainer').animate({scrollTop: scrlval});
								}
							self.open = false;
							
						}
					});
					
					if(self.showOnlyComponent!=undefined && self.showOnlyComponent==true){
							self.$el.find(".treedrp_arow").addClass('hideElem');
							self.$el.find('.nestableDrpDwn').removeClass('hideElem').addClass('showElem');
					}
					self.trigger("removeLoader");
			});
			return this;
		},
		
		/*renderComponentDirectly:function(){
			
		},*/
		
		generateHtml : function(data){
			var currentId = this.$el.find('.example').attr('id');
			this.createTreeLi(data.models);
			this.$el.find('.tierOneTotal').text(data.statistics.tier1);
			this.$el.find('.tierTwoTotal').text(data.statistics.tier2);
			make_tree_menu(currentId);
		},
		
		createTreeLi : function(data){
			  this.$el.find('.example').html();
			  var self = this;
			  var list = "";
			  var ulId = self.$el.find('.example').attr('id');
			  if(data.length > 0){
				  _.each(data, function(item, index){
					  var mainLi = "";
					  if(item.isActive == "true"){
						  if(item.breakdown != undefined){
							  mainLi += '<li id='+item.name.replace(/\s+/g,'')+'><a id='+item.categoryId+' class="active valueUnSelected darkIcon" data-value='+item.name.replace(/\s+/g,'')+' data-modelName='+item.modelName+' data-model='+item.name.replace(/\s+/g,'')+'><img class="darkIcon unselectedimage showInLineElem circularbdr" src="static/img/category/'+item.categoryId+'_gray.svg"/><img class="darkIcon selectedimage hideElem circularbdr" src="static/img/category/'+item.categoryId+'.svg"/>'+item.name+'</a> (<span class="intValue">'+item.breakdown.length+'</span>)';
						  }else{
							  mainLi += '<li id='+item.name.replace(/\s+/g,'')+'><a id='+item.categoryId+' class="active valueUnSelected darkIcon" data-value='+item.name.replace(/\s+/g,'')+' data-modelName='+item.modelName+' data-model='+item.name.replace(/\s+/g,'')+'><img class="darkIcon unselectedimage showInLineElem circularbdr" src="static/img/category/'+item.categoryId+'_gray.svg"/><img class="darkIcon selectedimage hideElem circularbdr" src="static/img/category/'+item.categoryId+'.svg"/>'+item.name+'</a>';
						  }
					  }else{
						  if(item.breakdown != undefined){
							  mainLi += '<li id='+item.name.replace(/\s+/g,'')+'><a id='+item.categoryId+' class="inActive faintIcon" data-value='+item.name.replace(/\s+/g,'')+' data-modelName='+item.modelName+' data-model='+item.name+'><img class="faintIcon" src="static/img/category/'+item.categoryId+'_gray.svg">'+item.name+'</a> (<span class="intValue">'+item.breakdown.length+'</span>)';
						  }else{
							  mainLi += '<li id='+item.name.replace(/\s+/g,'')+'><a id='+item.categoryId+' class="inActive faintIcon" data-value='+item.name.replace(/\s+/g,'')+' data-modelName='+item.modelName+' data-model='+item.name+'><img class="faintIcon" src="static/img/category/'+item.categoryId+'_gray.svg">'+item.name+'</a>';
						  }	
					  }
					  if(item.breakdown != undefined){
						  var subul = "<ul>";
						  _.each(item.breakdown, function(items, index){
							  var subLi = "";
							  if(items.isActive == "true"){
								  subLi += '<li id='+items.name.replace(/\s+/g,'')+'><a id='+items.categoryId+' class="active valueUnSelected darkIcon circularbdr" data-value='+items.name.replace(/\s+/g,'')+' data-modelName='+items.modelName+' data-model='+items.name.replace(/\s+/g,'')+'><img class="darkIcon unselectedimage showInLineElem circularbdr" src="static/img/category/'+item.categoryId+'_gray.svg"> <img class="darkIcon selectedimage hideElem circularbdr" src="static/img/category/'+item.categoryId+'_sub.svg">'+items.name+'</a></li>';
							  }else{
								  subLi += '<li id='+items.name.replace(/\s+/g,'')+'><a id='+items.name.categoryId+' class="inActive faintIcon" data-value='+items.name.replace(/\s+/g,'')+' data-modelName='+items.modelName+' data-model='+items.namereplace(/\s+/g,'')+'><img class="faintIcon" src="static/img/category/'+item.categoryId+'_gray.svg">'+items.name+'</a></li>';
							  }
							  subul +=subLi;
						  });
						  subul += "</ul>";
						  mainLi += subul;
					  }
					  mainLi += '</li>';
					  list += mainLi;
				  });
				  //self.$el.find('#example'+self.timesofinitialization).html(list);
				  self.$('.example').html(list);
			  }else{
				  //self.$el.find('#example'+self.timesofinitialization).html('<span>No Records Found</span>');
				  self.$el.find('.example').html('<span class="noRecord">No Records Found</span>');
			  }
		},
		
		
		toggle : function(event){
			if(this.$el.find('.nestableDrpDwn').hasClass('hideElem')){
				this.$el.find('.nestableDrpDwn').removeClass('hideElem').addClass('showElem');
				self.test1 = $('#segmentParentContainer').scrollTop();
				var scrlval=self.test1+150;
				$('#segmentParentContainer').animate({scrollTop: scrlval});
				
			}else{
				this.$el.find('.nestableDrpDwn').removeClass('showElem').addClass('hideElem');
				self.test1 = $('#segmentParentContainer').scrollTop();
				var scrlval=self.test1-100;
				$('#segmentParentContainer').animate({scrollTop: scrlval});
			}
			//this.$(".treemenu").mCustomScrollbar({theme:"dark-thick"});
		},
		
		
		onSelect : function(event){
			this.$el.find('.tags').hide();
			this.$el.find('.tagsinput').show();
			var imagePath;
			if(this.isMaxReached!=undefined && this.isMaxReached==true){
				// do no thing
				//alert(i18next.t("app.maxLimitSegmentType"));
				$("#warning-modal-segmentInterestOverlap").show();
				$("#err-download-segmentInterestOverlap").show();
			}else{
				if($(event.target).hasClass('unselectedimage')){
					if(this.isMaxReached!=undefined && this.isMaxReached==true){
		 				// action to be taken if max limit is reached for the segment type.
						$("#warning-modal-segmentInterestOverlap").show();
						$("#err-download-segmentInterestOverlap").show();
		 			}else{
		 				$(event.target).removeClass("showInLineElem").addClass("hideElem");
						this.$el.find('.tags').addTag(($(event.target).parent().text()).trim());
						var datavalue = ($(event.target).parent().data('model')).replace(/\s+/g,'');
						this.$('.example').find('li').find('a[data-value="'+datavalue+'"]').children('.selectedimage').removeClass("hideElem").addClass("showInLineElem");
						var tempObj = this.$('.example').find('li').find('a[data-value="'+datavalue+'"]').children('.selectedimage');
						imagePath = $(tempObj[0]).attr('src');
						$(event.target).parent().removeClass('valueUnSelected').addClass('valueSelected');
						this.tags.push({
							"id": parseInt($(event.target).parent().attr('id')),
							"name":$(event.target).parent().text().trim()
						});
		 			}
				}else{
					$(event.target).children('.unselectedimage').removeClass("showInLineElem").addClass("hideElem");
					this.$el.find('.tags').addTag(($(event.target).text()).trim());
					var datavalue = ($(event.target).data('model')).replace(/\s+/g,'');
					var tempObj = this.$('.example').find('li').find('a[data-value="'+datavalue+'"]').children('.selectedimage');
					imagePath = $(tempObj[0]).attr('src');
					this.$('.example').find('li').find('a[data-value="'+datavalue+'"]').children('.selectedimage').removeClass("hideElem").addClass("showInLineElem");
					$(event.target).removeClass('valueUnSelected').addClass('valueSelected');
					this.tags.push({
						"id": parseInt($(event.target).attr('id')),
						"name":$(event.target).text().trim()
					});
				}
				var modelName = $(event.target).data('modelname');
				if(modelName==undefined)
					modelName = $(event.target).parent().data('modelname');
				this.trigger("valueSelectedFromInterestSelect");
				if(this.singleSelect!=undefined && this.singleSelect==true && this.tags!=undefined && this.tags.length>=1){
					if(this.isMaxReached!=undefined && this.isMaxReached==true){
						
					}else{
						this.trigger("elementSelected",this.tags[this.tags.length-1]["id"],this.tags[this.tags.length-1]["name"],imagePath,modelName);
					}
					
				}
			}
		},
		
		onDeSelect : function(event){
			if($(event.target).hasClass('selectedimage')){
				this.$('.tags').removeTag(($(event.target).parent().text()).trim());
				this.removeTag($(event.target).parent().text());
				//this.tags.remove($(event.target).parent().text());
				this.isMaxReached=false;
				var modelName = $(event.target).data('modelname');
				if(modelName==undefined)
					modelName = $(event.target).parent().data('modelname');
				this.trigger("removeElement",$(event.target).parent().attr('id'),modelName);
			}else{
				this.$('.tags').removeTag(($(event.target).text()).trim());
				this.removeTag($(event.target).text());
				//this.tags.remove($(event.target).text());
				this.isMaxReached=false;
				var modelName = $(event.target).data('modelname');
				if(modelName==undefined)
					modelName = $(event.target).parent().data('modelname');
				
				this.trigger("removeElement",$(event.target).attr('id'),modelName);
			}
		   
	   },
		
		removeTag : function(tag){
			var that = this;
			var dataValue = tag.replace(/\s+/g,'');
			//$('.example').find('li').find('a[data-value="'+dataValue+'"]').children('.selectedimage').removeClass("showInLineElem").addClass("hideElem");
			that.$('.example').find('li').find('a[data-value="'+dataValue+'"]').removeClass('valueSelected').addClass('valueUnSelected');
			that.$('.example').find('li').find('a[data-value="'+dataValue+'"]').children('.selectedimage').removeClass("showInLineElem").addClass("hideElem");
			that.$('.example').find('li').find('a[data-value="'+dataValue+'"]').children('.unselectedimage').removeClass("hideElem").addClass("showInLineElem");
			//if($(that).find('.tagsinput').children('span') != undefined || $(that).find('.tagsinput').children('span') != ""){
				if(that.$('.multiselectClick').find('.tagsinput').children('span').length == 0){
					that.$('.multiselectClick').find('.tags').show();
					that.$('.multiselectClick').find('.tagsinput').hide();
				}
			//}
			var tempArray = [];	
		   _.each(this.tags,function(value,index){
			  if(value.name.trim() != tag.trim()){
				  tempArray.push(value);
			  } 
		   });
		   this.tags = tempArray;
		   //this.trigger("valueSelectedFromInterestSelect");
		},
		
		removeInterestSelectedTag:function(ids, dataValue){
			this.isMaxReached=false;
			$('.example').find('li').find('a[data-modelname="'+dataValue+'"]').removeClass('valueSelected').addClass('valueUnSelected');
			$('.example').find('li').find('a[data-modelname="'+dataValue+'"]').children('.selectedimage').removeClass("showInLineElem").addClass("hideElem");
			$('.example').find('li').find('a[data-modelname="'+dataValue+'"]').children('.unselectedimage').removeClass("hideElem").addClass("showInLineElem");
			this.tags = _.without(this.tags, _.findWhere(this.tags, {id: parseInt(ids)}));
		},
		
		onImageSelection : function(event){
			var dataValue = $(event.target).parent().data('model');
			$(event.target).removeClass('unselected').addClass('selected');
			this.$('.intrest_icons_ul').find('li[data-model="'+dataValue+'"]').children('#activeImages').removeClass("hideElem").addClass("showInLineElem");
			this.$('.intrest_icons_ul').find('li[data-model="'+dataValue+'"]').children('#inActiveImages').removeClass('showInLineElem').addClass("hideElem");
			var filterValue = $(event.target).parent().attr('id');
			this.filterArray.push(filterValue);
			this.getFilterData(this.filterArray);
		},
		
		
		onImageDeSelection : function(event){
			var dataValue = $(event.target).parent().data('model');
			$(event.target).removeClass('selected').addClass('unselected');
			this.$('.intrest_icons_ul').find('li[data-model="'+dataValue+'"]').children('#inActiveImages').removeClass("hideElem").addClass("showInLineElem");
			this.$('.intrest_icons_ul').find('li[data-model="'+dataValue+'"]').children('#activeImages').removeClass('showInLineElem').addClass("hideElem");
		    this.filterArray = _.without(this.filterArray, $(event.target).parent().attr('id'));
			this.getFilterData(this.filterArray);
		},
		
		getFilterData : function(filterData){
			this.$el.find('.searchInputField').val('');
			var currentSelectedTags = this.$('.tags').val();
			var currentTagsArray = currentSelectedTags.split(",");
			var datafilter =  _.uniq(filterData);
			var filterString = "";
			var self = this;
			for(var i=0; i<datafilter.length; i++){
				if(datafilter.length == 1){
					filterString += ""+datafilter[i]+"##";
				}else{
					if(i == 0){
						filterString += datafilter[i];
					}else{
						filterString += "##"+datafilter[i];
					}
				}
			}
			var filterdata = "";
			if(filterString != ""){
				filterdata = {
						"accountId": ""+AccountService.getCurrentAccount().id,
						"filterBy": filterString,
						"option": "interest"
				};
			}else{
				filterdata = {
						"accountId": ""+AccountService.getCurrentAccount().id,
						"option": "interest"
				};
			}
				self.$(".treemenu").addClass('componentBlock');
				self.$(".treemenu").addClass('componentBlockLoader');
				RemoteService.ajax({
					url: "getModels.htm",
					data: JSON.stringify(filterdata)
				}).then(function(respse) {
					self.$(".treemenu").removeClass('componentBlock');
					self.$(".treemenu").removeClass('componentBlockLoader');
					self.drpDwnResponse = "";
					self.generateHtml(respse);
	        	    //self.createTreeLi(respse.models);
					_.each(currentTagsArray,function(names,index){
						var name = names.replace(/\s+/g,'');
						self.$('.example').find('li').find('a[data-value="'+name+'"]').removeClass('valueUnSelected').addClass('valueSelected');
						self.$('.example').find('li').find('a[data-value="'+name+'"]').children('.selectedimage').removeClass("hideElem").addClass("showInLineElem");
						self.$('.example').find('li').find('a[data-value="'+name+'"]').children('.unselectedimage').removeClass("showInLineElem").addClass("hideElem");
					});
				});	
				self.trigger("removeLoader");
		},
		
		selectedValuesFromListForEdit:function(){
			var self = this;
			_.each(this.selectedElementsArray,function(selectedText,index){
				self.$el.find('.tags').addTag(selectedText.name);
				self.tags.push({
					"id": selectedText.id,
					"name": selectedText.name
				});
				var datavalue = selectedText.name.replace(/\s+/g,'');
				self.$('.example').find('li').children('#'+selectedText.id).removeClass('valueUnSelected').addClass('valueSelected');
				if(self.singleSelect!=undefined && self.singleSelect==true){
					self.$('.example').find('li').find('a[data-modelName="'+datavalue+'"]').children('.unselectedimage').removeClass("showInLineElem").addClass("hideElem");
					self.$('.example').find('li').find('a[data-modelName="'+datavalue+'"]').children('.selectedimage').removeClass("hideElem").addClass("showInLineElem");
				}else{
					self.$('.example').find('li').find('a[data-value="'+datavalue+'"]').children('.unselectedimage').removeClass("showInLineElem").addClass("hideElem");
					self.$('.example').find('li').find('a[data-value="'+datavalue+'"]').children('.selectedimage').removeClass("hideElem").addClass("showInLineElem");
				}
				
				self.$el.find('.tags').hide();
				self.$el.find('.tagsinput').show();
			});
			this.trigger("valueSelectedFromInterestSelect");
		},
		
		getSelection: function(){
			//return this.tags;
			//var tagsValues = this.$('.tags').val();
			//var tagsArray = tagsValues.split(",");
			var obj=[];
			$.each(this.tags,function(index,tag){
				obj.push(tag);
			});
			return obj;
		},
		/*
		 * This function will be called from SegmentTypelistView
		 * To notify that for particular segment type max limit is reached. 
		 */
		setMaxLimitReachedForSegmentType:function(){
			this.isMaxReached = true;
		},
		
		/*
		 * This function will be called from SegmentTypelistView
		 * To remove max limit. 
		 */
		removeMaxLimitReachedForSegmentType:function(){
			this.isMaxReached = false;
		},
		
		closeErrorPopUp : function(e){
			$('#warning-modal-segmentInterestOverlap').hide();
			$("#err-download-segmentInterestOverlap").hide();
		}
		
	});
	
	return View;
	
});