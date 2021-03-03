// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {ArchiveUtils, IArchiveHeader, IArchiveLine, IBlockArchiveLine} from './blocks/archive'
import {IBlock} from './blocks/block'
import {LineReader} from './lineReader'
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

    private static async importBlocksFromFile(file: File): Promise<void> {
        let blockCount = 0
        const maxBlocksPerImport = 1000
        let blocks: IBlock[] = []

        let isFirstLine = true
        return new Promise<void>((resolve) => {
            LineReader.readFile(file, async (line, completed) => {
                if (completed) {
                    if (blocks.length > 0) {
                        await mutator.importFullArchive(blocks)
                        blockCount += blocks.length
                    }
                    Utils.log(`Imported ${blockCount} blocks.`)
                    resolve()
                    return
                }

                if (isFirstLine) {
                    isFirstLine = false
                    const header = JSON.parse(line) as IArchiveHeader
                    if (header.date && header.version >= 1) {
                        const date = new Date(header.date)
                        Utils.log(`Import archive, version: ${header.version}, date/time: ${date.toLocaleString()}.`)
                    }
                } else {
                    const row = JSON.parse(line) as IArchiveLine
                    if (!row || !row.type || !row.data) {
                        Utils.logError('importFullArchive ERROR parsing line')
                        return
                    }
                    switch (row.type) {
                    case 'block': {
                        const blockLine = row as IBlockArchiveLine
                        const block = blockLine.data
                        if (Archiver.isValidBlock(block)) {
                            blocks.push(block)
                            if (blocks.length >= maxBlocksPerImport) {
                                const blocksToSend = blocks
                                blocks = []
                                await mutator.importFullArchive(blocksToSend)
                                blockCount += blocksToSend.length
                            }
                        }
                        break
                    }
                    }
                }
            })
        })
    }

    static isValidBlock(block: IBlock): boolean {
        if (!block.id || !block.rootId) {
            return false
        }

        return true
    }

    static importFullArchive(onComplete?: () => void): void {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.focalboard'
        input.onchange = async () => {
            const file = input.files && input.files[0]
            if (file) {
                await Archiver.importBlocksFromFile(file)
            }

            onComplete?.()
        }

        input.style.display = 'none'
        document.body.appendChild(input)
        input.click()

        // TODO: Remove or reuse input
    }
}

export {Archiver}
