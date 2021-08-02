// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Block, createBlock} from './block'

type CardFields = {
    icon?: string
    isTemplate?: boolean
    properties: Record<string, string | string[]>
    contentOrder: Array<string | string[]>
}

type Card = Block & {
    fields: CardFields
}

function createCard(block?: Block): Card {
    const contentOrder: Array<string|string[]> = []
    if (block?.fields.contentOrder) {
        for (const contentId of block.fields.contentOrder) {
            if (typeof contentId === 'string') {
                contentOrder.push(contentId)
            } else {
                contentOrder.push(contentId.slice())
            }
        }
    }
    return {
        ...createBlock(block),
        type: 'card',
        fields: {
            icon: block?.fields.icon || '',
            properties: {...(block?.fields.properties || {})},
            contentOrder,
            isTemplate: block?.fields.isTemplate || false,
        },
    }
}

export {Card, createCard}
