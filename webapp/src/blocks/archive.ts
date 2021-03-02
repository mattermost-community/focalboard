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
}

export {IArchiveHeader, IArchiveLine, IBlockArchiveLine, ArchiveUtils}
