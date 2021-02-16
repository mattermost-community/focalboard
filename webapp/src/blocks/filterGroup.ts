// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {FilterClause} from './filterClause'

type FilterGroupOperation = 'and' | 'or'

// A FilterGroup has 2 forms: (A or B or C) OR (A and B and C)
class FilterGroup {
    operation: FilterGroupOperation = 'and'
    filters: (FilterClause | FilterGroup)[] = []

    static isAnInstanceOf(object: any): object is FilterGroup {
        return 'innerOperation' in object && 'filters' in object
    }

    constructor(o: any = {}) {
        this.operation = o.operation || 'and'
        if (o.filters) {
            this.filters = o.filters.map((p: any) => {
                if (FilterGroup.isAnInstanceOf(p)) {
                    return new FilterGroup(p)
                }
                return new FilterClause(p)
            })
        } else {
            this.filters = []
        }
    }
}

export {FilterGroup, FilterGroupOperation}
