define(["backbone"],function(Backbone){
	var Model = Backbone.Model.extend({
		
		initialize: function(attributes, options) {
		      console.log(options.response);
		      this.options = options;
		  },
		parse: function(resp){
			console.log(resp.response);
			console.log(resp.advertiserId);
			this.modelArrays = resp.response.models;
			console.log(this.modelArrays.length);
			this.createAccoutAdvertiserList(this.modelArrays);
			if(resp.advertiserId!=undefined && resp.advertiserId!=null && resp.advertiserId!=''){
				this.filterAdvertiserListforAdvertiserId(resp.advertiserId);
			}
			this.cerateAdvertiserFeedBackLookAlikes();
			this.selectedList;
			return resp;
		},
		filterData : function(scope,tabSelected,orderBy,orderByColumn,searchKey,advertiserId){
			console.log(scope);
			console.log(tabSelected);
			console.log(orderBy);
			console.log(orderByColumn);
			console.log(searchKey);
			var self=this;
			var resultList;
			var selectedList;
			if(scope=='advertiser'){
				if(tabSelected=='lookAlikes'){
				resultList = self.advertiserLookAlikes;
				if(self.modelArrays.length>0){
					resultList = self.toJSON()["response"]["models"];
				}
				}else if(tabSelected=='feedBackLookAlikes'){
					resultList = self.advertiserFeedBackLookAlikes;
				}else if(tabSelected=='demographic'){
					resultList = self.toJSON()["response"]["models"];
				}
			}else if(scope=='account'){
				resultList = self.accountList;
			}else{
				resultList = this.modelArrays;
			}
			if(resultList !=null && resultList!=undefined && resultList.length>0){
				if(searchKey!=null && searchKey!=undefined && searchKey!=''){
					resultList = self.searchOnList(resultList , searchKey);
					if(orderBy!=null && orderBy!=undefined && orderBy!='' && orderByColumn!=null && orderByColumn!=undefined && orderByColumn!=''){
						if(orderByColumn=='whencreated'){
							resultList=self.sortListBasedOnDate(resultList,orderBy);
							return resultList;
						}else if(orderByColumn=='name'){
							resultList=self.sortListBasedOnAlphabet(resultList,orderBy);
							return resultList; 
						}
					}
				}else{
					console.log('selected field is null');
					if(orderBy!=null && orderBy!=undefined && orderBy!='' && orderByColumn!=null && orderByColumn!=undefined && orderByColumn!=''){
						if(orderByColumn=='whencreated'){
							resultList=self.sortListBasedOnDate(resultList,orderBy);
							return resultList;
						}else if(orderByColumn=='name'){
							resultList=self.sortListBasedOnAlphabet(resultList,orderBy);
							return resultList;
						}
					}
				}
			}else{
				return [];
			}
		},
		getTotalAdvertisersCount:function(){
			//return this.advertiserList.length;
			var obj = {};
			obj['totalAdvs']=this.advertiserList.length;
			obj['lookAlike']=this.advertiserLookAlikes.length;
			obj['feedBackLookAlike']=this.advertiserFeedBackLookAlikes.length;
			return obj;
		},
		createAccoutAdvertiserList : function(modelArrays){
			this.accountList = [];
			this.advertiserList=[];
			var self=this;
			$.each(modelArrays,function(index,models){
				console.log(models.advertiserId);
				if(models.advertiserId!=undefined && models.advertiserId!=null){
					self.advertiserList.push(models);
				}else{
					//self.advertiserList.push(models);
					self.accountList.push(models);
				}
			});
			console.log('accountList length-->' + this.accountList.length);
			console.log('advertiserList length-->' + this.advertiserList);
		},
		filterAdvertiserListforAdvertiserId : function(advertiserId){
			console.log(JSON.stringify(this.advertiserList));
			console.log(this.advertiserList.length);
			var advertiserListNew =[];
			$.each(this.advertiserList,function(index,advertiserElement){
				if(advertiserElement.advertiserId==advertiserId){
					advertiserListNew.push(advertiserElement);
				}
			});
			this.advertiserList=advertiserListNew;
			console.log(this.advertiserList);
		},
		cerateAdvertiserFeedBackLookAlikes : function(){
			var self=this;
			this.advertiserFeedBackLookAlikes=[];
			this.advertiserLookAlikes=[];
			if(this.advertiserList!=null && this.advertiserList!=undefined && this.advertiserList.length>0){
				$.each(this.advertiserList,function(index,advertiserJson){
					if(advertiserJson.campaignId!=null && advertiserJson.campaignId!=undefined){
						self.advertiserFeedBackLookAlikes.push(advertiserJson);
					}else{
						self.advertiserLookAlikes.push(advertiserJson);
					}
				});
			}
		},
		sortListBasedOnAlphabet:function(modelList,order){
			if(order=='asc'){
				modelList.sort(function(a,b) {
				    if ( a.name.toUpperCase() < b.name.toUpperCase())
				        return -1;
				    if ( a.name.toUpperCase() > b.name.toUpperCase())
				        return 1;
				    return 0;
				} );
			}else if(order=='desc'){
				modelList.sort(function(a,b) {
				    if ( a.name.toUpperCase() < b.name.toUpperCase())
				        return 1;
				    if ( a.name.toUpperCase() > b.name.toUpperCase())
				        return -1;
				    return 0;
				} );
			}
			return modelList;
		},
		sortListBasedOnDate : function(modelList,order){
			if(order=='asc'){
				modelList.sort(function(a,b) {
			    if ( new Date(a.creationDate).getTime()< new Date(b.creationDate).getTime())
			        return -1;
			    if ( new Date(a.creationDate).getTime()> new Date(b.creationDate).getTime() )
			        return 1;
			    return 0;
				} );
			}
			else if(order=='desc'){
				modelList.sort(function(a,b) {
				if ( new Date(a.creationDate).getTime()< new Date(b.creationDate).getTime())
			        return 1;
			    if ( new Date(a.creationDate).getTime()> new Date(b.creationDate).getTime() )
			        return -1;
			    return 0;
				} );
			}
			return modelList;
		},
		searchOnList : function(modelList,searchKey){
			var searchedList = _.filter(modelList, function(val){
				 return val.name.toUpperCase().indexOf(searchKey.toUpperCase())> -1; 
				});
			
			return searchedList;
		}
		
		
	}); 
	
	return Model;
});