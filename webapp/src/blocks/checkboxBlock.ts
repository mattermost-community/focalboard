// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IContentBlock, MutableContentBlock} from './contentBlock'

type CheckboxBlock = IContentBlock

class MutableCheckboxBlock extends MutableContentBlock implements CheckboxBlock {
    constructor(block: any = {}) {
        super(block)
        this.type = 'checkbox'
    }
}

export {CheckboxBlock, MutableCheckboxBlock}
