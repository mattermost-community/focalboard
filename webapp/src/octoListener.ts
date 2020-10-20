// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Utils} from './utils';

//
// OctoListener calls a handler when a block or any of its children changes
//
class OctoListener {
    get isOpen(): boolean {
        return this.ws !== undefined
    }

    readonly serverUrl: string
    private ws: WebSocket

    notificationDelay = 200

    constructor(serverUrl?: string) {
        this.serverUrl = serverUrl || window.location.origin
        console.log(`OctoListener serverUrl: ${this.serverUrl}`)
    }

    open(blockId: string, onChange: (blockId: string) => void) {
	    let timeoutId: NodeJS.Timeout

        if (this.ws) {
	        this.close()
        }

        const url = new URL(this.serverUrl)
	    const wsServerUrl = `ws://${url.host}${url.pathname}ws/onchange?id=${encodeURIComponent(blockId)}`
        console.log(`OctoListener initWebSocket wsServerUrl: ${wsServerUrl}`)
	    const ws = new WebSocket(wsServerUrl)
        this.ws = ws

	    ws.onopen = () => {
	        Utils.log('OctoListener webSocket opened.')
	        ws.send('{}')
	    };

	    ws.onerror = (e) => {
            Utils.logError(`OctoListener websocket onerror. data: ${e}`)
	    };

	    ws.onclose = (e) => {
            Utils.log(`OctoListener websocket onclose, code: ${e.code}, reason: ${e.reason}`)
	        if (this.isOpen) {
                // Unexpected close, re-open
                Utils.logError('Unexpected close, re-opening...')
                this.open(blockId, onChange)
	        }
	    }

	    ws.onmessage = (e) => {
            Utils.log(`OctoListener websocket onmessage. data: ${e.data}`)
            try {
	            const message = JSON.parse(e.data)
	            switch (message.action) {
                case 'UPDATE_BLOCK':
	                if (timeoutId) {
                        clearTimeout(timeoutId)
                    }
	                timeoutId = setTimeout(() => {
	                    timeoutId = undefined
	                    onChange(message.blockId)
                    }, this.notificationDelay)
                    break;
                default:
                    Utils.logError(`Unexpected action: ${message.action}`)
                }
            } catch (e) {
	            Utils.log('message is not an object')
            }
        }
    }

    close() {
        if (!this.ws) {
            return
        }

        this.ws.close()
        this.ws = undefined
    }
}

export {OctoListener}
