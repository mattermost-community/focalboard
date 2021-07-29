// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Card} from '../../blocks/card'
import {IPropertyTemplate} from '../../blocks/board'
import {Utils} from '../../utils'

const roundedDecimalPlaces = 2

function cardsWithValue(cards: readonly Card[], property: IPropertyTemplate): Card[] {
    return cards.
        filter((card) => Boolean(card.getProperty(property)))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function count(cards: readonly Card[], property: IPropertyTemplate): string {
    return String(cards.length)
}

function countValue(cards: readonly Card[], property: IPropertyTemplate): string {
    let values = 0

    if (property.type === 'multiSelect') {
        cardsWithValue(cards, property).
            forEach((card) => {
                values += (card.getProperty(property) as string[]).length
            })
    } else {
        values = cardsWithValue(cards, property).length
    }

    return String(values)
}

function countUniqueValue(cards: readonly Card[], property: IPropertyTemplate): string {
    const valueMap: Map<string | string[], boolean> = new Map()

    cards.forEach((card) => {
        const value = card.getProperty(property)

        if (!value) {
            return
        }

        if (property.type === 'multiSelect') {
            (value as string[]).forEach((v) => valueMap.set(v, true))
        } else {
            valueMap.set(String(value), true)
        }
    })

    return String(valueMap.size)
}

function sum(cards: readonly Card[], property: IPropertyTemplate): string {
    let result = 0

    cardsWithValue(cards, property).
        forEach((card) => {
            result += parseFloat(card.getProperty(property) as string)
        })

    return String(Utils.roundTo(result, roundedDecimalPlaces))
}

function average(cards: readonly Card[], property: IPropertyTemplate): string {
    const numCards = cardsWithValue(cards, property).length
    if (numCards === 0) {
        return '0'
    }

    const result = parseFloat(sum(cards, property))
    const avg = result / numCards
    return String(Utils.roundTo(avg, roundedDecimalPlaces))
}

function median(cards: readonly Card[], property: IPropertyTemplate): string {
    const sorted = cardsWithValue(cards, property).
        sort((a, b) => {
            if (!a.getProperty(property)) {
                return 1
            }

            if (!b.getProperty(property)) {
                return -1
            }

            const aValue = parseFloat(a.getProperty(property) as string || '0')
            const bValue = parseFloat(b.getProperty(property) as string || '0')

            return aValue - bValue
        })

    if (sorted.length === 0) {
        return '0'
    }

    let result: number

    if (sorted.length % 2 === 0) {
        const val1 = parseFloat(sorted[sorted.length / 2].getProperty(property) as string)
        const val2 = parseFloat(sorted[(sorted.length / 2) - 1].getProperty(property) as string)
        result = (val1 + val2) / 2
    } else {
        result = parseFloat(sorted[Math.floor(sorted.length / 2)].getProperty(property) as string)
    }

    return String(Utils.roundTo(result, roundedDecimalPlaces))
}

function min(cards: readonly Card[], property: IPropertyTemplate): string {
    let result = Number.POSITIVE_INFINITY
    cards.forEach((card) => {
        if (!card.getProperty(property)) {
            return
        }

        const value = parseFloat(card.getProperty(property) as string)
        result = Math.min(result, value)
    })

    return String(result === Number.POSITIVE_INFINITY ? '0' : String(Utils.roundTo(result, roundedDecimalPlaces)))
}

function max(cards: readonly Card[], property: IPropertyTemplate): string {
    let result = Number.NEGATIVE_INFINITY
    cards.forEach((card) => {
        if (!card.getProperty(property)) {
            return
        }

        const value = parseFloat(card.getProperty(property) as string)
        result = Math.max(result, value)
    })

    return String(result === Number.NEGATIVE_INFINITY ? '0' : String(Utils.roundTo(result, roundedDecimalPlaces)))
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
