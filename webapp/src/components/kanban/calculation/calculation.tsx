// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {Card} from '../../../blocks/card'
import Button from '../../../widgets/buttons/button'
import './calculation.scss'
import {IPropertyTemplate} from '../../../blocks/board'

import Calculations from '../../calculations/calculations'

import {KanbanCalculationOptions} from './calculationOptions'

type Props = {
    cards: Card[]
    cardProperties: IPropertyTemplate[]
    menuOpen: boolean
    onMenuClose: () => void
    onMenuOpen: () => void
    onChange: (data: {calculation: string, propertyId: string}) => void
    value: string
    property: IPropertyTemplate
}

export default function KanbanCalculation(props: Props): JSX.Element {
    console.log('Calculation: ' + props.value)
    return (
        <React.Fragment>
            <Button
                className='KanbanCalculation'
                onClick={() => {
                    if (props.menuOpen) {
                        props.onMenuClose()
                    } else {
                        props.onMenuOpen()
                    }
                }}
                onBlur={props.onMenuClose}
            >
                {Calculations[props.value] ? Calculations[props.value](props.cards, props.property) : 'AAA'}
            </Button>

            {
                props.menuOpen && (
                    <KanbanCalculationOptions
                        value={props.value}
                        menuOpen={props.menuOpen}
                        onChange={props.onChange}
                        cardProperties={props.cardProperties}
                    />
                )
            }
        </React.Fragment>
    )
}
