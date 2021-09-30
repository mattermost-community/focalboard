// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {Card} from '../../../blocks/card'
import Button from '../../../widgets/buttons/button'
import './calculation.scss'
import {IPropertyTemplate} from '../../../blocks/board'

import {KanbanCalculationFields} from '../../../blocks/boardView'

import {KanbanCalculationOptions} from './calculationOptions'

type Props = {
    cards: Card[]
    cardProperties: IPropertyTemplate[]
    menuOpen: boolean
    onMenuClose: () => void
    onMenuOpen: () => void
    calculationData: KanbanCalculationFields
}

export default function KanbanCalculation(props: Props): JSX.Element {
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
                {`${props.cards.length + 10}`}
            </Button>

            {
                props.menuOpen && (
                    <KanbanCalculationOptions
                        menuOpen={props.menuOpen}
                        calculationData={props.calculationData}
                        onChange={() => {
                            console.log('KanbanCalculation onChange called')
                        }}
                        cardProperties={props.cardProperties}
                    />
                )
            }
        </React.Fragment>
    )
}
