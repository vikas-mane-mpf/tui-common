// Same code in home utils

define(['underscore'] , function(_){
    var Utils = {};
    Utils.timeoutHandler = function(timeout, $loaderEl, cb, widget){
        var timerId;
        $loaderEl.addClass('active');

        var fn = function(showError, event){
            if(timerId){
                if(event) {
                    console.log("Timeout " + timeout + ": Event " + event + " | " + widget);
                }
                clearTimeout(timerId);
                var finished = +Date.now()
                // console.log("Work finished in : ", ((finished - start)/1000));
                $loaderEl.removeClass('active');
                cb(showError);
                timerId = null;
            }
        };
        var start = +Date.now();
        // console.log("Work started at : ", start);
        if(timeout){
            timerId = setTimeout(fn.bind(this, true, "Timedout"), timeout);
        } else {
            fn = function(){
                $loaderEl.removeClass('active');
            };
        }

        return fn;
    }
    return Utils;
})