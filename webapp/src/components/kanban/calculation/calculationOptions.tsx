// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {CalculationOptions, CalculationOptionsProps, optionsByType} from '../../calculations/options'
import {IPropertyTemplate} from '../../../blocks/board'

type Props = CalculationOptionsProps & {
    cardProperties: IPropertyTemplate[]
}

export const KanbanCalculationOptions = (props: Props): JSX.Element => {
    const options = props.cardProperties.
        map((property) => optionsByType.get(property.type) || []).
        reduce((acc, propertyOptions) => {
            acc.push(...propertyOptions)
            return acc
        })

    options.push(...optionsByType.get('common')!)

    return (
        <CalculationOptions
            value={props.value}
            menuOpen={props.menuOpen}
            onClose={props.onClose}
            onChange={props.onChange}
            property={props.property}
            options={options}
        />
    )
}
