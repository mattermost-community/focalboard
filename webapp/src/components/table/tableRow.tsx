// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useRef, useState, useMemo, useCallback} from 'react'
import {FormattedMessage} from 'react-intl'

import {Card} from '../../blocks/card'
import {Board, IPropertyTemplate} from '../../blocks/board'
import {Constants} from '../../constants'
import mutator from '../../mutator'
import Button from '../../widgets/buttons/button'
import Editable from '../../widgets/editable'
import {useSortable} from '../../hooks/sortable'

import PropertyValueElement from '../propertyValueElement'
import './tableRow.scss'

type Props = {
    board: Board
    columnWidths: Record<string, number>
    isManualSort: boolean
    groupById?: string
    visiblePropertyIds: string[]
    collapsedOptionIds: string[]
    card: Card
    isSelected: boolean
    focusOnMount: boolean
    isLastCard: boolean
    showCard: (cardId: string) => void
    readonly: boolean
    offset: number
    resizingColumn: string
    columnRefs: Map<string, React.RefObject<HTMLDivElement>>
    addCard: (groupByOptionId?: string) => Promise<void>
    onClick?: (e: React.MouseEvent<HTMLDivElement>, card: Card) => void
    onDrop: (srcCard: Card, dstCard: Card) => void
}

export const columnWidth = (resizingColumn: string, columnWidths: Record<string, number>, offset: number, templateId: string): number => {
    if (resizingColumn === templateId) {
        return Math.max(Constants.minColumnWidth, (columnWidths[templateId] || 0) + offset)
    }
    return Math.max(Constants.minColumnWidth, columnWidths[templateId] || 0)
}

const TableRow = (props: Props) => {
    const {board, columnRefs, card, isManualSort, groupById, visiblePropertyIds, collapsedOptionIds, columnWidths} = props

    const titleRef = useRef<{ focus(selectAll?: boolean): void }>(null)
    const [title, setTitle] = useState(props.card.title || '')
    const isGrouped = Boolean(groupById)
    const [isDragging, isOver, cardRef] = useSortable('card', card, !props.readonly && (isManualSort || isGrouped), props.onDrop)

    useEffect(() => {
        if (props.focusOnMount) {
            setTimeout(() => titleRef.current?.focus(), 10)
        }
    }, [])

    const onClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        props.onClick && props.onClick(e, card)
    }, [card, props.onClick])

    const onSaveWithEnter = useCallback(() => {
        if (props.isLastCard) {
            props.addCard(groupById ? card.fields.properties[groupById!] as string : '')
        }
    }, [groupById && card.fields.properties[groupById!], props.isLastCard, props.addCard])

    const onSave = useCallback((saveType) => {
        if (card.title !== title) {
            mutator.changeBlockTitle(props.board.id, card.id, card.title, title)
            if (saveType === 'onEnter') {
                onSaveWithEnter()
            }
        }
    }, [card.title, title, onSaveWithEnter, board.id, card.id])

    const onTitleChange = useCallback((newTitle: string) => {
        setTitle(newTitle)
    }, [title, setTitle])

    const visiblePropertyTemplates = useMemo(() => (
        visiblePropertyIds.map((id) => board.cardProperties.find((t) => t.id === id)).filter((i) => i) as IPropertyTemplate[]
    ), [board.cardProperties, visiblePropertyIds])

    let className = props.isSelected ? 'TableRow octo-table-row selected' : 'TableRow octo-table-row'
    if (isOver) {
        className += ' dragover'
    }
    if (isGrouped) {
        const groupID = groupById || ''
        const groupValue = card.fields.properties[groupID] as string || 'undefined'
        if (collapsedOptionIds.indexOf(groupValue) > -1) {
            className += ' hidden'
        }
    }

    if (!columnRefs.get(Constants.titleColumnId)) {
        columnRefs.set(Constants.titleColumnId, React.createRef())
    }

    return (
        <div
            className={className}
            onClick={onClick}
            ref={cardRef}
            style={{opacity: isDragging ? 0.5 : 1}}
        >

            {/* Name / title */}
            <div
                className='octo-table-cell title-cell'
                id='mainBoardHeader'
                style={{width: columnWidth(props.resizingColumn, columnWidths, props.offset, Constants.titleColumnId)}}
                ref={columnRefs.get(Constants.titleColumnId)}
            >
                <div className='octo-icontitle'>
                    <div className='octo-icon'>{card.fields.icon}</div>
                    <Editable
                        ref={titleRef}
                        value={title}
                        placeholderText='Untitled'
                        onChange={onTitleChange}
                        onSave={onSave}
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
                        style={{width: columnWidth(props.resizingColumn, columnWidths, props.offset, template.id)}}
                        ref={columnRefs.get(template.id)}
                    >
                        <PropertyValueElement
                            readOnly={props.readonly}
                            card={card}
                            board={board}
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
