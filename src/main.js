define(function (require) {
    'use strict';
    var AccountService = require("main/services/AccountService");
    var CacheService = require("main/services/CacheService");
    var ConfigService = require("main/services/ConfigService");
    var ErrorService = require("main/services/ErrorService");
    var FeatureToggleService = require("main/services/FeatureToggleService");
    var FileDownloadService = require("main/services/FileDownloadService");
    var FrameService = require("main/services/FrameService");
    var HierarchicalService = require("main/services/HierarchicalService");
    var MenuService = require("main/services/MenuService");
    var RefDataService = require("main/services/RefDataService");
    var SecurityService = require("main/services/SecurityService");
    var TagRService = require("main/services/TagRService");
    var UserService = require("main/services/UserService");

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

    var Cookie = require("main/utils/Cookie");
    var Extensions = require("main/utils/Extensions");
    var RemotingUtil = require("main/utils/RemotingUtil");
    var ValidationUtil = require("main/utils/ValidationUtil");

    var EventDispatcher = require("main/events/EventDispatcher");

    //Return the module value.
    var obj = {
        components: {
            BehaviorChart: behaviorChart,
            RelevancyChartView: RelevancyChartView,
            ComboFilter: ComboFilter,
            DigitalBehaviors: DigitalBehaviors,
            Activities: Activities,
            ListItems: ListItems,
            Technographics: Technographics,
            CrossDeviceFilterView: CrossDeviceFilterView,
            DependentModelView: DependentModelView,
            Dialog: Dialog,
            FilterManager: FilterManager,
            LocalStorage: LocalStorage,
            logoDonutChart: logoDonutChart,
            AccordionView: AccordionView,
            OverlayWithSectionsView: OverlayWithSectionsView,
            SegmentBuilder: SegmentBuilder,
            SegmentBuilderCustomVariable: SegmentBuilderCustomVariable,
            SegmentBuilderMultiSelect: SegmentBuilderMultiSelect,
            AudienceSizeBarMobile: AudienceSizeBarMobile,
            StackedBarMobile: StackedBarMobile,
            AudienceSizeBar: AudienceSizeBar,
            StackedBar: StackedBar,
            HMLBar: HMLBar,
            HMLStackedBar: HMLStackedBar,
            StatusDropdown: StatusDropdown,
            SubscriptionToggle: SubscriptionToggle,
            StatusIcon: StatusIcon,
            URLVars: URLVars
        },
        services: {
            AccountService: AccountService,
            CacheService: CacheService,
            ConfigService: ConfigService,
            ErrorService: ErrorService,
            FeatureToggleService: FeatureToggleService,
            FileDownloadService: FileDownloadService,
            FrameService: FrameService,
            HierarchicalService: HierarchicalService,
            MenuService: MenuService,
            RefDataService: RefDataService,
            SecurityService: SecurityService,
            TagRService: TagRService,
            UserService: UserService
        },
        utils: {
            Cookie: Cookie,
            Extensions: Extensions,
            RemotingUtil: RemotingUtil,
            ValidationUtil: ValidationUtil
        },
        events: {
            EventDispatcher: EventDispatcher
        }
    };
    
    
    return (function getModuleByResourceQuery() {
        debugger;
        if(!__resourceQuery){
            return obj;
        }

        if(__resourceQuery.indexOf("/") != -1){
            var resourcePath = __resourceQuery.split("/");
            resourcePath[0] = resourcePath[0].split("?")[1];
            var resolvedObj = obj;
            while(resourcePath.length){
                resolvedObj = resolvedObj[resourcePath.shift()];
            }
            return resolvedObj;
        }else{
            return obj[__resourceQuery.split("?")[1]];
        }
    })();
});