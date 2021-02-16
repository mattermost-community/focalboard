// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IContentBlock, MutableContentBlock} from './contentBlock'

type DividerBlock = IContentBlock

class MutableDividerBlock extends MutableContentBlock implements DividerBlock {
    constructor(block: any = {}) {
        super(block)
        this.type = 'divider'
    }
}

export {DividerBlock, MutableDividerBlock}
