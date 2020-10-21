// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock} from '../blocks/block'

import {MutableBlock} from './block'

interface IOrderedBlock extends IBlock {
    readonly order: number
}

class MutableOrderedBlock extends MutableBlock implements IOrderedBlock {
    get order(): number {
        return this.fields.order as number
    }
    set order(value: number) {
        this.fields.order = value
    }

    constructor(block: any = {}) {
        super(block)
    }
}

export {IOrderedBlock, MutableOrderedBlock}
