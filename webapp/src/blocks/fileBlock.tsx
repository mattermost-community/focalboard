// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Block, createBlock} from './block'
import {ContentBlock} from './contentBlock'

type FileBlockFields = {
    attachmentId: string
    attachmentName: string
    attachmentType: string
    attachmentSize: number
    isAttachment: boolean
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
            attachmentName: block?.fields.attachmentName || '',
            attachmentType: block?.fields.attachmentType || '',
            attachmentSize: block?.fields.attachmentSize || '',
            isAttachment: block?.fields.isAttachment || false,
        },
    }
}

export {FileBlock, createFileBlock}
