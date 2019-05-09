define(["services/AccountService", "services/ConfigService"],
function(AccountService, ConfigService){
	var FeatureToggleService = {

		AUDIENCE_DISCOVERY : "audience_discovery_ui.TRB-218",
		CONSUMER_CLUSTERING : "consumer_clustering_ui.MIPUI-302",
		CONSUMER_CLUSTERING_FINAL : "consumer_clustering_final_ui.MIPUI-302",
		CONSUMER_CLUSTERING_DETAIL_FINAL : "consumer_clustering_detail_final_ui.MIPUI-302",
		CONSUMER_CLUSTERING_NEW : "enable_new_clustering",
		AUDIENCE_DISCOVERY_FINAL : "audience_discovery_final.TUI-3612",
		AUDIENCE_RELEVANCY : "audience_relevancy.TUI-3253",
		ENABLE_DEMO_UI : "enable_demo_ui",
		ENABLE_SERVER_SIDE_SEARCH : "fetch_model_db_list.MIPUI-130",
		BILLING_CODE_DATAPARTNER_FEATURE : "billing_code_datapartners.MITUI-858",
        DIGITAL_BEHAVIOR_DSP_CONFIGURATION : "digital_behavior_dsp_configurations.MIPUI-2175",
        DATA_SOURCE_GROUP_CONFIGURATION : "data_source_group.MIPUI-1648",
        ENABLE_EDIT_DATA_ATTRIBUTE_LDS_MIPUI_2405 : "enable_edit_data_attribute_lds_MIPUI-2405",
        ENABLE_EDIT_DATA_ATTRIBUTE_BDS_MIPUI_2405 : "enable_edit_data_attribute_bds_MIPUI-2405",
        ENABLE_DATA_SOURCE_GROUP_MIPUI_2114 : "ATI_Highlight_Isolate_Data_Source_Group_MIPUI-2114",
        ENABLE_MODEL_EXPIRY_MIPUI_2037 : "enable_model_expiry_MIPUI-2037",
        EXPORT_DSG_MIPUI_2616 : "export_dsg_MIPUI-2616",
        ENABLE_DATA_ATTRIBUTE_RENAMING_BDS_MIPUI_2644 : "enable_data_attribute_renaming_bds_MIPUI-2644",
        ENABLE_ATI_INDEX_ATTRIBUTE_BDS_MIPUI_2632: "enable_ATI_index_attribute_bds_MIPUI-2632",
        VISITOR_COUNT_DROPDOWN_VISIBILITY_MIPUI_2989: "visitor-count-dropdown-visibility-MIPUI-2989",
        ENABLE_MOBILE_APP_BEHAVIORS_BY_ACCOUNT_MIPUI_3125: "enable_mobile_app_behaviors_by_account_MIPUI-3125",
        ENABLE_MOBILE_APP_BEHAVIORS_BY_SUPER_USER_MIPUI_3125: "enable_mobile_app_behaviors_by_superuser_MIPUI-3125",
        ENABLE_IDTYPE_RADIO_BUTTONS_BDS_LDS_MIPUI_3178: "enable_IDType_radio_buttons_BDS_LDS_MIPUI-3178",
        ENABLE_NEW_ATTRIBUTE_DROPDOWN_ATI_MIPUI_3072: "enable_new_attribute_dropdown_ATI_MIPUI-3072",
        ENABLE_IDTYPE_RADIO_BUTTONS_DAPA_LAL_MIPUI_3179: "enable_IDType_radio_buttons_DAPA_LAL_MIPUI-3179",
        MIUI_GDPR_MIPUI_3323 : "miui_GDPR_MIPUI-3323",
        ENABLE_DATASOURCE_ACTIVITY_UNDER_AGENCY_ACCOUNT_MIPUI_3219 : "enable_datasource_activity_under_agency_account_MIPUI-3219",
        ENABLE_MODELING_LEVEL_ON_CS_BY_ACCOUNT_MIPUI_4012 : "enable_modeling_level_on_cs_by_account_MIPUI-4012",
        ENABLE_MODELING_LEVEL_ON_CS_BY_SUPER_USER_MIPUI_4012 : "enable_modeling_level_on_cs_by_superuser_MIPUI-4012",
        ENABLE_MODELING_LEVEL_ATI_ON_CS_BY_SUPERUSER_MIPUI_3956 : "enable_modeling_level_ati_on_cs_by_superuser_MIPUI-3956",
        ENABLE_DPM_THIRDPARTY: "enable_dpm_thirdparty",
        ENABLE_EPM: "enable_epm",
        ENABLE_DPM_DMP: "enable_dpm_dmp",
        ENABLE_TV_ACP: "enable_tv_acp",
        ENABLE_TV_MI: "enable_tv_mi",
        ENABLE_TV_OLS: "enable_tv_ols",
        ENABLE_TV_BCA: "enable_tv_bca",
        ENABLE_SPOTIFY: "enable_spotify",
        ENABLE_CONSUMERCONQUESTING: "enable_consumerconquesting",
        ENABLE_CONSUMERCONQUESTING_AMEX: "enable_consumerconquesting_amex",
        ENABLE_CONSUMERCONQUESTING_VOLVO: "enable_consumerconquesting_volvo",
        ENABLE_SMARTTOOL: "enable_smarttool",
        DATA_LEDGER_SECTION: "enable_data_ledger.MIPUI-4210",
        ENABLE_FORD_LOGO: "enable_ford_logo.MIPUI-4700",
        ENABLE_IAB2: "use_iab2.MIEMS-645",
        ENABLE_EXPORT_SEGMENTS_AUDIENCE_LAL: "enable_export_segments_audience_lal",
        ENABLE_EXPORT_SEGMENTS_DATA_PATNER_LAL: "enable_export_segments_data_patner_lal",
        ENABLE_EXPORT_SEGMENTS_ADVERTISER_LAL: "enable_export_segments_advertiser_lal",


		isFeatureEnabled : function(feature){
			var constants = ConfigService.getConfig("constants");
			var account = AccountService.getCurrentAccount();
			if(!account)
			    return false;

			var strFeatureAccounts = String(constants.featureToggle ? constants.featureToggle[feature] : "");
			if(strFeatureAccounts == "*")
				return true;
			
			var featureAccounts = strFeatureAccounts.split(",");
			return featureAccounts.indexOf(String(account.id)) > -1
		},
		
		areFeaturesEnabled : function(features){
			var enabled = true;
			_.each(features, function(feature){
				enabled = enabled && this.isFeatureEnabled(feature);
			}.bind(this));
			console.log("areFeaturesEnabled", enabled, features);
			return enabled;
        },
        
        getFeatureToggleValue: function(feature){
            var constants = ConfigService.getConfig("constants");
            return String(constants.featureToggle ? constants.featureToggle[feature] : "");
        }
	};
	
	return FeatureToggleService;
} )