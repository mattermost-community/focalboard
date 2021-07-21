// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock} from './block'
import {ContentBlock} from './contentBlock'

type ImageBlockFields = {
    fileId: string
}

class ImageBlock extends ContentBlock {
    type: 'image'
    fields: ImageBlockFields

    constructor(block?: IBlock) {
        super(block)
        this.type = 'image'
        this.fields = {
            fileId: block?.fields.fileId || '',
        }
    }
}

export {ImageBlock}
