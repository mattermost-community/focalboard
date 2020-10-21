// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock} from '../blocks/block'

import {MutableBlock} from './block'

interface Card extends IBlock {
    readonly icon: string
    readonly properties: Readonly<Record<string, string>>
}

class MutableCard extends MutableBlock {
    get icon(): string {
        return this.fields.icon as string
    }
    set icon(value: string) {
        this.fields.icon = value
    }

    get properties(): Record<string, string> {
        return this.fields.properties as Record<string, string>
    }
    set properties(value: Record<string, string>) {
        this.fields.properties = value
    }

    constructor(block: any = {}) {
        super(block)
        this.type = 'card'

        this.properties = {...(block.fields?.properties || {})}
    }
}

export {MutableCard, Card}
