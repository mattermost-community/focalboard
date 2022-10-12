// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Block, createBlock} from './block'
import {ContentBlock} from './contentBlock'

type FileBlockFields = {
    fileId: string
}

type FileBlock = ContentBlock & {
    type: 'file'
    fields: FileBlockFields
}

function createFileBlock(block?: Block): FileBlock {
    return {
        ...createBlock(block),
        type: 'file',
        fields: {
            fileId: block?.fields.fileId || '',
        },
    }
}

export {FileBlock, createFileBlock}
