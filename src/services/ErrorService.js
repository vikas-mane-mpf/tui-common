define(['underscore', 'jquery', 'backbone', 'i18next', "components/dialog/Dialog"],
function(_, $, Backbone, i18next, Dialog){

	var ErrorService = function(){}

	_.extend(ErrorService.prototype, Backbone.Events, {

		initialize : function(){},

		showError : function(error, options){
		    error = error || {};
		    options = options || {};
		    console.log("showError", options);
            dialogType = (error.type === 'consumerClusterProcess' ? 'consumerProcess' : 'basic');
            buttonHTML = (error.type === 'consumerClusterProcess' ? '<div class="ui primary approve button">'+i18next.t("app.confirmTxt")+'</div>' : '<div class="ui  basic ok inverted button">'+i18next.t("app.ok")+'</div>');
            return new Dialog(_.extend({}, options, {
               closeOthers : true,
               type : dialogType,
               header : error.title || i18next.t("app.errorHeading"),
               content : error.message || i18next.t("app.genericErrMsg"),
               buttons : buttonHTML
           })).show();
		},

		responseHasError : function(response){
		    return response.errors ? true : false;
		},

		getErrorFromResponse : function(response, params){
		    var error = {title : i18next.t("app.errorHeading"), message : i18next.t('app.errorUnknown')};
            try{
                var defaultHeader = i18next.t("app.errorHeading");
                var defaultMessage = response.errors[0].messages[0].message;
                var headerParams = $.extend({defaultValue : defaultHeader}, params);
                var messageParams = $.extend({defaultMessage : defaultMessage}, params);
                if(response.errors[0].messages[0].code && i18next.exists('app.' + response.errors[0].messages[0].code.replace(/\./g, '_'))){
					error.message = i18next.t('app.' + response.errors[0].messages[0].code.replace(/\./g, '_'), messageParams);
                    error.title = i18next.t('app.' + response.errors[0].messages[0].code.replace(/\./g, '_') + '_header', headerParams);
				}else{
					error.message = response.errors[0].messages[0].message;
				}
	    	}catch(err){
	    		console.log('GenericFunctions._getErrorMsg : exception = ', err);
	    	}

			return error;
		},

        showTooltip : function(translationToken, defaultMessage){
            if(i18next.exists(translationToken)){
                return i18next.t(translationToken);
            }else{
                return i18next.t(defaultMessage);
            }
        }
	});

	var service = new ErrorService();
	return service;
});
