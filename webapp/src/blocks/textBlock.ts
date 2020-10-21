// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { IOrderedBlock, MutableOrderedBlock } from './orderedBlock'

interface TextBlock extends IOrderedBlock {

}

class MutableTextBlock extends MutableOrderedBlock {
    get order(): number {
        return this.fields.order as number
    }
    set order(value: number) {
        this.fields.order = value
    }

    constructor(block: any = {}) {
        super(block)
        this.type = 'text'
    }
}

export {TextBlock, MutableTextBlock}
