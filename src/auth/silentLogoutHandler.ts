/**
 * SilentLogoutHandler
 * 
 * @class SilentLogoutHandler
 */

import IframeHandler from './iframeHandler';

export default class SilentLogoutHandler {
    public logoutUrl: any;
    public timeout: any;
    public handler: any;

    constructor(options: any) {
        this.logoutUrl = options.logoutUrl;
        this.timeout = options.timeout || 60 * 1000;
        this.handler = null;
    }

    static create(options: any) {
        return new SilentLogoutHandler(options);
    };

    login(usePostMessage: boolean, callback: any) {
        this.handler = new IframeHandler({
            url: this.logoutUrl,
            eventListenerType: usePostMessage ? 'message' : 'load',
            callback: this.getCallbackHandler(callback, usePostMessage),
            timeout: this.timeout,
            eventValidator: this.getEventValidator(),
            timeoutCallback: () => {
                callback(null, '#error=timeout&error_description=Timeout+during+authentication+renew.');
            },
            usePostMessage: usePostMessage || false
        });

        this.handler.init();
    };

    getEventValidator() {
        return {
        };
    };

    getCallbackHandler(callback: any, usePostMessage: boolean) {
        return (eventData: any) => {
            let callbackValue;
            if (!usePostMessage) {
                // loadイベントの場合は、iframeウィンドウのフラグメントをコールバックへ渡す
                callbackValue = eventData.sourceObject.contentWindow.location.hash;
            } else if (typeof eventData.event.data === 'object' && eventData.event.data.hash) {
                callbackValue = eventData.event.data.hash;
            } else {
                callbackValue = eventData.event.data;
            }
            callback(null, callbackValue);
        };
    };
}
