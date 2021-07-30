// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Utils} from './utils'
import {IBlock} from './blocks/block'

// These are outgoing commands to the server
type WSCommand = {
    action: string
    workspaceId?: string
    readToken?: string
    blockIds?: string[]
}

// These are messages from the server
type WSMessage = {
    action?: string
    block?: IBlock
    error?: string
}

type OnChangeHandler = (client: WSClient, blocks: IBlock[]) => void
type OnReconnectHandler = (client: WSClient) => void
type OnStateChangeHandler = (client: WSClient, state: 'init' | 'open' | 'close') => void
type OnErrorHandler = (client: WSClient, e: Event) => void

class WSClient {
    ws: WebSocket|null = null
    serverUrl: string
    state: 'init'|'open'|'close' = 'init'
    onStateChange: OnStateChangeHandler[] = []
    onReconnect: OnReconnectHandler[] = []
    onChange: OnChangeHandler[] = []
    onError: OnErrorHandler[] = []
    private notificationDelay = 100
    private reopenDelay = 3000
    private updatedBlocks: IBlock[] = []
    private updateTimeout?: NodeJS.Timeout

    constructor(serverUrl?: string) {
        this.serverUrl = (serverUrl || Utils.getBaseURL(true)).replace(/\/$/, '')
        Utils.log(`WSClient serverUrl: ${this.serverUrl}`)
    }

    addOnChange(handler: OnChangeHandler): void {
        this.onChange.push(handler)
    }

    removeOnChange(handler: OnChangeHandler): void {
        const index = this.onChange.indexOf(handler)
        if (index !== -1) {
            this.onChange.splice(index, 1)
        }
    }

    addOnReconnect(handler: OnReconnectHandler): void {
        this.onReconnect.push(handler)
    }

    removeOnReconnect(handler: OnReconnectHandler): void {
        const index = this.onReconnect.indexOf(handler)
        if (index !== -1) {
            this.onReconnect.splice(index, 1)
        }
    }

    addOnStateChange(handler: OnStateChangeHandler): void {
        this.onStateChange.push(handler)
    }

    removeOnStateChange(handler: OnStateChangeHandler): void {
        const index = this.onStateChange.indexOf(handler)
        if (index !== -1) {
            this.onStateChange.splice(index, 1)
        }
    }

    addOnError(handler: OnErrorHandler): void {
        this.onError.push(handler)
    }

    removeOnError(handler: OnErrorHandler): void {
        const index = this.onError.indexOf(handler)
        if (index !== -1) {
            this.onError.splice(index, 1)
        }
    }

    open(): void {
        const url = new URL(this.serverUrl)
        const protocol = (url.protocol === 'https:') ? 'wss:' : 'ws:'
        const wsServerUrl = `${protocol}//${url.host}${url.pathname.replace(/\/$/, '')}/ws`
        Utils.log(`WSClient open: ${wsServerUrl}`)
        const ws = new WebSocket(wsServerUrl)
        this.ws = ws

        ws.onopen = () => {
            Utils.log('WSClient webSocket opened.')
            for (const handler of this.onStateChange) {
                handler(this, 'open')
            }
            this.state = 'open'
        }

        ws.onerror = (e) => {
            Utils.logError(`WSClient websocket onerror. data: ${e}`)
            for (const handler of this.onError) {
                handler(this, e)
            }
        }

        ws.onclose = (e) => {
            Utils.log(`WSClient websocket onclose, code: ${e.code}, reason: ${e.reason}`)
            if (ws === this.ws) {
                // Unexpected close, re-open
                Utils.logError('Unexpected close, re-opening websocket')
                for (const handler of this.onStateChange) {
                    handler(this, 'close')
                }
                this.state = 'close'
                setTimeout(() => {
                    this.open()
                    for (const handler of this.onReconnect) {
                        handler(this)
                    }
                }, this.reopenDelay)
            }
        }

        ws.onmessage = (e) => {
            // Utils.log(`WSClient websocket onmessage. data: ${e.data}`)
            if (ws !== this.ws) {
                Utils.log('Ignoring closed ws')
                return
            }

            try {
                const message = JSON.parse(e.data) as WSMessage
                if (message.error) {
                    Utils.logError(`Listener websocket error: ${message.error}`)
                    return
                }

                switch (message.action) {
                case 'UPDATE_BLOCK':
                    this.queueUpdateNotification(message.block!)
                    break
                default:
                    Utils.logError(`Unexpected action: ${message.action}`)
                }
            } catch (err) {
                Utils.log('message is not an object')
            }
        }
    }

