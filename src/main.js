define(function (require) {
    'use strict';
    
    var behaviorChart = require("components/behaviorChart/behaviorChart");
    var bubbleChart = require("components/bubble/bubbleChart");
    var ComboFilter = require("components/comboFilter/ComboFilter");
    var DigitalBehaviors = require("components/consumerCluster/DigitalBehaviors");
    var Activities = require("components/consumerCluster/Activities");
    var ListItems = require("components/consumerCluster/ListItems");
    var Technographics = require("components/consumerCluster/Technographics");
    var iconModel = require("components/consumerCluster/iconModel");
    var CrossDeviceFilterView = require("components/crossDeviceFilter/CrossDeviceFilterView");
    var DependentModelView = require("components/dependentModels/views/DependentModelView");
    var Dialog = require("components/dialog/Dialog");
    var FilterManager = require("components/filterManager/FilterManager");
    var LocalStorage = require("components/localstorage/LocalStorage");
    var logoDonutChart = require("components/logoDonutChart/LogoDonutChart");
    var accordionView = require("components/multilevelAccordion/accordionView");
    var OverlayWithSectionsView = require("components/overlayWithSections/views/OverlayWithSectionsView");
    var OverlayWithSectionsViewDataModel = require("components/overlayWithSections/model/dataModel");
    var SegmentBuilder = require("components/segmentBuilder/views/parentView");
    var SegmentOverlayDataModel = require("components/segmentBuilder/model/dataModel");
    var SegmentBuilderCustomVariable = require("components/segmentBuilderCustomVariable/views/customVariableComponentView");
    var CustomVariableDataModel = require("components/segmentBuilderCustomVariable/model/dataModel");
    var SegmentBuilderMultiSelect = require("components/segmentBuilderMultiSelect/view/multiSelectView");
    var AudienceSizeBarMobile = require("components/stackedBar/mobileAudience/AudienceSizeBarView");
    var AudienceSizeBarModel = require("components/stackedBar/AudienceSizeBarModel");
    var StackedBarView = require("components/stackedBar/StackedBarView");
    var AudienceSizeBarModelMobile = require("components/stackedBar/mobileAudience/AudienceSizeBarModel");
    var StackedBarMobile = require("components/stackedBar/mobileAudience/StackedBarMobileView");
    var AudienceSizeBar = require("components/stackedBar/AudienceSizeBarView");
    var StackedBar = require("components/stackedBar/AudienceSizeBarView");
    var RuleView = require("components/ruleView/RuleView");
    var DataPartnerRuleView = require("components/ruleView/DataPartnerRuleView");
    var HMLBar = require("components/stackedBar/HMLBarView");
    var HMLBarModel = require("components/stackedBar/HMLBarModel");
    var HMLStackedBar = require("components/stackedBar/HMLStackedBarView");
    var StatusDropdown = require("components/statusDropdown/StatusDropdown");
    var SubscriptionToggle = require("components/statusDropdown/subscriptionToggle");
    var AdvertiserStatusIconView = require("components/statusIcon/AdvertiserStatusIconView");
    var StatusIcon = require("components/statusIcon/StatusIcon");
    var URLVars = require("components/URLVars/URLVars");

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
    var ComponentConfigModel = require("models/ComponentConfigModel");
    var RowRenderingConfigModel = require("models/RowRenderingConfigModel");
    
    var CacheService = require("services/CacheService");
    var ConfigService = require("services/ConfigService");
    var ErrorService = require("services/ErrorService");
    var RefDataService = require("services/RefDataService");
    var RemoteService = require("services/RemoteService");
    var AccountService = require("services/AccountService");
    var SecurityService = require("services/SecurityService");
    var FeatureToggleService = require("services/FeatureToggleService");
    var FileDownloadService = require("services/FileDownloadService");
    var FrameService = require("services/FrameService");
    var HierarchicalService = require("services/HierarchicalService");
    var MenuService = require("services/MenuService");
    var TagRService = require("services/TagRService");
    var UserService = require("services/UserService");

    var Cookie = require("utils/Cookie");
    var Extensions = require("utils/Extensions");
    var RemotingUtil = require("utils/RemotingUtil");
    var ValidationUtil = require("utils/ValidationUtil");

    var EventDispatcher = require("events/EventDispatcher");

   

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
            UserModel : UserModel,
            ComponentConfigModel: ComponentConfigModel,
            RowRenderingConfigModel: RowRenderingConfigModel
        },
        components: {
            BehaviorChart: behaviorChart,
            bubbleChart: bubbleChart,
            ComboFilter: ComboFilter,
            DigitalBehaviors: DigitalBehaviors,
            Activities: Activities,
            ListItems: ListItems,
            Technographics: Technographics,
            iconModel: iconModel,
            CrossDeviceFilterView: CrossDeviceFilterView,
            DependentModelView: DependentModelView,
            Dialog: Dialog,
            FilterManager: FilterManager,
            LocalStorage: LocalStorage,
            logoDonutChart: logoDonutChart,
            accordionView: accordionView,
            OverlayWithSectionsView: OverlayWithSectionsView,
            OverlayWithSectionsViewDataModel: OverlayWithSectionsViewDataModel,
            SegmentBuilder: SegmentBuilder,
            SegmentOverlayDataModel: SegmentOverlayDataModel,
            SegmentBuilderCustomVariable: SegmentBuilderCustomVariable,
            CustomVariableDataModel: CustomVariableDataModel,
            SegmentBuilderMultiSelect: SegmentBuilderMultiSelect,
            StackedBarView: StackedBarView,
            AudienceSizeBarMobile: AudienceSizeBarMobile,
            AudienceSizeBarModel: AudienceSizeBarModel,
            AudienceSizeBarModelMobile: AudienceSizeBarModelMobile,
            StackedBarMobile: StackedBarMobile,
            AudienceSizeBar: AudienceSizeBar,
            StackedBar: StackedBar,
            DataPartnerRuleView: DataPartnerRuleView,
            RuleView: RuleView,
            HMLBar: HMLBar,
            HMLBarModel: HMLBarModel,
            HMLStackedBar: HMLStackedBar,
            StatusDropdown: StatusDropdown,
            SubscriptionToggle: SubscriptionToggle,
            StatusIcon: StatusIcon,
            AdvertiserStatusIconView: AdvertiserStatusIconView,
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
            RemoteService: RemoteService,
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