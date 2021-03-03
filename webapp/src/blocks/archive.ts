// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock} from './block'

interface IArchiveHeader {
    version: number
    date: number
}

interface IArchiveLine {
    type: string,
    data: any,
}

// This schema allows the expansion of additional line types in the future
interface IBlockArchiveLine extends IArchiveLine {
    type: 'block',
    data: IBlock
}

class ArchiveUtils {
    static buildBlockArchive(blocks: readonly IBlock[]): string {
        const header: IArchiveHeader = {
            version: 1,
            date: Date.now(),
        }

        const headerString = JSON.stringify(header)
        let content = headerString + '\n'
        for (const block of blocks) {
            const line: IBlockArchiveLine = {
                type: 'block',
                data: block,
            }
            const lineString = JSON.stringify(line)
            content += lineString
            content += '\n'
        }

        return content
    }

    static parseBlockArchive(contents: string): IBlock[] {
        const blocks: IBlock[] = []
        const allLineStrings = contents.split('\n')
        if (allLineStrings.length >= 2) {
            const headerString = allLineStrings[0]
            const header = JSON.parse(headerString) as IArchiveHeader
            if (header.date && header.version >= 1) {
                const lineStrings = allLineStrings.slice(1)
                let lineNum = 2
                for (const lineString of lineStrings) {
                    if (!lineString) {
                        // Ignore empty lines, e.g. last line
                        continue
                    }
                    const line = JSON.parse(lineString) as IArchiveLine
                    if (!line || !line.type || !line.data) {
                        throw new Error(`ERROR parsing line ${lineNum}`)
                    }
                    switch (line.type) {
                    case 'block': {
                        const blockLine = line as IBlockArchiveLine
                        const block = blockLine.data
                        blocks.push(block)
                        break
                    }
                    }

                    lineNum += 1
                }
            } else {
                throw new Error('ERROR parsing header')
            }
        }

        return blocks
    }
}

export {IArchiveHeader, IArchiveLine, IBlockArchiveLine, ArchiveUtils}
