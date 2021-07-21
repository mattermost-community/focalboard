// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import {BoardTree} from '../../../viewModel/boardTree'
import {Constants} from '../../../constants'

import './calculationRow.scss'
import {IPropertyTemplate} from '../../../blocks/board'
import {columnWidth} from '../tableRow'
import {MutableBoardView} from '../../../blocks/boardView'
import mutator from '../../../mutator'
import Calculation from '../../calculations/calculation'

type Props = {
    boardTree: BoardTree
    resizingColumn: string
    offset: number
}

const CalculationRow = (props: Props): JSX.Element => {
    const toggleOptions = (templateId: string, show: boolean) => {
        const newShowOptions = new Map<string, boolean>(showOptions)
        newShowOptions.set(templateId, show)
        setShowOptions(newShowOptions)
    }

    const {board, activeView} = props.boardTree
    const [showOptions, setShowOptions] = useState<Map<string, boolean>>(new Map<string, boolean>())
    const titleTemplate: IPropertyTemplate = {
        id: Constants.titleColumnId,
    } as IPropertyTemplate

    const templates: IPropertyTemplate[] = [
        titleTemplate,
        ...board.cardProperties.filter((template) => activeView.visiblePropertyIds.includes(template.id)),
    ]
    const selectedCalculations = activeView.columnCalculations

    return (
        <div className='CalculationRow octo-table-row'>
            {
                templates.map((template) => {
                    const style = {width: columnWidth(template.id, props.resizingColumn, props.boardTree, props.offset)}
                    const value = selectedCalculations[template.id]

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
                                const newView = new MutableBoardView(activeView)
                                newView.columnCalculations = calculations
                                mutator.updateBlock(newView, activeView, 'update_calculation')
                            }}
                            cards={props.boardTree.cards}
                            property={template}
                        />
                    )
                })
            }
        </div>
    )
}

export default CalculationRow
