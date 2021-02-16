// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Utils} from '../utils'

type FilterCondition = 'includes' | 'notIncludes' | 'isEmpty' | 'isNotEmpty'

class FilterClause {
    propertyId: string
    condition: FilterCondition
    values: string[]

    constructor(o: any = {}) {
        this.propertyId = o.propertyId || ''
        this.condition = o.condition || 'includes'
        this.values = o.values?.slice() || []
    }

    isEqual(o: FilterClause): boolean {
        return (
            this.propertyId === o.propertyId &&
            this.condition === o.condition &&
            Utils.arraysEqual(this.values, o.values)
        )
    }
}

export {FilterClause, FilterCondition}
