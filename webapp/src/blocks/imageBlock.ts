// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { IOrderedBlock, MutableOrderedBlock } from './orderedBlock'

interface ImageBlock extends IOrderedBlock {

}

class MutableImageBlock extends MutableOrderedBlock implements IOrderedBlock {
    get order(): number {
        return this.fields.order as number
    }
    set order(value: number) {
        this.fields.order = value
    }

    get url(): string {
        return this.fields.url as string
    }
    set url(value: string) {
        this.fields.url = value
    }

    constructor(block: any = {}) {
        super(block)
        this.type = 'image'
    }
}

export {ImageBlock, MutableImageBlock}
