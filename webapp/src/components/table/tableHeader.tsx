// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useRef} from 'react'
import {useDrop, useDrag} from 'react-dnd'

import {IPropertyTemplate} from '../../blocks/board'
import {Constants} from '../../constants'
import {BoardTree} from '../../viewModel/boardTree'
import SortDownIcon from '../../widgets/icons/sortDown'
import SortUpIcon from '../../widgets/icons/sortUp'
import MenuWrapper from '../../widgets/menuWrapper'
import Label from '../../widgets/label'

import HorizontalGrip from './horizontalGrip'

import './table.scss'
import TableHeaderMenu from './tableHeaderMenu'

type Props = {
    readonly: boolean
    sorted: 'up'|'down'|'none'
    name: React.ReactNode
    boardTree: BoardTree
    template: IPropertyTemplate
    offset: number
    onDrop?: (template: IPropertyTemplate, container: IPropertyTemplate) => void
}

const TableHeader = React.memo((props: Props): JSX.Element => {
    const columnRef = useRef<HTMLDivElement>(null)
    const [{isDragging}, drag] = useDrag(() => ({
        type: 'column',
        item: props.template,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }))
    const [{isOver}, drop] = useDrop(() => ({
        accept: 'column',
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
        drop: (item: IPropertyTemplate) => {
            props.onDrop && props.onDrop(item, props.template)
        },
    }))

    const columnWidth = (templateId: string): number => {
        return Math.max(Constants.minColumnWidth, (props.boardTree.activeView.columnWidths[templateId] || 0) + props.offset)
    }

    if (props.template.id === Constants.titleColumnId) {
        drop(columnRef)
    } else {
        drop(drag(columnRef))
    }

    let className = 'octo-table-cell header-cell'
    if (isOver) {
        className += ' dragover'
    }

    return (
        <div
            className={className}
            style={{overflow: 'unset', width: columnWidth(props.template.id), opacity: isDragging ? 0.5 : 1}}
            ref={props.onDrop ? columnRef : () => null}
        >
            <MenuWrapper disabled={props.readonly}>
                <Label>
                    {props.name}
                    {props.sorted === 'up' && <SortUpIcon/>}
                    {props.sorted === 'down' && <SortDownIcon/>}
                </Label>
                <TableHeaderMenu
                    boardTree={props.boardTree}
                    templateId={props.template.id}
                />
            </MenuWrapper>

            <div className='octo-spacer'/>

            {!props.readonly &&
                <HorizontalGrip templateId={props.template.id}/>
            }
        </div>
    )
})

export default TableHeader
