// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import {Option as SelectOption, typesByOptions} from '../../calculations/options'
import {IPropertyTemplate} from '../../../blocks/board'
import ChevronRight from '../../../widgets/icons/chevronRight'
import {Constants} from '../../../constants'

type OptionProps = SelectOption & {
    cardProperties: IPropertyTemplate[]
    onChange: (data: {calculation: string, propertyId: string}) => void
}

const Option = (props: {data: OptionProps}): JSX.Element => {
    const [submenu, setSubmenu] = useState(false)
    const [height, setHeight] = useState(0)
    const [x, setX] = useState(0)
    const [calculationToProperties, setCalculationToProperties] = useState<Map<string, IPropertyTemplate[]>>(new Map())

    const toggleOption = (e: any) => {
        if (submenu) {
            setSubmenu(false)
        } else {
            const rect = e.target.getBoundingClientRect()
            setHeight(rect.y)
            setX(rect.x + rect.width)
            setSubmenu(true)
        }
    }

    if (!calculationToProperties.get(props.data.value)) {
        console.log('computing')
        const supportedPropertyTypes = new Map<string, boolean>([])
        if (typesByOptions.get(props.data.value)) {
            (typesByOptions.get(props.data.value) || []).
                forEach((propertyType) => supportedPropertyTypes.set(propertyType, true))
        }

        const supportedProperties = props.data.cardProperties.
            filter((property) => supportedPropertyTypes.get(property.type) || supportedPropertyTypes.get('common'))

        calculationToProperties.set(props.data.value, supportedProperties)
        setCalculationToProperties(calculationToProperties)
    } else {
        console.log('reusing')
    }

    return (
        <div
            className='KanbanCalculationOptions_CustomOption'
            onMouseEnter={toggleOption}
            onMouseLeave={toggleOption}
            onClick={() => {
                if (props.data.value !== 'count') {
                    return
                }

                props.data.onChange({
                    calculation: 'count',
                    propertyId: Constants.titleColumnId,
                })
            }}
        >
            <span>
                {props.data.label} {props.data.value !== 'count' && <ChevronRight/>}
            </span>

            {
                submenu && props.data.value !== 'count' && (
                    <div
                        className='dropdown-submenu'
                        style={{top: `${height - 10}px`, left: `${x}px`}}
                    >

                        {
                            calculationToProperties.get(props.data.value) &&
                            calculationToProperties.get(props.data.value)!.map((property) => (
                                <div
                                    key={property.id}
                                    className='drops'
                                    onClick={() => {
                                        props.data.onChange({
                                            calculation: props.data.value,
                                            propertyId: property.id,
                                        })
                                    }}
                                >
                                    <span>{property.name}</span>
                                </div>
                            ))
                        }
                    </div>
                )
            }
        </div>
    )
}

export {
    Option,
    OptionProps,
}
