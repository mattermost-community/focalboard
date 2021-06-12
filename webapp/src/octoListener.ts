// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock} from './blocks/block'
import {Utils} from './utils'

// These are outgoing commands to the server
type WSCommand = {
    action: string
    workspaceId?: string
    readToken?: string
    blockIds: string[]
}

// These are messages from the server
type WSMessage = {
    action?: string
    block?: IBlock
    error?: string
}

type OnChangeHandler = (blocks: IBlock[]) => void
type OnStateChange = (state: 'open' | 'close') => void

//
// OctoListener calls a handler when a block or any of its children changes
//
class OctoListener {
    get isOpen(): boolean {
        return Boolean(this.ws)
    }

    readonly serverUrl: string
    private workspaceId?: string
    private token: string
    private readToken: string
    private ws?: WebSocket
    private blockIds: string[] = []
    private isInitialized = false

    private onChange?: OnChangeHandler
    private updatedBlocks: IBlock[] = []
    private updateTimeout?: NodeJS.Timeout

    notificationDelay = 100
    reopenDelay = 3000

    constructor(serverUrl?: string, token?: string, readToken?: string) {
        this.serverUrl = serverUrl || Utils.buildURL('', true).replace(/\/$/, '')
        this.token = token || localStorage.getItem('focalboardSessionId') || ''
        this.readToken = readToken || OctoListener.getReadToken()
        Utils.log(`OctoListener serverUrl: ${this.serverUrl}`)
    }

    static getReadToken(): string {
        const queryString = new URLSearchParams(window.location.search)
        const readToken = queryString.get('r') || ''
        return readToken
    }

    open(workspaceId: string, blockIds: string[], onChange: OnChangeHandler, onReconnect: () => void, onStateChange?: OnStateChange): void {
        if (this.ws) {
            this.close()
        }

        this.onChange = onChange
        this.workspaceId = workspaceId

        const url = new URL(this.serverUrl)
        const protocol = (url.protocol === 'https:') ? 'wss:' : 'ws:'
        const wsServerUrl = `${protocol}//${url.host}${url.pathname.replace(/\/$/, '')}/ws/onchange`
        Utils.log(`OctoListener open: ${wsServerUrl}`)
        const ws = new WebSocket(wsServerUrl)
        this.ws = ws

        ws.onopen = () => {
            Utils.log('OctoListener webSocket opened.')
            this.authenticate(workspaceId)
            this.addBlocks(blockIds)
            this.isInitialized = true
            onStateChange?.('open')
        }

        ws.onerror = (e) => {
            Utils.logError(`OctoListener websocket onerror. data: ${e}`)
        }

        ws.onclose = (e) => {
            Utils.log(`OctoListener websocket onclose, code: ${e.code}, reason: ${e.reason}`)
            if (ws === this.ws) {
                // Unexpected close, re-open
                const reopenBlockIds = this.isInitialized ? this.blockIds.slice() : blockIds.slice()
                Utils.logError(`Unexpected close, re-opening with ${reopenBlockIds.length} blocks...`)
                onStateChange?.('close')
                setTimeout(() => {
                    this.open(workspaceId, reopenBlockIds, onChange, onReconnect)
                    onReconnect()
                }, this.reopenDelay)
            }
        }

        ws.onmessage = (e) => {
            // Utils.log(`OctoListener websocket onmessage. data: ${e.data}`)
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

    close(): void {
        if (!this.ws) {
            return
        }

        Utils.log(`OctoListener close: ${this.ws.url}`)

        // Use this sequence so the onclose method doesn't try to re-open
        const ws = this.ws
        this.ws = undefined
        this.blockIds = []
        this.onChange = undefined
        this.isInitialized = false
        ws.close()
    }

    private authenticate(workspaceId: string): void {
        if (!this.ws) {
            Utils.assertFailure('OctoListener.addBlocks: ws is not open')
            return
        }

        if (!this.token) {
            return
        }
        const command = {
            action: 'AUTH',
            token: this.token,
            workspaceId,
        }
        this.ws.send(JSON.stringify(command))
    }

    private addBlocks(blockIds: string[]): void {
        if (!this.ws) {
            Utils.assertFailure('OctoListener.addBlocks: ws is not open')
            return
        }

        const command: WSCommand = {
            action: 'ADD',
            blockIds,
            workspaceId: this.workspaceId,
            readToken: this.readToken,
        }

        this.ws.send(JSON.stringify(command))
        this.blockIds.push(...blockIds)
    }

    private removeBlocks(blockIds: string[]): void {
        if (!this.ws) {
            Utils.assertFailure('OctoListener.removeBlocks: ws is not open')
            return
        }

        const command: WSCommand = {
            action: 'REMOVE',
            blockIds,
            workspaceId: this.workspaceId,
            readToken: this.readToken,
        }

        this.ws.send(JSON.stringify(command))

        // Remove registered blockIds, maintinging multiple copies (simple ref-counting)
        for (let i = 0; i < this.blockIds.length; i++) {
            for (let j = 0; j < blockIds.length; j++) {
                if (this.blockIds[i] === blockIds[j]) {
                    this.blockIds.splice(i, 1)
                    blockIds.splice(j, 1)
                }
            }
        }
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
            Utils.log(`OctoListener flush update block: ${block.id}`)
        }
        this.onChange?.(this.updatedBlocks)
        this.updatedBlocks = []
    }
}

export {OctoListener}
