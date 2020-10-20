// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {BoardTree} from './boardTree';
import mutator from './mutator';
import {IBlock} from './octoTypes';
import {Utils} from './utils';

interface Archive {
    version: number
    date: number
    blocks: IBlock[]
}

class Archiver {
    static async exportBoardTree(boardTree: BoardTree) {
        const blocks = boardTree.allBlocks
        const archive: Archive = {
            version: 1,
            date: Date.now(),
            blocks,
        }

        this.exportArchive(archive)
    }

    static async exportFullArchive() {
        const blocks = await mutator.exportFullArchive()
        const archive: Archive = {
            version: 1,
            date: Date.now(),
            blocks,
        }

        this.exportArchive(archive)
    }

    private static exportArchive(archive: Archive) {
        const content = JSON.stringify(archive)

        const date = new Date()
        const filename = `archive-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.octo`
        const link = document.createElement('a')
        link.style.display = 'none';

        // const file = new Blob([content], { type: "text/json" })
        // link.href = URL.createObjectURL(file)
        link.href = 'data:text/json,' + encodeURIComponent(content)
        link.download = filename
        document.body.appendChild(link)						// FireFox support

        link.click()

        // TODO: Remove or reuse link
    }

    static importFullArchive(onComplete?: () => void): void {
        const input = document.createElement('input')
        input.type = 'file';
        input.accept = '.octo';
        input.onchange = async () => {
            const file = input.files[0]
            const contents = await (new Response(file)).text()
            Utils.log(`Import ${contents.length} bytes.`)
            const archive: Archive = JSON.parse(contents)
            const {blocks} = archive
            const date = new Date(archive.date)
            Utils.log(`Import archive, version: ${archive.version}, date/time: ${date.toLocaleString()}, ${blocks.length} block(s).`)

            // Basic error checking
            const filteredBlocks = blocks.filter((o) => {
                if (!o.id) {
                    return false
                }
                return true
            });

            Utils.log(`Import ${filteredBlocks.length} filtered blocks.`)

            await mutator.importFullArchive(filteredBlocks)
            Utils.log('Import completed')
            onComplete?.()
        };

        input.style.display = 'none';
        document.body.appendChild(input)
        input.click()

        // TODO: Remove or reuse input
    }
}

export {Archiver}
