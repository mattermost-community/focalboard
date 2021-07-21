// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock, Block} from './block'

class CommentBlock extends Block {
    type: 'comment'
    constructor(block?: IBlock) {
        super(block)
        this.type = 'comment'
    }
}

export {CommentBlock}
