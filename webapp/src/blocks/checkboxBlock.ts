// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {ContentBlock} from './contentBlock'
import {IBlock} from './block'

class CheckboxBlock extends ContentBlock {
    type: 'checkbox'

    constructor(block?: IBlock) {
        super(block)
        this.type = 'checkbox'
    }
}

export {CheckboxBlock}
