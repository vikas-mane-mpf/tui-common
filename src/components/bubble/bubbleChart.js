define(['jquery', 'backbone', 'underscore', 'numeral', 'd3',
        "components/bubble/bubbleChartTooltip",
        "modules/audienceDiscovery/collections/RelevancyCollection"
    ],

    function ($, Backbone, _, numeral, d3, bubbleChartTooltip, RelevancyCollection) {

        var RelevancyChartView = Backbone.View.extend({

            className: 'relevancy-chart hide',

            initialize: function (options) {
                options = options || {};
                this.title = options.title || {};
                this.collection = new RelevancyCollection(null, {
                    dimensions: [options.types[0].dimension],
                    ignoreShowFlag: options.ignoreShowFlag,
                    limit: options.types[0].limit,
                    mockUrl: options.types[0].mockUrl,
                    mockEnabled: options.mockEnabled
                });

                this.svgWidth = '100%';
                var x, xAxis;
                this.width = 300;
                this.height = 200;
                this.chartHeight = this.svgHeight = 150;

                this.tooltipView = new bubbleChartTooltip();
            },

            render: function () {
                this.$el.html();
                this.$el.append(this.tooltipView.render(this.$el).$el);
                this.setSVGElements();
                return this;
            },

            setSVGElements: function () {
                d3.select(this.$el.get(0)).append("h5")
                    .attr("class", "ui top-dividing dividing header graph-headers")
                    .text(this.title);

                this.svg = d3.select(this.$el.get(0)).append("svg")
                    .attr("width", this.svgWidth)
                    .attr("height", this.chartHeight)
                    .attr("style", 'overflow:visible');

                this.g = this.svg.append("g")
                    .attr("transform", "translate(0, 50)");
            },

            setGradiant: function () {
                this.hueScale = d3.scaleLinear()
                    .domain([this.minAxis, this.maxAxis])
                    .rangeRound([170, 175, 180]);

                this.brightnessScale = d3.scaleLinear()
                    .domain([this.minAxis, this.maxAxis])
                    .range([0.75, 0.25]);

                this.opacityScale = d3.scaleLinear()
                    .domain([this.minAxis, this.maxAxis])
                    .range([0, 1]);
            },

            update: function (expression, requestedId, audienceDiscoveryMetaData) {
                if (!expression.get("size") || !expression.get("show")) {
                    this.$el.hide();
                    return;
                }

                this.$el.show();
                this.radiusScale = d3.scalePow().exponent(0.5).domain([0, 20]).range([2, 7]);
                this.collection.expression = expression;
                this.audienceDiscoveryMetaData = audienceDiscoveryMetaData.responseJSON;
                this.collection.fetch().then(function () {
                    this.setAxis();
                    this.setGradiant();
                    this.addAxis();
                    this.createNodes();
                    this.createCircles();
                    this.positionNodes();
                    this.createSimulation();
                }.bind(this));
                this.removeCircles();
            },

            setAxis: function () {
                var minAxis = _.min(this.collection.models, function (o) {
                    return o.get('relevancy');
                });
                var maxAxis = _.max(this.collection.models, function (o) {
                    return o.get('relevancy');
                });
                this.minAxis = minAxis.get('relevancy');
                this.maxAxis = maxAxis.get('relevancy');

                if(this.minAxis == this.maxAxis){
                   this.minAxis = 0;
                }

                this.xScale = d3.scalePow()
                    .domain([this.minAxis, this.maxAxis])
                    .rangeRound([0, this.width - 25])
                    .clamp(true)
                    .nice();

                this.xAxis = d3.axisTop()
                    .scale(this.xScale)
                    .ticks(5);
            },

            createNodes: function () {
                this.gradientParams = [];

                var maxRadiusCalc = this.getRadiusCalc();

                this.allNodes = this.collection.models.map(function (item, index) {
                    var node = item.toJSON();
                    node.color = d3.hsl(this.hueScale(node.relevancy), 1, this.brightnessScale(node.relevancy));
                    node.radius = this.radiusScale(Number(node.size)) / maxRadiusCalc;
                    node.parentTopicObj = this.getParentTopicName(node.trait.id);
                    node.idealcx = node.x = this.xScale(node.relevancy);
                    node.idealcy = node.y = node.yRelevancy ? this.yScale(node.yRelevancy) : 0;
                    console.log("creating node", node);
                    return node;
                }.bind(this));

                this.nodes = this.allNodes.concat([]);

                this.buckets = _.values(_.groupBy(this.nodes, function (node) {
                    return Math.round(node.x / 10) * 10
                }));

            },

            getParentTopicName: function (segmentId) {
                var segmentId = parseInt(segmentId);
                return _.find(this.audienceDiscoveryMetaData, function (data) {
                    return segmentId === data.segmentId
                });
            },


            getRadiusCalc: function () {
                var maxSize = _.max(this.collection.models, function (o) {
                    return o.get('size');
                });
                var maxlimit = 10;
                var i = 1;
                do {
                    var radius = this.radiusScale(Number(maxSize.get('size'))) / i;
                    i++;
                } while (maxlimit < radius)
                return i;
            },

            clear: function () {
                this.$el.hide();
            },

            filterNodes: function () {
                this.nodes = _.filter(this.allNodes, function (node) {
                    return Math.random() > .5;
                });

                console.log(this.nodes.length);

                this.buckets = _.values(_.groupBy(this.nodes, function (node) {
                    return Math.round(node.x / 10) * 10
                }));
            },

            getLargestBucketHeight: function () {
                return _.max(_.map(this.buckets, function (nodes) {
                    return _.reduce(nodes, function (memo, node) {

                        return memo + (node.radius * 2);

                    }, 0);
                }));
            },

            getLargestBucketSize: function () {
                return _.max(_.map(this.buckets, function (nodes) {
                    return nodes.length;
                }));
            },

            getLargestYaxisBucketSize: function () {
                return _.max(_.map(this.comparedBuckets, function (nodes) {
                    return nodes.length;
                }));
            },

            addAxis: function () {

                this.gAxis = this.g.append("g")
                    .attr("class", "x axis baseXAxis")
                    .attr("style", "font-size: 9px;")
                    .attr("transform", "translate(0," + (this.svgHeight - 60) + ")")
                    .call(this.xAxis);

                this.svg.selectAll('.baseXAxis g').attr('class', function (d, i) {
                    return ('tick' + d);
                });

            },

            removeAddAxis: function () {
                if (this.$el.find('.x.axis.baseXAxis').length === 1) {
                    this.$el.find('.x.axis.baseXAxis').attr("transform", "translate(0," + (this.svgHeight - 10) + ")");
                }
            },

            positionNodes: function () {
                _.each(this.buckets, function (nodes) {
                    var maxY = 0;
                    var minY = 0;
                    var totalY = 0;
                    var index = 0;
                    _.each(nodes, function (node) {
                        var nodeHeight = (node.radius * 2);
                        if (index % 2) {
                            node.y = maxY + nodeHeight;
                            maxY += nodeHeight + 2;
                        } else {
                            node.y = minY;
                            minY -= (nodeHeight + 2);
                        }
                        index++;
                    }.bind(this));
                }.bind(this));
            },

            removeCircles: function () {
                console.log("removing nodes", this.nodes);
                if (this.circles)
                    this.circles.data([]).exit().remove();
            },

            createCircles: function () {
                var oThis = this;
                var axis = this.g.selectAll("circle");

                this.circles = axis
                    .data(this.nodes)
                    .enter().append("circle")
                    //.style("fill", function(d) { return "rgb(60, 255, 232)" })
                    .style("fill", function (d) {
                        return d.color
                    })
                    .attr("cx", function (d) {
                        return d.x
                    })
                    .attr("cy", function (d) {
                        return d.y
                    })
                    .attr("r", function (d) {
                        return d.radius + 1
                    })
                    // .attr("cy", function(d) { return 10} )
                    // .attr("r", function(d) { return 7} )
                    .attr("class", function (d) {
                        return "topic-group-" + d.topic_group + " topic-" + d.topic_id
                    })
                    .on("mousemove", function (data) {
                        var coords = {
                            x: $(d3.event.currentTarget)[0].attributes.cx.value,
                            y: $(d3.event.currentTarget)[0].attributes.cy.value
                        };
                        data.attributes = this.collection.expression.included.attributes.conditionSets[0].conditions.models[0].attributes;
                        this.tooltipView.show(data, coords, data.parentTopicObj);
                    }.bind(this))
                    .on("mouseout", function (data) {
                        this.tooltipView.hide(data);
                    }.bind(this));

                //circle.exit().remove();
                //console.log("circle",circle);
            },

            createGradient: function (xPos) {
                this.deleteGradient();
                var rectWidth = xPos > 0 ? 180 : 159;

                var gradient = this.g.insert('defs', ':first-child')
                    .append('linearGradient')
                    .attr('id', 'gradient')
                    .attr('x1', '0%')
                    .attr('y1', '0%')
                    .attr('x2', '0%')
                    .attr('y2', '100%')
                    .attr('spreadMethod', 'pad');

                gradient.append('stop')
                    .attr('offset', '0%')
                    .attr('stop-color', '#FEFEFE')
                    .attr('stop-opacity', '0')

                gradient.append('stop')
                    .attr('offset', '100%')
                    .attr('stop-color', '#eeeeee')
                    .attr('stop-opacity', '1')

                this.g.insert("rect", ':first-child')
                    .attr("height", "100%")
                    .attr('x', xPos)
                    .attr('y', '18')
                    .attr("width", rectWidth)
                    .attr("fill", "url(#gradient)");
            },

            deleteGradient: function () {
                this.g.selectAll('defs').remove();
                this.g.selectAll('rect').remove();
            },

            deleteDynamicSVGelements: function () {
                this.svg.selectAll(".dashedLineVertical").each(function (d, i) {
                    this.remove();
                });

                this.svg.selectAll(".dashedLineText").each(function (d, i) {
                    this.remove();
                });

                this.svg.selectAll(".hiddingAxisBox").each(function (d, i) {
                    this.remove();
                });

                this.svg.selectAll(".rangeLableText").each(function (d, i) {
                    this.remove();
                });

                this.svg.selectAll(".dashedLineHorizontal").each(function (d, i) {
                    this.remove();
                });

                this.svg.selectAll(".hiddingYaxisBox").each(function (d, i) {
                    this.remove();
                });

                this.svg.selectAll(".dashedLineYText").each(function (d, i) {
                    this.remove();
                });

                this.svg.selectAll(".rangeLableYText").each(function (d, i) {
                    this.remove();
                });

                this.svg.selectAll(".selectedXTickLine").each(function (d, i) {
                    this.remove();
                });

                this.svg.selectAll(".selectedYTickLine").each(function (d, i) {
                    this.remove();
                });
            },

            createSimulation: function () {
                this.currentInteration = 0;

                this.simulation = d3.forceSimulation().alphaDecay(0.1)
                    .force("x", d3.forceX(function (d) {
                        return d.idealcx
                    }).strength(0.7))
                    .force("y", d3.forceY(function (d) {
                        return d.idealcy
                    }).strength(0.04))
                    .force("collide", d3.forceCollide(function (d) {
                        return d.radius + 1
                    }).strength(1).iterations(10))

                this.simulation.nodes(this.nodes).on("tick", this.handleTick.bind(this));
                if (this.comparedNodes)
                    this.simulation.nodes(this.comparedNodes).on("tick", this.handleYaxisTick.bind(this));

            },

            handleTick: function () {
                if (this.currentInteration < 40 && !(this.currentInteration % 1)) {
                    this.circles.attr("cx", function (d) {
                        return d.x
                    }).attr("cy", function (d) {
                        return d.y
                    });
                }
                this.currentInteration++;
                if (this.currentInteration == 40) {
                    this.simulation.stop();
                    this.handleFinish();
                }
            },

            handleYaxisTick: function () {
                if (this.currentInteration < 40 && !(this.currentInteration % 1)) {
                    this.YaxisCircles.attr("cy", function (d) {
                        return d.y
                    }).attr("cx", function (d) {
                        return d.x
                    });
                }
                this.currentInteration++;
                if (this.currentInteration == 40) {
                    this.simulation.stop();
                    this.handleFinish();
                }
            },

            handleFinish: function () {
                //this.dfd.resolve();
            },

            isYaxisPresent: function () {
                return this.filterModel && this.filterModel.get('comparedItem') !== null && this.filterModel.get('comparedItem') !== '' && this.filterModel.get('comparedItem') !== undefined
            },

            highlight: function (segments, selectedNode) {
                var oThis = this;
                var circles = this.g.selectAll('circle');
                circles.classed("selected", false);
                circles.classed("blur", false);

                this.deleteGradient();
                this.deleteDynamicSVGelements();
                this.g.selectAll('text').style('fill', '#777');
                this.svg.selectAll('.baseXAxis g').style("opacity", "1");
                this.svg.selectAll('.baseYAxis g').style("opacity", "1");

                circles.each(function (d) {
                    var show = segments ? segments.get(d.segmentId) : true;
                    var selected = selectedNode ? d.segmentId == selectedNode.segmentId : false;
                    if (!show) {
                        d3.select(this).classed("blur", true);
                    }
                    if (selected) {
                        d3.select(this).classed("selected", true);
                    }
                });

                this.$el.toggleClass('has-selection', selectedNode ? true : false);
            }

        })

        function getElementCoords(element, coords) {
            var ctm = element.getCTM(),
                x = ctm.e + coords.x * ctm.a + coords.y * ctm.c,
                y = ctm.f + coords.x * ctm.b + coords.y * ctm.d;
            return {
                x: x,
                y: y
            };
        };



        return RelevancyChartView;
    })