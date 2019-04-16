define(['jquery', 'backbone', "underscore", "text-loader!components/comboFilter/ComboFilterTpl.html", "i18next"],
		function($, Backbone, _, filterTpl, i18next){

	var view = Backbone.View.extend({

		className: "combo-filter-mobile",

		events : {
			"input .js-search-box" : "handleTextSearch"
		},

		attributes : {
			style : "margin:-5em 0;"
		},

		initialize: function(options){
			options = options || {};
			this.hideSelection = options.hideSelection || false;
			this.showOnlyMainMenu = options.showOnlyMainMenu || false;
			this.queryStringName = options.queryStringName;
			this.queryString = options.queryString;
			this.sections = options.sections;
			this.presets = options.presets || [];
			this.srcPresets = _.union(this.presets, []);
			this.debounceTriggerChange = _.debounce(this.triggerChange, 300).bind(this);
		},

		cacheDom : function(){
			this.$mainSelect = this.$('.js-main-select');
			this.$mainMenu = this.$('.js-main-select .menu');
			this.$tagSelect = this.$('.js-tag-select');
			this.$searchBox = this.$('.js-search-box');
			this.$searchIcon = this.$('.search.icon')
		},

		render: function(){
			this.tpl = _.template(filterTpl,{search: i18next.t("app.search")});
			this.$el.html(this.tpl);
			this.cacheDom();
			this.renderSearchBox();
			this.renderMainSelect();
			this.renderTagSelect();
			this.toggleDisplay();
			return this;
		},

		toggleDisplay : function(){
			var tags = this.getTags();
			this.$searchBox.toggle(tags.length == 0);
			this.$tagSelect.toggle(tags.length > 0);
			if(this.showOnlyMainMenu){
				this.$searchBox.remove();
				this.$tagSelect.remove();
				this.$searchIcon.remove();
			}			
		},

		update : function(){
			this.updateMainSelect();
			this.updateTagSelect();
			this.updateSearchBox();
		},

		getTags : function(){
			var tags = [];
			var sections = _.where(this.sections, {isPreset : true});
			_.each(sections, function(section){
				if(section.selected){
					var option = _.findWhere(section.options, {value : section.selected});
					tags.push(option);
				}
			});
			_.each(this.presets, function(preset){
				tags.push(preset);
			});
			return tags;
		},

		renderMainSelect : function(){
            if(!this.sections){
                this.$mainSelect.remove();
                return false;
            }
			this.$mainMenu.empty();
			var firstSection = _.first(this.sections);
			_.each(this.sections, function(section){
				if(section !== firstSection){
					this.$mainMenu.append($('<div class="divider"></div>'));
				}
				if(section.header){
				    this.$mainMenu.append($('<div class="header">'+section.header+'</div>'));
				}
				_.each(section.options, function(option){
					var $item = $('<div data-name="'+section.name+'" data-value="'+option.value+'" class="item  '+(option.value == section.selected ? "active" : "")+'">'+option.text+'</div>');
					this.$mainMenu.append($item);
				}.bind(this));
			}.bind(this))

			this.$mainSelect.dropdown({
				forceSelection: false,
				action : function(text, value){
					this.handleMainSelect(value);
					this.$mainSelect.dropdown('hide');
				}.bind(this)

			});

			var option = _.findWhere(firstSection.options, {value : firstSection.selected});
			if(option) this.$mainSelect.dropdown('set text', option.text);
		},

		renderTagSelect : function(){
			var $tagSelectMenu = this.$tagSelect.find('.menu');
			$tagSelectMenu.empty();

			var tags = this.getTags();
			console.log("tags", tags);
			_.each(tags, function(tag){
				$tagSelectMenu.append($('<div class="item" data-value="'+tag.value+'">'+tag.text+'</div>'));
			});

			this.$tagSelect.dropdown({
				forceSelection: false,
				onShow : function(){return false;},
				onRemove : function(){
					setTimeout(this.handleTagRemove.bind(this), 10);
				}.bind(this)
			});

			setTimeout(function(){this.$tagSelect.dropdown('set exactly', _.pluck(tags, 'value'))}.bind(this), 100);
		},

		renderSearchBox : function(){
			this.updateSearchBox();
		},

		updateSearchBox : function(){
			this.$searchBox.val(this.queryString);
		},

		updateMainSelect : function(){
			_.each(this.sections, function(section){
				this.$mainSelect.find("[data-name='"+section.name+"']").removeClass('active').removeClass('selected');
				this.$mainSelect.find("[data-name='"+section.name+"'][data-value='"+ section.selected+"']").addClass('active').addClass('selected');
			}.bind(this));
			var firstSection = _.first(this.sections);
			var option = _.findWhere(firstSection.options, {value : firstSection.selected});
			console.log("updateMainSelect", option);
			if(option) this.$mainSelect.dropdown('set text', option.text);
		},

		updateTagSelect : function(){
			var tags = this.getTags();
			var $tagSelectMenu = this.$tagSelect.find('.menu');
			$tagSelectMenu.empty();

			_.each(tags, function(tag){
				$tagSelectMenu.append($('<div class="item" data-value="'+tag.value+'">'+tag.text+'</div>'));
			});

			this.$tagSelect.dropdown('refresh');
			this.$tagSelect.dropdown('set exactly', _.pluck(tags, 'value'));
		},

		handleTextSearch : function(evt){
			var value = evt ? $(evt.currentTarget).val() : this.$searchBox.val();
			this.queryString = value;
			this.debounceTriggerChange();

		},

		debounceTriggerChange : function(){
			this.triggerChange();
		},

		handleMainSelect : function(value){
			
			this.$searchBox.val('');
			this.handleTextSearch();

			var $option = this.$mainSelect.find('[data-value="'+value+'"]');

			var selectedSection = _.findWhere(this.sections, {name : $option.data('name')});
			if(selectedSection == this.sections[0] || value != selectedSection.selected)
				selectedSection.selected = value;
			else
				delete selectedSection.selected;

			this.updateMainSelect();
			this.updateTagSelect();
			this.toggleDisplay();
			this.triggerChange();
		},

		handleTagRemove : function(){
			var values = this.$tagSelect.dropdown('get value').split(",");

			_.each(this.sections, function(section){
				if(!section.isPreset) return;

				_.each(section.options, function(option){
					if(option.value == section.selected && _.indexOf(values, option.value) == -1){
						delete section.selected;
					}
				})
			});

			this.presets = _.filter(this.presets,function(preset){
				console.log("presets", values, _.indexOf(values, preset.value));
				return _.indexOf(values, preset.value) > -1
			});
			console.log("presets2", this.presets);

			this.toggleDisplay();
			this.updateMainSelect();
			this.triggerChange();
		},

		triggerChange : function(){
			var trigger = function(){
				var filters = this.getFilters();
				console.log("triggering", filters);
				this.trigger('change', this.getFilters());
			}.bind(this);
			setTimeout(trigger, 250);
		},


		getFilters : function(){
			var result = {};
			_.each(this.sections, function(section){
				result[section.name] = section.selected || "";
			});

			result[this.queryStringName] = this.queryString || '';

			if(this.srcPresets){
				_.each(this.srcPresets, function(preset){
					result[preset.key] = (_.indexOf(this.presets, preset) > -1) ? preset.value : null;
				}.bind(this))
			}
			console.log("getFilters", result);
			return result;
		}



	});

	return view;

});