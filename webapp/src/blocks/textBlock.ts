// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { IOrderedBlock, MutableOrderedBlock } from './orderedBlock'

interface TextBlock extends IOrderedBlock {

}

class MutableTextBlock extends MutableOrderedBlock {
    constructor(block: any = {}) {
        super(block)
        this.type = 'text'
    }
}

export {TextBlock, MutableTextBlock}
