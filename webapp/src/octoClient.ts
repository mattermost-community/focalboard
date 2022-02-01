// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Block, BlockPatch} from './blocks/block'
import {ISharing} from './blocks/sharing'
import {IWorkspace} from './blocks/workspace'
import {OctoUtils} from './octoUtils'
import {IUser, UserWorkspace} from './user'
import {Utils} from './utils'
import {ClientConfig} from './config/clientConfig'
import {UserSettings} from './userSettings'
import {Subscription} from './wsclient'

//
// OctoClient is the client interface to the server APIs
//
class OctoClient {
    readonly serverUrl: string | undefined
    private logged = false

    // this need to be a function rather than a const because
    // one of the global variable (`window.baseURL`) is set at runtime
    // after the first instance of OctoClient is created.
    // Avoiding the race condition becomes more complex than making
    // the base URL dynamic though a function
    private getBaseURL(): string {
        const baseURL = (this.serverUrl || Utils.getBaseURL(true)).replace(/\/$/, '')

        // Logging this for debugging.
        // Logging just once to avoid log noise.
        if (!this.logged) {
            Utils.log(`OctoClient baseURL: ${baseURL}`)
            this.logged = true
        }

        return baseURL
    }

    get token(): string {
        return localStorage.getItem('focalboardSessionId') || ''
    }
    set token(value: string) {
        localStorage.setItem('focalboardSessionId', value)
    }

    constructor(serverUrl?: string, public workspaceId = '0') {
        this.serverUrl = serverUrl
    }

