// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useRef, useState, useMemo, useCallback} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Card} from '../../blocks/card'
import {Board, IPropertyTemplate} from '../../blocks/board'
import {Constants} from '../../constants'
import mutator from '../../mutator'
import Button from '../../widgets/buttons/button'
import Editable from '../../widgets/editable'
import {useSortable} from '../../hooks/sortable'

import {Utils} from '../../utils'

import PropertyValueElement from '../propertyValueElement'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import IconButton from '../../widgets/buttons/iconButton'
import GripIcon from '../../widgets/icons/grip'
import OptionsIcon from '../../widgets/icons/options'
import DeleteIcon from '../../widgets/icons/delete'
import ConfirmationDialogBox, {ConfirmationDialogBoxProps} from '../confirmationDialogBox'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'

import {useColumnResize} from './tableColumnResizeContext'

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
    addCard: (groupByOptionId?: string) => Promise<void>
    onClick?: (e: React.MouseEvent<HTMLDivElement>, card: Card) => void
    onDrop: (srcCard: Card, dstCard: Card) => void
}

const TableRow = (props: Props) => {
    const intl = useIntl()
    const {board, card, isManualSort, groupById, visiblePropertyIds, collapsedOptionIds} = props

    const titleRef = useRef<{ focus(selectAll?: boolean): void }>(null)
    const [title, setTitle] = useState(props.card.title || '')
    const isGrouped = Boolean(groupById)
    const [isDragging, isOver, cardRef] = useSortable('card', card, !props.readonly && (isManualSort || isGrouped), props.onDrop)
    const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false)
    const columnResize = useColumnResize()

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

    const handleDeleteCard = useCallback(async () => {
        if (!card) {
            Utils.assertFailure()
            return
        }
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteCard, {board: board.id, card: card.id})
        await mutator.deleteBlock(card, 'delete card')
    }, [card, board.id])

    const confirmDialogProps: ConfirmationDialogBoxProps = useMemo(() => {
        return {
            heading: intl.formatMessage({id: 'CardDialog.delete-confirmation-dialog-heading', defaultMessage: 'Confirm card delete!'}),
            confirmButtonText: intl.formatMessage({id: 'CardDialog.delete-confirmation-dialog-button-text', defaultMessage: 'Delete'}),
            onConfirm: handleDeleteCard,
            onClose: () => {
                setShowConfirmationDialogBox(false)
            },
        }
    }, [handleDeleteCard])

    const handleDeleteButtonOnClick = useCallback(() => {
        // user trying to delete a card with blank name
        // but content present cannot be deleted without
        // confirmation dialog
        if (card?.title === '' && card?.fields.contentOrder.length === 0) {
            handleDeleteCard()
            return
        }
        setShowConfirmationDialogBox(true)
    }, [card.title, card.fields.contentOrder, handleDeleteCard])

    return (
        <div
            className={className}
            onClick={onClick}
            ref={cardRef}
            style={{opacity: isDragging ? 0.5 : 1}}
        >

            <div className='action-cell octo-table-cell-btn'>
                <MenuWrapper
                    className='optionsMenu'
                    stopPropagationOnToggle={true}
                >
                    <IconButton
                        title='MenuBtn'
                        icon={<OptionsIcon/>}
                    />
                    <Menu>
                        <Menu.Text
                            icon={<DeleteIcon/>}
                            id='delete'
                            name={intl.formatMessage({id: 'TableRow.delete', defaultMessage: 'Delete'})}
                            onClick={handleDeleteButtonOnClick}
                        />
                    </Menu>
                </MenuWrapper>
                <IconButton icon={<GripIcon/>}/>
            </div>

            {/* Name / title */}
            <div
                className='octo-table-cell title-cell'
                id='mainBoardHeader'
                style={{width: columnResize.width(Constants.titleColumnId)}}
                ref={(ref) => columnResize.updateRef(card.id, Constants.titleColumnId, ref)}
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
                return (
                    <div
                        className='octo-table-cell'
                        key={template.id}
                        style={{width: columnResize.width(template.id)}}
                        ref={(ref) => columnResize.updateRef(card.id, template.id, ref)}
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

            {showConfirmationDialogBox && <ConfirmationDialogBox dialogBox={confirmDialogProps}/>}
        </div>
    )
}

export default React.memo(TableRow)
