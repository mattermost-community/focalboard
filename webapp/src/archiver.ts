// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {IAppWindow} from './types'
import {ArchiveHeader, ArchiveLine, BlockArchiveLine} from './blocks/archive'
import {Block} from './blocks/block'
import {Board} from './blocks/board'
import {LineReader} from './lineReader'
import mutator from './mutator'
import {Utils} from './utils'

declare let window: IAppWindow

class Archiver {
    static async exportBoardArchive(board: Board): Promise<void> {
        this.exportArchive(mutator.exportArchive(board.id))
    }

    static async exportFullArchive(): Promise<void> {
        this.exportArchive(mutator.exportArchive())
    }

    private static exportArchive(prom: Promise<Response>): void {
        // TODO:  don't download whole archive before presenting SaveAs dialog.
        prom.then((response) => {
            response.blob().
                then((blob) => {
                    const link = document.createElement('a')
                    link.style.display = 'none'

                    const date = new Date()
                    const filename = `archive-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.focalboard`

                    const file = new Blob([blob], {type: 'application/octet-stream'})
                    link.href = URL.createObjectURL(file)
                    link.download = filename
                    document.body.appendChild(link)						// FireFox support

                    link.click()

                    // TODO: Review if this is needed in the future, this is to fix the problem with linux webview links
                    if (window.openInNewBrowser) {
                        window.openInNewBrowser(link.href)
                    }

                    // TODO: Remove or reuse link and revolkObjectURL to avoid memory leak
                })
        })
    }

    private static async importBlocksFromFile(file: File): Promise<void> {
        let blockCount = 0
        const maxBlocksPerImport = 1000
        let blocks: Block[] = []

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
                    const header = JSON.parse(line) as ArchiveHeader
                    if (header.date && header.version >= 1) {
                        const date = new Date(header.date)
                        Utils.log(`Import archive, version: ${header.version}, date/time: ${date.toLocaleString()}.`)
                    }
                } else {
                    const row = JSON.parse(line) as ArchiveLine
                    if (!row || !row.type || !row.data) {
                        Utils.logError('importFullArchive ERROR parsing line')
                        return
                    }
                    switch (row.type) {
                    case 'block': {
                        const blockLine = row as BlockArchiveLine
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

    static isValidBlock(block: Block): boolean {
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
