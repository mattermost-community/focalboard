// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {CSSProperties} from 'react'

import {Card} from '../../blocks/card'

import {IPropertyTemplate} from '../../blocks/board'

import {CalculationOptions, Options} from './options'
import Calculations from './calculations'

type Props = {
    style: CSSProperties
    class: string
    value: string
    menuOpen: boolean
    onMenuClose: () => void
    onMenuOpen: () => void
    onChange: (value: string) => void
    cards: readonly Card[]
    property: IPropertyTemplate
}

const Calculation = (props: Props): JSX.Element => {
    const value = props.value || Options.get('none')!.value
    const valueOption = Options.get(value)

    if (props.menuOpen) {
        return (
            <div
                className={`Calculation ${props.class}`}
                style={props.style}
            >
                <CalculationOptions
                    value={value}
                    menuOpen={props.menuOpen}
                    onClose={props.onMenuClose}
                    onChange={props.onChange}
                />
            </div>
        )
    }

    return (
        <div
            className={`Calculation ${props.class}`}
            style={props.style}
            onClick={props.onMenuOpen}
        >
            <span className='calculationLabel'>
                {valueOption!.label}
            </span>

            {value !== Options.get('none')!.value &&
            <span className='calculationValue'>
                {Calculations[value](props.cards, props.property)}
            </span>}

        </div>
    )
}

export default Calculation
