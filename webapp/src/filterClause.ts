// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Utils} from './utils'

type FilterCondition = 'includes' | 'notIncludes' | 'isEmpty' | 'isNotEmpty'

class FilterClause {
    propertyId: string
    condition: FilterCondition
    values: string[]

    static filterConditionDisplayString(filterCondition: FilterCondition) {
        switch (filterCondition) {
        case 'includes': return 'includes'
        case 'notIncludes': return "doesn't include"
        case 'isEmpty': return 'is empty'
        case 'isNotEmpty': return 'is not empty'
        default: {
            Utils.assertFailure()
            return '(unknown)'
        }
        }
    }

    constructor(o: any = {}) {
        this.propertyId = o.propertyId || ''
        this.condition = o.condition || 'includes'
        this.values = o.values?.slice() || []
    }

    isEqual(o: FilterClause) {
        return (
            this.propertyId === o.propertyId &&
            this.condition === o.condition &&
            Utils.arraysEqual(this.values, o.values)
        )
    }
}

export {FilterClause, FilterCondition}
