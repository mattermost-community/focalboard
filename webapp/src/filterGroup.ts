import { FilterClause } from "./filterClause"

type FilterGroupOperation = "and" | "or"

// A FilterGroup has 2 forms: (A or B or C) OR (A and B and C)
class FilterGroup {
	operation: FilterGroupOperation = "and"
	filters: (FilterClause | FilterGroup)[] = []

	static isAnInstanceOf(object: any): object is FilterGroup {
		return "innerOperation" in object && "filters" in object
	}

	constructor(o: any = {}) {
		this.operation = o.operation || "and"
		this.filters = o.filters
			? o.filters.map((p: any) => {
				if (FilterGroup.isAnInstanceOf(p)) {
					return new FilterGroup(p)
				} else {
					return new FilterClause(p)
				}
			})
			: []
	}
}

export { FilterGroup, FilterGroupOperation }
