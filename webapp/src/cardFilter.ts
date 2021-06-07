// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IPropertyTemplate} from './blocks/board'
import {Card} from './blocks/card'
import {FilterClause} from './blocks/filterClause'
import {FilterGroup} from './blocks/filterGroup'
import {Utils} from './utils'

class CardFilter {
    static applyFilterGroup(filterGroup: FilterGroup, templates: readonly IPropertyTemplate[], cards: Card[]): Card[] {
        return cards.filter((card) => this.isFilterGroupMet(filterGroup, templates, card))
    }

    static isFilterGroupMet(filterGroup: FilterGroup, templates: readonly IPropertyTemplate[], card: Card): boolean {
        const {filters} = filterGroup

        if (filterGroup.filters.length < 1) {
            return true	// No filters = always met
        }

        if (filterGroup.operation === 'or') {
            for (const filter of filters) {
                if (FilterGroup.isAnInstanceOf(filter)) {
                    if (this.isFilterGroupMet(filter, templates, card)) {
                        return true
                    }
                } else if (this.isClauseMet(filter, templates, card)) {
                    return true
                }
            }
            return false
        }
        Utils.assert(filterGroup.operation === 'and')
        for (const filter of filters) {
            if (FilterGroup.isAnInstanceOf(filter)) {
                if (!this.isFilterGroupMet(filter, templates, card)) {
                    return false
                }
            } else if (!this.isClauseMet(filter, templates, card)) {
                return false
            }
        }
        return true
    }

    static isClauseMet(filter: FilterClause, templates: readonly IPropertyTemplate[], card: Card): boolean {
        const value = card.properties[filter.propertyId]
        switch (filter.condition) {
        case 'includes': {
            if (filter.values.length < 1) {
                break
            }		// No values = ignore clause (always met)
            return (filter.values.find((cValue) => (Array.isArray(value) ? value.includes(cValue) : cValue === value)) !== undefined)
        }
        case 'notIncludes': {
            if (filter.values.length < 1) {
                break
            }		// No values = ignore clause (always met)
            return (filter.values.find((cValue) => (Array.isArray(value) ? value.includes(cValue) : cValue === value)) === undefined)
        }
        case 'isEmpty': {
            return value.length <= 0
        }
        case 'isNotEmpty': {
            return value.length > 0
        }
        default: {
            Utils.assertFailure(`Invalid filter condition ${filter.condition}`)
        }
        }
        return true
    }

    static propertiesThatMeetFilterGroup(filterGroup: FilterGroup | undefined, templates: readonly IPropertyTemplate[]): Record<string, string> {
        // TODO: Handle filter groups
        if (!filterGroup) {
            return {}
        }

        const filters = filterGroup.filters.filter((o) => !FilterGroup.isAnInstanceOf(o))
        if (filters.length < 1) {
            return {}
        }

        if (filterGroup.operation === 'or') {
            // Just need to meet the first clause
            const property = this.propertyThatMeetsFilterClause(filters[0] as FilterClause, templates)
            const result: Record<string, string> = {}
            if (property.value) {
                result[property.id] = property.value
            }
            return result
        }

        // And: Need to meet all clauses
        const result: Record<string, string> = {}
        filters.forEach((filterClause) => {
            const property = this.propertyThatMeetsFilterClause(filterClause as FilterClause, templates)
            if (property.value) {
                result[property.id] = property.value
            }
        })
        return result
    }

    static propertyThatMeetsFilterClause(filterClause: FilterClause, templates: readonly IPropertyTemplate[]): { id: string, value?: string } {
        const template = templates.find((o) => o.id === filterClause.propertyId)
        if (!template) {
            Utils.assertFailure(`propertyThatMeetsFilterClause. Cannot find template: ${filterClause.propertyId}`)
            return {id: filterClause.propertyId}
        }

        switch (filterClause.condition) {
        case 'includes': {
            if (filterClause.values.length < 1) {
                return {id: filterClause.propertyId}
            }
            return {id: filterClause.propertyId, value: filterClause.values[0]}
        }
        case 'notIncludes': {
            if (filterClause.values.length < 1) {
                return {id: filterClause.propertyId}
            }
            if (template.type === 'select') {
                const option = template.options.find((o) => !filterClause.values.includes(o.id))
                if (option) {
                    return {id: filterClause.propertyId, value: option.id}
                }

                // No other options exist
                return {id: filterClause.propertyId}
            }

            // TODO: Handle non-select types
            return {id: filterClause.propertyId}
        }
        case 'isEmpty': {
            return {id: filterClause.propertyId}
        }
        case 'isNotEmpty': {
            if (template.type === 'select') {
                if (template.options.length > 0) {
                    const option = template.options[0]
                    return {id: filterClause.propertyId, value: option.id}
                }
                return {id: filterClause.propertyId}
            }

            // TODO: Handle non-select types
            return {id: filterClause.propertyId}
        }
        default: {
            Utils.assertFailure(`Unexpected filter condition: ${filterClause.condition}`)
            return {id: filterClause.propertyId}
        }
        }
    }
}

export {CardFilter}
