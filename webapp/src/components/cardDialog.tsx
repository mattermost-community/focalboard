// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Board} from '../blocks/board'
import {BoardView} from '../blocks/boardView'
import {Card} from '../blocks/card'
import mutator from '../mutator'
import {getCard} from '../store/cards'
import {getCardComments} from '../store/comments'
import {getCardContents} from '../store/contents'
import {useAppSelector} from '../store/hooks'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../telemetry/telemetryClient'
import {Utils} from '../utils'
import CompassIcon from '../widgets/icons/compassIcon'
import DeleteIcon from '../widgets/icons/delete'
import LinkIcon from '../widgets/icons/Link'
import Menu from '../widgets/menu'

import ConfirmationDialogBox, {ConfirmationDialogBoxProps} from '../components/confirmationDialogBox'

import Button from '../widgets/buttons/button'

import {getUserBlockSubscriptionList} from '../store/initialLoad'

import {IUser} from '../user'
import {getMe} from '../store/users'
import {Permission} from '../constants'

import BoardPermissionGate from './permissions/boardPermissionGate'

import CardDetail from './cardDetail/cardDetail'
import Dialog from './dialog'
import {sendFlashMessage} from './flashMessages'

import './cardDialog.scss'

type Props = {
    board: Board
    activeView: BoardView
    views: BoardView[]
    cards: Card[]
    cardId: string
    onClose: () => void
    showCard: (cardId?: string) => void
    readonly: boolean
}

const CardDialog = (props: Props): JSX.Element => {
    const {board, activeView, cards, views} = props
    const card = useAppSelector(getCard(props.cardId))
    const contents = useAppSelector(getCardContents(props.cardId))
    const comments = useAppSelector(getCardComments(props.cardId))
    const intl = useIntl()
    const me = useAppSelector<IUser|null>(getMe)
    const isTemplate = card && card.fields.isTemplate

    const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false)
    const makeTemplateClicked = async () => {
        if (!card) {
            Utils.assertFailure('card')
            return
        }

        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.AddTemplateFromCard, {board: props.board.id, view: activeView.id, card: props.cardId})
        await mutator.duplicateCard(
            props.cardId,
            board.id,
            card.fields.isTemplate,
            intl.formatMessage({id: 'Mutator.new-template-from-card', defaultMessage: 'new template from card'}),
            true,
            async (newCardId) => {
                props.showCard(newCardId)
            },
            async () => {
                props.showCard(undefined)
            },
        )
    }
    const handleDeleteCard = async () => {
        if (!card) {
            Utils.assertFailure()
            return
        }
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteCard, {board: props.board.id, view: props.activeView.id, card: card.id})
        await mutator.deleteBlock(card, 'delete card')
        props.onClose()
    }

    const confirmDialogProps: ConfirmationDialogBoxProps = {
        heading: intl.formatMessage({id: 'CardDialog.delete-confirmation-dialog-heading', defaultMessage: 'Confirm card delete!'}),
        confirmButtonText: intl.formatMessage({id: 'CardDialog.delete-confirmation-dialog-button-text', defaultMessage: 'Delete'}),
        onConfirm: handleDeleteCard,
        onClose: () => {
            setShowConfirmationDialogBox(false)
        },
    }

    const handleDeleteButtonOnClick = () => {
        // use may be renaming a card title
        // and accidently delete the card
        // so adding des
        if (card?.title === '' && card?.fields.contentOrder.length === 0) {
            handleDeleteCard()
            return
        }

        setShowConfirmationDialogBox(true)
    }

    const menu = (
        <Menu position='left'>
            <BoardPermissionGate permissions={[Permission.ManageBoardCards]}>
                <Menu.Text
                    id='delete'
                    icon={<DeleteIcon/>}
                    name='Delete'
                    onClick={handleDeleteButtonOnClick}
                />
            </BoardPermissionGate>
            {me?.id !== 'single-user' &&
                <Menu.Text
                    icon={<LinkIcon/>}
                    id='copy'
                    name={intl.formatMessage({id: 'CardDialog.copyLink', defaultMessage: 'Copy link'})}
                    onClick={() => {
                        let cardLink = window.location.href

                        if (!cardLink.includes(props.cardId)) {
                            cardLink += `/${props.cardId}`
                        }

                        Utils.copyTextToClipboard(cardLink)
                        sendFlashMessage({content: intl.formatMessage({id: 'CardDialog.copiedLink', defaultMessage: 'Copied!'}), severity: 'high'})
                    }}
                />
            }
            {!isTemplate &&
                <BoardPermissionGate permissions={[Permission.ManageBoardProperties]}>
                    <Menu.Text
                        id='makeTemplate'
                        icon={
                            <CompassIcon
                                icon='plus'
                            />}
                        name='New template from card'
                        onClick={makeTemplateClicked}
                    />
                </BoardPermissionGate>
            }
        </Menu>
    )

    const followActionButton = (following: boolean): React.ReactNode => {
        const followBtn = (
            <Button
                className='cardFollowBtn follow'
                size='medium'
                onClick={() => mutator.followBlock(props.cardId, 'card', me!.id)}
            >
                {intl.formatMessage({id: 'CardDetail.Follow', defaultMessage: 'Follow'})}
            </Button>
        )

        const unfollowBtn = (
            <Button
                className='cardFollowBtn unfollow'
                onClick={() => mutator.unfollowBlock(props.cardId, 'card', me!.id)}
            >
                {intl.formatMessage({id: 'CardDetail.Following', defaultMessage: 'Following'})}
            </Button>
        )

        return following ? unfollowBtn : followBtn
    }

    const followingCards = useAppSelector(getUserBlockSubscriptionList)
    const isFollowingCard = Boolean(followingCards.find((following) => following.blockId === props.cardId))
    const toolbar = followActionButton(isFollowingCard)

    return (
        <>
            <Dialog
                className='cardDialog'
                onClose={props.onClose}
                toolsMenu={!props.readonly && menu}
                toolbar={!isTemplate && Utils.isFocalboardPlugin() && toolbar}
            >
                {isTemplate &&
                    <div className='banner'>
                        <FormattedMessage
                            id='CardDialog.editing-template'
                            defaultMessage="You're editing a template."
                        />
                    </div>}

                {card &&
                    <CardDetail
                        board={board}
                        activeView={activeView}
                        views={views}
                        cards={cards}
                        card={card}
                        contents={contents}
                        comments={comments}
                        readonly={props.readonly}
                    />}

                {!card &&
                    <div className='banner error'>
                        <FormattedMessage
                            id='CardDialog.nocard'
                            defaultMessage="This card doesn't exist or is inaccessible."
                        />
                    </div>}
            </Dialog>

            {showConfirmationDialogBox && <ConfirmationDialogBox dialogBox={confirmDialogProps}/>}
        </>
    )
}

export default CardDialog
