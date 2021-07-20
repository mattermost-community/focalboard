// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Card} from '../../blocks/card'
import {IPropertyTemplate} from '../../blocks/board'
import {Constants} from '../../constants'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function count(cards: readonly Card[], property: IPropertyTemplate): string {
    return String(cards.length)
}

function countValue(cards: readonly Card[], property: IPropertyTemplate): string {
    return String(
        cards.filter((card) => (property.id === Constants.titleColumnId ? card.title.length > 0 : Boolean(card.properties[property.id])),
        ).length,
    )
}

function countUniqueValue(cards: readonly Card[], property: IPropertyTemplate): string {
    const valueMap: Map<string | string[], boolean> = new Map()

    cards.forEach((card) => {
        const value = property.id === Constants.titleColumnId ? card.title : card.properties[property.id]
        valueMap.set(value, true)
    })

    return String(valueMap.size)
}

const Calculations: Record<string, (cards: readonly Card[], property: IPropertyTemplate) => string> = {
    count,
    countValue,
    countUniqueValue,
}

export default Calculations
