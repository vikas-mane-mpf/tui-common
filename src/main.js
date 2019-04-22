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

    var AccountCollection = require("collections/AccountCollection");
    var AdvertiserCollection = require("collections/AdvertiserCollection");
    var DeliveryPlatformCollection = require("collections/DeliveryPlatformCollection");
    var AgencyCollection = require("collections/AgencyCollection");
    var CoreAgencyCollection = require("collections/CoreAgencyCollection");
    var GeoCollection = require("collections/GeoCollection");
    var TPAccountsCollection = require("collections/TPAccountsCollection");
    var ModelReportingCollection = require("collections/ModelReportingCollection");

    var AdvertiserModel = require("models/AdvertiserModel");
    var AccountModel = require("models/AccountModel");
    var AccessTokenModel = require("models/AccessTokenModel");
    var AgencyModel = require("models/AgencyModel");
    var DeliveryPlatformModel = require("models/DeliveryPlatformModel");
    var GeoModel = require("models/GeoModel");
    var ModelReportingModel = require("models/ModelReportingModel");
    var TPAccountsModel = require("models/TPAccountsModel");
    var MenuConfigModel = require("models/MenuConfigModel");
    var UserModel = require("models/UserModel");

    //Return the module value.
    var obj = {
        collections:{
            AccountCollection: AccountCollection,
            AdvertiserCollection: AdvertiserCollection,
            DeliveryPlatformCollection: DeliveryPlatformCollection,
            AgencyCollection: AgencyCollection,
            CoreAgencyCollection: CoreAgencyCollection,
            GeoCollection: GeoCollection,
            TPAccountsCollection: TPAccountsCollection,
            ModelReportingCollection: ModelReportingCollection
        },
        models:{
            AccountModel : AccountModel,
            AdvertiserModel : AdvertiserModel,
            AccessTokenModel : AccessTokenModel,
            AgencyModel : AgencyModel,
            DeliveryPlatformModel : DeliveryPlatformModel,
            GeoModel : GeoModel,
            ModelReportingModel : ModelReportingModel,
            TPAccountsModel : TPAccountsModel,
            MenuConfigModel : MenuConfigModel,
            UserModel : UserModel
        },
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