// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock, MutableBlock} from './block'

type CommentBlock = IBlock

class MutableCommentBlock extends MutableBlock implements CommentBlock {
    constructor(block: any = {}) {
        super(block)
        this.type = 'comment'
    }
}

export {CommentBlock, MutableCommentBlock}
