// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IntlShape} from 'react-intl'

import {Utils} from './utils'

type FilterCondition = 'includes' | 'notIncludes' | 'isEmpty' | 'isNotEmpty'

class FilterClause {
    propertyId: string
    condition: FilterCondition
    values: string[]

    static filterConditionDisplayString(filterCondition: FilterCondition, intl: IntlShape): string {
        switch (filterCondition) {
        case 'includes': return intl.formatMessage({id: 'Filter.includes', defaultMessage: 'includes'})
        case 'notIncludes': return intl.formatMessage({id: 'Filter.not-includes', defaultMessage: 'doesn\'t include'})
        case 'isEmpty': return intl.formatMessage({id: 'Filter.is-empty', defaultMessage: 'is empty'})
        case 'isNotEmpty': return intl.formatMessage({id: 'Filter.is-not-empty', defaultMessage: 'is not empty'})
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

    isEqual(o: FilterClause): boolean {
        return (
            this.propertyId === o.propertyId &&
            this.condition === o.condition &&
            Utils.arraysEqual(this.values, o.values)
        )
    }
}

export {FilterClause, FilterCondition}
