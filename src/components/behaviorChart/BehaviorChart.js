/**
 * Created by jerome.champigny on 5/16/17.
 */

define(
    [
        "jquery",
        "underscore",
        "backbone",
        "numeral",
        "components/consumerCluster/iconModel"
    ],
    function(
        $,
        _,
        Backbone,
        Numeral,
        IconModel
    ) {
        var behaviorChart = Backbone.View.extend({
            angleStart: -360,
            initialize: function(options) {
                this.model = options.data || null;
                this.showMore = options.showMore || false;
                this.showLess = options.showLess || false;
                this.showTags = options.showTags || false;
                this.showActivityIcon = options.showActivityIcon || false;
                this.cardView = options.cardView || false;
                this.style = options.style || '';

                var count = 0;
                this.traits = [];

                for (var i in this.model.traits.demographics) {
                    this.traits.push({
                        name: this.model.traits.demographics[i].varValueRefName,
                        id: parseInt(this.model.traits.demographics[i].segmentId),
                        type: this.model.traits.demographics[i].varRefName.toLowerCase(),
                        rank: this.model.traits.demographics[i].rank
                    });
                    count++;
                }

                for (var i in this.model.traits.interests) {
                    this.traits.push({
                        name: this.model.traits.interests[i].category,
                        id: parseInt(this.model.traits.interests[i].id),
                        rank: this.model.traits.interests[i].rank
                    });
                    count++;
                }

                for (var i in this.model.traits.technographics) {
                    this.traits.push({
                        name: this.model.traits.technographics[i].name,
                        id: parseInt(this.model.traits.technographics[i].Id),
                        rank: this.model.traits.technographics[i].rank
                    });
                    count++;
                }

                for (var i in this.model.traits.activities) {
                    this.traits.push({
                        name: this.model.traits.activities[i].name,
                        id: parseInt(this.model.traits.activities[i].Id),
                        type: 'activities',
                        rank: this.model.traits.activities[i].rank
                    });
                    count++;
                }

                this.selectedTraits = [];
                //this.traitsByRank = _.sortBy(this.traits, function(o) { return o.id; });
                this.traitsByRank = _.sortBy(this.traits, function(o) { return o.rank; });
                if (count <= 5) {
                    this.selectedTraits = this.traitsByRank.reverse();
                } else {
                    this.selectedTraits = this.traitsByRank.reverse().slice(0, 5);
                }
            },
            render: function(icons) {
                if (!this.model) return;

                var lessMoreHTML = less = more = '';
                if (this.showMore || this.showLess) {

                    if(this.showLess){
                        if(this.cardView){
                            less = '<a class="less lessCardView" data-id="'+this.model.id+'">Less</a>'
                        }else {
                            less = '<a class="btn-details less" data-id="'+this.model.id+'">Less</a>'
                        }
                    }

                    if(this.showMore){
                        if(this.cardView){
                            more = '<a class="btn-detailsCardView more" data-id="'+this.model.id+'">More</a>';
                        }else {
                            more = '<a class="btn-details more" data-id="'+this.model.id+'">More</a>';
                        }
                    }

                    lessMoreHTML = '<div class="right menu"><div class="item reveal-container Less-More" style="padding-right:0px">' + less + more + '</div></div>';
                }

                var $clusterRenderer = $(
                    '<div class="pkgrid-item ui segment widget pkgrid-item--width1 pkgrid-item--height1 cluster-card">' +
                    '   <div style="display:flex;flex-direction:column;height:100%;">' +
                    '       <div class="ui secondary menu card-header-wrap">' +
                    '           <h3 class="active section ellipsis white-space-nowrap">' + this.model.name.toTitleCase() + '</h3>' +
                    '           <span class="behavior-subtitle">Size: ' + Numeral(this.model.size).format("0.[0]a").toUpperCase() + '</span>' + lessMoreHTML + '</div>' +
                    '       <div class="cluster-chart" style="'+this.style+'">' + this.renderBehaviors(icons) + '</div>' + this.renderTags() + '   </div>' +
                    '</div>'
                );

                return $clusterRenderer;
            },
            renderBehaviors: function(icons) {
                var behaviors = '';
                if (this.selectedTraits.length > 0) {
                    behaviors = '<div class="radial-nav-selector circle">';
                    if (this.traits.length > 5) {
                        behaviors += '<div class="center"><h1 class="cluster-chart-more">+';
                        behaviors += this.traits.length - 5;
                        var traits = this.traits.length - 5 > 1 ? "traits" : "trait";
                        behaviors += '<span class="subtitle" style="display: block; margin-top: -12px;">'+traits+'</span></h1></div>';
                    }
                    behaviors += '<ul class="card-view-rotate">';
                    for (var i = 0; i < this.selectedTraits.length && i < 5; i++) {
                        var length = this.selectedTraits.length;
                        var deg = 360 / length;
                        var d = i * deg;
                        var insideTag = '';
                        var lines = 1;
                        if (this.selectedTraits[i].type !== "age") {
                            if (this.selectedTraits[i].type === 'activities' && this.showActivityIcon) {
                                var iconClass = 'ic-activities';
                            } else  {
                                var iconModel = new IconModel();
                                var formatedName = iconModel.formatName(this.selectedTraits[i].name);
                                var iconClass = formatedName;
                            }
                            insideTag = '<img class="icon-rotate icon-rotate-img" src="static/js/components/consumerCluster/img/' + iconClass +'.svg">';
                        } else {
                            insideTag = '<span class="icon-rotate icon-rotate-span">' + this.selectedTraits[i].name + '</span>';
                        }

                        var textStyle = "display:-webkit-box;overflow-wrap: break-word;text-overflow: ellipsis;-webkit-line-clamp: 2;-webkit-box-orient: vertical;overflow: hidden;position:absolute;width:80px;line-height: normal;color:#777;white-space:initial;";

                        function getGap(str, lineHeight, numberChar) {
                            if (lines > 1) return lineHeight * lines;
                            return lineHeight * Math.ceil(str.length / numberChar);
                        }

                        if (this.selectedTraits[i].name.indexOf(' ') === -1 && this.selectedTraits[i].name.length > 17) {
                            var newStr = '';
                            for (var j = 0, k = 16; j < this.selectedTraits[i].name.length; j = k, k += 17) {
                                var tmp = this.selectedTraits[i].name.substring(j, k);
                                var underscoreIndex = tmp.lastIndexOf('_');
                                if (underscoreIndex !== -1) {
                                    if (lines === 2) {
                                        newStr += tmp.slice(0, underscoreIndex) + '...';
                                        break;
                                    } else {
                                        newStr += tmp.slice(0, underscoreIndex) + '_ ' + tmp.slice(underscoreIndex + 1, tmp.length);
                                    }
                                    lines++;
                                } else
                                    newStr += tmp;
                            }
                            this.selectedTraits[i].name = newStr;
                        }

                         var wrapperStyle = 'height: 46px;position: absolute;transform: rotate(-180deg);-webkit-transform: rotate(-180deg);width: 80px; transform-origin:center;';
                        
                        if(d === 0) { // Bottom Center
                           wrapperStyle += "top: -38px; right: -18px;";
                           textStyle += "left: 50%;";
                        }
                        
                        if (d == 90) { // left middle
                            wrapperStyle += "right: -65px;";
                            textStyle += "width: 50px; left: 46%;";
                        }
                        
                        if (d > 0 && d < 180) { // left side
                            wrapperStyle += "top: 0px; right: -70px;";
                            textStyle += "left: 46%;";
                        } else if (d > 180 && d < 360){ // right side
                            wrapperStyle += "top: 0px; right: 38px;";
                            textStyle += "left: 52%; width: 50px;";
                        } 
                         
                        if(d === 180) { // Top Center
                           wrapperStyle += "top: 38px; right: -18px;";
                           textStyle += "left: 50%;";
                        }

                        if (d > 0 && d < 90) { // bottom left
                            wrapperStyle += "right: -68px;";
                            textStyle += "width: 50px; left: 46%;";
                            textStyle += "text-align: right;";
                        }

                        if (d > 90 && d < 180) { // top left
                            wrapperStyle += "right: -68px;";
                            textStyle += "width: 50px; left: 46%;";
                            textStyle += "text-align: right;";
                        }

                        if (d > 180 && d < 270) { // top right
                            wrapperStyle += "right: 35px;";
                            textStyle += "width: 50px; left: 52%;";
                            textStyle += "text-align: left;";
                        }

                        if (d > 270 && d < 360) { // bottom right
                            wrapperStyle += "right: 35px;";
                            textStyle += "width: 50px; left: 52%;";
                            textStyle += "text-align: left;";
                        }

                        textStyle += "top: 50%;transform: translate(-50%, -50%);";

                        var traitNameSpan = '<span style="' + textStyle + '">'+this.selectedTraits[i].name+'</span>';

                        behaviors +=
                            '<li style="transform: rotate(' + d + 'deg); ' +
                            '           -ms-transform: rotate(' + d + 'deg);' +
                            '           -webkit-transform: rotate(' + d + 'deg);">' +
                            '   <a style="display: inline-block;' +
                            '             transform: rotate(' + (-d) + 'deg);' +
                            '             -ms-transform: rotate(' + (-d) + 'deg);' +
                            '             -webkit-transform: rotate(' + (-d) + 'deg);">' +
                                    insideTag + '<div style="' + wrapperStyle + '">'+traitNameSpan+'</div>';
                            '   </a>' +
                            '</li>';
                    }
                    behaviors += '</ul></div>';
                }
                return behaviors;
            },
            renderTags: function() {
                var tags = '';
                if (this.showTags) {
                    tags = '<div class="cluster-tags">'
                    if (this.selectedTraits.length > 0) {
                        var characterCount = 0;
                        var skipped = false;
                        for (var j = 1; j < this.selectedTraits.length; j++) {
                            if (characterCount + this.selectedTraits[j].name.length + 3 > 46) {
                                skipped = true;
                                continue;
                            }

                        tags += '<span class="cluster-tag"><span>' + this.selectedTraits[j].name + '</span></span>';
                            characterCount += this.selectedTraits[j].name.length + 3;
                        }

                        if (skipped) {
                            tags += '<span class="tag-more">...</span>';
                        }
                    }
                }
                return tags;
            }
        });
        return behaviorChart;
    }
)