// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock} from './block'
import {ContentBlock} from './contentBlock'

class DividerBlock extends ContentBlock {
    type: 'divider'

    constructor(block?: IBlock) {
        super(block)
        this.type = 'divider'
    }
}

export {DividerBlock}
