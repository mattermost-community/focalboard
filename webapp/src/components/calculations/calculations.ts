// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Card} from '../../blocks/card'
import {IPropertyTemplate} from '../../blocks/board'
import {Constants} from '../../constants'
import {Utils} from '../../utils'

const roundedDecimalPlaces = 2

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
        if (value) {
            valueMap.set(value, true)
        }
    })

    return String(valueMap.size)
}

function sum(cards: readonly Card[], property: IPropertyTemplate): string {
    let result = 0

    cards.
        filter((card) => Boolean(card.properties[property.id])).
        forEach((card) => {
            result += parseFloat(card.properties[property.id] as string)
        })

    return String(Utils.roundTo(result, roundedDecimalPlaces))
}

function average(cards: readonly Card[], property: IPropertyTemplate): string {
    const result = parseFloat(sum(cards, property))
    const avg = result / cards.filter((card) => Boolean(card.properties[property.id])).length
    return String(Utils.roundTo(avg, roundedDecimalPlaces))
}

function median(cards: readonly Card[], property: IPropertyTemplate): string {
    const sorted = Array.from(cards).
        filter((card) => Boolean(card.properties[property.id])).
        sort((a, b) => {
            if (!a.properties[property.id]) {
                return 1
            }

            if (!b.properties[property.id]) {
                return -1
            }

            const aValue = parseFloat(a.properties[property.id] as string || '0')
            const bValue = parseFloat(b.properties[property.id] as string || '0')

            return aValue - bValue
        })

    if (sorted.length === 0) {
        return '0'
    }

    let result: number

    if (sorted.length % 2 === 0) {
        const val1 = parseFloat(sorted[sorted.length / 2].properties[property.id] as string)
        const val2 = parseFloat(sorted[(sorted.length / 2) - 1].properties[property.id] as string)
        result = (val1 + val2) / 2
    } else {
        result = parseFloat(sorted[Math.floor(sorted.length / 2)].properties[property.id] as string)
    }

    return String(Utils.roundTo(result, roundedDecimalPlaces))
}

function min(cards: readonly Card[], property: IPropertyTemplate): string {
    let result = Number.POSITIVE_INFINITY
    cards.forEach((card) => {
        if (!card.properties[property.id]) {
            return
        }

        const value = parseFloat(card.properties[property.id] as string)
        result = Math.min(result, value)
    })

    return String(result === Number.NEGATIVE_INFINITY ? '0' : String(Utils.roundTo(result, roundedDecimalPlaces)))
}

function max(cards: readonly Card[], property: IPropertyTemplate): string {
    let result = Number.NEGATIVE_INFINITY
    cards.forEach((card) => {
        if (!card.properties[property.id]) {
            return
        }

        const value = parseFloat(card.properties[property.id] as string)
        result = Math.max(result, value)
    })

    return String(result === Number.POSITIVE_INFINITY ? '0' : String(Utils.roundTo(result, roundedDecimalPlaces)))
}

function range(cards: readonly Card[], property: IPropertyTemplate): string {
    return min(cards, property) + ' - ' + max(cards, property)
}

const Calculations: Record<string, (cards: readonly Card[], property: IPropertyTemplate) => string> = {
    count,
    countValue,
    countUniqueValue,
    sum,
    average,
    median,
    min,
    max,
    range,
}

export default Calculations
