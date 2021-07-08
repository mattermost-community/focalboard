// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {BoardTree} from '../../../viewModel/boardTree'
import {columnWidth} from '../tableRow'
import {Constants} from '../../../constants'

import './calculationRow.scss'

type Props = {
    boardTree: BoardTree
    resizingColumn: string
    offset: number
}

const CalculationRow = (props: Props): JSX.Element => {
    const {board, activeView} = props.boardTree

    return (
        <div className='CalculationRow octo-table-row'>
            {/* Name / title */}
            <div
                className='title octo-table-cell'
                style={{width: columnWidth(Constants.titleColumnId, props.resizingColumn, props.boardTree, props.offset)}}
            >
                {'Lorem Ipsum'}
            </div>

            {/* Columns, one per property */}
            {
                board.cardProperties.
                    filter((template) => activeView.visiblePropertyIds.includes(template.id)).
                    map((template) => (
                        <div
                            key={template.id}
                            className='octo-table-cell'
                            style={{width: columnWidth(template.id, props.resizingColumn, props.boardTree, props.offset)}}
                        >
                            {'Lorem Ipsum'}
                        </div>
                    ))
            }
        </div>
    )
}

export default CalculationRow
