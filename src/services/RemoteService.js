define(['underscore', 'jquery', 'backbone'],
function(_, $, Backbone){

    //$.xhrPool = [];

	var RemoteService = function(){}
	
	_.extend(RemoteService.prototype, Backbone.Events, {
		
		/*abortAll : function(config) {
             $.each($.xhrPool, function(idx, jqXHR) {
                 if (!_.isUndefined(jqXHR))
                     jqXHR.abort();
             });
             $.xhrPool = [];
        },*/
        
		ajax : function(options) {
			var defaults = {
					type : 'post',
					cache : false,
					contentType : 'application/json; charset=utf-8',
					dataType : 'json',
					async : true
			}
			var handlers = {
				/*beforeSend: function(jqXHR) {
                    $.xhrPool.push(jqXHR);
                },*/
                /*complete: function(jqXHR) {
                    var index = $.xhrPool.indexOf(jqXHR);
                    if (index > -1) {
                        $.xhrPool.splice(index, 1);
                    }
                },*/
                success: function(json) {
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    if (XMLHttpRequest.status == 401) {
                        this.trigger("FailedRequest", XMLHttpRequest);
                    }
                }.bind(this)
			};
            return $.ajax( _.extend(_.extend(_.clone(defaults), options), handlers));
        }
	});
	
	var service = new RemoteService();
	return service;
});
