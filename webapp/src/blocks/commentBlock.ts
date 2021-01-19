// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock} from '../blocks/block'

import {MutableBlock} from './block'

interface CommentBlock extends IBlock {
    readonly userId: string
}

class MutableCommentBlock extends MutableBlock implements CommentBlock {
    get userId(): string {
        return this.fields.userId as string
    }
    set userId(value: string) {
        this.fields.userId = value
    }

    constructor(block: any = {}) {
        super(block)
        this.type = 'comment'

        this.userId = block.fields?.userId || ''
    }
}

export {CommentBlock, MutableCommentBlock}
