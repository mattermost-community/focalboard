// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Block, BlockPatch} from './blocks/block'
import {ISharing} from './blocks/sharing'
import {ITeam} from './blocks/team'
import {OctoUtils} from './octoUtils'
import {IUser} from './user'
import {Utils} from './utils'

//
// OctoClient is the client interface to the server APIs
//
class OctoClient {
    readonly serverUrl: string
    get token(): string {
        return localStorage.getItem('focalboardSessionId') || ''
    }
    set token(value: string) {
        localStorage.setItem('focalboardSessionId', value)
    }

    private readToken(): string {
        const queryString = new URLSearchParams(window.location.search)
        const readToken = queryString.get('r') || ''
        return readToken
    }

    constructor(serverUrl?: string, public teamId = '0') {
        this.serverUrl = (serverUrl || Utils.getBaseURL(true)).replace(/\/$/, '')
        Utils.log(`OctoClient serverUrl: ${this.serverUrl}`)
    }

    private async getJson(response: Response, defaultValue: any): Promise<any> {
        // The server may return null or malformed json
        try {
            const value = await response.json()
            return value || defaultValue
        } catch {
            return defaultValue
        }
    }

    async login(username: string, password: string): Promise<boolean> {
        const path = '/api/v1/login'
        const body = JSON.stringify({username, password, type: 'normal'})
        const response = await fetch(this.serverUrl + path, {
            method: 'POST',
            headers: this.headers(),
            body,
        })
        if (response.status !== 200) {
            return false
        }

        const responseJson = (await this.getJson(response, {})) as {token?: string}
        if (responseJson.token) {
            localStorage.setItem('focalboardSessionId', responseJson.token)
            return true
        }
        return false
    }

    logout() {
        localStorage.removeItem('focalboardSessionId')
    }

