// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import {CalculationOptions, CalculationOptionsProps, optionsByType} from '../../calculations/options'
import {IPropertyTemplate} from '../../../blocks/board'

type Props = CalculationOptionsProps & {
    cardProperties: IPropertyTemplate[]
}

import './calculationOption.scss'

const Option = (props: any): JSX.Element => {
    const [submenu, setSubmenu] = useState(false)

    // const [height, setHeight] = useState(0)
    const handleOption = (e: any) => {
        if (submenu) {
            setSubmenu(false)
        } else {
            // setHeight(e.clientY)
            setSubmenu(true)
        }
    }

    const handleSubOption = (e: any) => {
        console.log('clicked')
    }

    console.log(props)
    return (
        <div
            className='KanbanCalculationOptions_CustomOption'
            onClick={handleOption}
        >
            <span>
                {props.data.label}
            </span>

            {
                submenu && (
                    <div className='dropdown-submenu'>
                        <div
                            className='drops'
                            onClick={handleSubOption}
                        >
                            {'Test dropdown 1'}
                        </div>
                        <div
                            className='drops'
                            onClick={handleSubOption}
                        >
                            {'Test dropdown 2'}
                        </div>
                        <div
                            className='drops'
                            onClick={handleSubOption}
                        >
                            {'Test dropdown 3'}
                        </div>
                    </div>
                )
            }
        </div>
    )
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
            components={{Option}}
        />
    )
}
