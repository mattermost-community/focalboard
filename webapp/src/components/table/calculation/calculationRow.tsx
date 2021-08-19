// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import {Constants} from '../../../constants'

import './calculationRow.scss'
import {Board, createBoard, IPropertyTemplate} from '../../../blocks/board'

import mutator from '../../../mutator'
import Calculation from '../../calculations/calculation'
import {columnWidth} from '../tableRow'
import {BoardView} from '../../../blocks/boardView'
import {Card} from '../../../blocks/card'

type Props = {
    board: Board
    cards: Card[]
    activeView: BoardView
    resizingColumn: string
    offset: number
}

const CalculationRow = (props: Props): JSX.Element => {
    const toggleOptions = (templateId: string, show: boolean) => {
        const newShowOptions = new Map<string, boolean>(showOptions)
        newShowOptions.set(templateId, show)
        setShowOptions(newShowOptions)
    }

    const [showOptions, setShowOptions] = useState<Map<string, boolean>>(new Map<string, boolean>())
    const titleTemplate: IPropertyTemplate = {
        id: Constants.titleColumnId,
    } as IPropertyTemplate

    const templates: IPropertyTemplate[] = [
        titleTemplate,
        ...props.board.fields.cardProperties.filter((template) => props.activeView.fields.visiblePropertyIds.includes(template.id)),
    ]

    const selectedCalculations = props.board.fields.columnCalculations || []

    return (
        <div className='CalculationRow octo-table-row'>
            {
                templates.map((template) => {
                    const style = {width: columnWidth(props.resizingColumn, props.activeView.fields.columnWidths, props.offset, template.id)}
                    const value = selectedCalculations[template.id] || 'none'

                    return (
                        <Calculation
                            key={template.id}
                            style={style}
                            class='octo-table-cell'
                            value={value}
                            menuOpen={Boolean(showOptions.get(template.id))}
                            onMenuClose={() => toggleOptions(template.id, false)}
                            onMenuOpen={() => toggleOptions(template.id, true)}
                            onChange={(v: string) => {
                                const calculations = {...selectedCalculations}
                                calculations[template.id] = v
                                const newBoard = createBoard(props.board)
                                newBoard.fields.columnCalculations = calculations
                                mutator.updateBlock(newBoard, props.board, 'update_calculation')
                            }}
                            cards={props.cards}
                            property={template}
                        />
                    )
                })
            }
        </div>
    )
}

export default CalculationRow
