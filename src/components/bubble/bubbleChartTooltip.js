define(['jquery', 'backbone', 'underscore', 'numeral', 'd3',
        'text!components/bubble/bubbleChartTooltipTpl.html'
    ],
    function ($, Backbone, _, numeral, d3, bubbleChartTooltipTpl) {

        var bubbleChartTooltip = Backbone.View.extend({

            template: _.template(bubbleChartTooltipTpl),

            events: {},

            className: "ui active popup card",
            attributes: {
                "style": "padding:0;font-size:1em"
            },

            initialize: function (options) {
                this.cScale = d3.scaleLinear()
                    .domain([-100, 100])
                    .rangeRound([220, 140]);
            },

            show: function (data, coords, ADMetaObj) {
                if (this.timer) {
                    clearTimeout(this.timer);
                }
                var $w = $(window);
                console.log("coords", $w.scrollLeft() + $w.width(), $w.scrollTop() + $w.height());
                if (data.attributes.model_type !== undefined) {
                    var modelType = data.attributes.model_type.toUpperCase();
                } else {
                    var modelName = data.trait.name;
                }
                var topicName = data.trait.name;
                var segmentType = data.attributes.type;
                var parentTopicName = ADMetaObj ? ADMetaObj.parentTopicName : '';
                var audienceSize = data.size;
                var activityReach = data.attributes.size;

                this.data = data;
                console.log("data", data);
                this.$el.html(this.template(_.extend({
                    numeral: numeral,
                    relevancyColor: data.color,
                    relevancy: data.relevancy,
                    modelType: modelType ? modelType : '',
                    topicName: topicName,
                    segmentType: segmentType,
                    parentTopicName: parentTopicName ? parentTopicName : '',
                    audienceSize: audienceSize,
                    activityReach: activityReach,
                    modelName: modelName ? modelName : ''
                }, data)));


                if (!this.isShown) {
                    console.log("showing");
                    this.$trigger.popup('show');
                    this.isShown = true;
                }

                this.$el.addClass('visible');
                this.$el.show();

                var width = this.$el.width();
                var height = this.$el.height();

                var boundsX = coords.x - 20 + width;
                var boundsY = coords.y - (height + 40);
                var maxX = $w.scrollLeft() + $w.width();
                var minY = $w.scrollTop();

                var top = coords.y - (height + 20);
                var left = coords.x - 15;
                var posX = 'left';
                var posY = 'top';
                /*
       if(boundsX > maxX){
            left = coords.x - width;
            posX = 'right';
       }
       if(boundsY < minY){
            top = coords.y + 20;
            posY = 'bottom';
       }
       */
                //console.log("coords", boundsX, maxX, boundsY, minY, boundsX > maxX, boundsY < minY);

                this.$el.removeClass('top bottom right left');
                this.$el.addClass(posX + ' ' + posY);
                this.$el.css("top", top + 123);
                this.$el.css("left", left + 10);
                this.$el.css("bottom", 'auto');
                this.$el.css("right", 'auto');
            },

            distanceFromBoundary: function (top, left) {
                var
                    distanceFromBoundary = {},
                    popup,
                    boundary;

                // shorthand
                popup = calculations.popup;
                boundary = calculations.boundary;

                if (offset) {
                    distanceFromBoundary = {
                        top: (offset.top - boundary.top),
                        left: (offset.left - boundary.left),
                        right: (boundary.right - (offset.left + popup.width)),
                        bottom: (boundary.bottom - (offset.top + popup.height))
                    };
                }
                return distanceFromBoundary;
            },

            hide: function () {

                this.timer = setTimeout(this.doHide.bind(this), 200)
                return;
            },

            doHide: function () {
                this.$el.removeClass('visible');
                this.$el.hide();
                //this.$trigger.popup('hide')
            },

            render: function ($element) {
                this.$trigger = $element
                this.$trigger.popup({
                    on: 'manual',
                    popup: this.$el,
                    debug: true,
                    delay: {
                        show: 0,
                        hide: 0
                    },
                    duration: 100,
                    position: 'top left',
                    maxSearchDepth: 1,
                    lastResort: 'top left'
                })
                return this;
            }

        })

        return bubbleChartTooltip;
    })