// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock, IMutableBlock} from './blocks/block'
import {Utils} from './utils'

//
// OctoClient is the client interface to the server APIs
//
class OctoClient {
    serverUrl: string

    constructor(serverUrl?: string) {
        this.serverUrl = serverUrl || window.location.origin
        Utils.log(`OctoClient serverUrl: ${this.serverUrl}`)
    }

    async getSubtree(rootId?: string): Promise<IBlock[]> {
        const path = `/api/v1/blocks/${rootId}/subtree`
        const response = await fetch(this.serverUrl + path)
        const blocks = (await response.json() || []) as IMutableBlock[]
        this.fixBlocks(blocks)
        return blocks
    }

    async exportFullArchive(): Promise<IBlock[]> {
        const path = '/api/v1/blocks/export'
        const response = await fetch(this.serverUrl + path)
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
        return await fetch(this.serverUrl + '/api/v1/blocks/import', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
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
        const response = await fetch(this.serverUrl + path)
        const blocks = (await response.json() || []) as IMutableBlock[]
        this.fixBlocks(blocks)
        return blocks
    }

    fixBlocks(blocks: IMutableBlock[]): void {
        if (!blocks) {
            return
        }

        // TODO
        for (const block of blocks) {
            if (!block.fields) {
                block.fields = {}
            }
            const o = block as any
            if (o.cardProperties) {
                block.fields.cardProperties = o.cardProperties; delete o.cardProperties
            }
            if (o.properties) {
                block.fields.properties = o.properties; delete o.properties
            }
            if (o.icon) {
                block.fields.icon = o.icon; delete o.icon
            }
            if (o.url) {
                block.fields.url = o.url; delete o.url
            }
        }
    }

    async updateBlock(block: IMutableBlock): Promise<Response> {
        block.updateAt = Date.now()
        return await this.insertBlocks([block])
    }

    async updateBlocks(blocks: IMutableBlock[]): Promise<Response> {
        const now = Date.now()
        blocks.forEach((block) => {
            block.updateAt = now
        })
        return await this.insertBlocks(blocks)
    }

    async deleteBlock(blockId: string): Promise<Response> {
        Utils.log(`deleteBlock: ${blockId}`)
        return await fetch(this.serverUrl + `/api/v1/blocks/${encodeURIComponent(blockId)}`, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        })
    }

    async insertBlock(block: IBlock): Promise<Response> {
        return this.insertBlocks([block])
    }

    async insertBlocks(blocks: IBlock[]): Promise<Response> {
        Utils.log(`insertBlocks: ${blocks.length} blocks(s)`)
        blocks.forEach((block) => {
            Utils.log(`\t ${block.type}, ${block.id}`)
        })
        const body = JSON.stringify(blocks)
        return await fetch(this.serverUrl + '/api/v1/blocks', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
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

const client = new OctoClient()

export default client
