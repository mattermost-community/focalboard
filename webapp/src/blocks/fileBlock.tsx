// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Block, createBlock} from './block'
import {ContentBlock} from './contentBlock'

type FileBlockFields = {
    attachmentId: string
}

type FileBlock = ContentBlock & {
    type: 'attachment'
    fields: FileBlockFields
}

function createFileBlock(block?: Block): FileBlock {
    return {
        ...createBlock(block),
        type: 'attachment',
        fields: {
            attachmentId: block?.fields.attachmentId || '',
        },
    }
}

export {FileBlock, createFileBlock}
