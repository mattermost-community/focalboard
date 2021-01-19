// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IContentBlock, MutableContentBlock} from './contentBlock'

interface ImageBlock extends IContentBlock {
    readonly url: string
}

class MutableImageBlock extends MutableContentBlock implements ImageBlock {
    get url(): string {
        return this.fields.url as string
    }
    set url(value: string) {
        this.fields.url = value
    }

    constructor(block: any = {}) {
        super(block)
        this.type = 'image'
        this.url = block.fields?.url || ''
    }
}

export {ImageBlock, MutableImageBlock}
