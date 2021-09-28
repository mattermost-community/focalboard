// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import {CalculationOptions, CalculationOptionsProps, optionsByType} from '../../calculations/options'
import {IPropertyTemplate} from '../../../blocks/board'
import './calculationOption.scss'
import ChevronRight from '../../../widgets/icons/chevronRight'

type Props = CalculationOptionsProps & {
    cardProperties: IPropertyTemplate[]
}

const Option = (props: any): JSX.Element => {
    const [submenu, setSubmenu] = useState(false)
    const [height, setHeight] = useState(0)
    const [x, setX] = useState(0)

    const showOption = (e: any) => {
        console.log('showOption')
        console.log(e.target.getBoundingClientRect())
        console.log(e.target.getBoundingClientRect().x + e.target)
        console.log(e.target.getBoundingClientRect().y)
        if (submenu) {
            setSubmenu(false)
        } else {
            const rect = e.target.getBoundingClientRect()
            setHeight(rect.y)
            setX(rect.x + rect.width)
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
            onMouseEnter={showOption}
            onMouseLeave={showOption}
        >
            <span>
                {props.data.label} <ChevronRight/>
            </span>

            {
                submenu && (
                    <div
                        className='dropdown-submenu'
                        style={{top: `${height - 10}px`, left: `${x}px`}}
                    >
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
    const options = props.cardProperties.map((property) => optionsByType.get(property.type) || []).reduce((acc, propertyOptions) => {
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
