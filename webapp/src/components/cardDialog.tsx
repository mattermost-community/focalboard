// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useCallback} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Board} from '../blocks/board'
import {BoardView} from '../blocks/boardView'
import {Card} from '../blocks/card'
import octoClient from '../octoClient'
import mutator from '../mutator'
import {getCard} from '../store/cards'
import {getCardComments} from '../store/comments'
import {getCardContents} from '../store/contents'
import {useAppSelector} from '../store/hooks'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../telemetry/telemetryClient'
import {Utils} from '../utils'
import CompassIcon from '../widgets/icons/compassIcon'
import Menu from '../widgets/menu'

import ConfirmationDialogBox, {ConfirmationDialogBoxProps} from '../components/confirmationDialogBox'

import Button from '../widgets/buttons/button'

import {getUserBlockSubscriptionList} from '../store/initialLoad'

import {IUser} from '../user'
import {getMe} from '../store/users'
import {Permission} from '../constants'
import {Block} from '../blocks/block'

import BoardPermissionGate from './permissions/boardPermissionGate'

import CardDetail from './cardDetail/cardDetail'
import Dialog from './dialog'

import './cardDialog.scss'
import CardActionsMenu from './cardActionsMenu/cardActionsMenu'
import {contentRegistry} from './content/contentRegistry'

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
            {},
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
        </CardActionsMenu>
    )

    const handler = contentRegistry.getHandler('attachment')
    if (!handler) {
        Utils.logError('addContentMenu, unknown content type: attachment')
        return <></>
    }

    const addElement = async () => {
        if (card) {
            const block = await handler.createBlock(card.boardId, intl)
            block.parentId = card.id
            block.boardId = card.boardId
            const typeName = handler.getDisplayText(intl)
            const description = intl.formatMessage({id: 'ContentBlock.addElement', defaultMessage: 'add {type}'}, {type: typeName})
            await mutator.performAsUndoGroup(async () => {
                const afterRedo = async (newBlock: Block) => {
                    const contentOrder = card.fields.contentOrder.slice()
                    contentOrder.splice(card.fields.contentOrder.length, 0, newBlock.id)
                    await octoClient.patchBlock(card.boardId, card.id, {updatedFields: {contentOrder}})
                }

                const beforeUndo = async () => {
                    const contentOrder = card.fields.contentOrder.slice()
                    await octoClient.patchBlock(card.boardId, card.id, {updatedFields: {contentOrder}})
                }

                await mutator.insertBlock(block.boardId, block, description, afterRedo, beforeUndo)
            })
        }
    }

    const deleteBlock = useCallback(async (block: Block) => {
        if (card) {
            const contentOrder = card.fields.contentOrder.slice()
            contentOrder.splice(card.fields.contentOrder.length, 0, block.id)
            const description = intl.formatMessage({id: 'ContentBlock.DeleteAction', defaultMessage: 'delete'})
            await mutator.performAsUndoGroup(async () => {
                await mutator.deleteBlock(block, description)
                await mutator.changeCardContentOrder(card.boardId, card.id, card.fields.contentOrder, contentOrder, description)
            })
        }
    }, [card?.boardId, card?.id, card?.fields.contentOrder])

    const attachBtn = (): React.ReactNode => {
        return (
            <Button
                icon={<CompassIcon icon='paperclip'/>}
                className='cardFollowBtn attach'
                size='medium'
                onClick={addElement}
            >
                {intl.formatMessage({id: 'CardDetail.Attach', defaultMessage: 'Attach'})}
            </Button>
        )
    }

    const followActionButton = (following: boolean): React.ReactNode => {
        const followBtn = (
            <>
                {attachBtn()}
                <Button
                    className='cardFollowBtn follow'
                    size='medium'
                    onClick={() => mutator.followBlock(props.cardId, 'card', me!.id)}
                >
                    {intl.formatMessage({id: 'CardDetail.Follow', defaultMessage: 'Follow'})}
                </Button>
            </>
        )

        const unfollowBtn = (
            <>
                {attachBtn()}
                <Button
                    className='cardFollowBtn unfollow'
                    size='medium'
                    onClick={() => mutator.unfollowBlock(props.cardId, 'card', me!.id)}
                >
                    {intl.formatMessage({id: 'CardDetail.Following', defaultMessage: 'Following'})}
                </Button>
            </>
        )

        return following ? unfollowBtn : followBtn
    }

    const followingCards = useAppSelector(getUserBlockSubscriptionList)
    const isFollowingCard = Boolean(followingCards.find((following) => following.blockId === props.cardId))
    const toolbar = followActionButton(isFollowingCard)

    return (
        <>
            <Dialog
                title={<div/>}
                className='cardDialog'
                onClose={props.onClose}
                toolsMenu={!props.readonly && !card?.limited && menu}
                toolbar={!isTemplate && Utils.isFocalboardPlugin() && !card?.limited && toolbar}
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
                        onClose={props.onClose}
                        onDelete={deleteBlock}
                        addAttachment={addElement}
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
