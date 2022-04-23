// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useCallback, useMemo} from 'react'
import {useRouteMatch} from 'react-router-dom'
import {useIntl} from 'react-intl'

import {Board, IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {useSortable} from '../../hooks/sortable'
import mutator from '../../mutator'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import {Utils} from '../../utils'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import DuplicateIcon from '../../widgets/icons/duplicate'
import LinkIcon from '../../widgets/icons/Link'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import Tooltip from '../../widgets/tooltip'
import {Permission} from '../../constants'
import {sendFlashMessage} from '../flashMessages'
import PropertyValueElement from '../propertyValueElement'
import {IUser} from '../../user'
import {getMe} from '../../store/users'
import {useAppSelector} from '../../store/hooks'

import BoardPermissionGate from '../permissions/boardPermissionGate'

import ConfirmationDialogBox, {ConfirmationDialogBoxProps} from '../confirmationDialogBox'
import './kanbanCard.scss'
import CardBadges from '../cardBadges'
import OpenCardTourStep from '../onboardingTour/openCard/open_card'
import CopyLinkTourStep from '../onboardingTour/copyLink/copy_link'

export const OnboardingCardClassName = 'onboardingCard'

type Props = {
    card: Card
    board: Board
    visiblePropertyTemplates: IPropertyTemplate[]
    isSelected: boolean
    visibleBadges: boolean
    onClick?: (e: React.MouseEvent, card: Card) => void
    readonly: boolean
    onDrop: (srcCard: Card, dstCard: Card) => void
    showCard: (cardId?: string) => void
    isManualSort: boolean
}

const KanbanCard = (props: Props) => {
    const {card, board} = props
    const intl = useIntl()
    const [isDragging, isOver, cardRef] = useSortable('card', card, !props.readonly, props.onDrop)
    const visiblePropertyTemplates = props.visiblePropertyTemplates || []
    const match = useRouteMatch<{boardId: string, viewId: string, cardId?: string}>()
    const me = useAppSelector<IUser|null>(getMe)
    let className = props.isSelected ? 'KanbanCard selected' : 'KanbanCard'
    if (props.isManualSort && isOver) {
        className += ' dragover'
    }

    const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false)
    const handleDeleteCard = useCallback(() => {
        if (!card) {
            Utils.assertFailure()
            return
        }
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteCard, {board: board.id, card: card.id})
        mutator.deleteBlock(card, 'delete card')
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
        if (card?.title === '' && card?.fields?.contentOrder?.length === 0) {
            handleDeleteCard()
            return
        }
        setShowConfirmationDialogBox(true)
    }, [handleDeleteCard, card.title, card?.fields?.contentOrder?.length])

    const handleOnClick = useCallback((e: React.MouseEvent) => {
        if (props.onClick) {
            props.onClick(e, card)
        }
    }, [props.onClick, card])

    const isOnboardingCard = card.title === 'Create a new card'
    const showOnboarding = isOnboardingCard && !match.params.cardId && !board.isTemplate && Utils.isFocalboardPlugin()

    return (
        <>
            <div
                ref={props.readonly ? () => null : cardRef}
                className={`${className} ${showOnboarding && OnboardingCardClassName}`}
                draggable={!props.readonly}
                style={{opacity: isDragging ? 0.5 : 1}}
                onClick={handleOnClick}
            >
                {!props.readonly &&
                <MenuWrapper
                    className={`optionsMenu ${showOnboarding ? 'show' : ''}`}
                    stopPropagationOnToggle={true}
                >
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu position='left'>
                        <BoardPermissionGate permissions={[Permission.ManageBoardCards]}>
                            <Menu.Text
                                icon={<DeleteIcon/>}
                                id='delete'
                                name={intl.formatMessage({id: 'KanbanCard.delete', defaultMessage: 'Delete'})}
                                onClick={handleDeleteButtonOnClick}
                            />
                            <Menu.Text
                                icon={<DuplicateIcon/>}
                                id='duplicate'
                                name={intl.formatMessage({id: 'KanbanCard.duplicate', defaultMessage: 'Duplicate'})}
                                onClick={() => {
                                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DuplicateCard, {board: board.id, card: card.id})
                                    mutator.duplicateCard(
                                        card.id,
                                        board.id,
                                        false,
                                        'duplicate card',
                                        false,
                                        async (newCardId) => {
                                            props.showCard(newCardId)
                                        },
                                        async () => {
                                            props.showCard(undefined)
                                        },
                                    )
                                }}
                            />
                        </BoardPermissionGate>
                        {me?.id !== 'single-user' &&
                            <Menu.Text
                                icon={<LinkIcon/>}
                                id='copy'
                                name={intl.formatMessage({id: 'KanbanCard.copyLink', defaultMessage: 'Copy link'})}
                                onClick={() => {
                                    let cardLink = window.location.href

                                    if (!cardLink.includes(card.id)) {
                                        cardLink += `/${card.id}`
                                    }

                                    Utils.copyTextToClipboard(cardLink)
                                    sendFlashMessage({content: intl.formatMessage({id: 'KanbanCard.copiedLink', defaultMessage: 'Copied!'}), severity: 'high'})
                                }}
                            />
                        }
                    </Menu>
                </MenuWrapper>
                }

                <div className='octo-icontitle'>
                    { card.fields.icon ? <div className='octo-icon'>{card.fields.icon}</div> : undefined }
                    <div
                        key='__title'
                        className='octo-titletext'
                    >
                        {card.title || intl.formatMessage({id: 'KanbanCard.untitled', defaultMessage: 'Untitled'})}
                    </div>
                </div>
                {visiblePropertyTemplates.map((template) => (
                    <Tooltip
                        key={template.id}
                        title={template.name}
                    >
                        <PropertyValueElement
                            board={board}
                            readOnly={true}
                            card={card}
                            propertyTemplate={template}
                            showEmptyPlaceholder={false}
                        />
                    </Tooltip>
                ))}
                {props.visibleBadges && <CardBadges card={card}/>}
                {showOnboarding && !match.params.cardId && <OpenCardTourStep/>}
                {showOnboarding && !match.params.cardId && <CopyLinkTourStep/>}
            </div>

            {showConfirmationDialogBox && <ConfirmationDialogBox dialogBox={confirmDialogProps}/>}

        </>
    )
}

export default React.memo(KanbanCard)
