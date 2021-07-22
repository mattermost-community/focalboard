// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {CSSProperties} from 'react'

import {Card} from '../../blocks/card'

import {IPropertyTemplate} from '../../blocks/board'

import ChevronUp from '../../widgets/icons/chevronUp'

import {CalculationOptions, Options} from './options'

import Calculations from './calculations'
import './calculation.scss'

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

    return (

        // tabindex is needed to make onBlur work on div.
        // See this for more details-
        // https://stackoverflow.com/questions/47308081/onblur-event-is-not-firing
        <div
            className={`Calculation ${value} ${props.class}`}
            style={props.style}
            onClick={() => (props.menuOpen ? props.onMenuClose() : props.onMenuOpen())}
            tabIndex={0}
            onBlur={props.onMenuClose}
        >
            {
                props.menuOpen && (
                    <div
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

            <span className='calculationLabel'>
                {valueOption!.displayName}
            </span>

            {
                value === Options.get('none')!.value &&
                <ChevronUp/>
            }

            {
                value !== Options.get('none')!.value &&
                <span className='calculationValue'>
                    {Calculations[value](props.cards, props.property)}
                </span>
            }

        </div>
    )
}

export default Calculation
