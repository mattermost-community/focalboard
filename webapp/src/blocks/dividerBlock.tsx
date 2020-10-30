// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IOrderedBlock, MutableOrderedBlock} from './orderedBlock'

type DividerBlock = IOrderedBlock

class MutableDividerBlock extends MutableOrderedBlock {
    constructor(block: any = {}) {
        super(block)
        this.type = 'divider'
    }
}

export {DividerBlock, MutableDividerBlock}

