define(["jquery","i18next","backbone",
    "common/services/AccountService",
    "common/utils/Cookie",
    'components/dialog/Dialog',
    "common/services/SecurityService",
    "common/services/ErrorService",
    "jqueryFileDownLoader"] ,
        function($, i18next, Backbone, AccountService, CookieUtil, Dialog, SecurityService, ErrorService) {

		var FileDownloadService = function(){}
	
		_.extend(FileDownloadService.prototype, Backbone.Events, {

			downloadActivityTags: function(options) {
                var jsonRequest = {
                    "accountId": AccountService.getCurrentAccount().id,
                    "accountName": "" + AccountService.getCurrentAccount().get("text"),
                    "activityId": options.activityIds.toString(),
                    "advertiserId": options.advertiserId,
                    "tagDomain": AccountService.getCurrentAccount().domain,
                    "tagGroupId": options.tagGroupId,
                    "option": "bulktag"
                };
                var requestParams = 'requestParams=' + JSON.stringify(jsonRequest);
                return this.downloadFile('download.htm', requestParams);
            },

			downloadDataSourceTemplate: function() {
                var jsonRequest = {};
                jsonRequest.accountId =  AccountService.getCurrentAccount().id;
                jsonRequest.option = 'datasource';
                var json = {};
                var requestParams = 'requestParams=' + JSON.stringify(jsonRequest);
                return this.downloadFile('download.htm', requestParams);
            },
            
            downloadDataSourceAttributes: function(options) {
                var jsonRequest = {};
                jsonRequest.accountId =  AccountService.getCurrentAccount().id;
                jsonRequest.option = 'datasource';
                jsonRequest.id = options.dataSourceId;
                var requestParams = 'requestParams=' + JSON.stringify(jsonRequest);
                return this.downloadFile('download.htm', requestParams);
            },
			
			downloadDataSourceKeyTemplate: function(options) {
                console.log('createEditBatchDataSource.downloadKeyTemplate : starts');
                var jsonRequest = {};
                jsonRequest.accountId =  AccountService.getCurrentAccount().id;
                jsonRequest.option = 'datasource';
                jsonRequest.type = 'key';
                jsonRequest.id = options.dataSourceId;
                jsonRequest.modelingLevel = options.modelingLevel;
                var requestParams = 'requestParams=' + JSON.stringify(jsonRequest);
                return this.downloadFile('download.htm', requestParams)
            },
            
           downladDataSourceMetadataFile : function(options){
                var jsonRequest = {};
                jsonRequest.accountId =  AccountService.getCurrentAccount().id;
                jsonRequest.option = 'datasource';
                jsonRequest.id = options.dataSourceId;
                var requestParams = 'requestParams=' + JSON.stringify(jsonRequest);
                return this.downloadFile('download.htm', requestParams);
           },

           exportATI : function(selectionCriteria, options){
                 options = options || {};
                 options.showDialog = true;
                 options.showDialogDelay = 2000;
                 options.dialogOptions = {
                   type : 'basic',
                   header : 'Generating Report',
                   content : 'Audience target indexing you requested are being generated and will download when complete. Thank you for your patience.' ,
                   buttons : '<i class="notched circle loading icon"></i><div class="ui  basic ok inverted button">'+i18next.t("app.runInBackground")+'</div>'
                 };
                 var params = $.param(selectionCriteria);

                 return this.downloadFile('exportData.htm', params, options);
           },

           exportBillingCode : function(selectionBillingCode, options){
                 options = options || {};
                 options.showDialog = true;
                 options.showDialogDelay = 2000;
                 options.dialogOptions = {
                   type : 'basic',
                   header : 'Generating Report',
                   content : 'Billing code you requested are being generated and will download when complete. Thank you for your patience.' ,
                   buttons : '<i class="notched circle loading icon"></i><div class="ui  basic ok inverted button">'+i18next.t("app.runInBackground")+'</div>'
                 };
                 
                 var params = $.param(selectionBillingCode);

                 return this.downloadFile('exportData.htm', params, options);
           },

           exportDsg : function(selectionBillingCode, options){
                options = options || {};
                options.showDialog = true;
                options.showDialogDelay = 2000;
                options.dialogOptions = {
                  type : 'basic',
                  header : 'Generating Report',
                  content : 'Data Source Groups report is being generated and will download when complete. Thank you for your patience.' ,
                  buttons : '<i class="notched circle loading icon"></i><div class="ui  basic ok inverted button">'+i18next.t("app.runInBackground")+'</div>'
                };

                var params = $.param(selectionBillingCode);

                return this.downloadFile('exportData.htm', params, options);
          },

           exportRelevancy : function(selectionCriteria, options){
                options = options || {};
                options.showDialog = true;
                options.showDialogDelay = 2000;
                options.dialogOptions = {
                  type : 'basic',
                  header : 'Generating Report',
                  content : 'Audience target insights export you requested is being generated and will download when complete. Thank you for your patience.' ,
                  buttons : '<i class="notched circle loading icon"></i><div class="ui  basic ok inverted button">'+i18next.t("app.runInBackground")+'</div>'
                };
                var params = $.param(selectionCriteria);

                return this.downloadFile('exportData.htm', params, options);
           },

           exportSegmentOverlap : function(selectionCriteria, options){
                options = options || {};
                options.showDialog = true;
                options.showDialogDelay = 2000;
                options.dialogOptions = {
                  type : 'basic',
                  header : 'Generating Report',
                  content : 'Segment Overlap you requested are being generated and will download when complete.</br></br>Thank you for your patience.' ,
                  buttons : '<i class="notched circle loading icon"></i><div class="ui  basic ok inverted button">'+i18next.t("app.runInBackground")+'</div>'
                };
                var params = $.param(selectionCriteria);
                return this.downloadFile('exportData.htm', params, options);
          },

           exportConsumerClusters : function(selectionCriteria, options){
                 options = options || {};
                 options.showDialog = true;
                 options.showDialogDelay = 2000;
                 options.dialogOptions = {
                   type : 'basic',
                   header : 'Generating Report',
                   //content : 'Audience target indexing you requested are being generated and will download when complete. Thank you for your patience.' ,
                   content : 'The report you requested is being generated and will download when complete. This may take a few minutes. Thank you for your patience.' ,
                   buttons : '<i class="notched circle loading icon"></i><div class="ui  basic ok inverted button">'+i18next.t("app.runInBackground")+'</div>'
                 };
                 var params = $.param(selectionCriteria);

                 return this.downloadFile('exportData.htm', params, options);
           },

           downladReportFromTemplate : function(options){
               options = options || {};
               options.showDialog = true;
               options.showDialogDelay = 2000;
               options.dialogOptions = {
                   type : 'basic',
                   width: '200px',
                   header : 'Generating Report',
                   content : i18next.t("app.reportDownloadStartMsg") ,
                   buttons : '<i class="notched circle loading icon"></i><div class="ui  basic ok inverted button">'+i18next.t("app.runInBackground")+'</div>'
               };
               var jsonRequest = {};
               jsonRequest.accountId =  AccountService.getCurrentAccount().id;
               jsonRequest.action = 'execute_template';
               jsonRequest.id = options.templateId;
               var requestParams = 'requestParams=' + JSON.stringify(jsonRequest);
               return this.downloadFile('export.htm', requestParams, options);
           },

           downloadReport : function(options){
              options = options || {};
              options.showDialog = true;
              options.showDialogDelay = 2000;
              options.dialogOptions = {
                type : 'basic',
                header : 'Generating Report',
                content : i18next.t("app.reportDownloadStartMsg") ,
                buttons : '<i class="notched circle loading icon"></i><div class="ui  basic ok inverted button">'+i18next.t("app.runInBackground")+'</div>'
              };
              var requestParams = 'requestParams=' + encodeURIComponent(JSON.stringify(options.exportJSON));
              return this.downloadFile('export.htm', requestParams, options);
          },
           
           hideLoadingDialog : function(){
            $("body").removeClass("dimmable").removeClass("blurring");
        	   if(this.dialog){
        	      this.dialog.hide();
        	      this.dialog = null;
        	   }
           },
           
           showLoadingDialog : function(options){
                if(!this.dialog){
                    this.dialog = new Dialog(options);
                    this.dialog.show().then(function(){
                        this.dialog = null;
                    }.bind(this));
                }
            },
           
           showError : function(errMsg){
               ErrorService.showError({message : errMsg});
           },
			
			downloadFile : function(url, postParam, options){
			    options = options || {};

			    var showLoadingDialog = options.showDialog;
                setTimeout( function(){
                    console.log("showDialog", options, showLoadingDialog);
                    if(showLoadingDialog){
                        this.showLoadingDialog(options.dialogOptions)
                    } }.bind(this) , options.showDialogDelay || 1);

				return $.fileDownload(url.addParameterToURL("AcmToken=" + SecurityService.token.get("access_token")),{
					
					httpMethod:'POST', 
					data: postParam,
					 successCallback: function (url) {
					    showLoadingDialog = false;
						 this.hideLoadingDialog();
						 if(options.onSuccess)
						    options.onSuccess();
					 }.bind(this),
					failCallback: function (responseHtml, url) {
					    showLoadingDialog = false;
					    this.hideLoadingDialog();
                        var error = CookieUtil.readCookie("error") || "genericErrMsg";
                        CookieUtil.eraseCookie("error");

                        console.log("failCallback",error, options.onError);
						if(options.onError){
						    error = options.onError(error, responseHtml);
						    console.log("failCallback", error);
						}

						if(error){
						    var message = '';
                            if(responseHtml.indexOf("Request timeout")!=-1 || error.indexOf("Request timeout")!=-1){
                                message = i18next.t("app.timeoutErrMsg");
                            }else{
                                var errorCode = "app." + error;
                                message = i18next.t(errorCode);
                                if(errorCode == message)
                                    message = i18next.t("app.genericErrMsg");
                            }
                            console.log("showError", error, message);
                            if(message){
                                this.showError(message);
                            }
						}

					}.bind(this)
				})
			}
		})
	return new FileDownloadService();

} );