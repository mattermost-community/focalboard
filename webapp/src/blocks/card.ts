// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Utils} from '../utils'

import {Block, IBlock} from './block'

type CardFields = {
    icon?: string
    isTemplate?: boolean
    properties: Record<string, string | string[]>
    contentOrder: Array<string | string[]>
}

class Card extends Block {
    fields: CardFields

    constructor(block?: IBlock) {
        super(block)
        this.type = 'card'

        this.fields = {
            icon: block?.fields.icon || '',
            properties: {...(block?.fields.properties || {})},
            contentOrder: block?.fields.contentOrder?.slice() || [],
            isTemplate: block?.fields.isTemplate || false,
        }
    }

    duplicate(): Card {
        const card = new Card(this)
        card.id = Utils.createGuid()
        return card
    }
}

export {Card}
