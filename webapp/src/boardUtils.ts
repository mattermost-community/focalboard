// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Utils} from './utils'
import {Card} from './blocks/card'
import {IPropertyTemplate, IPropertyOption, BoardGroup} from './blocks/board'

export function groupCardsByOptions(cards: Card[], optionIds: string[], groupByProperty?: IPropertyTemplate): BoardGroup[] {
    const groups = []
    for (const optionId of optionIds) {
        if (optionId) {
            const option = groupByProperty?.options.find((o) => o.id === optionId)
            if (option) {
                const c = cards.filter((o) => optionId === o.fields.properties[groupByProperty!.id])
                const group: BoardGroup = {
                    option,
                    cards: c,
                }
                groups.push(group)
            } else {
                Utils.logError(`groupCardsByOptions: Missing option with id: ${optionId}`)
            }
        } else {
            // Empty group
            const emptyGroupCards = cards.filter((card) => {
                const groupByOptionId = card.fields.properties[groupByProperty?.id || '']
                return !groupByOptionId || !groupByProperty?.options.find((option) => option.id === groupByOptionId)
            })
            const group: BoardGroup = {
                option: {id: '', value: `No ${groupByProperty?.name}`, color: ''},
                cards: emptyGroupCards,
            }
            groups.push(group)
        }
    }
    return groups
}

export function getVisibleAndHiddenGroups(cards: Card[], visibleOptionIds: string[], hiddenOptionIds: string[], groupByProperty?: IPropertyTemplate): {visible: BoardGroup[], hidden: BoardGroup[]} {
    let unassignedOptionIds: string[] = []
    if (groupByProperty) {
        unassignedOptionIds = groupByProperty.options.
            filter((o: IPropertyOption) => !visibleOptionIds.includes(o.id) && !hiddenOptionIds.includes(o.id)).
            map((o: IPropertyOption) => o.id)
    }
    const allVisibleOptionIds = [...visibleOptionIds, ...unassignedOptionIds]

    // If the empty group positon is not explicitly specified, make it the first visible column
    if (!allVisibleOptionIds.includes('') && !hiddenOptionIds.includes('')) {
        allVisibleOptionIds.unshift('')
    }

    const visibleGroups = groupCardsByOptions(cards, allVisibleOptionIds, groupByProperty)
    const hiddenGroups = groupCardsByOptions(cards, hiddenOptionIds, groupByProperty)
    return {visible: visibleGroups, hidden: hiddenGroups}
}
