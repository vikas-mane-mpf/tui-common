define(function (require) {
    'use strict';
    var AccountService = require("services/AccountService");
    var CacheService = require("services/CacheService");
    var ConfigService = require("services/ConfigService");
    var ErrorService = require("services/ErrorService");
    var FeatureToggleService = require("services/FeatureToggleService");
    var FileDownloadService = require("services/FileDownloadService");
    var FrameService = require("services/FrameService");
    var HierarchicalService = require("services/HierarchicalService");
    var MenuService = require("services/MenuService");
    var RefDataService = require("services/RefDataService");
    var SecurityService = require("services/SecurityService");
    var TagRService = require("services/TagRService");
    var UserService = require("services/UserService");


    var behaviorChart = require("components/behaviorChart/behaviorChart");
    var RelevancyChartView = require("components/bubble/bubbleChart");
    var ComboFilter = require("components/comboFilter/ComboFilter");
    var DigitalBehaviors = require("components/consumerCluster/DigitalBehaviors");
    var Activities = require("components/consumerCluster/Activities");
    var ListItems = require("components/consumerCluster/ListItems");
    var Technographics = require("components/consumerCluster/Technographics");
    var CrossDeviceFilterView = require("components/crossDeviceFilter/CrossDeviceFilterView");
    var DependentModelView = require("components/dependentModels/views/DependentModelView");
    var Dialog = require("components/dialog/Dialog");
    var FilterManager = require("components/filterManager/FilterManager");
    var LocalStorage = require("components/localstorage/LocalStorage");
    var logoDonutChart = require("components/logoDonutChart/LogoDonutChart");
    var AccordionView = require("components/multilevelAccordion/accordionView");
    var OverlayWithSectionsView = require("components/overlayWithSections/views/OverlayWithSectionsView");
    var SegmentBuilder = require("components/segmentBuilder/views/parentView");
    var SegmentBuilderCustomVariable = require("components/segmentBuilderCustomVariable/views/customVariableComponentView");
    var SegmentBuilderMultiSelect = require("components/segmentBuilderMultiSelect/view/multiSelectView");
    var AudienceSizeBarMobile = require("components/stackedBar/mobileAudience/AudienceSizeBarView");
    var StackedBarMobile = require("components/stackedBar/mobileAudience/StackedBarMobileView");
    var AudienceSizeBar = require("components/stackedBar/AudienceSizeBarView");
    var StackedBar = require("components/stackedBar/AudienceSizeBarView");
    var HMLBar = require("components/stackedBar/HMLBarView");
    var HMLStackedBar = require("components/stackedBar/HMLStackedBarView");
    var StatusDropdown = require("components/statusDropdown/StatusDropdown");
    var SubscriptionToggle = require("components/statusDropdown/subscriptionToggle");
    var StatusIcon = require("components/statusIcon/StatusIcon");
    var URLVars = require("components/URLVars/URLVars");

    var Cookie = require("utils/Cookie");
    var Extensions = require("utils/Extensions");
    var RemotingUtil = require("utils/RemotingUtil");
    var ValidationUtil = require("utils/ValidationUtil");

    var EventDispatcher = require("events/EventDispatcher");

    //Return the module value.
    return {
        services: {
            AccountService: AccountService,
            CacheService: CacheService,
            ConfigService: ConfigService,
            ErrorService: ErrorService,
            LocalStorage: LocalStorage
        },
    };
});