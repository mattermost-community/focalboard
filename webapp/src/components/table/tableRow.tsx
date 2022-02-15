// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useRef, useState, useMemo} from 'react'
import {FormattedMessage} from 'react-intl'

import {Card} from '../../blocks/card'
import {Board, IPropertyTemplate} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import {Constants} from '../../constants'
import mutator from '../../mutator'
import Button from '../../widgets/buttons/button'
import Editable from '../../widgets/editable'
import {useSortable} from '../../hooks/sortable'
import {useAppSelector} from '../../store/hooks'

import {getCardContents} from '../../store/contents'

import {getCardComments} from '../../store/comments'

import PropertyValueElement from '../propertyValueElement'
import './tableRow.scss'

type Props = {
    board: Board
    activeView: BoardView
    card: Card
    isSelected: boolean
    focusOnMount: boolean
    onSaveWithEnter: () => void
    showCard: (cardId: string) => void
    readonly: boolean
    offset: number
    resizingColumn: string
    columnRefs: Map<string, React.RefObject<HTMLDivElement>>
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
    onDrop: (srcCard: Card, dstCard: Card) => void
}

export const columnWidth = (resizingColumn: string, columnWidths: Record<string, number>, offset: number, templateId: string): number => {
    if (resizingColumn === templateId) {
        return Math.max(Constants.minColumnWidth, (columnWidths[templateId] || 0) + offset)
    }
    return Math.max(Constants.minColumnWidth, columnWidths[templateId] || 0)
}

const TableRow = (props: Props) => {
    const {board, activeView, onSaveWithEnter, columnRefs, card} = props
    const contents = useAppSelector(getCardContents(card.id || ''))
    const comments = useAppSelector(getCardComments(card.id))

    const titleRef = useRef<{ focus(selectAll?: boolean): void }>(null)
    const [title, setTitle] = useState(props.card.title || '')
    const isManualSort = activeView.fields.sortOptions.length === 0
    const isGrouped = Boolean(activeView.fields.groupById)
    const [isDragging, isOver, cardRef] = useSortable('card', card, !props.readonly && (isManualSort || isGrouped), props.onDrop)

    useEffect(() => {
        if (props.focusOnMount) {
            setTimeout(() => titleRef.current?.focus(), 10)
        }
    }, [])

    const visiblePropertyTemplates = useMemo(() => (
        activeView.fields.visiblePropertyIds.map((id) => board.fields.cardProperties.find((t) => t.id === id)).filter((i) => i) as IPropertyTemplate[]
    ), [board.fields.cardProperties, activeView.fields.visiblePropertyIds])

    let className = props.isSelected ? 'TableRow octo-table-row selected' : 'TableRow octo-table-row'
    if (isOver) {
        className += ' dragover'
    }
    if (isGrouped) {
        const groupID = activeView.fields.groupById || ''
        const groupValue = card.fields.properties[groupID] as string || 'undefined'
        if (activeView.fields.collapsedOptionIds.indexOf(groupValue) > -1) {
            className += ' hidden'
        }
    }

    if (!columnRefs.get(Constants.titleColumnId)) {
        columnRefs.set(Constants.titleColumnId, React.createRef())
    }

    return (
        <div
            className={className}
            onClick={props.onClick}
            ref={cardRef}
            style={{opacity: isDragging ? 0.5 : 1}}
        >

            {/* Name / title */}
            <div
                className='octo-table-cell title-cell'
                id='mainBoardHeader'
                style={{width: columnWidth(props.resizingColumn, props.activeView.fields.columnWidths, props.offset, Constants.titleColumnId)}}
                ref={columnRefs.get(Constants.titleColumnId)}
            >
                <div className='octo-icontitle'>
                    <div className='octo-icon'>{card.fields.icon}</div>
                    <Editable
                        ref={titleRef}
                        value={title}
                        placeholderText='Untitled'
                        onChange={(newTitle: string) => setTitle(newTitle)}
                        onSave={(saveType) => {
                            mutator.changeTitle(card.id, card.title, title)
                            if (saveType === 'onEnter') {
                                onSaveWithEnter()
                            }
                        }}
                        onCancel={() => setTitle(card.title || '')}
                        readonly={props.readonly}
                        spellCheck={true}
                    />
                </div>

                <div className='open-button'>
                    <Button onClick={() => props.showCard(props.card.id || '')}>
                        <FormattedMessage
                            id='TableRow.open'
                            defaultMessage='Open'
                        />
                    </Button>
                </div>
            </div>

            {/* Columns, one per property */}
            {visiblePropertyTemplates.map((template) => {
                if (!columnRefs.get(template.id)) {
                    columnRefs.set(template.id, React.createRef())
                }
                return (
                    <div
                        className='octo-table-cell'
                        key={template.id}
                        style={{width: columnWidth(props.resizingColumn, props.activeView.fields.columnWidths, props.offset, template.id)}}
                        ref={columnRefs.get(template.id)}
                    >
                        <PropertyValueElement
                            readOnly={props.readonly}
                            card={card}
                            board={board}
                            contents={contents}
                            comments={comments}
                            propertyTemplate={template}
                            showEmptyPlaceholder={false}
                        />
                    </div>
                )
            })}
        </div>
    )
}

export default React.memo(TableRow)
