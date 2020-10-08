import { IBlock } from "./octoTypes"
import { Utils } from "./utils"

//
// OctoClient is the client interface to the server APIs
//
class OctoClient {
	serverUrl: string

	constructor(serverUrl?: string) {
		this.serverUrl = serverUrl || window.location.origin
		console.log(`OctoClient serverUrl: ${this.serverUrl}`)
	}

	async getSubtree(rootId?: string): Promise<IBlock[]> {
		const path = `/api/v1/blocks/${rootId}/subtree`
		const response = await fetch(this.serverUrl + path)
		const blocks = await response.json() as IBlock[]
		this.fixBlocks(blocks)
		return blocks
	}

	async exportFullArchive(): Promise<IBlock[]> {
		const path = `/api/v1/blocks/export`
		const response = await fetch(this.serverUrl + path)
		const blocks = await response.json() as IBlock[]
		this.fixBlocks(blocks)
		return blocks
	}

	async importFullArchive(blocks: IBlock[]): Promise<Response> {
		Utils.log(`importFullArchive: ${blocks.length} blocks(s)`)
		blocks.forEach(block => {
			Utils.log(`\t ${block.type}, ${block.id}`)
		})
		const body = JSON.stringify(blocks)
		return await fetch(this.serverUrl + "/api/v1/blocks/import", {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body
		})
	}

	async getBlocks(parentId?: string, type?: string): Promise<IBlock[]> {
		let path: string
		if (parentId && type) {
			path = `/api/v1/blocks?parent_id=${encodeURIComponent(parentId)}&type=${encodeURIComponent(type)}`
		} else if (parentId) {
			path = `/api/v1/blocks?parent_id=${encodeURIComponent(parentId)}`
		} else if (type) {
			path = `/api/v1/blocks?type=${encodeURIComponent(type)}`
		} else {
			path = `/api/v1/blocks`
		}

		const response = await fetch(this.serverUrl + path)
		const blocks = await response.json() as IBlock[]
		this.fixBlocks(blocks)
		return blocks
	}

	fixBlocks(blocks: IBlock[]) {
		for (const block of blocks) {
			if (!block.properties) { block.properties = [] }

			block.properties = block.properties.filter(property => property && property.id)
		}
	}

	async updateBlock(block: IBlock): Promise<Response> {
		block.updateAt = Date.now()
		return await this.insertBlocks([block])
	}

	async updateBlocks(blocks: IBlock[]): Promise<Response> {
		const now = Date.now()
		blocks.forEach(block => {
			block.updateAt = now
		})
		return await this.insertBlocks(blocks)
	}

	async deleteBlock(blockId: string): Promise<Response> {
		console.log(`deleteBlock: ${blockId}`)
		return await fetch(this.serverUrl + `/api/v1/blocks/${encodeURIComponent(blockId)}`, {
			method: "DELETE",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
		})
	}

	async insertBlock(block: IBlock): Promise<Response> {
		return this.insertBlocks([block])
	}

	async insertBlocks(blocks: IBlock[]): Promise<Response> {
		Utils.log(`insertBlocks: ${blocks.length} blocks(s)`)
		blocks.forEach(block => {
			Utils.log(`\t ${block.type}, ${block.id}`)
		})
		const body = JSON.stringify(blocks)
		return await fetch(this.serverUrl + "/api/v1/blocks", {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body
		})
	}

	// Returns URL of uploaded file, or undefined on failure
	async uploadFile(file: File): Promise<string | undefined> {
		// IMPORTANT: We need to post the image as a form. The browser will convert this to a application/x-www-form-urlencoded POST
		const formData = new FormData()
		formData.append("file", file)

		try {
			const response = await fetch(this.serverUrl + "/api/v1/files", {
				method: "POST",
				// TIPTIP: Leave out Content-Type here, it will be automatically set by the browser
				headers: {
					'Accept': 'application/json',
				},
				body: formData
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

export { OctoClient }
