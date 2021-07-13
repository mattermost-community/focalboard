// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import {BoardTree} from '../../../viewModel/boardTree'
import {columnWidth} from '../tableRow'
import {Constants} from '../../../constants'

import './calculationRow.scss'
import CalculationOptions from '../../calculations/options'
import {IPropertyTemplate} from '../../../blocks/board'

type Props = {
    boardTree: BoardTree
    resizingColumn: string
    offset: number
}

const CalculationRow = (props: Props): JSX.Element => {
    const {board, activeView} = props.boardTree
    const [showOptions, setShowOptions] = useState<Map<string, boolean>>(new Map<string, boolean>())
    const titleTemplate: IPropertyTemplate = {
        id: Constants.titleColumnId,
    } as IPropertyTemplate

    const templates: IPropertyTemplate[] = [
        titleTemplate,
        ...board.cardProperties.
            filter((template) => activeView.visiblePropertyIds.includes(template.id)),
    ]

    return (
        <div className='CalculationRow octo-table-row'>
            {
                templates.map((template) => {
                    const style = {width: columnWidth(template.id, props.resizingColumn, props.boardTree, props.offset)}
                    return showOptions.get(template.id) ? (
                        <div
                            key={template.id}
                            className='octo-table-cell'
                            style={style}
                        >
                            <CalculationOptions menuOpen={showOptions.get(template.id)}/>
                        </div>
                    ) : (
                        <div
                            className={'octo-table-cell'}
                            style={style}
                            onClick={() => {
                                const newShowOptions = new Map<string, boolean>(showOptions)
                                newShowOptions.set(template.id, true)
                                setShowOptions(newShowOptions)
                            }}
                        >
                            {'Hello World'}
                        </div>
                    )
                })
            }
        </div>
    )
}

export default CalculationRow
