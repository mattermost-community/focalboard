// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock, IMutableBlock} from './blocks/block'
import {Utils} from './utils'

//
// OctoClient is the client interface to the server APIs
//
class OctoClient {
    serverUrl: string
    token?: string

    constructor(serverUrl?: string, token?: string) {
        this.serverUrl = serverUrl || window.location.origin
        this.token = token
        Utils.log(`OctoClient serverUrl: ${this.serverUrl}`)
    }

    async login(username: string, password: string): Promise<boolean> {
        const path = '/api/v1/login'
        const body = JSON.stringify({username, password, type: 'normal'})
        const response = await fetch(this.serverUrl + path, {
            method: 'POST',
            headers: this.headers(),
            body,
        })
        if (response.status === 200) {
            const responseJson = (await response.json() || {}) as {token?: string}
            this.token = responseJson.token
            if (responseJson.token !== '') {
                localStorage.setItem('sessionId', this.token || '')
                return true
            }
            return false
        }
        return false
    }

    async register(email: string, username: string, password: string): Promise<boolean> {
        const path = '/api/v1/register'
        const body = JSON.stringify({email, username, password})
        const response = await fetch(this.serverUrl + path, {
            method: 'POST',
            headers: this.headers(),
            body,
        })
        if (response.status === 200) {
            return true
        }
        return false
    }

    headers() {
        return {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: this.token ? 'Bearer ' + this.token : '',
        }
    }

    async getSubtree(rootId?: string, levels = 2): Promise<IBlock[]> {
        const path = `/api/v1/blocks/${rootId}/subtree?l=${levels}`
        const response = await fetch(this.serverUrl + path, {headers: this.headers()})
        const blocks = (await response.json() || []) as IMutableBlock[]
        this.fixBlocks(blocks)
        return blocks
    }

    async exportFullArchive(): Promise<IBlock[]> {
        const path = '/api/v1/blocks/export'
        const response = await fetch(this.serverUrl + path, {headers: this.headers()})
        const blocks = (await response.json() || []) as IMutableBlock[]
        this.fixBlocks(blocks)
        return blocks
    }

    async importFullArchive(blocks: IBlock[]): Promise<Response> {
        Utils.log(`importFullArchive: ${blocks.length} blocks(s)`)
        blocks.forEach((block) => {
            Utils.log(`\t ${block.type}, ${block.id}`)
        })
        const body = JSON.stringify(blocks)
        return fetch(this.serverUrl + '/api/v1/blocks/import', {
            method: 'POST',
            headers: this.headers(),
            body,
        })
    }

    async getBlocksWithParent(parentId: string, type?: string): Promise<IBlock[]> {
        let path: string
        if (type) {
            path = `/api/v1/blocks?parent_id=${encodeURIComponent(parentId)}&type=${encodeURIComponent(type)}`
        } else {
            path = `/api/v1/blocks?parent_id=${encodeURIComponent(parentId)}`
        }
        return this.getBlocksWithPath(path)
    }

    async getBlocksWithType(type: string): Promise<IBlock[]> {
        const path = `/api/v1/blocks?type=${encodeURIComponent(type)}`
        return this.getBlocksWithPath(path)
    }

    private async getBlocksWithPath(path: string): Promise<IBlock[]> {
        const response = await fetch(this.serverUrl + path, {headers: this.headers()})
        const blocks = (await response.json() || []) as IMutableBlock[]
        this.fixBlocks(blocks)
        return blocks
    }

    // TODO: Remove this fixup code
    fixBlocks(blocks: IMutableBlock[]): void {
        if (!blocks) {
            return
        }

        for (const block of blocks) {
            if (!block.fields) {
                block.fields = {}
            }
        }
    }

    async updateBlock(block: IMutableBlock): Promise<Response> {
        block.updateAt = Date.now()
        return this.insertBlocks([block])
    }

    async updateBlocks(blocks: IMutableBlock[]): Promise<Response> {
        const now = Date.now()
        blocks.forEach((block) => {
            block.updateAt = now
        })
        return this.insertBlocks(blocks)
    }

    async deleteBlock(blockId: string): Promise<Response> {
        Utils.log(`deleteBlock: ${blockId}`)
        return fetch(this.serverUrl + `/api/v1/blocks/${encodeURIComponent(blockId)}`, {
            method: 'DELETE',
            headers: this.headers(),
        })
    }

    async insertBlock(block: IBlock): Promise<Response> {
        return this.insertBlocks([block])
    }

    async insertBlocks(blocks: IBlock[]): Promise<Response> {
        Utils.log(`insertBlocks: ${blocks.length} blocks(s)`)
        blocks.forEach((block) => {
            Utils.log(`\t ${block.type}, ${block.id}, ${block.title?.substr(0, 50) || ''}`)
        })
        const body = JSON.stringify(blocks)
        return fetch(this.serverUrl + '/api/v1/blocks', {
            method: 'POST',
            headers: this.headers(),
            body,
        })
    }

    // Returns URL of uploaded file, or undefined on failure
    async uploadFile(file: File): Promise<string | undefined> {
        // IMPORTANT: We need to post the image as a form. The browser will convert this to a application/x-www-form-urlencoded POST
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch(this.serverUrl + '/api/v1/files', {
                method: 'POST',

                // TIPTIP: Leave out Content-Type here, it will be automatically set by the browser
                headers: {
                    Accept: 'application/json',
                    Authorization: this.token ? 'Bearer ' + this.token : '',
                },
                body: formData,
            })
            if (response.status === 200) {
                try {
                    const text = await response.text()
                    Utils.log(`uploadFile response: ${text}`)
                    const json = JSON.parse(text)

                    // const json = await response.json()
                    return json.url
                } catch (e) {
                    Utils.logError(`uploadFile json ERROR: ${e}`)
                }
            }
        } catch (e) {
            Utils.logError(`uploadFile ERROR: ${e}`)
        }

        return undefined
    }
}

const client = new OctoClient(undefined, localStorage.getItem('sessionId') || '')

export default client
