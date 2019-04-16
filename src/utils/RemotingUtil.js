define([
        'jquery',
        'underscore',
        'backbone',
        'i18next'
    ],
    function($, _,Backbone, i18next) {
        var RemotingUtil= function(){}
        
        RemotingUtil.prototype = {
    		getErrorMsg : function(response, params){
    	    	var errorMsg = i18next.t('app.errorUnknown');
    	    	try{
    	    		var i18Params = { defaultValue : response.errors[0].messages[0].message };
    	    		if( params ) {
    	    			i18Params = $.extend(i18Params, params);
    	    		}  
    	    		if(response.errors[0].messages[0].code){
    					errorMsg = i18next.t('app.' + response.errors[0].messages[0].code.replace(/\./g, '_'), i18Params);
    				}else{
    					errorMsg = response.errors[0].messages[0].message;
    				}	
    	    	}catch(err){}
    			return errorMsg;         	
    	    },
        }

        
        return RemotingUtil;
	});
        