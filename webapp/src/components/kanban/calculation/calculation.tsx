// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {Card} from '../../../blocks/card'
import Button from '../../../widgets/buttons/button'

type Props = {
    cards: Card[]
    menuOpen: boolean
    property: IPropertyTemplate
    onMenuClose: () => void
    onMenuOpen: () => void
    calculation: string
}

import './calculation.scss'
import {IPropertyTemplate} from '../../../blocks/board'

const defaultCalculation = 'count'

export default function KanbanCalculation(props: Props): JSX.Element {
    return (
        <React.Fragment>
            <Button
                className='KanbanCalculation'
                onClick={() => {
                    console.log('button clicked')
                    if (props.menuOpen) {
                        props.onMenuClose()
                    } else {
                        props.onMenuOpen()
                    }
                }}
            >
                {`${props.cards.length + 10}`}
            </Button>

            {/*{*/}
            {/*    props.menuOpen && (*/}
            {/*        <div>*/}
            {/*            <CalculationOptionsGrouped*/}
            {/*                value={props.calculation || defaultCalculation}*/}
            {/*                onChange={() => {*/}
            {/*                    console.log('on change triggered')*/}
            {/*                }}*/}
            {/*                property={props.property}*/}
            {/*                menuOpen={props.menuOpen}*/}
            {/*                onClose={props.onMenuClose}*/}
            {/*            />*/}
            {/*        </div>*/}
            {/*    )*/}
            {/*}*/}
        </React.Fragment>
    )
}
