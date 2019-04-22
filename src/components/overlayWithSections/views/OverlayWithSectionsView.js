define([
        'jquery', 'backbone', 'underscore',
        'text!components/overlayWithSections/tpl/tpl.html',
        'common/services/HierarchicalService',
        "common/services/ConfigService",
        'i18next'
    ],

    function($, Backbone, _, Tpl, HierarchicalService, ConfigService, i18next) {

        var View = Backbone.View.extend({

            events: {
                "click .ui.link > a": "handleSelection"
            },

            initialize: function(opt) {
                this.opt = opt;
                this.$el.addClass("outerDivOverlay");
                this.disableExpand = false;
                this.isDependent = HierarchicalService.isDependentAccount();
                this.test1;
                this.deviceRadioSelected = true;
                this.listenTo(this, "modelingLevelCheck", function(value){
                    this.modelingRadioSelection(value);
                }.bind(this));
            },
            
            cacheDom: function() {
                this.$jsColFive = this.$('.js-five-column');
                this.$jsColEleven = this.$('.js-eleven-column');
                this.$cookieColShow = this.$('.js-cookie-show');
                this.$mobileColhide = this.$('.js-mobile-hide');                      
                this.$jsSelectedSegment = this.$('.js-selected-seg');                      
                this.$overlayMainDropdown = this.$('.js-overlay-main-dropdown');                      
            },

            render: function(value) {
                
                if(!value) {
                    this.appendTpl(this.opt["getExternalScope"]());
                    if(this.opt.modelName === 'Lookalike'){
                        this.$el.find('.mega-dropdown').removeClass('mega-dropdown').addClass('small-mega-dropdown');
                    }
                }

                this.cacheDom();
                this.$el.find('.menu .browse')
                .popup({
                  on: 'click',
                  position : 'bottom left',
                  delay: {
                    show: 300,
                    hide: 800
                  }
                });
                return this;
            },

            modelingRadioSelection: function(value) {
                if(value === 'DEVICE_IOS' || value === 'DEVICE_GOG') {
                    this.deviceRadioSelected = false;    
                }else {
                    this.deviceRadioSelected = true;    
                }
            },

            appendTpl: function(_scope) {
                var dependentSegments = ['userIsInInterestSegment', 'userIsNotInInterestSegment', 'userIsInIntentSegment', 'userIsNotInIntentSegment', 'userIsInPredictedSegment', 'userIsNotInPredictedSegment'];
                var temp1 = _.where(this.opt.data.observed.options, {
                    "sectionNo": "1"
                });
                var temp2 = _.where(this.opt.data.observed.options, {
                    "sectionNo": "2"
                });
                var temp3 = _.where(this.opt.data.observed.options, {
                    "sectionNo": "3"
                });
                var temp4 = this.opt.data.modelled.attributeName;
                var temp5 = _.where(this.opt.data.modelled.options, {
                    "sectionNo": "1"
                });
                var arrTemp = [];

                if (typeof this.opt.forBuildModel != "undefined") {
                    if (temp1.length > 1) {
                        var allowedVal = temp1[1]["options"][0] == null ? {} : _.findWhere(temp1[1]["options"], {
                            "name": "campaignLastClick"
                        });

                        var _campaignId = this.opt.getCampaignId();

                        _campaignId = _campaignId == null ? "" : _campaignId;

                        if ((this.opt.getExternalScope() != "account" && _campaignId.length != 0 && this.opt.getCampaignId() != "-") || this.opt.isInEditMode || (this.opt.isForEdit && this.opt["isAccOrAdv"] != "account" && this.opt["campaignId"])) {
                            temp1[1]["options"] = [allowedVal];
                            arrTemp[0] = temp1[1];
                        } else {

                            arrTemp[0] = {};
                            arrTemp[0]["attributeName"] = "CAMPAIGN";
                            arrTemp[0]["sectionNo"] = "1";
                            arrTemp[0]["seqNo"] = "2";
                            arrTemp[0]["scope"] = temp1[1]["scope"];
                            arrTemp[0]["options"] = [];

                        }


                        arrTemp[1] = temp1[0];
                    }
                } else {
                    arrTemp = temp1;
                }

                var part2Section1Elements = _.where(this.opt.data.modelled.options, {
                                                "sectionNo": "1"
                                            });

                var dependedFinalData = [];

                /*if(this.isDependent) {
                    dependedFinalData = _.filter(part2Section1Elements[0].options, function(item) {
                                            return dependentSegments.indexOf(item.name) === -1;
                                        }.bind(this));

                    part2Section1Elements[0].options.length = 0;
                    part2Section1Elements[0].options = dependedFinalData;
                }*/


                this.$el.html(_.template(Tpl, {
                    dependentAccount: this.isDependent,
                    forBuildModel: typeof this.opt.forBuildModel == "undefined" ? false : true,
                    observedAttrsTitle: this.opt.data.observed.attributeName,
                    part1Section1List: arrTemp,
                    part1Section2List: _.where(this.opt.data.observed.options, {
                        "sectionNo": "2"
                    }),
                    part1Section3List: _.where(this.opt.data.observed.options, {
                        "sectionNo": "3"
                    }),
                    onlyColumn: temp2.length == 0 && temp3.length == 0,
                    modelledAttrsTitle: this.opt.data.modelled.attributeName,
                    part2Section1List: part2Section1Elements,
                    part2Section2List: /*_.where(this.opt.data.modelled.options, {"sectionNo" : "2"})*/ [],
                    scope: _scope,
                    isUsedForFindAudience: this.opt.isUsedForFindAudience,
                    getCampaignId: typeof this.opt.getCampaignId == "undefined" ? function() {
                        return "-";
                    } : this.opt.getCampaignId
                }));
                var self = this;

                $(document).on("click", function(e) {                	                	           	              
                	   
                	   
                    if (self.$el.find(e.target).hasClass('drpDwnBtn')) {
                        self.test1 = $('#segmentParentContainer').scrollTop();
                        self.expand();
                    } else if (self.$el.find(e.target).parent().hasClass('drpDwnBtn')) {
                        self.test1 = $('#segmentParentContainer').scrollTop();
                        self.expand();
                    } else {
                        //self.$(".ui.menu").hide();
                    }

                });
                if (typeof this.opt.forBuildModel != "undefined") {
                    this.$el.find(".js-dropdown-heading").html('<span class="heading">' + i18next.t("app.megaDrpDwnHeadingForBuildModel") + '</span>');
                }
            },

            expand: function() {
                if (!this.disableExpand) {
                	
                	if (typeof this.opt.forBuildModel === "undefined") {
                		var maxHeight = -1;

                 	   this.$el.find('.megaDrpDwn ').each(function() {
                 	     maxHeight = maxHeight > $(this).height() ? maxHeight : $(this).height();
                 	   });
                 	   this.$el.find('.megaDrpDwn .observedAttributes, .megaDrpDwn .modelledAttributes').each(function() {
                 	     $(this).height(maxHeight);
                 	     $(this).find('.col-xs-12').height(maxHeight);
                 	     $(this).find('.col-xs-12.bdr').height(maxHeight-2);
                 	     $(this).find('.col1, .col2, .col3').height(maxHeight - 40);
                 	   });	
                	}     
                	
                    self.test1 = $('#segmentParentContainer').scrollTop();

                    var scrlval = self.test1 + 180;
                    this.$(".ui.menu").slideToggle(function() {
                        var inEdit = $('.ui.menu').is(':visible');
                        if (inEdit) {
                            $('#segmentParentContainer').animate({
                                scrollTop: scrlval
                            });
                        }
                    });
                }
            },

            handleSelection: function(e) {
                self.test1 = $('#segmentParentContainer').scrollTop();
                
                this.$jsSelectedSegment.attr('data-name', $(e.currentTarget).data('value'));

                this.$overlayMainDropdown.removeClass('visible');

                $('#segmentParentContainer').animate({
                    scrollTop: self.test1 - 200
                });
                this.$(".ui.menu").find("a").removeClass("modal_drpdn_tickMark");
                if ($(e.target).hasClass("modal_drpdn_tickMark")) {
                    $(e.target).removeClass("modal_drpdn_tickMark");
                } else {
                    if ($(e.target).hasClass("list1")) {
                        this.$el.find(".list1").removeClass("modal_drpdn_tickMark");
                    } else if ($(e.target).hasClass("list2")) {
                        this.$el.find(".list2").removeClass("modal_drpdn_tickMark");
                    }
                    $(e.target).addClass("modal_drpdn_tickMark");
                }

                if(this.opt.modelName !== 'Lookalike'){

                    this.$el.find('.mega-dropdown').removeClass('visible').addClass('hidden');

                    var dummyContainer = $("<div class='field width grid js-columns js-dummy-container' data-type='componentParentDiv' style='margin: 0 .5em 1em 0; clear: none; float: left; width: 450px;'></div>");
                    var selectRef = '<div class="ui loading search selection dropdown" style="min-width: 100px;"> <input type="hidden"/><i class="dropdown icon"></i><div class="default text">Search For Segment</div> <div class="menu multiSelectMenu"></div> </div>';
                    dummyContainer.append(selectRef);

                    this.$el.parents('.conditions-dropdown-wrap:first').find('.js-dummy-container').remove();

                    this.$el.parents('.conditions-dropdown-wrap:first').append(dummyContainer);
                }

                this.trigger("selectionDone", this.getSelection());

                //show cross button
                this.$el.parents(".segmentSection").find(".criteriaRemoveBtnContainer").last().show();

                //this.expand();

                this.$("[data-type='heading']").hide();
                this.$("[data-type='selectedValue']").show();
                var getObj = this.getValueFromNameStr(this.getSelection()[0].replace(/\-/g, '.'));

                if($('.js-modeling-level').length) {
                    $('.js-modeling-level').each(function(index, item){
                        if($(item).checkbox('is checked')) {
                            var modelingLevel = $(item).data('value');
                            if(modelingLevel === 'DEVICE_IOS' || modelingLevel === 'DEVICE_GOG') {
                                if(getObj.name === 'User does qualify for selected Recent Behavior'){
                                   getObj.name = 'User does qualify for selected Mobile App Behavior';
                                } else if(getObj.name === 'User doesn\'t qualify for selected Recent Behavior'){
                                    getObj.name = 'User doesn\'t qualify for selected Mobile App Behavior';
                                }
                            }
                        }
                    }.bind(this));
                }

                this.$("[data-type='selectedValue']").html(getObj.name);

                if (_.isUndefined(getObj.className)) {
                    this.$('.drpDwnBtn').attr('class', 'drpDwnBtn');
                } else {
                    this.$('.drpDwnBtn').addClass(getObj.className);
                }
            },

            getSelection: function() {
                var selectedItems = this.$el.find(".modal_drpdn_tickMark"),
                    arr = [];

                selectedItems.each(function(index, elem) {
                    arr.push($(elem).data("value"));
                });

                return arr;
            },

            getValueFromNameStr: function(nameStr) {
                var self = this,
                    tokens = nameStr.split("."),
                    temp = this.opt.data[tokens[0]],
                    name = "",
                    cssClass = '';

                for (var q = 0; q < temp["options"].length; q++) {

                    var val = temp["options"][q]["attributeName"];
                    console.log(val)

                    if (val == "GEO-LOCATION") {
                        val = "geo";
                    } else if (val == "OTHER OBSERVED ATTRIBUTES") {
                        val = "others";
                    } else if (val == "others") {
                        val = "OTHER OBSERVED ATTRIBUTES";
                    }

                    if (val.toLowerCase() == tokens[1].toLowerCase() || val.indexOf("other") != -1) {
                        for (var s = 0; s < temp["options"][q]["options"].length; s++) {
                            if (temp["options"][q]["options"][s]["name"].toLowerCase() == tokens[2].toLowerCase().trim()) {
                                name = temp["options"][q]["options"][s]["value"];
                                cssClass = temp["options"][q]["options"][s]["cssClass"];
                            }
                        }
                    }
                }
                return {
                    "name": name,
                    "className": cssClass
                };
            },

            setValue: function(value) {
                var self = this,
                    tokens = value.split(".");

                this.$(".js-list").each(function(i, elem) {
                    var attrValue = $(elem).attr("data-value").split(".")[2].trim();

                    if (attrValue == tokens[2].trim()) {
                        $(elem).addClass("modal_drpdn_tickMark");
                        self.$("[data-type='heading']").hide();
                        self.$("[data-type='selectedValue']").show();
                        var setObj = self.getValueFromNameStr(value);

                        var setObjName = setObj.name;
                        if($('.js-modeling-level').length) {
                            $('.js-modeling-level').each(function(index, item){
                                if($(item).checkbox('is checked')) {
                                    var modelingLevel = $(item).data('value');
                                    if(modelingLevel === 'DEVICE_IOS' || modelingLevel === 'DEVICE_GOG') {
                                        if(setObjName === 'User does qualify for selected Recent Behavior'){
                                           setObj.name = 'User does qualify for selected Mobile App Behavior';
                                        } else if(setObjName === 'User doesn\'t qualify for selected Recent Behavior'){
                                            setObj.name = 'User doesn\'t qualify for selected Mobile App Behavior';
                                        }
                                    }
                                }
                            }.bind(this));
                        }

                        self.$("[data-type='selectedValue']").html(setObj.name);
                        
                        if (_.isUndefined(setObj.className)) {
                            self.$('.drpDwnBtn').attr('class', 'drpDwnBtn');
                        } else {
                            self.$('.drpDwnBtn').addClass(setObj.className);
                        }
                    }


                });
            },

            setAudienceIndexingValue: function (value) {
                var self = this,
                tokens = value.split(".");

                this.$(".js-list").each(function(i, elem) {
                    var attrValue = $(elem).attr("data-value").split(".")[2].trim();

                    if (attrValue == tokens[2].trim()) {
                        $(elem).addClass("modal_drpdn_tickMark");
                        self.$("[data-type='heading']").hide();
                        self.$(".popupDropDown").hide();
                        self.$("[data-type='selectedAudienceLabel']").show();
                        var setObj = self.getValueFromNameStr(value);
                        self.$("[data-type='selectedAudienceLabel']").html(setObj.name);
                        
                        if (_.isUndefined(setObj.className)) {
                            self.$('.drpDwnBtn').attr('class', 'drpDwnBtn');
                        } else {
                            self.$('.drpDwnBtn').addClass(setObj.className);
                        }
                    }


                });  
            },

            disable: function() {
                this.disableExpand = true;
            },

            filterOptionWithScope: function(_scope) {
                this.appendTpl(_scope);
            }
        });
        return View;
    });