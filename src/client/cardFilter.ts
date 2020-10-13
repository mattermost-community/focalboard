import { IPropertyTemplate } from "./board"
import { FilterClause } from "./filterClause"
import { FilterGroup } from "./filterGroup"
import { IBlock } from "./octoTypes"
import { Utils } from "./utils"

class CardFilter {
	static applyFilterGroup(filterGroup: FilterGroup, templates: IPropertyTemplate[], cards: IBlock[]): IBlock[] {
		return cards.filter(card => this.isFilterGroupMet(filterGroup, templates, card))
	}

	static isFilterGroupMet(filterGroup: FilterGroup, templates: IPropertyTemplate[], card: IBlock): boolean {
		const { filters } = filterGroup

		if (filterGroup.filters.length < 1) {
			return true	// No filters = always met
		}

		if (filterGroup.operation === "or") {
			for (const filter of filters) {
				if (FilterGroup.isAnInstanceOf(filter)) {
					if (this.isFilterGroupMet(filter, templates, card)) { return true }
				} else {
					if (this.isClauseMet(filter, templates, card)) { return true }
				}
			}
			return false
		} else {
			Utils.assert(filterGroup.operation === "and")
			for (const filter of filters) {
				if (FilterGroup.isAnInstanceOf(filter)) {
					if (!this.isFilterGroupMet(filter, templates, card)) { return false }
				} else {
					if (!this.isClauseMet(filter, templates, card)) { return false }
				}
			}
			return true
		}
	}

	static isClauseMet(filter: FilterClause, templates: IPropertyTemplate[], card: IBlock): boolean {
		const value = card.properties[filter.propertyId]
		switch (filter.condition) {
			case "includes": {
				if (filter.values.length < 1) { break }		// No values = ignore clause (always met)
				return (filter.values.find(cValue => cValue === value) !== undefined)
			}
			case "notIncludes": {
				if (filter.values.length < 1) { break }		// No values = ignore clause (always met)
				return (filter.values.find(cValue => cValue === value) === undefined)
			}
			case "isEmpty": {
				return !value
			}
			case "isNotEmpty": {
				return !!value
			}
		}
		Utils.assertFailure(`Invalid filter condition ${filter.condition}`)
		return true
	}

	static propertiesThatMeetFilterGroup(filterGroup: FilterGroup, templates: IPropertyTemplate[]): Record<string, any> {
		// TODO: Handle filter groups
		const filters = filterGroup.filters.filter(o => !FilterGroup.isAnInstanceOf(o))
		if (filters.length < 1) { return [] }

		if (filterGroup.operation === "or") {
			// Just need to meet the first clause
			const property = this.propertyThatMeetsFilterClause(filters[0] as FilterClause, templates)
			return [property]
		} else {
			return filters.map(filterClause => this.propertyThatMeetsFilterClause(filterClause as FilterClause, templates))
		}
	}

	static propertyThatMeetsFilterClause(filterClause: FilterClause, templates: IPropertyTemplate[]): { id: string, value?: string } {
		const template = templates.find(o => o.id === filterClause.propertyId)
		switch (filterClause.condition) {
			case "includes": {
				if (filterClause.values.length < 1) { return { id: filterClause.propertyId } }
				return { id: filterClause.propertyId, value: filterClause.values[0] }
			}
			case "notIncludes": {
				if (filterClause.values.length < 1) { return { id: filterClause.propertyId } }
				if (template.type === "select") {
					const option = template.options.find(o => !filterClause.values.includes(o.value))
					return { id: filterClause.propertyId, value: option.value }
				} else {
					// TODO: Handle non-select types
					return { id: filterClause.propertyId }
				}
			}
			case "isEmpty": {
				return { id: filterClause.propertyId }
			}
			case "isNotEmpty": {
				if (template.type === "select") {
					if (template.options.length > 0) {
						const option = template.options[0]
						return { id: filterClause.propertyId, value: option.value }
					} else {
						return { id: filterClause.propertyId }
					}
				} else {
					// TODO: Handle non-select types
					return { id: filterClause.propertyId }
				}
			}
		}
	}
}

export { CardFilter }
