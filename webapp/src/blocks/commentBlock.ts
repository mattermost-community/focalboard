// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Block} from './block'

class CommentBlock extends Block {
    constructor(block: any = {}) {
        super(block)
        this.type = 'comment'
    }
}

export {CommentBlock}
