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
import {Options} from '../../calculations/options'

import {TableCalculationOptions} from './tableCalculationOptions'

type Props = {
    board: Board
    cards: Card[]
    activeView: BoardView
    resizingColumn: string
    offset: number
    readonly: boolean
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

    const [hovered, setHovered] = useState(false)

    return (
        <div
            className={'CalculationRow octo-table-row'}
            onMouseEnter={() => setHovered(!props.readonly)}
            onMouseLeave={() => setHovered(false)}
        >
            {
                templates.map((template) => {
                    const style = {width: columnWidth(props.resizingColumn, props.activeView.fields.columnWidths, props.offset, template.id)}
                    const defaultValue = template.id === Constants.titleColumnId ? Options.count.value : Options.none.value
                    const value = selectedCalculations[template.id] || defaultValue

                    return (
                        <Calculation
                            key={template.id}
                            style={style}
                            class={`octo-table-cell ${props.readonly ? 'disabled' : ''}`}
                            value={value}
                            menuOpen={Boolean(props.readonly ? false : showOptions.get(template.id))}
                            onMenuClose={() => toggleOptions(template.id, false)}
                            onMenuOpen={() => toggleOptions(template.id, true)}
                            onChange={(v: string) => {
                                const calculations = {...selectedCalculations}
                                calculations[template.id] = v
                                const newBoard = createBoard(props.board)
                                newBoard.fields.columnCalculations = calculations
                                mutator.updateBlock(newBoard, props.board, 'update_calculation')
                                setHovered(false)
                            }}
                            cards={props.cards}
                            property={template}
                            hovered={hovered}
                            optionsComponent={TableCalculationOptions}
                        />
                    )
                })
            }
        </div>
    )
}

export default CalculationRow
