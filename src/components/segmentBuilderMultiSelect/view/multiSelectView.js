define([
        'jquery',
        'backbone',
        'underscore',
        'text!components/segmentBuilderMultiSelect/tpl/multiSelectTpl.html',
        'services/RemoteService'       
    ],

    function($, Backbone, _, MultiSelectionTpl, RemoteService) {

        var view = Backbone.View.extend({

            events: {
                "click #selectionContainer": "renderDropDown"
                // "click .js-multi-select-dd": "rendermultiDropdown"
            },

            initialize: function(opt) {
                var self = this;
                this.option = opt;
                this.tpl = _.template(MultiSelectionTpl);
                this.$el.html(this.tpl());
                this.dropDownRendered = false;
                this.url = opt.url;
                this.objectType = opt.objectType;
                this.accountId = opt.accountId;
                this.searchedKey;
                this.isEdit = opt.isEdit;
                this.componentName = opt.componentName;
                this.selectedElementArray = opt.selectedElementArray;
                this.selectedElementIds = opt.selectedElementIds;
                this.pageNumber = 1;
                this.rowsPerPage = opt.rowsPerPage;
                this.isServerSidePagination = opt.isServerSidePagination;
                this.totalRecords;
                this.serverResponse;
                this.isDataPartner = opt.isDataPartner;
                this.$multiSelectDropdown = this.$('.js-multi-select-dd');                
                this.tags = [];
                this.advertiserIds = [];
                this.isServerSearch = false;
                this.$(".parentDiv").data("isopen", false);
                $(document).on("click", function(e) {
                	
                    if (self.$(e.target).hasClass("parentDiv") || self.$(e.target).parents(".parentDiv").length > 0) {
                    	
                    	if($(e.target).parents("#advertiserList").length == 0){
                    		return;
                    	}
                        self.$("#filterContainer").show();
                        self.$(".multiselect_content").show();
                        if (!self.$(".parentDiv").data("isopen")) {
                            self.test1 = $('#segmentParentContainer').scrollTop();
                            var scrlval = self.test1 + 100;
                            $('#segmentParentContainer').animate({
                                scrollTop: scrlval
                            });
                        }
                        self.$(".parentDiv").data("isopen", true);
                    } else {

                        self.$("#segmentBuilderMultiSelectList").hide();
                        self.$("#filterContainer").hide();
                        self.$(".multiselect_content").hide();
                        if (self.$(".parentDiv").data("isopen")) {
                            self.test1 = $('#segmentParentContainer').scrollTop();
                            var scrlval = self.test1 - 60;
                            $('#segmentParentContainer').animate({
                                scrollTop: scrlval
                            });
                        }
                        self.$(".parentDiv").data("isopen", false);
                    }
                });

                if(this.option.componentName === 'DEVICE VENDOR' || this.option.componentName === 'DEVICE MODEL' || this.option.componentName === 'CITY' || this.option.componentName === 'COUNTRY' || this.option.componentName === 'BROWSER' || this.option.componentName === 'OS'){
                    this.$multiSelectDropdown.find('.text').text('SEARCH '+this.componentName);
                } else {
                    this.$multiSelectDropdown.find('.text').text('SELECT '+this.componentName);
                }

                this.$multiSelectDropdown.dropdown({
                    forceSelection: false,
                    onAdd: function(addedValue, addedText, $addedChoice){
                        this.onItemSelection(addedValue, addedText, $addedChoice);
                    }.bind(this), 

                    onRemove: function(removedValue, removedText, $removedChoice){
                        this.onItemRemove(removedValue, removedText, $removedChoice);
                    }.bind(this)
                });

            },

            onItemSelection: function(addedValue, addedText, $addedChoice, from){

                this.tags.push(addedText);
                if(this.advertiserIds!=undefined){
                    this.advertiserIds.push($addedChoice.data('advid'));
                }
                setTimeout(function(){
                    if(from === 'serverSearch'){
                        this.isServerSearch = true;
                        this.trigger("valueSelectedFromMultiSelect", this.getSelection(from));
                    } else {
                        this.isServerSearch = false;
                        this.trigger("valueSelectedFromMultiSelect", this.getSelection());
                    }
                }.bind(this), 1000)                                    
            },

            onItemRemove : function(removedValue, removedText, $removedChoice){
                this.tags = _.without(this.tags, removedText);
                this.advertiserIds = _.without(this.advertiserIds, $removedChoice.data('advid'));
                setTimeout(function(){          
                    this.trigger("valueSelectedFromMultiSelect", this.getSelection())
                }.bind(this), 1000)                                    

            },

            rendermultiDropdown: function(){

                var $menu = this.$multiSelectDropdown.find('.menu');
                $menu.empty();
                if(this.serverResponse && this.serverResponse.length > 0){
                    $menu.find('.message').remove();
                    this.serverResponse.forEach(function(item, index){
                        $menu.append('<div class="item" data-advid="'+item.id+'" data-value="'+item.id+'">' + item.text + '</div>');
                    });
                }            

            },
            
            render: function() {
                if (this.isServerSidePagination) {
                    this.registerScrolling();
                }

                if(this.option.componentName === 'DEVICE VENDOR' || this.option.componentName === 'DEVICE MODEL' || this.option.componentName === 'CITY' || this.option.componentName === 'COUNTRY' || this.option.componentName === 'BROWSER' || this.option.componentName === 'OS'){
                    if (this.isEdit != undefined && this.isEdit != null && this.isEdit != '' && this.isEdit) {
                        this.renderServerMultiDropdown();

                        setTimeout(function(){
                            this.selectedElementArray.forEach(function(item, index){
                                this.$multiSelectDropdown.dropdown('set selected', item.name);
                                this.tags.push(item.name);
                            }.bind(this));
                        }.bind(this), 1000);
                    }

                    return this.serverSearch();
                } else {
                    var requestJson = this.createServerRequest();
                    return this.callServer(requestJson);
                }
            },

            renderServerMultiDropdown: function(){
                var $menu = this.$multiSelectDropdown.find('.menu');
                $menu.empty();
                if(this.selectedElementArray && this.selectedElementArray.length > 0){
                    $menu.find('.message').remove();
                    this.selectedElementArray.forEach(function(item, index){
                        $menu.append('<div class="item" data-value="'+item.id+'" data-text="'+item.name+'">' + item.name + '</div>');
                    });
                }

            },

            serverSearch : function(){
                var self = this;
                this.$multiSelectDropdown.find('.dropdown.icon').css('pointer-events', 'none'); // Hide down arrow icon in dropdown
                this.$multiSelectDropdown.dropdown({
                    fullTextSearch : false,
                    showOnFocus : false,
                    direction : "downward",
                    minCharacters : 1,
                    apiSettings: {
                        url : "getReportData.htm",
                        method : 'POST',
                        throttle : 300,
                        cache : false,
                        contentType: 'application/json; charset=utf-8',
                        beforeSend: function (settings) {
                            var value = $(this).find('.sizer').text();
                            if(value.length){
                                $(this).find('.dropdown.icon').css('pointer-events', 'all'); // Show down arrow icon in dropdown
                                settings.data = JSON.stringify(
                                    {
                                        "operation": "add",
                                        "queryString": "action=query&rowsPerPage=1000&pageNumber=1",
                                        "entity": "topographicValues",
                                        "id": self.objectType,
                                        "accountId": self.accountId,
                                        "searchBy": value
                                    }
                                );
                                return true;
                            }
                        },
                        onResponse: function(response) {
                            self.$multiSelectDropdown.removeClass('loading');
                            var responseData = self.parseResponse(response);
                            self.serverResponse = responseData;


                            var getAllSelectedValues = self.$multiSelectDropdown.dropdown('get value');
                            if(getAllSelectedValues){ // hide already selected value(s)
                                var getAllSelectedValues = getAllSelectedValues.split(',');
                                getAllSelectedValues.forEach(function(item, index) {
                                    return responseData = _.without(responseData, _.findWhere(responseData, { id: item }));
                                });
                            }

                            if(responseData.length == 0){
                                self.addFilteredItems();
                            }

                            return {results : responseData};
                        }
                    },
                    onAdd: function(addedValue, addedText, $addedChoice){
                        this.onItemSelection(addedValue, addedText, $addedChoice, 'serverSearch');
                    }.bind(this),
                    onRemove: function(removedValue, removedText, $removedChoice){
                         this.onItemRemove(removedValue, removedText, $removedChoice);
                    }.bind(this),
                    onShow: function(){
                        this.addFilteredItems();
                    }.bind(this)
                });
             },

            addFilteredItems: function(){
              var $menu = this.$multiSelectDropdown.find('.menu');

               setTimeout(function(){
                  var getAllSelectedValues = this.$multiSelectDropdown.dropdown('get value');
                  if(getAllSelectedValues){ // hide already selected value(s)
                     var getAllSelectedValues = getAllSelectedValues.split(',');
                     getAllSelectedValues.forEach(function(item, index) {
                         $menu.append('<div class="item active filtered" data-value="'+item+'" data-text="'+item+'">' + item + '</div>');
                     });
                  }
              }.bind(this), 1000);
            },

            showSelectValues: function() {
            	if (this.isEdit != undefined && this.isEdit != null && this.isEdit != '' && this.isEdit) {
                    this.selectValueFromListForEdit();
                }
            },

            refreshList: function(pageNumber, isAppend) {

                var callServerFlag = false;

                if (this.isServerSidePagination) {
                    if (self.totalRecords != null && self.totalRecords != undefined) {
                        var maxPageNumber = Math.ceil(self.totalRecords / this.rowsPerPage);
                        console.log(maxPageNumber);
                        if (this.pageNumber <= maxPageNumber) {
                            callServerFlag = true;
                        }
                    } else {

                        callServerFlag = true;
                    }

                } else {
                    callServerFlag = true;
                }


                if (callServerFlag) {
                    var requestJson = this.createServerRequest();
                    this.callServerPagination(requestJson);
                }
            },
            
            /*
             * This function register scrolling
             */
            registerScrolling: function() {
                // scroll event of div
                var self = this;

                this.$('#segmentBuilderMultiSelectList').scroll(function() {
                    // get the max and current scroll
                    var maxScroll = $(this)[0].scrollTop;
                    var currScroll = $(this)[0].scrollHeight - $(this).height();
                    // are we at the bottom

                    if (currScroll == maxScroll) {

                        $(this)[0].scrollTop = $(this)[0].scrollHeight - $(this).height();
                        self.pageNumber++;
                        self.refreshList(self.pageNumber, true);
                    }
                    //scroll to the bottom of the div
                    //load again
                });
            },
            
            callServerPagination: function(requestJson) {
                var self = this;
                RemoteService.ajax({
                    url: this.url,
                    data: JSON.stringify(requestJson)
                }).then(function(response) {

                    var responseData = self.option.formatData == false ? self.formData(response.advertisers) : self.parseResponse(response);

                    if (self.serverResponse) {
                        for (var k = 0; k < responseData.length; k++) {
                            var _tempObj = self.isObjectPresentInArray(responseData[k]["id"], self.serverResponse);

                            if (!_tempObj) {
                                self.serverResponse.push(responseData[k]);
                            }
                        }
                    } else {
                        self.serverResponse = responseData;
                    }

                    if (responseData.length > 0) {
                        $.each(responseData, function(index, dropDownElement) {
                            if (dropDownElement != '' && dropDownElement != ' ' && dropDownElement.id != '') {
                                var spanClass = dropDownElement.text.replace(" ", "");
                                self.$("#segmentBuilderMultiSelectList")
                                    .removeClass('norecord')
                                    .append("<li><span class='" + spanClass + "' data-advid='" + dropDownElement.id + "' title='" + dropDownElement.text.toUpperCase().replace("'", "&#39;") + "'>" + dropDownElement.text + "</span><button class='light liclass'></button></li>");
                                self.$(".light").unbind("click");
                                self.$(".light").bind('click', $.proxy(self.onSelect, self));
                            }
                        });
                    }

                });
            },
            
            callServer: function(requestJson) {
                var self = this;
                this.$multiSelectDropdown.addClass('loading');
                return RemoteService.ajax({
                    url: this.url,
                    data: JSON.stringify(requestJson)
                }).then(function(response) {
                    self.$multiSelectDropdown.removeClass('loading');
                    var responseData = self.option.formatData == false ? self.formData(response.advertisers) : self.parseResponse(response);
                    if (self.serverResponse) {
                        for (var k = 0; k < responseData.length; k++) {
                            var _tempObj = self.isObjectPresentInArray(responseData[k]["id"], self.serverResponse);

                            if (!_tempObj) {
                                self.serverResponse.push(responseData[k]);
                            }
                        }
                    } else {
                        self.serverResponse = responseData;
                    }

                    self.rendermultiDropdown()
                    self.totalRecords = self.option.formatData == false ? response.totalRows : response['genericQueryResults']['topographic']['paging'].totalRows;

                    self.$('[name="tags"]').text(self.option.placeholder ? self.option.placeholder : ("SELECT " + self.componentName));
                    self.showSelectValues();

                });
            },                    

            isObjectPresentInArray: function(id, array) {
                var flag = false;
                for (var i = 0; i < array.length; i++) {
                    if (typeof array[i] != "undefined") {
                        if (array[i]["id"] == id) {
                            flag = true;
                        }
                    }
                }

                return flag;
            },

            createServerRequest: function() {
                var request = {};

                request['operation'] = this.option.operation ? this.option.operation : 'add';
                request['queryString'] = 'action=query';
                if (this.searchedKey == null || this.searchedKey == undefined || this.searchedKey == '') {
                    request['queryString'] = request['queryString'] + "&rowsPerPage=" + this.rowsPerPage;
                    request['queryString'] = request['queryString'] + "&pageNumber=" + this.pageNumber;
                }

                request['entity'] = this.option.entity ? this.option.entity : 'topographicValues';
                if (this.option.useId !== false) {
                    request['id'] = this.objectType;
                }
                request['accountId'] = this.accountId;
                if (this.searchedKey != null && this.searchedKey != undefined && this.searchedKey != '') {
                    if (this.option.searchByPrefix) {
                        request['queryString'] = request['queryString'] + "&searchBy=" + this.option.searchByPrefix + this.searchedKey;
                    } else {
                        request['searchBy'] = this.searchedKey;
                    }
                }

                if (this.option.additionalQueryParams) {
                    _.each(this.option.additionalQueryParams, function(value, key, list) {
                        request['queryString'] = request['queryString'] + "&" + key + "=" + value;
                    });
                }
                return request;

            },
            
            parseResponse: function(response) {
                var fields = response['genericQueryResults']['topographic']['fields'];
                var topographicValueIndex = this.getTopographicValueIndex(fields);
                var recordsArray = response['genericQueryResults']['topographic']['records'];
                var data = this.formMultiSelectListdata(recordsArray, topographicValueIndex);

                return data;
            },

            getTopographicValueIndex: function(jsonOBJ) {
                var index = jsonOBJ.map(function(d) {
                    return d['name'];
                }).indexOf('TopographicValue');
                return index;
            },

                formMultiSelectListdata: function(recordsArray, topographicValueIndex) {
                    var data = [];
                    $.each(recordsArray, function(index, record) {
                        data.push({
                            'id': record[topographicValueIndex],
                            'text': record[topographicValueIndex],
                            'name': record[topographicValueIndex],
                            'value': record[topographicValueIndex]
                        });
                    });

                    return data;
                },

            formData: function(recordsArray) {
                var data = [];
                $.each(recordsArray, function(index, record) {
                    data.push({
                        'id': record["id"],
                        'text': record["name"]
                    });
                });

                return data;
            },

            renderDropDown: function(event) {
                var self = this;
                if (!this.dropDownRendered) {

                    var dropDownArray = this.serverResponse;

                    if (dropDownArray.length > 0) {
                        $.each(dropDownArray, function(index, dropDownElement) {
                            if (dropDownElement != '' && dropDownElement != ' ' && dropDownElement.id != '') {
                                var spanClass = dropDownElement.text.replace(/\s+/g, '');
                                spanClass = spanClass.replace("/", "");

                                if (self.isDataPartner && self.isDataPartner != undefined) {
                                    var spanClassWithoutDot = spanClass.replace(/[`~!@#$%^&*()|+\=?;:'",<>\{\}\[\]\\\/]/gi, '');
                                } else {
                                    var spanClassWithoutDot = spanClass.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
                                }
                                self.$("#segmentBuilderMultiSelectList")
                                    .removeClass('norecord')
                                    .append("<li><span class='" + spanClassWithoutDot + " multiselectellipsis' data-advid='" + dropDownElement.id + "' data-value='" + spanClass + "' title='" + dropDownElement.text.toUpperCase().replace("'", "&#39;") + "'>" + dropDownElement.text + "</span><button class='light liclass'></button></li>");
                            }
                        });
                    } else {
                        self.$("#segmentBuilderMultiSelectList").addClass('norecord').append("<span>No records found<span>");
                    }
                    self.$("#filterContainer").show();
                    self.$(".light").bind('click', $.proxy(self.onSelect, self));
                    self.dropDownRendered = true;
                }
                if (this.isEdit != undefined && this.isEdit != null && this.isEdit != '' && this.isEdit) {
                    this.showSelectedFromListForEdit();
                }
                this.$(".multiselect_content").show();
                this.$("#segmentBuilderMultiSelectList").show();

            },                       
            
            removeTag: function(tag) {
                var tag_exists = !_.isEmpty(_.where(this.selectedElementArray, {
                    name: tag
                }));
                if (typeof this.selectedElementArray != "undefined" && this.selectedElementArray.length > 0 && tag_exists) {
                    var result = _.findWhere(this.selectedElementArray, {
                        name: tag
                    });
                    this.advertiserIds = _.without(this.advertiserIds, result.id);
                } else {
                    this.advertiserIds = _.without(this.advertiserIds, this.$("." + spanClass).data('advid'));
                }

                if (this.isDataPartner && this.isDataPartner != undefined) {
                    var spanClassWithSpaces = tag.replace(/[`~!@#$%^&*()|+\=?;:'",<>\{\}\[\]\\\/]/gi, "");
                } else {
                    var spanClassWithSpaces = tag.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "");
                }


                var spanClass = spanClassWithSpaces.replace(/\s+/g, '');
                this.tags = _.without(this.tags, tag);


                this.$("." + spanClass).next().removeClass('dark');
                this.$("." + spanClass).next().addClass('light');

                if (this.$('.tagsinput').children('span').length == 0) {
                    this.$('.tagsinput').hide();
                    this.$('[name="tags"]').show();
                }

                this.trigger("tagRemoved", this.getSelection());
            },
            
            removeAllTags: function() {
                this.tags = [];
                this.advertiserIds = [];
                this.$('.tagsinput').children('span').remove();
                this.$('[name="tags"]').show();
                this.$(".multiselectellipsis").next().removeClass('dark');
                this.$(".multiselectellipsis").next().addClass('light');
                this.$("#segmentBuilderMultiSelectList li").each(function() {
                    $(this).find("button").removeClass('dark').addClass('light');
                });
                this.$('#tags').importTags("");
            },
            
            searchOnList: function(modelList, searchKey) {
                var searchedList = _.filter(modelList.data, function(val) {
                    return val.text.toUpperCase().indexOf(searchKey.toUpperCase()) > -1;
                });
                return searchedList;
            },                                

            getSelection: function(from) {
                var tagsArray = this.$multiSelectDropdown.dropdown('get values');
                var self = this;

                this.tags = _.intersection(this.tags, tagsArray);

                var obj = [];
                console.log(this.serverResponse);
                $.each(this.tags, function(index, tag) {
                    if(self.isEdit === true){
                        obj.push({
                            'id': tag,
                            'name': tag
                        });
                    }else{
                        if(from == 'serverSearch'){
                            obj.push({
                                'id': tag ,
                                'name': tag
                            });
                        } else {
                         var tagObj = _.findWhere(self.serverResponse, {
                                "text": tag
                            });
                            if (tagObj != null) {
                                obj.push({
                                    'id': tagObj["id"],
                                    'name': tagObj["text"]
                                });
                            }
                        }
                    }
                });
                return obj;

            },
            
            getCommaSeperatedKeys: function() {
                return this.advertiserIds.join(",");
            },
            
            selectValueFromListForEdit: function() {

                this.rendermultiDropdown();
                
                this.$multiSelectDropdown.dropdown({
                    forceSelection: false,
                    onAdd: function(addedValue, addedText, $addedChoice){
                        this.onItemSelection(addedValue, addedText, $addedChoice);
                    }.bind(this), 

                    onRemove: function(removedValue, removedText, $removedChoice){
                        this.onItemRemove(removedValue, removedText, $removedChoice);
                    }.bind(this),

                    onShow: function() {
                        var itemLen = this.$multiSelectDropdown.find('.menu .item').map(function(index, item){
                            return $(item).text().length;
                        });

                        var maxLen = _.max(itemLen);
                        if(maxLen > 36){
                            this.$multiSelectDropdown.find('.menu').css('min-width', (maxLen+136)+'%');
                        }else if(maxLen > 26 && maxLen <= 36) {
                            this.$multiSelectDropdown.find('.menu').css('min-width', (maxLen+100)+'%');
                        }else {
                            this.$multiSelectDropdown.find('.menu').css('min-width', '100%');
                        }
                    }.bind(this)
                });

                this.selectedElementArray.forEach(function(item, index){
                    this.$multiSelectDropdown.dropdown('set selected', item.name);
                    this.tags.push(item.name);
                }.bind(this));

                this.advertiserIds = this.selectedElementIds;
                this.trigger("valueSelectedFromMultiSelect");                         
            },
            
            showSelectedFromListForEdit: function() {
                var classOfListItemToBeSelected,
                    self = this;
                if (this.tags.length === 0 || !(this.tags.length == 1 && this.tags[0] == "")) {
                    var tagsValues = this.$('.tags').val();
                    this.tags = tagsValues.split(",");
                }
                if (!(this.tags.length == 1 && this.tags[0] == "")) {
                    $.each(this.tags, function(index, selectedText) {
                        if (self.isDataPartner && self.isDataPartner != undefined) {
                            classOfListItemToBeSelected = selectedText.replace(/[`~!@#$%^&*()|+\=?;:'",<>\{\}\[\]\\\/]/gi, "");
                        } else {
                            classOfListItemToBeSelected = selectedText.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "");
                        }
                        classOfListItemToBeSelected = classOfListItemToBeSelected.replace(/\s+/g, '');
                        self.$('.' + classOfListItemToBeSelected).next().removeClass('light');
                        self.$('.' + classOfListItemToBeSelected).next().addClass('dark');
                    });
                }
            },

            onAddTag: function() {
                this.$("[href='#']").attr("href", "javascript:void(0)");
            },
            
            getSelectedElementIds: function(){
            	return this.advertiserIds;
            }
        });

        return view;

    });