    async register(email: string, username: string, password: string, token?: string): Promise<{code: number, json: any}> {
        const path = '/api/v1/register'
        const body = JSON.stringify({email, username, password, token})
        const response = await fetch(this.serverUrl + path, {
            method: 'POST',
            headers: this.headers(),
            body,
        })
        const json = (await this.getJson(response, {}))
        return {code: response.status, json}
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{code: number, json: any}> {
        const path = `/api/v1/users/${encodeURIComponent(userId)}/changepassword`
        const body = JSON.stringify({oldPassword, newPassword})
        const response = await fetch(this.serverUrl + path, {
            method: 'POST',
            headers: this.headers(),
            body,
        })
        const json = (await this.getJson(response, {}))
        return {code: response.status, json}
    }

    private headers() {
        return {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: this.token ? 'Bearer ' + this.token : '',
            'X-Requested-With': 'XMLHttpRequest',
        }
    }

    private teamPath() {
        return `/api/v1/teams/${this.teamId}`
    }

    async getMe(): Promise<IUser | undefined> {
        const path = '/api/v1/users/me'
        const response = await fetch(this.serverUrl + path, {headers: this.headers()})
        if (response.status !== 200) {
            return undefined
        }
        const user = (await this.getJson(response, {})) as IUser
        return user
    }

    async getUser(userId: string): Promise<IUser | undefined> {
        const path = `/api/v1/users/${encodeURIComponent(userId)}`
        const response = await fetch(this.serverUrl + path, {headers: this.headers()})
        if (response.status !== 200) {
            return undefined
        }
        const user = (await this.getJson(response, {})) as IUser
        return user
    }

    async getSubtree(rootId?: string, levels = 2): Promise<Block[]> {
        let path = this.teamPath() + `/blocks/${encodeURIComponent(rootId || '')}/subtree?l=${levels}`
        const readToken = this.readToken()
        if (readToken) {
            path += `&read_token=${readToken}`
        }
        const response = await fetch(this.serverUrl + path, {headers: this.headers()})
        if (response.status !== 200) {
            return []
        }
        const blocks = (await this.getJson(response, [])) as Block[]
        return this.fixBlocks(blocks)
    }

    // If no boardID is provided, it will export the entire archive
    async exportArchive(boardID = ''): Promise<Block[]> {
        const path = `${this.teamPath()}/blocks/export?root_id=${boardID}`
        const response = await fetch(this.serverUrl + path, {headers: this.headers()})
        if (response.status !== 200) {
            return []
        }
        const blocks = (await this.getJson(response, [])) as Block[]
        return this.fixBlocks(blocks)
    }

    async importFullArchive(blocks: readonly Block[]): Promise<Response> {
        Utils.log(`importFullArchive: ${blocks.length} blocks(s)`)

        // blocks.forEach((block) => {
        //     Utils.log(`\t ${block.type}, ${block.id}`)
        // })
        const body = JSON.stringify(blocks)
        return fetch(this.serverUrl + this.teamPath() + '/blocks/import', {
            method: 'POST',
            headers: this.headers(),
            body,
        })
    }

    async getBlocksWithParent(parentId: string, type?: string): Promise<Block[]> {
        let path: string
        if (type) {
            path = this.teamPath() + `/blocks?parent_id=${encodeURIComponent(parentId)}&type=${encodeURIComponent(type)}`
        } else {
            path = this.teamPath() + `/blocks?parent_id=${encodeURIComponent(parentId)}`
        }
        return this.getBlocksWithPath(path)
    }

    async getBlocksWithType(type: string): Promise<Block[]> {
        const path = this.teamPath() + `/blocks?type=${encodeURIComponent(type)}`
        return this.getBlocksWithPath(path)
    }

    async getAllBlocks(): Promise<Block[]> {
        const path = this.teamPath() + '/blocks?all=true'
        return this.getBlocksWithPath(path)
    }

    private async getBlocksWithPath(path: string): Promise<Block[]> {
        const response = await fetch(this.serverUrl + path, {headers: this.headers()})
        if (response.status !== 200) {
            return []
        }
        const blocks = (await this.getJson(response, [])) as Block[]
        return this.fixBlocks(blocks)
    }

    fixBlocks(blocks: Block[]): Block[] {
        if (!blocks) {
            return []
        }

        // Hydrate is important, as it ensures that each block is complete to the current model
        const fixedBlocks = OctoUtils.hydrateBlocks(blocks)

        // TODO: Remove this fixup code
        for (const block of fixedBlocks) {
            if (!block.fields) {
                block.fields = {}
            }

            if (block.type === 'image') {
                if (!block.fields.fileId && block.fields.url) {
                    // Convert deprecated url to fileId
                    try {
                        const url = new URL(block.fields.url)
                        const path = url.pathname
                        const fileId = path.substring(path.lastIndexOf('/') + 1)
                        block.fields.fileId = fileId
                    } catch {
                        Utils.logError(`Failed to get fileId from url: ${block.fields.url}`)
                    }
                }
            }
        }

        return fixedBlocks
    }

    async updateBlock(block: Block): Promise<Response> {
        return this.insertBlocks([block])
    }

    async patchBlock(blockId: string, blockPatch: BlockPatch): Promise<Response> {
        Utils.log(`patchBlocks: ${blockId} block`)
        const body = JSON.stringify(blockPatch)
        return fetch(this.serverUrl + this.teamPath() + '/blocks/' + blockId, {
            method: 'PATCH',
            headers: this.headers(),
            body,
        })
    }

    async updateBlocks(blocks: Block[]): Promise<Response> {
        return this.insertBlocks(blocks)
    }

    async deleteBlock(blockId: string): Promise<Response> {
        Utils.log(`deleteBlock: ${blockId}`)
        return fetch(this.serverUrl + this.teamPath() + `/blocks/${encodeURIComponent(blockId)}`, {
            method: 'DELETE',
            headers: this.headers(),
        })
    }

    async insertBlock(block: Block): Promise<Response> {
        return this.insertBlocks([block])
    }

    async insertBlocks(blocks: Block[]): Promise<Response> {
        Utils.log(`insertBlocks: ${blocks.length} blocks(s)`)
        blocks.forEach((block) => {
            Utils.log(`\t ${block.type}, ${block.id}, ${block.title?.substr(0, 50) || ''}`)
        })
        const body = JSON.stringify(blocks)
        return fetch(this.serverUrl + this.teamPath() + '/blocks', {
            method: 'POST',
            headers: this.headers(),
            body,
        })
    }

    // Sharing

    async getSharing(rootId: string): Promise<ISharing | undefined> {
        const path = this.teamPath() + `/sharing/${rootId}`
        const response = await fetch(this.serverUrl + path, {headers: this.headers()})
        if (response.status !== 200) {
            return undefined
        }
        const sharing = (await this.getJson(response, undefined)) as ISharing
        return sharing
    }

    async setSharing(sharing: ISharing): Promise<boolean> {
        const path = this.teamPath() + `/sharing/${sharing.id}`
        const body = JSON.stringify(sharing)
        const response = await fetch(
            this.serverUrl + path,
            {
                method: 'POST',
                headers: this.headers(),
                body,
            },
        )
        if (response.status !== 200) {
            return false
        }

        return true
    }

    // Team

    async getTeam(): Promise<ITeam | undefined> {
        const path = this.teamPath()
        const response = await fetch(this.serverUrl + path, {headers: this.headers()})
        if (response.status !== 200) {
            return undefined
        }
        const team = (await this.getJson(response, undefined)) as ITeam
        return team
    }

    async regenerateTeamSignupToken(): Promise<boolean> {
        const path = this.teamPath() + '/regenerate_signup_token'
        const response = await fetch(this.serverUrl + path, {
            method: 'POST',
            headers: this.headers(),
        })
        if (response.status !== 200) {
            return false
        }

        return true
    }

    // Files

    // Returns fileId of uploaded file, or undefined on failure
    async uploadFile(rootID: string, file: File): Promise<string | undefined> {
        // IMPORTANT: We need to post the image as a form. The browser will convert this to a application/x-www-form-urlencoded POST
        const formData = new FormData()
        formData.append('file', file)

        try {
            const headers = this.headers() as Record<string, string>

            // TIPTIP: Leave out Content-Type here, it will be automatically set by the browser
            delete headers['Content-Type']

            const response = await fetch(this.serverUrl + this.teamPath() + '/' + rootID + '/files', {
                method: 'POST',
                headers,
                body: formData,
            })
            if (response.status !== 200) {
                return undefined
            }

            try {
                const text = await response.text()
                Utils.log(`uploadFile response: ${text}`)
                const json = JSON.parse(text)

                // const json = await this.getJson(response)
                return json.fileId
            } catch (e) {
                Utils.logError(`uploadFile json ERROR: ${e}`)
            }
        } catch (e) {
            Utils.logError(`uploadFile ERROR: ${e}`)
        }

        return undefined
    }

    async getFileAsDataUrl(rootId: string, fileId: string): Promise<string> {
        let path = '/files/teams/' + this.teamId + '/' + rootId + '/' + fileId
        const readToken = this.readToken()
        if (readToken) {
            path += `?read_token=${readToken}`
        }
        const response = await fetch(this.serverUrl + path, {headers: this.headers()})
        if (response.status !== 200) {
            return ''
        }
        const blob = await response.blob()
        return URL.createObjectURL(blob)
    }

    async getTeamUsers(): Promise<IUser[]> {
        const path = this.teamPath() + '/users'
        const response = await fetch(this.serverUrl + path, {headers: this.headers()})
        if (response.status !== 200) {
            return []
        }
        return (await this.getJson(response, [])) as IUser[]
    }
}

const octoClient = new OctoClient()

export {OctoClient}
export default octoClient
