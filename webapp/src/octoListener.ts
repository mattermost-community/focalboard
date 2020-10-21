// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Utils} from './utils'

//
// OctoListener calls a handler when a block or any of its children changes
//
class OctoListener {
    get isOpen(): boolean {
        return this.ws !== undefined
    }

    readonly serverUrl: string
    private ws?: WebSocket

    notificationDelay = 200

    constructor(serverUrl?: string) {
        this.serverUrl = serverUrl || window.location.origin
        Utils.log(`OctoListener serverUrl: ${this.serverUrl}`)
    }

    open(blockId: string, onChange: (blockId: string) => void) {
	    let timeoutId: NodeJS.Timeout

        if (this.ws) {
	        this.close()
        }

        const url = new URL(this.serverUrl)
	    const wsServerUrl = `ws://${url.host}${url.pathname}ws/onchange?id=${encodeURIComponent(blockId)}`
        Utils.log(`OctoListener open: ${wsServerUrl}`)
	    const ws = new WebSocket(wsServerUrl)
        this.ws = ws

	    ws.onopen = () => {
	        Utils.log(`OctoListener webSocket opened. blockId: ${blockId}`)
	        ws.send('{}')
	    }

	    ws.onerror = (e) => {
            Utils.logError(`OctoListener websocket onerror. blockId: ${blockId}, data: ${e}`)
	    }

	    ws.onclose = (e) => {
            Utils.log(`OctoListener websocket onclose, blockId: ${blockId}, code: ${e.code}, reason: ${e.reason}`)
	        if (ws === this.ws) {
                // Unexpected close, re-open
                Utils.logError('Unexpected close, re-opening...')
                this.open(blockId, onChange)
	        }
	    }

	    ws.onmessage = (e) => {
            Utils.log(`OctoListener websocket onmessage. blockId: ${blockId}, data: ${e.data}`)
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
                    break
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

        Utils.log(`OctoListener close: ${this.ws.url}`)

        // Use this sequence so the onclose method doesn't try to re-open
        const ws = this.ws
        this.ws = undefined
        ws.close()
    }
}

export {OctoListener}
