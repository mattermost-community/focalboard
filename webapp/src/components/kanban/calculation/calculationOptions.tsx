// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import {
    CalculationOptions,
    CalculationOptionsProps,
    optionsByType,
    Option as SelectOption,
    typesByOptions,
} from '../../calculations/options'
import {IPropertyTemplate} from '../../../blocks/board'
import './calculationOption.scss'
import ChevronRight from '../../../widgets/icons/chevronRight'

type Props = CalculationOptionsProps & {
    cardProperties: IPropertyTemplate[]
    onChange: (data: {calculation: string, propertyId: string}) => void
}

type Foo = SelectOption & {
    cardProperties: IPropertyTemplate[]
    onChange: (data: {calculation: string, propertyId: string}) => void
}

const Option = (props: {data: Foo}): JSX.Element => {
    const [submenu, setSubmenu] = useState(false)
    const [height, setHeight] = useState(0)
    const [x, setX] = useState(0)
    const [calculationToProperties, setCalculationToProperties] = useState<Map<string, IPropertyTemplate[]>>(new Map())

    const showOption = (e: any) => {
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
                                    {property.name}
                                </div>
                            ))
                        }
                    </div>
                )
            }
        </div>
    )
}

export const KanbanCalculationOptions = (props: Props): JSX.Element => {
    const options: Foo[] = []

    props.cardProperties.
        map((property) => optionsByType.get(property.type) || []).
        forEach((typeOptions) => {
            typeOptions.forEach((typeOption) => {
                options.push({
                    ...typeOption,
                    cardProperties: props.cardProperties,
                    onChange: props.onChange,
                })
            })
        })

    optionsByType.get('common')!.forEach((typeOption) => {
        options.push({
            ...typeOption,
            cardProperties: props.cardProperties,
            onChange: props.onChange,
        })
    })

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
