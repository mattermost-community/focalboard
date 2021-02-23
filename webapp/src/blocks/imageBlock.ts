// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IContentBlock, MutableContentBlock} from './contentBlock'

interface ImageBlock extends IContentBlock {
    readonly fileId: string
}

class MutableImageBlock extends MutableContentBlock implements ImageBlock {
    get fileId(): string {
        return this.fields.fileId as string
    }
    set fileId(value: string) {
        this.fields.fileId = value
    }

    constructor(block: any = {}) {
        super(block)
        this.type = 'image'
        this.fileId = block.fields?.fileId || ''
    }
}

export {ImageBlock, MutableImageBlock}
