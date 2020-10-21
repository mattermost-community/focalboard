// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { IBlock } from '../octoTypes'
import {MutableBlock} from './block'

interface CommentBlock extends IBlock {
}

class MutableCommentBlock extends MutableBlock {
    constructor(block: any = {}) {
        super(block)
        this.type = 'comment'
    }
}

export {CommentBlock, MutableCommentBlock}
