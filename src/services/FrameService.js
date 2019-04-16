define(['backbone'],
    function(Backbone) {

        /**
         * FrameService
         *
         * This service is used to handle cross-frame communication through different domains
         *
         * @constructor
         */
        var FrameService = function(){};

        _.extend(FrameService.prototype, Backbone.Events, {

            /**
             * A list of allowed Origins (RegEx)
             */
            allowedOrigins: {},

            /**
             * Name of the current environment
             */
            environment: '',

            /**
             * Stores a map of responder names along with callbacks
             */
            actions : {},

            /**
             * Stores Response Callbacks
             */
            responseCallbacks: {},

            /**
             * Initialize
             *
             * @param environment e.g. "QA" or "PROD"
             */
            initialize: function(environment, allowedOrigins) {
                this.allowedOrigins = allowedOrigins;
                this.environment = environment.toUpperCase();
                this.registerEventListener();
            },

            /**
             * Register Event Listener
             */
            registerEventListener: function() {
                var self = this;
                window.addEventListener('message', function(event) { self.receiveMessage(event) }, false);
            },

            /**
             * Is Origin allowed?
             *
             * @param origin The Origin to test
             */
            isOriginAllowed: function(origin) {
                var isAllowed = false,
                    allowedOrigins = this.allowedOrigins[this.environment];

                allowedOrigins.forEach(function(allowedOrigin) {
                    if (origin.match(new RegExp(allowedOrigin))) {
                        isAllowed = true;
                    }
                });

                return isAllowed;
            },

            /**
             * Create UUID
             *
             * @returns {string}
             */
            createUuid: function() {
                var dt = new Date().getTime();
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = (dt + Math.random() * 16) % 16 | 0;
                    dt = Math.floor(dt / 16);
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
            },

            /**
             * Handle a received PostMessage
             *
             * @param event
             */
            receiveMessage: function (event) {
                var receivedMessage = event.data;
                var responsePayload = null;

                if (! this.allowedOrigins.hasOwnProperty(this.environment)) {
                    console.error("No allowed origins for environment: " + this.environment);
                    return;
                }

                if (! this.isOriginAllowed(event.origin)) {
                    console.error("The following origin is not allowed to access this resource. Please add to allowedOrigins: " + event.origin);
                    return;
                }

                if (receivedMessage.isResponse) {
                    if (typeof this.responseCallbacks[receivedMessage.messageId] === 'function') {
                        this.responseCallbacks[receivedMessage.messageId](receivedMessage.payload);
                        delete this.responseCallbacks[receivedMessage.messageId];
                    }
                } else {
                    if (this.actions.hasOwnProperty(receivedMessage.action)) {
                        responsePayload = this.actions[receivedMessage.action](receivedMessage.payload);
                    }

                    if (responsePayload !== null) {
                        var responseMessage = {
                            messageId: receivedMessage.messageId,
                            action: receivedMessage.action,
                            isResponse: true,
                            payload: responsePayload
                        };

                        event.source.postMessage(responseMessage, event.origin);
                    }
                }
            },

            /**
             * Issue a Request to another window object
             *
             * @param target window object
             * @param action
             * @param payload
             * @param callback
             */
            request: function(target, action, payload, callback) {
                var messageId = this.createUuid();
                var isResponse = false;
                var message = {
                    "messageId": messageId,
                    "action": action,
                    "isResponse": isResponse,
                    "payload": payload
                };

                if (typeof callback === 'function') {
                    this.responseCallbacks[messageId] = callback;
                }

                target.postMessage(message, '*');
            },

            /**
             * Register an action that can be requested by another window/iframe
             *
             * @param name
             * @param callback
             */
            registerAction: function(name, callback) {
                this.actions[name] = callback;
            }
        });

        return new FrameService();
    });