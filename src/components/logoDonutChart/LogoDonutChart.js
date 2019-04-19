/**
 * Created by Jerome.Champigny on 2/10/2017.
 */

define(
    [
        "jquery",
        "underscore",
        "backbone",
        "numeral",
        "services/AccountService",
        "modules/home/utils/utils",
        "text!components/logoDonutChart/LogoDonutChartTpl.html",
        "components/logoDonutChart/LogoDonutChartModel",
        "components/logoDonutChart/LogoDonutChartDerivedModel",
        // "text!modules/home/tpls/WidgetErrorTpl.html",
        "modules/audienceDiscovery/collections/DeviceBreakdownCollection",
        "modules/audienceDiscovery/collections/CarrierBreakdownCollection"
    ],
    function(
        $,
        _,
        Backbone,
        Numeral,
        AccountService,
        Utils,
        template,
        LogoDonutChartModel,
        LogoDonutChartDerivedModel,
        // errorTpl,
        DeviceBreakdownCollection,
        CarrierBreakdownCollection)
    {
        var logoDonutChart = Backbone.View.extend({

            charts: [],
            // colors: ["#0dc2b1", "#3ad5c2", "#00ebd6", "#56ffea"],
            colors: ["#FFB32C", "#FFD180", "#FFE0AA", "#FFF0D5"],
            hoverColors: ["#0fb5d9", "#33d2f5", "#76e7ff", "#9eeeff"],
            disabledColor: "#b5b5b5",
            containerSize: 1235,
            maxSize: 100,
            title:'Technographic Breakdown',

            template: _.template(template),

            initialize: function(options) {
                this.account = AccountService.getCurrentAccount();
                this.options = options || {};
                if (!this.options.hasOwnProperty("colors")) {
                    this.options.colors = this.colors;
                    this.options.hoverColors = this.hoverColors;
                }

                if (options && options.source) {
                    this.source = options.source
                } else if (options && options.options && options.options.source) {
                    this.source = options.options.source
                }

                if (this.source) {
                    if (this.source === 'device') {
                        this.containerSize = 278.75;
                        this.collection = new DeviceBreakdownCollection({
                            sortType : "id",
                            dimensions : [options.dimension],
                            generateCounts : options.generateCounts,
                            ignoreShowFlag : options.ignoreShowFlag,
                            isCensus : options.isCensus,
                            mockEnabled : options.mockEnabled,
                            mockUrl : options.mockUrl,
                            colors: this.options.colors,
                            hoverColors: this.options.hoverColors
                        });
                    } else if (this.source === 'carrier') {
                        this.containerSize = 278.75;
                        this.collection = new CarrierBreakdownCollection({
                            sortType : "id",
                            dimensions : [options.dimension],
                            generateCounts : options.generateCounts,
                            ignoreShowFlag : options.ignoreShowFlag,
                            isCensus : options.isCensus,
                            mockEnabled : options.mockEnabled,
                            mockUrl : options.mockUrl,
                            colors: this.options.colors,
                            hoverColors: this.options.hoverColors
                        });
                    }
                }

                if(this.options.derived) {
                    this.model = new LogoDonutChartDerivedModel({
                        account : this.account,
                        mockEnabled : options.mockEnabled,
                        source: options.source,
                        colors: this.options.colors,
                        hoverColors: this.options.hoverColors
                    });
                }else {
                    this.model = new LogoDonutChartModel({
                        account : this.account,
                        mockEnabled : options.mockEnabled,
                        source: options.source,
                        colors: this.options.colors,
                        hoverColors: this.options.hoverColors
                    });
                }

                // Now sumDigitalIDs directly geeting from api
                // this.listenTo(this.model, "sumOfDigitalIDs", this.sumDigitalIDs);

                if (options.data) {
                    this.model.points = options.data;
                }
            },

            cacheDom : function(){
                this.$chart = this.$('.js-chart');
                this.$loaderContainer = this.$(".loader-container");
            },

            render: function() {
                this.loading = true;
                this.options.title = this.options.title !== undefined ?  this.options.title : this.title
                var oThis = this;
                var obj = {header : ""};
                if(this.options.timeout)  obj = {header: "Technographic Breakdown"};
                this.$el.html(_.template("<div class=\"container\"><div class=\"header\"><%=header%></div><div class=\"js-chart\"><div class=\"loader-container ui inverted dimmer\" style=\"background-color: rgba(255,255,255,.50)\"><div class=\"ui text loader\"></div></div></div></div>", obj) );
                this.cacheDom();
                this.timeoutHndlr = Utils.timeoutHandler(this.options.timeout, this.$loaderContainer, this.showError.bind(this) /* , "Technographic Breakdown"  */);
			
                function renderCharts () {
                    oThis.$el.html(oThis.template({header: oThis.options.title}));
                    oThis.cacheDom();
                    oThis.model.points = oThis.model.points.sort(function(a, b) {
                        return (a.id - b.id);
                    });

                    if(_.some(oThis.model.points, {name: 'Other'})){ // Set 'Other' as last widget
                        var other = _.filter(oThis.model.points, function(item){ return item.name == 'Other'; });
                        var notOther = _.filter(oThis.model.points, function(item){ return item.name != 'Other'; });
                        
                        if(oThis.options.title == 'Devices and OS'){ // Hide other widget on AD
                            oThis.model.points = notOther
                        } else { // Show other widget in else place
                           oThis.model.points = notOther.concat(other); 
                        }
                    }

                    for (var i in oThis.model.points) {
                        oThis.renderChart({data: oThis.model.points[i]}, oThis.options.title);
                    }
                    oThis.$el.css('visibility', 'visible');
                }

                if (!this.source || (this.source !== 'device' && this.source !== 'carrier')) {
                    this.model.fetch().then(function () {
                        this.checkIfErrorInResponse()
                        .then(function(){
                            oThis.timeoutHndlr(/*  false, "Success"  */);
                            renderCharts();
                        })
                        .catch(function(){
                            if(oThis.model.points) {
                                oThis.timeoutHndlr(/*  false, "Error in Response"  */);
                                if(oThis.model.points.length == 0){
                                    var defArr = [
                                        {name: 'Desktop', value: 0},
                                        {name: 'Mobile', value: 0},
                                        {name: 'Tablet', value: 0},
                                    ];

                                    if(oThis.options.title !== 'Devices and OS') defArr.push({name: 'Other', value: 0});

                                    for (var i in defArr) {
                                        oThis.renderChart({data: defArr[i]}, oThis.options.title);
                                    }
                                }
                            }else{
                                oThis.timeoutHndlr(true/* , "Error in Response"  */);
                            }
                        })
                    }.bind(this));
                } else if (this.model.points) {
                    oThis.timeoutHndlr(/*  false, "Success"  */);
                    renderCharts();
                }else{
                    oThis.timeoutHndlr(/*  false, "Success"  */);
                }
                return this;
            },
            showError:function(showError){
                if(showError){
                    this.$chart.empty();
                    // this.$chart.append(errorTpl);
                    this.showingError = true;
                }
            },
            checkIfErrorInResponse: function(){
                return new Promise(function(resolve, reject){
                    return ((!this.model.get('errors') && !this.showingError) && this.model.points != 0)  ? resolve() : reject();
                }.bind(this));
            },
            
            sumDigitalIDs: function(addedDigitalIds) {
                setTimeout(function() {
                    $('.js-digitalIDs').text(addedDigitalIds > 0 ? numeral(addedDigitalIds).format('0,0') : 0);
                    $('.js-population-section').css('opacity', '1');
                }, 1200);
            },

            clear: function() {
                this.$el.hide();
                if (this.$chart)
                    this.$chart.hide();
            },

            update: function(expression) {
                if (!this.collection) return;
                if(!this.options.hasOwnProperty("forceShow") && !this.options.forceShow && (!expression.get("size") || !expression.get("show"))){
                    this.$el.hide();
                    return;
                }

                this.$el.show();
                this.$el.html(this.template({header: this.options.title}));
                this.$el.append("<div id='relevancyWidgetLoader' class='ui column active centered inline loader' style='margin: 20px auto'>")

                this.collection.expression = expression;

                return $.when(this.collection.fetch()).then(function(){
                    this.$el.find('#relevancyWidgetLoader').remove();
                    if (this.collection.points.length === 0) {
                        this.$el.hide();
                        return;
                    }

                    this.model.points = this.collection.points;

                    this.render();
                    this.$chart.show();
                }.bind(this), function (e, e2) {
                    console.log("error", e, e2);
                });
            },

            getData : function(){
                return this.model.deviceTypes
            },
            
            setMinData: function(chartData) {
                console.log(chartData);
                var totalYSize = 0;
                if(chartData && chartData.length > 1) {
                    chartData.forEach(function(item){
                        totalYSize = totalYSize + item.y;
                    });
                    chartData.forEach(function(item){
                        var currentSize = (item.y / totalYSize) * 100;
                        if(currentSize > 0 && currentSize < 2) {
                            item.y = Math.round((totalYSize * 2) / 100);
                        }
                    });
                }
                return chartData;
            },

            renderChart: function(options, title) {
                if (!options.data) return;
                var widthMargin = 60;
                var heightMargin = 10;
                var innerSize = 40;

                var chart = options.data;
                var className = "js-chart-" + chart.name.toLowerCase();
                /* // Hide 'Other' in Technographic Breakdown widget
                if (this.$('.' + className).length > 0 || className === 'js-chart-other') {
                    return;
                }
                */
                if (this.containerSize < 500) {
                    widthMargin = 8;
                    this.maxSize = (this.containerSize / 3) - (2*widthMargin);
                    innerSize = this.maxSize * 0.4;
                }

                if (this.options.source === "device" || this.options.source === "carrier") {
                    this.$('.header').replaceWith("<h5 class='ui top-dividing dividing header graph-headers'>"+this.$('.header').text()+"</h5>");
                }

                 // Create the chart
                if(title == 'Technographic Breakdown'){
                    this.$chart.append(
                    "<div class='"+chart.name.toLowerCase() + '-container donut-inner-wrap' +"' style='float: left;margin-bottom: 15px; width: 25%'>" +
                    "   <div class='"+className+"' style='"+(this.options.source ? 'background-size: 33% 33%;' : '')+" background-image: url(\"/static/img/widgets/logo-donut-chart/ic-"+chart.name.toLowerCase()+".svg\"); background-repeat: no-repeat; background-position: 50% 48%; margin-left: -49px;'></div>" +
                    "   <p style='text-align: center; font-weight: normal; font-size: 14px; margin: 0 0 0 -49px;'>" + Numeral(chart.value).format("0.[0]a").toUpperCase() + "</p>" +
                    "   <p style='text-align: center; margin-left: -49px;'>"+chart.name+"</p>" +
                    "</div>");
                } else {
                    this.$chart.append(
                    "<div class='"+chart.name.toLowerCase() + '-container donut-inner-wrap' +"' style='float: left;margin-bottom: 15px;'>" +
                    "   <div class='"+className+"' style='"+(this.options.source ? 'background-size: 33% 33%;' : '')+" background-image: url(\"/static/img/widgets/logo-donut-chart/ic-"+chart.name.toLowerCase()+".svg\"); background-repeat: no-repeat; background-position: 50% 48%;'></div>" +
                    "   <p style='text-align: center; font-weight: normal; font-size: 14px; margin: 0'>" + Numeral(chart.value).format("0.[0]a").toUpperCase() + "</p>" +
                    "   <p style='text-align: center;'>"+chart.name+"</p>" +
                    "</div>");
                }
               
                var highchart = {
                    chart: {
                        type: 'pie',
                        backgroundColor: null,
                        width: this.maxSize + 2*widthMargin,
                        height: this.maxSize + heightMargin
                    },
                    plotOptions: {
                        pie: {
                            shadow: false,
                            center: ['50%', '50%'],
                            dataLabels: {
                                enabled: false
                            },
                            borderWidth: (chart.value === 0 || chart.data.length === 0) ? 0 : 1
                        }
                    },
                    tooltip: {
                        formatter: function () {
                            return this.point.name + ": <b>" + Numeral(this.point.y_1 ? this.point.y_1 : this.y).format("0.[0]a").toUpperCase() + "</b><br/>";
                        }
                    },
                    series: [
                        {
                            name: 'Devices',
                            data: this.setMinData(chart.data),
                            size: this.maxSize,
                            innerSize: this.maxSize - innerSize,
                            animation: false,
                            states: {
                                hover: {
                                    enabled: true,
                                    halo: {
                                        size: 5
                                    }
                                }
                            }
                        }
                    ],
                    title: null,
                    credits: {
                        enabled: false
                    },
                };

                if (chart.value === 0 || chart.data.length === 0) {
                    highchart.series[0].data = [{
                        name: "No data",
                        y: 100,
                        color: this.disabledColor,
                        marker: {
                            states: {
                                hover: {
                                    enabled: false
                                }
                            }
                        }
                    }];
                    highchart.tooltip = { enabled: false }
                }

                this.$('.'+className).highcharts(highchart);
                
                //NOTE: applying transform from left on donut svg only on home page
                if(this.$('.js-chart .highcharts-series').closest('.js-AD-wrap').length < 1) {
                    this.$('.js-chart .highcharts-series').attr('transform', 'translate(10,10) scale(1 1)');
                }
            }
        });

        return logoDonutChart;
    }
);