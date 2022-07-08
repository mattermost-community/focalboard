// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Board} from '../blocks/board'
import {BoardView} from '../blocks/boardView'
import {Card} from '../blocks/card'
import ConfirmationDialogBox, {ConfirmationDialogBoxProps} from '../components/confirmationDialogBox'
import {Permission} from '../constants'
import mutator from '../mutator'
import {useStickyState} from '../stickyState'
import {getCard} from '../store/cards'
import {getCardComments} from '../store/comments'
import {getCardContents} from '../store/contents'
import {useAppSelector} from '../store/hooks'
import {getUserBlockSubscriptionList} from '../store/initialLoad'
import {getMe} from '../store/users'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../telemetry/telemetryClient'
import {IUser} from '../user'
import {Utils} from '../utils'
import Button from '../widgets/buttons/button'
import CheckIcon from '../widgets/icons/check'
import CloseIcon from '../widgets/icons/close'
import CompassIcon from '../widgets/icons/compassIcon'
import LinkIcon from '../widgets/icons/Link'
import Menu from '../widgets/menu'

import CardDetail from './cardDetail/cardDetail'
import './cardDialog.scss'
import Dialog from './dialog'
import {sendFlashMessage} from './flashMessages'
import BoardPermissionGate from './permissions/boardPermissionGate'

import CardActionsMenu from './cardActionsMenu/cardActionsMenu'
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
    // TODO: Convert this to React code
    if (/[?&]fullscreen/.test(location?.search)) {
        window.localStorage.setItem('cardShowTitle', JSON.stringify(false))
        window.localStorage.setItem('cardShowProperties', JSON.stringify(false))
        window.localStorage.setItem('cardShowComments', JSON.stringify(false))
        window.localStorage.setItem('cardFullscreen', JSON.stringify(true))
    }

    const {board, activeView, cards, views} = props
    const card = useAppSelector(getCard(props.cardId))
    const contents = useAppSelector(getCardContents(props.cardId))
    const comments = useAppSelector(getCardComments(props.cardId))
    const intl = useIntl()
    const me = useAppSelector<IUser|null>(getMe)
    const isTemplate = card && card.fields.isTemplate
    const [showTitle, setShowTitle] = useStickyState(Boolean(true), 'cardShowTitle')
    const [showProperties, setShowProperties] = useStickyState(Boolean(true), 'cardShowProperties')
    const [showComments, setShowComments] = useStickyState(Boolean(true), 'cardShowComments')
    const [fullscreen, setFullscreen] = useStickyState(Boolean(false), 'cardFullscreen')

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
        <CardActionsMenu
            cardId={props.cardId}
            onClickDelete={handleDeleteButtonOnClick}
        >
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
            <Menu.Text
                icon={showTitle ? <CloseIcon/> : <CheckIcon/>}
                id='toggleTitle'
                name={showTitle ? intl.formatMessage({id: 'CardDialog.hideTitle', defaultMessage: 'Hide title'}) : intl.formatMessage({id: 'CardDialog.showTitle', defaultMessage: 'Show title'})}
                onClick={() => {
                    setShowTitle(!showTitle)
                }}
            />
            <Menu.Text
                icon={showProperties ? <CloseIcon/> : <CheckIcon/>}
                id='toggleProperties'
                name={showProperties ? intl.formatMessage({id: 'CardDialog.hideProperties', defaultMessage: 'Hide properties'}) : intl.formatMessage({id: 'CardDialog.showProperties', defaultMessage: 'Show properties'})}
                onClick={() => {
                    setShowProperties(!showProperties)
                }}
            />
            <Menu.Text
                icon={showComments ? <CloseIcon/> : <CheckIcon/>}
                id='toggleComments'
                name={showComments ? intl.formatMessage({id: 'CardDialog.hideComments', defaultMessage: 'Hide comments'}) : intl.formatMessage({id: 'CardDialog.showComments', defaultMessage: 'Show comments'})}
                onClick={() => {
                    setShowComments(!showComments)
                }}
            />
        </CardActionsMenu>
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

    const toggleFullscreen = () => {
        setFullscreen(!fullscreen)
    }

    return (
        <>
            <Dialog
                className='cardDialog'
                onClose={props.onClose}
                toolsMenu={!props.readonly && !card?.limited && menu}
                toolbar={!isTemplate && Utils.isFocalboardPlugin() && !card?.limited && toolbar}
                showFullscreen={fullscreen}
                onToggleFullscreen={toggleFullscreen}
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
                        hideTitle={!showTitle}
                        hideProperties={!showProperties}
                        hideComments={!showComments}
                        onClose={props.onClose}
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