    authenticate(workspaceId: string, token: string): void {
        if (!this.ws) {
            Utils.assertFailure('WSClient.addBlocks: ws is not open')
            return
        }

        if (!token) {
            return
        }
        const command = {
            action: 'AUTH',
            token,
            workspaceId,
        }
        this.ws.send(JSON.stringify(command))
    }

    subscribeToBlocks(workspaceId: string, blockIds: string[], readToken = ''): void {
        if (!this.ws) {
            Utils.assertFailure('WSClient.subscribeToBlocks: ws is not open')
            return
        }

        const command: WSCommand = {
            action: 'SUBSCRIBE_BLOCKS',
            blockIds,
            workspaceId,
            readToken,
        }

        this.ws.send(JSON.stringify(command))
    }

    unsubscribeToWorkspace(workspaceId: string): void {
        if (!this.ws) {
            Utils.assertFailure('WSClient.subscribeToWorkspace: ws is not open')
            return
        }

        const command: WSCommand = {
            action: 'UNSUBSCRIBE_WORKSPACE',
            workspaceId,
        }

        this.ws.send(JSON.stringify(command))
    }

    subscribeToWorkspace(workspaceId: string): void {
        if (!this.ws) {
            Utils.assertFailure('WSClient.subscribeToWorkspace: ws is not open')
            return
        }

        const command: WSCommand = {
            action: 'SUBSCRIBE_WORKSPACE',
            workspaceId,
        }

        this.ws.send(JSON.stringify(command))
    }

    unsubscribeFromBlocks(workspaceId: string, blockIds: string[], readToken = ''): void {
        if (!this.ws) {
            Utils.assertFailure('WSClient.removeBlocks: ws is not open')
            return
        }

        const command: WSCommand = {
            action: 'UNSUBSCRIBE_BLOCKS',
            blockIds,
            workspaceId,
            readToken,
        }

        this.ws.send(JSON.stringify(command))
    }

    private queueUpdateNotification(block: IBlock) {
        this.updatedBlocks = this.updatedBlocks.filter((o) => o.id !== block.id) // Remove existing queued update
        this.updatedBlocks.push(block)
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout)
            this.updateTimeout = undefined
        }

        this.updateTimeout = setTimeout(() => {
            this.flushUpdateNotifications()
        }, this.notificationDelay)
    }

    private flushUpdateNotifications() {
        for (const block of this.updatedBlocks) {
            Utils.log(`WSClient flush update block: ${block.id}`)
        }
        for (const handler of this.onChange) {
            handler(this, this.updatedBlocks)
        }
        this.updatedBlocks = []
    }

    close(): void {
        if (!this.ws) {
            return
        }

        Utils.log(`WSClient close: ${this.ws.url}`)

        // Use this sequence so the onclose method doesn't try to re-open
        const ws = this.ws
        this.ws = null
        this.onChange = []
        this.onReconnect = []
        this.onStateChange = []
        this.onError = []
        try {
            ws?.close()
        } catch {
            try {
                (ws as any)?.websocket?.close()
            } catch {
                Utils.log('WSClient unable to close the websocket')
            }
        }
    }
}

const wsClient = new WSClient()

export {WSClient}
export default wsClient
