// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import {BoardTree} from '../../../viewModel/boardTree'
import {Constants} from '../../../constants'

import './calculationRow.scss'
import {CalculationOptions, Options, Option} from '../../calculations/options'
import {IPropertyTemplate} from '../../../blocks/board'
import {columnWidth} from '../tableRow'
import {MutableBoardView} from '../../../blocks/boardView'
import mutator from '../../../mutator'

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
    console.log('#########################################')
    console.log(selectedCalculations)
    console.log('#########################################')

    return (
        <div className='CalculationRow octo-table-row'>
            {
                templates.map((template) => {
                    const style = {width: columnWidth(template.id, props.resizingColumn, props.boardTree, props.offset)}
                    const value = selectedCalculations[template.id] || Options.get('none')!.value
                    const valueOption = Options.get(value)

                    return showOptions.get(template.id) ? (
                        <div
                            key={template.id}
                            className='octo-table-cell'
                            style={style}
                        >
                            <CalculationOptions
                                value={value}
                                menuOpen={showOptions.get(template.id)}
                                onClose={() => toggleOptions(template.id, false)}
                                onChange={(v: string) => {
                                    const calculations = {...selectedCalculations}
                                    calculations[template.id] = v
                                    const newView = new MutableBoardView(activeView)
                                    newView.columnCalculations = calculations
                                    mutator.updateBlock(newView, activeView, 'update_calculation')
                                }}
                            />
                        </div>
                    ) : (
                        <div
                            className={'octo-table-cell'}
                            style={style}
                            onClick={() => toggleOptions(template.id, true)}
                        >
                            {valueOption!.label}
                        </div>
                    )
                })
            }
        </div>
    )
}

export default CalculationRow
