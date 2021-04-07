// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useRef, useEffect} from 'react'
import {FormattedMessage} from 'react-intl'
import {useDrop, useDrag} from 'react-dnd'

import {Card} from '../../blocks/card'
import {Constants} from '../../constants'
import mutator from '../../mutator'
import {BoardTree} from '../../viewModel/boardTree'
import Button from '../../widgets/buttons/button'
import Editable from '../../widgets/editable'

import PropertyValueElement from '../propertyValueElement'
import './tableRow.scss'

type Props = {
    boardTree: BoardTree
    card: Card
    isSelected: boolean
    focusOnMount: boolean
    onSaveWithEnter: () => void
    showCard: (cardId: string) => void
    readonly: boolean
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
    onDrop: (srcCard: Card, dstCard: Card) => void
}

const TableRow = React.memo((props: Props) => {
    const titleRef = useRef<Editable>(null)
    const [title, setTitle] = useState(props.card.title)
    const cardRef = useRef<HTMLDivElement>(null)
    const {card} = props
    const [{isDragging}, drag] = useDrag(() => ({
        type: 'card',
        item: card,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [card])

    const [{isOver}, drop] = useDrop(() => ({
        accept: 'card',
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
        drop: (item: Card) => {
            props.onDrop(item, card)
        },
    }), [card, props.onDrop])

    useEffect(() => {
        if (props.focusOnMount) {
            setTimeout(() => titleRef.current?.focus(), 10)
        }
    }, [])

    const columnWidth = (templateId: string): number => {
        return Math.max(Constants.minColumnWidth, props.boardTree.activeView.columnWidths[templateId] || 0)
    }

    const {boardTree, onSaveWithEnter} = props
    const {board, activeView} = boardTree

    let className = props.isSelected ? 'TableRow octo-table-row selected' : 'TableRow octo-table-row'
    if (isOver) {
        className += ' dragover'
    }

    drop(drag(cardRef))

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
                style={{width: columnWidth(Constants.titleColumnId)}}
            >
                <div className='octo-icontitle'>
                    <div className='octo-icon'>{card.icon}</div>
                    <Editable
                        ref={titleRef}
                        value={title}
                        placeholderText='Untitled'
                        onChange={(newTitle: string) => setTitle(newTitle)}
                        onSave={(saveType) => {
                            mutator.changeTitle(card, title)
                            if (saveType === 'onEnter') {
                                onSaveWithEnter()
                            }
                        }}
                        onCancel={() => setTitle(card.title)}
                        readonly={props.readonly}
                    />
                </div>

                <div className='open-button'>
                    <Button onClick={() => props.showCard(props.card.id)}>
                        <FormattedMessage
                            id='TableRow.open'
                            defaultMessage='Open'
                        />
                    </Button>
                </div>
            </div>

            {/* Columns, one per property */}

            {board.cardProperties.
                filter((template) => activeView.visiblePropertyIds.includes(template.id)).
                map((template) => {
                    return (
                        <div
                            className='octo-table-cell'
                            key={template.id}
                            style={{width: columnWidth(template.id)}}
                        >
                            <PropertyValueElement
                                readOnly={props.readonly}
                                card={card}
                                boardTree={boardTree}
                                propertyTemplate={template}
                                emptyDisplayValue='Empty'
                            />
                        </div>)
                })}
        </div>
    )
})

export default TableRow
