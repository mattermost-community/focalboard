// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IContentBlock, MutableContentBlock} from './contentBlock'

type TextBlock = IContentBlock

class MutableTextBlock extends MutableContentBlock implements TextBlock {
    constructor(block: any = {}) {
        super(block)
        this.type = 'text'
    }
}

export {TextBlock, MutableTextBlock}
