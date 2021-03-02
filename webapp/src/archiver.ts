// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {ArchiveUtils, IArchiveHeader, IArchiveLine, IBlockArchiveLine} from './blocks/archive'
import {IBlock, IMutableBlock} from './blocks/block'
import mutator from './mutator'
import {Utils} from './utils'
import {BoardTree} from './viewModel/boardTree'

class Archiver {
    static async exportBoardTree(boardTree: BoardTree): Promise<void> {
        const blocks = boardTree.allBlocks
        this.exportArchive(blocks)
    }

    static async exportFullArchive(): Promise<void> {
        const blocks = await mutator.exportFullArchive()
        this.exportArchive(blocks)
    }

    private static exportArchive(blocks: readonly IBlock[]): void {
        const content = ArchiveUtils.buildBlockArchive(blocks)

        const date = new Date()
        const filename = `archive-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.focalboard`
        const link = document.createElement('a')
        link.style.display = 'none'

        // const file = new Blob([content], { type: "text/json" })
        // link.href = URL.createObjectURL(file)
        link.href = 'data:text/json,' + encodeURIComponent(content)
        link.download = filename
        document.body.appendChild(link)						// FireFox support

        link.click()

        // TODO: Remove or reuse link
    }

    private static async readBlocksFromFile(file: File): Promise<IBlock[]> {
        // TODO: Read input as a stream, line by line
        const contents = await (new Response(file)).text()
        Utils.log(`Import ${contents.length} bytes.`)

        const blocks: IBlock[] = []
        const allLineStrings = contents.split('\n')
        if (allLineStrings.length >= 2) {
            const headerString = allLineStrings[0]
            const header = JSON.parse(headerString) as IArchiveHeader
            if (header.date && header.version >= 1) {
                const date = new Date(header.date)
                Utils.log(`Import archive, version: ${header.version}, date/time: ${date.toLocaleString()}, ${blocks.length} block(s).`)

                const lineStrings = allLineStrings.slice(1)
                for (const lineString of lineStrings) {
                    if (!lineString) {
                        // Ignore empty lines, e.g. last line
                        continue
                    }

                    const line = JSON.parse(lineString) as IArchiveLine
                    if (!line || !line.type || !line.data) {
                        Utils.logError('importFullArchive ERROR parsing line')
                        continue
                    }
                    switch (line.type) {
                    case 'block': {
                        const blockLine = line as IBlockArchiveLine
                        const block = blockLine.data
                        blocks.push(block)
                        break
                    }
                    }
                }
            } else {
                Utils.logError('importFullArchive ERROR parsing header')
            }
        }

        return blocks
    }

    static importFullArchive(onComplete?: () => void): void {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.focalboard'
        input.onchange = async () => {
            const file = input.files && input.files[0]
            if (file) {
                const blocks = await Archiver.readBlocksFromFile(file)

                // Basic error checking
                let filteredBlocks = blocks.filter((o) => Boolean(o.id))

                Utils.log(`Import ${filteredBlocks.length} filtered blocks with ids.`)

                this.fixRootIds(filteredBlocks)

                filteredBlocks = filteredBlocks.filter((o) => Boolean(o.rootId))

                Utils.log(`Import ${filteredBlocks.length} filtered blocks with rootIds.`)

                await mutator.importFullArchive(filteredBlocks)
                Utils.log('Import completed')
            }

            onComplete?.()
        }

        input.style.display = 'none'
        document.body.appendChild(input)
        input.click()

        // TODO: Remove or reuse input
    }

    private static fixRootIds(blocks: IMutableBlock[]) {
        const blockMap = new Map(blocks.map((o) => [o.id, o]))
        const maxLevels = 5
        for (let i = 0; i < maxLevels; i++) {
            let missingRootIds = false
            blocks.forEach((o) => {
                if (o.parentId) {
                    const parent = blockMap.get(o.parentId)
                    if (parent) {
                        o.rootId = parent.rootId
                    } else {
                        Utils.assert(`No parent for ${o.type}: ${o.id} (${o.title})`)
                    }
                    if (!o.rootId) {
                        missingRootIds = true
                    }
                } else {
                    o.rootId = o.id
                }
            })

            if (!missingRootIds) {
                Utils.log(`fixRootIds in ${i} levels`)
                break
            }
        }

        // Check and log remaining errors
        blocks.forEach((o) => {
            if (!o.rootId) {
                const parent = blockMap.get(o.parentId)
                Utils.logError(`RootId is null: ${o.type} ${o.id}, parentId ${o.parentId}: ${o.title}, parent: ${parent?.type}, parent.rootId: ${parent?.rootId}, parent.title: ${parent?.title}`)
            }
        })
    }
}

export {Archiver}