    private async getJson(response: Response, defaultValue: unknown): Promise<unknown> {
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
        const response = await fetch(this.getBaseURL() + path, {
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

    async logout(): Promise<boolean> {
        const path = '/api/v1/logout'
        const response = await fetch(this.getBaseURL() + path, {
            method: 'POST',
            headers: this.headers(),
        })
        localStorage.removeItem('focalboardSessionId')

        if (response.status !== 200) {
            return false
        }
        return true
    }

    async getClientConfig(): Promise<ClientConfig | null> {
        const path = '/api/v1/clientConfig'
        const response = await fetch(this.getBaseURL() + path, {
            method: 'GET',
            headers: this.headers(),
        })
        if (response.status !== 200) {
            return null
        }

        const json = (await this.getJson(response, {})) as ClientConfig
        return json
    }

    async register(email: string, username: string, password: string, token?: string): Promise<{code: number, json: {error?: string}}> {
        const path = '/api/v1/register'
        const body = JSON.stringify({email, username, password, token})
        const response = await fetch(this.getBaseURL() + path, {
            method: 'POST',
            headers: this.headers(),
            body,
        })
        const json = (await this.getJson(response, {})) as {error?: string}
        return {code: response.status, json}
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{code: number, json: {error?: string}}> {
        const path = `/api/v1/users/${encodeURIComponent(userId)}/changepassword`
        const body = JSON.stringify({oldPassword, newPassword})
        const response = await fetch(this.getBaseURL() + path, {
            method: 'POST',
            headers: this.headers(),
            body,
        })
        const json = (await this.getJson(response, {})) as {error?: string}
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

    /**
     * Generates workspace's path.
     * Uses workspace ID from `workspaceId` param is provided,
     * Else uses Client's workspaceID if available, else the user's last visited workspace ID.
     */
    private workspacePath(workspaceId?: string) {
        let workspaceIdToUse = workspaceId
        if (!workspaceId) {
            workspaceIdToUse = this.workspaceId === '0' ? UserSettings.lastWorkspaceId || this.workspaceId : this.workspaceId
        }

        return `/api/v1/workspaces/${workspaceIdToUse}`
    }

    async getMe(): Promise<IUser | undefined> {
        const path = '/api/v1/users/me'
        const response = await fetch(this.getBaseURL() + path, {headers: this.headers()})
        if (response.status !== 200) {
            return undefined
        }
        const user = (await this.getJson(response, {})) as IUser
        return user
    }

    async getUser(userId: string): Promise<IUser | undefined> {
        const path = `/api/v1/users/${encodeURIComponent(userId)}`
        const response = await fetch(this.getBaseURL() + path, {headers: this.headers()})
        if (response.status !== 200) {
            return undefined
        }
        const user = (await this.getJson(response, {})) as IUser
        return user
    }

    async getSubtree(rootId?: string, levels = 2, workspaceID?: string): Promise<Block[]> {
        let path = this.workspacePath(workspaceID) + `/blocks/${encodeURIComponent(rootId || '')}/subtree?l=${levels}`
        const readToken = Utils.getReadToken()
        if (readToken) {
            path += `&read_token=${readToken}`
        }
        const response = await fetch(this.getBaseURL() + path, {headers: this.headers()})
        if (response.status !== 200) {
            return []
        }
        const blocks = (await this.getJson(response, [])) as Block[]
        return this.fixBlocks(blocks)
    }

    // If no boardID is provided, it will export the entire archive
    async exportArchive(boardID = ''): Promise<Response> {
        const path = `${this.workspacePath()}/archive/export?board_id=${boardID}`
        return fetch(this.getBaseURL() + path, {headers: this.headers()})
    }

    async importFullArchive(file: File): Promise<Response> {
        const formData = new FormData()
        formData.append('file', file)

        const headers = this.headers() as Record<string, string>

        // TIPTIP: Leave out Content-Type here, it will be automatically set by the browser
        delete headers['Content-Type']

        return fetch(this.getBaseURL() + this.workspacePath() + '/archive/import', {
            method: 'POST',
            headers,
            body: formData,
        })
    }

    async getBlocksWithParent(parentId: string, type?: string): Promise<Block[]> {
        let path: string
        if (type) {
            path = this.workspacePath() + `/blocks?parent_id=${encodeURIComponent(parentId)}&type=${encodeURIComponent(type)}`
        } else {
            path = this.workspacePath() + `/blocks?parent_id=${encodeURIComponent(parentId)}`
        }
        return this.getBlocksWithPath(path)
    }

    async getBlocksWithType(type: string): Promise<Block[]> {
        const path = this.workspacePath() + `/blocks?type=${encodeURIComponent(type)}`
        return this.getBlocksWithPath(path)
    }

    async getBlocksWithBlockID(blockID: string, workspaceID?: string, optionalReadToken?: string): Promise<Block[]> {
        let path = this.workspacePath(workspaceID) + `/blocks?block_id=${blockID}`
        const readToken = optionalReadToken || Utils.getReadToken()
        if (readToken) {
            path += `&read_token=${readToken}`
        }
        return this.getBlocksWithPath(path)
    }

    async getAllBlocks(): Promise<Block[]> {
        const path = this.workspacePath() + '/blocks?all=true'
        return this.getBlocksWithPath(path)
    }

    private async getBlocksWithPath(path: string): Promise<Block[]> {
        const response = await fetch(this.getBaseURL() + path, {headers: this.headers()})
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

        return fixedBlocks
    }

    async patchBlock(blockId: string, blockPatch: BlockPatch): Promise<Response> {
        Utils.log(`patchBlock: ${blockId} block`)
        const body = JSON.stringify(blockPatch)
        return fetch(this.getBaseURL() + this.workspacePath() + '/blocks/' + blockId, {
            method: 'PATCH',
            headers: this.headers(),
            body,
        })
    }

    async patchBlocks(blocks: Block[], blockPatches: BlockPatch[]): Promise<Response> {
        Utils.log(`patchBlocks: ${blocks.length} blocks`)
        const blockIds = blocks.map((block) => block.id)
        const body = JSON.stringify({block_ids: blockIds, block_patches: blockPatches})

        const path = this.getBaseURL() + this.workspacePath() + '/blocks'
        const response = fetch(path, {
            method: 'PATCH',
            headers: this.headers(),
            body,
        })
        return response
    }

    async deleteBlock(blockId: string): Promise<Response> {
        Utils.log(`deleteBlock: ${blockId}`)
        return fetch(this.getBaseURL() + this.workspacePath() + `/blocks/${encodeURIComponent(blockId)}`, {
            method: 'DELETE',
            headers: this.headers(),
        })
    }

    async followBlock(blockId: string, blockType: string, userId: string): Promise<Response> {
        const body: Subscription = {
            blockType,
            blockId,
            workspaceId: this.workspaceId,
            subscriberType: 'user',
            subscriberId: userId,
        }

        return fetch(this.getBaseURL() + `/api/v1/workspaces/${this.workspaceId}/subscriptions`, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify(body),
        })
    }

    async unfollowBlock(blockId: string, blockType: string, userId: string): Promise<Response> {
        return fetch(this.getBaseURL() + `/api/v1/workspaces/${this.workspaceId}/subscriptions/${blockId}/${userId}`, {
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
        return fetch(this.getBaseURL() + this.workspacePath() + '/blocks', {
            method: 'POST',
            headers: this.headers(),
            body,
        })
    }

    // Sharing

    async getSharing(rootId: string): Promise<ISharing | undefined> {
        const path = this.workspacePath() + `/sharing/${rootId}`
        const response = await fetch(this.getBaseURL() + path, {headers: this.headers()})
        if (response.status !== 200) {
            return undefined
        }
        const sharing = (await this.getJson(response, undefined)) as ISharing
        return sharing
    }

    async setSharing(sharing: ISharing): Promise<boolean> {
        const path = this.workspacePath() + `/sharing/${sharing.id}`
        const body = JSON.stringify(sharing)
        const response = await fetch(
            this.getBaseURL() + path,
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

    // Workspace

    async getWorkspace(): Promise<IWorkspace | undefined> {
        const path = this.workspacePath()
        const response = await fetch(this.getBaseURL() + path, {headers: this.headers()})
        if (response.status !== 200) {
            return undefined
        }
        const workspace = (await this.getJson(response, undefined)) as IWorkspace
        return workspace
    }

    async regenerateWorkspaceSignupToken(): Promise<boolean> {
        const path = this.workspacePath() + '/regenerate_signup_token'
        const response = await fetch(this.getBaseURL() + path, {
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

            const response = await fetch(this.getBaseURL() + this.workspacePath() + '/' + rootID + '/files', {
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
        let path = '/files/workspaces/' + this.workspaceId + '/' + rootId + '/' + fileId
        const readToken = Utils.getReadToken()
        if (readToken) {
            path += `?read_token=${readToken}`
        }
        const response = await fetch(this.getBaseURL() + path, {headers: this.headers()})
        if (response.status !== 200) {
            return ''
        }
        const blob = await response.blob()
        return URL.createObjectURL(blob)
    }

    async getWorkspaceUsers(): Promise<IUser[]> {
        const path = this.workspacePath() + '/users'
        const response = await fetch(this.getBaseURL() + path, {headers: this.headers()})
        if (response.status !== 200) {
            return []
        }
        return (await this.getJson(response, [])) as IUser[]
    }

    async getUserWorkspaces(): Promise<UserWorkspace[]> {
        const path = '/api/v1/workspaces'
        const response = await fetch(this.getBaseURL() + path, {headers: this.headers()})
        if (response.status !== 200) {
            return []
        }

        return (await this.getJson(response, [])) as UserWorkspace[]
    }

    async getGlobalTemplates(): Promise<Block[]> {
        const path = this.workspacePath('0') + '/blocks?type=board'
        return this.getBlocksWithPath(path)
    }

    async getUserBlockSubscriptions(userId: string): Promise<Array<Subscription>> {
        const path = `/api/v1/workspaces/${this.workspaceId}/subscriptions/${userId}`
        const response = await fetch(this.getBaseURL() + path, {headers: this.headers()})
        if (response.status !== 200) {
            return []
        }

        return (await this.getJson(response, [])) as Subscription[]
    }
}

const octoClient = new OctoClient()

export {OctoClient}
export default octoClient
